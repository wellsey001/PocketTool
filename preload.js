// Lets the PocketTool page ask the desktop app to open another app's window,
// optionally handing it files and a tool to start in. Nothing else is exposed.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pocketDesktop", {
  openApp: (id, files, tool) => ipcRenderer.invoke("open-app", String(id), Array.isArray(files) ? files : [], tool ? String(tool) : null),
  onFiles: (callback) => { ipcRenderer.on("files", (_event, message) => callback(message)); }
});
