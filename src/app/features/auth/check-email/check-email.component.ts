import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ROUTES } from '@core/constants/route.constants';
import { EmailVerificationService } from '@core/services/email-verification.service';
import { ToastService } from '@core/services/toast.service';
import { createCountdownTimer } from '@core/utils/countdown-timer.util';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';

/** Explains the next registration step after the initial verification email is sent. */
@Component({
  selector: 'app-check-email',
  imports: [DecimalPipe, ButtonComponent, LogoComponent],
  templateUrl: './check-email.component.html',
  styleUrl: './check-email.component.scss',
})
export class CheckEmailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly emailVerificationService = inject(EmailVerificationService);
  private readonly toastService = inject(ToastService);
  private readonly resendTimer = createCountdownTimer(inject(DestroyRef));

  /** Application routes used by the page actions. */
  protected readonly routes = ROUTES;

  /** Email carried from the completed registration form. */
  protected readonly email = signal('');

  /** Whether a resend request is currently running. */
  protected readonly isResending = signal(false);

  /** Resend failure or rate-limit guidance shown to the user. */
  protected readonly resendError = signal<string | null>(null);

  /** Remaining client-side cooldown in seconds. */
  protected readonly resendCountdown = this.resendTimer.remainingSeconds;

  /** Whether the resend action is unavailable during its cooldown or an active request. */
  protected readonly resendDisabled = computed(() => this.resendCountdown() > 0 || this.isResending());

  /** Reads registration state and starts the initial resend cooldown. */
  ngOnInit(): void {
    const state = history.state as { email?: string; cooldown?: number } | null;

    if (!state || !state.email || typeof state.cooldown !== 'number') {
      void this.router.navigate([ROUTES.REGISTER]);
      return;
    }

    this.email.set(state.email);
    this.resendTimer.start(state.cooldown);
  }

  /** Requests another verification message for the registered email address. */
  protected resendEmail(): void {
    if (this.resendDisabled()) {
      return;
    }

    this.isResending.set(true);
    this.resendError.set(null);

    this.emailVerificationService
      .requestResend(this.email())
      .pipe(finalize(() => this.isResending.set(false)))
      .subscribe({
        next: (response) => {
          this.toastService.success(
            $localize`:@@emailVerificationResendSuccess:If eligible, a new verification email has been sent.`,
          );
          this.resendTimer.start(response.data.resendCooldownSeconds);
        },
        error: (error: unknown) => {
          const isRateLimited =
            typeof error === 'object' && error !== null && 'status' in error && error.status === 429;
          this.resendError.set(
            isRateLimited
              ? $localize`:@@emailVerificationResendRateLimit:Please wait before trying again.`
              : $localize`:@@emailVerificationResendFailure:We could not process the request. Please try again.`,
          );
        },
      });
  }
}
