import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-posts-page',
  template: `
    <main>
      <h1>Posts</h1>
      <p>Posts page works.</p>
      <button type="button" (click)="signOut()">Sign out</button>
    </main>
  `,
})
export class PostsPageComponent {
  constructor(private readonly router: Router) {}

  signOut(): void {
    void this.router.navigate(['/sign-in']);
  }
}