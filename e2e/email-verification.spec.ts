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
  resendStatus?: number;
};

type VerificationApiRequests = {
  registrationAcceptLanguage?: string;
  verificationBodies: unknown[];
  resendBodies: unknown[];
  expiredResendBodies: unknown[];
};

const mockVerificationApi = async (
  page: Page,
  options: VerificationApiOptions = {},
): Promise<VerificationApiRequests> => {
  const requests: VerificationApiRequests = {
    verificationBodies: [],
    resendBodies: [],
    expiredResendBodies: [],
  };

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
      requests.registrationAcceptLanguage = request.headers()['accept-language'];
      await fulfillJson(route, 200, {
        success: true,
        data: { resendCooldownSeconds: 47 },
        errors: [],
      });
      return;
    }

    if (path === '/api/auth/email-verification/verify') {
      requests.verificationBodies.push(request.postDataJSON());
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
      requests.resendBodies.push(request.postDataJSON());
      const status = options.resendStatus ?? 200;
      await fulfillJson(
        route,
        status,
        status === 200
          ? {
              success: true,
              data: { resendCooldownSeconds: 37 },
              errors: [],
            }
          : {
              success: false,
              data: null,
              errors: [{ code: 'RateLimited', field: null, message: 'Too many requests.' }],
            },
      );
      return;
    }

    if (path === '/api/auth/email-verification/resend-expired') {
      requests.expiredResendBodies.push(request.postDataJSON());
      await fulfillJson(route, 200, {
        success: true,
        data: { resendCooldownSeconds: 60 },
        errors: [],
      });
      return;
    }

    await fulfillJson(route, 404, { success: false, data: null, errors: [] });
  });

  return requests;
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

test('redirects successful registration to the check-email page', async ({ page }): Promise<void> => {
  const requests = await mockVerificationApi(page);
  await page.goto('/register');

  await page.getByLabel('First name').fill('Jane');
  await page.getByLabel('Last name').fill('Doe');
  await page.getByLabel('Email').fill('jane@example.com');
  await page.getByLabel('Password', { exact: true }).fill('StrongPass1');
  await page.getByLabel('Confirm Password').fill('StrongPass1');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/check-email$/);
  expect(requests.registrationAcceptLanguage).toBe('en-US');
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveCount(0);
  const resendCountdown = page.getByText(/Resend in \d+s/);
  await expect(resendCountdown).toBeVisible();
  const signInBox = await page.getByRole('button', { name: 'Sign in' }).boundingBox();
  const resendBox = await resendCountdown.boundingBox();
  expect(signInBox).not.toBeNull();
  expect(resendBox).not.toBeNull();
  expect(resendBox!.y).toBeGreaterThan(signInBox!.y);

  await page.evaluate(() => history.replaceState({ email: 'jane@example.com', cooldown: 0 }, '', location.href));
  await page.reload();
  await page.getByRole('button', { name: 'Resend Email' }).click();
  await expect(page.getByText('If eligible, a new verification email has been sent.')).toBeVisible();
  expect(requests.resendBodies).toEqual([{ email: 'jane@example.com' }]);
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Return to landing page' })).toHaveCount(0);
});

test('resends a verification email from the sign-in page', async ({ page }): Promise<void> => {
  const requests = await mockVerificationApi(page);
  await page.goto('/login');

  await page.getByLabel('Email').fill('jane@example.com');
  await page.getByRole('button', { name: 'Resend Email' }).click();

  await expect(page.getByText('If eligible, a new verification email has been sent.')).toBeVisible();
  expect(requests.resendBodies).toEqual([{ email: 'jane@example.com' }]);
  await expect(page.getByText('Resend in 37s')).toBeVisible();
});

test('shows a clear rate-limit message for verification resend', async ({ page }): Promise<void> => {
  const requests = await mockVerificationApi(page, { resendStatus: 429 });
  await page.goto('/login');

  await page.getByLabel('Email').fill('jane@example.com');
  await page.getByRole('button', { name: 'Resend Email' }).click();

  await expect(page.getByText('Please wait before trying again')).toBeVisible();
  expect(requests.resendBodies).toEqual([{ email: 'jane@example.com' }]);
});

test('shows successful verification for a valid link', async ({ page }): Promise<void> => {
  const requests = await mockVerificationApi(page);

  await page.goto('/verify-email?token=valid-token');

  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();
  expect(requests.verificationBodies).toEqual([{ token: 'valid-token' }]);
  await expect(page.getByText('You can now sign in to Pulse')).toBeVisible();
});

test('resends verification email from the expired-link state', async ({ page }): Promise<void> => {
  const requests = await mockVerificationApi(page, {
    verificationStatus: 400,
    verificationCode: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
  });

  await page.goto('/verify-email?token=expired-token');
  await expect(page.getByRole('heading', { name: 'Verification link expired' })).toBeVisible();
  expect(requests.verificationBodies).toEqual([{ token: 'expired-token' }]);
  await page.getByRole('button', { name: 'Resend email' }).click();

  await expect(page.getByText('A new verification email has been sent')).toBeVisible();
  expect(requests.expiredResendBodies).toEqual([{ token: 'expired-token' }]);
  await expect(page.getByRole('button', { name: 'Email sent' })).toBeDisabled();
});

test('shows the invalid state for a corrupted or previously used link', async ({ page }): Promise<void> => {
  const requests = await mockVerificationApi(page, {
    verificationStatus: 409,
    verificationCode: 'EMAIL_VERIFICATION_TOKEN_ALREADY_USED',
  });

  await page.goto('/verify-email?token=used-token');

  await expect(page.getByRole('heading', { name: 'Invalid verification link' })).toBeVisible();
  expect(requests.verificationBodies).toEqual([{ token: 'used-token' }]);
  await expect(page.getByText('invalid or has already been used')).toBeVisible();
});

test('keeps the check-email page within a mobile viewport', async ({ page }): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockVerificationApi(page);

  await page.goto('/register');
  await page.evaluate(() => history.replaceState({ email: 'jane@example.com', cooldown: 60 }, '', '/check-email'));
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});
