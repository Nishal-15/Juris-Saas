// Preload script — safely expose APIs to renderer if needed
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  // Example: notify main process of an action
  // sendNotification: (msg) => ipcRenderer.send("notify", msg),
});
