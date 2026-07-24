import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { TokenStorageService } from '@core/services/token-storage.service';
import { OrganizationService } from '../services/organization.service';
import { UrlTree } from '@angular/router';
import { ROUTES } from '../constants/route.constants';

export const noOrganizationGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenStorageService = inject(TokenStorageService);
  const organizationService = inject(OrganizationService);

  return organizationService.getDefaultOrganizationId().pipe(
    map((defaultOrganizationId): boolean | UrlTree => {
      const organizationId = tokenStorageService.organizationId();
      return organizationId?.toLowerCase() === defaultOrganizationId.toLowerCase()
        ? true
        : router.createUrlTree([ROUTES.OVERVIEW]);
    }),
  );
};
