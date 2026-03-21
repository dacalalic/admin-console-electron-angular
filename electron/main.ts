import { app, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log/main';
import path from 'node:path';
import { AppDatabase } from './database';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  context?: Record<string, string | number | boolean | null | undefined>;
}

let database: AppDatabase;

function writeStructuredLog(entry: LogEntry): void {
  const payload = {
    source: entry.source,
    message: entry.message,
    context: entry.context ?? {},
  };

  if (entry.level === 'error') {
    log.error(payload);
    return;
  }

  if (entry.level === 'warn') {
    log.warn(payload);
    return;
  }

  log.info(payload);
}

function logInfo(
  source: string,
  message: string,
  context?: Record<string, string | number | boolean | null | undefined>,
): void {
  writeStructuredLog({ level: 'info', source, message, context });
}

function logError(
  source: string,
  message: string,
  context?: Record<string, string | number | boolean | null | undefined>,
): void {
  writeStructuredLog({ level: 'error', source, message, context });
}

process.on('uncaughtException', (error) => {
  logError('app-flow', 'Uncaught exception in main process.', {
    message: error.message,
  });
});

process.on('unhandledRejection', (reason) => {
  logError('app-flow', 'Unhandled rejection in main process.', {
    reason: String(reason),
  });
});

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

  logInfo('app-flow', 'Creating main window.', {
    width: 1280,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
  });

  win.webContents.on('did-finish-load', () => {
    logInfo('app-flow', 'Renderer finished loading.');
  });

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    logError('app-flow', 'Renderer failed to load.', {
      errorCode,
      errorDescription,
    });
  });

  void win.loadURL('http://localhost:4200');
}

app.whenReady().then(() => {
  log.initialize();
  log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'app.log');

  logInfo('app-flow', 'Electron app is ready.', {
    version: app.getVersion(),
    logFilePath: log.transports.file.getFile().path,
  });
  database = new AppDatabase();
  logInfo('app-flow', 'Database initialized.');

  ipcMain.handle('log:write', (_, entry: LogEntry) => {
    writeStructuredLog(entry);
  });

  ipcMain.handle('app:get-version', () => {
    logInfo('ipc', 'Handled app:get-version request.');
    return app.getVersion();
  });

  ipcMain.handle('session:get', () => {
    logInfo('ipc', 'Handled session:get request.');
    return database.getActiveSessionUser();
  });

  ipcMain.handle('session:save', (_, user: { id: number; name: string; email: string }) => {
    logInfo('ipc', 'Handled session:save request.', { userId: user.id });
    database.saveUser(user);
    database.setActiveSession(user.id);
  });

  ipcMain.handle('session:clear', () => {
    logInfo('ipc', 'Handled session:clear request.');
    database.clearActiveSession();
  });

  ipcMain.handle(
    'posts:save',
    (
      _,
      posts: { id: number; userId: number; title: string; body: string; comments: number | null }[],
    ) => {
      logInfo('ipc', 'Handled posts:save request.', { postsCount: posts.length });
      database.savePosts(posts);
    },
  );

  ipcMain.handle('posts:get-by-user-id', (_, userId: number) => {
    logInfo('ipc', 'Handled posts:get-by-user-id request.', { userId });
    return database.getPostsByUserId(userId);
  });

  ipcMain.handle('posts:update-comments', (_, postId: number, comments: number) => {
    logInfo('ipc', 'Handled posts:update-comments request.', { postId, comments });
    database.updatePostComments(postId, comments);
  });

  createWindow();

  app.on('activate', () => {
    logInfo('app-flow', 'App activate event received.');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logInfo('app-flow', 'All windows closed.', { platform: process.platform });
  if (process.platform !== 'darwin') {
    logInfo('app-flow', 'Quitting app after window-all-closed event.');
    app.quit();
  }
});
