const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  openMarkdownFile: () => ipcRenderer.invoke('document:open'),
  listSystemFonts: () => ipcRenderer.invoke('fonts:list'),
  onOpenDocument: (callback) => ipcRenderer.on('document:opened', (_event, document) => callback(document)),
  onFullscreenChange: (callback) => ipcRenderer.on('window:fullscreen-changed', (_event, isFullscreen) => callback(isFullscreen))
});
