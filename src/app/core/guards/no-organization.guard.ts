import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_ORGANIZATION_ID } from '@constants/organization.constants';
import { CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

export const noOrganizationGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenStorageService = inject(TokenStorageService);

  const organizationId = tokenStorageService.organizationId();

  return organizationId?.toLowerCase() === DEFAULT_ORGANIZATION_ID ? true : router.createUrlTree(['/overview']);
};
