const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    frame: false, // Custom frameless anime titlebar
    backgroundColor: '#0f1015',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows cross-origin image preview and fetches
    },
    title: 'LoliSnatcher PC - Danbooru Viewer',
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Bypasses Danbooru / booru hotlinking and CORS restrictions
  const filter = {
    urls: ['*://*.donmai.us/*', '*://*.yande.re/*', '*://*.konachan.net/*', '*://*.gelbooru.com/*']
  };

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['User-Agent'] = 'LoliSnatcherPC/1.0.0 (Windows NT 10.0; Win64; x64)';
    if (details.url.includes('donmai.us')) {
      details.requestHeaders['Referer'] = 'https://danbooru.donmai.us/';
    } else if (details.url.includes('yande.re')) {
      details.requestHeaders['Referer'] = 'https://yande.re/';
    } else if (details.url.includes('konachan.net')) {
      details.requestHeaders['Referer'] = 'https://konachan.net/';
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  // Load dev server or production build
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('maximize', () => mainWindow.webContents.send('window:isMaximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:isMaximized', false));
}

// Window controls IPC
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Directory selection dialog
ipcMain.handle('dialog:select-directory', async (event, currentPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Download Folder',
    defaultPath: currentPath || app.getPath('downloads'),
    properties: ['openDirectory', 'createDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Default download path
ipcMain.handle('get:default-download-path', () => {
  const defaultDir = path.join(app.getPath('pictures'), 'LoliSnatcher');
  if (!fs.existsSync(defaultDir)) {
    try {
      fs.mkdirSync(defaultDir, { recursive: true });
    } catch {
      return app.getPath('downloads');
    }
  }
  return defaultDir;
});

// Open file or folder in explorer
ipcMain.handle('shell:open-folder', async (event, folderPath) => {
  if (folderPath && fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});

ipcMain.handle('shell:show-item', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

// Streaming image downloader with custom headers and progress
ipcMain.handle('download:image', async (event, { url, filename, targetFolder, authHeaders }) => {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      // Clean filename
      const safeFilename = filename.replace(/[<>:"/\\|?*]+/g, '_').slice(0, 200);
      let targetPath = path.join(targetFolder, safeFilename);

      // Handle duplicate filenames
      const parsed = path.parse(targetPath);
      let counter = 1;
      while (fs.existsSync(targetPath)) {
        targetPath = path.join(parsed.dir, `${parsed.name} (${counter})${parsed.ext}`);
        counter++;
      }

      const client = url.startsWith('https') ? https : http;
      const headers = {
        'User-Agent': 'LoliSnatcherPC/1.0.0 (Windows NT 10.0; Win64; x64)',
        'Referer': url.includes('donmai.us') ? 'https://danbooru.donmai.us/' : undefined,
        ...(authHeaders || {})
      };

      const request = client.get(url, { headers }, (response) => {
        // Follow redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = response.headers.location.startsWith('http')
            ? response.headers.location
            : new URL(response.headers.location, url).href;
          
          return client.get(redirectUrl, { headers }, (redResp) => {
            pipeDownload(redResp, targetPath, event, url, resolve);
          }).on('error', (err) => {
            resolve({ success: false, error: err.message });
          });
        }

        if (response.statusCode !== 200) {
          resolve({ success: false, error: `HTTP ${response.statusCode}: ${response.statusMessage}` });
          return;
        }

        pipeDownload(response, targetPath, event, url, resolve);
      });

      request.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
});

function pipeDownload(response, targetPath, event, url, resolve) {
  const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
  let downloadedBytes = 0;
  const fileStream = fs.createWriteStream(targetPath);

  response.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    if (totalBytes > 0) {
      const progress = Math.round((downloadedBytes / totalBytes) * 100);
      event.sender.send('download:progress', { url, progress, downloadedBytes, totalBytes });
    }
  });

  fileStream.on('finish', () => {
    fileStream.close();
    event.sender.send('download:progress', { url, progress: 100, downloadedBytes, totalBytes });
    resolve({ success: true, filePath: targetPath, fileSize: downloadedBytes });
  });

  fileStream.on('error', (err) => {
    fs.unlink(targetPath, () => {});
    resolve({ success: false, error: err.message });
  });

  response.pipe(fileStream);
}

// Global Booru API proxy to bypass CORS in electron
ipcMain.handle('booru:fetch', async (event, { url, options = {} }) => {
  try {
    const fetchResponse = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'LoliSnatcherPC/1.0.0 (Windows NT 10.0; Win64; x64)',
        'Referer': url.includes('donmai.us') ? 'https://danbooru.donmai.us/' : undefined,
        ...(options.headers || {})
      }
    });

    const contentType = fetchResponse.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await fetchResponse.json();
    } else {
      data = await fetchResponse.text();
    }

    return {
      ok: fetchResponse.ok,
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      data
    };
  } catch (err) {
    return { ok: false, status: 500, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
