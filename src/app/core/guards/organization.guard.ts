import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { CanActivateFn } from '@angular/router';
import { TokenStorageService } from '@core/services/token-storage.service';
import { OrganizationService } from '@core/services/organization.service';
import { UrlTree } from '@angular/router';
import { ROUTES } from '../constants/route.constants';

export const organizationGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenStorageService = inject(TokenStorageService);
  const organizationService = inject(OrganizationService);

  return organizationService.getDefaultOrganizationId().pipe(
    map((defaultOrganizationId): boolean | UrlTree => {
      const organizationId = tokenStorageService.organizationId();
      return organizationId?.toLowerCase() !== defaultOrganizationId.toLowerCase()
        ? true
        : router.createUrlTree([ROUTES.CREATE_ORGANIZATION]);
    }),
  );
};
