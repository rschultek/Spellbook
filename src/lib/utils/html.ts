/**
 * HTML Utilities
 *
 * Functions for safely handling HTML content and preventing XSS attacks.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML insertion
 *
 * Security: Critical for preventing XSS attacks
 *
 * Escaped characters:
 * - & → &amp;
 * - < → &lt;
 * - > → &gt;
 * - " → &quot;
 * - ' → &#039;
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
