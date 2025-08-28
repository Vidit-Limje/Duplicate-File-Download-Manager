import React, { useState, useEffect, useRef } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();

    if (!window.dm) {
      console.error("⚠️ window.dm is not available. Check preload.js!");
      return;
    }

    const offProgress = window.dm.onProgress((p) => {
      console.log("📥 Progress update:", p);
      const percent = Number(p.percent.toFixed(2));
      setProgress(percent);
      setStatus(`Downloading... ${percent}%`);
      setDownloading(true);
    });

    const offDone = window.dm.onDone((info) => {
      console.log("✅ Download finished:", info);
      setStatus(`✅ Download finished: ${info.filePath}`);
      setProgress(0);
      setDownloading(false);
    });

    const offError = window.dm.onError((err) => {
      console.error("❌ Download failed:", err);
      setStatus(`❌ Download failed: ${err}`);
      setProgress(0);
      setDownloading(false);
    });

    return () => {
      offProgress && offProgress();
      offDone && offDone();
      offError && offError();
    };
  }, []);

  const handleDownload = () => {
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }
    console.log("▶️ Starting download:", url);
    setStatus("Starting download...");
    setProgress(0);
    setDownloading(true);
    window.dm.download(url);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>🚀 Custom Download Manager</h2>

      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter file URL"
        style={{
          width: "320px",
          marginRight: "10px",
          padding: "6px",
        }}
      />
      <button onClick={handleDownload} disabled={downloading}>
        {downloading ? "Downloading..." : "Download"}
      </button>

      {status && (
        <p
          style={{
            marginTop: "15px",
            color: status.startsWith("✅")
              ? "green"
              : status.startsWith("❌")
              ? "red"
              : "blue",
          }}
        >
          {status}
        </p>
      )}

      {progress > 0 && downloading && (
        <div style={{ marginTop: "10px" }}>
          <progress value={progress} max="100" style={{ width: "320px" }} />
          <p>{progress}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
