import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { TokenStorageService } from '@core/services/token-storage.service';

type AuthServiceMock = {
  login: ReturnType<typeof vi.fn>;
};

const tokenStorageMock = {
  setToken: vi.fn<(token: string, expiresAt: string) => void>(),
};

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;

  let authServiceMock: AuthServiceMock;

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

    userServiceMock = {
      getMe: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: TokenStorageService, useValue: tokenStorageMock },
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

    expect(tokenStorageMock.setToken).toHaveBeenCalledWith('token', expiresAt);
    expect(router.navigate).toHaveBeenCalledWith(['/create-organization']);
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
});
