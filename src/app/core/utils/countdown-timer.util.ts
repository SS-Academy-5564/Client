import { DestroyRef, signal, Signal } from '@angular/core';

/** Controls a lifecycle-bound countdown value. */
export type CountdownTimer = {
  /** Remaining countdown duration in seconds. */
  readonly remainingSeconds: Signal<number>;

  /**
   * Restarts the countdown from the provided duration.
   *
   * @param seconds Countdown duration in seconds.
   */
  start(seconds: number): void;
};

/**
 * Creates a countdown that stops automatically when its lifecycle owner is destroyed.
 *
 * @param destroyRef Lifecycle owner used to clean up the active interval.
 * @returns A controller exposing the remaining seconds and restart action.
 */
export function createCountdownTimer(destroyRef: DestroyRef): CountdownTimer {
  const remainingSeconds = signal(0);
  let timerId: ReturnType<typeof setInterval> | null = null;

  const clear = (): void => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  destroyRef.onDestroy(clear);

  return {
    remainingSeconds: remainingSeconds.asReadonly(),
    start: (seconds: number): void => {
      clear();

      const clampedSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      remainingSeconds.set(clampedSeconds);

      if (clampedSeconds === 0) {
        return;
      }

      timerId = setInterval((): void => {
        const current = remainingSeconds();
        if (current <= 1) {
          clear();
          remainingSeconds.set(0);
        } else {
          remainingSeconds.set(current - 1);
        }
      }, 1000);
    },
  };
}
