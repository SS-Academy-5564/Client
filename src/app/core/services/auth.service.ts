import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { RegisterRequest } from '@core/models/register-model';
import { environment } from '@environments/environment';
import { ApiResponse, LoginRequest, LoginResponse } from '@core/models/login-model';
import { TokenStorageService } from '@core/services/token-storage.service';

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly registerEndpoint = `${environment.apiBaseUrl}/auth/register`;
  private readonly loginEndpoint = `${environment.apiBaseUrl}/auth/login`;
  private readonly currentUserEndpoint = `${environment.apiBaseUrl}/users/me`;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentUser = signal<CurrentUser | null>(null);

  readonly displayName = computed(() => {
    const user = this.currentUser();

    if (!user) {
      return null;
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.email || null;
  });

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

  register(payload: RegisterRequest): Observable<unknown> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post(this.registerEndpoint, payload).pipe(finalize(() => this.isLoading.set(false)));
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<LoginResponse>(this.loginEndpoint, payload).pipe(
      tap((response) => {
        if (response?.success && response?.data?.accessToken) {
          this.tokenStorage.setToken(response.data.accessToken, response.data.expiresAt);
        }
      }),
      switchMap((response) => {
        if (!response?.success || !response?.data?.accessToken) {
          return of(response);
        }

        return this.loadCurrentUser().pipe(map(() => response));
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  loadCurrentUser(): Observable<CurrentUser | null> {
    const token = this.tokenStorage.getToken();

    if (!token) {
      this.currentUser.set(null);
      return of(null);
    }

    return this.http
      .get<ApiResponse<CurrentUser>>(this.currentUserEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        map((response) => (response?.success ? response.data : null)),
        tap((user) => {
          this.currentUser.set(user);
        }),
        catchError(() => {
          this.currentUser.set(null);
          return of(null);
        }),
      );
  }

  logout(): void {
    this.currentUser.set(null);
    this.tokenStorage.clearToken();
  }

  setError(message: string): void {
    this.error.set(message);
  }
}
