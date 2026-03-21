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

  readonly posts = this.postsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessage = this.errorMessageSignal.asReadonly();

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
      const posts = await firstValueFrom(this.postsApiService.getPostsByUserId(currentUser.id));

      this.postsSignal.set(posts);
      await this.desktopService.savePosts(posts);
    } catch {
      const savedPosts = await this.desktopService.getPostsByUserId(currentUser.id);

      if (savedPosts.length > 0) {
        this.postsSignal.set(savedPosts);
        this.errorMessageSignal.set('Showing saved posts because refresh failed.');
      } else {
        this.postsSignal.set([]);
        this.errorMessageSignal.set('Failed to load posts.');
      }
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
}
