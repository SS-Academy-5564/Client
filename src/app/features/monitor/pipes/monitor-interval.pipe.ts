import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monitorInterval',
  standalone: true,
})
export class MonitorIntervalPipe implements PipeTransform {
  transform(intervalInSeconds: number): string {
    if (intervalInSeconds < 60) {
      return $localize`:@@monitorIntervalSeconds:${intervalInSeconds}:INTERVAL:s`;
    }

    const minutes = Math.floor(intervalInSeconds / 60);

    if (minutes < 60) {
      return $localize`:@@monitorIntervalMinutes:${minutes}:INTERVAL:m`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return $localize`:@@monitorIntervalHours:${hours}:INTERVAL:h`;
    }

    const days = Math.floor(hours / 24);

    return $localize`:@@monitorIntervalDays:${days}:INTERVAL:d`;
  }
}
