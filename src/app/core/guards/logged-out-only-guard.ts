import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

export const loggedOutOnlyGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);
  return tokenStorage.isAuthenticated() ? router.createUrlTree(['/']) : true;
};
