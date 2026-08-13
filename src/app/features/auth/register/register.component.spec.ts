import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { ROUTES } from '@core/constants/route.constants';

type AuthServiceMock = {
  register: ReturnType<typeof vi.fn>;
};

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authServiceMock: AuthServiceMock;
  let router: Router;

  const fillValidForm = (): void => {
    component.form.get('firstName')?.setValue('Jane');
    component.form.get('lastName')?.setValue('Smith');
    component.form.get('email')?.setValue('user@example.com');
    component.form.get('password')?.setValue('StrongPassw0rd!');
    component.form.get('confirmPassword')?.setValue('StrongPassw0rd!');
  };

  beforeEach(async () => {
    authServiceMock = {
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: authServiceMock }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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

  it('should initialize form with empty values and be invalid', () => {
    expect(component.form).toBeDefined();
    expect(component.form.valid).toBe(false);
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
    expect(component.form.get('confirmPassword')?.value).toBe('');
  });

  it('should validate form invalid when fields are empty or mismatched', () => {
    component.form.get('email')?.setValue('invalid-email');
    component.form.get('password')?.setValue('short');
    component.form.get('confirmPassword')?.setValue('different');
    component.form.markAllAsTouched();

    expect(component.form.get('email')?.invalid).toBe(true);
    expect(component.form.get('password')?.invalid).toBe(true);
    expect(component.form.hasError('passwordMismatch')).toBe(true);
    expect(component.form.valid).toBe(false);
  });

  it('should validate form valid when all fields are correct', () => {
    fillValidForm();

    expect(component.form.valid).toBe(true);
    expect(component.form.hasError('passwordMismatch')).toBe(false);
  });

  it('should not call authService.register when form is invalid', () => {
    component.form.get('email')?.setValue('');
    component.form.get('password')?.setValue('');
    component.form.get('confirmPassword')?.setValue('');

    component.onSubmit();

    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  it('should call authService.register with payload when the form is valid', () => {
    authServiceMock.register.mockReturnValue(of({ success: true, data: { resendCooldownSeconds: 47 }, errors: [] }));

    fillValidForm();
    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledTimes(1);
    expect(authServiceMock.register).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'user@example.com',
      password: 'StrongPassw0rd!',
      confirmPassword: 'StrongPassw0rd!',
    });
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.CHECK_EMAIL], {
      state: { email: 'user@example.com', cooldown: 47 },
    });
  });

  it('should reject a registration response without resend cooldown guidance', (): void => {
    authServiceMock.register.mockReturnValue(of({ success: true, data: {}, errors: [] }));

    fillValidForm();
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Registration response is missing resend cooldown guidance');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'should reject invalid resend cooldown value %s',
    (resendCooldownSeconds: number): void => {
      authServiceMock.register.mockReturnValue(of({ success: true, data: { resendCooldownSeconds }, errors: [] }));

      fillValidForm();
      component.onSubmit();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Registration response is missing resend cooldown guidance');
      expect(router.navigate).not.toHaveBeenCalled();
    },
  );

  it('should display a generic error message for non-429 failures', () => {
    const errorResponse = { error: { message: 'Something went wrong' } };
    authServiceMock.register.mockReturnValue(throwError(() => errorResponse));

    fillValidForm();
    component.onSubmit();
    fixture.detectChanges();

    expect(authServiceMock.register).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Something went wrong');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show retry time for 429 with a body delay', () => {
    const errorResponse = new HttpErrorResponse({
      status: 429,
      error: { errors: [{ message: 'Too many requests. Please try again in 900 seconds.' }] },
    });
    authServiceMock.register.mockReturnValue(throwError(() => errorResponse));

    fillValidForm();
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('15');
    expect(fixture.nativeElement.textContent).toContain('minutes');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show retry seconds for 429 with numeric Retry-After', () => {
    const errorResponse = new HttpErrorResponse({
      status: 429,
      headers: new HttpHeaders({ 'Retry-After': '60' }),
    });
    authServiceMock.register.mockReturnValue(throwError(() => errorResponse));

    fillValidForm();
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1');
    expect(fixture.nativeElement.textContent).toContain('minute');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show a rate limit message with a computed retry countdown when Retry-After is an HTTP date', () => {
    vi.useFakeTimers();
    const retryDate = new Date(Date.now() + 30_000).toUTCString();
    const errorResponse = new HttpErrorResponse({
      status: 429,
      headers: new HttpHeaders({ 'Retry-After': retryDate }),
    });
    authServiceMock.register.mockReturnValue(throwError(() => errorResponse));

    fillValidForm();
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1');
    expect(fixture.nativeElement.textContent).toContain('minute');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show a generic rate limit message when 429 is returned without a Retry-After header', () => {
    const errorResponse = new HttpErrorResponse({
      status: 429,
      headers: new HttpHeaders(),
    });
    authServiceMock.register.mockReturnValue(throwError(() => errorResponse));

    fillValidForm();
    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Too many registration attempts');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
