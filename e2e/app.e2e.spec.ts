import { expect, test } from './fixtures/electron-app';
import { signIn } from './helpers/auth';
import {
  mockCommentsCountResponses,
  mockPostsResponses,
  mockUserResponses,
} from './helpers/http-mocks';
import { resetPersistedSession } from './helpers/persisted-state';

const testUser = {
  id: 1,
  name: 'Playwright User',
  email: 'playwright@example.com',
};

test.beforeEach(async ({ appWindow }) => {
  await resetPersistedSession(appWindow);
});

test('successful sign in', async ({ appWindow }) => {
  await mockUserResponses(appWindow, { 1: testUser });
  await mockPostsResponses(appWindow, {
    1: [
      {
        id: 101,
        userId: 1,
        title: 'Alpha post',
        body: 'Alpha post body',
      },
    ],
  });
  await mockCommentsCountResponses(appWindow, {});

  await expect(appWindow.getByRole('heading', { name: 'Admin Console' })).toBeVisible();
  await signIn(appWindow, 1);

  await expect(appWindow).toHaveURL(/\/posts$/);
  await expect(appWindow.getByRole('heading', { name: 'Posts' })).toBeVisible();
  await expect(appWindow.getByText('Signed in as')).toContainText('Playwright User');
});

test('failed sign in', async ({ appWindow }) => {
  await mockUserResponses(appWindow, {});
  await mockPostsResponses(appWindow, {});
  await mockCommentsCountResponses(appWindow, {});

  await expect(appWindow.getByRole('heading', { name: 'Admin Console' })).toBeVisible();
  await signIn(appWindow, 999);

  await expect(appWindow).toHaveURL(/\/sign-in$/);
  await expect(appWindow.getByTestId('sign-in-error')).toContainText('User not found.');
});

test('count comments for one post', async ({ appWindow }) => {
  await mockUserResponses(appWindow, { 1: testUser });
  await mockPostsResponses(appWindow, {
    1: [
      {
        id: 201,
        userId: 1,
        title: 'Comments target',
        body: 'Count comments for this post',
      },
    ],
  });
  await mockCommentsCountResponses(appWindow, { 201: 3 });

  await signIn(appWindow, 1);
  await expect(appWindow).toHaveURL(/\/posts$/);

  const postCard = appWindow.getByTestId('post-card').filter({ hasText: 'Comments target' });
  await expect(postCard).toHaveCount(1);
  await expect(postCard.getByTestId('post-comments-count')).toContainText('Not counted yet');

  await postCard.getByTestId('count-comments-button').click();

  await expect(postCard.getByTestId('post-comments-count')).toContainText(/Comments:\s*3/);
});

test('search posts', async ({ appWindow }) => {
  await mockUserResponses(appWindow, { 1: testUser });
  await mockPostsResponses(appWindow, {
    1: [
      {
        id: 301,
        userId: 1,
        title: 'Angular testing',
        body: 'Component tests and fixtures',
      },
      {
        id: 302,
        userId: 1,
        title: 'Database operations',
        body: 'SQLite posts cache',
      },
    ],
  });
  await mockCommentsCountResponses(appWindow, {});

  await signIn(appWindow, 1);
  await expect(appWindow).toHaveURL(/\/posts$/);

  await appWindow.getByTestId('posts-search-input').fill('angular');

  const postCards = appWindow.getByTestId('post-card');
  await expect(postCards).toHaveCount(1);
  await expect(postCards.first()).toContainText('Angular testing');
});

test('sign out', async ({ appWindow }) => {
  await mockUserResponses(appWindow, { 1: testUser });
  await mockPostsResponses(appWindow, {
    1: [
      {
        id: 401,
        userId: 1,
        title: 'Sign-out post',
        body: 'Used for sign-out test',
      },
    ],
  });
  await mockCommentsCountResponses(appWindow, {});

  await signIn(appWindow, 1);
  await expect(appWindow).toHaveURL(/\/posts$/);

  await appWindow.getByTestId('posts-sign-out').click();

  await expect(appWindow).toHaveURL(/\/sign-in$/);
  await expect(appWindow.getByRole('heading', { name: 'Admin Console' })).toBeVisible();
});
