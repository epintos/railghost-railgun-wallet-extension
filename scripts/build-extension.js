const fs = require("fs-extra");
const path = require("path");

function recursivelyFixNextPaths(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      recursivelyFixNextPaths(filePath);
    } else if (
      file.endsWith(".js") ||
      file.endsWith(".html") ||
      file.endsWith(".json")
    ) {
      let content = fs.readFileSync(filePath, "utf8");
      if (content.includes("/_next/")) {
        const updated = content.replace(/\/_next\//g, "/next/");
        fs.writeFileSync(filePath, updated);
        console.log(`✅ Rewrote /_next/ → /next/ in ${filePath}`);
      }
    }
  }
}
async function patchNextPaths(dir) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await patchNextPaths(filePath);
    } else if (file.endsWith(".js") || file.endsWith(".json")) {
      let content = await fs.readFile(filePath, "utf8");
      if (content.includes("/_next/")) {
        content = content.replace(/\/_next\//g, "/next/");
        await fs.writeFile(filePath, content, "utf8");
        console.log(`Patched ${filePath}`);
      }
    }
  }
}

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

  // Copy _next static files (to next/static/)
  await fs.copy(path.join(outDir, "_next"), path.join(distDir, "next"));

  // Copy manifest.json
  await fs.copyFile(
    path.join(publicDir, "manifest.json"),
    path.join(distDir, "manifest.json")
  );

  recursivelyFixNextPaths(distDir);
  patchNextPaths(path.join(distDir, "next", "static"));

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

  console.log("Chrome extension build complete!");
  console.log(
    "Load it by opening chrome://extensions, enabling Developer Mode, and loading the dist/ folder."
  );
}
buildExtension().catch((err) => {
  console.error(" Build failed:", err);
});
