import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { finalize } from 'rxjs/operators';
import { RegisterRequest } from "../models/register-model";
import { environment } from '../../../environments/environment';

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

  setToken(token: string): void{
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  clear(): void {
    localStorage.removeItem('access_token');
  }
  
  setError(message: string) {
    this.error.set(message);
  }
}