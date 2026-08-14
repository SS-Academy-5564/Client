import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetFormComponent } from './widget-form.component';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { MonitorLookupDto, MonitorService } from '@core/services/monitor.service';
import { Observable, of } from 'rxjs';

describe('WidgetFormComponent', () => {
  let fixture: ComponentFixture<WidgetFormComponent>;
  let component: WidgetFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetFormComponent],
      providers: [
        {
          provide: MonitorService,
          useValue: {
            getMonitorsLookup: (): Observable<MonitorLookupDto[]> => of([]),
          },
        },
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

    fixture = TestBed.createComponent(WidgetFormComponent);
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
      monitorId: 'mon-1',
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
      monitorId: 'mon-1',
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

    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    component.onClose();

    expect(closedSpy).not.toHaveBeenCalled();
  });

  it('should reset form when opened', async () => {
    component.form.patchValue({
      monitorId: 'mon-1',
      type: 'line-chart',
      metric: 'errors',
      timeRange: '24h',
    });

    fixture.componentRef.setInput('isOpen', true);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.value).toEqual({
      monitorId: '',
      type: '',
      title: null,
      subtitle: null,
      metric: '',
      timeRange: '',
      settings: null,
    });
  });

  it('should prefill form with widget configuration when editing', async () => {
    fixture.componentRef.setInput('widget', {
      id: '1',
      monitorId: 'mon-1',
      type: 'line-chart',
      title: 'Response chart',
      subtitle: 'Last 24 hours',
      metric: 'responseTime',
      timeRange: '24h',
      settings: '{"showGrid":true}',
    });

    fixture.componentRef.setInput('isOpen', true);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.value).toEqual({
      monitorId: 'mon-1',
      type: 'line-chart',
      title: 'Response chart',
      subtitle: 'Last 24 hours',
      metric: 'responseTime',
      timeRange: '24h',
      settings: '{"showGrid":true}',
    });
  });

  it('should preserve null optional fields when editing without touching them', async () => {
    const updatedSpy = vi.fn();

    component.updated.subscribe(updatedSpy);

    fixture.componentRef.setInput('widget', {
      id: '1',
      monitorId: 'mon-1',
      type: 'stat-card',
      title: null,
      subtitle: null,
      metric: 'availability',
      timeRange: '24h',
      settings: null,
    });

    fixture.componentRef.setInput('isOpen', true);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.value).toEqual({
      monitorId: 'mon-1',
      type: 'stat-card',
      title: null,
      subtitle: null,
      metric: 'availability',
      timeRange: '24h',
      settings: null,
    });

    component.onSubmit();

    expect(updatedSpy).toHaveBeenCalledWith({
      widgetId: '1',
      monitorId: 'mon-1',
      type: 'stat-card',
      title: null,
      subtitle: null,
      metric: 'availability',
      timeRange: '24h',
      settings: null,
    });
  });

  it('should emit updated event when form is valid in edit mode', async () => {
    const updatedSpy = vi.fn();

    component.updated.subscribe(updatedSpy);

    fixture.componentRef.setInput('widget', {
      id: '1',
      monitorId: 'mon-1',
      type: 'line-chart',
      metric: 'responseTime',
      timeRange: '24h',
    });

    fixture.detectChanges();
    await fixture.whenStable();

    component.form.setValue({
      monitorId: 'mon-1',
      type: 'bar-chart',
      title: 'Updated title',
      subtitle: 'Updated subtitle',
      metric: 'requests',
      timeRange: '7d',
      settings: '{}',
    });

    component.onSubmit();

    expect(updatedSpy).toHaveBeenCalledWith({
      widgetId: '1',
      monitorId: 'mon-1',
      type: 'bar-chart',
      title: 'Updated title',
      subtitle: 'Updated subtitle',
      metric: 'requests',
      timeRange: '7d',
      settings: '{}',
    });
  });

  it('should not emit updated event when form is invalid in edit mode', async () => {
    const updatedSpy = vi.fn();

    component.updated.subscribe(updatedSpy);

    fixture.componentRef.setInput('widget', {
      id: '1',
      monitorId: 'mon-1',
      type: 'line-chart',
      metric: 'responseTime',
      timeRange: '24h',
    });

    fixture.detectChanges();
    await fixture.whenStable();

    component.form.reset({
      monitorId: '',
      type: '',
      metric: '',
      timeRange: '',
    });

    component.onSubmit();

    expect(updatedSpy).not.toHaveBeenCalled();
  });
});
