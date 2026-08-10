import { expect, Page, Route, test } from '@playwright/test';

const corsHeaders = {
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-origin': 'http://localhost:4200',
};

type VerificationApiOptions = {
  verificationStatus?: number;
  verificationCode?: string;
};

const mockVerificationApi = async (page: Page, options: VerificationApiOptions = {}): Promise<void> => {
  await page.route('**/api/**', async (route): Promise<void> => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === '/api/auth/refresh') {
      await fulfillJson(route, 401, {
        success: false,
        data: null,
        errors: [{ code: 'UNAUTHORIZED', field: null, message: 'Refresh token is missing.' }],
      });
      return;
    }

    if (path === '/api/auth/register') {
      await fulfillJson(route, 200, { success: true, data: null, errors: [] });
      return;
    }

    if (path === '/api/auth/email-verification/verify') {
      expect(request.postDataJSON()).toEqual({ token: expect.any(String) });
      const status = options.verificationStatus ?? 200;

      await fulfillJson(
        route,
        status,
        status === 200
          ? { success: true, data: null, errors: [] }
          : {
              success: false,
              data: null,
              errors: [
                {
                  code: options.verificationCode,
                  field: null,
                  message: 'Verification failed.',
                },
              ],
            },
      );
      return;
    }

    if (path === '/api/auth/email-verification/resend') {
      expect(request.postDataJSON()).toEqual({ token: 'expired-token' });
      await fulfillJson(route, 200, {
        success: true,
        data: { resendCooldownSeconds: 60 },
        errors: [],
      });
      return;
    }

    await fulfillJson(route, 404, { success: false, data: null, errors: [] });
  });
};

const fulfillJson = async (route: Route, status: number, body: object): Promise<void> => {
  await route.fulfill({
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

test('redirects successful registration to the check-email page', async ({ page }) => {
  await mockVerificationApi(page);
  await page.goto('/register');

  await page.getByLabel('First name').fill('Jane');
  await page.getByLabel('Last name').fill('Doe');
  await page.getByLabel('Email').fill('jane@example.com');
  await page.getByLabel('Password', { exact: true }).fill('StrongPass1');
  await page.getByLabel('Confirm Password').fill('StrongPass1');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/check-email$/);
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Return to landing page' })).toHaveCount(0);
});

test('shows successful verification for a valid link', async ({ page }) => {
  await mockVerificationApi(page);

  await page.goto('/verify-email?token=valid-token');

  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();
  await expect(page.getByText('You can now sign in to Pulse')).toBeVisible();
});

test('resends verification email from the expired-link state', async ({ page }) => {
  await mockVerificationApi(page, {
    verificationStatus: 400,
    verificationCode: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
  });

  await page.goto('/verify-email?token=expired-token');
  await expect(page.getByRole('heading', { name: 'Verification link expired' })).toBeVisible();
  await page.getByRole('button', { name: 'Resend email' }).click();

  await expect(page.getByText('A new verification email has been sent')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Email sent' })).toBeDisabled();
});

test('shows the invalid state for a corrupted or previously used link', async ({ page }) => {
  await mockVerificationApi(page, {
    verificationStatus: 409,
    verificationCode: 'EMAIL_VERIFICATION_TOKEN_ALREADY_USED',
  });

  await page.goto('/verify-email?token=used-token');

  await expect(page.getByRole('heading', { name: 'Invalid verification link' })).toBeVisible();
  await expect(page.getByText('invalid or has already been used')).toBeVisible();
});

test('keeps the check-email page within a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockVerificationApi(page);

  await page.goto('/check-email');

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});
