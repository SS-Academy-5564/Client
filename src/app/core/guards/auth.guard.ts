import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from '@core/services/token-storage.service';

export const authGuard = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (!tokenStorage.getToken()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
