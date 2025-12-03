/**
 * Unit Tests for Language Helper Utilities
 *
 * Business Rules:
 * - "Note" is the only non-code language type
 * - All languages must map to valid Shiki identifiers
 * - Special mappings: MySQL→sql, Note→markdown, Other→text
 * - Language validation must be strict
 *
 * Critical for: Syntax highlighting, UI behavior, feature availability
 */

import { describe, it, expect } from "vitest";
import type { SnippetLanguage } from "@/types";
import {
  isCodeLanguage,
  getShikiLanguage,
  canExplainLanguage,
  isValidSnippetLanguage,
  getLanguageDisplayName,
} from "@/lib/utils/language";

describe("Language Helper Utilities", () => {
  describe("isCodeLanguage()", () => {
    describe("Code Languages", () => {
      it("should identify JavaScript as code", () => {
        // Arrange
        const language: SnippetLanguage = "JavaScript";

        // Act
        const result = isCodeLanguage(language);

        // Assert
        expect(result).toBe(true);
      });

      it("should identify TypeScript as code", () => {
        // Arrange
        const language: SnippetLanguage = "TypeScript";

        // Act
        const result = isCodeLanguage(language);

        // Assert
        expect(result).toBe(true);
      });

      it("should identify all programming languages as code", () => {
        // Arrange
        const codeLanguages: SnippetLanguage[] = [
          "JavaScript",
          "TypeScript",
          "Python",
          "PHP",
          "Bash",
          "Elixir",
          "MySQL",
        ];

        // Act & Assert
        codeLanguages.forEach((lang) => {
          expect(isCodeLanguage(lang)).toBe(true);
        });
      });

      it("should identify markup languages as code", () => {
        // Arrange
        const markupLanguages: SnippetLanguage[] = ["HTML", "CSS", "JSON", "YAML"];

        // Act & Assert
        markupLanguages.forEach((lang) => {
          expect(isCodeLanguage(lang)).toBe(true);
        });
      });

      it("should identify Other as code", () => {
        // Arrange
        const language: SnippetLanguage = "Other";

        // Act
        const result = isCodeLanguage(language);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe("Non-Code Languages", () => {
      it("should identify Note as NOT code", () => {
        // Arrange
        const language: SnippetLanguage = "Note";

        // Act
        const result = isCodeLanguage(language);

        // Assert
        expect(result).toBe(false);
      });

      it("should only return false for Note language", () => {
        // Arrange
        const allLanguages: SnippetLanguage[] = [
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

        // Act & Assert
        allLanguages.forEach((lang) => {
          const isCode = isCodeLanguage(lang);
          if (lang === "Note") {
            expect(isCode).toBe(false);
          } else {
            expect(isCode).toBe(true);
          }
        });
      });
    });
  });

  describe("getShikiLanguage()", () => {
    describe("Standard Language Mappings", () => {
      it("should map JavaScript to javascript", () => {
        // Arrange
        const language: SnippetLanguage = "JavaScript";

        // Act
        const shikiLang = getShikiLanguage(language);

        // Assert
        expect(shikiLang).toBe("javascript");
      });

      it("should map TypeScript to typescript", () => {
        // Arrange
        const language: SnippetLanguage = "TypeScript";

        // Act
        const shikiLang = getShikiLanguage(language);

        // Assert
        expect(shikiLang).toBe("typescript");
      });

      it("should map Python to python", () => {
        // Arrange
        const language: SnippetLanguage = "Python";

        // Act
        const shikiLang = getShikiLanguage(language);

        // Assert
        expect(shikiLang).toBe("python");
      });
    });

    describe("Special Case Mappings - Business Rules", () => {
      it("should map MySQL to sql (not mysql)", () => {
        // Arrange
        const language: SnippetLanguage = "MySQL";

        // Act
        const shikiLang = getShikiLanguage(language);

        // Assert
        expect(shikiLang).toBe("sql");
        expect(shikiLang).not.toBe("mysql");
      });

      it("should map Note to markdown", () => {
        // Arrange
        const language: SnippetLanguage = "Note";

        // Act
        const shikiLang = getShikiLanguage(language);

        // Assert
        expect(shikiLang).toBe("markdown");
      });

      it("should map Other to text", () => {
        // Arrange
        const language: SnippetLanguage = "Other";

        // Act
        const shikiLang = getShikiLanguage(language);

        // Assert
        expect(shikiLang).toBe("text");
      });
    });

    describe("Fallback Behavior", () => {
      it("should return lowercase identifiers", () => {
        // Arrange
        const languages: SnippetLanguage[] = ["JavaScript", "TypeScript", "Python", "PHP"];

        // Act & Assert
        languages.forEach((lang) => {
          const shikiLang = getShikiLanguage(lang);
          expect(shikiLang).toBe(shikiLang.toLowerCase());
        });
      });

      it("should never return empty string", () => {
        // Arrange
        const allLanguages: SnippetLanguage[] = [
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

        // Act & Assert
        allLanguages.forEach((lang) => {
          const shikiLang = getShikiLanguage(lang);
          expect(shikiLang.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("canExplainLanguage()", () => {
    it("should allow explaining code languages", () => {
      // Arrange
      const language: SnippetLanguage = "JavaScript";

      // Act
      const canExplain = canExplainLanguage(language);

      // Assert
      expect(canExplain).toBe(true);
    });

    it("should NOT allow explaining Note language", () => {
      // Arrange
      const language: SnippetLanguage = "Note";

      // Act
      const canExplain = canExplainLanguage(language);

      // Assert
      expect(canExplain).toBe(false);
    });

    it("should have same behavior as isCodeLanguage", () => {
      // Arrange
      const allLanguages: SnippetLanguage[] = [
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

      // Act & Assert
      allLanguages.forEach((lang) => {
        expect(canExplainLanguage(lang)).toBe(isCodeLanguage(lang));
      });
    });
  });

  describe("isValidSnippetLanguage()", () => {
    describe("Valid Languages", () => {
      it("should validate JavaScript", () => {
        // Arrange
        const value = "JavaScript";

        // Act
        const isValid = isValidSnippetLanguage(value);

        // Assert
        expect(isValid).toBe(true);
      });

      it("should validate all 13 snippet languages", () => {
        // Arrange
        const validLanguages = [
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

        // Act & Assert
        validLanguages.forEach((lang) => {
          expect(isValidSnippetLanguage(lang)).toBe(true);
        });
      });
    });

    describe("Invalid Languages", () => {
      it("should reject lowercase javascript", () => {
        // Arrange
        const value = "javascript";

        // Act
        const isValid = isValidSnippetLanguage(value);

        // Assert
        expect(isValid).toBe(false);
      });

      it("should reject unknown language", () => {
        // Arrange
        const value = "Rust";

        // Act
        const isValid = isValidSnippetLanguage(value);

        // Assert
        expect(isValid).toBe(false);
      });

      it("should reject empty string", () => {
        // Arrange
        const value = "";

        // Act
        const isValid = isValidSnippetLanguage(value);

        // Assert
        expect(isValid).toBe(false);
      });

      it("should reject misspelled languages", () => {
        // Arrange
        const invalidLanguages = ["Javascrpt", "Pythn", "Tyepscript"];

        // Act & Assert
        invalidLanguages.forEach((lang) => {
          expect(isValidSnippetLanguage(lang)).toBe(false);
        });
      });
    });
  });

  describe("getLanguageDisplayName()", () => {
    describe("Standard Display Names", () => {
      it("should return JavaScript for JavaScript", () => {
        // Arrange
        const language: SnippetLanguage = "JavaScript";

        // Act
        const displayName = getLanguageDisplayName(language);

        // Assert
        expect(displayName).toBe("JavaScript");
      });

      it("should return TypeScript for TypeScript", () => {
        // Arrange
        const language: SnippetLanguage = "TypeScript";

        // Act
        const displayName = getLanguageDisplayName(language);

        // Assert
        expect(displayName).toBe("TypeScript");
      });
    });

    describe("Special Display Names", () => {
      it("should return descriptive name for MySQL", () => {
        // Arrange
        const language: SnippetLanguage = "MySQL";

        // Act
        const displayName = getLanguageDisplayName(language);

        // Assert
        expect(displayName).toBe("MySQL / SQL");
      });

      it("should return descriptive name for Note", () => {
        // Arrange
        const language: SnippetLanguage = "Note";

        // Act
        const displayName = getLanguageDisplayName(language);

        // Assert
        expect(displayName).toBe("Note / Markdown");
      });

      it("should return descriptive name for Other", () => {
        // Arrange
        const language: SnippetLanguage = "Other";

        // Act
        const displayName = getLanguageDisplayName(language);

        // Assert
        expect(displayName).toBe("Plain Text");
      });
    });

    describe("Return Type", () => {
      it("should always return non-empty string", () => {
        // Arrange
        const allLanguages: SnippetLanguage[] = [
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

        // Act & Assert
        allLanguages.forEach((lang) => {
          const displayName = getLanguageDisplayName(lang);
          expect(typeof displayName).toBe("string");
          expect(displayName.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("Integration Scenarios", () => {
    it("should correctly identify code language and get Shiki mapping", () => {
      // Arrange
      const language: SnippetLanguage = "JavaScript";

      // Act
      const isCode = isCodeLanguage(language);
      const shikiLang = getShikiLanguage(language);
      const canExplain = canExplainLanguage(language);

      // Assert
      expect(isCode).toBe(true);
      expect(shikiLang).toBe("javascript");
      expect(canExplain).toBe(true);
    });

    it("should handle Note language correctly across all functions", () => {
      // Arrange
      const language: SnippetLanguage = "Note";

      // Act
      const isCode = isCodeLanguage(language);
      const shikiLang = getShikiLanguage(language);
      const canExplain = canExplainLanguage(language);
      const displayName = getLanguageDisplayName(language);

      // Assert
      expect(isCode).toBe(false);
      expect(shikiLang).toBe("markdown");
      expect(canExplain).toBe(false);
      expect(displayName).toBe("Note / Markdown");
    });

    it("should validate and process user input correctly", () => {
      // Arrange
      const userInput = "JavaScript";

      // Act
      const isValid = isValidSnippetLanguage(userInput);

      // Assert
      if (isValid) {
        const language = userInput as SnippetLanguage;
        expect(isCodeLanguage(language)).toBe(true);
        expect(getShikiLanguage(language)).toBe("javascript");
      }
    });
  });
});
