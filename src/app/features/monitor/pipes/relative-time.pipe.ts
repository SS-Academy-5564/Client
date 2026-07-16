import { Pipe, PipeTransform } from '@angular/core';
import {
  HOURS_PER_DAY,
  MILLISECONDS_PER_SECOND,
  MINUTES_PER_HOUR,
  SECONDS_PER_MINUTE,
} from '../../../core/constants/time.constants';

const EMPTY_TIME_VALUE = '—';
const MINIMUM_ELAPSED_SECONDS = 0;
const SINGLE_DAY = 1;

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) {
      return EMPTY_TIME_VALUE;
    }

    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
      return EMPTY_TIME_VALUE;
    }

    const elapsedSeconds = Math.max(
      MINIMUM_ELAPSED_SECONDS,
      Math.floor((Date.now() - timestamp) / MILLISECONDS_PER_SECOND),
    );

    if (elapsedSeconds < SECONDS_PER_MINUTE) {
      return $localize`:@@relativeTimeSeconds:${elapsedSeconds}:COUNT: sec ago`;
    }

    const elapsedMinutes = Math.floor(elapsedSeconds / SECONDS_PER_MINUTE);

    if (elapsedMinutes < MINUTES_PER_HOUR) {
      return $localize`:@@relativeTimeMinutes:${elapsedMinutes}:COUNT: min ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / MINUTES_PER_HOUR);

    if (elapsedHours < HOURS_PER_DAY) {
      return $localize`:@@relativeTimeHours:${elapsedHours}:COUNT: hr ago`;
    }

    const elapsedDays = Math.floor(elapsedHours / HOURS_PER_DAY);

    if (elapsedDays === SINGLE_DAY) {
      return $localize`:@@relativeTimeDay:1 day ago`;
    }

    return $localize`:@@relativeTimeDays:${elapsedDays}:COUNT: days ago`;
  }
}
