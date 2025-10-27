// background.js
chrome.downloads.onCreated.addListener((downloadItem) => {
  const url = downloadItem.finalUrl;

  console.log("🌐 Intercepted download:", url);

  // ✅ Stop Chrome's default download
  chrome.downloads.cancel(downloadItem.id, () => {
    console.log("⛔ Chrome download canceled, sending to Electron...");
  });

  // ✅ Send URL to Electron Download Manager (localhost:5050)
  fetch("http://127.0.0.1:5050/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
    .then(() => console.log("✅ Sent to Electron:", url))
    .catch((err) => console.error("❌ Failed to send:", err));
});
