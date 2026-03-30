const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sgranadati", {
  pickFiles: () => ipcRenderer.invoke("dialog:pick-files"),
  pickOutputDir: () => ipcRenderer.invoke("dialog:pick-output"),
  runAnonymization: (payload) => ipcRenderer.invoke("anonymize:run", payload),
  openPath: (targetPath) => ipcRenderer.invoke("shell:open-path", targetPath)
});
