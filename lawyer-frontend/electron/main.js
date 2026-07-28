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
    title: "JurisBot PRO — Lawyer Portal",
    icon: path.join(__dirname, "../public/logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    backgroundColor: "#0f111a",
    show: false,
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5174");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

const menuTemplate = [
  {
    label: "JurisBot PRO",
    submenu: [
      { label: "About JurisBot PRO", role: "about" },
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
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
