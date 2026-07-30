import { expect, Page, Route, test } from '@playwright/test';

const corsHeaders = {
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-origin': 'http://localhost:4200',
};

const createJwt = (payload: Record<string, unknown>): string => {
  const encode = (value: Record<string, unknown>): string => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
};

const handlePreflight = async (route: Route): Promise<boolean> => {
  if (route.request().method() !== 'OPTIONS') {
    return false;
  }

  await route.fulfill({ status: 204, headers: corsHeaders });
  return true;
};

const fulfillJson = async (
  route: Route,
  status: number,
  body: object,
  headers: Record<string, string> = {},
): Promise<void> => {
  await route.fulfill({
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

const mockMissingRefreshSession = async (page: Page): Promise<() => number> => {
  let refreshCount = 0;

  await page.route('**/api/**', async (route): Promise<void> => {
    if (await handlePreflight(route)) {
      return;
    }

    if (new URL(route.request().url()).pathname === '/api/auth/refresh') {
      refreshCount += 1;
      await fulfillJson(route, 401, {
        success: false,
        data: null,
        errors: [{ code: 'Unauthorized', message: 'Refresh token is missing.' }],
      });
      return;
    }

    await fulfillJson(route, 404, { success: false, data: null, errors: [] });
  });

  return (): number => refreshCount;
};

test('leaves the user unauthenticated when reload has no refresh session', async ({ page }) => {
  const getRefreshCount = await mockMissingRefreshSession(page);

  await page.goto('/');

  await expect(page.locator('mat-card-title')).toHaveText('Sign in to your account');
  await expect(page).toHaveURL(/\/login$/);
  expect(getRefreshCount()).toBe(1);
});

test('restores the authenticated session after a page reload', async ({ context, page }) => {
  const accessToken = createJwt({
    sub: 'user-1',
    organization_id: 'organization-1',
    organization: 'Pulse Team',
    role: 'Admin',
    exp: Math.floor(Date.now() / 1_000) + 900,
  });
  let refreshCount = 0;

  await context.addCookies([
    {
      name: 'pulse_refresh_token',
      value: 'refresh-before-reload',
      domain: 'localhost',
      path: '/api/auth',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  await page.route('**/api/**', async (route): Promise<void> => {
    if (await handlePreflight(route)) {
      return;
    }

    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === '/api/auth/refresh') {
      refreshCount += 1;
      expect(request.method()).toBe('POST');
      expect(request.headers()['cookie']).toContain('pulse_refresh_token=');
      expect(request.headers()['authorization']).toBeUndefined();
      await fulfillJson(
        route,
        200,
        {
          success: true,
          data: {
            accessToken,
            expiresAt: new Date(Date.now() + 900_000).toISOString(),
          },
          errors: [],
        },
        {
          'set-cookie': 'pulse_refresh_token=rotated-refresh; Path=/api/auth; HttpOnly; SameSite=Lax',
        },
      );
      return;
    }

    expect(request.headers()['authorization']).toBe(`Bearer ${accessToken}`);

    if (path === '/api/users/me') {
      await fulfillJson(route, 200, {
        success: true,
        data: {
          id: 'user-1',
          email: 'jane@pulse.test',
          firstName: 'Jane',
          lastName: 'Doe',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        errors: [],
      });
      return;
    }

    if (path === '/api/organizations/default') {
      await fulfillJson(route, 200, {
        success: true,
        data: { defaultOrganizationId: 'default-organization' },
        errors: [],
      });
      return;
    }

    await fulfillJson(route, 404, { success: false, data: null, errors: [] });
  });

  await page.goto('/');

  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.locator('.user-name')).toHaveText('Jane Doe');
  expect(await page.evaluate((): string => document.cookie)).not.toContain('pulse_refresh_token');
  expect(refreshCount).toBe(1);

  await page.reload();

  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.locator('.user-name')).toHaveText('Jane Doe');
  expect(refreshCount).toBe(2);
});
