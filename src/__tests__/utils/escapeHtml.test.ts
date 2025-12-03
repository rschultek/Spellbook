/**
 * Unit Tests for escapeHtml() function
 *
 * Business Rules:
 * - Must escape all HTML special characters to prevent XSS attacks
 * - Must preserve safe text without modification
 * - Must handle edge cases (empty strings, multiple characters, etc.)
 *
 * Critical for: Security (XSS prevention)
 */

import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/lib/utils/html";

describe("escapeHtml()", () => {
  describe("XSS Prevention - Critical Security Tests", () => {
    it("should escape script tag to prevent XSS", () => {
      // Arrange
      const maliciousCode = '<script>alert("XSS")</script>';

      // Act
      const result = escapeHtml(maliciousCode);

      // Assert
      expect(result).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;");
      expect(result).not.toContain("<script>");
    });

    it("should escape img tag with onerror XSS vector", () => {
      // Arrange
      const xssVector = '<img src="x" onerror="alert(\'XSS\')">';

      // Act
      const result = escapeHtml(xssVector);

      // Assert
      expect(result).toBe("&lt;img src=&quot;x&quot; onerror=&quot;alert(&#039;XSS&#039;)&quot;&gt;");
      expect(result).not.toContain("<img");
    });

    it("should escape iframe injection attempt", () => {
      // Arrange
      const iframe = '<iframe src="javascript:alert(1)"></iframe>';

      // Act
      const result = escapeHtml(iframe);

      // Assert
      expect(result).toBe("&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;&lt;/iframe&gt;");
    });

    it("should escape event handler attributes", () => {
      // Arrange
      const eventHandler = '<div onclick="alert(1)">Click me</div>';

      // Act
      const result = escapeHtml(eventHandler);

      // Assert
      expect(result).toBe("&lt;div onclick=&quot;alert(1)&quot;&gt;Click me&lt;/div&gt;");
    });
  });

  describe("Individual Character Escaping", () => {
    it("should escape ampersand (&)", () => {
      // Arrange
      const text = "A & B";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("A &amp; B");
    });

    it("should escape less-than (<)", () => {
      // Arrange
      const text = "5 < 10";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("5 &lt; 10");
    });

    it("should escape greater-than (>)", () => {
      // Arrange
      const text = "10 > 5";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("10 &gt; 5");
    });

    it('should escape double quotes (")', () => {
      // Arrange
      const text = 'He said "hello"';

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("He said &quot;hello&quot;");
    });

    it("should escape single quotes (')", () => {
      // Arrange
      const text = "It's working";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("It&#039;s working");
    });
  });

  describe("Multiple Character Combinations", () => {
    it("should escape all special characters in one string", () => {
      // Arrange
      const text = "& < > \" '";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("&amp; &lt; &gt; &quot; &#039;");
    });

    it("should escape multiple ampersands correctly", () => {
      // Arrange
      const text = "A & B & C";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("A &amp; B &amp; C");
    });

    it("should escape nested HTML-like structures", () => {
      // Arrange
      const text = '<div class="test"><p>Content</p></div>';

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("&lt;div class=&quot;test&quot;&gt;&lt;p&gt;Content&lt;/p&gt;&lt;/div&gt;");
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle empty string", () => {
      // Arrange
      const text = "";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("");
    });

    it("should not modify safe text without special characters", () => {
      // Arrange
      const safeText = "Hello World 123";

      // Act
      const result = escapeHtml(safeText);

      // Assert
      expect(result).toBe("Hello World 123");
    });

    it("should handle text with only special characters", () => {
      // Arrange
      const text = "<>&\"'";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("&lt;&gt;&amp;&quot;&#039;");
    });

    it("should handle very long strings with special characters", () => {
      // Arrange
      const longText = "<script>".repeat(1000);

      // Act
      const result = escapeHtml(longText);

      // Assert
      expect(result).toBe("&lt;script&gt;".repeat(1000));
      expect(result.length).toBeGreaterThan(longText.length);
    });

    it("should handle unicode characters mixed with HTML", () => {
      // Arrange
      const text = '<div>Hello 世界 "test"</div>';

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("&lt;div&gt;Hello 世界 &quot;test&quot;&lt;/div&gt;");
      expect(result).toContain("世界"); // Unicode preserved
    });

    it("should handle newlines and whitespace with HTML", () => {
      // Arrange
      const text = "<p>\n  Content & more\n</p>";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("&lt;p&gt;\n  Content &amp; more\n&lt;/p&gt;");
    });
  });

  describe("Real-World Code Snippet Scenarios", () => {
    it("should escape JavaScript code with comparisons", () => {
      // Arrange
      const jsCode = 'if (x < 10 && y > 5) { alert("test"); }';

      // Act
      const result = escapeHtml(jsCode);

      // Assert
      expect(result).toBe("if (x &lt; 10 &amp;&amp; y &gt; 5) { alert(&quot;test&quot;); }");
    });

    it("should escape HTML code snippet", () => {
      // Arrange
      const htmlCode = '<button onclick="handleClick()">Click</button>';

      // Act
      const result = escapeHtml(htmlCode);

      // Assert
      expect(result).toBe("&lt;button onclick=&quot;handleClick()&quot;&gt;Click&lt;/button&gt;");
    });

    it("should escape PHP code with tags", () => {
      // Arrange
      const phpCode = '<?php echo "Hello"; ?>';

      // Act
      const result = escapeHtml(phpCode);

      // Assert
      expect(result).toBe("&lt;?php echo &quot;Hello&quot;; ?&gt;");
    });

    it("should escape SQL query with comparison operators", () => {
      // Arrange
      const sqlCode = 'SELECT * FROM users WHERE age > 18 AND status = "active"';

      // Act
      const result = escapeHtml(sqlCode);

      // Assert
      expect(result).toBe("SELECT * FROM users WHERE age &gt; 18 AND status = &quot;active&quot;");
    });
  });

  describe("Order of Escaping (Ampersand First)", () => {
    it("should not double-escape ampersands", () => {
      // Arrange
      const text = "&";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("&amp;");
      expect(result).not.toBe("&amp;amp;"); // Should not double-escape
    });

    it("should handle pre-escaped HTML entities correctly", () => {
      // Arrange - someone might pass already escaped text
      const text = "&lt;div&gt;";

      // Act
      const result = escapeHtml(text);

      // Assert
      // This WILL double-escape, which is expected behavior
      expect(result).toBe("&amp;lt;div&amp;gt;");
    });
  });

  describe("Type Safety and Error Handling", () => {
    it("should handle string with numbers", () => {
      // Arrange
      const text = "123 < 456";

      // Act
      const result = escapeHtml(text);

      // Assert
      expect(result).toBe("123 &lt; 456");
      expect(typeof result).toBe("string");
    });

    it("should return string type always", () => {
      // Arrange
      const inputs = ["<test>", "safe text", "", "&"];

      // Act & Assert
      inputs.forEach((input) => {
        const result = escapeHtml(input);
        expect(typeof result).toBe("string");
      });
    });
  });
});
