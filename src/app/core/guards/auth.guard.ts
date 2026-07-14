import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from '@core/services/token-storage.service';
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  return tokenStorage.getToken() ? true : router.createUrlTree(['/login']);
};
