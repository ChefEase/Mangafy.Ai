const { app, BrowserWindow, session, net } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, "public", "Logo.ico"), // YOUR APP ICON
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  win.webContents.session.clearCache();

  // --- INTERNET CHECK FUNCTION ---
  function loadApp() {
    const request = net.request("https://www.mangafyai.com");
    request.on("response", () => {
      win.loadURL("https://www.mangafyai.com");
    });
    request.on("error", () => {
      loadOfflineScreen();
    });
    request.end();
  }

  // --- LOAD OFFLINE HTML ---
  function loadOfflineScreen() {
    win.loadFile(path.join(__dirname, "offline.html"));
  }

  // Try loading the app
  loadApp();

  // Retry when user presses refresh (CTRL+R)
  win.webContents.on("did-fail-load", () => loadOfflineScreen());
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
