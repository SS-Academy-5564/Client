import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monitorInterval',
  standalone: true,
})
export class MonitorIntervalPipe implements PipeTransform {
  transform(intervalInSeconds: number): string {
    return intervalInSeconds >= 60 && intervalInSeconds % 60 === 0
      ? `${intervalInSeconds / 60}m`
      : `${intervalInSeconds}s`;
  }
}
