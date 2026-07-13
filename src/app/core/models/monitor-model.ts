export type MonitorModel = {
  id: string;
  name: string;
  url: string;
  currentValue: string | null;
  lastCheckedAt: string;
  status: MonitorStatus;
  interval: number;
};

export enum MonitorStatus {
  Enabled = 0,
  Disabled = 1,
  Error = 2,
}
