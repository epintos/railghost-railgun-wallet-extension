const fs = require("fs-extra");
const path = require("path");

async function buildExtension() {
  const distDir = path.join(__dirname, "../dist");
  const publicDir = path.join(__dirname, "../public");

  console.log("Building Chrome extension...");

  // Copy manifest.json to dist
  await fs.copy(
    path.join(publicDir, "manifest.json"),
    path.join(distDir, "manifest.json")
  );

  // Create popup.html that loads the Next.js app
  const popupHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RailGhost Wallet</title>
  <style>
    body {
      width: 380px;
      height: 600px;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    #__next {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="__next"></div>
  <script src="_next/static/chunks/webpack.js"></script>
  <script src="_next/static/chunks/main.js"></script>
  <script src="_next/static/chunks/pages/_app.js"></script>
  <script src="_next/static/chunks/pages/index.js"></script>
</body>
</html>`;

  await fs.writeFile(path.join(distDir, "popup.html"), popupHtml);

  // Create background script
  const backgroundScript = `
// Background script for Railgun Wallet Extension
console.log('Railgun Wallet Extension background script loaded')

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Railgun Wallet Extension installed')
})

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request)
  sendResponse({ success: true })
})
`;

  await fs.writeFile(path.join(distDir, "background.js"), backgroundScript);

  console.log("Chrome extension build complete!");
  console.log("Load the extension by:");
  console.log("1. Open Chrome and go to chrome://extensions/");
  console.log("2. Enable Developer mode");
  console.log('3. Click "Load unpacked" and select the dist/ folder');
}

buildExtension().catch(console.error);
