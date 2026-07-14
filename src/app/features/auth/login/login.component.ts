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
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { AuthService } from '@core/services/auth.service';
import { LoginRequest } from '@core/models/login-model';
import { TokenStorageService } from '@core/services/token-storage.service';

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
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  private tokenStorage = inject(TokenStorageService);

  protected readonly hidePassword = signal<boolean>(true);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.update((value) => !value);
    event.stopPropagation();
  }

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

        this.tokenStorage.setToken(token, expiresAt);
        this.loading.set(false);

        this.router.navigate(['/create-organization']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Incorrect email or password');
      },
    });
  }
}
