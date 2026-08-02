import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditMonitorPanelComponent } from './edit-monitor-panel.component';
import { MonitorService } from '@core/services/monitor.service';
import { ToastService } from '@core/services/toast.service';
import { MonitorDetail, MonitorModel, MonitorStatus } from '@core/models/monitor-model';

describe('EditMonitorPanelComponent', () => {
  let component: EditMonitorPanelComponent;
  let fixture: ComponentFixture<EditMonitorPanelComponent>;

  const monitorDetail: MonitorDetail = {
    id: 'monitor-1',
    name: 'EUR/USD Rate',
    url: 'https://api.example.com/data',
    httpMethod: 'GET',
    resultPath: 'data.usd.rate',
    currentValue: '1.0847',
    status: MonitorStatus.Enabled,
    pollingIntervalSeconds: 300,
    pollingTimeoutSeconds: 10,
    lastCheckedAt: null,
    nextExecutionAt: '2026-07-28T00:17:34Z',
    createdAt: '2026-07-21T10:00:00+00:00',
    lastModifiedAt: '2026-07-28T00:00:00+00:00',
  };

  const updatedMonitor: MonitorModel = {
    id: 'monitor-1',
    name: 'EUR/USD Rate',
    url: 'https://api.example.com/data',
    currentValue: null,
    lastCheckedAt: null,
    status: MonitorStatus.Enabled,
    interval: 300,
    organizationId: 'org-1',
  };

  const monitorServiceMock = {
    getMonitorById: vi.fn(),
    updateMonitor: vi.fn(),
  };

  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    monitorServiceMock.getMonitorById.mockReturnValue(of(monitorDetail));

    await TestBed.configureTestingModule({
      imports: [EditMonitorPanelComponent],
      providers: [
        { provide: MonitorService, useValue: monitorServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        provideNoopAnimations(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMonitorPanelComponent);
    fixture.componentRef.setInput('monitorId', null);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fetches monitor detail when monitorId becomes non-null', async (): Promise<void> => {
    fixture.componentRef.setInput('monitorId', 'monitor-1');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(monitorServiceMock.getMonitorById).toHaveBeenCalledWith('monitor-1');
  });

  it('cancels in-flight detail request when monitorId changes', async (): Promise<void> => {
    const detailSubject1 = new Subject<MonitorDetail>();
    const detailSubject2 = new Subject<MonitorDetail>();
    monitorServiceMock.getMonitorById.mockImplementation((id: string) =>
      id === 'monitor-1' ? detailSubject1 : detailSubject2,
    );

    fixture.componentRef.setInput('monitorId', 'monitor-1');
    fixture.detectChanges();

    expect(detailSubject1.observed).toBe(true);

    fixture.componentRef.setInput('monitorId', 'monitor-2');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(detailSubject1.observed).toBe(false);
    expect(detailSubject2.observed).toBe(true);
  });

  it('pre-fills the form from the fetched detail', async () => {
    fixture.componentRef.setInput('monitorId', 'monitor-1');
    fixture.detectChanges();
    await fixture.whenStable();

    const value = component['initialValue']();
    expect(value?.name).toBe('EUR/USD Rate');
    expect(value?.httpMethod).toBe('GET');
    expect(value?.status).toBe(MonitorStatus.Enabled);
  });

  it('pre-fills the form with Error status when the monitor has Error status', async () => {
    monitorServiceMock.getMonitorById.mockReturnValue(of({ ...monitorDetail, status: MonitorStatus.Error }));

    fixture.componentRef.setInput('monitorId', 'monitor-1');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['initialValue']()?.status).toBe(MonitorStatus.Error);
  });

  it('converts Error status to Enabled when submitting', () => {
    monitorServiceMock.updateMonitor.mockReturnValue(of(updatedMonitor));
    fixture.componentRef.setInput('monitorId', 'monitor-1');

    component.onSubmit({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      status: MonitorStatus.Error,
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });

    expect(monitorServiceMock.updateMonitor).toHaveBeenCalledWith(
      'monitor-1',
      expect.objectContaining({
        status: MonitorStatus.Enabled,
      }),
    );
  });

  it('shows a toast and emits closed when the detail fetch fails', async () => {
    monitorServiceMock.getMonitorById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    fixture.componentRef.setInput('monitorId', 'monitor-1');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(toastServiceMock.error).toHaveBeenCalled();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('calls updateMonitor and emits updated on successful submission', async () => {
    monitorServiceMock.updateMonitor.mockReturnValue(of(updatedMonitor));
    const updatedSpy = vi.fn();
    component.updated.subscribe(updatedSpy);

    fixture.componentRef.setInput('monitorId', 'monitor-1');
    fixture.detectChanges();
    await fixture.whenStable();

    component.onSubmit({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      status: MonitorStatus.Enabled,
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });

    expect(monitorServiceMock.updateMonitor).toHaveBeenCalledWith('monitor-1', {
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      status: MonitorStatus.Enabled,
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });
    expect(updatedSpy).toHaveBeenCalledWith(updatedMonitor);
  });

  it('sets serverErrors from the response body on a 400 error', async () => {
    const errorResponse = new HttpErrorResponse({
      status: 400,
      error: { errors: [{ field: 'Name', message: 'Name is required.' }] },
    });
    monitorServiceMock.updateMonitor.mockReturnValue(throwError(() => errorResponse));

    fixture.componentRef.setInput('monitorId', 'monitor-1');
    fixture.detectChanges();
    await fixture.whenStable();

    component.onSubmit({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      status: MonitorStatus.Enabled,
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });

    const errors = component['serverErrors']();
    expect(errors).toEqual([{ field: 'Name', message: 'Name is required.' }]);
  });

  it('clears state and emits closed when onClose is called', async () => {
    monitorServiceMock.getMonitorById.mockReturnValue(of(monitorDetail));
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    fixture.componentRef.setInput('monitorId', 'monitor-1');
    fixture.detectChanges();
    await fixture.whenStable();

    component.onClose();

    expect(component['serverErrors']()).toBeNull();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('does not call updateMonitor when monitorId is null', () => {
    component.onSubmit({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      status: MonitorStatus.Enabled,
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });

    expect(monitorServiceMock.updateMonitor).not.toHaveBeenCalled();
  });
});
