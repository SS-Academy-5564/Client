import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from '@core/services/token-storage.service';
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (!tokenStorage.getToken()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
