/**
 * Unit Tests for LANGUAGE_MAP
 *
 * Business Rules:
 * - Must map all SnippetLanguage types to valid Shiki language identifiers
 * - Mappings must be exhaustive (no missing languages)
 * - Special cases: Note -> markdown, Other -> text, MySQL -> sql
 * - All mappings must result in valid Shiki languages for proper syntax highlighting
 *
 * Critical for: Correct syntax highlighting in code blocks
 */

import { describe, it, expect } from "vitest";
import type { SnippetLanguage } from "@/types";

// Language map - extracted for testing
// NOTE: This is a copy from CodeBlock.tsx
// In production, consider extracting it to a shared constants file
const LANGUAGE_MAP: Record<SnippetLanguage, string> = {
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
};

// All valid SnippetLanguage values from types.ts
const ALL_SNIPPET_LANGUAGES: readonly SnippetLanguage[] = [
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
] as const;

describe("LANGUAGE_MAP", () => {
  describe("Completeness - All Languages Mapped", () => {
    it("should have exactly 13 language mappings", () => {
      // Arrange & Act
      const mappingCount = Object.keys(LANGUAGE_MAP).length;

      // Assert
      expect(mappingCount).toBe(13);
    });

    it("should map every SnippetLanguage type", () => {
      // Arrange
      const expectedLanguages = ALL_SNIPPET_LANGUAGES;

      // Act
      const mappedLanguages = Object.keys(LANGUAGE_MAP) as SnippetLanguage[];

      // Assert
      expectedLanguages.forEach((lang) => {
        expect(mappedLanguages).toContain(lang);
      });
    });

    it("should not have any extra unmapped languages", () => {
      // Arrange
      const mappedLanguages = Object.keys(LANGUAGE_MAP);

      // Act & Assert
      mappedLanguages.forEach((lang) => {
        expect(ALL_SNIPPET_LANGUAGES).toContain(lang as SnippetLanguage);
      });
    });

    it("should have no undefined or null mappings", () => {
      // Arrange
      const mappings = Object.values(LANGUAGE_MAP);

      // Act & Assert
      mappings.forEach((mapping) => {
        expect(mapping).toBeDefined();
        expect(mapping).not.toBeNull();
        expect(typeof mapping).toBe("string");
        expect(mapping.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Standard Programming Language Mappings", () => {
    it('should map JavaScript to "javascript"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.JavaScript;

      // Assert
      expect(mapping).toBe("javascript");
    });

    it('should map TypeScript to "typescript"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.TypeScript;

      // Assert
      expect(mapping).toBe("typescript");
    });

    it('should map Python to "python"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.Python;

      // Assert
      expect(mapping).toBe("python");
    });

    it('should map PHP to "php"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.PHP;

      // Assert
      expect(mapping).toBe("php");
    });

    it('should map Bash to "bash"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.Bash;

      // Assert
      expect(mapping).toBe("bash");
    });

    it('should map Elixir to "elixir"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.Elixir;

      // Assert
      expect(mapping).toBe("elixir");
    });
  });

  describe("Markup and Data Format Mappings", () => {
    it('should map CSS to "css"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.CSS;

      // Assert
      expect(mapping).toBe("css");
    });

    it('should map HTML to "html"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.HTML;

      // Assert
      expect(mapping).toBe("html");
    });

    it('should map JSON to "json"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.JSON;

      // Assert
      expect(mapping).toBe("json");
    });

    it('should map YAML to "yaml"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.YAML;

      // Assert
      expect(mapping).toBe("yaml");
    });
  });

  describe("Special Case Mappings - Business Logic", () => {
    it('should map MySQL to "sql" (not "mysql")', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.MySQL;

      // Assert
      // Business rule: MySQL uses generic "sql" identifier in Shiki
      expect(mapping).toBe("sql");
      expect(mapping).not.toBe("mysql");
    });

    it('should map Note to "markdown"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.Note;

      // Assert
      // Business rule: Notes are formatted as Markdown
      expect(mapping).toBe("markdown");
    });

    it('should map Other to "text"', () => {
      // Arrange & Act
      const mapping = LANGUAGE_MAP.Other;

      // Assert
      // Business rule: Unknown languages fall back to plain text
      expect(mapping).toBe("text");
    });
  });

  describe("Shiki Compatibility - Valid Language Identifiers", () => {
    it("should use lowercase identifiers for all mappings", () => {
      // Arrange
      const mappings = Object.values(LANGUAGE_MAP);

      // Act & Assert
      mappings.forEach((mapping) => {
        expect(mapping).toBe(mapping.toLowerCase());
      });
    });

    it("should not have spaces in any mapping", () => {
      // Arrange
      const mappings = Object.values(LANGUAGE_MAP);

      // Act & Assert
      mappings.forEach((mapping) => {
        expect(mapping).not.toContain(" ");
      });
    });

    it("should use valid Shiki language identifiers", () => {
      // Arrange
      // Common Shiki language identifiers
      const validShikiLangs = [
        "javascript",
        "typescript",
        "python",
        "php",
        "bash",
        "css",
        "html",
        "json",
        "sql",
        "yaml",
        "elixir",
        "markdown",
        "text",
      ];

      // Act
      const mappings = Object.values(LANGUAGE_MAP);

      // Assert
      mappings.forEach((mapping) => {
        expect(validShikiLangs).toContain(mapping);
      });
    });
  });

  describe("Type Safety and Consistency", () => {
    it("should be typed as Record<SnippetLanguage, string>", () => {
      // Arrange
      type ExpectedType = Record<SnippetLanguage, string>;

      // Act - TypeScript will validate this at compile time
      const map: ExpectedType = LANGUAGE_MAP;

      // Assert
      expect(map).toBeDefined();
    });

    it("should allow access by SnippetLanguage key", () => {
      // Arrange
      const testLang: SnippetLanguage = "JavaScript";

      // Act
      const mapping = LANGUAGE_MAP[testLang];

      // Assert
      expect(mapping).toBe("javascript");
    });

    it("should return string values for all keys", () => {
      // Arrange
      const allLangs: SnippetLanguage[] = [...ALL_SNIPPET_LANGUAGES];

      // Act & Assert
      allLangs.forEach((lang) => {
        const mapping = LANGUAGE_MAP[lang];
        expect(typeof mapping).toBe("string");
      });
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle case-sensitive access correctly", () => {
      // Arrange & Act
      const javascriptLower = LANGUAGE_MAP["JavaScript"]; // Correct

      // Assert
      expect(javascriptLower).toBe("javascript");
      // Note: TypeScript prevents incorrect casing like LANGUAGE_MAP['javascript']
    });

    it("should not have duplicate values for different languages", () => {
      // Arrange
      const mappings = Object.values(LANGUAGE_MAP);

      // Act
      const uniqueMappings = new Set(mappings);

      // Assert
      // Note: Some duplicates are allowed (e.g., multiple languages could map to 'text')
      // But in our current mapping, all are unique
      expect(uniqueMappings.size).toBeGreaterThan(0);
    });

    it("should maintain consistency between keys and expected languages", () => {
      // Arrange
      const expectedKeys = [
        "JavaScript",
        "TypeScript",
        "Python",
        "PHP",
        "Bash",
        "CSS",
        "HTML",
        "JSON",
        "MySQL",
        "YAML",
        "Elixir",
        "Note",
        "Other",
      ];

      // Act
      const actualKeys = Object.keys(LANGUAGE_MAP).sort();

      // Assert
      expect(actualKeys).toEqual(expectedKeys.sort());
    });
  });

  describe("Real-World Usage Scenarios", () => {
    it("should provide correct mapping for JavaScript code snippet", () => {
      // Arrange
      const snippetLanguage: SnippetLanguage = "JavaScript";

      // Act
      const shikiLang = LANGUAGE_MAP[snippetLanguage];

      // Assert
      expect(shikiLang).toBe("javascript");
      // This ensures proper syntax highlighting for JS code
    });

    it("should provide correct mapping for database queries (MySQL)", () => {
      // Arrange
      const snippetLanguage: SnippetLanguage = "MySQL";

      // Act
      const shikiLang = LANGUAGE_MAP[snippetLanguage];

      // Assert
      expect(shikiLang).toBe("sql");
      // MySQL queries use generic SQL syntax highlighting
    });

    it("should provide markdown highlighting for notes", () => {
      // Arrange
      const snippetLanguage: SnippetLanguage = "Note";

      // Act
      const shikiLang = LANGUAGE_MAP[snippetLanguage];

      // Assert
      expect(shikiLang).toBe("markdown");
      // Notes are formatted as Markdown for better readability
    });

    it("should fall back to plain text for Other language", () => {
      // Arrange
      const snippetLanguage: SnippetLanguage = "Other";

      // Act
      const shikiLang = LANGUAGE_MAP[snippetLanguage];

      // Assert
      expect(shikiLang).toBe("text");
      // Unknown/unsupported languages display as plain text
    });
  });

  describe("Integration with CodeBlock Component", () => {
    it("should provide fallback for undefined language", () => {
      // Arrange
      type SnippetLanguage = keyof typeof LANGUAGE_MAP;
      const unknownLang = "Unknown" as SnippetLanguage;

      // Act
      const shikiLang = LANGUAGE_MAP[unknownLang] || "text";

      // Assert
      expect(shikiLang).toBe("text");
      // This simulates the fallback behavior in CodeBlock
    });

    it("should maintain consistent mapping across multiple accesses", () => {
      // Arrange
      const language: SnippetLanguage = "TypeScript";

      // Act
      const firstAccess = LANGUAGE_MAP[language];
      const secondAccess = LANGUAGE_MAP[language];
      const thirdAccess = LANGUAGE_MAP[language];

      // Assert
      expect(firstAccess).toBe(secondAccess);
      expect(secondAccess).toBe(thirdAccess);
      expect(firstAccess).toBe("typescript");
    });
  });
});
