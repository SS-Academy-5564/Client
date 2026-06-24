import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

interface AuthServiceMock {
  register: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
}

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authServiceMock: AuthServiceMock;

  beforeEach(async () => {
    authServiceMock = {
      register: vi.fn(),
      setError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
    component.form.get('firstName')?.setValue('Jane');
    component.form.get('lastName')?.setValue('Smith');
    component.form.get('email')?.setValue('user@example.com');
    component.form.get('password')?.setValue('StrongPassw0rd!');
    component.form.get('confirmPassword')?.setValue('StrongPassw0rd!');

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
    authServiceMock.register.mockReturnValue(of({}));

    component.form.get('firstName')?.setValue('Jane');
    component.form.get('lastName')?.setValue('Smith');
    component.form.get('email')?.setValue('user@example.com');
    component.form.get('password')?.setValue('StrongPassw0rd!');
    component.form.get('confirmPassword')?.setValue('StrongPassw0rd!');

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledTimes(1);
    expect(authServiceMock.register).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'user@example.com',
      password: 'StrongPassw0rd!',
      confirmPassword: 'StrongPassw0rd!',
    });
  });

  it('should handle service error by calling authService.setError', () => {
    const errorResponse = { error: { message: 'Email already exists' } };
    authServiceMock.register.mockReturnValue(throwError(() => errorResponse));

    component.form.get('firstName')?.setValue('Jane');
    component.form.get('lastName')?.setValue('Smith');
    component.form.get('email')?.setValue('user@example.com');
    component.form.get('password')?.setValue('StrongPassw0rd!');
    component.form.get('confirmPassword')?.setValue('StrongPassw0rd!');

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledTimes(1);
    expect(authServiceMock.setError).toHaveBeenCalledWith('Email already exists');
  });
});
