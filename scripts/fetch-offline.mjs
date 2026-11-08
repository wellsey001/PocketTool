#!/usr/bin/env node
// Fills the "offline" folder so PocketTool works without the internet.
//
//   npm run fetch                everything (about 300 MB with the AI models)
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
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f)); else out.push(f);
  }
  return out;
}

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

// 1. Libraries, copied from node_modules (installed by "npm install")
log("\nLibraries");
for (const entry of manifest.npm) {
  const src = path.join(ROOT, "node_modules", entry.package);
  if (!fs.existsSync(src)) {
    if (entry.optional) { log("  (not installed, skipped) " + entry.package); continue; }
    log("  MISSING " + entry.package + ". Run \"npm install\" first."); problems++; continue;
  }
  const dest = path.join(OUT, "npm", entry.package);
  fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(dest, { recursive: true });
  fs.copyFileSync(path.join(src, "package.json"), path.join(dest, "package.json"));
  const skip = (entry.skip || []).map((r) => new RegExp(r)), only = (entry.only || []).map((r) => new RegExp(r));
  let n = 0, bytes = 0;
  for (const f of entry.files) {
    const from = path.join(src, f);
    if (!fs.existsSync(from)) { log("  (not in this version) " + entry.package + "/" + f); continue; }
    const list = fs.statSync(from).isDirectory() ? walk(from) : [from];
    for (const file of list) {
      const base = path.basename(file);
      if (skip.some((r) => r.test(base))) continue;
      if (only.length && !only.some((r) => r.test(base))) continue;
      const to = path.join(dest, path.relative(src, file));
      fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(file, to);
      n++; bytes += fs.statSync(file).size;
    }
  }
  total += bytes;
  log("  " + entry.package + "@" + JSON.parse(fs.readFileSync(path.join(src, "package.json"), "utf8")).version + ": " + n + " files, " + mb(bytes));
}

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

// 3. AI models
log("\nAI models");
if (NO_MODELS) log("  skipped (--no-models). They will download the first time each AI tool is used.");
else for (const m of manifest.models) {
  log("  " + m.repo + ": " + m.about);
  for (const f of m.files) await download("https://huggingface.co/" + m.repo + "/resolve/main/" + f, path.join(OUT, "hf", m.repo, f));
  for (const f of m.optional || []) await download("https://huggingface.co/" + m.repo + "/resolve/main/" + f, path.join(OUT, "hf", m.repo, f), { optional: true });
}

// 4. Snapshots used when offline
log("\nOffline snapshots");
for (const s of manifest.snapshots) await download(s.url, path.join(OUT, s.to), { optional: true });

fs.writeFileSync(path.join(OUT, "README.txt"), "Files bundled with PocketTool so it works offline.\nCreated by scripts/fetch-offline.mjs on " + new Date().toISOString() + ". Safe to delete; run \"npm run fetch\" to recreate.\n");
log("\nDone: " + mb(total) + " in the offline folder." + (problems ? " " + problems + " problem(s) above need fixing before you build." : ""));
process.exit(problems ? 1 : 0);
