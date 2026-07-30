import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { environment } from '@environments/environment';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let httpMock: { post: ReturnType<typeof vi.fn> };
  let clearLocalSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearLocalSession = vi.fn();
    httpMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PasswordResetService,
        { provide: HttpClient, useValue: httpMock },
        { provide: AuthService, useValue: { clearLocalSession } },
      ],
    });

    service = TestBed.inject(PasswordResetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('requestCode', () => {
    it('should make POST request to request code endpoint', () => {
      const email = 'test@example.com';
      httpMock.post.mockReturnValue(of({ success: true }));

      service.requestCode(email).subscribe();

      expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/password-reset/request`, { email });
    });

    it('should set isLoading to false after finalize', () => {
      const email = 'test@example.com';
      httpMock.post.mockReturnValue(of({ success: true }));

      service.requestCode(email).subscribe();

      expect(service.isLoading()).toBe(false);
    });
  });

  describe('verifyCode', () => {
    it('should make POST request to verify code endpoint', () => {
      const email = 'test@example.com';
      const code = '123456';
      httpMock.post.mockReturnValue(of({ success: true }));

      service.verifyCode(email, code).subscribe();

      expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/password-reset/verify`, {
        email,
        code,
      });
    });
  });

  describe('resetPassword', () => {
    it('should make POST request to reset password endpoint', () => {
      const resetToken = 'token123';
      const newPassword = 'newPassword123!';
      const confirmPassword = 'newPassword123!';
      httpMock.post.mockReturnValue(of({ success: true }));

      service.resetPassword(resetToken, newPassword, confirmPassword).subscribe();

      expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/password-reset/reset`, {
        resetToken,
        newPassword,
        confirmPassword,
      });
      expect(clearLocalSession).toHaveBeenCalledOnce();
    });
  });

  describe('error state management', () => {
    it('should set error message', () => {
      service.setError('An error occurred');
      expect(service.error()).toBe('An error occurred');
    });

    it('should clear error message', () => {
      service.setError('An error occurred');
      expect(service.error()).toBe('An error occurred');

      service.clearError();
      expect(service.error()).toBeNull();
    });
  });
});
