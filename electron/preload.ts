import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronApi {
  getAppVersion: () => Promise<string>;
}

const electronApi: ElectronApi = {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
};

contextBridge.exposeInMainWorld('electronApi', electronApi);