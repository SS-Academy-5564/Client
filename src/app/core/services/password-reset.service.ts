import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, tap } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';

/** Backend envelope returned after verification of a password-reset code. */
export type VerifyCodeResponse = {
  success: boolean;
  data: { resetToken: string } | null;
  errors: { code: string; field?: string; message: string }[];
};

/** Backend envelope returned after requesting a password-reset code. */
export type RequestCodeResponse = {
  success: boolean;
  data: { resendCooldownSeconds: number } | null;
  errors: { code: string; field?: string; message: string }[];
};

/**
 * Coordinates the password-reset API flow and clears sessions after a successful password change.
 */
@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth/password-reset`;

  /** Whether a password-reset request is currently running. */
  readonly isLoading = signal(false);

  /** Error message exposed to password-reset views. */
  readonly error = signal<string | null>(null);

  /**
   * Requests a password-reset code for an email address.
   *
   * @param email Account email address.
   * @returns The backend request-code response.
   */
  requestCode(email: string): Observable<RequestCodeResponse> {
    this.isLoading.set(true);
    this.clearError();

    return this.http
      .post<RequestCodeResponse>(`${this.baseUrl}/request`, { email })
      .pipe(finalize(() => this.isLoading.set(false)));
  }

  /**
   * Verifies a password-reset code.
   *
   * @param email Account email address.
   * @param code Verification code supplied by the user.
   * @returns The backend verification response.
   */
  verifyCode(email: string, code: string): Observable<VerifyCodeResponse> {
    this.isLoading.set(true);
    this.clearError();

    return this.http
      .post<VerifyCodeResponse>(`${this.baseUrl}/verify`, { email, code })
      .pipe(finalize(() => this.isLoading.set(false)));
  }

  /**
   * Changes the password and clears any local authenticated session after success.
   *
   * @param resetToken Short-lived password-reset token.
   * @param newPassword New account password.
   * @param confirmPassword Confirmation of the new account password.
   * @returns The backend reset-password response.
   */
  resetPassword(resetToken: string, newPassword: string, confirmPassword: string): Observable<unknown> {
    this.isLoading.set(true);
    this.clearError();

    return this.http.post(`${this.baseUrl}/reset`, { resetToken, newPassword, confirmPassword }).pipe(
      tap(() => this.authService.clearLocalSession()),
      finalize(() => this.isLoading.set(false)),
    );
  }

  /**
   * Replaces the current password-reset error.
   *
   * @param message Message to expose to the current view.
   */
  setError(message: string): void {
    this.error.set(message);
  }

  /**
   * Clears the current password-reset error.
   */
  clearError(): void {
    this.error.set(null);
  }
}
