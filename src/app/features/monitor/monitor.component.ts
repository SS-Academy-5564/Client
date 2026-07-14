import { MonitorModel, MonitorStatus } from '@/app/core/models/monitor-model';
import { MonitorService } from '@/app/core/services/monitor.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MonitorIntervalPipe } from './pipes/monitor-interval.pipe';
import { RelativeTimePipe } from './pipes/relative-time.pipe';

@Component({
  selector: 'app-monitor',
  imports: [MonitorIntervalPipe, RelativeTimePipe],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent implements OnInit {
  private readonly monitorService = inject(MonitorService);
  protected readonly MonitorStatus = MonitorStatus;
  protected readonly isLoading = this.monitorService.isLoading;
  protected readonly error = this.monitorService.errors;
  protected readonly monitors = signal<MonitorModel[]>([]);

  ngOnInit(): void {
    this.monitorService.getMonitors().subscribe({
      next: (monitors) => this.monitors.set(monitors),
      error: () => this.monitors.set([]),
    });
  }
}
