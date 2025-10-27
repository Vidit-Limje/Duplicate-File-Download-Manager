// main.js
import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import http from "http";

let mainWindow;

// ✅ Create Main Window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(process.cwd(), "electron", "preload.js"),
    },
  });

  mainWindow.loadURL("http://localhost:5173");
  console.log("✅ Loaded React at http://localhost:5173");
}

// ✅ Setup Electron App
app.on("ready", () => {
  console.log("🚀 Electron App is Ready");
  createWindow();

  // ✅ Listen for manual download from React
  ipcMain.on("download", (event, url) => {
    if (url) {
      console.log("📥 Download requested from React:", url);
      mainWindow.webContents.downloadURL(url);
    }
  });

  // ✅ Handle Download Progress + Done + Errors
  session.defaultSession.on("will-download", (event, item) => {
    console.log("⬇️ Starting download:", item.getFilename());

    const savePath = path.join(app.getPath("downloads"), item.getFilename());
    item.setSavePath(savePath);

    item.on("updated", () => {
      const received = item.getReceivedBytes();
      const total = item.getTotalBytes();
      const percent = ((received / total) * 100).toFixed(2);

      mainWindow.webContents.send("download-progress", { percent });
      console.log(`📊 Progress: ${percent}%`);
    });

    item.once("done", (event, state) => {
      if (state === "completed") {
        console.log("✅ Download completed:", item.getSavePath());
        mainWindow.webContents.send("download-done", {
          filePath: item.getSavePath(),
        });
      } else {
        console.log("❌ Download failed:", state);
        mainWindow.webContents.send("download-error", state);
      }
    });
  });

  // ✅ HTTP Server for Chrome Extension + Fix CORS
  const server = http.createServer((req, res) => {
    // ✅ Add CORS headers for Chrome Extension access
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ Handle CORS Preflight Request
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // ✅ Handle actual POST /download from Chrome Extension
    if (req.method === "POST" && req.url === "/download") {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => {
        try {
          const { url } = JSON.parse(body);
          console.log("🌐 Received URL from Chrome Extension:", url);

          if (mainWindow && url) {
            mainWindow.webContents.downloadURL(url); // Trigger Electron download
          }

          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
        } catch (err) {
          console.error("❌ Error parsing request:", err);
          res.writeHead(400);
          res.end("Invalid JSON");
        }
      });
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  server.listen(5050, "127.0.0.1", () => {
    console.log("✅ Listening for Chrome Extension at http://127.0.0.1:5050/download");
  });
});
