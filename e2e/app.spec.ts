import { expect, test } from '@playwright/test';

test('displays the app title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Hello, Client');
});
