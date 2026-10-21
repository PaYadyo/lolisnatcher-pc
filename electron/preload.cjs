const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChange: (callback) => {
    ipcRenderer.on('window:isMaximized', (event, val) => callback(val));
  },

  // Directory and Shell
  selectDirectory: (currentPath) => ipcRenderer.invoke('dialog:select-directory', currentPath),
  getDefaultDownloadPath: () => ipcRenderer.invoke('get:default-download-path'),
  openFolder: (folderPath) => ipcRenderer.invoke('shell:open-folder', folderPath),
  showItem: (filePath) => ipcRenderer.invoke('shell:show-item', filePath),

  // Direct downloader
  downloadImage: (params) => ipcRenderer.invoke('download:image', params),
  onDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download:progress', handler);
    return () => ipcRenderer.removeListener('download:progress', handler);
  },

  // CORS-free API Proxy
  fetchBooru: (params) => ipcRenderer.invoke('booru:fetch', params),
});
