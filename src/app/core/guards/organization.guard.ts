import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { UserService } from '@core/services/user.service';
import { OrganizationService } from '../services/organization.service';

export const organizationGuard: CanActivateFn = () => {
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

      return organization ? true : router.createUrlTree(['/create-organization']);
    }),
    catchError(() => {
      return of(router.createUrlTree(['/login']));
    }),
  );
};
