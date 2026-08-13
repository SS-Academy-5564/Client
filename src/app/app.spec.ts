import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { loggedOutOnlyGuard } from '@core/guards/logged-out-only-guard';
import { App } from './app';
import { routes } from './app.routes';

describe('App', (): void => {
  it('should create the app', (): void => {
    const app = new App();
    expect(app).toBeTruthy();
  });

  it('should prevent signed-in users from opening the email verification route', (): void => {
    const verifyEmailRoute = routes.find((route) => route.path === 'verify-email');

    expect(verifyEmailRoute?.canActivate).toContain(loggedOutOnlyGuard);
  });
});
