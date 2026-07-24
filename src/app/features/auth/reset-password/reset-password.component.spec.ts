import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { PasswordResetService } from '@core/services/password-reset.service';
import { ROUTES } from '@core/constants/route.constants';

type PasswordResetServiceMock = {
  resetPassword: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof signal<string | null>>;
};

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let passwordResetServiceMock: PasswordResetServiceMock;
  let router: Router;

  beforeEach(async () => {
    passwordResetServiceMock = {
      resetPassword: vi.fn(),
      setError: vi.fn(),
      error: signal<string | null>(null),
    };

    history.pushState({ resetToken: 'mock-reset-token' }, '');

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, NoopAnimationsModule],
      providers: [{ provide: PasswordResetService, useValue: passwordResetServiceMock }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to forgot-password if resetToken state is missing', () => {
    history.pushState({}, ''); // clear state
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.FORGOT_PASSWORD]);
  });

  it('should initialize with empty password controls', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('password')?.value).toBe('');
    expect(component.form.get('confirmPassword')?.value).toBe('');
    expect(component.form.valid).toBe(false);
  });

  it('should validate password complexity and match', () => {
    const passwordControl = component.form.get('password');
    const confirmPasswordControl = component.form.get('confirmPassword');

    // Test required
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBe(true);

    // Test minLength (8 chars)
    passwordControl?.setValue('Short1!');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    // Test pattern (uppercase, lowercase, number)
    passwordControl?.setValue('nocapitals123');
    expect(passwordControl?.hasError('pattern')).toBe(true);

    // Test password match
    passwordControl?.setValue('ValidPass123');
    confirmPasswordControl?.setValue('MismatchPass123');
    expect(component.form.hasError('passwordMismatch')).toBe(true);

    // Test valid form
    confirmPasswordControl?.setValue('ValidPass123');
    expect(component.form.valid).toBe(true);
  });

  it('should toggle password visibility', () => {
    const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;

    expect(component['hidePassword']()).toBe(true);
    component.togglePasswordVisibility(event);
    expect(component['hidePassword']()).toBe(false);
    expect(event.stopPropagation).toHaveBeenCalled();

    expect(component['hideConfirmPassword']()).toBe(true);
    component.toggleConfirmPasswordVisibility(event);
    expect(component['hideConfirmPassword']()).toBe(false);
    expect(event.stopPropagation).toHaveBeenCalledTimes(2);
  });

  it('should not call passwordResetService.resetPassword if form is invalid on submit', () => {
    component.form.get('password')?.setValue('ValidPass123');
    component.form.get('confirmPassword')?.setValue('MismatchPass123');

    component.onSubmit();

    expect(passwordResetServiceMock.resetPassword).not.toHaveBeenCalled();
  });

  it('should call passwordResetService.resetPassword and redirect to /reset-success on success', () => {
    passwordResetServiceMock.resetPassword.mockReturnValue(of({ success: true, data: null, errors: [] }));

    component.form.get('password')?.setValue('ValidPass123');
    component.form.get('confirmPassword')?.setValue('ValidPass123');
    component.onSubmit();

    expect(passwordResetServiceMock.resetPassword).toHaveBeenCalledTimes(1);
    expect(passwordResetServiceMock.resetPassword).toHaveBeenCalledWith(
      'mock-reset-token',
      'ValidPass123',
      'ValidPass123',
    );
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.RESET_SUCCESS]);
  });

  it('should handle API errors by calling passwordResetService.setError', () => {
    const errorResponse = {
      error: {
        success: false,
        data: null,
        errors: [{ code: 'TokenExpired', message: 'The reset link has expired.' }],
      },
    };
    passwordResetServiceMock.resetPassword.mockReturnValue(throwError(() => errorResponse));

    component.form.get('password')?.setValue('ValidPass123');
    component.form.get('confirmPassword')?.setValue('ValidPass123');
    component.onSubmit();

    expect(passwordResetServiceMock.resetPassword).toHaveBeenCalledTimes(1);
    expect(passwordResetServiceMock.setError).toHaveBeenCalledWith('The reset link has expired.');
  });
});
