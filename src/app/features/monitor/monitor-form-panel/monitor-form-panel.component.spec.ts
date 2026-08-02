import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MonitorFormPanelComponent, MonitorFormValue } from './monitor-form-panel.component';
import { MonitorStatus } from '@core/models/monitor-model';

describe('MonitorFormPanelComponent', () => {
  let component: MonitorFormPanelComponent;
  let fixture: ComponentFixture<MonitorFormPanelComponent>;

  const validFormValue: MonitorFormValue = {
    name: 'EUR/USD Rate',
    httpMethod: 'GET',
    url: 'https://api.example.com/data',
    resultPath: 'data.usd.rate',
    status: MonitorStatus.Enabled,
    pollingIntervalSeconds: 300,
    pollingTimeoutSeconds: 10,
  };

  const fillValidForm = (): void => {
    component['form'].setValue(validFormValue);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitorFormPanelComponent],
      providers: [provideNoopAnimations(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitorFormPanelComponent);
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('submitLabel', 'Submit');
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not emit submitted when the form is invalid', () => {
    const submittedSpy = vi.fn();
    component.submitted.subscribe(submittedSpy);

    component.onSubmit();

    expect(submittedSpy).not.toHaveBeenCalled();
  });

  it('marks all controls as touched when submitted with an invalid form', () => {
    component.onSubmit();

    expect(component['form'].get('name')?.touched).toBe(true);
    expect(component['form'].get('url')?.touched).toBe(true);
  });

  it('emits submitted with the form value when the form is valid', () => {
    const submittedSpy = vi.fn();
    component.submitted.subscribe(submittedSpy);
    fillValidForm();

    component.onSubmit();

    expect(submittedSpy).toHaveBeenCalledWith(validFormValue);
  });

  it('emits closed when closed', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);
    fillValidForm();

    component.onClose();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('pre-fills the form when initialValue input changes', async () => {
    fixture.componentRef.setInput('initialValue', validFormValue);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['form'].getRawValue()).toEqual(validFormValue);
  });

  it('applies server errors to form controls and sets bannerError', async () => {
    const errors = [{ field: 'Name', message: 'Name is taken.' }];
    fixture.componentRef.setInput('serverErrors', errors);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['form'].get('name')?.getError('server')).toBe('Name is taken.');
    expect(component['bannerError']()).toBe('Please check the form for errors.');
  });

  it('clears bannerError when serverErrors is set to null', async () => {
    fixture.componentRef.setInput('serverErrors', [{ field: 'Name', message: 'Err' }]);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentRef.setInput('serverErrors', null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['bannerError']()).toBeNull();
  });

  it('shows the status field when showStatus is true', async () => {
    fixture.componentRef.setInput('showStatus', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const statusSelect = (fixture.nativeElement as HTMLElement).querySelector('#monitor-status');
    expect(statusSelect).not.toBeNull();
  });

  it('hides the status field when showStatus is false', async () => {
    fixture.componentRef.setInput('showStatus', false);
    fixture.detectChanges();
    await fixture.whenStable();

    const statusSelect = (fixture.nativeElement as HTMLElement).querySelector('#monitor-status');
    expect(statusSelect).toBeNull();
  });

  it('shows the loading indicator when isLoadingInitial is true', async () => {
    fixture.componentRef.setInput('isLoadingInitial', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const loading = (fixture.nativeElement as HTMLElement).querySelector('.panel-loading');
    expect(loading).not.toBeNull();
  });

  it('does not close when a submission is in flight', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);
    fixture.componentRef.setInput('submitting', true);

    component.onClose();

    expect(closedSpy).not.toHaveBeenCalled();
  });

  it('marks the url control invalid for a non-HTTP protocol', () => {
    component['form'].get('url')?.setValue('ftp://example.com');
    component['form'].get('url')?.markAsTouched();

    expect(component['form'].get('url')?.hasError('url')).toBe(true);
  });

  it('marks the url control invalid for a plain string', () => {
    component['form'].get('url')?.setValue('not-a-url');
    component['form'].get('url')?.markAsTouched();

    expect(component['form'].get('url')?.hasError('url')).toBe(true);
  });

  it('does not mark the url control invalid for a valid https URL', () => {
    component['form'].get('url')?.setValue('https://api.example.com/data');
    component['form'].get('url')?.markAsTouched();

    expect(component['form'].get('url')?.hasError('url')).toBe(false);
  });

  it('emits closed when Escape key is pressed', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    fixture.nativeElement.dispatchEvent(event);

    expect(closedSpy).toHaveBeenCalled();
  });
});
