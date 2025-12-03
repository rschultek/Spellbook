/**
 * Language Constants
 *
 * Mapping between Spellbook SnippetLanguage types
 * and Shiki syntax highlighting language identifiers.
 */

import type { SnippetLanguage } from "@/types";

/**
 * Map Spellbook languages to Shiki language identifiers
 *
 * Special mappings:
 * - MySQL → "sql" (generic SQL syntax)
 * - Note → "markdown" (notes formatted as Markdown)
 * - Other → "text" (fallback for unknown languages)
 */
export const LANGUAGE_MAP: Record<SnippetLanguage, string> = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  Python: "python",
  PHP: "php",
  Bash: "bash",
  CSS: "css",
  HTML: "html",
  JSON: "json",
  MySQL: "sql",
  YAML: "yaml",
  Elixir: "elixir",
  Note: "markdown",
  Other: "text",
} as const;
