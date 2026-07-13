import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { UserService } from '@core/services/user.service';
import { DEFAULT_ORGANIZATION_ID } from '@constants/organization.constants';

export const noOrganizationGuard = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.getMyOrganizations().pipe(
    map((res) => {
      const organizations = res.data;

      const organization = organizations.find(
        (o) => o.organizationId.toLowerCase() !== DEFAULT_ORGANIZATION_ID.toLowerCase(),
      );

      if (organization) {
        router.navigate(['/overview']);

        return false;
      }

      return true;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
