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
import { ToastService } from '@core/services/toast.service';
import { ROUTES } from '@core/constants/route.constants';

/**
 * Presents the login form and navigates after successful authentication.
 */
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
  private readonly toastService = inject(ToastService);

  /** Authentication facade used by the login view. */
  protected readonly authService = inject(AuthService);

  /** Whether the password value is currently obscured. */
  protected readonly hidePassword = signal<boolean>(true);

  /** Whether a login request is currently running. */
  protected readonly loading = signal(false);

  /** Login error shown in the form. */
  protected readonly error = signal<string | null>(null);

  /** Reactive login form. */
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

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
}
