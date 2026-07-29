import { MonitorModel, MonitorStatus } from '@/app/core/models/monitor-model';
import { MonitorService } from '@/app/core/services/monitor.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { PaginationComponent } from '@shared/ui/pagination/pagination.component';
import { ToastService } from '@core/services/toast.service';
import { MonitorIntervalPipe } from './pipes/monitor-interval.pipe';
import { RelativeTimePipe } from './pipes/relative-time.pipe';
import { CreateMonitorPanelComponent } from './create-monitor/create-monitor-panel.component';

@Component({
  selector: 'app-monitor',
  imports: [
    MonitorIntervalPipe,
    RelativeTimePipe,
    CreateMonitorPanelComponent,
    PaginationComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent {
  private readonly monitorService = inject(MonitorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
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

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly pageNumber = computed(() => Number(this.queryParams().get('page') ?? 1));
  protected readonly pageSize = computed(() => Number(this.queryParams().get('pageSize') ?? 10));

  constructor() {
    effect((onCleanup) => {
      const subscription = this.loadMonitors(this.pageNumber(), this.pageSize());
      onCleanup(() => {
        subscription.unsubscribe();
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

  private navigateToPage(page: number, pageSize: number = this.pageSize()): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page, pageSize },
      queryParamsHandling: 'merge',
    });
  }

  private loadMonitors(page: number, pageSize: number): Subscription {
    return this.monitorService.getMonitors(page, pageSize, this.selectedStatus()).subscribe({
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
