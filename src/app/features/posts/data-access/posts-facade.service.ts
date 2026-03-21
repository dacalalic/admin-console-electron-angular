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
  private readonly postsApiService = inject(PostsApiService);
  private readonly desktopService = inject(DesktopService);
  private readonly authFacade = inject(AuthFacade);
  private readonly logger = inject(LoggerService);

  private readonly postsSignal = signal<Post[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly errorMessageSignal = signal('');
  private readonly countingPostIdsSignal = signal<number[]>([]);

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
        return;
      }

      const apiPosts = await firstValueFrom(this.postsApiService.getPostsByUserId(currentUser.id));

      await this.desktopService.savePosts(apiPosts);
      this.postsSignal.set(apiPosts);
      this.logger.info('app-flow', 'Loaded posts from HTTP API and cached to database.', {
        userId: currentUser.id,
        postsCount: apiPosts.length,
      });
    } catch {
      this.postsSignal.set([]);
      this.errorMessageSignal.set('Failed to load posts.');
      this.logger.error('app-flow', 'Posts loading failed.', { userId: currentUser.id });
    } finally {
      this.isLoadingSignal.set(false);
    }
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
}
