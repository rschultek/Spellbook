/**
 * Error Handling Utilities
 *
 * Functions for extracting and formatting error messages
 * from API responses and Error objects.
 */

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

/**
 * Extracts error message from API response data
 *
 * @param data - API response data
 * @param defaultMessage - Fallback message if no error found
 * @returns Error message to display to user
 *
 * @example
 * ```typescript
 * const data = { error: 'Rate limit exceeded' };
 * extractErrorMessage(data); // 'Rate limit exceeded'
 *
 * const emptyData = {};
 * extractErrorMessage(emptyData); // 'Nie udało się wygenerować wyjaśnienia'
 * ```
 */
export function extractErrorMessage(
  data: ApiErrorResponse,
  defaultMessage = "Nie udało się wygenerować wyjaśnienia"
): string {
  // Try 'error' field first
  if (data.error && typeof data.error === "string" && data.error.trim().length > 0) {
    return data.error;
  }

  // Try 'message' field as fallback
  if (data.message && typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  // Return default message
  return defaultMessage;
}

/**
 * Gets error message from Error object or unknown error
 *
 * @param error - Error object or unknown value
 * @param defaultMessage - Fallback message
 * @returns Error message string
 */
export function getErrorMessage(error: unknown, defaultMessage = "Wystąpił błąd"): string {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  if (typeof error === "string") {
    return error || defaultMessage;
  }

  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim().length > 0) {
      return msg;
    }
  }

  return defaultMessage;
}

/**
 * Checks if an error message indicates a rate limit issue
 *
 * @param message - Error message to check
 * @returns True if the error is rate-limit related
 */
export function isRateLimitError(message: string): boolean {
  const rateLimitKeywords = [
    "rate limit",
    "too many requests",
    "quota exceeded",
    "429",
    "zbyt wiele zapytań",
    "za dużo zapytań",
  ];

  const lowerMessage = message.toLowerCase();
  return rateLimitKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Creates a user-friendly error message for rate limit errors
 *
 * @param originalMessage - Original error message
 * @returns Localized, user-friendly message
 */
export function formatRateLimitError(originalMessage: string): string {
  if (isRateLimitError(originalMessage)) {
    return "Za dużo zapytań. Poczekaj chwilę i spróbuj ponownie.";
  }
  return originalMessage;
}

/**
 * Checks if an error is a network-related error
 *
 * @param error - Error to check
 * @returns True if the error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const networkKeywords = ["network", "fetch", "connection", "timeout", "ECONNREFUSED", "ETIMEDOUT"];

    const errorMessage = error.message.toLowerCase();
    return networkKeywords.some((keyword) => errorMessage.includes(keyword));
  }

  return false;
}

/**
 * Creates a comprehensive error message with context
 *
 * @param error - Error object
 * @param context - Additional context about where the error occurred
 * @returns Formatted error message
 */
export function createContextualErrorMessage(error: unknown, context: string): string {
  const baseMessage = getErrorMessage(error);

  if (isNetworkError(error)) {
    return `${context}: Błąd połączenia sieciowego. Sprawdź połączenie z internetem.`;
  }

  if (isRateLimitError(baseMessage)) {
    return `${context}: ${formatRateLimitError(baseMessage)}`;
  }

  return `${context}: ${baseMessage}`;
}
