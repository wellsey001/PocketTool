#!/usr/bin/env node
// Writes PocketTool's version and GitHub repository into app/index.html, so "Check for updates" knows
// what it is and where to look.
//  - Version: from the release tag when GitHub builds a release (v1.4.0 -> 1.4.0), otherwise package.json.
//    A release tag also updates package.json, so the program files are named to match.
//  - Repository: GitHub supplies it during automatic builds; for builds on your computer it comes from
//    the "repository" field in package.json, such as "your-name/pockettool".
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkgFile = path.join(ROOT, "package.json"), htmlFile = path.join(ROOT, "app", "index.html");
const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));

let version = pkg.version;
const tag = process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME || "" : "";
if (/^v?\d+\.\d+\.\d+/.test(tag)) {
  version = tag.replace(/^v/, "");
  if (version !== pkg.version) {
    const before = pkg.version;
    pkg.version = version;
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");
    console.log("Version " + version + " taken from the release tag (package.json said " + before + ").");
  }
}
function repoFromPackage() {
  const r = pkg.repository;
  const s = typeof r === "string" ? r : r && r.url ? r.url : "";
  const m = s.match(/github\.com[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?$/) || s.match(/^(?:github:)?([\w.-]+\/[\w.-]+)$/);
  return m && !/YOUR-USERNAME/i.test(m[1]) ? m[1] : "";
}
const repo = process.env.GITHUB_REPOSITORY || repoFromPackage();

let html = fs.readFileSync(htmlFile, "utf8");
function setMeta(name, value) {
  const tagText = '<meta name="' + name + '" content="' + value.replace(/"/g, "&quot;") + '">';
  const re = new RegExp('<meta name="' + name + '" content="[^"]*">');
  html = re.test(html) ? html.replace(re, tagText) : html.replace(/<meta charset="utf-8">/i, (m) => m + "\n" + tagText);
}
setMeta("pockettool-version", version);
setMeta("pockettool-repo", repo);
fs.writeFileSync(htmlFile, html);
console.log("PocketTool " + version + (repo ? ", checking for updates at github.com/" + repo : ", with update checks switched off (no repository set)") + ".");
