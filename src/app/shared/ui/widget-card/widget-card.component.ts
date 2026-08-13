import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Widget } from '@/app/core/models/widget.model';
import { ChartData } from '@/app/core/models/chart-data-model';
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
  readonly widget = input.required<Widget>();

  readonly chartOptions = computed<EChartsOption>(() => {
    const widget = this.widget();
    const raw = widget.value ?? [];

    const data: ChartData = {
      labels: generateChartLabels(widget, raw.length),
      values: raw,
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

  editWidget(): void {
    console.log('Edit', this.widget());
  }

  deleteWidget(): void {
    console.log('Delete', this.widget());
  }
}

function generateChartLabels(widget: Widget, count: number): string[] {
  if (count === 0) {
    return [];
  }

  if (widget.type === 'donut-chart') {
    const categoryNames = ['Success', 'Warning', 'Critical', 'Maintenance', 'Unknown'];
    return Array.from({ length: count }, (_, i) => categoryNames[i % categoryNames.length]);
  }

  const now = Date.now();
  let startTime = now - 24 * 60 * 60 * 1000;

  if (widget.timeRange) {
    const parsed = Date.parse(widget.timeRange);
    if (!isNaN(parsed)) {
      startTime = parsed;
    }
  }

  if (count === 1) {
    return [formatTimeLabel(now, now - startTime)];
  }

  const timeSpan = now - startTime;
  const step = timeSpan / (count - 1);

  return Array.from({ length: count }, (_, i) => {
    const timestamp = startTime + i * step;
    return formatTimeLabel(timestamp, timeSpan);
  });
}

function formatTimeLabel(timestamp: number, totalSpanMs: number): string {
  const date = new Date(timestamp);
  const isMultiDay = totalSpanMs > 24 * 60 * 60 * 1000;

  if (isMultiDay) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}
