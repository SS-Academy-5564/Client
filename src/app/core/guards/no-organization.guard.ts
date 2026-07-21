import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { UserService } from '@core/services/user.service';
import { CanActivateFn } from '@angular/router';
import { OrganizationService } from '../services/organization.service';

export const noOrganizationGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const organizationService = inject(OrganizationService);
  const router = inject(Router);

  return forkJoin({
    organizations: userService.getMyOrganizations(),
    defaultOrganization: organizationService.getDefaultOrganization(),
  }).pipe(
    map(({ organizations, defaultOrganization }) => {
      const organization = organizations.data.some(
        (o) => o.organizationId.toLowerCase() !== defaultOrganization.data.defaultOrganizationId.toLowerCase(),
      );

      return organization ? router.createUrlTree(['/overview']) : true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/login']));
    }),
  );
};
