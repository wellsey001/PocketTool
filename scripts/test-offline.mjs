#!/usr/bin/env node
// Checks that every library, font and AI model PocketTool asks for is in the offline folder.
// Run after "npm run fetch". Exits with an error if something the app needs is missing.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "offline");
const offline = createRequire(import.meta.url)("../offline.js");
const J = "https://cdn.jsdelivr.net/npm/";
let fails = 0, warns = 0;
const ok = (m) => console.log("  ok    " + m);
const bad = (m) => { console.log("  MISSING " + m); fails++; };
const warn = (m) => { console.log("  note  " + m); warns++; };
const has = (url) => offline.resolve(OUT, url);

if (!fs.existsSync(OUT)) { console.log('No offline folder yet. Run "npm run fetch" first.'); process.exit(1); }

console.log("Libraries");
const required = {
  "PDF reader": J + "pdfjs-dist@3.11.174/build/pdf.min.js",
  "PDF reader worker": J + "pdfjs-dist@3.11.174/build/pdf.worker.min.js",
  "PDF editing": J + "pdf-lib@1.17.1/dist/pdf-lib.min.js",
  "ZIP files": J + "jszip@3.10.1/dist/jszip.min.js",
  "HEIC photos": J + "heic2any@0.0.4/dist/heic2any.min.js",
  "AI upscaler engine": J + "@tensorflow/tfjs@4.22.0/dist/tf.min.js",
  "AI upscaler": J + "upscaler@1.0.0-beta.19/dist/browser/umd/upscaler.min.js",
  "Background remover engine": J + "@huggingface/transformers@3.5.1",
  "Video engine": J + "@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js",
  "Video engine worker": J + "@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js",
  "Video engine core": J + "@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
  "Video engine core (WebAssembly)": J + "@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm"
};
for (const [name, url] of Object.entries(required)) { const f = has(url); f ? ok(name + "  (" + path.relative(OUT, f) + ")") : bad(name + "  " + url); }

// The upscaler tries several known locations for its model; at least one must be bundled
const esr = ["1.0.0", "1.0.0-beta.12"].flatMap((v) => ["dist/umd/index.min.js", "dist/umd/models/esrgan-slim/src/umd.min.js", "dist/umd/2x.min.js"]
  .map((p) => J + "@upscalerjs/esrgan-slim@" + v + "/" + p)).filter(has);
esr.length ? ok("AI upscaler model code: " + esr.map((u) => u.replace(J, "")).join(", ")) : bad("AI upscaler model code (@upscalerjs/esrgan-slim dist/umd)");
const cdn = path.join(OUT, "cdn");
const list = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { recursive: true }).map(String) : []);
const esrDirs = list(path.join(cdn, "@upscalerjs")).filter((d) => /^esrgan-slim@[^/\\]+$/.test(d));
const weights = esrDirs.some((d) => list(path.join(cdn, "@upscalerjs", d)).some((f) => /model\.json$/.test(f)));
weights ? ok("AI upscaler model weights") : bad("AI upscaler model weights (@upscalerjs/esrgan-slim models/)");

const wasmDirs = list(cdn).filter((d) => /^(@huggingface[\\/]transformers|onnxruntime-web)@[^/\\]+$/.test(d));
const wasm = wasmDirs.flatMap((d) => list(path.join(cdn, d)).filter((f) => f.endsWith(".wasm")).map((f) => path.basename(f)));
wasm.length ? ok("AI engine files: " + [...new Set(wasm)].join(", ")) : bad("AI engine .wasm files (from @huggingface/transformers or onnxruntime-web)");

console.log("Fonts");
const html = fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8");
const css = [...html.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s>]+/g)].map((m) => new URL(m[0].replace(/&amp;/g, "&")).href);
for (const href of css) has(href) ? ok("font styles") : warn("fonts not bundled; PocketTool will use system fonts when offline");

console.log("AI models");
const models = { "Remove background, Best quality (graphics card)": "https://huggingface.co/wonfy/BiRefNet-ONNX-webgpu/resolve/041c6b25157431ac09634955246726ea2614fd0f/onnx/model_fp16.onnx",
  "Remove background, Standard (graphics card)": "https://huggingface.co/wonfy/BiRefNet_lite-ONNX-webgpu/resolve/c40eaa22fb1af9edcf75c7b79d25ed8a8e901140/onnx/model_fp16.onnx",
  "Remove background, Standard (processor)": "https://huggingface.co/wonfy/BiRefNet_lite-ONNX-webgpu/resolve/c40eaa22fb1af9edcf75c7b79d25ed8a8e901140/onnx/model.onnx",
  "Remove background, People quick": "https://huggingface.co/Xenova/modnet/resolve/main/onnx/model.onnx" };
if (!fs.existsSync(path.join(OUT, "hf"))) warn("AI models not bundled (lite build). They will download the first time they're used.");
else for (const [name, url] of Object.entries(models)) {
  const f = has(url);
  if (!f) { bad(name); continue; }
  const size = fs.statSync(f).size;
  size > 1e6 ? ok(name + "  (" + (size / 1048576).toFixed(0) + " MB)") : bad(name + " looks incomplete (" + size + " bytes)");
}

console.log(fails ? "\n" + fails + " problem(s). Run \"npm run fetch\" again, and check its messages." : "\nEverything PocketTool needs is bundled." + (warns ? " (" + warns + " note(s) above)" : ""));
process.exit(fails ? 1 : 0);
