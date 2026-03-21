import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '../../../auth/data-access/auth-facade.service';
import { PostsFacade } from '../../data-access/posts-facade.service';

@Component({
  selector: 'app-posts-page',
  template: `
    <main>
      <h1>Posts</h1>

      @if (authFacade.currentUser(); as user) {
        <p>Signed in as {{ user.name }} ({{ user.email }})</p>
      }

      <button type="button" (click)="signOut()">Sign out</button>

      @if (postsFacade.isLoading()) {
        <p>Loading posts...</p>
      }

      @if (postsFacade.errorMessage()) {
        <p>{{ postsFacade.errorMessage() }}</p>
      }

      @if (postsFacade.posts().length > 0) {
        <ul>
          @for (post of postsFacade.posts(); track post.id) {
            <li>
              <h2>{{ post.title }}</h2>
              <p>{{ post.body }}</p>
              <p>Comments: {{ post.comments ?? 'Not counted yet' }}</p>
              <button
                type="button"
                [disabled]="postsFacade.isCountingComments(post.id)"
                (click)="countComments(post.id)"
              >
                {{ postsFacade.isCountingComments(post.id) ? 'Counting...' : 'Count Comments' }}
              </button>
            </li>
          }
        </ul>
      } @else if (!postsFacade.isLoading()) {
        <p>No posts found.</p>
      }
    </main>
  `,
})
export class PostsPageComponent implements OnInit {
  protected readonly authFacade = inject(AuthFacade);
  protected readonly postsFacade = inject(PostsFacade);

  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.postsFacade.loadPosts();
  }

  async countComments(postId: number): Promise<void> {
    await this.postsFacade.countComments(postId);
  }

  async signOut(): Promise<void> {
    await this.authFacade.signOut();
    await this.router.navigate(['/sign-in']);
  }
}
