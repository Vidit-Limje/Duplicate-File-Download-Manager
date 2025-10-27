// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dm", {
  // ✅ Trigger a download
  download: (url) => {
    try {
      ipcRenderer.send("download", url);
    } catch (err) {
      console.error("❌ Error sending download:", err);
    }
  },

  // ✅ Receive Download Progress
  onProgress: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("download-progress", listener);
    return () => ipcRenderer.removeListener("download-progress", listener);
  },

  // ✅ Download Completed
  onDone: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("download-done", listener);
    return () => ipcRenderer.removeListener("download-done", listener);
  },

  // ✅ Error Handler
  onError: (callback) => {
    const listener = (_, error) => callback(error);
    ipcRenderer.on("download-error", listener);
    return () => ipcRenderer.removeListener("download-error", listener);
  },
});
