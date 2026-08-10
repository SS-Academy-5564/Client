import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { AuthService } from '@core/services/auth.service';
import { LoginRequest } from '@core/models/login-model';
import { ToastService } from '@core/services/toast.service';
import { ROUTES } from '@core/constants/route.constants';
import { EmailVerificationService } from '@core/services/email-verification.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    ButtonComponent,
    LogoComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
/** Presents the login form and navigates after successful authentication. */
export class LoginComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly emailVerificationService = inject(EmailVerificationService);
  private resendTimerId: ReturnType<typeof setInterval> | null = null;

  /** Authentication facade used by the login view. */
  protected readonly authService = inject(AuthService);

  /** Whether the password value is currently obscured. */
  protected readonly hidePassword = signal<boolean>(true);

  /** Whether a login request is currently running. */
  protected readonly loading = signal(false);

  /** Login error shown in the form. */
  protected readonly error = signal<string | null>(null);

  /** Whether a verification resend request is currently running. */
  protected readonly isResendingVerification = signal(false);

  /** Verification resend failure or rate-limit guidance. */
  protected readonly verificationResendError = signal<string | null>(null);

  /** Remaining verification resend cooldown in seconds. */
  protected readonly verificationResendCountdown = signal(0);

  /** Reactive login form. */
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  /** Clears the verification resend timer when the sign-in page is destroyed. */
  ngOnDestroy(): void {
    this.clearVerificationResendTimer();
  }

  /**
   * Toggles password visibility without propagating the button click.
   *
   * @param event Password-visibility button event.
   */
  togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.update((value) => !value);
    event.stopPropagation();
  }

  /**
   * Validates and submits the login form.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const credentials = this.form.getRawValue() as LoginRequest;

    this.authService.login(credentials).subscribe({
      next: (res) => {
        const token = res.data?.accessToken;
        const expiresAt = res.data?.expiresAt;

        if (!token || !expiresAt) {
          this.loading.set(false);
          this.error.set('Token is missing');
          return;
        }

        this.loading.set(false);
        this.toastService.success($localize`:@@login.success:Login successful.`);
        this.router.navigate([ROUTES.CREATE_ORGANIZATION]);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Incorrect email or password');
      },
    });
  }

  /**
   * Requests another verification message for the email entered on the sign-in form.
   */
  protected resendVerificationEmail(): void {
    const emailControl = this.form.controls.email;
    if (emailControl.invalid || this.isResendingVerification() || this.verificationResendCountdown() > 0) {
      emailControl.markAsTouched();
      return;
    }

    this.isResendingVerification.set(true);
    this.verificationResendError.set(null);

    this.emailVerificationService
      .requestResend(emailControl.value?.trim() ?? '')
      .pipe(finalize(() => this.isResendingVerification.set(false)))
      .subscribe({
        next: (response) => {
          this.toastService.success(
            $localize`:@@emailVerificationResendSuccess:If eligible, a new verification email has been sent.`,
          );
          this.startVerificationResendTimer(response.data.resendCooldownSeconds);
        },
        error: (error: unknown) => {
          const isRateLimited = this.getHttpStatus(error) === 429;
          this.verificationResendError.set(
            isRateLimited
              ? $localize`:@@emailVerificationResendRateLimit:Please wait before trying again.`
              : $localize`:@@emailVerificationResendFailure:We could not process the request. Please try again.`,
          );
        },
      });
  }

  private startVerificationResendTimer(seconds: number): void {
    this.clearVerificationResendTimer();
    this.verificationResendCountdown.set(Math.max(0, seconds));

    if (seconds <= 0) {
      return;
    }

    this.resendTimerId = setInterval(() => {
      const current = this.verificationResendCountdown();
      if (current <= 1) {
        this.clearVerificationResendTimer();
        this.verificationResendCountdown.set(0);
      } else {
        this.verificationResendCountdown.set(current - 1);
      }
    }, 1000);
  }

  private clearVerificationResendTimer(): void {
    if (this.resendTimerId !== null) {
      clearInterval(this.resendTimerId);
      this.resendTimerId = null;
    }
  }

  private getHttpStatus(error: unknown): number | undefined {
    return typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: number }).status
      : undefined;
  }
}
