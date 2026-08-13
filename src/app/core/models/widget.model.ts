import { ChartData } from './chart-data-model';

/** A dashboard widget and the data it renders. */
export type Widget = {
  id: string;
  type: string;
  metric: string;
  title?: string | null;
  subtitle?: string | null;
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
  title: string | null;
  subtitle: string | null;
  metric: string;
  timeRange: string;
  settings: string | null;
};

/** The request to create a new widget. */
export type CreateWidgetRequest = WidgetFormValue & {
  dashboardTabId: string;
};

/** The request to update an existing widget's configuration. */
export type UpdateWidgetRequest = WidgetFormValue & {
  widgetId: string;
};

/** The result returned after a widget is created. */
export type CreateWidgetResult = {
  widgetId: string;
};
