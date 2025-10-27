// Intercepts all downloads in Chrome
chrome.downloads.onCreated.addListener((downloadItem) => {
  if (downloadItem && downloadItem.url) {
    console.log("Detected download:", downloadItem.url);

    // Stop Chrome’s built-in download
    chrome.downloads.cancel(downloadItem.id);

    // ✅ Send URL to Electron app via WebSocket (preferred)
    sendToElectron(downloadItem.url);
  }
});

function sendToElectron(url) {
  // WebSocket / HTTP API route where your Electron app is listening
  fetch("http://localhost:5050/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  }).then(() => {
    console.log("📩 Sent URL to Electron:", url);
  }).catch(err => console.error("❌ Failed to send:", err));
}
