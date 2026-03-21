import type { Page, Route } from '@playwright/test';

export interface MockUserDto {
  id: number;
  name: string;
  email: string;
}

export interface MockPostDto {
  id: number;
  userId: number;
  title: string;
  body: string;
}

function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockUserResponses(
  page: Page,
  usersById: Record<number, MockUserDto | null>,
): Promise<void> {
  await page.route('https://jsonplaceholder.typicode.com/users/*', async (route) => {
    const url = new URL(route.request().url());
    const userId = Number(url.pathname.split('/').at(-1));
    const user = usersById[userId];

    if (!user) {
      await fulfillJson(route, 404, {});
      return;
    }

    await fulfillJson(route, 200, user);
  });
}

export async function mockPostsResponses(
  page: Page,
  postsByUserId: Record<number, MockPostDto[]>,
): Promise<void> {
  await page.route('https://jsonplaceholder.typicode.com/posts**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname !== '/posts') {
      await route.fallback();
      return;
    }

    const userId = Number(url.searchParams.get('userId'));
    await fulfillJson(route, 200, postsByUserId[userId] ?? []);
  });
}

export async function mockCommentsCountResponses(
  page: Page,
  commentsCountByPostId: Record<number, number>,
): Promise<void> {
  await page.route('https://jsonplaceholder.typicode.com/comments**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname !== '/comments') {
      await route.fallback();
      return;
    }

    const postId = Number(url.searchParams.get('postId'));
    const commentsCount = commentsCountByPostId[postId] ?? 0;
    const comments = Array.from({ length: commentsCount }, (_, index) => ({ id: index + 1 }));

    await fulfillJson(route, 200, comments);
  });
}
