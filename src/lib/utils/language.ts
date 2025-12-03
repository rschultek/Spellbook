/**
 * Language Utilities
 *
 * Helper functions for working with SnippetLanguage types
 * and Shiki syntax highlighting identifiers.
 */

import type { SnippetLanguage } from "@/types";
import { LANGUAGE_MAP } from "@/lib/constants/languages";

/**
 * Checks if a language represents actual code (not a note)
 *
 * @param language - The snippet language type
 * @returns True if the language is code, false if it's a note
 *
 * Business Rule: "Note" is treated as markdown text, not code
 *
 * @example
 * ```typescript
 * isCodeLanguage('JavaScript') // true
 * isCodeLanguage('Note')       // false
 * ```
 */
export function isCodeLanguage(language: SnippetLanguage): boolean {
  return language !== "Note";
}

/**
 * Gets the Shiki language identifier for syntax highlighting
 *
 * @param language - The snippet language type
 * @returns Shiki language identifier (defaults to "text" if not found)
 *
 * @example
 * ```typescript
 * getShikiLanguage('JavaScript') // 'javascript'
 * getShikiLanguage('MySQL')      // 'sql'
 * getShikiLanguage('Unknown')    // 'text' (fallback)
 * ```
 */
export function getShikiLanguage(language: SnippetLanguage): string {
  return LANGUAGE_MAP[language] || "text";
}

/**
 * Checks if a language should show the "Explain" button
 *
 * @param language - The snippet language type
 * @returns True if the explain feature should be available
 *
 * Business Rule: Only code languages can be explained (not notes)
 */
export function canExplainLanguage(language: SnippetLanguage): boolean {
  return isCodeLanguage(language);
}

/**
 * Validates if a string is a valid SnippetLanguage
 *
 * @param value - String to validate
 * @returns True if the value is a valid SnippetLanguage type
 */
export function isValidSnippetLanguage(value: string): value is SnippetLanguage {
  const validLanguages: readonly string[] = [
    "Bash",
    "CSS",
    "Elixir",
    "HTML",
    "JavaScript",
    "JSON",
    "MySQL",
    "Note",
    "Other",
    "PHP",
    "Python",
    "TypeScript",
    "YAML",
  ];

  return validLanguages.includes(value);
}

/**
 * Gets a human-friendly display name for a language
 *
 * @param language - The snippet language type
 * @returns Display name for UI
 */
export function getLanguageDisplayName(language: SnippetLanguage): string {
  // Most languages use their type name directly
  // Special cases can be added here if needed
  const specialCases: Partial<Record<SnippetLanguage, string>> = {
    MySQL: "MySQL / SQL",
    Note: "Note / Markdown",
    Other: "Plain Text",
  };

  return specialCases[language] || language;
}
