import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UserService } from '@core/services/user.service';
import { DEFAULT_ORGANIZATION_ID } from '@constants/organization.constants';
import { CanActivateFn } from '@angular/router';

export const noOrganizationGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.getMyOrganizations().pipe(
    map((res) => {
      const organizations = res.data;

      const organization = organizations.find(
        (o) => o.organizationId.toLowerCase() !== DEFAULT_ORGANIZATION_ID.toLowerCase(),
      );

      return organization ? router.createUrlTree(['/overview']) : true;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
