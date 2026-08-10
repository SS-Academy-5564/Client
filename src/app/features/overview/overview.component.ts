import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateWidgetComponent } from '@features/create-widget/create-widget.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CreateWidgetRequest, UpdateWidgetRequest, Widget } from '@core/models/widget.model';
import { WidgetService } from '@core/services/widget.service';
import { WidgetCardComponent } from '@shared/ui/widget-card/widget-card.component';
import { DEFAULT_DASHBOARD_TAB_ID } from '@core/constants/default-dashboard.constants';

@Component({
  selector: 'app-overview',
  imports: [CreateWidgetComponent, WidgetCardComponent, MatIconModule, MatButtonModule, MatSelectModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewComponent {
  private readonly widgetService = inject(WidgetService);

  readonly isWidgetFormOpen = signal(false);
  readonly editingWidget = signal<Widget | null>(null);
  readonly _widgets = signal<Widget[]>([]);
  readonly selectedTimeRange = signal('24h');

  // Temporary default dashboard tab. Will be replaced with the active tab ID once dashboard tabs are supported.
  readonly dashboardTabId = DEFAULT_DASHBOARD_TAB_ID;

  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);

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

  constructor() {
    this.loadWidgets();
  }

  openWidgetForm(): void {
    this.editingWidget.set(null);
    this.isWidgetFormOpen.set(true);
    this.formError.set(null);
  }

  editWidget(widget: Widget): void {
    this.editingWidget.set(widget);
    this.isWidgetFormOpen.set(true);
    this.formError.set(null);
  }

  closeWidgetForm(): void {
    this.isWidgetFormOpen.set(false);
    this.editingWidget.set(null);
    this.formError.set(null);
  }

  onWidgetCreated(request: CreateWidgetRequest): void {
    this.submit(this.widgetService.createWidget(request), $localize`:@@widgetCreateFailed:Failed to create widget.`);
  }

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
