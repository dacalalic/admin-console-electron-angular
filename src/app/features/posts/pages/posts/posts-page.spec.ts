import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthFacade } from '../../../auth/data-access/auth-facade.service';
import { PostsFacade } from '../../data-access/posts-facade.service';
import { PostsPageComponent } from './posts-page';

describe('PostsPageComponent', () => {
  let authFacadeMock: {
    currentUser: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  let postsFacadeMock: {
    loadPosts: ReturnType<typeof vi.fn>;
    stopAutoRefresh: ReturnType<typeof vi.fn>;
    countComments: ReturnType<typeof vi.fn>;
    posts: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    errorMessage: ReturnType<typeof signal>;
    isCountingComments: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authFacadeMock = {
      currentUser: vi.fn(() => ({
        id: 1,
        name: 'Tester',
        email: 'tester@example.com',
      })),
      signOut: vi.fn().mockResolvedValue(undefined),
    };
    postsFacadeMock = {
      loadPosts: vi.fn().mockResolvedValue(undefined),
      stopAutoRefresh: vi.fn(),
      countComments: vi.fn().mockResolvedValue(undefined),
      posts: signal([]),
      isLoading: signal(false),
      errorMessage: signal(''),
      isCountingComments: vi.fn(() => false),
    };
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [PostsPageComponent],
      providers: [
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: PostsFacade, useValue: postsFacadeMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  it('loads posts on init', async () => {
    const fixture = TestBed.createComponent(PostsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(postsFacadeMock.loadPosts).toHaveBeenCalledOnce();
  });

  it('sign out triggers facade and navigation', async () => {
    const fixture = TestBed.createComponent(PostsPageComponent);
    const component = fixture.componentInstance;

    await component.signOut();

    expect(postsFacadeMock.stopAutoRefresh).toHaveBeenCalledOnce();
    expect(authFacadeMock.signOut).toHaveBeenCalledOnce();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/sign-in']);
  });

  it('count comments button triggers the facade', async () => {
    postsFacadeMock.posts.set([
      {
        id: 42,
        userId: 1,
        title: 'Post title',
        body: 'Post body',
        comments: null,
      },
    ]);

    const fixture = TestBed.createComponent(PostsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.post-footer button') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(postsFacadeMock.countComments).toHaveBeenCalledWith(42);
  });

  it('search input filters displayed posts', async () => {
    postsFacadeMock.posts.set([
      {
        id: 1,
        userId: 1,
        title: 'Angular testing',
        body: 'Component tests',
        comments: null,
      },
      {
        id: 2,
        userId: 1,
        title: 'Database migration',
        body: 'SQLite updates',
        comments: null,
      },
    ]);

    const fixture = TestBed.createComponent(PostsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector('#post-search') as HTMLInputElement;
    searchInput.value = 'angular';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.post-card');
    const firstCardTitle = cards[0]?.querySelector('h2')?.textContent ?? '';

    expect(cards.length).toBe(1);
    expect(firstCardTitle).toContain('Angular testing');
  });
});
