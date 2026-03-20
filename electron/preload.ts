import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronUser {
  id: number;
  name: string;
  email: string;
}

export interface ElectronApi {
  getAppVersion: () => Promise<string>;
  getSession: () => Promise<ElectronUser | null>;
  saveSession: (user: ElectronUser) => Promise<void>;
  clearSession: () => Promise<void>;
}

const electronApi: ElectronApi = {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getSession: () => ipcRenderer.invoke('session:get'),
  saveSession: (user) => ipcRenderer.invoke('session:save', user),
  clearSession: () => ipcRenderer.invoke('session:clear'),
};

contextBridge.exposeInMainWorld('electronApi', electronApi);