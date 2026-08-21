const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Magic.AI",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#0a0a0f",
    titleBarStyle: "hidden",
    frame: false,
  });

  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, "app.html"));
  } else {
    mainWindow.loadFile(path.join(__dirname, "app.html"));
  }
}

// File operations via IPC
ipcMain.handle("save-file", async (event, { filePath, content, defaultPath }) => {
  const targetPath = defaultPath || filePath;
  const fullPath = path.isAbsolute(targetPath)
    ? targetPath
    : path.join(getProjectDir(), targetPath);

  const dir = path.dirname(fullPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
  return { ok: true, path: fullPath };
});

ipcMain.handle("read-file", async (event, filePath) => {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(getProjectDir(), filePath);
  if (!fs.existsSync(fullPath)) return { ok: false, error: "File not found" };
  const content = fs.readFileSync(fullPath, "utf-8");
  return { ok: true, content };
});

ipcMain.handle("list-dir", async (event, dirPath) => {
  const fullPath = dirPath || getProjectDir();
  if (!fs.existsSync(fullPath)) return { ok: true, files: [] };
  const items = fs.readdirSync(fullPath, { withFileTypes: true });
  const files = items.map((i) => ({
    name: i.name,
    isDirectory: i.isDirectory(),
  }));
  return { ok: true, files };
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (result.canceled) return { ok: false };
  return { ok: true, path: result.filePaths[0] };
});

ipcMain.handle("get-project-dir", () => {
  return getProjectDir();
});

ipcMain.handle("set-project-dir", (event, dir) => {
  projectDir = dir;
});

ipcMain.handle("open-vscode", async (event, dir) => {
  const { exec } = require("child_process");
  exec('explorer "' + dir + '"', (err) => {
    if (err) {
      dialog.showErrorBox("Error", "Could not open folder.");
    }
  });
});

// Window controls
ipcMain.handle("minimize", () => mainWindow.minimize());
ipcMain.handle("maximize", () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle("close", () => mainWindow.close());

let projectDir = app.getPath("documents");

function getProjectDir() {
  return projectDir;
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
