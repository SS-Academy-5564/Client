import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { MonitorComponent } from './monitor.component';
import { MonitorService } from '@core/services/monitor.service';
import { MonitorModel, MonitorStatus } from '@core/models/monitor-model';

describe('MonitorComponent', () => {
  let component: MonitorComponent;
  let fixture: ComponentFixture<MonitorComponent>;
  const monitors: MonitorModel[] = [
    {
      id: 'enabled-monitor',
      name: 'Enabled monitor',
      url: 'https://example.com/enabled',
      currentValue: '200',
      lastCheckedAt: null,
      status: MonitorStatus.Enabled,
      interval: 60,
    },
    {
      id: 'disabled-monitor',
      name: 'Disabled monitor',
      url: 'https://example.com/disabled',
      currentValue: null,
      lastCheckedAt: null,
      status: MonitorStatus.Disabled,
      interval: 300,
    },
    {
      id: 'error-monitor',
      name: 'Error monitor',
      url: 'https://example.com/error',
      currentValue: null,
      lastCheckedAt: null,
      status: MonitorStatus.Error,
      interval: 900,
    },
  ];
  const monitorServiceMock = {
    isLoading: signal(false),
    errors: signal<string | null>(null),
    getMonitors: vi.fn().mockReturnValue(of(monitors)),
  };

  const getRenderedMonitorNames = (): string[] => {
    const rootElement = fixture.nativeElement as HTMLElement;

    return Array.from(rootElement.querySelectorAll('.monitor-name')).map(
      (element) => element.textContent?.trim() ?? '',
    );
  };

  const selectStatus = (status: MonitorStatus | null): void => {
    component.onClickStatus(status);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitorComponent],
      providers: [{ provide: MonitorService, useValue: monitorServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.each([
    { tab: 'Enabled', status: MonitorStatus.Enabled, expectedNames: ['Enabled monitor'] },
    { tab: 'Disabled', status: MonitorStatus.Disabled, expectedNames: ['Disabled monitor'] },
  ])('filters rendered monitors by the $tab tab', ({ status, expectedNames }) => {
    selectStatus(status);

    expect(getRenderedMonitorNames()).toEqual(expectedNames);
  });

  it('shows monitors with every status, including Error, on the All tab', () => {
    selectStatus(MonitorStatus.Enabled);
    selectStatus(null);

    expect(getRenderedMonitorNames()).toEqual(['Enabled monitor', 'Disabled monitor', 'Error monitor']);
  });
});
