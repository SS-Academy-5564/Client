import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthRateLimitMessageService {
  build(err: HttpErrorResponse): string {
    const bodyMessage = err.error?.errors?.[0]?.message ?? err.error?.message;
    const retrySeconds = this.extractRetrySecondsFromMessage(bodyMessage);

    if (retrySeconds !== null) {
      return this.buildRetrySecondsMessage(retrySeconds);
    }

    const retryAfter = err.headers.get('Retry-After');

    if (retryAfter) {
      return this.formatRetryAfterMessage(retryAfter);
    }

    return $localize`:@@register.rateLimit:Too many registration attempts. Please try again later.`;
  }

  private formatRetryAfterMessage(retryAfter: string): string {
    const trimmedRetryAfter = retryAfter.trim();

    if (/^\d+$/.test(trimmedRetryAfter)) {
      return this.buildRetrySecondsMessage(Number(trimmedRetryAfter));
    }

    const retryDate = Date.parse(retryAfter);

    if (!Number.isNaN(retryDate)) {
      const remainingSeconds = Math.max(0, Math.round((retryDate - Date.now()) / 1000));
      return this.buildRetrySecondsMessage(remainingSeconds);
    }

    return this.buildRetryRawMessage(retryAfter);
  }

  private extractRetrySecondsFromMessage(message: unknown): number | null {
    if (typeof message !== 'string') {
      return null;
    }

    const match = message.match(/(\d+)\s*(second|seconds|minute|minutes|hour|hours)/i);

    if (!match) {
      return null;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'minute':
      case 'minutes':
        return value * 60;
      case 'hour':
      case 'hours':
        return value * 60 * 60;
      default:
        return value;
    }
  }

  private buildRetrySecondsMessage(seconds: number): string {
    // eslint-disable-next-line max-len
    return $localize`:@@register.rateLimitRetrySeconds:Too many registration attempts. Please try again later. Retry after ${seconds} seconds.`;
  }

  private buildRetryRawMessage(retryAfter: string): string {
    // eslint-disable-next-line max-len
    return $localize`:@@register.rateLimitRetryRaw:Too many registration attempts. Please try again later. Retry after ${retryAfter}.`;
  }
}
