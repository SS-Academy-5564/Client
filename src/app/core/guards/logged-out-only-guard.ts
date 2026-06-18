import { CanActivateFn, Router } from '@angular/router';

export const loggedOutOnlyGuard: CanActivateFn = (route, state) => {
   // TODO: implement after auth (token-based login is added)
  return true;
};
