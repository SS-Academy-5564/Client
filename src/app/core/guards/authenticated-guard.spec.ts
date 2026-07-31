import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router, UrlTree } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@core/constants/route.constants';
import { AuthService, AuthState } from '@core/services/auth.service';
import { authenticatedGuard } from './authenticated-guard';
import { loggedOutOnlyGuard } from './logged-out-only-guard';

type GuardResult = boolean | UrlTree;

describe('authentication route guards', () => {
  let initializationState: Subject<AuthState>;
  let router: Router;

  beforeEach(() => {
    initializationState = new Subject<AuthState>();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            waitForInitialization: vi.fn(() => initializationState),
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should not resolve a protected route while authentication is initializing', () => {
    let result: GuardResult | undefined;

    runGuard(authenticatedGuard).subscribe((value) => {
      result = value;
    });

    expect(result).toBeUndefined();

    initializationState.next(AuthState.Authenticated);

    expect(result).toBe(true);
  });

  it('should allow a protected route after authenticated initialization', () => {
    let result: GuardResult | undefined;
    runGuard(authenticatedGuard).subscribe((value) => {
      result = value;
    });

    initializationState.next(AuthState.Authenticated);

    expect(result).toBe(true);
  });

  it('should redirect a protected route after unauthenticated initialization', () => {
    const createUrlTreeSpy = vi.spyOn(router, 'createUrlTree');
    let result: GuardResult | undefined;
    runGuard(authenticatedGuard).subscribe((value) => {
      result = value;
    });

    initializationState.next(AuthState.Unauthenticated);

    expect(result).toBeInstanceOf(UrlTree);
    expect(createUrlTreeSpy).toHaveBeenCalledWith([ROUTES.LOGIN]);
  });

  it('should redirect an authenticated user away from a logged-out-only route', () => {
    const createUrlTreeSpy = vi.spyOn(router, 'createUrlTree');
    let result: GuardResult | undefined;
    runGuard(loggedOutOnlyGuard).subscribe((value) => {
      result = value;
    });

    initializationState.next(AuthState.Authenticated);

    expect(result).toBeInstanceOf(UrlTree);
    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/']);
  });

  it('should allow an unauthenticated user to open a logged-out-only route', () => {
    let result: GuardResult | undefined;
    runGuard(loggedOutOnlyGuard).subscribe((value) => {
      result = value;
    });

    initializationState.next(AuthState.Unauthenticated);

    expect(result).toBe(true);
  });
});

const runGuard = (guard: CanActivateFn): Observable<GuardResult> =>
  TestBed.runInInjectionContext(() => guard(null as never, null as never)) as Observable<GuardResult>;
