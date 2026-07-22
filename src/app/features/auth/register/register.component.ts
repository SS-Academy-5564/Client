import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { AuthService } from '@core/services/auth.service';
import { RegisterRequest } from '@core/models/register-model';
import { passwordMatchValidator } from '@shared/validators/password-match.validator';
import { ToastService } from '@core/services/toast.service';

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
  private readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);

  protected readonly hidePassword = signal<boolean>(true);
  protected readonly hideConfirmPassword = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  protected readonly showPasswordAria = $localize`:@@showPasswordAria:Show password`;
  protected readonly hidePasswordAria = $localize`:@@hidePasswordAria:Hide password`;

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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);

    this.authService.register(this.form.getRawValue() as RegisterRequest).subscribe({
      next: () => {
        this.toastService.success($localize`:@@register.success:Registration successful. You can now log in.`);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const errorMessage = err.error?.errors?.[0]?.message ?? err.error?.message ?? 'Registration failed';
        this.error.set(errorMessage);
      },
    });
  }
}
