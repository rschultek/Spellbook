import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import type { ChatRequest } from "@/types";
import { ChatRequestSchema } from "@/lib/validation/openrouter.schemas";

/**
 * POST /api/chat
 * Endpoint for OpenRouter AI chat completions
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

    // Waliduj request z Zod
    const validatedRequest = ChatRequestSchema.parse(body) as ChatRequest;

    // Inicjalizuj service
    const openRouterService = new OpenRouterService(apiKey, {
      defaultModel: "x-ai/grok-4.1-fast:free",
      timeout: 60000,
    });

    // Wyślij chat request
    const response = await openRouterService.chat(validatedRequest);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; name?: string; issues?: unknown[] };

    // Obsługa błędów walidacji Zod
    if (err.name === "ZodError") {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: err.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: err.message || "An error occurred",
      }),
      {
        status: err.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
