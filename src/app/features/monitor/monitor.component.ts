import { MonitorModel, MonitorStatus, UpdateMonitorPayload } from '@core/models/monitor-model';
import { MonitorService } from '@core/services/monitor.service';
import { SignalrService } from '@core/services/signalr.service';
import { ToastService } from '@core/services/toast.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { PaginationComponent } from '@shared/ui/pagination/pagination.component';
import { debounceTime, distinctUntilChanged, finalize, Subscription } from 'rxjs';
import { CreateMonitorPanelComponent } from './create-monitor/create-monitor-panel.component';
import { MonitorIntervalPipe } from './pipes/monitor-interval.pipe';
import { RelativeTimePipe } from './pipes/relative-time.pipe';

@Component({
  selector: 'app-monitor',
  imports: [
    MonitorIntervalPipe,
    RelativeTimePipe,
    CreateMonitorPanelComponent,
    PaginationComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent implements OnInit {
  private readonly monitorService = inject(MonitorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly signalrService = inject(SignalrService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly MonitorStatus = MonitorStatus;
  protected readonly isLoading = this.monitorService.isLoading;
  protected readonly error = this.monitorService.error;
  protected readonly monitors = signal<MonitorModel[]>([]);
  protected readonly selectedStatus = signal<MonitorStatus | null>(null);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly isPanelOpen = signal<boolean>(false);
  protected readonly pendingMonitorCheckIds = signal<Set<string>>(new Set());
  protected readonly searchControl = new FormControl('');

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly pageNumber = computed(() => Number(this.queryParams().get('page') ?? 1));
  protected readonly pageSize = computed(() => Number(this.queryParams().get('pageSize') ?? 10));
  protected readonly searchQuery = computed(() => this.queryParams().get('query') ?? '');

  constructor() {
    effect(() => {
      const query = this.searchQuery();

      if (this.searchControl.value !== query) {
        this.searchControl.setValue(query, { emitEvent: false });
      }
    });

    effect((onCleanup) => {
      const subscription = this.loadMonitors(
        this.pageNumber(),
        this.pageSize(),
        this.selectedStatus(),
        this.searchQuery(),
      );

      onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }

  ngOnInit(): void {
    const monitorsUpdatedSubscription = this.signalrService.onMonitorsUpdated((updates: UpdateMonitorPayload[]): void =>
      this.handleMonitorsUpdated(updates),
    );
    const monitorUpdatedSubscription = this.signalrService.onMonitorUpdated((update: UpdateMonitorPayload): void =>
      this.handleMonitorsUpdated([update]),
    );

    this.signalrService
      .start()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (): void => {
          this.toastService.error($localize`:@@monitorsRealtimeConnectionError:Real-time updates are unavailable.`);
        },
      });

    this.destroyRef.onDestroy((): void => {
      monitorsUpdatedSubscription.unsubscribe();
      monitorUpdatedSubscription.unsubscribe();
      this.signalrService.stop().subscribe({ error: (): void => undefined });
    });

    const initialQuery = this.searchQuery();

    if (initialQuery) {
      this.searchControl.setValue(initialQuery, { emitEvent: false });
    }

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value: string | null) => {
        const cleanValue = value?.trim() ?? '';

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            query: cleanValue || null,
            page: 1,
          },
          queryParamsHandling: 'merge',
        });
      });
  }

  onClickStatus(status: MonitorStatus | null): void {
    this.selectedStatus.set(status);

    if (this.pageNumber() !== 1) {
      this.navigateToPage(1);
    }
  }

  onPageChange(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages() || pageNumber === this.pageNumber()) {
      return;
    }

    this.navigateToPage(pageNumber);
  }

  onPageSizeChange(pageSize: number): void {
    if (pageSize === this.pageSize()) {
      return;
    }

    this.navigateToPage(1, pageSize);
  }

  onOpenPanel(): void {
    this.isPanelOpen.set(true);
  }

  onClosePanel(): void {
    this.isPanelOpen.set(false);
  }

  onMonitorCreated(monitor: MonitorModel): void {
    this.isPanelOpen.set(false);

    this.toastService.success(
      $localize`:@@monitorsCreateSuccess:Monitor "${monitor.name}:name:" created successfully.`,
    );

    this.navigateToPage(1);
  }

  onRunMonitorCheck(monitor: MonitorModel): void {
    if (this.pendingMonitorCheckIds().has(monitor.id)) {
      return;
    }

    this.pendingMonitorCheckIds.update((ids) => {
      const next = new Set(ids);
      next.add(monitor.id);
      return next;
    });

    this.monitorService
      .triggerMonitorCheck(monitor.id)
      .pipe(
        finalize(() => {
          this.pendingMonitorCheckIds.update((ids) => {
            const next = new Set(ids);
            next.delete(monitor.id);
            return next;
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success($localize`:@@monitorsRunCheckSuccess:Check initiated successfully.`);
        },
        error: (err: Error) => {
          this.toastService.error(err.message);
        },
      });
  }

  isMonitorCheckPending(monitorId: string): boolean {
    return this.pendingMonitorCheckIds().has(monitorId);
  }

  private handleMonitorsUpdated(updates: UpdateMonitorPayload[]): void {
    if (!updates.length) {
      return;
    }

    const updatesMap = new Map<string, UpdateMonitorPayload>(
      updates.map((update: UpdateMonitorPayload): [string, UpdateMonitorPayload] => [
        update.monitorId.toLowerCase(),
        update,
      ]),
    );

    this.monitors.update((monitors: MonitorModel[]): MonitorModel[] =>
      monitors.map((monitor: MonitorModel): MonitorModel => {
        const update = updatesMap.get(monitor.id.toLowerCase());
        if (!update) {
          return monitor;
        }

        return {
          ...monitor,
          currentValue: update.currentValue,
          lastCheckedAt: update.lastCheckedAt,
          status: this.parseMonitorStatus(update.status),
        };
      }),
    );
  }

  private parseMonitorStatus(status: string): MonitorStatus {
    return MonitorStatus[status as keyof typeof MonitorStatus] ?? MonitorStatus.Error;
  }

  private refreshCurrentPage(): void {
    this.loadMonitors(this.pageNumber(), this.pageSize(), this.selectedStatus(), this.searchQuery());
  }

  private navigateToPage(page: number, pageSize: number = this.pageSize()): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page, pageSize },
      queryParamsHandling: 'merge',
    });
  }

  private loadMonitors(
    page: number,
    pageSize: number,
    status: MonitorStatus | null = null,
    searchString: string | null = null,
  ): Subscription {
    return this.monitorService.getMonitors(page, pageSize, status, searchString).subscribe({
      next: (result) => {
        this.monitors.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
      },
      error: () => {
        this.monitors.set([]);
        this.totalCount.set(0);
        this.totalPages.set(0);
      },
    });
  }
}
