const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("magic", {
  saveFile: (data) => ipcRenderer.invoke("save-file", data),
  readFile: (path) => ipcRenderer.invoke("read-file", path),
  listDir: (path) => ipcRenderer.invoke("list-dir", path),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  getProjectDir: () => ipcRenderer.invoke("get-project-dir"),
  setProjectDir: (dir) => ipcRenderer.invoke("set-project-dir", dir),
  openVSCode: (dir) => ipcRenderer.invoke("open-vscode", dir),

  minimize: () => ipcRenderer.invoke("minimize"),
  maximize: () => ipcRenderer.invoke("maximize"),
  close: () => ipcRenderer.invoke("close"),
});
