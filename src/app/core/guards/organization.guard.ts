import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { OrganizationService } from '../services/organization.service';

export const organizationGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenStorageService = inject(TokenStorageService);
  const organizationService = inject(OrganizationService);

  return organizationService.getDefaultOrganizationId().pipe(
    map((defaultOrganizationId) => {
      const organizationId = tokenStorageService.organizationId();
      return organizationId?.toLowerCase() !== defaultOrganizationId.toLowerCase()
        ? true
        : router.createUrlTree(['/create-organization']);
    }),
  );
};
