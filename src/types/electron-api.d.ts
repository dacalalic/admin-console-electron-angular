import type { ElectronApi } from '../../electron/preload';

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}

export {};
