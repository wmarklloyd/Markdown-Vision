const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execFileAsync = promisify(execFile);

let mainWindow;

function getDocumentPath(argv = process.argv) {
  return argv
    .slice(1)
    .map((argument) => argument.replace(/^"|"$/g, ''))
    .find((argument) => !argument.startsWith('-') && /\.(md|markdown|mdown|mkd|txt)$/i.test(argument));
}

let pendingFile = getDocumentPath();

function readDocument(filePath) {
  const resolvedPath = path.resolve(filePath);
  return {
    name: path.basename(resolvedPath),
    content: fs.readFileSync(resolvedPath, 'utf8')
  };
}

function deliverDocument(filePath) {
  if (!filePath) return;
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) return;
  const document = readDocument(resolvedPath);
  if (mainWindow?.webContents && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('document:opened', document);
  } else {
    pendingFile = resolvedPath;
  }
}

function focusWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 680,
    minHeight: 520,
    backgroundColor: '#f5f3ee',
    title: 'Markdown Vision',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault();
  });
  mainWindow.webContents.once('did-finish-load', () => {
    if (pendingFile) {
      deliverDocument(pendingFile);
      pendingFile = null;
    }
  });
}

ipcMain.handle('document:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Markdown file',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
      { name: 'Text', extensions: ['txt'] }
    ]
  });
  return result.canceled ? null : readDocument(result.filePaths[0]);
});

ipcMain.handle('fonts:list', async () => {
  if (process.platform !== 'win32') return ['Arial', 'Georgia', 'Times New Roman'];
  const command = "Add-Type -AssemblyName System.Drawing; $fonts = New-Object System.Drawing.Text.InstalledFontCollection; $fonts.Families | ForEach-Object { $_.Name }";
  try {
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024
    });
    return [...new Set(stdout.split(/\r?\n/).map((font) => font.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  } catch {
    return ['Arial', 'Calibri', 'Consolas', 'Georgia', 'Segoe UI', 'Times New Roman'];
  }
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', (_event, argv) => {
  const filePath = getDocumentPath(argv);
  if (filePath) pendingFile = filePath;
  if (mainWindow) {
    focusWindow();
    if (pendingFile && mainWindow.webContents.isLoadingMainFrame()) return;
    if (pendingFile) {
      deliverDocument(pendingFile);
      pendingFile = null;
    }
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  pendingFile = filePath;
  deliverDocument(filePath);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
