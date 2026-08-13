import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
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
  /** The widget rendered by the card. */
  readonly widget = input.required<Widget>();

  readonly displayTitle = computed(() => {
    const widget = this.widget();
    if (widget.title && widget.title.trim()) {
      return widget.title;
    }

    const metricLabels: Record<string, string> = {
      responseTime: 'Response Time',
      availability: 'Availability',
      requests: 'Requests',
      errors: 'Errors',
    };

    return metricLabels[widget.metric] || widget.metric;
  });

  readonly formattedTimeRange = computed(() => {
    const timeRange = this.widget().timeRange;
    if (!timeRange) {
      return null;
    }

    if (['1h', '24h', '7d', '30d', '90d'].includes(timeRange)) {
      const labels: Record<string, string> = {
        '1h': 'last hour',
        '24h': 'last 24 hours',
        '7d': 'last 7 days',
        '30d': 'last 30 days',
        '90d': 'last 90 days',
      };
      return labels[timeRange] || timeRange;
    }

    const date = new Date(timeRange);
    if (isNaN(date.getTime())) {
      return timeRange;
    }

    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours <= 2) {
      return 'last hour';
    }
    if (diffHours <= 36) {
      return 'last 24 hours';
    }
    if (diffDays <= 10) {
      return 'last 7 days';
    }
    if (diffDays <= 45) {
      return 'last 30 days';
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  /** Emits the widget when its edit action is triggered. */
  readonly edit = output<Widget>();

  /** The ECharts options for the widget's chart. */
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

  /** Triggers the edit action for the widget. */
  editWidget(): void {
    this.edit.emit(this.widget());
  }

  /** Triggers the delete action for the widget. */
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
