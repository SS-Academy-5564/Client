import { FormControl, FormGroup, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { passwordMatchValidator } from './password-match.validator';

describe('passwordMatchValidator', () => {
  it('should return null if password or confirmPassword controls are missing', () => {
    const group1 = new FormGroup(
      {
        password: new FormControl(''),
      },
      { validators: passwordMatchValidator },
    );
    expect(passwordMatchValidator(group1)).toBeNull();

    const group2 = new FormGroup(
      {
        confirmPassword: new FormControl(''),
      },
      { validators: passwordMatchValidator },
    );
    expect(passwordMatchValidator(group2)).toBeNull();
  });

  it('should return passwordMismatch error and set error on confirmPassword control if they do not match', () => {
    const group = new FormGroup(
      {
        password: new FormControl('pass123'),
        confirmPassword: new FormControl('pass456'),
      },
      { validators: passwordMatchValidator },
    );

    const result = passwordMatchValidator(group);
    expect(result).toEqual({ passwordMismatch: true });
    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);
  });

  it('should preserve other errors on confirmPassword when passwordMismatch error is set', () => {
    const confirmPasswordControl = new FormControl('', [Validators.required]);
    confirmPasswordControl.setErrors({ required: true });

    const group = new FormGroup(
      {
        password: new FormControl('pass123'),
        confirmPassword: confirmPasswordControl,
      },
      { validators: passwordMatchValidator },
    );

    const result = passwordMatchValidator(group);
    expect(result).toEqual({ passwordMismatch: true });

    // confirmPassword should have BOTH required and passwordMismatch errors
    expect(confirmPasswordControl.hasError('required')).toBe(true);
    expect(confirmPasswordControl.hasError('passwordMismatch')).toBe(true);
  });

  it('should clear passwordMismatch error and return null when passwords match', () => {
    const confirmPasswordControl = new FormControl('pass123');
    // Simulate setting error first
    confirmPasswordControl.setErrors({ passwordMismatch: true });

    const group = new FormGroup(
      {
        password: new FormControl('pass123'),
        confirmPassword: confirmPasswordControl,
      },
      { validators: passwordMatchValidator },
    );

    const result = passwordMatchValidator(group);
    expect(result).toBeNull();
    expect(confirmPasswordControl.hasError('passwordMismatch')).toBe(false);
    expect(confirmPasswordControl.errors).toBeNull();
  });

  it('should preserve other errors on confirmPassword when passwordMismatch is cleared', () => {
    const confirmPasswordControl = new FormControl('pass123');
    // Simulate having both errors
    confirmPasswordControl.setErrors({ required: true, passwordMismatch: true });

    const group = new FormGroup(
      {
        password: new FormControl('pass123'),
        confirmPassword: confirmPasswordControl,
      },
      { validators: passwordMatchValidator },
    );

    const result = passwordMatchValidator(group);
    expect(result).toBeNull();
    expect(confirmPasswordControl.hasError('passwordMismatch')).toBe(false);
    expect(confirmPasswordControl.hasError('required')).toBe(true);
  });
});
