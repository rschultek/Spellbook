/**
 * Unit Tests for Throttle Utilities
 *
 * Business Rules:
 * - Must accurately calculate time delays
 * - Must prevent spam by blocking requests within minimum delay
 * - Must provide user-friendly feedback on remaining time
 * - Used for API rate limiting and user interaction throttling
 *
 * Critical for: Rate limiting, spam prevention, UX feedback
 */

import { describe, it, expect } from "vitest";
import {
  calculateThrottleDelay,
  getRemainingSeconds,
  isActionAllowed,
  formatThrottleMessage,
  type ThrottleResult,
} from "@/lib/utils/throttle";

describe("Throttle Utilities", () => {
  describe("calculateThrottleDelay()", () => {
    describe("Action Allowed Cases", () => {
      it("should allow action when delay period has passed", () => {
        // Arrange
        const minDelay = 3000; // 3 seconds
        const lastTime = Date.now() - 4000; // 4 seconds ago

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(true);
        expect(result.remainingSeconds).toBe(0);
        expect(result.timeSinceLastCall).toBeGreaterThanOrEqual(4000);
      });

      it("should allow action at exactly minimum delay", () => {
        // Arrange
        const minDelay = 3000;
        const lastTime = Date.now() - 3000; // Exactly 3 seconds ago

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(true);
        expect(result.remainingSeconds).toBe(0);
      });

      it("should allow action for very old timestamps", () => {
        // Arrange
        const minDelay = 3000;
        const lastTime = Date.now() - 60000; // 1 minute ago

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(true);
        expect(result.timeSinceLastCall).toBeGreaterThanOrEqual(60000);
      });

      it("should allow action when lastTime is 0 (never called)", () => {
        // Arrange
        const minDelay = 3000;
        const lastTime = 0;

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(true);
      });
    });

    describe("Action Blocked Cases", () => {
      it("should block action when delay period has not passed", () => {
        // Arrange
        const minDelay = 3000;
        const lastTime = Date.now() - 2000; // 2 seconds ago

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(false);
        expect(result.remainingSeconds).toBeGreaterThan(0);
        expect(result.timeSinceLastCall).toBeLessThan(minDelay);
      });

      it("should calculate correct remaining seconds (round up)", () => {
        // Arrange
        const minDelay = 3000;
        const lastTime = Date.now() - 1500; // 1.5 seconds ago

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(false);
        expect(result.remainingSeconds).toBe(2); // ceil(1.5) = 2
      });

      it("should block action just 1ms before delay expires", () => {
        // Arrange
        const minDelay = 3000;
        const lastTime = Date.now() - 2999; // 2999ms ago

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(false);
        expect(result.remainingSeconds).toBe(1);
      });
    });

    describe("Edge Cases and Boundary Conditions", () => {
      it("should handle very short delays (100ms)", () => {
        // Arrange
        const minDelay = 100;
        const lastTime = Date.now() - 50; // 50ms ago

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(false);
        expect(result.remainingSeconds).toBe(1); // ceil(50/1000) = 1
      });

      it("should handle very long delays (1 hour)", () => {
        // Arrange
        const minDelay = 3600000; // 1 hour
        const lastTime = Date.now() - 1800000; // 30 minutes ago

        // Act
        const result = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result.isAllowed).toBe(false);
        expect(result.remainingSeconds).toBeGreaterThan(1700); // ~1800s remaining
      });

      it("should return correct structure with all fields", () => {
        // Arrange
        const minDelay = 3000;
        const lastTime = Date.now() - 1000;

        // Act
        const result: ThrottleResult = calculateThrottleDelay(lastTime, minDelay);

        // Assert
        expect(result).toHaveProperty("isAllowed");
        expect(result).toHaveProperty("remainingSeconds");
        expect(result).toHaveProperty("timeSinceLastCall");
        expect(typeof result.isAllowed).toBe("boolean");
        expect(typeof result.remainingSeconds).toBe("number");
        expect(typeof result.timeSinceLastCall).toBe("number");
      });
    });
  });

  describe("getRemainingSeconds()", () => {
    it("should return 0 when action is allowed", () => {
      // Arrange
      const minDelay = 3000;
      const lastTime = Date.now() - 4000;

      // Act
      const remaining = getRemainingSeconds(lastTime, minDelay);

      // Assert
      expect(remaining).toBe(0);
    });

    it("should return correct seconds when action is blocked", () => {
      // Arrange
      const minDelay = 3000;
      const lastTime = Date.now() - 1500; // 1.5s ago

      // Act
      const remaining = getRemainingSeconds(lastTime, minDelay);

      // Assert
      expect(remaining).toBe(2); // ceil(1.5) = 2
    });

    it("should return positive integer for remaining time", () => {
      // Arrange
      const minDelay = 5000;
      const lastTime = Date.now() - 2750; // 2.75s ago

      // Act
      const remaining = getRemainingSeconds(lastTime, minDelay);

      // Assert
      expect(remaining).toBeGreaterThan(0);
      expect(Number.isInteger(remaining)).toBe(true);
    });
  });

  describe("isActionAllowed()", () => {
    it("should return true when delay has passed", () => {
      // Arrange
      const minDelay = 3000;
      const lastTime = Date.now() - 4000;

      // Act
      const allowed = isActionAllowed(lastTime, minDelay);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should return false when delay has not passed", () => {
      // Arrange
      const minDelay = 3000;
      const lastTime = Date.now() - 2000;

      // Act
      const allowed = isActionAllowed(lastTime, minDelay);

      // Assert
      expect(allowed).toBe(false);
    });

    it("should return boolean type always", () => {
      // Arrange
      const testCases = [
        { lastTime: Date.now() - 1000, minDelay: 3000 },
        { lastTime: Date.now() - 5000, minDelay: 3000 },
        { lastTime: 0, minDelay: 3000 },
      ];

      // Act & Assert
      testCases.forEach(({ lastTime, minDelay }) => {
        const result = isActionAllowed(lastTime, minDelay);
        expect(typeof result).toBe("boolean");
      });
    });
  });

  describe("formatThrottleMessage()", () => {
    it("should format message with seconds placeholder", () => {
      // Arrange
      const remainingSeconds = 3;
      const template = "Poczekaj jeszcze {seconds}s przed kolejnym wyjaśnieniem";

      // Act
      const message = formatThrottleMessage(remainingSeconds, template);

      // Assert
      expect(message).toBe("Poczekaj jeszcze 3s przed kolejnym wyjaśnieniem");
      expect(message).not.toContain("{seconds}");
    });

    it("should use default Polish message when no template provided", () => {
      // Arrange
      const remainingSeconds = 5;

      // Act
      const message = formatThrottleMessage(remainingSeconds);

      // Assert
      expect(message).toContain("5");
      expect(message).toContain("Poczekaj");
      expect(message).not.toContain("{seconds}");
    });

    it("should handle single second correctly", () => {
      // Arrange
      const remainingSeconds = 1;
      const template = "Wait {seconds} second";

      // Act
      const message = formatThrottleMessage(remainingSeconds, template);

      // Assert
      expect(message).toBe("Wait 1 second");
    });

    it("should handle large numbers", () => {
      // Arrange
      const remainingSeconds = 3600; // 1 hour
      const template = "{seconds} seconds remaining";

      // Act
      const message = formatThrottleMessage(remainingSeconds, template);

      // Assert
      expect(message).toBe("3600 seconds remaining");
    });

    it("should handle zero seconds", () => {
      // Arrange
      const remainingSeconds = 0;
      const template = "Ready in {seconds}s";

      // Act
      const message = formatThrottleMessage(remainingSeconds, template);

      // Assert
      expect(message).toBe("Ready in 0s");
    });
  });

  describe("Real-World Scenario: Explain Button Throttling", () => {
    it("should simulate typical explain button throttling (3s delay)", () => {
      // Arrange - Simulate user clicking explain button twice
      const EXPLAIN_DELAY = 3000; // 3 seconds
      let lastExplainTime = Date.now();

      // Act 1 - First click (should be allowed)
      const firstClick = calculateThrottleDelay(0, EXPLAIN_DELAY);

      // Simulate 2 seconds passing
      lastExplainTime = Date.now();
      const secondClickTime = lastExplainTime + 2000;

      // Mock Date.now for second click
      const originalNow = Date.now;
      Date.now = () => secondClickTime;

      // Act 2 - Second click after 2s (should be blocked)
      const secondClick = calculateThrottleDelay(lastExplainTime, EXPLAIN_DELAY);

      // Restore Date.now
      Date.now = originalNow;

      // Assert
      expect(firstClick.isAllowed).toBe(true);
      expect(secondClick.isAllowed).toBe(false);
      expect(secondClick.remainingSeconds).toBe(1); // ceil(1s remaining)
    });

    it("should provide user feedback for throttled requests", () => {
      // Arrange
      const minDelay = 3000;
      const lastTime = Date.now() - 1750; // 1.75s ago

      // Act
      const result = calculateThrottleDelay(lastTime, minDelay);
      const userMessage = formatThrottleMessage(
        result.remainingSeconds,
        "Poczekaj jeszcze {seconds}s przed kolejnym wyjaśnieniem"
      );

      // Assert
      expect(result.isAllowed).toBe(false);
      expect(userMessage).toBe("Poczekaj jeszcze 2s przed kolejnym wyjaśnieniem");
    });
  });
});
