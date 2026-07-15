import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) {
      return '—';
    }

    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
      return '—';
    }

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

    if (elapsedSeconds < 60) {
      return $localize`:@@relativeTimeSeconds:${elapsedSeconds}:COUNT: sec ago`;
    }

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 60) {
      return $localize`:@@relativeTimeMinutes:${elapsedMinutes}:COUNT: min ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
      return $localize`:@@relativeTimeHours:${elapsedHours}:COUNT: hr ago`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);

    if (elapsedDays === 1) {
      return $localize`:@@relativeTimeDay:1 day ago`;
    }

    return $localize`:@@relativeTimeDays:${elapsedDays}:COUNT: days ago`;
  }
}
