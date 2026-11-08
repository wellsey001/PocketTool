// PocketTool desktop app (Electron).
// Shows app/index.html in its own window. Libraries, AI models and fonts come from
// the bundled "offline" folder (see offline.js); anything not bundled is downloaded
// once and kept in a local cache, so it also works offline afterwards.

const { app, BrowserWindow, protocol, net, shell, Menu, dialog, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { pathToFileURL } = require("url");
const { Readable } = require("stream");
const offline = require("./offline");

// Let the AI tools use the graphics card on more computers.
app.commandLine.appendSwitch("enable-unsafe-webgpu");

// "app://" gives the page a proper, secure address, so browser features work fully.
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true } }
]);

const OFFLINE_DIR = app.isPackaged ? path.join(process.resourcesPath, "offline") : path.join(__dirname, "offline");
const CACHE_HOSTS = ["cdn.jsdelivr.net", "unpkg.com", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com", "huggingface.co"];
let cacheDir = "";

function isCacheHost(host) { return CACHE_HOSTS.includes(host) || host.endsWith(".huggingface.co") || host.endsWith(".hf.co"); }

function serveFile(file, type) {
  const size = fs.statSync(file).size;
  return new Response(Readable.toWeb(fs.createReadStream(file)), {
    status: 200,
    headers: { "content-type": type || offline.typeOf(file), "content-length": String(size), "access-control-allow-origin": "*", "cache-control": "max-age=31536000" }
  });
}

async function saveStream(stream, bodyPath, meta) {
  const tmp = bodyPath + "." + process.pid + ".tmp";
  const out = fs.createWriteStream(tmp);
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!out.write(Buffer.from(value))) await new Promise((r) => out.once("drain", r));
    }
    await new Promise((res, rej) => out.end((e) => (e ? rej(e) : res())));
    await fs.promises.rename(tmp, bodyPath);
    await fs.promises.writeFile(bodyPath + ".json", JSON.stringify(meta));
  } catch (e) {
    out.destroy();
    fs.promises.unlink(tmp).catch(() => {});
    console.warn("Not cached:", meta.url, e.message);
  }
}

async function handleHttps(request) {
  const u = new URL(request.url);
  if (request.method !== "GET") return net.fetch(request, { bypassCustomProtocolHandlers: true });

  // Bank holidays: use the live GOV.UK list when online, the bundled copy when not.
  if (u.hostname === "www.gov.uk" && u.pathname === "/bank-holidays.json") {
    try { const r = await net.fetch(request, { bypassCustomProtocolHandlers: true }); if (r.ok) return r; } catch {}
    const snap = path.join(OFFLINE_DIR, "govuk", "bank-holidays.json");
    if (fs.existsSync(snap)) return serveFile(snap, "application/json");
    return new Response("offline", { status: 503 });
  }

  // 1. Bundled with the app
  const local = offline.resolve(OFFLINE_DIR, request.url);
  if (local) return serveFile(local);

  if (!isCacheHost(u.hostname)) return net.fetch(request, { bypassCustomProtocolHandlers: true });

  // 2. Downloaded before and kept in the cache
  const bodyPath = path.join(cacheDir, offline.urlKey(request.url));
  if (fs.existsSync(bodyPath) && fs.existsSync(bodyPath + ".json")) {
    const meta = JSON.parse(fs.readFileSync(bodyPath + ".json", "utf8"));
    return serveFile(bodyPath, meta.type || "application/octet-stream");
  }

  // 3. Download now, and keep a copy
  const res = await net.fetch(request, { bypassCustomProtocolHandlers: true });
  if (res.status !== 200 || !res.body) return res;
  const headers = new Headers(res.headers);
  headers.set("access-control-allow-origin", "*");
  if (headers.has("content-encoding")) { headers.delete("content-encoding"); headers.delete("content-length"); }
  const [toPage, toDisk] = res.body.tee();
  saveStream(toDisk, bodyPath, { url: request.url, type: res.headers.get("content-type") });
  return new Response(toPage, { status: 200, headers });
}

function folderSize(dir) {
  try { return fs.readdirSync(dir).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0); } catch { return 0; }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 920, minWidth: 720, minHeight: 560,
    title: "PocketTool",
    icon: path.join(__dirname, "app", "icon.png"),
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0F1424" : "#F3F4F8",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  win.loadURL("app://pockettool/index.html");
  // Links open in the normal web browser, not inside PocketTool.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("app://")) { e.preventDefault(); shell.openExternal(url); } });
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "File", submenu: [{ role: "quit", label: "Quit PocketTool" }] },
    { role: "editMenu" },
    { label: "View", submenu: [{ role: "reload" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
      { type: "separator" }, { role: "togglefullscreen" }, { role: "toggleDevTools" }] },
    { label: "Help", submenu: [
      { label: "Clear downloaded files…", click: async () => {
        const mb = (folderSize(cacheDir) / 1048576).toFixed(0);
        const r = await dialog.showMessageBox({ type: "question", buttons: ["Clear", "Cancel"], defaultId: 1, cancelId: 1,
          message: "Clear files PocketTool downloaded?",
          detail: "This frees about " + mb + " MB. The AI models and libraries bundled with PocketTool are not affected." });
        if (r.response === 0) { fs.rmSync(cacheDir, { recursive: true, force: true }); fs.mkdirSync(cacheDir, { recursive: true }); }
      } },
      { label: "About PocketTool", click: () => dialog.showMessageBox({ message: "PocketTool " + app.getVersion(),
        detail: "Everyday file tools that run on your computer.\n" + (fs.existsSync(path.join(OFFLINE_DIR, "hf")) ? "AI models are included, so everything works offline." : "AI models download the first time you use them.") }) }
    ] }
  ]));
}

if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });

app.whenReady().then(() => {
  cacheDir = path.join(app.getPath("userData"), "download-cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const appRoot = path.join(__dirname, "app");
  protocol.handle("app", (request) => {
    let p = decodeURIComponent(new URL(request.url).pathname);
    if (p === "/" || p === "") p = "/index.html";
    const file = path.normalize(path.join(appRoot, p));
    if (!file.startsWith(appRoot)) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  protocol.handle("https", handleHttps);
  buildMenu();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
