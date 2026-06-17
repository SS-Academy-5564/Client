import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { finalize } from "rxjs/internal/operators/finalize";
import { RegisterRequest } from "@core/models/register-model";
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse } from "@core/models/login-model";
import { tap } from "rxjs/internal/operators/tap";

@Injectable({
  providedIn: "root",
})

export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiBaseUrl}/auth/register`;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  register(payload: RegisterRequest) {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post(this.apiUrl, payload)
      .pipe(finalize(() => this.isLoading.set(false)));
  }

  // TODO: Once the C# backend PR is merged, run both servers locally
  // and test this endpoint end-to-end.
  // The C# backend expects a JSON payload matching LoginRequest and
  // returns a JSON object with a 'token' property.
  login(payload: LoginRequest) {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
        }),
        finalize(() => this.isLoading.set(false))
      );
  }

  setError(message: string) {
    this.error.set(message);
  }
  logout() {
    localStorage.removeItem('token');
  }
}