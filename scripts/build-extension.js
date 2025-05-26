const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

async function buildExtension() {
  const rootDir = path.join(__dirname, "..");
  const outDir = path.join(rootDir, "out");
  const distDir = path.join(rootDir, "dist");
  const publicDir = path.join(rootDir, "public");

  // Clean previous builds
  await fs.remove(distDir);

  console.log("Building Next.js app...");

  console.log("Copying static assets for Chrome extension...");

  // Create dist directory
  await fs.ensureDir(distDir);

  await fs.copy(path.join(publicDir, "icons"), path.join(distDir, "icons"));

  // Copy exported HTML as popup.html
  await fs.copyFile(
    path.join(outDir, "index.html"),
    path.join(distDir, "popup.html")
  );

  const popupPath = path.join(distDir, "popup.html");
  let popupHtml = await fs.readFile(popupPath, "utf-8");
  popupHtml = popupHtml.replace(/_next\//g, "");
  await fs.writeFile(popupPath, popupHtml);

  // Copy _next static files (to next/static/)
  await fs.copy(path.join(outDir, "_next"), path.join(distDir, "next"));

  // Copy manifest.json
  await fs.copyFile(
    path.join(publicDir, "manifest.json"),
    path.join(distDir, "manifest.json")
  );

  // Create a simple background script
  const backgroundScript = `
// Background script for RailGhost Wallet Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('RailGhost Wallet Extension installed');
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  sendResponse({ success: true });
});
`;
  await fs.writeFile(path.join(distDir, "background.js"), backgroundScript);

  console.log("✅ Chrome extension build complete!");
  console.log(
    "👉 Load it by opening chrome://extensions, enabling Developer Mode, and loading the dist/ folder."
  );
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { cwd: path.join(__dirname, "..") },
      (err, stdout, stderr) => {
        if (err) {
          console.error(stderr);
          return reject(err);
        }
        console.log(stdout);
        resolve();
      }
    );
  });
}

buildExtension().catch((err) => {
  console.error("❌ Build failed:", err);
});
