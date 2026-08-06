/** Shared constants for auth rate-limit messaging. */
export const AUTH_RATE_LIMIT_MESSAGES = {
  generic: $localize`:@@register.rateLimit:Too many registration attempts. Please try again later.`,
  retryPrefix: 'Too many registration attempts. Retry in ',
  retryRawPrefix: 'Too many registration attempts. Try again after ',
} as const;

/** HTTP status code used for rate-limit responses. */
export const RATE_LIMIT_STATUS_CODE = 429;
