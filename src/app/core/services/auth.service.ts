import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, tap } from 'rxjs';
import { RegisterRequest } from '@core/models/register-model';
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse } from '@core/models/login-model';
import { TokenStorageService } from '@core/services/token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly apiUrl = `${environment.apiBaseUrl}/auth/register`;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  register(payload: RegisterRequest): Observable<any> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post(this.apiUrl, payload).pipe(finalize(() => this.isLoading.set(false)));
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      tap((response) => {
        if (response.success && response.data?.accessToken) {
          this.tokenStorage.setToken(response.data.accessToken);
        }
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  setError(message: string): void {
    this.error.set(message);
  }
}
