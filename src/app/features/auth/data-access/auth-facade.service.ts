import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { User } from '../../../shared/models/user.model';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly authApiService = inject(AuthApiService);

  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();

  readonly isSignedIn = computed(() => this.currentUserSignal() !== null);

  async signIn(userId: number): Promise<boolean> {
    try {
      const user = await firstValueFrom(this.authApiService.getUserById(userId));
      this.currentUserSignal.set(user);
      return true;
    } catch {
      this.currentUserSignal.set(null);
      return false;
    }
  }

  signOut(): void {
    this.currentUserSignal.set(null);
  }
}