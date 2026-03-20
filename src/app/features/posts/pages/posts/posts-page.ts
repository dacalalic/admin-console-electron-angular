import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '../../../auth/data-access/auth-facade.service';

@Component({
  selector: 'app-posts-page',
  template: `
    <main>
      <h1>Posts</h1>

      @if (authFacade.currentUser(); as user) {
        <p>Signed in as {{ user.name }} ({{ user.email }})</p>
      }

      <button type="button" (click)="signOut()">Sign out</button>
    </main>
  `,
})
export class PostsPageComponent {
  protected readonly authFacade = inject(AuthFacade);

  private readonly router = inject(Router);

  signOut(): void {
    this.authFacade.signOut();
    void this.router.navigate(['/sign-in']);
  }
}