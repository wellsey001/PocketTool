#!/usr/bin/env node
// Fills the "offline" folder so PocketTool works without the internet.
//
//   npm run fetch                everything (about 1.2 GB with the AI models)
//   Needs an internet connection. Nothing here needs "npm install" first.
//   npm run fetch -- --no-models libraries and fonts only; AI models download on first use
//   npm run fetch -- --force     download again even if files are already there

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "offline");
const args = new Set(process.argv.slice(2));
const NO_MODELS = args.has("--no-models"), FORCE = args.has("--force");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "offline-manifest.json"), "utf8"));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const urlKey = (href) => crypto.createHash("sha256").update(href).digest("hex");
const mb = (n) => (n / 1048576).toFixed(1) + " MB";
let problems = 0, total = 0;

function log(s) { process.stdout.write(s + "\n"); }

async function download(url, dest, { optional = false, headers = {} } = {}) {
  if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) { total += fs.statSync(dest).size; log("  already have " + path.relative(OUT, dest)); return true; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, ...headers }, redirect: "follow" });
      if (res.status === 404 && optional) { log("  (not available, skipped) " + url); return false; }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const size = +res.headers.get("content-length") || 0;
      log("  downloading " + path.relative(OUT, dest) + (size ? " (" + mb(size) + ")" : ""));
      const tmp = dest + ".part";
      await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
      fs.renameSync(tmp, dest);
      total += fs.statSync(dest).size;
      return true;
    } catch (e) {
      if (attempt === 3) { if (optional) { log("  (skipped) " + url + ": " + e.message); return false; } log("  FAILED " + url + ": " + e.message); problems++; return false; }
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

// 1. Libraries: the exact files the app loads, mirrored from jsDelivr at the exact versions it asks for
async function getJSON(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { const r = await fetch(url, { headers: { "user-agent": UA } }); if (r.status === 404) return null; if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
    catch (e) { if (attempt === 3) throw e; await new Promise((res) => setTimeout(res, 1500 * attempt)); }
  }
}
async function listFiles(pkg, version) {
  const a = await getJSON("https://data.jsdelivr.com/v1/packages/npm/" + pkg + "@" + version + "?structure=flat");
  if (a && a.files) return a;
  return await getJSON("https://data.jsdelivr.com/v1/package/npm/" + pkg + "@" + version + "/flat");
}
async function versionFrom(spec, dep) {
  const [, parent, ver] = spec.match(/^(.+)@([^@]+)$/);
  const pj = await getJSON("https://cdn.jsdelivr.net/npm/" + parent + "@" + ver + "/package.json");
  const range = pj && ((pj.dependencies || {})[dep] || (pj.peerDependencies || {})[dep]);
  if (!range) return null;
  if (/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(range)) return range;
  const r = await getJSON("https://data.jsdelivr.com/v1/packages/npm/" + dep + "/resolved?specifier=" + encodeURIComponent(range));
  return r && r.version;
}
log("\nLibraries");
const groups = {};
for (const entry of manifest.cdn) {
  const pkg = entry.package;
  let version = entry.version;
  try {
    if (!version && entry.versionFrom) version = await versionFrom(entry.versionFrom, pkg);
    if (!version) { log("  (no version found, skipped) " + pkg); if (!entry.optional) problems++; continue; }
    const listing = await listFiles(pkg, version);
    if (!listing) { log("  (not published, skipped) " + pkg + "@" + version); if (!entry.optional) problems++; continue; }
    const inc = (entry.include || []).map((r) => new RegExp(r)), exc = (entry.exclude || []).map((r) => new RegExp(r));
    const files = listing.files.map((f) => f.name).filter((n) => inc.some((r) => r.test(n)) && !exc.some((r) => r.test(n)));
    const dir = path.join(OUT, "cdn", pkg + "@" + version);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, ".pockettool.json"), JSON.stringify({ package: pkg, version, default: listing.default || null }));
    let got = 0;
    for (const name of files) if (await download("https://cdn.jsdelivr.net/npm/" + pkg + "@" + version + name, path.join(dir, name))) got++;
    log("  " + pkg + "@" + version + ": " + got + " of " + files.length + " files");
    if (entry.group && got) groups[entry.group] = true;
    if (!files.length && !entry.optional) { log("  MISSING files for " + pkg + "@" + version); problems++; }
  } catch (e) { log("  FAILED " + pkg + "@" + version + ": " + e.message); if (!entry.optional) problems++; }
}
for (const g of new Set(manifest.cdn.map((e) => e.group).filter(Boolean))) if (!groups[g]) { log("  MISSING: no version of " + g + " could be downloaded"); problems++; }

// 2. Fonts used by the page
log("\nFonts");
const html = fs.readFileSync(path.join(ROOT, manifest.fontsFrom), "utf8");
const cssLinks = [...new Set([...html.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s>]+/g)].map((m) => new URL(m[0].replace(/&amp;/g, "&")).href))];
for (const href of cssLinks) {
  const cssFile = path.join(OUT, "fonts", urlKey(href) + ".css");
  if (await download(href, cssFile)) {
    const css = fs.readFileSync(cssFile, "utf8");
    const fonts = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
    for (const f of fonts) await download(f, path.join(OUT, "fonts", "gstatic", new URL(f).pathname));
    log("  " + fonts.length + " font files");
  }
}

function walkSize(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); n += e.isDirectory() ? walkSize(f) : fs.statSync(f).size; }
  return n;
}

// 3. AI models
log("\nAI models");
if (NO_MODELS) {
  // Remove any models left from an earlier build (for example restored from GitHub's build cache),
  // so they can never end up inside the installer by accident.
  const hf = path.join(OUT, "hf");
  if (fs.existsSync(hf)) {
    const leftover = walkSize(hf);
    fs.rmSync(hf, { recursive: true, force: true });
    log("  removed " + mb(leftover) + " of AI models left from an earlier build");
  }
  fs.rmSync(path.join(OUT, "FULL-BUILD"), { force: true });
  log("  not bundled (--no-models). The desktop app offers to download them on first open.");
} else {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "FULL-BUILD"), "AI models bundled on purpose (npm run fetch:full)\n");
  for (const m of manifest.models) {
    log("  " + m.repo + ": " + m.about);
    const rev = m.revision || "main";      // pinned versions download exactly the files the app was tested with
    for (const f of m.files) await download("https://huggingface.co/" + m.repo + "/resolve/" + rev + "/" + f, path.join(OUT, "hf", m.repo, f));
    for (const f of m.optional || []) await download("https://huggingface.co/" + m.repo + "/resolve/" + rev + "/" + f, path.join(OUT, "hf", m.repo, f), { optional: true });
  }
}

// 4. Snapshots used when offline
log("\nOffline snapshots");
for (const s of manifest.snapshots) await download(s.url, path.join(OUT, s.to), { optional: true });

fs.writeFileSync(path.join(OUT, "README.txt"), "Files bundled with PocketTool so it works offline.\nCreated by scripts/fetch-offline.mjs on " + new Date().toISOString() + ". Safe to delete; run \"npm run fetch\" to recreate.\n");
log("\nDone: " + mb(walkSize(OUT)) + " in the offline folder, all of which goes into the installer." + (problems ? " " + problems + " problem(s) above need fixing before you build." : ""));
process.exit(problems ? 1 : 0);
