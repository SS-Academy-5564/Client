import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, Subscription, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MonitorComponent } from './monitor.component';
import { MonitorPage, MonitorService } from '@core/services/monitor.service';
import { ToastService } from '@core/services/toast.service';
import { MonitorModel, MonitorStatus } from '@core/models/monitor-model';
import { SignalrService } from '@core/services/signalr.service';

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
      organizationId: 'org-1',
    },
    {
      id: 'disabled-monitor',
      name: 'Disabled monitor',
      url: 'https://example.com/disabled',
      currentValue: null,
      lastCheckedAt: null,
      status: MonitorStatus.Disabled,
      interval: 300,
      organizationId: 'org-1',
    },
    {
      id: 'error-monitor',
      name: 'Error monitor',
      url: 'https://example.com/error',
      currentValue: null,
      lastCheckedAt: null,
      status: MonitorStatus.Error,
      interval: 900,
      organizationId: 'org-1',
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
    triggerMonitorCheck: vi.fn().mockReturnValue(of(undefined)),
  };
  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
  };
  let monitorsUpdatedHandler:
    | ((
        updates: {
          monitorId: string;
          currentValue: string | null;
          lastCheckedAt: string;
          nextExecutionAt: string;
          status: string;
        }[],
      ) => void)
    | null;
  let monitorsUpdatedSubscription: Subscription;
  const signalrServiceMock = {
    start: vi.fn(() => of(undefined)),
    stop: vi.fn(() => of(undefined)),
    onMonitorsUpdated: vi.fn((handler: typeof monitorsUpdatedHandler) => {
      monitorsUpdatedHandler = handler;
      monitorsUpdatedSubscription = new Subscription();
      return monitorsUpdatedSubscription;
    }),
  };

  const createdMonitor: MonitorModel = {
    id: 'created-monitor',
    name: 'Created monitor',
    url: 'https://example.com/created',
    currentValue: null,
    lastCheckedAt: null,
    status: MonitorStatus.Enabled,
    interval: 300,
    organizationId: 'org-1',
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
    monitorsUpdatedHandler = null;
    monitorsUpdatedSubscription = new Subscription();
    monitorServiceMock.triggerMonitorCheck.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [MonitorComponent],
      providers: [
        { provide: MonitorService, useValue: monitorServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: SignalrService, useValue: signalrServiceMock },
        provideNoopAnimations(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('subscribes before starting the SignalR connection', (): void => {
    expect(signalrServiceMock.onMonitorsUpdated).toHaveBeenCalledOnce();
    expect(signalrServiceMock.start).toHaveBeenCalledOnce();
    expect(signalrServiceMock.onMonitorsUpdated.mock.invocationCallOrder[0]).toBeLessThan(
      signalrServiceMock.start.mock.invocationCallOrder[0],
    );
  });

  it('updates matching monitors in local state when SignalR updates without HTTP refresh', (): void => {
    const initialRequestCount = monitorServiceMock.getMonitors.mock.calls.length;

    monitorsUpdatedHandler?.([
      {
        monitorId: 'enabled-monitor',
        currentValue: 'healthy',
        lastCheckedAt: '2026-08-05T08:00:00Z',
        nextExecutionAt: '2026-08-05T08:01:00Z',
        status: 'Enabled',
      },
      {
        monitorId: 'not-on-page-monitor',
        currentValue: '500',
        lastCheckedAt: '2026-08-05T08:00:00Z',
        nextExecutionAt: '2026-08-05T08:01:00Z',
        status: 'Error',
      },
    ]);

    const updatedMonitor = (component as unknown as { monitors: () => MonitorModel[] })
      .monitors()
      .find((m) => m.id === 'enabled-monitor');
    expect(updatedMonitor?.currentValue).toBe('healthy');
    expect(updatedMonitor?.lastCheckedAt).toBe('2026-08-05T08:00:00Z');
    expect(monitorServiceMock.getMonitors).toHaveBeenCalledTimes(initialRequestCount);
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

  it('closes panel and shows toast notification when a monitor is created', () => {
    component.onOpenPanel();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.panel')).not.toBeNull();

    component.onMonitorCreated(createdMonitor);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.panel')).toBeNull();
    expect(toastServiceMock.success).toHaveBeenCalledWith(expect.stringContaining(createdMonitor.name));
  });

  it('navigates to page 1 with new page size on page size change', (): void => {
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate');

    component.onPageSizeChange(20);

    expect(spy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { page: 1, pageSize: 20 },
      }),
    );
  });

  it('triggers a manual check and shows a success toast', () => {
    component.onRunMonitorCheck(monitors[0]);
    fixture.detectChanges();

    expect(monitorServiceMock.triggerMonitorCheck).toHaveBeenCalledWith('enabled-monitor');
    expect(toastServiceMock.success).toHaveBeenCalledWith('Check initiated successfully.');
  });

  it('tracks the pending state while the manual check request is in flight', () => {
    const triggerSubject = new Subject<void>();
    monitorServiceMock.triggerMonitorCheck.mockReturnValue(triggerSubject.asObservable());

    component.onRunMonitorCheck(monitors[0]);
    fixture.detectChanges();

    expect(component.isMonitorCheckPending('enabled-monitor')).toBe(true);

    triggerSubject.next();
    triggerSubject.complete();
    fixture.detectChanges();

    expect(component.isMonitorCheckPending('enabled-monitor')).toBe(false);
  });

  it('shows an error toast when the manual check request fails', () => {
    monitorServiceMock.triggerMonitorCheck.mockReturnValue(
      throwError(() => new Error('Manual check was already triggered recently. Please wait before trying again.')),
    );

    component.onRunMonitorCheck(monitors[0]);

    expect(toastServiceMock.error).toHaveBeenCalledWith(
      'Manual check was already triggered recently. Please wait before trying again.',
    );
  });
});
