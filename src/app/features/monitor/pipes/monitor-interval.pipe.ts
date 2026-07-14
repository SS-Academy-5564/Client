import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monitorInterval',
  standalone: true,
})
export class MonitorIntervalPipe implements PipeTransform {
  transform(intervalInSeconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(intervalInSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];

    if (hours > 0) {
      parts.push($localize`:@@monitorIntervalHours:${hours}:count:h`);
    }

    if (minutes > 0) {
      parts.push($localize`:@@monitorIntervalMinutes:${minutes}:count:m`);
    }

    if (seconds > 0 || parts.length === 0) {
      parts.push($localize`:@@monitorIntervalSeconds:${seconds}:count:s`);
    }

    return parts.join(' ');
  }
}
