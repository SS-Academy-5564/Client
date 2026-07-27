import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from '@core/services/token-storage.service';
import { CanActivateFn } from '@angular/router';
import { ROUTES } from '@core/constants/route.constants';

export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  return tokenStorage.getToken() ? true : router.createUrlTree([ROUTES.LOGIN]);
};
