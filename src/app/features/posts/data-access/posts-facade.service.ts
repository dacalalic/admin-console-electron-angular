import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/logging/logger.service';
import { DesktopService } from '../../../core/services/desktop.service';
import { Post } from '../../../shared/models/post.model';
import { AuthFacade } from '../../auth/data-access/auth-facade.service';
import { PostsApiService } from './posts-api.service';

@Injectable({
  providedIn: 'root',
})
export class PostsFacade {
  private static readonly REFRESH_INTERVAL_MS = 10_000;

  private readonly postsApiService = inject(PostsApiService);
  private readonly desktopService = inject(DesktopService);
  private readonly authFacade = inject(AuthFacade);
  private readonly logger = inject(LoggerService);

  private readonly postsSignal = signal<Post[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly errorMessageSignal = signal('');
  private readonly countingPostIdsSignal = signal<number[]>([]);
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private isRefreshingFromServer = false;

  readonly posts = this.postsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessage = this.errorMessageSignal.asReadonly();
  readonly countingPostIds = this.countingPostIdsSignal.asReadonly();

  async loadPosts(): Promise<void> {
    const currentUser = this.authFacade.currentUser();

    if (!currentUser) {
      this.postsSignal.set([]);
      this.errorMessageSignal.set('No signed-in user.');
      this.logger.warn('app-flow', 'Cannot load posts without a signed-in user.');
      return;
    }

    this.logger.info('app-flow', 'Loading posts started.', { userId: currentUser.id });
    this.isLoadingSignal.set(true);
    this.errorMessageSignal.set('');

    try {
      const savedPosts = await this.desktopService.getPostsByUserId(currentUser.id);

      if (savedPosts.length > 0) {
        this.postsSignal.set(savedPosts);
        this.logger.info('app-flow', 'Loaded posts from local database cache.', {
          userId: currentUser.id,
          postsCount: savedPosts.length,
        });
      }
    } catch {
      this.logger.error('app-flow', 'Loading posts from local cache failed.', {
        userId: currentUser.id,
      });
    }

    try {
      await this.syncPostsFromServer(currentUser.id);
      this.startAutoRefresh(currentUser.id);
    } catch {
      if (this.postsSignal().length === 0) {
        this.errorMessageSignal.set('Failed to load posts.');
      }
      this.logger.error('app-flow', 'Posts loading failed.', { userId: currentUser.id });
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  stopAutoRefresh(): void {
    if (this.refreshIntervalId === null) {
      return;
    }

    clearInterval(this.refreshIntervalId);
    this.refreshIntervalId = null;
    this.logger.info('app-flow', 'Stopped automatic server refresh for posts.');
  }

  isCountingComments(postId: number): boolean {
    return this.countingPostIdsSignal().includes(postId);
  }

  async countComments(postId: number): Promise<void> {
    this.logger.info('app-flow', 'Comments count request started.', { postId });
    this.errorMessageSignal.set('');
    this.countingPostIdsSignal.update((ids) => [...ids, postId]);

    try {
      const commentsCount = await firstValueFrom(
        this.postsApiService.getCommentsCountByPostId(postId),
      );

      this.postsSignal.update((posts) =>
        posts.map((post) => (post.id === postId ? { ...post, comments: commentsCount } : post)),
      );

      await this.desktopService.updatePostComments(postId, commentsCount);
      this.logger.info('app-flow', 'Comments count completed successfully.', {
        postId,
        commentsCount,
      });
    } catch {
      this.errorMessageSignal.set(`Failed to count comments for post ${postId}.`);
      this.logger.error('app-flow', 'Comments count failed.', { postId });
    } finally {
      this.countingPostIdsSignal.update((ids) => ids.filter((id) => id !== postId));
    }
  }

  private startAutoRefresh(userId: number): void {
    if (this.refreshIntervalId !== null) {
      return;
    }

    this.refreshIntervalId = setInterval(() => {
      void this.syncPostsFromServer(userId).catch(() => {
        this.errorMessageSignal.set('Failed to refresh posts from server.');
      });
    }, PostsFacade.REFRESH_INTERVAL_MS);

    this.logger.info('app-flow', 'Started automatic server refresh for posts.', {
      userId,
      intervalMs: PostsFacade.REFRESH_INTERVAL_MS,
    });
  }

  private async syncPostsFromServer(userId: number): Promise<void> {
    if (this.isRefreshingFromServer) {
      return;
    }

    this.isRefreshingFromServer = true;

    try {
      const apiPosts = await firstValueFrom(this.postsApiService.getPostsByUserId(userId));
      await this.desktopService.savePosts(apiPosts);
      const persistedPosts = await this.desktopService.getPostsByUserId(userId);
      this.postsSignal.set(persistedPosts);
      this.errorMessageSignal.set('');
      this.logger.info('app-flow', 'Refetched posts from server and cached them.', {
        userId,
        postsCount: persistedPosts.length,
      });
    } catch {
      this.logger.error('app-flow', 'Server refetch for posts failed.', { userId });
      throw new Error('Failed to refetch posts.');
    } finally {
      this.isRefreshingFromServer = false;
    }
  }

}
