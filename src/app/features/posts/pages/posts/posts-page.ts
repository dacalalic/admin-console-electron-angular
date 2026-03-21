import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '../../../auth/data-access/auth-facade.service';
import { PostsFacade } from '../../data-access/posts-facade.service';

@Component({
  selector: 'app-posts-page',
  template: `
    <main class="posts-shell">
      <section class="posts-panel">
        <header class="panel-header">
          <div>
            <p class="eyebrow">Dashboard</p>
            <h1>Posts</h1>
            @if (authFacade.currentUser(); as user) {
              <p class="user-meta">Signed in as <strong>{{ user.name }}</strong> · {{ user.email }}</p>
            }
          </div>

          <button class="ghost" type="button" (click)="signOut()">Sign out</button>
        </header>

        @if (postsFacade.isLoading()) {
          <p class="status loading">Loading posts...</p>
        }

        @if (postsFacade.errorMessage()) {
          <p class="status error">{{ postsFacade.errorMessage() }}</p>
        }

        <div class="search-wrap">
          <label for="post-search">Search posts</label>
          <input
            id="post-search"
            type="search"
            placeholder="Search by title or body..."
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
          />
        </div>

        @if (filteredPosts().length > 0) {
          <ul class="posts-grid">
            @for (post of filteredPosts(); track post.id) {
              <li class="post-card">
                <article>
                  <h2>{{ post.title }}</h2>
                  <p class="post-body">{{ post.body }}</p>

                  <div class="post-footer">
                    <p class="comment-count">
                      Comments: <strong>{{ post.comments ?? 'Not counted yet' }}</strong>
                    </p>
                    <button
                      type="button"
                      [disabled]="postsFacade.isCountingComments(post.id)"
                      (click)="countComments(post.id)"
                    >
                      {{ postsFacade.isCountingComments(post.id) ? 'Counting...' : 'Count Comments' }}
                    </button>
                  </div>
                </article>
              </li>
            }
          </ul>
        } @else if (!postsFacade.isLoading() && postsFacade.posts().length > 0) {
          <p class="status">No posts match your search.</p>
        } @else if (!postsFacade.isLoading()) {
          <p class="status">No posts found.</p>
        }
      </section>
    </main>
  `,
  styles: [
    `
      .posts-shell {
        min-height: 100dvh;
        padding: 1.4rem 1rem 1.8rem;
      }

      .posts-panel {
        width: min(1080px, 100%);
        margin: 0 auto;
        background: rgba(255, 253, 248, 0.9);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-soft);
        padding: 1.3rem;
        animation: rise-in 260ms ease-out;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        margin-bottom: 1.15rem;
      }

      .eyebrow {
        margin: 0;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--brand-strong);
        font-weight: 700;
      }

      h1 {
        margin: 0.2rem 0 0.35rem;
        font-size: clamp(1.45rem, 4.7vw, 2.2rem);
      }

      .user-meta {
        margin: 0;
        color: var(--text-muted);
      }

      .ghost {
        border: 1px solid #b6bfb5;
        background: rgba(255, 255, 255, 0.84);
        border-radius: 11px;
        padding: 0.58rem 0.78rem;
        color: var(--text-strong);
        cursor: pointer;
        transition: background-color 140ms ease;
      }

      .ghost:hover {
        background: #f0f4ee;
      }

      .status {
        margin: 0.55rem 0;
        padding: 0.72rem 0.9rem;
        border-radius: 10px;
        background: var(--surface-muted);
        color: var(--text-muted);
      }

      .status.loading {
        border-left: 4px solid #5d866f;
      }

      .status.error {
        color: var(--danger);
        border: 1px solid #f2c7bf;
        background: #fff2ef;
      }

      .search-wrap {
        margin-top: 0.85rem;
        display: grid;
        gap: 0.45rem;
      }

      .search-wrap label {
        font-size: 0.84rem;
        color: var(--text-muted);
        font-weight: 600;
      }

      .search-wrap input {
        border: 1px solid #bfc6bd;
        background: rgba(255, 255, 255, 0.88);
        color: var(--text-strong);
        border-radius: 11px;
        padding: 0.66rem 0.8rem;
        outline: none;
        transition: border-color 160ms ease, box-shadow 160ms ease;
      }

      .search-wrap input:focus {
        border-color: var(--brand);
        box-shadow: 0 0 0 3px rgba(31, 143, 99, 0.2);
      }

      .posts-grid {
        margin: 1rem 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.9rem;
      }

      .post-card {
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-card);
        padding: 1rem;
        transition: transform 160ms ease, box-shadow 160ms ease;
      }

      .post-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 24px rgba(31, 42, 33, 0.11);
      }

      h2 {
        margin: 0;
        font-size: clamp(1.02rem, 3.7vw, 1.2rem);
      }

      .post-body {
        margin: 0.55rem 0 0.85rem;
        line-height: 1.48;
        color: #37443a;
      }

      .post-footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
      }

      .comment-count {
        margin: 0;
        color: var(--text-muted);
      }

      button {
        border: none;
        border-radius: 10px;
        background: linear-gradient(120deg, var(--brand), #259f71);
        color: #f9fffb;
        font-weight: 700;
        padding: 0.6rem 0.9rem;
        cursor: pointer;
        transition: transform 140ms ease, filter 140ms ease;
      }

      button:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.03);
      }

      button:disabled {
        cursor: wait;
        opacity: 0.6;
      }

      @media (min-width: 800px) {
        .posts-shell {
          padding: 2rem 1.4rem;
        }

        .posts-panel {
          padding: 1.6rem;
        }

        .posts-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
})
export class PostsPageComponent implements OnInit, OnDestroy {
  protected readonly authFacade = inject(AuthFacade);
  protected readonly postsFacade = inject(PostsFacade);
  protected readonly searchQuery = signal('');
  protected readonly filteredPosts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const posts = this.postsFacade.posts();

    if (!query) {
      return posts;
    }

    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) || post.body.toLowerCase().includes(query),
    );
  });

  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.postsFacade.loadPosts();
  }

  ngOnDestroy(): void {
    this.postsFacade.stopAutoRefresh();
  }

  async countComments(postId: number): Promise<void> {
    await this.postsFacade.countComments(postId);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchQuery.set(target?.value ?? '');
  }

  async signOut(): Promise<void> {
    this.postsFacade.stopAutoRefresh();
    await this.authFacade.signOut();
    await this.router.navigate(['/sign-in']);
  }
}
