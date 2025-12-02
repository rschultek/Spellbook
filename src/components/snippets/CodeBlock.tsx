import { useState, useEffect, useRef } from "react";
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
  
  // Explain feature state
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string>("");
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const lastExplainTime = useRef<number>(0);

  // Check if this is code (not a note)
  const isCode = language !== "Note";

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

  const explainCode = async () => {
    // Throttling: 3 sekundy między requestami (zmniejszone)
    const now = Date.now();
    const timeSinceLastExplain = now - lastExplainTime.current;
    const minDelay = 3000; // 3 sekundy (było 6s)

    if (timeSinceLastExplain < minDelay) {
      const remainingSeconds = Math.ceil((minDelay - timeSinceLastExplain) / 1000);
      toast.error(`Poczekaj jeszcze ${remainingSeconds}s przed kolejnym wyjaśnieniem`);
      return;
    }

    lastExplainTime.current = now;
    setIsExplaining(true);
    setExplanation("");

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się wygenerować wyjaśnienia");
      }

      setExplanation(data.explanation);
      setShowExplanationModal(true);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button onClick={copyToClipboard} variant="secondary" size="sm">
          📋 Copy
        </Button>
        
        {isCode && (
          <Button 
            onClick={explainCode} 
            variant="secondary" 
            size="sm"
            disabled={isExplaining}
          >
            {isExplaining ? "⏳ Loading..." : "💡 Explain"}
          </Button>
        )}
      </div>

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

      {/* Explanation Modal */}
      {showExplanationModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowExplanationModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold">💡 Code Explanation</h2>
              <button 
                onClick={() => setShowExplanationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowExplanationModal(false)}>
                Zamknij
              </Button>
            </div>
          </div>
        </div>
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
