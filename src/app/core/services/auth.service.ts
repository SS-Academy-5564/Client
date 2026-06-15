import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { finalize } from "rxjs/internal/operators/finalize";
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

    return this.http .post(this.apiUrl, payload)
      .pipe(finalize(() => this.isLoading.set(false)));
  }

  setError(message: string) {
    this.error.set(message);
  }
}