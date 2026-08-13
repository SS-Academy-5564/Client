import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { MatIconModule } from '@angular/material/icon';
import { CreateWidgetRequest } from '@core/models/widget.model';
import { MonitorService } from '@core/services/monitor.service';

@Component({
  selector: 'app-create-widget',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ButtonComponent,
    ErrorMessageComponent,
    MatIconModule,
  ],
  templateUrl: './create-widget.component.html',
  styleUrl: './create-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWidgetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly monitorService = inject(MonitorService);

  readonly isCreateWidgetDrawerOpen = input(false);
  readonly dashboardTabId = input.required<string>();

  /**
   * Reactive signal containing available monitor lookup items for selection.
   */
  readonly monitors = toSignal(this.monitorService.getMonitorsLookup(), { initialValue: [] });
  readonly closed = output<void>();
  readonly created = output<CreateWidgetRequest>();

  readonly submitting = input(false);
  readonly error = input<string | null>(null);

  readonly widgetTypes = [
    { value: 'stat-card', label: 'Statistic Card' },
    { value: 'line-chart', label: 'Line Chart' },
    { value: 'bar-chart', label: 'Bar Chart' },
    { value: 'donut-chart', label: 'Donut Chart' },
    { value: 'horizontal-bar-chart', label: 'Horizontal Bar Chart' },
  ];

  readonly metrics = [
    { value: 'responseTime', label: 'Response Time' },
    { value: 'availability', label: 'Availability' },
    { value: 'requests', label: 'Requests' },
    { value: 'errors', label: 'Errors' },
  ];

  readonly timeRanges = [
    { value: 60 * 60, label: 'Last hour' },
    { value: 24 * 60 * 60, label: 'Last 24 hours' },
    { value: 7 * 24 * 60 * 60, label: 'Last 7 days' },
    { value: 30 * 24 * 60 * 60, label: 'Last 30 days' },
  ];

  readonly form = this.fb.group({
    monitorId: ['', Validators.required],
    type: ['', Validators.required],
    title: [''],
    subtitle: [''],
    metric: ['', Validators.required],
    timeRange: [null as number | null, Validators.required],
    settings: [''],
  });

  constructor() {
    effect(() => {
      if (this.isCreateWidgetDrawerOpen()) {
        this.form.reset({
          monitorId: '',
          type: '',
          title: '',
          subtitle: '',
          metric: '',
          timeRange: null,
          settings: '',
        });
      }
    });
  }

  onClose(): void {
    if (this.submitting()) {
      return;
    }

    this.closed.emit();
  }

  /**
   * Validates the form and emits the widget creation request with resolved time range.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const seconds = raw.timeRange ?? 24 * 60 * 60;
    const timeRange = new Date(Date.now() - seconds * 1000).toISOString();

    this.created.emit({
      dashboardTabId: this.dashboardTabId(),
      monitorId: raw.monitorId ?? '',
      type: raw.type ?? '',
      title: raw.title ?? '',
      subtitle: raw.subtitle ?? '',
      metric: raw.metric ?? '',
      timeRange,
      settings: raw.settings ?? null,
    });
  }
}
