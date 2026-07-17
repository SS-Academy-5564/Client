import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

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
  };

  const monitorServiceMock = {
    createMonitor: vi.fn(),
  };

  const fillValidForm = (): void => {
    component['form'].setValue({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });
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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit when required fields are empty', () => {
    component.onSubmit();

    expect(monitorServiceMock.createMonitor).not.toHaveBeenCalled();
  });

  it('emits created and resets on successful submit', () => {
    monitorServiceMock.createMonitor.mockReturnValue(of(createdMonitor));
    const createdSpy = vi.fn();
    component.created.subscribe(createdSpy);

    fillValidForm();
    component.onSubmit();

    expect(monitorServiceMock.createMonitor).toHaveBeenCalledWith({
      name: 'EUR/USD Rate',
      httpMethod: 'GET',
      url: 'https://api.example.com/data',
      resultPath: 'data.usd.rate',
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    });
    expect(createdSpy).toHaveBeenCalledWith(createdMonitor);
    expect(component['form'].getRawValue().name).toBe('');
  });

  it('maps server field errors onto the form controls', () => {
    const errorResponse = new HttpErrorResponse({
      status: 400,
      error: { errors: [{ field: 'Name', message: 'Monitor name is required.' }] },
    });
    monitorServiceMock.createMonitor.mockReturnValue(throwError(() => errorResponse));

    fillValidForm();
    component.onSubmit();

    expect(component['form'].get('name')?.getError('server')).toBe('Monitor name is required.');
    expect(component['error']()).toBe('Monitor name is required.');
  });

  it('emits closed when cancelled', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    component.onClose();

    expect(closedSpy).toHaveBeenCalled();
  });
});
