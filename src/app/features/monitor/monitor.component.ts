import { MonitorModel } from '@/app/core/models/monitor-model';
import { MonitorService } from '@/app/core/services/monitor.service';
import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-monitor',
  imports: [DatePipe],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent implements OnInit {
  private readonly monitorService = inject(MonitorService);
  protected readonly monitors = signal<MonitorModel[]>([]);

  ngOnInit(): void {
    this.monitorService.getMonitors().subscribe((monitors) => {
      this.monitors.set(monitors);
    });
  }
}
