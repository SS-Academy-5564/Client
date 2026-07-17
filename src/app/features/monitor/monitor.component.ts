import { MonitorModel, MonitorStatus } from '@/app/core/models/monitor-model';
import { MonitorService } from '@/app/core/services/monitor.service';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MonitorIntervalPipe } from './pipes/monitor-interval.pipe';
import { RelativeTimePipe } from './pipes/relative-time.pipe';
import { CreateMonitorPanelComponent } from './create-monitor/create-monitor-panel.component';

@Component({
  selector: 'app-monitor',
  imports: [MonitorIntervalPipe, RelativeTimePipe, CreateMonitorPanelComponent],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent implements OnInit {
  private readonly monitorService = inject(MonitorService);
  protected readonly MonitorStatus = MonitorStatus;
  protected readonly isLoading = this.monitorService.isLoading;
  protected readonly error = this.monitorService.error;
  protected readonly allMonitors = signal<MonitorModel[]>([]);
  protected readonly selectedStatus = signal<MonitorStatus | null>(null);
  protected readonly isPanelOpen = signal<boolean>(false);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly monitors = computed(() => {
    const status = this.selectedStatus();
    return status === null ? this.allMonitors() : this.allMonitors().filter((monitor) => monitor.status === status);
  });

  ngOnInit(): void {
    this.monitorService.getMonitors().subscribe({
      next: (monitors) => this.allMonitors.set(monitors),
      error: () => this.allMonitors.set([]),
    });
  }

  onClickStatus(status: MonitorStatus | null): void {
    this.selectedStatus.set(status);
  }

  onOpenPanel(): void {
    this.successMessage.set(null);
    this.isPanelOpen.set(true);
  }

  onClosePanel(): void {
    this.isPanelOpen.set(false);
  }

  onMonitorCreated(monitor: MonitorModel): void {
    this.allMonitors.update((monitors) => [monitor, ...monitors]);
    this.isPanelOpen.set(false);
    this.successMessage.set($localize`:@@monitorsCreateSuccess:Monitor "${monitor.name}:name:" created successfully.`);
  }

  onDismissSuccess(): void {
    this.successMessage.set(null);
  }
}
