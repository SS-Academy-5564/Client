import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { AuthService } from '@core/services/auth.service';
import { RegisterRequest } from '@core/models/register-model';
import { passwordMatchValidator } from '@shared/validators/password-match.validator';
import { ROUTES } from '@core/constants/route.constants';
import { RATE_LIMIT_STATUS_CODE } from '@core/constants/auth-rate-limit.constants';
import { AuthRateLimitMessageService } from '@core/services/auth-rate-limit-message.service';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    RouterModule,
    ButtonComponent,
    MatIconModule,
    LogoComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authRateLimitMessageService = inject(AuthRateLimitMessageService);
  protected readonly authService = inject(AuthService);

  protected readonly hidePassword = signal<boolean>(true);
  protected readonly hideConfirmPassword = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showPasswordAria = $localize`:@@showPasswordAria:Show password`;
  protected readonly hidePasswordAria = $localize`:@@hidePasswordAria:Hide password`;

  private readonly registrationFailedMessage = $localize`:@@register.failed:Registration failed`;

  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
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
      confirmPassword: ['', Validators.required],
    },
    {
      validators: passwordMatchValidator,
      updateOn: 'change',
    },
  );

  togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.update((value) => !value);
    event.stopPropagation();
  }

  toggleConfirmPasswordVisibility(event: MouseEvent): void {
    this.hideConfirmPassword.update((value) => !value);
    event.stopPropagation();
  }

  /**
   * Submits valid registration data, navigates to email confirmation on success, and surfaces response failures.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);

    this.authService.register(this.form.getRawValue() as RegisterRequest).subscribe({
      next: (response) => {
        if (!response.data) {
          this.error.set(
            $localize`:@@registrationMissingResendCooldown:Registration response is missing resend cooldown guidance`,
          );
          return;
        }

        this.router.navigate([ROUTES.CHECK_EMAIL], {
          state: {
            email: this.form.controls.email.value,
            cooldown: response.data.resendCooldownSeconds,
          },
        });
      },
      error: (err: HttpErrorResponse) => this.handleRegisterError(err),
    });
  }

  private handleRegisterError(err: HttpErrorResponse): void {
    if (err.status === RATE_LIMIT_STATUS_CODE) {
      this.error.set(this.authRateLimitMessageService.build(err));
      return;
    }

    const errorMessage = err.error?.errors?.[0]?.message ?? err.error?.message ?? this.registrationFailedMessage;
    this.error.set(errorMessage);
  }
}
