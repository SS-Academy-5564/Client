import { ChartData } from './chart-data-model';

export type Widget = {
  id: string;
  type: string;
  metric: string;
  title?: string;
  subtitle?: string;
  timeRange?: string;
  serviceName?: string;
  value?: string | number;
  chartData?: ChartData;
  trendType?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

export type CreateWidgetRequest = {
  dashboardTabId: string;
  type: string;

  title?: string;
  subtitle?: string;

  metric: string;
  timeRange: string;
  settings: string | null;
};

export type CreateWidgetResult = {
  widgetId: string;
};
