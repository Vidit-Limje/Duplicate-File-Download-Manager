const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dm", {
  // Trigger a download
  download: (url) => ipcRenderer.send("download", url),

  // Progress listener
  onProgress: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("download-progress", listener);
    return () => ipcRenderer.removeListener("download-progress", listener);
  },

  // Done listener
  onDone: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("download-done", listener);
    return () => ipcRenderer.removeListener("download-done", listener);
  },

  // Error listener
  onError: (callback) => {
    const listener = (_, error) => callback(error);
    ipcRenderer.on("download-error", listener);
    return () => ipcRenderer.removeListener("download-error", listener);
  },
});
