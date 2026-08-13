import { ChartData } from './chart-data-model';

/**
 * Represents a dashboard widget configuration and its associated display/metric data.
 */
export type Widget = {
  id: string;
  monitorId: string;
  type: string;
  metric: string;
  title?: string;
  subtitle?: string;
  timeRange?: string;
  serviceName?: string;
  value?: number[];
  chartData?: ChartData;
  trendType?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

/**
 * Request payload for creating a new dashboard widget.
 */
export type CreateWidgetRequest = {
  dashboardTabId: string;
  monitorId: string;
  type: string;

  title?: string;
  subtitle?: string;

  metric: string;
  timeRange: string;
  settings: string | null;
};

/**
 * Result returned upon successful widget creation.
 */
export type CreateWidgetResult = {
  widgetId: string;
};
