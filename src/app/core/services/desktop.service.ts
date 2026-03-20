import { Injectable } from '@angular/core';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class DesktopService {
  getAppVersion(): Promise<string> {
    return window.electronApi.getAppVersion();
  }

  getSession(): Promise<User | null> {
    return window.electronApi.getSession();
  }

  saveSession(user: User): Promise<void> {
    return window.electronApi.saveSession(user);
  }

  clearSession(): Promise<void> {
    return window.electronApi.clearSession();
  }
}