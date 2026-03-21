import type { Page } from '@playwright/test';

export async function signIn(page: Page, userId: number): Promise<void> {
  await page.getByTestId('sign-in-user-id').fill(String(userId));
  await page.getByTestId('sign-in-submit').click();
}
