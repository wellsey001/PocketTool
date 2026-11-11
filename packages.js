// Extra packages: the AI models for the background remover, downloaded only if the user agrees.
// Files are stored like the bundled offline folder (packages/hf/<owner>/<model>/<file>), so offline.js
// can serve them. Downloads resume after interruptions, and each file is checked against the SHA-256
// fingerprint Hugging Face publishes for it.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Readable } = require("stream");

const PACKAGES = [
  { id: "bg-standard", name: "Background remover, Standard", needs: "gpu",
    repo: "wonfy/BiRefNet_lite-ONNX-webgpu", rev: "c40eaa22fb1af9edcf75c7b79d25ed8a8e901140", files: ["onnx/model_fp16.onnx"] },
  { id: "bg-best", name: "Background remover, Best quality", needs: "gpu",
    repo: "wonfy/BiRefNet-ONNX-webgpu", rev: "041c6b25157431ac09634955246726ea2614fd0f", files: ["onnx/model_fp16.onnx"] },
  { id: "bg-standard-cpu", name: "Background remover, Standard", needs: "cpu",
    repo: "wonfy/BiRefNet_lite-ONNX-webgpu", rev: "c40eaa22fb1af9edcf75c7b79d25ed8a8e901140", files: ["onnx/model.onnx"] },
  { id: "bg-people", name: "Background remover, People quick", needs: "any",
    repo: "Xenova/modnet", rev: "main", files: ["onnx/model.onnx", "config.json", "preprocessor_config.json"] }
];

function createManager(opts) {
  const root = opts.root, fetchImpl = opts.fetch || globalThis.fetch, host = opts.host || "https://huggingface.co";
  const byId = Object.fromEntries(PACKAGES.map((p) => [p.id, p]));
  const target = (p, f) => path.join(root, "hf", p.repo, f);
  const url = (p, f) => host + "/" + p.repo + "/resolve/" + p.rev + "/" + f;
  const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };
  const installed = (p) => p.files.every((f) => isFile(target(p, f)));
  let job = null;

  function status() {
    return PACKAGES.map((p) => ({ id: p.id, name: p.name, needs: p.needs, installed: installed(p),
      bytes: p.files.reduce((n, f) => n + (isFile(target(p, f)) ? fs.statSync(target(p, f)).size : 0), 0) }));
  }
  // Ask Hugging Face for each file's size and fingerprint, without downloading it
  async function info(p, f) {
    const r = await fetchImpl(url(p, f), { method: "HEAD", redirect: "manual" });
    if (r.status >= 400) throw new Error("Hugging Face said " + r.status + " for " + f);
    const sha = String(r.headers.get("x-linked-etag") || "").replace(/"/g, "");
    const size = +(r.headers.get("x-linked-size") || r.headers.get("content-length") || 0);
    return { size, sha256: /^[0-9a-f]{64}$/.test(sha) ? sha : null };
  }
  async function plan(ids) {
    const list = [];
    for (const id of ids) {
      const p = byId[id]; if (!p) throw new Error("Unknown package " + id);
      for (const f of p.files) if (!isFile(target(p, f))) list.push(Object.assign({ p, f }, await info(p, f)));
    }
    return list;
  }
  async function sizes(ids) { const l = await plan(ids); return l.reduce((n, x) => n + x.size, 0); }
  function sha256Of(file) {
    return new Promise((res, rej) => { const h = crypto.createHash("sha256"); fs.createReadStream(file).on("data", (d) => h.update(d)).on("end", () => res(h.digest("hex"))).on("error", rej); });
  }
  async function download(ids, onProgress) {
    if (job) throw new Error("A download is already running");
    const ctrl = new AbortController(); job = ctrl;
    const report = (o) => { try { onProgress && onProgress(o); } catch {} };
    try {
      const list = await plan(ids);
      const total = list.reduce((n, x) => n + x.size, 0);
      let done = 0, last = 0;
      for (const item of list) {
        const dest = target(item.p, item.f), part = dest + ".part";
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        let have = isFile(part) ? fs.statSync(part).size : 0;
        if (item.size && have > item.size) { fs.rmSync(part); have = 0; }
        const headers = have ? { Range: "bytes=" + have + "-" } : {};
        const r = await fetchImpl(url(item.p, item.f), { headers, signal: ctrl.signal, redirect: "follow" });
        if (r.status === 200 && have) { have = 0; }                   // the server ignored the resume request: start again
        else if (r.status !== 200 && r.status !== 206) throw new Error("Download failed for " + item.f + " (error " + r.status + ")");
        const out = fs.createWriteStream(part, { flags: have ? "a" : "w" });
        let got = have;
        const reader = r.body.getReader ? r.body.getReader() : Readable.toWeb(r.body).getReader();
        try {
          for (;;) {
            const { done: end, value } = await reader.read();
            if (end) break;
            if (!out.write(Buffer.from(value))) await new Promise((res) => out.once("drain", res));
            got += value.length;
            const now = Date.now();
            if (now - last > 200) { last = now; report({ state: "downloading", package: item.p.id, name: item.p.name, file: item.f, got: done + got, total }); }
          }
        } finally { await new Promise((res) => out.end(res)); }
        if (item.size && got !== item.size) throw new Error("The download of " + item.f + " was incomplete. Try again to carry on.");
        report({ state: "checking", package: item.p.id, name: item.p.name, file: item.f, got: done + got, total });
        if (item.sha256) {
          const actual = await sha256Of(part);
          if (actual !== item.sha256) { fs.rmSync(part, { force: true }); throw new Error("The file " + item.f + " didn’t match its published fingerprint, so it was deleted. Try again."); }
        }
        fs.renameSync(part, dest);
        done += got;
      }
      report({ state: "done", got: total, total });
      return { ok: true, total };
    } catch (e) {
      const cancelled = ctrl.signal.aborted;
      report({ state: cancelled ? "cancelled" : "error", message: cancelled ? "Stopped. Downloading again carries on from where it stopped." : e.message });
      return { ok: false, cancelled, message: e.message };
    } finally { job = null; }
  }
  function cancel() { if (job) job.abort(); }
  function remove(ids) {
    for (const id of ids) { const p = byId[id]; if (!p) continue; for (const f of p.files) { fs.rmSync(target(p, f), { force: true }); fs.rmSync(target(p, f) + ".part", { force: true }); } }
    return status();
  }
  return { status, sizes, download, cancel, remove, busy: () => !!job, packages: PACKAGES };
}

module.exports = { createManager, PACKAGES };
