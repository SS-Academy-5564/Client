import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginResponse } from '@core/models/login-model';
import { environment } from '@environments/environment';
import { AuthenticationState, AuthService, CurrentUser } from './auth.service';
import { TokenStorageService } from './token-storage.service';

type HttpClientMock = {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

const tokenResponse: LoginResponse = {
  success: true,
  data: {
    accessToken: 'access-token',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  },
  errors: [],
};

const currentUser: CurrentUser = {
  id: 'a2c8e4db-5efc-4f35-8ca4-8d5c9139e0c5',
  email: 'jane@doe.com',
  firstName: 'Jane',
  lastName: 'Doe',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('AuthService', () => {
  let service: AuthService;
  let tokenStorage: TokenStorageService;
  let httpMock: HttpClientMock;

  beforeEach(() => {
    httpMock = {
      post: vi.fn(),
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AuthService, TokenStorageService, { provide: HttpClient, useValue: httpMock }],
    });

    service = TestBed.inject(AuthService);
    tokenStorage = TestBed.inject(TokenStorageService);
  });

  it('should start in the initializing state without an access token', () => {
    expect(service.authenticationState()).toBe('initializing');
    expect(service.isInitializing()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(tokenStorage.getToken()).toBeNull();
  });

  it('should call the registration endpoint', () => {
    const payload = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'test@test.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    };
    httpMock.post.mockReturnValue(of({}));

    service.register(payload).subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/register`, payload);
    expect(service.isLoading()).toBe(false);
  });

  it('should login with credentials enabled and keep the access token only in memory', () => {
    httpMock.post.mockReturnValue(of(tokenResponse));
    httpMock.get.mockReturnValue(of({ success: true, data: currentUser, errors: [] }));

    service.login({ email: 'jane@doe.com', password: 'Password1' }).subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(
      `${environment.apiBaseUrl}/auth/login`,
      { email: 'jane@doe.com', password: 'Password1' },
      { withCredentials: true },
    );
    expect(tokenStorage.getToken()).toBe('access-token');
    expect(service.authenticationState()).toBe('authenticated');
    expect(service.currentUser()).toEqual(currentUser);
    expect(service.displayName()).toBe('Jane Doe');
    expect(service.userInitials()).toBe('JD');
  });

  it('should restore the session during initialization', () => {
    httpMock.post.mockReturnValue(of(tokenResponse));
    httpMock.get.mockReturnValue(of({ success: true, data: currentUser, errors: [] }));
    const completed = vi.fn();

    service.initializeSession().subscribe({ complete: completed });

    expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true });
    expect(tokenStorage.getToken()).toBe('access-token');
    expect(service.authenticationState()).toBe('authenticated');
    expect(service.currentUser()).toEqual(currentUser);
    expect(completed).toHaveBeenCalledOnce();
  });

  it('should finish initialization as unauthenticated when refresh fails', () => {
    httpMock.post.mockReturnValue(throwError(() => ({ status: 401 })));
    const completed = vi.fn();

    service.initializeSession().subscribe({ complete: completed });

    expect(service.authenticationState()).toBe('unauthenticated');
    expect(tokenStorage.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(httpMock.get).not.toHaveBeenCalled();
    expect(completed).toHaveBeenCalledOnce();
  });

  it('should share one active refresh request and reset it after completion', () => {
    const refreshResponse = new Subject<LoginResponse>();
    const receivedTokens: string[] = [];
    httpMock.post.mockReturnValue(refreshResponse);

    service.refreshAccessToken().subscribe((token) => receivedTokens.push(token));
    service.refreshAccessToken().subscribe((token) => receivedTokens.push(token));

    expect(httpMock.post).toHaveBeenCalledTimes(1);

    refreshResponse.next(tokenResponse);
    refreshResponse.complete();

    expect(receivedTokens).toEqual(['access-token', 'access-token']);

    httpMock.post.mockReturnValue(of(tokenResponse));
    service.refreshAccessToken().subscribe();

    expect(httpMock.post).toHaveBeenCalledTimes(2);
  });

  it('should reset the shared refresh operation after failure', () => {
    httpMock.post.mockReturnValueOnce(throwError(() => ({ status: 401 }))).mockReturnValueOnce(of(tokenResponse));

    service.refreshAccessToken().subscribe({ error: (): void => undefined });
    service.refreshAccessToken().subscribe();

    expect(httpMock.post).toHaveBeenCalledTimes(2);
    expect(service.authenticationState()).toBe('authenticated');
  });

  it('should wait until initialization reaches a final state', async () => {
    const refreshResponse = new Subject<LoginResponse>();
    const observedStates: AuthenticationState[] = [];
    httpMock.post.mockReturnValue(refreshResponse);

    service.waitForInitialization().subscribe((state) => observedStates.push(state));
    service.initializeSession().subscribe();

    expect(observedStates).toEqual([]);

    refreshResponse.error({ status: 401 });

    await vi.waitFor(() => expect(observedStates).toEqual(['unauthenticated']));
  });

  it('should clear the local session even when backend logout fails', () => {
    tokenStorage.setToken('access-token');
    service.currentUser.set(currentUser);
    httpMock.post.mockReturnValue(throwError(() => ({ status: 500 })));

    service.logout().subscribe({ error: (): void => undefined });

    expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/logout`, {}, { withCredentials: true });
    expect(tokenStorage.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.authenticationState()).toBe('unauthenticated');
  });

  it('should clear the authenticated session when loading the current user ends in 401', () => {
    httpMock.post.mockReturnValue(of(tokenResponse));
    service.refreshAccessToken().subscribe();
    httpMock.get.mockReturnValue(throwError(() => ({ status: 401 })));

    service.loadCurrentUser().subscribe((result) => expect(result).toBeNull());

    expect(tokenStorage.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.authenticationState()).toBe('unauthenticated');
    expect(service.error()).toBe('Your session has expired. Please log in again.');
  });

  it('should preserve the authenticated session on a non-auth profile failure', () => {
    httpMock.post.mockReturnValue(of(tokenResponse));
    service.refreshAccessToken().subscribe();
    httpMock.get.mockReturnValue(throwError(() => ({ status: 500 })));

    service.loadCurrentUser().subscribe((result) => expect(result).toBeNull());

    expect(tokenStorage.getToken()).toBe('access-token');
    expect(service.authenticationState()).toBe('authenticated');
    expect(service.error()).toBe('Failed to load user profile.');
  });
});
