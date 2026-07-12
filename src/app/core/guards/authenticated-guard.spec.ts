import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';

import { authenticatedGuard } from './authenticated-guard';
import { TokenStorageService } from '../services/token-storage.service';

describe('authenticatedGuard', () => {
  let router: Router;
  const isAuthenticated = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: TokenStorageService,
          useValue: {
            isAuthenticated,
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow navigation when user is authenticated', () => {
    isAuthenticated.set(true);

    const result = TestBed.runInInjectionContext(() => authenticatedGuard(null as never, null as never));

    expect(result).toBe(true);
  });

  it('should redirect to /login when user is not authenticated', () => {
    isAuthenticated.set(false);
    const createUrlTreeSpy = vi.spyOn(router, 'createUrlTree');

    const result = TestBed.runInInjectionContext(() => authenticatedGuard(null as never, null as never));

    expect(result).toBeInstanceOf(UrlTree);
    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/login']);
  });
});
