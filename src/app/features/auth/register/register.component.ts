import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { RegisterRequest } from '../../../core/models/register-model';
import { passwordMatchValidator } from '../../../shared/validators/password-match.validator';
import {ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, RouterModule, ButtonComponent, MatIconModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);

  protected readonly hidePassword = signal<boolean>(true);
  protected readonly hideConfirmPassword = signal<boolean>(true);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', 
      [
        Validators.required, 
        Validators.minLength(8)
      ]
      ],
    confirmPassword: ['', [Validators.required]],
    },
    { 
      validators: passwordMatchValidator,
      updateOn: 'change'
    });


  togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.update(value => !value);
    event.stopPropagation();
  }

  toggleConfirmPasswordVisibility(event: MouseEvent): void {
    this.hideConfirmPassword.update(value => !value);
    event.stopPropagation();
  }
  
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authService.register(this.form.getRawValue() as RegisterRequest)
    .subscribe({
      next: () => {
        console.log('Registration successful');
      },
      error: err => {
         this.authService.setError(
            err.error?.message ?? 'Registration failed'
          );
      }
    });
  }
}