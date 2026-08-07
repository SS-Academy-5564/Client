import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { EmailVerificationService } from '@core/services/email-verification.service';
import { VerifyEmailComponent } from './verify-email.component';

type EmailVerificationServiceMock = {
  verify: ReturnType<typeof vi.fn>;
  resend: ReturnType<typeof vi.fn>;
};

const successResponse = {
  success: true,
  data: null,
  errors: [],
};

const resendSuccessResponse = {
  success: true,
  data: { resendCooldownSeconds: 60 },
  errors: [],
};

describe('VerifyEmailComponent', () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let serviceMock: EmailVerificationServiceMock;
  const routeMock = {
    snapshot: {
      queryParamMap: convertToParamMap({ token: 'verification-token' }),
    },
  };

  beforeEach(async () => {
    serviceMock = {
      verify: vi.fn().mockReturnValue(of(successResponse)),
      resend: vi.fn().mockReturnValue(of(resendSuccessResponse)),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: EmailVerificationService, useValue: serviceMock },
      ],
    }).compileComponents();
  });

  it('should verify the query token and display the successful state', () => {
    createComponent('valid-token');

    expect(serviceMock.verify).toHaveBeenCalledWith('valid-token');
    expect(fixture.nativeElement.textContent).toContain('Email verified');
  });

  it('should display the expired state with a resend action', () => {
    serviceMock.verify.mockReturnValue(throwError(() => apiError(400, 'EMAIL_VERIFICATION_TOKEN_EXPIRED')));

    createComponent('expired-token');

    expect(fixture.nativeElement.textContent).toContain('Verification link expired');
    expect(fixture.nativeElement.textContent).toContain('Resend email');
  });

  it('should display the invalid state for a corrupted or used token', () => {
    serviceMock.verify.mockReturnValue(throwError(() => apiError(409, 'EMAIL_VERIFICATION_TOKEN_ALREADY_USED')));

    createComponent('used-token');

    expect(fixture.nativeElement.textContent).toContain('Invalid verification link');
    expect(fixture.nativeElement.textContent).toContain('invalid or has already been used');
  });

  it('should reject a missing token without calling the backend', () => {
    createComponent(null);

    expect(serviceMock.verify).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Invalid verification link');
  });

  it('should resend an expired verification email and display confirmation', () => {
    serviceMock.verify.mockReturnValue(throwError(() => apiError(400, 'EMAIL_VERIFICATION_TOKEN_EXPIRED')));
    createComponent('expired-token');

    clickButton('Resend email');
    fixture.detectChanges();

    expect(serviceMock.resend).toHaveBeenCalledWith('expired-token');
    expect(fixture.nativeElement.textContent).toContain('A new verification email has been sent');
    expect(fixture.nativeElement.textContent).toContain('Email sent');
  });

  it('should display cooldown guidance when resend is rate limited', () => {
    serviceMock.verify.mockReturnValue(throwError(() => apiError(400, 'EMAIL_VERIFICATION_TOKEN_EXPIRED')));
    serviceMock.resend.mockReturnValue(throwError(() => apiError(429, 'TOO_MANY_REQUESTS')));
    createComponent('expired-token');

    clickButton('Resend email');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Please wait before requesting another verification email');
  });

  function createComponent(token: string | null): void {
    routeMock.snapshot.queryParamMap = convertToParamMap(token ? { token } : {});
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();
  }

  function clickButton(label: string): void {
    const buttons = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'));
    const button = buttons.find((candidate) => candidate.textContent?.trim() === label);

    expect(button).toBeDefined();
    button!.click();
  }
});

function apiError(status: number, code: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    error: {
      success: false,
      errors: [{ code, field: null, message: 'Request failed' }],
    },
  });
}
