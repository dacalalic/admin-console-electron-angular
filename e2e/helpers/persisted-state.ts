import type { Page } from '@playwright/test';

export interface PersistedUser {
  id: number;
  name: string;
  email: string;
}

export interface PersistedPost {
  id: number;
  userId: number;
  title: string;
  body: string;
  comments: number | null;
}

export async function resetPersistedSession(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const electronApi = (window as Window & { electronApi: { clearSession: () => Promise<void> } })
      .electronApi;
    await electronApi.clearSession();
  });
}

export async function seedPersistedSession(page: Page, user: PersistedUser): Promise<void> {
  await page.evaluate(async (sessionUser) => {
    const electronApi = (
      window as Window & {
        electronApi: { saveSession: (nextUser: PersistedUser) => Promise<void> };
      }
    ).electronApi;
    await electronApi.saveSession(sessionUser);
  }, user);
}

export async function seedPersistedPosts(page: Page, posts: PersistedPost[]): Promise<void> {
  await page.evaluate(async (nextPosts) => {
    const electronApi = (
      window as Window & {
        electronApi: { savePosts: (persistedPosts: PersistedPost[]) => Promise<void> };
      }
    ).electronApi;
    await electronApi.savePosts(nextPosts);
  }, posts);
}
