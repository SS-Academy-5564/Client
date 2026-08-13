import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';

import { ROUTES } from '@core/constants/route.constants';
import { AuthService, AuthState } from '@core/services/auth.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { environment } from '@environments/environment';

const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);
const API_ROOT = environment.apiBaseUrl.replace(/\/+$/, '');
const AUTH_ROOT = `${API_ROOT}/auth`;
const PUBLIC_AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.CHECK_EMAIL,
  ROUTES.VERIFY_EMAIL,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.VERIFY_CODE,
  ROUTES.RESET_PASSWORD,
  ROUTES.RESET_SUCCESS,
];

/**
 * Adds in-memory access tokens to protected API calls and retries one authentication failure after a shared refresh.
 *
 * @param request Outgoing HTTP request.
 * @param next Remaining interceptor chain.
 * @returns The original response or one retry made with a refreshed access token.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);

  if (!isProtectedApiRequest(request.url)) {
    return next(request);
  }

  const requestToken = tokenStorage.getToken();
  const authenticatedRequest = requestToken ? addAccessToken(request, requestToken) : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!shouldRefresh(error, request, requestToken, authService)) {
        return throwError(() => error);
      }

      const currentToken = tokenStorage.getToken();
      if (currentToken && requestToken !== currentToken) {
        return retryOnce(request, next, currentToken, authService, router);
      }

      return authService.refreshAccessToken().pipe(
        catchError((refreshError: unknown): Observable<never> => {
          handleAuthenticationFailure(authService, router);
          return throwError(() => refreshError);
        }),
        switchMap((newToken) => retryOnce(request, next, newToken, authService, router)),
      );
    }),
  );
};

const isProtectedApiRequest = (url: string): boolean => {
  const isApiRequest = url === API_ROOT || url.startsWith(`${API_ROOT}/`);
  const isAuthenticationRequest = url === AUTH_ROOT || url.startsWith(`${AUTH_ROOT}/`);
  return isApiRequest && !isAuthenticationRequest;
};

const shouldRefresh = (
  error: unknown,
  request: HttpRequest<unknown>,
  requestToken: string | null,
  authService: AuthService,
): boolean =>
  error instanceof HttpErrorResponse &&
  error.status === 401 &&
  !request.context.get(RETRIED_AFTER_REFRESH) &&
  authService.authenticationState() !== AuthState.Unauthenticated &&
  (requestToken !== null || authService.authenticationState() === AuthState.Authenticated);

const addAccessToken = (request: HttpRequest<unknown>, token: string): HttpRequest<unknown> =>
  request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

const retryOnce = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  token: string,
  authService: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> => {
  const retriedRequest = addAccessToken(
    request.clone({
      context: request.context.set(RETRIED_AFTER_REFRESH, true),
    }),
    token,
  );

  return next(retriedRequest).pipe(
    catchError((retryError: unknown) => {
      if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
        handleAuthenticationFailure(authService, router);
      }

      return throwError(() => retryError);
    }),
  );
};

const handleAuthenticationFailure = (authService: AuthService, router: Router): void => {
  authService.clearLocalSession();

  const currentPath = router.url.split('?')[0];
  if (!PUBLIC_AUTH_ROUTES.includes(currentPath as (typeof PUBLIC_AUTH_ROUTES)[number])) {
    void router.navigateByUrl(ROUTES.LOGIN);
  }
};
