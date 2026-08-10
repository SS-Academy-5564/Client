import { HttpInterceptorFn } from '@angular/common/http';
import { inject, LOCALE_ID } from '@angular/core';

import { environment } from '@environments/environment';

const API_ROOT = environment.apiBaseUrl.replace(/\/+$/, '');

/**
 * Sends the active Angular UI locale to the API for localized server notifications.
 *
 * @param request Outgoing HTTP request.
 * @param next Remaining interceptor chain.
 * @returns The request with the UI locale for Pulse API calls.
 */
export const languageInterceptor: HttpInterceptorFn = (request, next) => {
  const locale = inject(LOCALE_ID);
  const isApiRequest = request.url === API_ROOT || request.url.startsWith(`${API_ROOT}/`);

  if (!isApiRequest) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { 'Accept-Language': locale },
    }),
  );
};
