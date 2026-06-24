import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs';
import { RegisterRequest } from '@core/models/register-model';
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse } from '@core/models/login-model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiBaseUrl}/auth/register`;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isAuthenticated = signal<boolean>(
    typeof localStorage !== 'undefined' ? !!localStorage.getItem('token') : false,
  );

  register(payload: RegisterRequest) {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post(this.apiUrl, payload).pipe(finalize(() => this.isLoading.set(false)));
  }

  login(payload: LoginRequest) {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      tap((response) => {
        if (response.success && response.data?.accessToken) {
          localStorage.setItem('token', response.data.accessToken);
          this.isAuthenticated.set(true);
        }
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  setError(message: string) {
    this.error.set(message);
  }
  logout() {
    localStorage.removeItem('token');
    this.isAuthenticated.set(false);
  }
}
