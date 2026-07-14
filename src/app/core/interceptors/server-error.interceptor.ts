import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Redirects unexpected, non-inline failures to the styled error page.
// Server errors (5xx) and network failures (status 0) navigate away; all 4xx
// are left untouched so components keep handling them inline (login, validation,
// rate limiting). Session-expiry (401) handling is intentionally out of scope.
//
// The real status is preserved in the URL (e.g. 503 -> /error/503) rather than
// collapsed to 500, so the user isn't shown a code that didn't happen. The error
// page maps 500 distinctly and shows any other code with generic copy.
export const serverErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status >= 500) {
        void router.navigateByUrl(`/error/${error.status}`);
      } else if (error.status === 0) {
        void router.navigateByUrl('/error/offline');
      }

      return throwError(() => error);
    }),
  );
};
