import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { PasswordResetService } from '@core/services/password-reset.service';
import { passwordMatchValidator } from '@shared/validators/password-match.validator';
import { ROUTES } from '@core/constants/route.constants';

/**
 * Presents the final password-reset form and returns the user to login after success.
 */
@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  /** Password-reset API state exposed to the template. */
  protected readonly passwordResetService = inject(PasswordResetService);

  /** Whether the password input is currently obscured. */
  protected readonly hidePassword = signal<boolean>(true);

  /** Whether the confirmation input is currently obscured. */
  protected readonly hideConfirmPassword = signal<boolean>(true);

  private resetToken = '';

  /** Password and confirmation controls with complexity and match validation. */
  readonly form = this.fb.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(256),
          Validators.pattern(/[A-Z]/),
          Validators.pattern(/[a-z]/),
          Validators.pattern(/[0-9]/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: passwordMatchValidator,
      updateOn: 'change',
    },
  );

  /**
   * Restores the verified reset token from navigation state.
   */
  ngOnInit(): void {
    const state = history.state as { resetToken?: string };

    if (!state?.resetToken) {
      this.router.navigate([ROUTES.FORGOT_PASSWORD]);
      return;
    }

    this.resetToken = state.resetToken;
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
   * Toggles confirmation visibility without propagating the button click.
   *
   * @param event Confirmation-visibility button event.
   */
  toggleConfirmPasswordVisibility(event: MouseEvent): void {
    this.hideConfirmPassword.update((value) => !value);
    event.stopPropagation();
  }

  /**
   * Validates and submits the new password.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.form.getRawValue();

    this.passwordResetService.resetPassword(this.resetToken, password!, confirmPassword!).subscribe({
      next: () => {
        this.router.navigate([ROUTES.LOGIN]);
      },
      error: (err) => {
        const errorMessage = err.error?.errors?.[0]?.message ?? 'Failed to reset password. Please try again.';
        this.passwordResetService.setError(errorMessage);
      },
    });
  }
}
