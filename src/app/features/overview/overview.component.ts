import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CreateWidgetComponent } from '@features/create-widget/create-widget.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Widget } from '@core/models/widget.model';
import { CreateWidgetRequest } from '@core/models/widget.model';
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

  readonly isCreateWidgetOpen = signal(false);
  readonly _widgets = signal<Widget[]>([]);
  readonly selectedTimeRange = signal('24h');

  // Temporary default dashboard tab. Will be replaced with the active tab ID once dashboard tabs are supported.
  readonly dashboardTabId = DEFAULT_DASHBOARD_TAB_ID;

  readonly submitting = signal(false);
  readonly createError = signal<string | null>(null);

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

  openCreateWidget(): void {
    this.isCreateWidgetOpen.set(true);
  }

  closeCreateWidget(): void {
    this.isCreateWidgetOpen.set(false);
  }

  onWidgetCreated(request: CreateWidgetRequest): void {
    this.submitting.set(true);
    this.createError.set(null);

    this.widgetService.createWidget(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeCreateWidget();
        this.loadWidgets();
      },
      error: (error) => {
        this.submitting.set(false);
        this.createError.set('Failed to create widget.');
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
