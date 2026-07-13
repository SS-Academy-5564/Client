import { expect, test } from '@playwright/test';

test('displays the login title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('mat-card-title')).toHaveText('Sign in to your account');
});
