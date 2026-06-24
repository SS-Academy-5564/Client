import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;

  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    if (confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    return null;
  }
}
