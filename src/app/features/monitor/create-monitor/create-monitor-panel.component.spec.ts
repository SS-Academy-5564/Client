import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateMonitorPanelComponent } from './create-monitor-panel.component';
import { MonitorService } from '@core/services/monitor.service';
import { MonitorModel, MonitorStatus } from '@core/models/monitor-model';

describe('CreateMonitorPanelComponent', () => {
  let component: CreateMonitorPanelComponent;
  let fixture: ComponentFixture<CreateMonitorPanelComponent>;

  const createdMonitor: MonitorModel = {
    id: 'new-id',
    name: 'EUR/USD Rate',
    url: 'https://api.example.com/data',
    currentValue: null,
    lastCheckedAt: null,
    status: MonitorStatus.Enabled,
    interval: 300,
    organizationId: 'org-1',
  };

  const monitorServiceMock = {
    createMonitor: vi.fn(),
  };

  beforeEach(async () => {
    monitorServiceMock.createMonitor.mockReset();

    await TestBed.configureTestingModule({
      imports: [CreateMonitorPanelComponent],
      providers: [
        { provide: MonitorService, useValue: monitorServiceMock },
        provideNoopAnimations(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateMonitorPanelComponent);
    fixture.componentRef.setInput('isOpen', true);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits created with the new monitor on successful submission', () => {
    monitorServiceMock.createMonitor.mockReturnValue(of(createdMonitor));
    const createdSpy = vi.fn();
    component.created.subscribe(createdSpy);

    component.onSubmit({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      status: MonitorStatus.Enabled,
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });

    expect(monitorServiceMock.createMonitor).toHaveBeenCalledWith({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });
    expect(createdSpy).toHaveBeenCalledWith(createdMonitor);
  });

  it('sets serverErrors from the response body on a 400 error', () => {
    const errorResponse = new HttpErrorResponse({
      status: 400,
      error: { errors: [{ field: 'Name', message: 'Monitor name is required.' }] },
    });
    monitorServiceMock.createMonitor.mockReturnValue(throwError(() => errorResponse));

    component.onSubmit({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      status: MonitorStatus.Enabled,
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });

    expect(component['serverErrors']()).toEqual([{ field: 'Name', message: 'Monitor name is required.' }]);
  });

  it('emits closed when onClose is called', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    component.onClose();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('clears serverErrors when onClose is called', () => {
    component['serverErrors'].set([{ message: 'some error' }]);

    component.onClose();

    expect(component['serverErrors']()).toBeNull();
  });
});
