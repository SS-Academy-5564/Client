import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';

describe('ErrorMessageComponent', () => {
  let component: ErrorMessageComponent;
  let fixture: ComponentFixture<ErrorMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorMessageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display error message when provided', () => {
    fixture.componentRef.setInput('message', 'Test Error');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('.error-banner');
    expect(banner).toBeTruthy();
    expect(banner?.textContent?.trim()).toBe('Test Error');
  });

  it('should not display error banner when message is null', () => {
    fixture.componentRef.setInput('message', null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('.error-banner');
    expect(banner).toBeNull();
  });
});
