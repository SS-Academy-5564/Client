import { expect, test } from '@playwright/test';

test('displays the app title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('mat-card-title')).toHaveText('Angular Material + ngx-echarts');
});
