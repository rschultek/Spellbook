/**
 * Unit Tests for Error Handling Utilities
 *
 * Business Rules:
 * - Must extract error messages from various response formats
 * - Must provide user-friendly fallback messages
 * - Must detect rate-limit errors for special handling
 * - Must detect network errors for connectivity feedback
 *
 * Critical for: User experience, error reporting, debugging
 */

import { describe, it, expect } from "vitest";
import {
  extractErrorMessage,
  getErrorMessage,
  isRateLimitError,
  formatRateLimitError,
  isNetworkError,
  createContextualErrorMessage,
  type ApiErrorResponse,
} from "@/lib/utils/errorHandling";

describe("Error Handling Utilities", () => {
  describe("extractErrorMessage()", () => {
    describe("Error Field Extraction", () => {
      it("should extract error from error field", () => {
        // Arrange
        const data: ApiErrorResponse = { error: "API rate limit exceeded" };

        // Act
        const message = extractErrorMessage(data);

        // Assert
        expect(message).toBe("API rate limit exceeded");
      });

      it("should extract error from message field", () => {
        // Arrange
        const data: ApiErrorResponse = { message: "Invalid request" };

        // Act
        const message = extractErrorMessage(data);

        // Assert
        expect(message).toBe("Invalid request");
      });

      it("should prefer error field over message field", () => {
        // Arrange
        const data: ApiErrorResponse = {
          error: "Primary error",
          message: "Secondary message",
        };

        // Act
        const message = extractErrorMessage(data);

        // Assert
        expect(message).toBe("Primary error");
      });
    });

    describe("Fallback Messages", () => {
      it("should use default message for empty data", () => {
        // Arrange
        const data: ApiErrorResponse = {};

        // Act
        const message = extractErrorMessage(data);

        // Assert
        expect(message).toBe("Nie udało się wygenerować wyjaśnienia");
      });

      it("should use custom default message when provided", () => {
        // Arrange
        const data: ApiErrorResponse = {};
        const defaultMsg = "Custom error message";

        // Act
        const message = extractErrorMessage(data, defaultMsg);

        // Assert
        expect(message).toBe("Custom error message");
      });

      it("should use default message for empty error string", () => {
        // Arrange
        const data: ApiErrorResponse = { error: "" };

        // Act
        const message = extractErrorMessage(data);

        // Assert
        expect(message).toBe("Nie udało się wygenerować wyjaśnienia");
      });

      it("should use default message for whitespace-only error", () => {
        // Arrange
        const data: ApiErrorResponse = { error: "   " };

        // Act
        const message = extractErrorMessage(data);

        // Assert
        expect(message).toBe("Nie udało się wygenerować wyjaśnienia");
      });
    });
  });

  describe("getErrorMessage()", () => {
    describe("Error Object Handling", () => {
      it("should extract message from Error instance", () => {
        // Arrange
        const error = new Error("Something went wrong");

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Something went wrong");
      });

      it("should handle Error with empty message", () => {
        // Arrange
        const error = new Error("");

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Wystąpił błąd");
      });
    });

    describe("String Error Handling", () => {
      it("should handle string errors", () => {
        // Arrange
        const error = "Network connection failed";

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Network connection failed");
      });

      it("should use default for empty string", () => {
        // Arrange
        const error = "";

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Wystąpił błąd");
      });
    });

    describe("Object with Message Property", () => {
      it("should extract message from object with message property", () => {
        // Arrange
        const error = { message: "Custom error message" };

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Custom error message");
      });

      it("should handle object with empty message", () => {
        // Arrange
        const error = { message: "" };

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Wystąpił błąd");
      });
    });

    describe("Unknown Error Types", () => {
      it("should handle null", () => {
        // Arrange
        const error = null;

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Wystąpił błąd");
      });

      it("should handle undefined", () => {
        // Arrange
        const error = undefined;

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Wystąpił błąd");
      });

      it("should handle numbers", () => {
        // Arrange
        const error = 404;

        // Act
        const message = getErrorMessage(error);

        // Assert
        expect(message).toBe("Wystąpił błąd");
      });
    });
  });

  describe("isRateLimitError()", () => {
    describe("Rate Limit Detection - English", () => {
      it("should detect rate limit keyword", () => {
        // Arrange
        const message = "Rate limit exceeded. Please try again later.";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(true);
      });

      it("should detect too many requests", () => {
        // Arrange
        const message = "Too many requests from this IP";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(true);
      });

      it("should detect quota exceeded", () => {
        // Arrange
        const message = "API quota exceeded";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(true);
      });

      it("should detect HTTP 429 status", () => {
        // Arrange
        const message = "Error 429: Too Many Requests";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(true);
      });
    });

    describe("Rate Limit Detection - Polish", () => {
      it("should detect Polish rate limit message", () => {
        // Arrange
        const message = "Zbyt wiele zapytań. Spróbuj później.";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(true);
      });

      it("should detect alternative Polish phrase", () => {
        // Arrange
        const message = "Za dużo zapytań w krótkim czasie";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(true);
      });
    });

    describe("Non-Rate Limit Errors", () => {
      it("should not detect generic errors", () => {
        // Arrange
        const message = "Internal server error";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(false);
      });

      it("should not detect network errors", () => {
        // Arrange
        const message = "Network connection failed";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(false);
      });
    });

    describe("Case Insensitivity", () => {
      it("should detect uppercase RATE LIMIT", () => {
        // Arrange
        const message = "RATE LIMIT EXCEEDED";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(true);
      });

      it("should detect mixed case", () => {
        // Arrange
        const message = "Rate Limit Exceeded";

        // Act
        const isRateLimit = isRateLimitError(message);

        // Assert
        expect(isRateLimit).toBe(true);
      });
    });
  });

  describe("formatRateLimitError()", () => {
    it("should format rate limit errors to Polish message", () => {
      // Arrange
      const message = "Rate limit exceeded. Try again in 60 seconds.";

      // Act
      const formatted = formatRateLimitError(message);

      // Assert
      expect(formatted).toBe("Za dużo zapytań. Poczekaj chwilę i spróbuj ponownie.");
    });

    it("should return original message for non-rate-limit errors", () => {
      // Arrange
      const message = "Invalid API key";

      // Act
      const formatted = formatRateLimitError(message);

      // Assert
      expect(formatted).toBe("Invalid API key");
    });

    it("should handle empty strings", () => {
      // Arrange
      const message = "";

      // Act
      const formatted = formatRateLimitError(message);

      // Assert
      expect(formatted).toBe("");
    });
  });

  describe("isNetworkError()", () => {
    it("should detect network error from Error message", () => {
      // Arrange
      const error = new Error("Network request failed");

      // Act
      const isNetwork = isNetworkError(error);

      // Assert
      expect(isNetwork).toBe(true);
    });

    it("should detect fetch errors", () => {
      // Arrange
      const error = new Error("fetch failed");

      // Act
      const isNetwork = isNetworkError(error);

      // Assert
      expect(isNetwork).toBe(true);
    });

    it("should detect connection errors", () => {
      // Arrange
      const error = new Error("Connection refused ECONNREFUSED");

      // Act
      const isNetwork = isNetworkError(error);

      // Assert
      expect(isNetwork).toBe(true);
    });

    it("should detect timeout errors", () => {
      // Arrange
      const error = new Error("Request timeout ETIMEDOUT");

      // Act
      const isNetwork = isNetworkError(error);

      // Assert
      expect(isNetwork).toBe(true);
    });

    it("should not detect non-network errors", () => {
      // Arrange
      const error = new Error("Validation failed");

      // Act
      const isNetwork = isNetworkError(error);

      // Assert
      expect(isNetwork).toBe(false);
    });

    it("should return false for non-Error objects", () => {
      // Arrange
      const error = "Some error string";

      // Act
      const isNetwork = isNetworkError(error);

      // Assert
      expect(isNetwork).toBe(false);
    });
  });

  describe("createContextualErrorMessage()", () => {
    it("should create contextual message for network errors", () => {
      // Arrange
      const error = new Error("Network connection failed");
      const context = "Fetching explanation";

      // Act
      const message = createContextualErrorMessage(error, context);

      // Assert
      expect(message).toContain("Fetching explanation");
      expect(message).toContain("Błąd połączenia sieciowego");
    });

    it("should create contextual message for rate limit errors", () => {
      // Arrange
      const error = new Error("Rate limit exceeded");
      const context = "API Request";

      // Act
      const message = createContextualErrorMessage(error, context);

      // Assert
      expect(message).toContain("API Request");
      expect(message).toContain("Za dużo zapytań");
    });

    it("should create contextual message for generic errors", () => {
      // Arrange
      const error = new Error("Invalid input");
      const context = "Validating data";

      // Act
      const message = createContextualErrorMessage(error, context);

      // Assert
      expect(message).toBe("Validating data: Invalid input");
    });

    it("should handle unknown error types", () => {
      // Arrange
      const error = null;
      const context = "Processing";

      // Act
      const message = createContextualErrorMessage(error, context);

      // Assert
      expect(message).toContain("Processing");
      expect(message).toContain("Wystąpił błąd");
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete API error flow", () => {
      // Arrange
      const apiResponse = {
        error: "Rate limit exceeded. Quota: 100/hour",
      };

      // Act
      const extractedMessage = extractErrorMessage(apiResponse);
      const isRateLimit = isRateLimitError(extractedMessage);
      const userMessage = formatRateLimitError(extractedMessage);

      // Assert
      expect(extractedMessage).toBe("Rate limit exceeded. Quota: 100/hour");
      expect(isRateLimit).toBe(true);
      expect(userMessage).toBe("Za dużo zapytań. Poczekaj chwilę i spróbuj ponownie.");
    });

    it("should provide helpful message for network issues", () => {
      // Arrange
      const error = new Error("fetch failed: connection timeout");
      const context = "Loading code explanation";

      // Act
      const message = createContextualErrorMessage(error, context);

      // Assert
      expect(message).toContain("Loading code explanation");
      expect(message).toContain("Błąd połączenia sieciowego");
      expect(message).toContain("Sprawdź połączenie");
    });
  });
});
