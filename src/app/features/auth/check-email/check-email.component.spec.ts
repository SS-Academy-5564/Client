import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { EmailVerificationService } from '@core/services/email-verification.service';
import { ToastService } from '@core/services/toast.service';
import { CheckEmailComponent } from './check-email.component';

describe('CheckEmailComponent', () => {
  let fixture: ComponentFixture<CheckEmailComponent>;
  let serviceMock: { requestResend: ReturnType<typeof vi.fn> };
  const toastServiceMock = { success: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    history.replaceState({ email: 'user@example.com', cooldown: 0 }, '');
    serviceMock = {
      requestResend: vi.fn().mockReturnValue(
        of({
          success: true,
          data: { resendCooldownSeconds: 47 },
          errors: [],
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CheckEmailComponent],
      providers: [
        provideRouter([]),
        { provide: EmailVerificationService, useValue: serviceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckEmailComponent);
    fixture.detectChanges();
  });

  it('should explain that a verification email was sent', () => {
    expect(fixture.nativeElement.textContent).toContain('Check your email');
    expect(fixture.nativeElement.textContent).toContain('We sent you a verification email');
  });

  it('should reuse the registration email without rendering another email input', () => {
    expect(fixture.nativeElement.querySelector('input[type="email"]')).toBeNull();
    expect(buttonLabels()).toEqual(['Sign in', 'Resend Email']);
  });

  it('should request another email and show a privacy-safe confirmation', () => {
    clickButton('Resend Email');
    fixture.detectChanges();

    expect(serviceMock.requestResend).toHaveBeenCalledWith('user@example.com');
    expect(toastServiceMock.success).toHaveBeenCalledWith('If eligible, a new verification email has been sent.');
    expect(fixture.nativeElement.textContent).toContain('Resend in 47s');
  });

  it('should show a clear message when the IP rate limit is exceeded', () => {
    serviceMock.requestResend.mockReturnValue(throwError(() => ({ status: 429 })));

    clickButton('Resend Email');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Please wait before trying again');
    expect(fixture.nativeElement.textContent).not.toContain('Resend in');
  });

  function buttonLabels(): (string | undefined)[] {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).map((button) =>
      button.textContent?.trim(),
    );
  }

  function clickButton(label: string): void {
    const button = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );

    expect(button).toBeDefined();
    button!.click();
  }
});
