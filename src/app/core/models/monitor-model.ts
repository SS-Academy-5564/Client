export type MonitorModel = {
  id: string;
  name: string;
  url: string;
  currentValue: string | null;
  lastCheckedAt: string | null;
  status: MonitorStatus;
  interval: number;
  organizationId: string;
};

export enum MonitorStatus {
  Enabled = 0,
  Disabled = 1,
  Error = 2,
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type CreateMonitorRequest = {
  name: string;
  url: string;
  httpMethod: HttpMethod;
  resultPath: string;
  pollingIntervalSeconds: number;
  pollingTimeoutSeconds: number;
};

/** Payload sent by SignalR after a monitor check completes. */
export type UpdateMonitorPayload = {
  monitorId: string;
  currentValue: string | null;
  lastCheckedAt: string;
  nextExecutionAt: string;
  status: string;
};
