import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";

/**
 * POST /api/explain
 * Endpoint for explaining code snippets using AI
 */
export const POST: APIRoute = async ({ request }) => {
  // Sprawdź czy API key jest ustawiony
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "OpenRouter API key not configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const { code, language } = body;

    // Walidacja
    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({
          error: "Code is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Inicjalizuj service
    const openRouterService = new OpenRouterService(apiKey, {
      defaultModel: "x-ai/grok-4.1-fast:free",
      timeout: 15000, // 15s timeout (skrócone)
    });

    // Przygotuj prompt zoptymalizowany dla KRÓTKIEJ odpowiedzi
    const userMessage =
      language && language !== "Other" && language !== "Note"
        ? `Wytłumacz w 1-2 zdaniach po polsku co robi ten kod ${language}:\n\n${code}`
        : `Wytłumacz w 1-2 zdaniach po polsku co robi ten kod:\n\n${code}`;

    // Wyślij request do AI
    const response = await openRouterService.chat({
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
      maxTokens: 80, // Jeszcze krótsze wyjaśnienie = szybsze
      temperature: 0.5, // Niższa temperatura = bardziej deterministyczne i szybsze
    });

    return new Response(
      JSON.stringify({
        explanation: response.content,
        tokensUsed: response.usage.totalTokens,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };

    // Sprawdź czy to rate limit
    const isRateLimit = err.message?.includes("Rate limit");

    return new Response(
      JSON.stringify({
        error: isRateLimit
          ? "Za dużo zapytań. Poczekaj chwilę i spróbuj ponownie."
          : "Nie udało się wygenerować wyjaśnienia. Spróbuj ponownie.",
      }),
      {
        status: err.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
