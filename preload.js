// Lets the PocketTool page ask the desktop app to open another app's window,
// optionally handing it files and a tool to start in. Nothing else is exposed.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pocketDesktop", {
  openApp: (id, files, tool) => ipcRenderer.invoke("open-app", String(id), Array.isArray(files) ? files : [], tool ? String(tool) : null),
  onFiles: (callback) => { ipcRenderer.on("files", (_event, message) => callback(message)); },
  // extra packages: only these named actions, never arbitrary downloads
  packages: {
    status: () => ipcRenderer.invoke("packages:status"),
    sizes: (ids) => ipcRenderer.invoke("packages:sizes", Array.isArray(ids) ? ids.map(String) : []),
    download: (ids) => ipcRenderer.invoke("packages:download", Array.isArray(ids) ? ids.map(String) : []),
    cancel: () => ipcRenderer.invoke("packages:cancel"),
    remove: (ids) => ipcRenderer.invoke("packages:remove", Array.isArray(ids) ? ids.map(String) : []),
    onProgress: (callback) => { ipcRenderer.on("packages:progress", (_event, progress) => callback(progress)); }
  }
});
