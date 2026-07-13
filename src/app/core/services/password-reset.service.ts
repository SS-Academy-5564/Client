import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { environment } from '@environments/environment';

export type VerifyCodeResponse = {
  success: boolean;
  data: { resetToken: string } | null;
  errors: { code: string; field?: string; message: string }[];
};

export type RequestCodeResponse = {
  success: boolean;
  data: { resendCooldownSeconds: number } | null;
  errors: { code: string; field?: string; message: string }[];
};

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth/password-reset`;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  requestCode(email: string): Observable<RequestCodeResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .post<RequestCodeResponse>(`${this.baseUrl}/request`, { email })
      .pipe(finalize(() => this.isLoading.set(false)));
  }

  verifyCode(email: string, code: string): Observable<VerifyCodeResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .post<VerifyCodeResponse>(`${this.baseUrl}/verify`, { email, code })
      .pipe(finalize(() => this.isLoading.set(false)));
  }

  resetPassword(resetToken: string, newPassword: string, confirmPassword: string): Observable<unknown> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .post(`${this.baseUrl}/reset`, { resetToken, newPassword, confirmPassword })
      .pipe(finalize(() => this.isLoading.set(false)));
  }

  setError(message: string): void {
    this.error.set(message);
  }

  clearError(): void {
    this.error.set(null);
  }
}
