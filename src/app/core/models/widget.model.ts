import { ChartData } from './chart-data-model';

export type Widget = {
  id: string;
  type: string;
  metric: string;
  title?: string;
  subtitle?: string;
  timeRange?: string;
  settings?: string | null;
  serviceName?: string;
  value?: string | number;
  chartData?: ChartData;
  trendType?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

/** The widget configuration fields shared by the create and update forms. */
export type WidgetFormValue = {
  type: string;
  title?: string;
  subtitle?: string;
  metric: string;
  timeRange: string;
  settings: string | null;
};

export type CreateWidgetRequest = WidgetFormValue & {
  dashboardTabId: string;
};

/** The request to update an existing widget's configuration. */
export type UpdateWidgetRequest = WidgetFormValue & {
  widgetId: string;
};

export type CreateWidgetResult = {
  widgetId: string;
};
