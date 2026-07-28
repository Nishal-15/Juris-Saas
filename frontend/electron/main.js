const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "JurisBot — Citizen Portal",
    icon: path.join(__dirname, "../public/logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    backgroundColor: "#0a0a0a",
    show: false, // show after ready-to-show for no white flash
    titleBarStyle: "default",
    autoHideMenuBar: true, // clean look — hides menu bar unless Alt pressed
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // mainWindow.webContents.openDevTools(); // uncomment to debug
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Show once fully loaded (prevents white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Build a minimal native menu
const menuTemplate = [
  {
    label: "JurisBot",
    submenu: [
      { label: "About JurisBot", role: "about" },
      { type: "separator" },
      { label: "Quit", role: "quit" },
    ],
  },
  {
    label: "View",
    submenu: [
      { label: "Reload", role: "reload" },
      { label: "Toggle Developer Tools", role: "toggleDevTools" },
      { type: "separator" },
      { label: "Actual Size", role: "resetZoom" },
      { label: "Zoom In", role: "zoomIn" },
      { label: "Zoom Out", role: "zoomOut" },
      { type: "separator" },
      { label: "Toggle Full Screen", role: "togglefullscreen" },
    ],
  },
  {
    label: "Window",
    submenu: [
      { label: "Minimize", role: "minimize" },
      { label: "Close", role: "close" },
    ],
  },
];

app.whenReady().then(() => {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
