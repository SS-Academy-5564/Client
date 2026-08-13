import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { EmailVerificationService } from '@core/services/email-verification.service';
import { ROUTES } from '@core/constants/route.constants';
import { ToastService } from '@core/services/toast.service';
import { CheckEmailComponent } from './check-email.component';

describe('CheckEmailComponent', (): void => {
  let fixture: ComponentFixture<CheckEmailComponent>;
  let router: Router;
  let serviceMock: { requestResend: ReturnType<typeof vi.fn> };
  const toastServiceMock = { success: vi.fn() };

  beforeEach(async (): Promise<void> => {
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

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture = TestBed.createComponent(CheckEmailComponent);
    fixture.detectChanges();
  });

  it('should explain that a verification email was sent', (): void => {
    expect(fixture.nativeElement.textContent).toContain('Check your email');
    expect(fixture.nativeElement.textContent).toContain('We sent you a verification email');
  });

  it('should reuse the registration email without rendering another email input', (): void => {
    expect(fixture.nativeElement.querySelector('input[type="email"]')).toBeNull();
    expect(buttonLabels()).toEqual(['Sign in', 'Resend Email']);
  });

  it('should redirect to registration when navigation state is null', (): void => {
    fixture.destroy();
    history.replaceState(null, '');

    fixture = TestBed.createComponent(CheckEmailComponent);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith([ROUTES.REGISTER]);
  });

  it('should request another email and show a privacy-safe confirmation', (): void => {
    clickButton('Resend Email');
    fixture.detectChanges();

    expect(serviceMock.requestResend).toHaveBeenCalledWith('user@example.com');
    expect(toastServiceMock.success).toHaveBeenCalledWith('If eligible, a new verification email has been sent.');
    expect(fixture.nativeElement.textContent).toContain('Resend in 47s');
  });

  it('should show an error when a successful resend response has no payload', (): void => {
    serviceMock.requestResend.mockReturnValue(of({ success: true, data: null, errors: [] }));

    clickButton('Resend Email');
    fixture.detectChanges();

    expect(toastServiceMock.success).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('We could not process the request. Please try again.');
    expect(fixture.nativeElement.textContent).not.toContain('Resend in');
  });

  it('should disable resend while the request is in progress', (): void => {
    const response = new Subject();
    serviceMock.requestResend.mockReturnValue(response);

    clickButton('Resend Email');
    fixture.detectChanges();

    const resendButton = findButton('Sending…');
    expect(resendButton).toBeDefined();
    expect(resendButton!.disabled).toBe(true);

    response.complete();
  });

  it('should show a clear message when the IP rate limit is exceeded', (): void => {
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
    const button = findButton(label);

    expect(button).toBeDefined();
    button!.click();
  }

  function findButton(label: string): HTMLButtonElement | undefined {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
  }
});
