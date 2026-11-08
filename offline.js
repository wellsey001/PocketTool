// Maps the web addresses PocketTool asks for (libraries, AI models, fonts) to
// files bundled with the app, so everything works without the internet.
//
// The bundled files live in the "offline" folder, laid out like this:
//   offline/cdn/<package>@<version>/<file>  for cdn.jsdelivr.net/npm/... and unpkg.com/...
//                                          (only the exact version asked for is used)
//   offline/hf/<owner>/<model>/<file>     for huggingface.co/<owner>/<model>/resolve/<rev>/<file>
//   offline/fonts/<hash>.css              for fonts.googleapis.com/css2?...
//   offline/fonts/gstatic/<path>          for fonts.gstatic.com/<path>
//   offline/govuk/bank-holidays.json      a snapshot, used only when offline
// Run "npm run fetch" to fill it.

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

function urlKey(href) { return crypto.createHash("sha256").update(href).digest("hex"); }

function inside(root, file) {
  const full = path.normalize(path.join(root, file));
  return full === root || full.startsWith(root + path.sep) ? full : null;
}
function isFile(f) { try { return fs.statSync(f).isFile(); } catch { return false; } }

// "pdf-lib@1.17.1/dist/pdf-lib.min.js" or "@scope/name@1.0.0/x.js" or "@scope/name@1.0.0"
function parseNpm(rest) {
  const m = rest.match(/^((?:@[^/@]+\/)?[^/@]+)(?:@([^/]*))?(?:\/(.*))?$/);
  return m ? { pkg: m[1], version: m[2] || "", file: m[3] || "" } : null;
}

function npmFile(root, rest) {
  const p = parseNpm(rest);
  if (!p || !p.version) return null;          // only exact, versioned addresses are served from the bundle
  const dir = inside(path.join(root, "cdn"), p.pkg + "@" + p.version);
  if (!dir || !fs.existsSync(dir)) return null;
  let file = p.file;
  if (!file || file.endsWith("/")) {
    // A bare package address: use the default file jsDelivr reported when the bundle was made
    try { file = JSON.parse(fs.readFileSync(path.join(dir, ".pockettool.json"), "utf8")).default || ""; } catch { return null; }
    if (!file) return null;
  }
  const full = inside(dir, file.replace(/^\.?\//, ""));
  return full && isFile(full) ? full : null;
}

function resolve(root, href) {
  let u; try { u = new URL(href); } catch { return null; }
  const p = decodeURIComponent(u.pathname);
  if (u.hostname === "cdn.jsdelivr.net" && p.startsWith("/npm/")) return npmFile(root, p.slice(5));
  if (u.hostname === "unpkg.com") return npmFile(root, p.slice(1));
  if (u.hostname === "huggingface.co") {
    const m = p.match(/^\/([^/]+\/[^/]+)\/resolve\/[^/]+\/(.+)$/);
    const f = m && inside(path.join(root, "hf"), path.join(m[1], m[2]));
    return f && isFile(f) ? f : null;
  }
  if (u.hostname === "fonts.googleapis.com") { const f = path.join(root, "fonts", urlKey(u.href) + ".css"); return isFile(f) ? f : null; }
  if (u.hostname === "fonts.gstatic.com") { const f = inside(path.join(root, "fonts", "gstatic"), p); return f && isFile(f) ? f : null; }
  return null;
}

const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".json": "application/json",
  ".css": "text/css; charset=utf-8", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".onnx": "application/octet-stream",
  ".bin": "application/octet-stream", ".txt": "text/plain; charset=utf-8", ".map": "application/json" };
function typeOf(file) { return TYPES[path.extname(file).toLowerCase()] || "application/octet-stream"; }

module.exports = { resolve, urlKey, typeOf, parseNpm };
