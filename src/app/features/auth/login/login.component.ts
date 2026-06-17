import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { AuthService } from '@core/services/auth.service';
import { LoginRequest } from '@core/models/login-model';

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
    ButtonComponent
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly hidePassword = signal<boolean>(true);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.update(value => !value);
    event.stopPropagation();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authService.login(this.form.getRawValue() as LoginRequest)
      .subscribe({
        next: () => {
          console.log('Login successful');
          this.router.navigate(['/']);
        },
        error: (err) => {
          const errorMessage = err.error?.message ?? 'Invalid email or password';
          this.authService.setError(errorMessage);
        }
      });
  }
}
