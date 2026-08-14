import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ButtonComponent } from '@shared/ui/button/button.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { MatIconModule } from '@angular/material/icon';
import { CreateWidgetRequest, UpdateWidgetRequest, Widget } from '@core/models/widget.model';
import { MonitorService } from '@core/services/monitor.service';

@Component({
  selector: 'app-widget-form',
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
  templateUrl: './widget-form.component.html',
  styleUrl: './widget-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly monitorService = inject(MonitorService);

  /** Whether the widget form drawer is open. */
  readonly isOpen = input(false);
  /** The identifier of the dashboard tab the widget belongs to. */
  readonly dashboardTabId = input.required<string>();

  /** Reactive signal containing available monitor lookup items for selection. */
  readonly monitors = toSignal(this.monitorService.getMonitorsLookup(), { initialValue: [] });

  /** The widget being edited; when set, the drawer runs in edit mode. */
  readonly widget = input<Widget | null>(null);

  /** Emits when the drawer requests to be closed. */
  readonly closed = output<void>();
  /** Emits the widget configuration to persist when the form is submitted in create mode. */
  readonly created = output<CreateWidgetRequest>();
  /** Emits the widget configuration to persist when the form is submitted in edit mode. */
  readonly updated = output<UpdateWidgetRequest>();

  /** Whether a widget submission is in progress. */
  readonly submitting = input(false);
  /** The error message shown when a submission fails. */
  readonly error = input<string | null>(null);

  /** Whether the drawer is editing an existing widget rather than creating a new one. */
  readonly isEditMode = computed(() => this.widget() !== null);

  /** The label of the submit button for the current form mode. */
  readonly submitLabel = computed(() =>
    this.isEditMode() ? $localize`:@@updateWidget:Update widget` : $localize`:@@addWidget:Add widget`,
  );

  /** The heading of the drawer for the current form mode. */
  readonly formTitle = computed(() =>
    this.isEditMode() ? $localize`:@@editWidgetTitle:Edit widget` : $localize`:@@addNewWidget:Add New Widget`,
  );

  /** The selectable widget types. */
  readonly widgetTypes = [
    { value: 'stat-card', label: 'Statistic Card' },
    { value: 'line-chart', label: 'Line Chart' },
    { value: 'bar-chart', label: 'Bar Chart' },
    { value: 'donut-chart', label: 'Donut Chart' },
    { value: 'horizontal-bar-chart', label: 'Horizontal Bar Chart' },
  ];

  /** The selectable metrics. */
  readonly metrics = [
    { value: 'responseTime', label: 'Response Time' },
    { value: 'availability', label: 'Availability' },
    { value: 'requests', label: 'Requests' },
    { value: 'errors', label: 'Errors' },
  ];

  /** The selectable time ranges. */
  readonly timeRanges = [
    { value: '1h', label: 'Last hour' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
  ];

  /** The widget configuration form. */
  readonly form = this.fb.group({
    monitorId: this.fb.nonNullable.control('', Validators.required),
    type: this.fb.nonNullable.control('', Validators.required),
    title: [null as string | null],
    subtitle: [null as string | null],
    metric: this.fb.nonNullable.control('', Validators.required),
    timeRange: this.fb.nonNullable.control('', Validators.required),
    settings: [null as string | null],
  });

  /** Prepares the form each time the drawer opens. */
  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.prepareForm(this.widget());
      }
    });
  }

  /** Requests to close the drawer unless a submission is in progress. */
  onClose(): void {
    if (this.submitting()) {
      return;
    }

    this.closed.emit();
  }

  /** Validates the form and emits the collected values for the current mode. */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const timeRange = this.resolveTimeRange(raw.timeRange);
    const widget = this.widget();

    if (widget) {
      this.updated.emit({
        widgetId: widget.id,
        ...raw,
        timeRange,
      });
      return;
    }

    this.created.emit({
      dashboardTabId: this.dashboardTabId(),
      ...raw,
      timeRange,
    });
  }

  private resolveTimeRange(range: string): string {
    const units: Record<string, number> = {
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    const match = range.match(/^(\d+)([hd])$/);
    if (match) {
      const ms = parseInt(match[1], 10) * units[match[2]];
      return new Date(Date.now() - ms).toISOString();
    }
    return range;
  }

  private normalizeTimeRange(timeRange?: string | null): string {
    if (!timeRange) {
      return '';
    }

    if (['1h', '24h', '7d', '30d'].includes(timeRange)) {
      return timeRange;
    }

    const date = new Date(timeRange);
    if (isNaN(date.getTime())) {
      return timeRange;
    }

    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours <= 2) {
      return '1h';
    }
    if (diffHours <= 36) {
      return '24h';
    }
    if (diffDays <= 10) {
      return '7d';
    }
    return '30d';
  }

  private prepareForm(widget: Widget | null): void {
    if (widget) {
      this.form.patchValue({
        monitorId: widget.monitorId ?? '',
        type: widget.type,
        title: widget.title ?? null,
        subtitle: widget.subtitle ?? null,
        metric: widget.metric,
        timeRange: this.normalizeTimeRange(widget.timeRange),
        settings: widget.settings ?? null,
      });
      return;
    }

    this.form.reset({
      monitorId: '',
      type: '',
      title: null,
      subtitle: null,
      metric: '',
      timeRange: '',
      settings: null,
    });
  }
}
