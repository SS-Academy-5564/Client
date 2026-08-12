import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MonitorComponent } from './monitor.component';
import { MonitorPage, MonitorService } from '@core/services/monitor.service';
import { ToastService } from '@core/services/toast.service';
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
    getMonitorById: vi.fn(),
    updateMonitor: vi.fn(),
    updateMonitorStatus: vi.fn().mockReturnValue(of(monitors[0])),
  };
  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
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
    monitorServiceMock.triggerMonitorCheck.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [MonitorComponent],
      providers: [
        { provide: MonitorService, useValue: monitorServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
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

  it('toggles monitor status using the update API and shows a toast', (): void => {
    const updatedMonitor: MonitorModel = {
      ...monitors[0],
      status: MonitorStatus.Disabled,
    };
    monitorServiceMock.updateMonitorStatus = vi.fn().mockReturnValue(of(updatedMonitor));

    component.onToggleMonitorStatus(monitors[0]);

    expect(monitorServiceMock.updateMonitorStatus).toHaveBeenCalledWith('enabled-monitor', MonitorStatus.Disabled);
    expect(toastServiceMock.success).toHaveBeenCalledWith('Monitor status updated successfully.');
    expect(component['monitors']().find((item) => item.id === 'enabled-monitor')?.status).toBe(MonitorStatus.Disabled);
  });

  it('returns false for error monitors in toggle visibility helper', (): void => {
    expect(component.shouldShowToggleAction(monitors[2])).toBe(false);
  });

  it('returns true for enabled and disabled monitors in toggle visibility helper', (): void => {
    expect(component.shouldShowToggleAction(monitors[0])).toBe(true);
    expect(component.shouldShowToggleAction(monitors[1])).toBe(true);
  });

  it('renders Enable/Disable action only for non-error monitors', async (): Promise<void> => {
    const rowButtons = Array.from(fixture.nativeElement.querySelectorAll('.row-action-button')) as HTMLButtonElement[];

    const getMenuLabels = (): string[] => {
      const panels = Array.from(document.body.querySelectorAll('.mat-mdc-menu-panel'));

      const activePanel = panels.at(-1);

      return activePanel
        ? Array.from(activePanel.querySelectorAll('.mat-mdc-menu-item span')).map(
            (span) => span.textContent?.trim() ?? '',
          )
        : [];
    };

    const closeMenu = async (): Promise<void> => {
      document.body.click();
      fixture.detectChanges();
      await fixture.whenStable();
    };

    rowButtons[0].click();
    fixture.detectChanges();
    await fixture.whenStable();

    const enabledMenuLabels = getMenuLabels();
    expect(enabledMenuLabels).toContain('Edit');
    expect(enabledMenuLabels).toContain('Disable');
    expect(enabledMenuLabels).not.toContain('Enable');

    await closeMenu();

    rowButtons[1].click();
    fixture.detectChanges();
    await fixture.whenStable();

    const disabledMenuLabels = getMenuLabels();
    expect(disabledMenuLabels).toContain('Edit');
    expect(disabledMenuLabels).toContain('Enable');
    expect(disabledMenuLabels).not.toContain('Disable');

    await closeMenu();

    rowButtons[2].click();
    fixture.detectChanges();
    await fixture.whenStable();

    const errorMenuLabels = getMenuLabels();
    expect(errorMenuLabels).toContain('Edit');
    expect(errorMenuLabels).not.toContain('Disable');
    expect(errorMenuLabels).not.toContain('Enable');
  });
});
