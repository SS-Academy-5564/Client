import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';

type AuthServiceMock = {
  login: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof signal<string | null>>;
  isLoading: ReturnType<typeof signal<boolean>>;
};

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authServiceMock: AuthServiceMock;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      setError: vi.fn(),
      error: signal<string | null>(null),
      isLoading: signal<boolean>(false),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: authServiceMock }, provideRouter([])],
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
    expect(component.form).toBeDefined();
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
    expect(component.form.valid).toBe(false);
  });

  it('should validate form input requirements and email format', () => {
    const emailControl = component.form.get('email');
    const passwordControl = component.form.get('password');

    emailControl?.setValue('');
    passwordControl?.setValue('');
    expect(emailControl?.hasError('required')).toBe(true);
    expect(passwordControl?.hasError('required')).toBe(true);

    emailControl?.setValue('invalidemail');
    expect(emailControl?.hasError('email')).toBe(true);

    emailControl?.setValue('user@company.com');
    passwordControl?.setValue('password123');
    expect(component.form.valid).toBe(true);
  });

  it('should not call authService.login if form is invalid on submit', () => {
    component.form.get('email')?.setValue('');
    component.form.get('password')?.setValue('');

    component.onSubmit();

    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should call authService.login and redirect to / on successful login', () => {
    authServiceMock.login.mockReturnValue(
      of({
        success: true,
        data: { accessToken: 'mock-jwt-token', expiresAt: '2026-06-24T16:01:54Z' },
        errors: [],
      }),
    );

    component.form.get('email')?.setValue('user@company.com');
    component.form.get('password')?.setValue('password123');

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledTimes(1);
    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'user@company.com',
      password: 'password123',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should handle API errors by calling authService.setError', () => {
    const errorResponse = {
      error: {
        success: false,
        data: null,
        errors: [{ code: 'Unauthorized', message: 'Invalid credentials' }],
      },
    };
    authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

    component.form.get('email')?.setValue('user@company.com');
    component.form.get('password')?.setValue('password123');

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledTimes(1);
    expect(authServiceMock.setError).toHaveBeenCalledWith('Invalid credentials');
  });
});
