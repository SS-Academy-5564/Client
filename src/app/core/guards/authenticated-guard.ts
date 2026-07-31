import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { ROUTES } from '@core/constants/route.constants';
import { AuthService, AuthState } from '@core/services/auth.service';

/**
 * Waits for session restoration, then allows authenticated navigation or redirects to login.
 *
 * @returns A guard result after authentication initialization reaches a final state.
 */
export const authenticatedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService
    .waitForInitialization()
    .pipe(map((state) => (state === AuthState.Authenticated ? true : router.createUrlTree([ROUTES.LOGIN]))));
};
