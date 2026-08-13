/**
 * Reads a numeric HTTP status from an unknown error-like value.
 *
 * @param error Error value that may expose an HTTP status.
 * @returns The numeric status when present, otherwise `undefined`.
 */
export function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined;
  }

  return typeof error.status === 'number' ? error.status : undefined;
}
