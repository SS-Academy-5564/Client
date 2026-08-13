import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ButtonComponent } from '@shared/ui/button/button.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { MatIconModule } from '@angular/material/icon';
import { CreateWidgetRequest, UpdateWidgetRequest, Widget } from '@core/models/widget.model';

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

  /** Whether the widget form drawer is open. */
  readonly isOpen = input(false);
  /** The identifier of the dashboard tab the widget belongs to. */
  readonly dashboardTabId = input.required<string>();

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

    const widget = this.widget();

    if (widget) {
      this.updated.emit({
        widgetId: widget.id,
        ...this.form.getRawValue(),
      });
      return;
    }

    this.created.emit({
      dashboardTabId: this.dashboardTabId(),
      ...this.form.getRawValue(),
    });
  }

  private prepareForm(widget: Widget | null): void {
    if (widget) {
      this.form.patchValue({
        type: widget.type,
        title: widget.title ?? null,
        subtitle: widget.subtitle ?? null,
        metric: widget.metric,
        timeRange: widget.timeRange,
        settings: widget.settings ?? null,
      });
      return;
    }

    this.form.reset({
      type: '',
      title: null,
      subtitle: null,
      metric: '',
      timeRange: '',
      settings: null,
    });
  }
}
