const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  getInitialDocument: () => ipcRenderer.invoke('document:initial'),
  getPreferences: () => ipcRenderer.invoke('preferences:get'),
  savePreferences: (preferences) => ipcRenderer.invoke('preferences:set', preferences),
  openMarkdownFile: (labels) => ipcRenderer.invoke('document:open', labels),
  listSystemFonts: () => ipcRenderer.invoke('fonts:list'),
  onOpenDocument: (callback) => ipcRenderer.on('document:opened', (_event, document) => callback(document)),
  onFullscreenChange: (callback) => ipcRenderer.on('window:fullscreen-changed', (_event, isFullscreen) => callback(isFullscreen))
});
