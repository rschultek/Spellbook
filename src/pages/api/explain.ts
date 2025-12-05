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
      defaultModel: "tngtech/deepseek-r1t2-chimera:free",
      timeout: 15000, // 15s timeout (skrócone)
    });

    // Przygotuj prompt zoptymalizowany dla KRÓTKIEJ odpowiedzi
    const langInfo = language && language !== "Other" && language !== "Note" ? ` (${language})` : "";

    const systemMessage = `Jesteś pomocnym asystentem programisty. Odpowiadasz ZAWSZE po polsku, ZAWSZE w maksymalnie 2-3 krótkich zdaniach. Nie używaj formatowania markdown, nie używaj list, nie cytuj kodu. Tylko zwięzły opis tekstowy.`;

    const userMessage = `Co robi ten kod${langInfo}? Odpowiedz w 2-3 zdaniach:\n\n${code}`;

    // Wyślij request do AI
    const response = await openRouterService.chat({
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      maxTokens: 500, // Więcej tokenów dla modeli reasoning (np. DeepSeek R1)
      temperature: 0.3, // Niższa = bardziej zwięzłe i spójne
    });

    // Sprawdź czy odpowiedź jest kompletna
    let explanation = response.content;
    if (response.finishReason === "length" && explanation) {
      // Odpowiedź została ucięta - dodaj wielokropek
      explanation = explanation.trimEnd();
      if (!explanation.endsWith(".") && !explanation.endsWith("!") && !explanation.endsWith("?")) {
        explanation += "...";
      }
    }

    return new Response(
      JSON.stringify({
        explanation,
        tokensUsed: response.usage.totalTokens,
        complete: response.finishReason === "stop",
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
