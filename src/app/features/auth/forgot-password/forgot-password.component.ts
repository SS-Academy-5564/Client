import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { PasswordResetService } from '@core/services/password-reset.service';

const DEFAULT_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    RouterModule,
    ButtonComponent,
    LogoComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly passwordResetService = inject(PasswordResetService);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.passwordResetService.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.getRawValue().email!;

    this.passwordResetService.requestCode(email).subscribe({
      next: (response) => {
        const cooldown = response?.data?.resendCooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;
        this.router.navigate(['/verify-code'], { state: { email, cooldown } });
      },
      error: (err) => {
        const errorMessage = err.error?.errors?.[0]?.message ?? 'Failed to send reset code. Please try again.';
        this.passwordResetService.setError(errorMessage);
      },
    });
  }
}
