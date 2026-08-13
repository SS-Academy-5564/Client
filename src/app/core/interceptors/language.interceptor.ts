import { HttpInterceptorFn } from '@angular/common/http';
import { inject, LOCALE_ID } from '@angular/core';

import { environment } from '@environments/environment';

const API_ROOT = environment.apiBaseUrl.replace(/\/+$/, '');
const LOCALIZED_EMAIL_ENDPOINTS = new Set([
  `${API_ROOT}/auth/register`,
  `${API_ROOT}/auth/email-verification/resend`,
  `${API_ROOT}/auth/email-verification/resend-expired`,
  `${API_ROOT}/auth/password-reset/request`,
]);

/**
 * Sends the active Angular UI locale to the API for localized server notifications.
 *
 * @param request Outgoing HTTP request.
 * @param next Remaining interceptor chain.
 * @returns The request with the UI locale when it can trigger a localized email.
 */
export const languageInterceptor: HttpInterceptorFn = (request, next) => {
  const locale = inject(LOCALE_ID);
  const requiresLanguage = request.method === 'POST' && LOCALIZED_EMAIL_ENDPOINTS.has(request.url);

  if (!requiresLanguage) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { 'Accept-Language': locale },
    }),
  );
};
