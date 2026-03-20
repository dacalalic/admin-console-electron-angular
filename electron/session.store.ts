import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface PersistedSessionUser {
  id: number;
  name: string;
  email: string;
}

interface SessionFileContent {
  user: PersistedSessionUser | null;
}

export class SessionStore {
  private getFilePath(): string {
    return path.join(app.getPath('userData'), 'session.json');
  }

  async getSession(): Promise<PersistedSessionUser | null> {
    try {
      const filePath = this.getFilePath();
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content) as SessionFileContent;
      return parsed.user;
    } catch {
      return null;
    }
  }

  async saveSession(user: PersistedSessionUser): Promise<void> {
    const filePath = this.getFilePath();
    const content: SessionFileContent = { user };
    await fs.writeFile(filePath, JSON.stringify(content), 'utf-8');
  }

  async clearSession(): Promise<void> {
    const filePath = this.getFilePath();
    const content: SessionFileContent = { user: null };
    await fs.writeFile(filePath, JSON.stringify(content), 'utf-8');
  }
}