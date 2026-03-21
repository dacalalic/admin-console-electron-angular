import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LoggerService } from '../../../core/logging/logger.service';
import { DesktopService } from '../../../core/services/desktop.service';
import { Post } from '../../../shared/models/post.model';
import { User } from '../../../shared/models/user.model';
import { AuthFacade } from '../../auth/data-access/auth-facade.service';
import { PostsApiService } from './posts-api.service';
import { PostsFacade } from './posts-facade.service';

describe('PostsFacade', () => {
  let facade: PostsFacade;
  let postsApiServiceMock: {
    getPostsByUserId: ReturnType<typeof vi.fn>;
    getCommentsCountByPostId: ReturnType<typeof vi.fn>;
  };
  let desktopServiceMock: {
    getPostsByUserId: ReturnType<typeof vi.fn>;
    savePosts: ReturnType<typeof vi.fn>;
    updatePostComments: ReturnType<typeof vi.fn>;
  };
  let authFacadeMock: {
    currentUser: ReturnType<typeof vi.fn>;
  };
  let loggerServiceMock: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const signedInUser: User = {
    id: 10,
    name: 'Posts User',
    email: 'posts@example.com',
  };

  const persistedPosts: Post[] = [
    {
      id: 101,
      userId: 10,
      title: 'Cached Title',
      body: 'Cached Body',
      comments: null,
    },
  ];

  const apiPosts: Post[] = [
    {
      id: 102,
      userId: 10,
      title: 'API Title',
      body: 'API Body',
      comments: null,
    },
  ];

  beforeEach(() => {
    postsApiServiceMock = {
      getPostsByUserId: vi.fn().mockReturnValue(of([])),
      getCommentsCountByPostId: vi.fn().mockReturnValue(of(0)),
    };
    desktopServiceMock = {
      getPostsByUserId: vi.fn().mockResolvedValue([]),
      savePosts: vi.fn().mockResolvedValue(undefined),
      updatePostComments: vi.fn().mockResolvedValue(undefined),
    };
    authFacadeMock = {
      currentUser: vi.fn().mockReturnValue(signedInUser),
    };
    loggerServiceMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PostsFacade,
        { provide: PostsApiService, useValue: postsApiServiceMock },
        { provide: DesktopService, useValue: desktopServiceMock },
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: LoggerService, useValue: loggerServiceMock },
      ],
    });

    facade = TestBed.inject(PostsFacade);
  });

  afterEach(() => {
    facade.stopAutoRefresh();
  });

  async function seedPostsForCounting(posts: Post[]): Promise<void> {
    desktopServiceMock.getPostsByUserId.mockResolvedValueOnce(posts).mockResolvedValueOnce(posts);
    postsApiServiceMock.getPostsByUserId.mockReturnValue(of(posts));
    await facade.loadPosts();
    vi.clearAllMocks();
  }

  it('loadPosts with no signed-in user keeps posts empty and sets user error', async () => {
    authFacadeMock.currentUser.mockReturnValue(null);

    await facade.loadPosts();

    expect(facade.posts()).toEqual([]);
    expect(facade.errorMessage()).toBe('No signed-in user.');
    expect(facade.isLoading()).toBe(false);
    expect(desktopServiceMock.getPostsByUserId).not.toHaveBeenCalled();
    expect(postsApiServiceMock.getPostsByUserId).not.toHaveBeenCalled();
  });

  it('loadPosts loads persisted posts when available', async () => {
    desktopServiceMock.getPostsByUserId
      .mockResolvedValueOnce(persistedPosts)
      .mockResolvedValueOnce(persistedPosts);
    postsApiServiceMock.getPostsByUserId.mockReturnValue(of(persistedPosts));

    await facade.loadPosts();

    expect(desktopServiceMock.getPostsByUserId).toHaveBeenNthCalledWith(1, signedInUser.id);
    expect(facade.posts()).toEqual(persistedPosts);
    expect(facade.errorMessage()).toBe('');
  });

  it('loadPosts fetches posts from API when persisted posts are missing', async () => {
    desktopServiceMock.getPostsByUserId.mockResolvedValueOnce([]).mockResolvedValueOnce(apiPosts);
    postsApiServiceMock.getPostsByUserId.mockReturnValue(of(apiPosts));

    await facade.loadPosts();

    expect(postsApiServiceMock.getPostsByUserId).toHaveBeenCalledWith(signedInUser.id);
    expect(facade.posts()).toEqual(apiPosts);
  });

  it('loadPosts saves fetched posts to persistence', async () => {
    desktopServiceMock.getPostsByUserId.mockResolvedValueOnce([]).mockResolvedValueOnce(apiPosts);
    postsApiServiceMock.getPostsByUserId.mockReturnValue(of(apiPosts));

    await facade.loadPosts();

    expect(desktopServiceMock.savePosts).toHaveBeenCalledOnce();
    expect(desktopServiceMock.savePosts).toHaveBeenCalledWith(apiPosts);
  });

  it('loadPosts sets loading and error state correctly on server failure', async () => {
    let resolveCachedPosts: ((posts: Post[]) => void) | undefined;
    const cachedPostsPromise = new Promise<Post[]>((resolve) => {
      resolveCachedPosts = resolve;
    });

    desktopServiceMock.getPostsByUserId.mockReturnValueOnce(cachedPostsPromise);
    postsApiServiceMock.getPostsByUserId.mockReturnValue(
      throwError(() => new Error('Server unavailable')),
    );

    const loadPromise = facade.loadPosts();

    expect(facade.isLoading()).toBe(true);
    expect(facade.errorMessage()).toBe('');

    resolveCachedPosts?.([]);
    await loadPromise;

    expect(facade.isLoading()).toBe(false);
    expect(facade.errorMessage()).toBe('Failed to load posts.');
  });

  it('countComments marks a post as counting, updates state, persists, and clears counting state', async () => {
    await seedPostsForCounting(persistedPosts);

    const commentsCount$ = new Subject<number>();
    postsApiServiceMock.getCommentsCountByPostId.mockReturnValue(commentsCount$.asObservable());

    const countPromise = facade.countComments(persistedPosts[0].id);

    expect(facade.isCountingComments(persistedPosts[0].id)).toBe(true);

    commentsCount$.next(7);
    commentsCount$.complete();
    await countPromise;

    expect(postsApiServiceMock.getCommentsCountByPostId).toHaveBeenCalledWith(persistedPosts[0].id);
    expect(desktopServiceMock.updatePostComments).toHaveBeenCalledWith(persistedPosts[0].id, 7);
    expect(facade.posts()[0].comments).toBe(7);
    expect(facade.isCountingComments(persistedPosts[0].id)).toBe(false);
  });

  it('countComments failure handles error and clears counting state', async () => {
    await seedPostsForCounting(persistedPosts);

    const commentsCount$ = new Subject<number>();
    postsApiServiceMock.getCommentsCountByPostId.mockReturnValue(commentsCount$.asObservable());

    const postId = persistedPosts[0].id;
    const countPromise = facade.countComments(postId);

    expect(facade.isCountingComments(postId)).toBe(true);

    commentsCount$.error(new Error('Counting failed'));
    await countPromise;

    expect(desktopServiceMock.updatePostComments).not.toHaveBeenCalled();
    expect(facade.errorMessage()).toBe(`Failed to count comments for post ${postId}.`);
    expect(facade.isCountingComments(postId)).toBe(false);
  });
});
