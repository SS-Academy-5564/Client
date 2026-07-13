import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { PasswordResetService } from '@core/services/password-reset.service';

type PasswordResetServiceMock = {
  requestCode: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof signal<string | null>>;
};

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let passwordResetServiceMock: PasswordResetServiceMock;
  let router: Router;

  beforeEach(async () => {
    passwordResetServiceMock = {
      requestCode: vi.fn(),
      setError: vi.fn(),
      error: signal<string | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, NoopAnimationsModule],
      providers: [{ provide: PasswordResetService, useValue: passwordResetServiceMock }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty email control', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.valid).toBe(false);
  });

  it('should validate email format and required', () => {
    const emailControl = component.form.get('email');

    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBe(true);

    emailControl?.setValue('invalidemail');
    expect(emailControl?.hasError('email')).toBe(true);

    emailControl?.setValue('user@company.com');
    expect(component.form.valid).toBe(true);
  });

  it('should not call passwordResetService.requestCode if form is invalid on submit', () => {
    component.form.get('email')?.setValue('');

    component.onSubmit();

    expect(passwordResetServiceMock.requestCode).not.toHaveBeenCalled();
  });

  it('should call passwordResetService.requestCode and redirect to /verify-code on success', () => {
    passwordResetServiceMock.requestCode.mockReturnValue(
      of({ success: true, data: { resendCooldownSeconds: 60 }, errors: [] }),
    );

    component.form.get('email')?.setValue('user@company.com');
    component.onSubmit();

    expect(passwordResetServiceMock.requestCode).toHaveBeenCalledTimes(1);
    expect(passwordResetServiceMock.requestCode).toHaveBeenCalledWith('user@company.com');
    expect(router.navigate).toHaveBeenCalledWith(['/verify-code'], {
      state: { email: 'user@company.com', cooldown: 60 },
    });
  });

  it('should handle API errors by calling passwordResetService.setError', () => {
    const errorResponse = {
      error: {
        success: false,
        data: null,
        errors: [{ code: 'NotFound', message: 'User not found' }],
      },
    };
    passwordResetServiceMock.requestCode.mockReturnValue(throwError(() => errorResponse));

    component.form.get('email')?.setValue('user@company.com');
    component.onSubmit();

    expect(passwordResetServiceMock.requestCode).toHaveBeenCalledTimes(1);
    expect(passwordResetServiceMock.setError).toHaveBeenCalledWith('User not found');
  });
});
