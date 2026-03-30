const path = require("path");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { anonymizeBatch } = require("../src/core/document-service");

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 780,
    backgroundColor: "#0f172a",
    title: "SgranaDati",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });

  window.loadFile(path.join(__dirname, "../src/renderer/index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("dialog:pick-files", async () => {
    const result = await dialog.showOpenDialog({
      title: "Seleziona i documenti da anonimizzare",
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Documenti supportati",
          extensions: [
            "txt",
            "md",
            "csv",
            "json",
            "log",
            "html",
            "xml",
            "docx",
            "pdf"
          ]
        }
      ]
    });

    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle("dialog:pick-output", async () => {
    const result = await dialog.showOpenDialog({
      title: "Scegli la cartella di export",
      properties: ["openDirectory", "createDirectory"]
    });

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("anonymize:run", async (_, payload) => {
    return anonymizeBatch(payload);
  });

  ipcMain.handle("shell:open-path", async (_, targetPath) => {
    if (!targetPath) {
      return;
    }

    return shell.openPath(targetPath);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
