import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { ROUTES } from '@core/constants/route.constants';
import { EmailVerificationService } from '@core/services/email-verification.service';

type AuthServiceMock = {
  login: ReturnType<typeof vi.fn>;
};

const toastServiceMock = {
  success: vi.fn(),
};

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  let authServiceMock: AuthServiceMock;
  let emailVerificationServiceMock: { requestResend: ReturnType<typeof vi.fn> };

  let userServiceMock: {
    getMe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
    };
    emailVerificationServiceMock = {
      requestResend: vi.fn().mockReturnValue(
        of({
          success: true,
          data: { resendCooldownSeconds: 47 },
          errors: [],
        }),
      ),
    };

    userServiceMock = {
      getMe: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: EmailVerificationService, useValue: emailVerificationServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form controls', () => {
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
    expect(component.form.valid).toBe(false);
  });

  it('should validate form', () => {
    component.form.setValue({
      email: '',
      password: '',
    });

    expect(component.form.valid).toBe(false);

    component.form.setValue({
      email: 'wrong-email',
      password: '123456',
    });

    expect(component.form.get('email')?.hasError('email')).toBe(true);

    component.form.setValue({
      email: 'user@test.com',
      password: '123456',
    });

    expect(component.form.valid).toBe(true);
  });

  it('should not login when form is invalid', () => {
    component.form.setValue({
      email: '',
      password: '',
    });

    component.onSubmit();

    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should redirect to create organization after successful login', () => {
    const expiresAt = '2026-07-13T15:00:00Z';
    authServiceMock.login.mockReturnValue(
      of({
        success: true,
        data: {
          accessToken: 'token',
          expiresAt,
        },
        errors: [],
      }),
    );

    component.form.setValue({
      email: 'user@test.com',
      password: '123456',
    });

    component.onSubmit();

    expect(toastServiceMock.success).toHaveBeenCalledWith('Login successful.');
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.CREATE_ORGANIZATION]);
  });

  it('should set error message when login fails', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        error: {
          errors: [
            {
              message: 'Invalid credentials',
            },
          ],
        },
      })),
    );

    component.form.setValue({
      email: 'user@test.com',
      password: '123456',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(authServiceMock.login).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Incorrect email or password');
  });

  it('should request another verification email from the sign-in page', () => {
    component.form.controls.email.setValue('user@test.com');
    fixture.detectChanges();

    const resendButton = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Resend Email',
    );
    expect(resendButton).toBeDefined();

    resendButton!.click();
    fixture.detectChanges();

    expect(emailVerificationServiceMock.requestResend).toHaveBeenCalledWith('user@test.com');
    expect(toastServiceMock.success).toHaveBeenCalledWith('If eligible, a new verification email has been sent.');
    expect(fixture.nativeElement.textContent).toContain('Resend in 47s');
  });

  it('should show rate-limit guidance for verification resend', () => {
    emailVerificationServiceMock.requestResend.mockReturnValue(throwError(() => ({ status: 429 })));
    component.form.controls.email.setValue('user@test.com');
    fixture.detectChanges();

    const resendButton = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Resend Email',
    );
    resendButton!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Please wait before trying again');
  });
});
