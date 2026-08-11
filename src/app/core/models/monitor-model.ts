/** List-projection shape returned by GET /api/monitors. */
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

/** Numeric enum matching the backend MonitorStatus discriminator on the list endpoint. */
export enum MonitorStatus {
  Enabled = 0,
  Disabled = 1,
  Error = 2,
}

/** The two status values that may be written via the update API. `Error` is read-only — set by the backend. */
export type EditableMonitorStatus = MonitorStatus.Enabled | MonitorStatus.Disabled;

/** HTTP verbs supported by the polling engine. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/** Request body for POST /api/monitors. */
export type CreateMonitorRequest = {
  name: string;
  url: string;
  httpMethod: HttpMethod;
  resultPath: string;
  pollingIntervalSeconds: number;
  pollingTimeoutSeconds: number;
};

/** Request body for PUT /api/monitors/{id}. */
export type UpdateMonitorRequest = {
  name: string;
  url: string;
  httpMethod: HttpMethod;
  resultPath: string;
  status: EditableMonitorStatus;
  pollingIntervalSeconds: number;
  pollingTimeoutSeconds: number;
};

/**
 * Full detail shape returned by GET /api/monitors/{id}.
 * Superset of {@link MonitorModel} — includes configuration fields not present in the list projection.
 */
export type MonitorDetail = {
  id: string;
  name: string;
  url: string;
  httpMethod: HttpMethod;
  resultPath: string;
  currentValue: string | null;
  status: MonitorStatus;
  pollingIntervalSeconds: number;
  pollingTimeoutSeconds: number;
  lastCheckedAt: string | null;
  nextExecutionAt: string;
  createdAt: string;
  lastModifiedAt: string;
};

/** Payload sent by SignalR after a monitor check completes. */
export type UpdateMonitorPayload = {
  monitorId: string;
  currentValue: string | null;
  lastCheckedAt: string;
  nextExecutionAt: string;
  status: string;
};
