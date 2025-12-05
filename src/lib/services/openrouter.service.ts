import type {
  OpenRouterServiceOptions,
  ChatRequest,
  ChatResponse,
  OpenRouterPayload,
  OpenRouterResponse,
} from "../../types";

/**
 * OpenRouter Service
 * Handles communication with OpenRouter API for LLM chat completions
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly options: Required<OpenRouterServiceOptions>;

  constructor(apiKey: string, options?: OpenRouterServiceOptions) {
    // Walidacja API key
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API key is required");
    }

    this.apiKey = apiKey;

    // Ustaw wartości domyślne
    this.options = {
      baseUrl: options?.baseUrl || "https://openrouter.ai/api/v1",
      defaultModel: options?.defaultModel || "tngtech/deepseek-r1t2-chimera:free",
      timeout: options?.timeout || 30000,
      retries: options?.retries || 3,
      headers: options?.headers || {},
    };
  }

  /**
   * Send chat request to OpenRouter
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Waliduj request
    this.validateRequest(request);

    // Przekształć na format OpenRouter
    const payload = this.transformRequest(request);

    // Wyślij z retry logic
    const response = await this.retryRequest(() => this.sendRequest(payload));

    // Przekształć odpowiedź
    return this.transformResponse(response, !!request.responseFormat);
  }

  /**
   * Validate chat request
   */
  validateRequest(request: ChatRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error("Messages array cannot be empty");
    }

    const hasUserMessage = request.messages.some((msg) => msg.role === "user");
    if (!hasUserMessage) {
      throw new Error("At least one user message is required");
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new Error("Temperature must be between 0.0 and 2.0");
      }
    }

    if (request.topP !== undefined) {
      if (request.topP < 0 || request.topP > 1) {
        throw new Error("Top P must be between 0.0 and 1.0");
      }
    }
  }

  /**
   * Get list of available models
   */
  get models(): readonly string[] {
    return [
      "tngtech/deepseek-r1t2-chimera:free",
      "openai/gpt-4-turbo",
      "openai/gpt-4",
      "openai/gpt-3.5-turbo",
      "anthropic/claude-3-opus",
      "anthropic/claude-3-sonnet",
      "anthropic/claude-3-haiku",
      "google/gemini-pro",
      "meta-llama/llama-3-70b",
      "meta-llama/llama-3.2-3b-instruct:free",
    ];
  }

  /**
   * Send HTTP request to OpenRouter API
   */
  private async sendRequest(payload: OpenRouterPayload): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const response = await fetch(`${this.options.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.options.headers["HTTP-Referer"] || "https://spellbook.local",
          "X-Title": this.options.headers["X-Title"] || "Spellbook MVP",
          ...this.options.headers,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        throw {
          status: response.status,
          message: errorData.error?.message || response.statusText,
        };
      }

      return await response.json();
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      const err = error as { name?: string; status?: number; code?: string };
      if (err.name === "AbortError") {
        throw { code: "timeout", message: "Request timeout" };
      }

      if (!err.status) {
        throw { code: "network", message: "Network error" };
      }

      throw err;
    }
  }

  /**
   * Transform ChatRequest to OpenRouter payload
   */
  private transformRequest(request: ChatRequest): OpenRouterPayload {
    const payload: OpenRouterPayload = {
      model: request.model || this.options.defaultModel,
      messages: request.messages,
    };

    // Dodaj opcjonalne parametry
    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens;
    if (request.topP !== undefined) payload.top_p = request.topP;
    if (request.frequencyPenalty !== undefined) payload.frequency_penalty = request.frequencyPenalty;
    if (request.presencePenalty !== undefined) payload.presence_penalty = request.presencePenalty;
    if (request.stop !== undefined) payload.stop = request.stop;

    // Dodaj response_format jeśli podano
    if (request.responseFormat) {
      payload.response_format = {
        type: "json_schema",
        json_schema: {
          name: request.responseFormat.json_schema.name,
          strict: true,
          schema: request.responseFormat.json_schema.schema,
        },
      };
    }

    return payload;
  }

  /**
   * Clean reasoning output from chain-of-thought models (e.g., DeepSeek R1)
   * Removes <think>...</think> blocks that contain the model's reasoning process
   */
  private cleanReasoningOutput(content: string): string {
    // Remove complete <think>...</think> blocks
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "");

    // Remove unclosed <think> block at the start (when model didn't finish reasoning)
    cleaned = cleaned.replace(/^<think>[\s\S]*$/gi, "");

    // Remove any remaining <think> or </think> tags
    cleaned = cleaned.replace(/<\/?think>/gi, "");

    return cleaned.trim();
  }

  /**
   * Transform OpenRouter response to ChatResponse
   */
  private transformResponse(response: OpenRouterResponse, hasResponseFormat: boolean): ChatResponse {
    const choice = response.choices[0];
    const rawContent = choice.message.content;

    // Clean reasoning output for chain-of-thought models
    const content = this.cleanReasoningOutput(rawContent);

    return {
      id: response.id,
      model: response.model,
      content,
      structuredData: hasResponseFormat ? JSON.parse(rawContent) : undefined,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Map errors to user-friendly messages
   */
  private mapError(error: { status?: number; code?: string; message?: string }): Error {
    const errorMessages: Record<string, string> = {
      "401": "Invalid API key. Please check your OpenRouter credentials.",
      "429": "Rate limit exceeded. Please try again later.",
      "400": "Invalid request. Please check your input parameters.",
      "500": "OpenRouter service is temporarily unavailable.",
      "503": "OpenRouter service is temporarily unavailable.",
      timeout: "Request timeout. The AI model took too long to respond.",
      network: "Network error. Please check your internet connection.",
    };

    const statusCode = error.status?.toString();
    const message =
      errorMessages[statusCode || ""] ||
      errorMessages[error.code || ""] ||
      `AI service error: ${error.message || "Unknown error"}`;

    return new Error(message);
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(fn: () => Promise<T>, retries: number = this.options.retries): Promise<T> {
    let lastError: { status?: number; code?: string; message?: string } | undefined;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const err = error as { status?: number; code?: string };
        lastError = err;

        // Nie retry dla błędów 4xx (poza 429)
        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
          throw this.mapError(err);
        }

        // Czekaj przed następną próbą (exponential backoff)
        if (i < retries) {
          const delay = Math.min(1000 * Math.pow(2, i), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw this.mapError(lastError ?? { message: "Unknown error" });
  }
}
