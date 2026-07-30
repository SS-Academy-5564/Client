import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '@core/services/auth.service';

/**
 * Waits for session restoration, then prevents authenticated users from opening logged-out-only pages.
 *
 * @returns A guard result after authentication initialization reaches a final state.
 */
export const loggedOutOnlyGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService
    .waitForInitialization()
    .pipe(map((state) => (state === 'authenticated' ? router.createUrlTree(['/']) : true)));
};
