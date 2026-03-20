import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DesktopService {
  getAppVersion(): Promise<string> {
    return window.electronApi.getAppVersion();
  }
}