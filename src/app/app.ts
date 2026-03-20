import { Component, OnInit, inject, signal } from '@angular/core';
import { DesktopService } from './core/services/desktop.service';

@Component({
  selector: 'app-root',
  template: `
    <main>
      <h1>Admin Console</h1>
      <p>Electron version: {{ version() }}</p>
    </main>
  `,
})
export class App implements OnInit {
  private readonly desktopService = inject(DesktopService);

  protected version = signal('loading...');

  async ngOnInit(): Promise<void> {
    const version = await this.desktopService.getAppVersion();
    this.version.set(version);
  }
}