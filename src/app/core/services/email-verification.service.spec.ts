import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { environment } from '@environments/environment';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let httpMock: { post: ReturnType<typeof vi.fn> };

  beforeEach((): void => {
    httpMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [EmailVerificationService, { provide: HttpClient, useValue: httpMock }],
    });

    service = TestBed.inject(EmailVerificationService);
  });

  it('should post the token to the verification endpoint', (): void => {
    httpMock.post.mockReturnValue(of({ success: true, data: null, errors: [] }));

    service.verify('verification-token').subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/email-verification/verify`, {
      token: 'verification-token',
    });
  });

  it('should post the email to the resend endpoint', (): void => {
    httpMock.post.mockReturnValue(
      of({
        success: true,
        data: { resendCooldownSeconds: 60 },
        errors: [],
      }),
    );

    service.requestResend('user@example.com').subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/email-verification/resend`, {
      email: 'user@example.com',
    });
  });

  it('should post the expired token to the expired-link resend endpoint', (): void => {
    httpMock.post.mockReturnValue(
      of({
        success: true,
        data: { resendCooldownSeconds: 60 },
        errors: [],
      }),
    );

    service.resendExpired('expired-token').subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(`${environment.apiBaseUrl}/auth/email-verification/resend-expired`, {
      token: 'expired-token',
    });
  });
});
