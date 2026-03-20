import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly currentUserIdSignal = signal<number | null>(null);

  readonly currentUserId = this.currentUserIdSignal.asReadonly();

  readonly isSignedIn = computed(() => this.currentUserIdSignal() !== null);

  signIn(userId: number): void {
    this.currentUserIdSignal.set(userId);
  }

  signOut(): void {
    this.currentUserIdSignal.set(null);
  }
}