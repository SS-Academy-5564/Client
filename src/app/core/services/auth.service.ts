import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { catchError, filter, finalize, map, Observable, of, shareReplay, switchMap, take, tap, throwError } from 'rxjs';

import { ApiResponse, LoginRequest, LoginResponse, LoginResult } from '@core/models/login-model';
import { RegisterRequest, RegistrationResponse } from '@core/models/register-model';
import { TokenStorageService } from '@core/services/token-storage.service';
import { environment } from '@environments/environment';

/**
 * Known authentication states for the frontend session.
 */
export enum AuthState {
  Initializing = 'initializing',
  Authenticated = 'authenticated',
  Unauthenticated = 'unauthenticated',
}

/**
 * Profile returned for the currently authenticated user.
 */
export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Coordinates login, session restoration, refresh rotation, and local authentication state.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly registerEndpoint = `${environment.apiBaseUrl}/auth/register`;
  private readonly loginEndpoint = `${environment.apiBaseUrl}/auth/login`;
  private readonly refreshEndpoint = `${environment.apiBaseUrl}/auth/refresh`;
  private readonly logoutEndpoint = `${environment.apiBaseUrl}/auth/logout`;
  private readonly currentUserEndpoint = `${environment.apiBaseUrl}/users/me`;
  private readonly authenticationStateValue = signal<AuthState>(AuthState.Initializing);
  private readonly authenticationStateChanges = toObservable(this.authenticationStateValue);
  private refreshRequest$: Observable<string> | null = null;

  /** Whether an interactive authentication request is in progress. */
  readonly isLoading = signal(false);

  /** Authentication-related message intended for the current view. */
  readonly error = signal<string | null>(null);

  /** Profile for the current authenticated user, when loaded. */
  readonly currentUser = signal<CurrentUser | null>(null);

  /** Read-only authentication lifecycle state. */
  readonly authenticationState = this.authenticationStateValue.asReadonly();

  /** Whether startup session initialization is still in progress. */
  readonly isInitializing = computed(() => this.authenticationState() === AuthState.Initializing);

  /** Whether the frontend currently has an authenticated session. */
  readonly isAuthenticated = computed(() => this.authenticationState() === AuthState.Authenticated);

  /** Best available display name from the current user profile. */
  readonly displayName = computed(() => {
    const user = this.currentUser();

    if (!user) {
      return null;
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.email || null;
  });

  /** Best available initials from the current user profile. */
  readonly userInitials = computed(() => {
    const user = this.currentUser();

    if (!user) {
      return null;
    }

    const first = user.firstName?.trim().charAt(0) ?? '';
    const last = user.lastName?.trim().charAt(0) ?? '';
    const emailInitial = user.email?.trim().charAt(0) ?? '';

    return (first + last || emailInitial || '').toUpperCase() || null;
  });

  /**
   * Registers a new user account.
   *
   * @param payload Registration form values.
   * @returns The backend registration request.
   */
  register(payload: RegisterRequest): Observable<RegistrationResponse> {
    this.isLoading.set(true);
    this.clearError();

    return this.http
      .post<RegistrationResponse>(this.registerEndpoint, payload)
      .pipe(finalize(() => this.isLoading.set(false)));
  }

  /**
   * Authenticates a user and stores the returned access token in memory.
   *
   * @param payload User credentials.
   * @returns The backend login response.
   */
  login(payload: LoginRequest): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.clearError();

    return this.http.post<LoginResponse>(this.loginEndpoint, payload, { withCredentials: true }).pipe(
      switchMap((response): Observable<LoginResponse> => {
        if (!response.success || !response.data?.accessToken) {
          this.clearLocalSession();
          return of(response);
        }

        this.applyAuthenticatedSession(response.data);
        return this.loadCurrentUser().pipe(map(() => response));
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  /**
   * Restores the browser session before application startup completes.
   *
   * @returns An observable that completes after refresh and profile loading finish.
   */
  initializeSession(): Observable<void> {
    this.authenticationStateValue.set(AuthState.Initializing);
    this.currentUser.set(null);
    this.tokenStorage.clearToken();

    return this.refreshAccessToken().pipe(
      switchMap(() => this.loadCurrentUser()),
      map((): void => undefined),
      catchError(() => of(undefined)),
    );
  }

  /**
   * Starts or joins the active refresh-token rotation request.
   *
   * @returns A shared observable containing the newly issued access token.
   */
  refreshAccessToken(): Observable<string> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const request$ = this.http.post<LoginResponse>(this.refreshEndpoint, {}, { withCredentials: true }).pipe(
      switchMap((response): Observable<string> => {
        if (!response.success || !response.data?.accessToken) {
          return throwError(() => new Error('Refresh response did not contain an access token.'));
        }

        this.applyAuthenticatedSession(response.data);
        return of(response.data.accessToken);
      }),
      catchError((error: unknown): Observable<never> => {
        this.clearLocalSession();
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.refreshRequest$ = request$;
    return request$;
  }

  /**
   * Loads the profile associated with the current authenticated session.
   *
   * @returns The current user, or `null` when unavailable.
   */
  loadCurrentUser(): Observable<CurrentUser | null> {
    if (this.authenticationState() === AuthState.Unauthenticated) {
      this.currentUser.set(null);
      return of(null);
    }

    return this.http.get<ApiResponse<CurrentUser>>(this.currentUserEndpoint).pipe(
      map((response) => (response.success ? response.data : null)),
      tap((user) => {
        this.currentUser.set(user);
        this.clearError();
      }),
      catchError((error: unknown) => {
        this.currentUser.set(null);

        if (this.getHttpStatus(error) === 401) {
          this.clearLocalSession();
          this.setError('Your session has expired. Please log in again.');
        } else {
          this.setError('Failed to load user profile.');
        }

        return of(null);
      }),
    );
  }

  /**
   * Revokes the backend refresh session and clears all local authentication state.
   *
   * @returns The backend logout request mapped to completion.
   */
  logout(): Observable<void> {
    this.clearLocalSession();

    return this.http.post(this.logoutEndpoint, {}, { withCredentials: true }).pipe(
      map((): void => undefined),
      finalize(() => this.clearLocalSession()),
    );
  }

  /**
   * Clears the access token, current user, and authenticated state locally.
   */
  clearLocalSession(): void {
    this.tokenStorage.clearToken();
    this.currentUser.set(null);
    this.authenticationStateValue.set(AuthState.Unauthenticated);
    this.clearError();
  }

  /**
   * Waits until startup authentication initialization reaches a final state.
   *
   * @returns The first authenticated or unauthenticated state.
   */
  waitForInitialization(): Observable<AuthState> {
    return this.authenticationStateChanges.pipe(
      filter((state) => state !== AuthState.Initializing),
      take(1),
    );
  }

  /**
   * Replaces the current authentication error message.
   *
   * @param message Message to expose to the current view.
   */
  setError(message: string): void {
    this.error.set(message);
  }

  /**
   * Clears the current authentication error message.
   */
  clearError(): void {
    this.error.set(null);
  }

  private applyAuthenticatedSession(result: LoginResult): void {
    this.tokenStorage.setToken(result.accessToken, result.expiresAt);
    this.authenticationStateValue.set(AuthState.Authenticated);
    this.clearError();
  }

  private getHttpStatus(error: unknown): number | undefined {
    return typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: number }).status
      : undefined;
  }
}
