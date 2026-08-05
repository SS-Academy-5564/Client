import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateWidgetComponent } from './create-widget.component';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

describe('CreateWidgetComponent', () => {
  let fixture: ComponentFixture<CreateWidgetComponent>;
  let component: CreateWidgetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWidgetComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {},
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateWidgetComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('dashboardTabId', '00000000-0000-0000-0000-000000000001');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit created event when form is valid', () => {
    const createdSpy = vi.fn();

    component.created.subscribe(createdSpy);

    component.form.setValue({
      type: 'line-chart',
      title: 'Response chart',
      subtitle: 'Last 24 hours',
      metric: 'responseTime',
      timeRange: '24h',
      settings: '',
    });

    component.onSubmit();

    expect(createdSpy).toHaveBeenCalledWith({
      dashboardTabId: '00000000-0000-0000-0000-000000000001',
      type: 'line-chart',
      title: 'Response chart',
      subtitle: 'Last 24 hours',
      metric: 'responseTime',
      timeRange: '24h',
      settings: '',
    });
  });

  it('should not emit created event when form is invalid', () => {
    const createdSpy = vi.fn();

    component.created.subscribe(createdSpy);

    component.onSubmit();

    expect(createdSpy).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('should emit closed event when closing widget', () => {
    const closedSpy = vi.fn();

    component.closed.subscribe(closedSpy);

    component.onClose();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('should not close while submitting', () => {
    const closedSpy = vi.fn();

    component.closed.subscribe(closedSpy);

    component.submitting.set(true);

    component.onClose();

    expect(closedSpy).not.toHaveBeenCalled();
  });

  it('should reset form when opened', async () => {
    component.form.patchValue({
      type: 'line-chart',
      metric: 'errors',
      timeRange: '24h',
    });

    fixture.componentRef.setInput('isOpen', true);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.value).toEqual({
      type: '',
      title: '',
      subtitle: '',
      metric: '',
      timeRange: '',
      settings: '',
    });
  });
});
