import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ROUTES } from '@core/constants/route.constants';
import { EmailVerificationService } from '@core/services/email-verification.service';
import { ToastService } from '@core/services/toast.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';

/** Explains the next registration step after the initial verification email is sent. */
@Component({
  selector: 'app-check-email',
  imports: [ButtonComponent, LogoComponent],
  templateUrl: './check-email.component.html',
  styleUrl: './check-email.component.scss',
})
export class CheckEmailComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly emailVerificationService = inject(EmailVerificationService);
  private readonly toastService = inject(ToastService);
  private timerId: ReturnType<typeof setInterval> | null = null;

  /** Application routes used by the page actions. */
  protected readonly routes = ROUTES;

  /** Email carried from the completed registration form. */
  protected readonly email = signal('');

  /** Whether a resend request is currently running. */
  protected readonly isResending = signal(false);

  /** Resend failure or rate-limit guidance shown to the user. */
  protected readonly resendError = signal<string | null>(null);

  /** Whether the resend action is unavailable during its cooldown. */
  protected readonly resendDisabled = signal(false);

  /** Remaining client-side cooldown in seconds. */
  protected readonly resendCountdown = signal(0);

  /** Reads registration state and starts the initial resend cooldown. */
  ngOnInit(): void {
    const state = history.state as { email?: string; cooldown?: number };

    if (!state.email || typeof state.cooldown !== 'number') {
      this.router.navigate([ROUTES.REGISTER]);
      return;
    }

    this.email.set(state.email);
    this.startResendTimer(state.cooldown);
  }

  /** Clears the active resend timer when the page is destroyed. */
  ngOnDestroy(): void {
    this.clearTimer();
  }

  /** Requests another verification message for the registered email address. */
  protected resendEmail(): void {
    if (this.resendDisabled() || this.isResending()) {
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
          this.startResendTimer(response.data.resendCooldownSeconds);
        },
        error: (error: unknown) => {
          const isRateLimited = this.getHttpStatus(error) === 429;
          this.resendError.set(
            isRateLimited
              ? $localize`:@@emailVerificationResendRateLimit:Please wait before trying again.`
              : $localize`:@@emailVerificationResendFailure:We could not process the request. Please try again.`,
          );
        },
      });
  }

  private startResendTimer(seconds: number): void {
    this.clearTimer();
    this.resendCountdown.set(Math.max(0, seconds));
    this.resendDisabled.set(seconds > 0);

    if (seconds <= 0) {
      return;
    }

    this.timerId = setInterval(() => {
      const current = this.resendCountdown();
      if (current <= 1) {
        this.clearTimer();
        this.resendCountdown.set(0);
        this.resendDisabled.set(false);
      } else {
        this.resendCountdown.set(current - 1);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private getHttpStatus(error: unknown): number | undefined {
    return typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: number }).status
      : undefined;
  }
}
