const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { execFile, spawn } = require('node:child_process');
const { promisify } = require('node:util');
const execFileAsync = promisify(execFile);

const appTitle = 'Markdown Vision';
const detachedLaunchFlag = '--markdown-vision-detached';
const initialDocuments = new Map();
const startupDocumentPath = getDocumentPath();
const preferencesPath = path.join(app.getPath('appData'), 'Markdown Vision', 'preferences.json');
const defaultPreferences = { theme: 'dark', font: 'Georgia', monoFont: 'Consolas', size: '18', line: '1.75', width: '720' };

function getDocumentPath(argv = process.argv) {
  return argv
    .slice(1)
    .map((argument) => argument.replace(/^"|"$/g, ''))
    .find((argument) => !argument.startsWith('-') && /\.(md|markdown|mdown|mkd|txt)$/i.test(argument));
}

function detachFileLaunch() {
  if (!startupDocumentPath || process.argv.includes(detachedLaunchFlag)) return;
  const resolvedDocumentPath = path.resolve(startupDocumentPath);
  const childArgs = process.defaultApp
    ? [__dirname, detachedLaunchFlag, resolvedDocumentPath]
    : [detachedLaunchFlag, resolvedDocumentPath];
  const child = spawn(process.execPath, childArgs, {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  child.unref();
  process.exit(0);
}

function configureUserData() {
  if (!startupDocumentPath) return;
  const instanceUserData = path.join(app.getPath('temp'), 'Markdown Vision', `instance-${process.pid}`);
  fs.mkdirSync(instanceUserData, { recursive: true });
  app.setPath('userData', instanceUserData);
}

function configureChromiumCache() {
  const cacheRoot = path.join(app.getPath('userData'), 'ChromiumCache');
  try {
    fs.mkdirSync(cacheRoot, { recursive: true });
    app.commandLine.appendSwitch('disk-cache-dir', cacheRoot);
    app.commandLine.appendSwitch('media-cache-dir', path.join(cacheRoot, 'Media'));
  } catch {
    app.commandLine.appendSwitch('disable-http-cache');
  }
}

detachFileLaunch();
configureUserData();
configureChromiumCache();

function readDocument(filePath) {
  const resolvedPath = path.resolve(filePath);
  return {
    name: path.basename(resolvedPath),
    content: fs.readFileSync(resolvedPath, 'utf8')
  };
}

function readPreferences() {
  try {
    return { ...defaultPreferences, ...JSON.parse(fs.readFileSync(preferencesPath, 'utf8')) };
  } catch {
    return null;
  }
}

function writePreferences(preferences) {
  const nextPreferences = {
    theme: preferences?.theme || defaultPreferences.theme,
    font: preferences?.font || defaultPreferences.font,
    monoFont: preferences?.monoFont || defaultPreferences.monoFont,
    size: String(preferences?.size || defaultPreferences.size),
    line: String(preferences?.line || defaultPreferences.line),
    width: String(preferences?.width || defaultPreferences.width)
  };
  fs.mkdirSync(path.dirname(preferencesPath), { recursive: true });
  fs.writeFileSync(preferencesPath, JSON.stringify(nextPreferences, null, 2));
  return nextPreferences;
}

function getDocumentTitle(documentName) {
  return documentName || appTitle;
}

function deliverDocument(targetWindow, filePath) {
  if (!targetWindow || targetWindow.isDestroyed() || !filePath) return;
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) return;
  const document = readDocument(resolvedPath);
  targetWindow.setTitle(getDocumentTitle(document.name));
  targetWindow.webContents.send('document:opened', document);
}

function createWindow(filePath = null) {
  const initialDocument = filePath && fs.existsSync(path.resolve(filePath))
    ? readDocument(filePath)
    : null;
  const targetWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 680,
    minHeight: 520,
    backgroundColor: '#202124',
    title: getDocumentTitle(initialDocument?.name),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  targetWindow.loadFile(path.join(__dirname, 'src', 'web', 'index.html'));
  targetWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  targetWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== targetWindow.webContents.getURL()) event.preventDefault();
  });
  if (initialDocument) {
    const webContentsId = targetWindow.webContents.id;
    initialDocuments.set(webContentsId, initialDocument);
    targetWindow.on('closed', () => initialDocuments.delete(webContentsId));
  }

  return targetWindow;
}

ipcMain.handle('document:initial', (event) => {
  const document = initialDocuments.get(event.sender.id) || null;
  initialDocuments.delete(event.sender.id);
  return document;
});

ipcMain.handle('document:open', async (event) => {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(targetWindow, {
    title: 'Open Markdown file',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
      { name: 'Text', extensions: ['txt'] }
    ]
  });
  if (result.canceled) return null;
  const document = readDocument(result.filePaths[0]);
  targetWindow?.setTitle(getDocumentTitle(document.name));
  return document;
});

ipcMain.handle('preferences:get', () => readPreferences());
ipcMain.handle('preferences:set', (_event, preferences) => writePreferences(preferences));

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

app.whenReady().then(() => {
  createWindow(startupDocumentPath);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (app.isReady()) createWindow(filePath);
  else app.whenReady().then(() => createWindow(filePath));
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
