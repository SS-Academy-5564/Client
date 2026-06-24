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
import { AuthService } from '@core/services/auth.service';
import { RegisterRequest } from '@core/models/register-model';
import { passwordMatchValidator } from '@shared/validators/password-match.validator';

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
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly hidePassword = signal<boolean>(true);
  protected readonly hideConfirmPassword = signal<boolean>(true);

  readonly form = this.fb.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^[A-Z].*/)]],
      confirmPassword: ['', [Validators.required]],
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

    this.authService.register(this.form.getRawValue() as RegisterRequest).subscribe({
      next: () => {
        console.log('Registration successful');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.authService.setError(err.error?.message ?? 'Registration failed');
      },
    });
  }
}
