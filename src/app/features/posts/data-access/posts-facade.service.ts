import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMessageSignal.set('');

    try {
      const savedPosts = await this.desktopService.getPostsByUserId(currentUser.id);

      if (savedPosts.length > 0) {
        this.postsSignal.set(savedPosts);
        return;
      }

      const apiPosts = await firstValueFrom(this.postsApiService.getPostsByUserId(currentUser.id));

      await this.desktopService.savePosts(apiPosts);
      this.postsSignal.set(apiPosts);
    } catch {
      this.postsSignal.set([]);
      this.errorMessageSignal.set('Failed to load posts.');
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  isCountingComments(postId: number): boolean {
    return this.countingPostIdsSignal().includes(postId);
  }

  async countComments(postId: number): Promise<void> {
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
    } catch {
      this.errorMessageSignal.set(`Failed to count comments for post ${postId}.`);
    } finally {
      this.countingPostIdsSignal.update((ids) => ids.filter((id) => id !== postId));
    }
  }
}
