import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { AppDatabase } from './database';

const database = new AppDatabase();

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  void win.loadURL('http://localhost:4200');
}

app.whenReady().then(() => {
  ipcMain.handle('app:get-version', () => app.getVersion());

  ipcMain.handle('session:get', () => {
    return database.getActiveSessionUser();
  });

  ipcMain.handle('session:save', (_, user: { id: number; name: string; email: string }) => {
    database.saveUser(user);
    database.setActiveSession(user.id);
  });

  ipcMain.handle('session:clear', () => {
    database.clearActiveSession();
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});