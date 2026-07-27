import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { ROUTES } from '@core/constants/route.constants';

export const authenticatedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);

  return tokenStorage.isAuthenticated() ? true : router.createUrlTree([ROUTES.LOGIN]);
};
