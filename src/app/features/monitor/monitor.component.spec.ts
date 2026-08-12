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
  const makeMonitor = (id: string, name: string, status: MonitorStatus): MonitorModel => ({
    id,
    name,
    url: `https://example.com/${id}`,
    currentValue: id === 'enabled-monitor' ? '200' : null,
    lastCheckedAt: null,
    status,
    interval: 60,
    organizationId: 'org-1',
  });
  const monitors: MonitorModel[] = [
    makeMonitor('enabled-monitor', 'Enabled monitor', MonitorStatus.Enabled),
    makeMonitor('disabled-monitor', 'Disabled monitor', MonitorStatus.Disabled),
    makeMonitor('error-monitor', 'Error monitor', MonitorStatus.Error),
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
    getMonitorById: vi.fn(),
    updateMonitor: vi.fn(),
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

  afterEach((): void => {
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
    expect(updatedMonitor?.status).toBe(MonitorStatus.Enabled);
    expect(monitorServiceMock.getMonitors).toHaveBeenCalledTimes(initialRequestCount);
  });

  it('preserves SignalR updates received while initial HTTP request is in flight', (): void => {
    const getMonitorsSubject = new Subject<MonitorPage>();
    monitorServiceMock.getMonitors.mockReturnValueOnce(getMonitorsSubject.asObservable());

    component['loadMonitors'](1, 10);

    monitorsUpdatedHandler?.([
      {
        monitorId: 'enabled-monitor',
        currentValue: '200 OK',
        lastCheckedAt: '2026-08-11T12:00:00Z',
        nextExecutionAt: '2026-08-11T12:01:00Z',
        status: 'Enabled',
      },
    ]);

    getMonitorsSubject.next({
      items: monitors,
      pageNumber: 1,
      pageSize: 10,
      totalCount: monitors.length,
      totalPages: 1,
    });
    getMonitorsSubject.complete();

    const updatedMonitor = (component as unknown as { monitors: () => MonitorModel[] })
      .monitors()
      .find((m) => m.id === 'enabled-monitor');
    expect(updatedMonitor?.currentValue).toBe('200 OK');
    expect(updatedMonitor?.lastCheckedAt).toBe('2026-08-11T12:00:00Z');
    expect(updatedMonitor?.status).toBe(MonitorStatus.Enabled);
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

  it('redirects to the clamped page number when requested page exceeds total pages', (): void => {
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate');

    monitorServiceMock.getMonitors.mockReturnValueOnce(
      of({
        items: monitors,
        pageNumber: 1,
        pageSize: 10,
        totalCount: monitors.length,
        totalPages: 1,
      }),
    );

    component['loadMonitors'](5, 10);

    expect(spy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { page: 1, pageSize: 10 },
        replaceUrl: true,
      }),
    );
  });

  it('sets editingMonitorId when onOpenEditPanel is called', () => {
    component.onOpenEditPanel(monitors[0]);

    expect(component['editingMonitorId']()).toBe('enabled-monitor');
  });

  it('clears editingMonitorId when onCloseEditPanel is called', () => {
    component.onOpenEditPanel(monitors[0]);
    component.onCloseEditPanel();

    expect(component['editingMonitorId']()).toBeNull();
  });

  it('replaces the updated monitor in the list and shows a success toast', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const updatedMonitor: MonitorModel = {
      ...monitors[0],
      name: 'Renamed monitor',
    };

    component.onMonitorUpdated(updatedMonitor);
    fixture.detectChanges();

    expect(getRenderedMonitorNames()).toContain('Renamed monitor');
    expect(getRenderedMonitorNames()).not.toContain('Enabled monitor');
    expect(toastServiceMock.success).toHaveBeenCalledWith(expect.stringContaining('Renamed monitor'));
  });

  it('closes the edit panel after a successful update', () => {
    component.onOpenEditPanel(monitors[0]);
    expect(component['editingMonitorId']()).not.toBeNull();

    component.onMonitorUpdated(monitors[0]);

    expect(component['editingMonitorId']()).toBeNull();
  });

  it('discards stale monitor responses when requests resolve in reverse order', async (): Promise<void> => {
    const subject1 = new Subject<MonitorPage>();
    const subject2 = new Subject<MonitorPage>();

    await selectStatus(MonitorStatus.Enabled);

    monitorServiceMock.getMonitors
      .mockReturnValueOnce(subject1.asObservable())
      .mockReturnValueOnce(subject2.asObservable());

    const update1 = [
      {
        monitorId: 'enabled-monitor',
        currentValue: '200',
        lastCheckedAt: '2026-08-12T10:00:00Z',
        nextExecutionAt: '2026-08-12T10:01:00Z',
        status: 'Disabled',
      },
    ];
    const update2 = [
      {
        monitorId: 'enabled-monitor',
        currentValue: '500',
        lastCheckedAt: '2026-08-12T10:00:00Z',
        nextExecutionAt: '2026-08-12T10:01:00Z',
        status: 'Error',
      },
    ];

    monitorsUpdatedHandler?.(update1);
    await fixture.whenStable();
    fixture.detectChanges();

    monitorsUpdatedHandler?.(update2);
    await fixture.whenStable();
    fixture.detectChanges();

    subject2.next({ items: [monitors[0]], pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1 });
    subject2.complete();

    subject1.next({ items: monitors, pageNumber: 1, pageSize: 10, totalCount: 3, totalPages: 1 });
    subject1.complete();

    expect((component as unknown as { monitors: () => MonitorModel[] }).monitors()).toHaveLength(1);
    expect((component as unknown as { monitors: () => MonitorModel[] }).monitors()[0].id).toBe('enabled-monitor');
    expect((component as unknown as { totalCount: () => number }).totalCount()).toBe(1);
  });
});
