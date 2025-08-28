import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";

let mainWindow;
console.log("🚀 main.js is running!");

app.on("ready", () => {
  console.log("🚀 App is ready");

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(process.cwd(), "electron", "preload.js"),
    },
  });

  mainWindow.loadURL("http://localhost:5173"); // or wherever your React dev server is
});

// Listen for download request from renderer
ipcMain.on("download", (event, url) => {
  console.log("📥 Received download request for:", url);

  if (!url) {
    console.log("⚠️ No URL provided");
    return;
  }

  // Trigger download via hidden BrowserWindow
  mainWindow.webContents.downloadURL(url);
});

// Download event
app.on("ready", () => {
  session.defaultSession.on("will-download", (event, item) => {
    console.log("⬇️ Starting download:", item.getFilename());

    const savePath = path.join(app.getPath("downloads"), item.getFilename());
    item.setSavePath(savePath);

    item.on("updated", () => {
      console.log(
        "📊 Progress:",
        item.getReceivedBytes(),
        "/",
        item.getTotalBytes()
      );
      mainWindow.webContents.send("download-progress", {
        percent: (item.getReceivedBytes() / item.getTotalBytes()) * 100,
      });
    });

    item.once("done", (event, state) => {
      if (state === "completed") {
        console.log("✅ Download complete:", item.getSavePath());
        mainWindow.webContents.send("download-done", {
          filePath: item.getSavePath(),
        });
      } else {
        console.log("❌ Download failed:", state);
        mainWindow.webContents.send("download-error", state);
      }
    });
  });
});
