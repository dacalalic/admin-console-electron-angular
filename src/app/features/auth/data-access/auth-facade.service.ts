import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DesktopService } from '../../../core/services/desktop.service';
import { LoggerService } from '../../../core/logging/logger.service';
import { User } from '../../../shared/models/user.model';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly authApiService = inject(AuthApiService);
  private readonly desktopService = inject(DesktopService);
  private readonly logger = inject(LoggerService);

  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();

  readonly isSignedIn = computed(() => this.currentUserSignal() !== null);

  async restoreSession(): Promise<void> {
    this.logger.info('app-flow', 'Restoring persisted session.');
    const user = await this.desktopService.getSession();
    this.currentUserSignal.set(user);
    this.logger.info('app-flow', 'Session restore completed.', {
      hasUser: user !== null,
      userId: user?.id,
    });
  }

  async signIn(userId: number): Promise<boolean> {
    this.logger.info('app-flow', 'Sign-in attempt started.', { userId });
    try {
      const user = await firstValueFrom(this.authApiService.getUserById(userId));

      if (!user) {
        this.currentUserSignal.set(null);
        await this.desktopService.clearSession();
        this.logger.warn('app-flow', 'Sign-in failed because user was not found.', { userId });
        return false;
      }

      this.currentUserSignal.set(user);
      await this.desktopService.saveSession(user);
      this.logger.info('app-flow', 'Sign-in succeeded.', { userId: user.id });
      return true;
    } catch {
      this.currentUserSignal.set(null);
      await this.desktopService.clearSession();
      this.logger.error('app-flow', 'Sign-in failed due to request/storage error.', { userId });
      return false;
    }
  }

  async signOut(): Promise<void> {
    this.logger.info('app-flow', 'Sign-out started.');
    this.currentUserSignal.set(null);
    await this.desktopService.clearSession();
    this.logger.info('app-flow', 'Sign-out completed.');
  }
}
