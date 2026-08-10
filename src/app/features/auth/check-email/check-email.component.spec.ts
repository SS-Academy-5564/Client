import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { CheckEmailComponent } from './check-email.component';

describe('CheckEmailComponent', () => {
  let fixture: ComponentFixture<CheckEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckEmailComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckEmailComponent);
    fixture.detectChanges();
  });

  it('should explain that a verification email was sent', () => {
    expect(fixture.nativeElement.textContent).toContain('Check your email');
    expect(fixture.nativeElement.textContent).toContain('We sent you a verification email');
  });

  it('should provide only the sign-in action', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('button')).map((button) =>
      (button as HTMLButtonElement).textContent?.trim(),
    );

    expect(links).toEqual(['Sign in']);
  });
});
