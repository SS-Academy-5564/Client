import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '@core/models/api-response';
import { environment } from '@environments/environment';

/** Backend payload returned after a replacement verification email is sent. */
export type ResendEmailVerificationResult = {
  resendCooldownSeconds: number;
};

/** Backend envelope returned after a replacement verification email is sent. */
export type ResendEmailVerificationResponse = ApiResponse<ResendEmailVerificationResult>;

/** Coordinates email verification and replacement-link requests. */
@Injectable({
  providedIn: 'root',
})
export class EmailVerificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth/email-verification`;

  /**
   * Consumes a one-time email verification token.
   *
   * @param token Token received through the verification link.
   * @returns The backend verification response.
   */
  verify(token: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/verify`, { token });
  }

  /**
   * Requests a replacement verification link for an expired token.
   *
   * @param token Expired token received through the verification link.
   * @returns The backend response containing resend cooldown guidance.
   */
  resend(token: string): Observable<ResendEmailVerificationResponse> {
    return this.http.post<ResendEmailVerificationResponse>(`${this.baseUrl}/resend`, { token });
  }
}
