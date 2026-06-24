import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const loggedOutOnlyGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? router.createUrlTree(['/']) : true;
};
