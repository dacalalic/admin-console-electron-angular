import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronUser {
  id: number;
  name: string;
  email: string;
}

export interface ElectronPost {
  id: number;
  userId: number;
  title: string;
  body: string;
  comments: number | null;
}

export interface ElectronApi {
  getAppVersion: () => Promise<string>;
  getSession: () => Promise<ElectronUser | null>;
  saveSession: (user: ElectronUser) => Promise<void>;
  clearSession: () => Promise<void>;
  savePosts: (posts: ElectronPost[]) => Promise<void>;
  getPostsByUserId: (userId: number) => Promise<ElectronPost[]>;
  updatePostComments: (postId: number, comments: number) => Promise<void>;
}

const electronApi: ElectronApi = {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getSession: () => ipcRenderer.invoke('session:get'),
  saveSession: (user) => ipcRenderer.invoke('session:save', user),
  clearSession: () => ipcRenderer.invoke('session:clear'),
  savePosts: (posts) => ipcRenderer.invoke('posts:save', posts),
  getPostsByUserId: (userId) => ipcRenderer.invoke('posts:get-by-user-id', userId),
  updatePostComments: (postId, comments) =>
    ipcRenderer.invoke('posts:update-comments', postId, comments),
};

contextBridge.exposeInMainWorld('electronApi', electronApi);