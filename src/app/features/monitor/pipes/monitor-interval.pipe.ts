import { Pipe, PipeTransform } from '@angular/core';
import {
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
  SECONDS_PER_MINUTE,
} from '../../../core/constants/time.constants';

@Pipe({
  name: 'monitorInterval',
  standalone: true,
})
export class MonitorIntervalPipe implements PipeTransform {
  transform(intervalInSeconds: number): string {
    if (intervalInSeconds < SECONDS_PER_MINUTE) {
      return $localize`:@@monitorIntervalSeconds:${intervalInSeconds}:INTERVAL:s`;
    }

    const minutes = Math.floor(intervalInSeconds / SECONDS_PER_MINUTE);

    if (minutes < MINUTES_PER_HOUR) {
      return $localize`:@@monitorIntervalMinutes:${minutes}:INTERVAL:m`;
    }

    const hours = Math.floor(minutes / MINUTES_PER_HOUR);

    if (hours < HOURS_PER_DAY) {
      return $localize`:@@monitorIntervalHours:${hours}:INTERVAL:h`;
    }

    const days = Math.floor(hours / HOURS_PER_DAY);

    return $localize`:@@monitorIntervalDays:${days}:INTERVAL:d`;
  }
}
