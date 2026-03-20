import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DesktopService } from '../../../core/services/desktop.service';
import { User } from '../../../shared/models/user.model';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly authApiService = inject(AuthApiService);
  private readonly desktopService = inject(DesktopService);

  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();

  readonly isSignedIn = computed(() => this.currentUserSignal() !== null);

  async restoreSession(): Promise<void> {
    const user = await this.desktopService.getSession();
    this.currentUserSignal.set(user);
  }

  async signIn(userId: number): Promise<boolean> {
    try {
      const user = await firstValueFrom(this.authApiService.getUserById(userId));

      if (!user) {
        this.currentUserSignal.set(null);
        await this.desktopService.clearSession();
        return false;
      }

      this.currentUserSignal.set(user);
      await this.desktopService.saveSession(user);
      return true;
    } catch {
      this.currentUserSignal.set(null);
      await this.desktopService.clearSession();
      return false;
    }
  }

  async signOut(): Promise<void> {
    this.currentUserSignal.set(null);
    await this.desktopService.clearSession();
  }
}
