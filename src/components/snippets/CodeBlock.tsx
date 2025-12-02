import { useState, useEffect } from "react";
import { codeToHtml } from "shiki";
import { Button } from "../ui/button";
import { toast } from "../../lib/utils/toast";
import type { SnippetLanguage } from "../../types";

interface CodeBlockProps {
  code: string;
  language: SnippetLanguage;
  showLineNumbers?: boolean;
}

// Map Spellbook languages to Shiki language identifiers
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

export default function CodeBlock({ code, language, showLineNumbers = true }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlight = async () => {
      try {
        setIsLoading(true);
        const shikiLang = LANGUAGE_MAP[language] || "text";

        const highlighted = await codeToHtml(code, {
          lang: shikiLang,
          theme: "github-dark",
          transformers: showLineNumbers
            ? [
                {
                  line(node, line) {
                    node.properties["data-line"] = line;
                  },
                },
              ]
            : [],
        });

        setHtml(highlighted);
      } catch {
        // Fallback to plain text if highlighting fails
        setHtml(`<pre><code>${escapeHtml(code)}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    highlight();
  }, [code, language, showLineNumbers]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="relative">
      <Button onClick={copyToClipboard} className="absolute top-4 right-4 z-10" variant="secondary" size="sm">
        📋 Copy
      </Button>

      {isLoading ? (
        <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      ) : (
        <div
          className={`shiki-wrapper rounded-lg overflow-x-auto ${showLineNumbers ? "with-line-numbers" : ""}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      <style>{`
        .shiki-wrapper pre {
          margin: 0;
          padding: 1.5rem;
          border-radius: 0.5rem;
        }

        .shiki-wrapper code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          counter-reset: line;
          display: grid; /* Fixes double spacing by ignoring whitespace between lines */
        }

        .shiki-wrapper.with-line-numbers code .line::before {
          counter-increment: line;
          content: counter(line);
          display: inline-block;
          width: 2.5rem;
          margin-right: 1.5rem;
          text-align: right;
          color: #6b7280;
          user-select: none;
        }

        .shiki-wrapper .line {
          display: block;
          min-height: 1rem;
        }
      `}</style>
    </div>
  );
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
