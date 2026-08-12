import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { WidgetFormComponent } from '@features/widget-form/widget-form.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CreateWidgetRequest, UpdateWidgetRequest, Widget } from '@core/models/widget.model';
import { WidgetService } from '@core/services/widget.service';
import { WidgetCardComponent } from '@shared/ui/widget-card/widget-card.component';
import { DEFAULT_DASHBOARD_TAB_ID } from '@core/constants/default-dashboard.constants';

@Component({
  selector: 'app-overview',
  imports: [WidgetFormComponent, WidgetCardComponent, MatIconModule, MatButtonModule, MatSelectModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewComponent {
  private readonly widgetService = inject(WidgetService);

  /** Whether the widget form drawer is open. */
  readonly isWidgetFormOpen = signal(false);
  /** The widget being edited, or null when creating a new one. */
  readonly editingWidget = signal<Widget | null>(null);
  /** The widgets loaded for the current dashboard tab. */
  readonly _widgets = signal<Widget[]>([]);
  /** The time range selected in the toolbar. */
  readonly selectedTimeRange = signal('24h');

  // Temporary default dashboard tab. Will be replaced with the active tab ID once dashboard tabs are supported.
  /** The dashboard tab whose widgets are shown. */
  readonly dashboardTabId = DEFAULT_DASHBOARD_TAB_ID;

  /** Whether a widget submission is in progress. */
  readonly submitting = signal(false);
  /** The error message shown in the widget form when a submission fails. */
  readonly formError = signal<string | null>(null);

  /** The widgets sorted by display order. */
  readonly widgets = computed(() => {
    const priority: Record<string, number> = {
      'stat-card': 1,
      'line-chart': 2,
      'bar-chart': 3,
      'donut-chart': 4,
      'horizontal-bar-chart': 5,
    };

    return [...this._widgets()].sort((a, b) => priority[a.type] - priority[b.type]);
  });

  /** Loads the widgets of the dashboard tab on startup. */
  constructor() {
    this.loadWidgets();
  }

  /** Opens the widget form to create a new widget. */
  openWidgetForm(): void {
    this.editingWidget.set(null);
    this.isWidgetFormOpen.set(true);
    this.formError.set(null);
  }

  /** Opens the widget form to edit an existing widget. */
  editWidget(widget: Widget): void {
    this.editingWidget.set(widget);
    this.isWidgetFormOpen.set(true);
    this.formError.set(null);
  }

  /** Closes the widget form and discards the editing state. */
  closeWidgetForm(): void {
    this.isWidgetFormOpen.set(false);
    this.editingWidget.set(null);
    this.formError.set(null);
  }

  /** Creates a widget from the emitted form values. */
  onWidgetCreated(request: CreateWidgetRequest): void {
    this.submit(this.widgetService.createWidget(request), $localize`:@@widgetCreateFailed:Failed to create widget.`);
  }

  /** Updates a widget from the emitted form values. */
  onWidgetUpdated(request: UpdateWidgetRequest): void {
    this.submit(this.widgetService.updateWidget(request), $localize`:@@widgetUpdateFailed:Failed to update widget.`);
  }

  private submit(operation: Observable<unknown>, errorMessage: string): void {
    this.submitting.set(true);
    this.formError.set(null);

    operation.subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeWidgetForm();
        this.loadWidgets();
      },
      error: (error) => {
        this.submitting.set(false);
        this.formError.set(errorMessage);
        console.error(error);
      },
    });
  }

  private loadWidgets(): void {
    this.widgetService.getWidgets(this.dashboardTabId).subscribe({
      next: (response) => {
        this._widgets.set(response.data);
      },
      error: (error) => {
        console.error(error);
      },
    });
  }
}
