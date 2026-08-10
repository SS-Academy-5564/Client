import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Widget } from '@/app/core/models/widget.model';
import {
  createBarChartOptions,
  createDonutChartOptions,
  createHorizontalBarChartOptions,
  createLineChartOptions,
} from './widget-chart-options.component';

@Component({
  selector: 'app-widget-card',
  standalone: true,
  imports: [NgxEchartsDirective, MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './widget-card.component.html',
  styleUrl: './widget-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCardComponent {
  /** The widget rendered by the card. */
  readonly widget = input.required<Widget>();

  /** Emits the widget when its edit action is triggered. */
  readonly edit = output<Widget>();

  /** The ECharts options for the widget's chart. */
  readonly chartOptions = computed<EChartsOption>(() => {
    const widget = this.widget();

    const data = widget.chartData ?? {
      labels: [],
      values: [],
    };

    switch (widget.type) {
      case 'line-chart':
        return createLineChartOptions(data, widget.metric);

      case 'bar-chart':
        return createBarChartOptions(data, widget.metric);

      case 'horizontal-bar-chart':
        return createHorizontalBarChartOptions(data, widget.metric);

      case 'donut-chart':
        return createDonutChartOptions(data);

      default:
        return {};
    }
  });

  /** Triggers the edit action for the widget. */
  editWidget(): void {
    this.edit.emit(this.widget());
  }

  /** Triggers the delete action for the widget. */
  deleteWidget(): void {
    console.log('Delete', this.widget());
  }
}
