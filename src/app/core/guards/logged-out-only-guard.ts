import { CanActivateFn } from '@angular/router';

export const loggedOutOnlyGuard: CanActivateFn = (route, state) => {
  return true;
};
