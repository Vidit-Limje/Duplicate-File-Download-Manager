// main.js
import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(process.cwd(), "electron", "preload.js"),
    },
  });

  mainWindow.loadURL("http://localhost:5173");
  console.log("✅ UI Loaded");
}

app.on("ready", () => {
  createWindow();

  // ✅ React → Electron Download
  ipcMain.on("download", (event, url) => {
    console.log("📥 React asked to download:", url);
    handleDownload(url);
  });

  // ✅ Chrome Extension → Electron Download
  const server = http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/download") {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => {
        try {
          const { url } = JSON.parse(body);
          console.log("🌐 URL from Chrome Extension:", url);
          handleDownload(url);

          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
        } catch (err) {
          res.writeHead(400);
          res.end("Invalid Request");
        }
      });
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  server.listen(5050, "127.0.0.1", () => {
    console.log("✅ Listening at http://127.0.0.1:5050/download");
  });

  // ✅ Track progress for `downloadURL()`
  session.defaultSession.on("will-download", (event, item) => {
    const savePath = path.join(app.getPath("downloads"), item.getFilename());
    item.setSavePath(savePath);

    console.log("⬇️ Starting:", item.getFilename());

    item.on("updated", () => {
      const received = item.getReceivedBytes();
      const total = item.getTotalBytes();
      const percent = total > 0 ? ((received / total) * 100).toFixed(2) : "0";

      console.log(`📊 Progress: ${percent}%`);
      mainWindow.webContents.send("download-progress", {
        name: item.getFilename(),
        received,
        total,
        percent,
      });
    });

    item.once("done", (event, state) => {
      if (state === "completed") {
        console.log("✅ Completed:", item.getSavePath());
        mainWindow.webContents.send("download-done", {
          filePath: item.getSavePath(),
          name: item.getFilename(),
        });
      } else {
        console.log("❌ Failed:", state);
        mainWindow.webContents.send("download-error", { state });
      }
    });
  });
});

/* ✅ Core unified function */
function handleDownload(url) {
  if (!url) return;

  if (url.includes("drive.google.com") || url.includes("drive.usercontent")) {
    console.log("⚠ Google Drive detected, using manual download...");
    downloadGoogleDriveFile(url);
  } else {
    mainWindow.webContents.downloadURL(url);
  }
}

/* ✅ Proper Google Drive File Downloader */
function downloadGoogleDriveFile(url) {
  const fileId = url.match(/id=([^&]+)/)?.[1];
  if (!fileId) {
    console.log("❌ No valid file ID found in URL.");
    return;
  }

  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  console.log("➡ Fetching:", directUrl);

  https.get(directUrl, response => {
    const disposition = response.headers["content-disposition"];
    let filename = "downloaded_file";

    if (disposition && disposition.includes("filename")) {
      filename = disposition.split("filename=")[1].replace(/"/g, "");
    } else {
      filename += ".pdf";
    }

    const filePath = path.join(app.getPath("downloads"), filename);
    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);

    fileStream.on("finish", () => {
      console.log("✅ Saved:", filePath);
      mainWindow.webContents.send("download-done", {
        name: filename,
        filePath,
      });
    });
  }).on("error", err => {
    console.error("❌ Google Drive error:", err);
  });
}
