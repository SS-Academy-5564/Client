import { HttpMethod } from '@core/models/monitor-model';
import { HOURS_PER_DAY, MINUTES_PER_HOUR, SECONDS_PER_MINUTE } from '@constants/time.constants';

export type SelectOption = {
  readonly value: number;
  readonly label: string;
};

export const HTTP_METHODS: readonly HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const MINUTE = SECONDS_PER_MINUTE;
const HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const DAY = HOURS_PER_DAY * HOUR;

// Polling interval presets from 1 minute to 24 hours (supported backend range: 60s–86400s).
export const POLLING_INTERVAL_OPTIONS: readonly SelectOption[] = [
  { value: 1 * MINUTE, label: $localize`:@@createMonitor.interval1Minute:1 minute` },
  { value: 5 * MINUTE, label: $localize`:@@createMonitor.interval5Minutes:5 minutes` },
  { value: 15 * MINUTE, label: $localize`:@@createMonitor.interval15Minutes:15 minutes` },
  { value: 30 * MINUTE, label: $localize`:@@createMonitor.interval30Minutes:30 minutes` },
  { value: 1 * HOUR, label: $localize`:@@createMonitor.interval1Hour:1 hour` },
  { value: 6 * HOUR, label: $localize`:@@createMonitor.interval6Hours:6 hours` },
  { value: 12 * HOUR, label: $localize`:@@createMonitor.interval12Hours:12 hours` },
  { value: 1 * DAY, label: $localize`:@@createMonitor.interval24Hours:24 hours` },
];

// Polling timeout presets (supported backend range: 5s–30s).
export const POLLING_TIMEOUT_OPTIONS: readonly SelectOption[] = [
  { value: 5, label: $localize`:@@createMonitor.timeout5Seconds:5 seconds` },
  { value: 10, label: $localize`:@@createMonitor.timeout10Seconds:10 seconds` },
  { value: 15, label: $localize`:@@createMonitor.timeout15Seconds:15 seconds` },
  { value: 20, label: $localize`:@@createMonitor.timeout20Seconds:20 seconds` },
  { value: 30, label: $localize`:@@createMonitor.timeout30Seconds:30 seconds` },
];

export const DEFAULT_HTTP_METHOD: HttpMethod = 'GET';
export const DEFAULT_POLLING_INTERVAL_SECONDS = 5 * MINUTE;
export const DEFAULT_POLLING_TIMEOUT_SECONDS = 10;
