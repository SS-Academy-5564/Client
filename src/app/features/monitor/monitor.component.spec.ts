import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MonitorComponent } from './monitor.component';
import { MonitorService } from '@core/services/monitor.service';
import { MonitorModel, MonitorStatus } from '@core/models/monitor-model';
import { MonitorPage } from '@core/services/monitor.service';

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
    error: signal<string | null>(null),
    getMonitors: vi.fn((pageNumber = 1, pageSize = 10, status: MonitorStatus | null = null) => {
      const items = status === null ? monitors : monitors.filter((monitor) => monitor.status === status);

      return of({
        items,
        pageNumber,
        pageSize,
        totalCount: items.length,
        totalPages: items.length === 0 ? 0 : 1,
      } satisfies MonitorPage);
    }),
    createMonitor: vi.fn(),
  };

  const createdMonitor: MonitorModel = {
    id: 'created-monitor',
    name: 'Created monitor',
    url: 'https://example.com/created',
    currentValue: null,
    lastCheckedAt: null,
    status: MonitorStatus.Enabled,
    interval: 300,
  };

  const getRenderedMonitorNames = (): string[] => {
    const rootElement = fixture.nativeElement as HTMLElement;

    return Array.from(rootElement.querySelectorAll('.monitor-name')).map(
      (element) => element.textContent?.trim() ?? '',
    );
  };

  const selectStatus = async (status: MonitorStatus | null): Promise<void> => {
    component.onClickStatus(status);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [MonitorComponent],
      providers: [
        { provide: MonitorService, useValue: monitorServiceMock },
        provideNoopAnimations(),
        provideRouter([]),
      ],
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
  ])('filters rendered monitors by the $tab tab', async ({ status, expectedNames }) => {
    await selectStatus(status);

    expect(getRenderedMonitorNames()).toEqual(expectedNames);
  });

  it('shows monitors with every status, including Error, on the All tab', async () => {
    await selectStatus(MonitorStatus.Enabled);
    await selectStatus(null);

    expect(getRenderedMonitorNames()).toEqual(['Enabled monitor', 'Disabled monitor', 'Error monitor']);
  });

  it('opens the create panel when the New Monitor button is clicked', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.new-monitor-button');
    button?.click();
    fixture.detectChanges();

    const panel = (fixture.nativeElement as HTMLElement).querySelector('.panel');
    expect(panel).not.toBeNull();
  });

  it('reloads the first page and shows a success banner after creating a monitor', async () => {
    component.onMonitorCreated(createdMonitor);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(monitorServiceMock.getMonitors).toHaveBeenLastCalledWith(1, 10, null);

    const banner = (fixture.nativeElement as HTMLElement).querySelector('.success-banner');
    expect(banner?.textContent).toContain('Created monitor');
  });

  it('requests the selected status from the server', async () => {
    await selectStatus(MonitorStatus.Disabled);

    expect(monitorServiceMock.getMonitors).toHaveBeenLastCalledWith(1, 10, MonitorStatus.Disabled);
  });

  it('dismisses the success banner', () => {
    component.onMonitorCreated(createdMonitor);
    fixture.detectChanges();

    const dismiss = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.success-dismiss');
    dismiss?.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.success-banner')).toBeNull();
  });
});
