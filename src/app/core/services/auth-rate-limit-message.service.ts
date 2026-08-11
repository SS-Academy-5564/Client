import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AUTH_RATE_LIMIT_MESSAGES } from '@core/constants/auth-rate-limit.constants';

@Injectable({ providedIn: 'root' })
export class AuthRateLimitMessageService {
  /** Builds a user-facing message for rate-limit errors. */
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

    return AUTH_RATE_LIMIT_MESSAGES.generic;
  }

  private formatRetryAfterMessage(retryAfter: string): string {
    const trimmedRetryAfter = retryAfter.trim();

    if (/^\d+$/.test(trimmedRetryAfter)) {
      return this.buildRetrySecondsMessage(Number(trimmedRetryAfter));
    }

    const retryDate = Date.parse(retryAfter);

    if (!Number.isNaN(retryDate)) {
      const remainingSeconds = Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
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
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    const unit = minutes === 1 ? 'minute' : 'minutes';

    return `${AUTH_RATE_LIMIT_MESSAGES.retryPrefix}${minutes} ${unit}.`;
  }

  private buildRetryRawMessage(retryAfter: string): string {
    return `${AUTH_RATE_LIMIT_MESSAGES.retryRawPrefix}${retryAfter}.`;
  }
}
