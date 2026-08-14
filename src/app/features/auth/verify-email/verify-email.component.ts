import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';

import { ROUTES } from '@core/constants/route.constants';
import { EmailVerificationService } from '@core/services/email-verification.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';

type VerificationState = 'verifying' | 'success' | 'expired' | 'invalid';

type ApiErrorEnvelope = {
  errors?: {
    code?: unknown;
  }[];
};

const EXPIRED_TOKEN_CODE = 'EMAIL_VERIFICATION_TOKEN_EXPIRED';
const INVALID_TOKEN_CODES = new Set(['EMAIL_VERIFICATION_TOKEN_INVALID', 'EMAIL_VERIFICATION_TOKEN_ALREADY_USED']);

/** Verifies registration links and presents distinct success, expiry, and invalid-link states. */
@Component({
  selector: 'app-verify-email',
  imports: [ButtonComponent, LogoComponent, MatProgressSpinnerModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly emailVerificationService = inject(EmailVerificationService);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly token = computed(() => this.queryParamMap().get('token')?.trim() ?? '');

  /** Current verification state rendered by the page. */
  protected readonly state = signal<VerificationState>('verifying');

  /** Whether a replacement-link request is in progress. */
  protected readonly isResending = signal(false);

  /** Whether a replacement verification email was sent successfully. */
  protected readonly resendComplete = signal(false);

  /** Localized resend failure shown without exposing backend implementation details. */
  protected readonly resendError = signal<string | null>(null);

  /** Application routes used by page actions. */
  protected readonly routes = ROUTES;

  /** Reads the verification token and starts the one-time verification request. */
  ngOnInit(): void {
    const token = this.token();

    if (!token) {
      this.state.set('invalid');
      return;
    }

    this.emailVerificationService.verify(token).subscribe({
      next: () => this.state.set('success'),
      error: (error: unknown) => {
        this.state.set(this.getErrorCode(error) === EXPIRED_TOKEN_CODE ? 'expired' : 'invalid');
      },
    });
  }

  /** Requests a replacement email for the expired token currently displayed. */
  protected resendEmail(): void {
    const token = this.token();

    if (!token || this.isResending() || this.resendComplete()) {
      return;
    }

    this.isResending.set(true);
    this.clearError();

    this.emailVerificationService.resendExpired(token).subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendComplete.set(true);
      },
      error: (error: unknown) => {
        this.isResending.set(false);
        const code = this.getErrorCode(error);

        if (code && INVALID_TOKEN_CODES.has(code)) {
          this.state.set('invalid');
          return;
        }

        this.resendError.set(
          error instanceof HttpErrorResponse && error.status === 429
            ? $localize`:@@verifyEmailResendCooldown:Please wait before requesting another verification email.`
            : $localize`:@@verifyEmailResendError:We couldn't send another email. Please try again.`,
        );
      },
    });
  }

  private clearError(): void {
    this.resendError.set(null);
  }

  private getErrorCode(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse) || !this.isApiErrorEnvelope(error.error)) {
      return null;
    }

    const code = error.error.errors?.[0]?.code;
    return typeof code === 'string' ? code : null;
  }

  private isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
    return typeof value === 'object' && value !== null;
  }
}
