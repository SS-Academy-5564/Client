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

  readonly isCreateWidgetDrawerOpen = input(false);
  readonly dashboardTabId = input.required<string>();

  /** The widget being edited; when set, the drawer runs in edit mode. */
  readonly widget = input<Widget | null>(null);

  readonly closed = output<void>();
  readonly created = output<CreateWidgetRequest>();
  /** Emits the widget configuration to persist when the form is submitted in edit mode. */
  readonly updated = output<UpdateWidgetRequest>();

  readonly submitting = input(false);
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
    { value: '1h', label: 'Last hour' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
  ];

  readonly form = this.fb.nonNullable.group({
    type: ['', Validators.required],
    title: [''],
    subtitle: [''],
    metric: ['', Validators.required],
    timeRange: ['', Validators.required],
    settings: [''],
  });

  constructor() {
    effect(() => {
      if (this.isCreateWidgetDrawerOpen()) {
        this.prepareForm(this.widget());
      }
    });
  }

  onClose(): void {
    if (this.submitting()) {
      return;
    }

    this.closed.emit();
  }

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
        title: widget.title ?? '',
        subtitle: widget.subtitle ?? '',
        metric: widget.metric,
        timeRange: widget.timeRange ?? '',
        settings: widget.settings ?? '',
      });
      return;
    }

    this.form.reset({
      type: '',
      title: '',
      subtitle: '',
      metric: '',
      timeRange: '',
      settings: '',
    });
  }
}
