/**
 * Throttling Utilities
 *
 * Provides functions for throttling operations based on time delays.
 * Used to prevent spam and respect rate limits.
 */

export interface ThrottleResult {
  isAllowed: boolean;
  remainingSeconds: number;
  timeSinceLastCall: number;
}

/**
 * Calculates throttle delay and determines if an action is allowed
 *
 * @param lastTime - Timestamp of the last action (from Date.now())
 * @param minDelay - Minimum delay in milliseconds between actions
 * @returns Object with isAllowed flag and remaining seconds
 *
 * @example
 * ```typescript
 * const result = calculateThrottleDelay(lastExplainTime, 3000);
 * if (!result.isAllowed) {
 *   console.log(`Wait ${result.remainingSeconds}s`);
 * }
 * ```
 */
export function calculateThrottleDelay(lastTime: number, minDelay: number): ThrottleResult {
  const now = Date.now();
  const timeSince = now - lastTime;

  if (timeSince >= minDelay) {
    return {
      isAllowed: true,
      remainingSeconds: 0,
      timeSinceLastCall: timeSince,
    };
  }

  const remainingMs = minDelay - timeSince;
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return {
    isAllowed: false,
    remainingSeconds,
    timeSinceLastCall: timeSince,
  };
}

/**
 * Calculates only the remaining seconds until an action is allowed
 *
 * @param lastTime - Timestamp of the last action
 * @param minDelay - Minimum delay in milliseconds
 * @returns Number of seconds remaining (0 if action is allowed)
 */
export function getRemainingSeconds(lastTime: number, minDelay: number): number {
  const result = calculateThrottleDelay(lastTime, minDelay);
  return result.remainingSeconds;
}

/**
 * Checks if an action is allowed based on throttle delay
 *
 * @param lastTime - Timestamp of the last action
 * @param minDelay - Minimum delay in milliseconds
 * @returns True if action is allowed, false otherwise
 */
export function isActionAllowed(lastTime: number, minDelay: number): boolean {
  const result = calculateThrottleDelay(lastTime, minDelay);
  return result.isAllowed;
}

/**
 * Formats remaining time as a user-friendly message
 *
 * @param remainingSeconds - Number of seconds remaining
 * @param message - Template message with {seconds} placeholder
 * @returns Formatted message
 *
 * @example
 * ```typescript
 * formatThrottleMessage(3, "Poczekaj jeszcze {seconds}s");
 * // Returns: "Poczekaj jeszcze 3s"
 * ```
 */
export function formatThrottleMessage(
  remainingSeconds: number,
  message = "Poczekaj jeszcze {seconds}s przed kolejnym wyjaśnieniem"
): string {
  return message.replace("{seconds}", remainingSeconds.toString());
}
