import { ChartData } from './chart-data-model';

export type Widget = {
  id: string;
  monitorId: string;
  type: string;
  metric: string;
  title?: string | null;
  subtitle?: string | null;
  timeRange?: string;
  settings?: string | null;
  serviceName?: string;
  value?: number[];
  chartData?: ChartData;
  trendType?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

export type CreateWidgetRequest = {
  dashboardTabId: string;
  monitorId: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  metric: string;
  timeRange: string;
  settings: string | null;
};

export type UpdateWidgetRequest = {
  widgetId: string;
  monitorId: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  metric: string;
  timeRange: string;
  settings: string | null;
};

export type CreateWidgetResult = {
  widgetId: string;
};
