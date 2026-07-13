import { Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { PasswordResetService } from '@core/services/password-reset.service';

@Component({
  selector: 'app-verify-code',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
    ButtonComponent,
    LogoComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss',
})
export class VerifyCodeComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  protected readonly passwordResetService = inject(PasswordResetService);

  protected readonly codeInputs = viewChildren<ElementRef<HTMLInputElement>>('codeInput');

  protected readonly email = signal<string>('');
  protected readonly codeDigits = signal<string[]>(['', '', '', '', '', '']);
  protected readonly resendDisabled = signal(true);
  protected readonly resendCountdown = signal(60);
  protected readonly isSubmitting = signal(false);

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const state = history.state as { email?: string; cooldown?: number };

    if (!state?.email) {
      this.router.navigate(['/forgot-password']);
      return;
    }

    this.email.set(state.email);
    this.startResendTimer(state.cooldown ?? 60);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow single digit
    if (value.length > 1) {
      input.value = value.charAt(value.length - 1);
    }

    // Update digit
    const digits = [...this.codeDigits()];
    digits[index] = input.value;
    this.codeDigits.set(digits);

    // Auto-advance to next input
    if (input.value && index < 5) {
      const inputs = this.codeInputs();
      inputs[index + 1].nativeElement.focus();
    }

    this.passwordResetService.clearError();
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const digits = [...this.codeDigits()];

      if (!digits[index] && index > 0) {
        // If current is empty, go back
        const inputs = this.codeInputs();
        digits[index - 1] = '';
        this.codeDigits.set(digits);
        inputs[index - 1].nativeElement.value = '';
        inputs[index - 1].nativeElement.focus();
        event.preventDefault();
      } else {
        digits[index] = '';
        this.codeDigits.set(digits);
      }
    }
  }

  onDigitKeypress(event: KeyboardEvent): void {
    // Only allow digits
    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text')?.trim() ?? '';
    const digits = pastedText.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const newDigits = [...this.codeDigits()];
      const inputs = this.codeInputs();

      digits.forEach((digit, i) => {
        if (i < 6) {
          newDigits[i] = digit;
          if (inputs[i]) {
            inputs[i].nativeElement.value = digit;
          }
        }
      });

      this.codeDigits.set(newDigits);

      // Focus the next empty input or the last one
      const focusIndex = Math.min(digits.length, 5);
      if (inputs[focusIndex]) {
        inputs[focusIndex].nativeElement.focus();
      }
    }
  }

  onSubmit(): void {
    const code = this.codeDigits().join('');

    if (code.length !== 6) {
      this.passwordResetService.setError('Please enter all 6 digits');
      return;
    }

    this.isSubmitting.set(true);

    this.passwordResetService.verifyCode(this.email(), code).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response?.data?.resetToken) {
          this.router.navigate(['/reset-password'], {
            state: { resetToken: response.data.resetToken },
          });
        } else {
          this.passwordResetService.setError('Invalid response from server. Please try again.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMessage = err.error?.errors?.[0]?.message ?? 'Invalid or expired code. Please try again.';
        this.passwordResetService.setError(errorMessage);
      },
    });
  }

  resendCode(): void {
    if (this.resendDisabled()) {
      return;
    }

    this.passwordResetService.requestCode(this.email()).subscribe({
      next: (response) => {
        const cooldown = response?.data?.resendCooldownSeconds ?? 60;
        this.startResendTimer(cooldown);
      },
      error: () => {
        this.passwordResetService.setError('Failed to resend code. Please try again.');
      },
    });
  }

  private startResendTimer(seconds: number): void {
    this.clearTimer();
    this.resendCountdown.set(seconds);
    this.resendDisabled.set(true);

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
}
