import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '@core/services/auth.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { environment } from '@environments/environment';
import { authInterceptor } from './auth.interceptor';

const protectedUrl = `${environment.apiBaseUrl}/monitors`;
const refreshUrl = `${environment.apiBaseUrl}/auth/refresh`;

const tokenResponse = (accessToken: string): object => ({
  success: true,
  data: {
    accessToken,
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  },
  errors: [],
});

describe('Auth HTTP integration', () => {
  let authService: AuthService;
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorageService;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateByUrl = vi.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        TokenStorageService,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            url: '/overview',
            navigateByUrl,
          },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach the current access token to protected API requests', () => {
    tokenStorage.setToken('current-token');

    http.get(protectedUrl).subscribe();

    const request = httpMock.expectOne(protectedUrl);
    expect(request.request.headers.get('Authorization')).toBe('Bearer current-token');
    request.flush({});
  });

  it('should exclude all authentication endpoints from token attachment and refresh handling', () => {
    tokenStorage.setToken('current-token');
    const authenticationUrls = [
      `${environment.apiBaseUrl}/auth/login`,
      `${environment.apiBaseUrl}/auth/register`,
      refreshUrl,
      `${environment.apiBaseUrl}/auth/logout`,
      `${environment.apiBaseUrl}/auth/password-reset/request`,
      `${environment.apiBaseUrl}/auth/password-reset/verify`,
      `${environment.apiBaseUrl}/auth/password-reset/reset`,
    ];

    for (const url of authenticationUrls) {
      http.post(url, {}).subscribe({ error: (): void => undefined });
      const request = httpMock.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({}, { status: 401, statusText: 'Unauthorized' });
    }

    expect(httpMock.match(refreshUrl)).toHaveLength(0);
  });

  it('should refresh once and retry the original request with the new token', () => {
    tokenStorage.setToken('expired-token');
    let response: object | undefined;

    http.get<object>(protectedUrl).subscribe((value) => {
      response = value;
    });

    const originalRequest = httpMock.expectOne(protectedUrl);
    originalRequest.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = httpMock.expectOne(refreshUrl);
    expect(refreshRequest.request.withCredentials).toBe(true);
    expect(refreshRequest.request.headers.has('Authorization')).toBe(false);
    refreshRequest.flush(tokenResponse('new-token'));

    const retriedRequest = httpMock.expectOne(protectedUrl);
    expect(retriedRequest.request.headers.get('Authorization')).toBe('Bearer new-token');
    retriedRequest.flush({ restored: true });

    expect(response).toEqual({ restored: true });
    expect(authService.authenticationState()).toBe('authenticated');
  });

  it('should refresh an authenticated session when the in-memory access token has expired', () => {
    authService.refreshAccessToken().subscribe();
    httpMock.expectOne(refreshUrl).flush(tokenResponse('initial-token'));
    tokenStorage.setToken('expired-token', new Date(Date.now() - 1_000).toISOString());

    expect(tokenStorage.getToken()).toBeNull();
    expect(authService.authenticationState()).toBe('authenticated');

    http.get(protectedUrl).subscribe();
    const originalRequest = httpMock.expectOne(protectedUrl);
    expect(originalRequest.request.headers.has('Authorization')).toBe(false);
    originalRequest.flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectOne(refreshUrl).flush(tokenResponse('renewed-token'));
    const retriedRequest = httpMock.expectOne(protectedUrl);
    expect(retriedRequest.request.headers.get('Authorization')).toBe('Bearer renewed-token');
    retriedRequest.flush({});
  });

  it('should share one refresh across concurrent 401 responses', () => {
    tokenStorage.setToken('expired-token');

    http.get(protectedUrl).subscribe();
    http.get(protectedUrl).subscribe();

    const originalRequests = httpMock.match(protectedUrl);
    expect(originalRequests).toHaveLength(2);
    originalRequests.forEach((request) => request.flush({}, { status: 401, statusText: 'Unauthorized' }));

    const refreshRequests = httpMock.match(refreshUrl);
    expect(refreshRequests).toHaveLength(1);
    refreshRequests[0].flush(tokenResponse('shared-token'));

    const retriedRequests = httpMock.match(protectedUrl);
    expect(retriedRequests).toHaveLength(2);
    retriedRequests.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer shared-token');
      request.flush({});
    });
  });

  it('should reuse an already refreshed token when a concurrent old-token 401 arrives late', () => {
    tokenStorage.setToken('expired-token');

    http.get(protectedUrl).subscribe();
    http.get(protectedUrl).subscribe();

    const originalRequests = httpMock.match(protectedUrl);
    originalRequests[0].flush({}, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = httpMock.expectOne(refreshUrl);
    refreshRequest.flush(tokenResponse('new-token'));
    const firstRetry = httpMock.expectOne(protectedUrl);
    firstRetry.flush({});

    originalRequests[1].flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone(refreshUrl);
    const secondRetry = httpMock.expectOne(protectedUrl);
    expect(secondRetry.request.headers.get('Authorization')).toBe('Bearer new-token');
    secondRetry.flush({});
  });

  it('should reuse an already refreshed token when a concurrent tokenless 401 arrives late', () => {
    authService.refreshAccessToken().subscribe();
    httpMock.expectOne(refreshUrl).flush(tokenResponse('initial-token'));
    tokenStorage.setToken('expired-token', new Date(Date.now() - 1_000).toISOString());

    http.get(protectedUrl).subscribe();
    http.get(protectedUrl).subscribe();

    const originalRequests = httpMock.match(protectedUrl);
    originalRequests.forEach((request) => {
      expect(request.request.headers.has('Authorization')).toBe(false);
    });
    originalRequests[0].flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectOne(refreshUrl).flush(tokenResponse('new-token'));
    httpMock.expectOne(protectedUrl).flush({});

    originalRequests[1].flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone(refreshUrl);
    const secondRetry = httpMock.expectOne(protectedUrl);
    expect(secondRetry.request.headers.get('Authorization')).toBe('Bearer new-token');
    secondRetry.flush({});
  });

  it('should clear the session and redirect when refresh fails', () => {
    tokenStorage.setToken('expired-token');

    http.get(protectedUrl).subscribe({ error: (): void => undefined });
    httpMock.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(refreshUrl).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(tokenStorage.getToken()).toBeNull();
    expect(authService.authenticationState()).toBe('unauthenticated');
    expect(navigateByUrl).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
    httpMock.expectNone(protectedUrl);
  });

  it('should not start another refresh when a concurrent 401 arrives after refresh failure', () => {
    tokenStorage.setToken('expired-token');

    http.get(protectedUrl).subscribe({ error: (): void => undefined });
    http.get(protectedUrl).subscribe({ error: (): void => undefined });

    const originalRequests = httpMock.match(protectedUrl);
    originalRequests[0].flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(refreshUrl).flush({}, { status: 401, statusText: 'Unauthorized' });

    originalRequests[1].flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone(refreshUrl);
    expect(authService.authenticationState()).toBe('unauthenticated');
    expect(navigateByUrl).toHaveBeenCalledOnce();
  });

  it('should not redirect again when refresh fails on the login route', () => {
    (TestBed.inject(Router) as unknown as { url: string }).url = '/login';
    tokenStorage.setToken('expired-token');

    http.get(protectedUrl).subscribe({ error: (): void => undefined });
    httpMock.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(refreshUrl).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.authenticationState()).toBe('unauthenticated');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('should retry a failed request only once', () => {
    tokenStorage.setToken('expired-token');

    http.get(protectedUrl).subscribe({ error: (): void => undefined });
    httpMock.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(refreshUrl).flush(tokenResponse('new-token'));
    httpMock.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone(refreshUrl);
    httpMock.expectNone(protectedUrl);
    expect(tokenStorage.getToken()).toBeNull();
    expect(authService.authenticationState()).toBe('unauthenticated');
    expect(navigateByUrl).toHaveBeenCalledOnce();
  });

  it('should not refresh an unauthenticated protected request', () => {
    http.get(protectedUrl).subscribe({ error: (): void => undefined });

    const request = httpMock.expectOne(protectedUrl);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone(refreshUrl);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('should never attach access tokens to non-API requests', () => {
    tokenStorage.setToken('current-token');

    http.get('https://example.com/content').subscribe();

    const request: TestRequest = httpMock.expectOne('https://example.com/content');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
