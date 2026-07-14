import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { VerifyCodeComponent } from './verify-code.component';
import { PasswordResetService } from '@core/services/password-reset.service';

type PasswordResetServiceMock = {
  verifyCode: ReturnType<typeof vi.fn>;
  requestCode: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof signal<string | null>>;
};

describe('VerifyCodeComponent', () => {
  let fixture: ComponentFixture<VerifyCodeComponent>;
  let component: VerifyCodeComponent;
  let passwordResetServiceMock: PasswordResetServiceMock;
  let router: Router;

  beforeEach(async () => {
    vi.useFakeTimers();

    passwordResetServiceMock = {
      verifyCode: vi.fn(),
      requestCode: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
      error: signal<string | null>(null),
    };

    history.pushState({ email: 'user@company.com' }, '');

    await TestBed.configureTestingModule({
      imports: [VerifyCodeComponent, NoopAnimationsModule],
      providers: [{ provide: PasswordResetService, useValue: passwordResetServiceMock }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyCodeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to forgot-password if email state is missing', () => {
    history.pushState({}, ''); // clear state
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/forgot-password']);
  });

  it('should set email from history state and start timer', () => {
    expect(component['email']()).toBe('user@company.com');
    expect(component['resendDisabled']()).toBe(true);
    expect(component['resendCountdown']()).toBe(60);

    vi.advanceTimersByTime(1000);
    expect(component['resendCountdown']()).toBe(59);

    vi.advanceTimersByTime(59000); // skip to end
    expect(component['resendCountdown']()).toBe(0);
    expect(component['resendDisabled']()).toBe(false);

    component.ngOnDestroy();
  });

  it('should set error if code is incomplete', () => {
    // Only 3 digits entered
    component['codeDigits'].set(['1', '2', '3', '', '', '']);
    component.onSubmit();

    expect(passwordResetServiceMock.setError).toHaveBeenCalledWith('Please enter all 6 digits');
    expect(passwordResetServiceMock.verifyCode).not.toHaveBeenCalled();
  });

  it('should call verifyCode and redirect to reset-password on success', () => {
    const mockToken = 'mock-reset-token';
    passwordResetServiceMock.verifyCode.mockReturnValue(
      of({ success: true, data: { resetToken: mockToken }, errors: [] }),
    );

    component['codeDigits'].set(['1', '2', '3', '4', '5', '6']);
    component.onSubmit();

    expect(passwordResetServiceMock.verifyCode).toHaveBeenCalledWith('user@company.com', '123456');
    expect(router.navigate).toHaveBeenCalledWith(['/reset-password'], { state: { resetToken: mockToken } });
  });

  it('should handle API errors by calling passwordResetService.setError on submit', () => {
    const errorResponse = {
      error: {
        success: false,
        data: null,
        errors: [{ code: 'InvalidCode', message: 'Invalid or expired code.' }],
      },
    };
    passwordResetServiceMock.verifyCode.mockReturnValue(throwError(() => errorResponse));

    component['codeDigits'].set(['1', '2', '3', '4', '5', '6']);
    component.onSubmit();

    expect(passwordResetServiceMock.setError).toHaveBeenCalledWith('Invalid or expired code.');
    expect(component['isSubmitting']()).toBe(false);
  });

  it('should handle resend code request and reset timer', () => {
    passwordResetServiceMock.requestCode.mockReturnValue(of({ success: true, data: null, errors: [] }));

    // Force timer to 0 so we can click resend
    component['resendDisabled'].set(false);
    component['resendCountdown'].set(0);

    component.resendCode();

    expect(passwordResetServiceMock.requestCode).toHaveBeenCalledWith('user@company.com');
    expect(component['resendDisabled']()).toBe(true);
    expect(component['resendCountdown']()).toBe(60);

    component.ngOnDestroy();
  });

  it('should handle pasting a 6-digit code', () => {
    const mockClipboardEvent = {
      preventDefault: vi.fn(),
      clipboardData: {
        getData: vi.fn().mockReturnValue('123456'),
      },
    } as unknown as ClipboardEvent;

    component.onPaste(mockClipboardEvent);

    expect(mockClipboardEvent.preventDefault).toHaveBeenCalled();
    expect(component['codeDigits']()).toEqual(['1', '2', '3', '4', '5', '6']);
  });
});
