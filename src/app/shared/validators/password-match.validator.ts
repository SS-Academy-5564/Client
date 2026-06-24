import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    const mismatch = password.value !== confirmPassword.value;
    const existingErrors = confirmPassword.errors ?? {};

    if (mismatch) {
        if (!existingErrors['passwordMismatch']) {
            confirmPassword.setErrors({ ...existingErrors, passwordMismatch: true });
        }
        return { passwordMismatch: true };
    }

    if (existingErrors['passwordMismatch']) {
        const { passwordMismatch, ...rest } = existingErrors;
        confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
    }

    return null;
}