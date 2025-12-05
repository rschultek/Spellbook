# Przewodnik Implementacji: OpenRouter Service

## 1. Opis Usługi

**OpenRouter Service** to warstwa abstrakcji odpowiedzialna za komunikację z API OpenRouter w celu uzupełnienia czatów opartych na LLM (Large Language Models). Usługa encapsuluje wszystkie operacje związane z wysyłaniem zapytań do modeli AI, obsługą odpowiedzi oraz zarządzaniem błędami.

### Główne Cele

1. **Centralizacja logiki AI** - Pojedyncze miejsce dla wszystkich wywołań OpenRouter API
2. **Abstrakcja złożoności** - Ukrycie szczegółów implementacji przed komponentami UI
3. **Standaryzacja komunikacji** - Jednolity interfejs dla różnych modeli AI
4. **Obsługa błędów** - Spójne mapowanie błędów API na komunikaty user-friendly
5. **Bezpieczeństwo** - Bezpieczne zarządzanie kluczami API i walidacja danych

### Kluczowe Funkcjonalności

- Wysyłanie zapytań do modeli LLM z konfigurowalnymi parametrami
- Obsługa komunikatów systemowych i użytkownika
- Generowanie ustrukturyzowanych odpowiedzi poprzez JSON Schema (response_format)
- Elastyczny wybór modelu i parametrów (temperatura, max_tokens, etc.)
- Mapowanie błędów z OpenRouter API na przyjazne komunikaty
- Validacja requestów przed wysłaniem do API

---

## 2. Opis Konstruktora

### Sygnatura

```typescript
constructor(apiKey: string, options?: OpenRouterServiceOptions)
```

### Parametry

#### `apiKey: string` (wymagany)

- Klucz API OpenRouter używany do autentykacji
- Powinien być przechowywany w zmiennych środowiskowych (`OPENROUTER_API_KEY`)
- Format: string z prefixem `sk-or-v1-...`
- **Bezpieczeństwo**: Nigdy nie hardcodować w kodzie, zawsze używać `.env` lub `.env.local`

#### `options?: OpenRouterServiceOptions` (opcjonalny)

Obiekt konfiguracyjny z następującymi polami:

```typescript
interface OpenRouterServiceOptions {
  baseUrl?: string; // Domyślnie: 'https://openrouter.ai/api/v1'
  defaultModel?: string; // Domyślny model, np. 'tngtech/deepseek-r1t2-chimera:free'
  timeout?: number; // Timeout w ms (domyślnie: 30000)
  retries?: number; // Liczba ponownych prób (domyślnie: 3)
  headers?: Record<string, string>; // Dodatkowe nagłówki HTTP
}
```

### Przykład Użycia

```typescript
// Podstawowa inicjalizacja
const openRouterService = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);

// Z opcjami
const openRouterService = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY, {
  defaultModel: "anthropic/claude-3-sonnet",
  timeout: 60000,
  retries: 5,
  headers: {
    "HTTP-Referer": "https://spellbook.example.com",
    "X-Title": "Spellbook MVP",
  },
});
```

### Walidacja w Konstruktorze

1. **Sprawdzenie apiKey**:
   - Rzuć błąd jeśli `apiKey` jest pusty lub undefined
   - Opcjonalnie: sprawdź format klucza (czy zaczyna się od `sk-or-v1-`)

2. **Walidacja options**:
   - Ustaw wartości domyślne dla brakujących opcji
   - Sprawdź czy `timeout` > 0
   - Sprawdź czy `retries` >= 0

3. **Inicjalizacja HTTP client**:
   - Skonfiguruj instancję fetch z baseUrl i nagłówkami
   - Ustaw timeout handler

---

## 3. Publiczne Metody i Pola

### Metoda `chat()`

Główna metoda do wysyłania zapytań do modeli AI.

#### Sygnatura

```typescript
async chat(request: ChatRequest): Promise<ChatResponse>
```

#### Typ `ChatRequest`

```typescript
interface ChatRequest {
  messages: ChatMessage[]; // Tablica komunikatów (system + user)
  model?: string; // Nazwa modelu (jeśli nie podano, użyj defaultModel)
  responseFormat?: ResponseFormat; // JSON Schema dla structured output
  temperature?: number; // 0.0-2.0, domyślnie 1.0
  maxTokens?: number; // Max tokenów w odpowiedzi
  topP?: number; // 0.0-1.0, nucleus sampling
  frequencyPenalty?: number; // -2.0 do 2.0
  presencePenalty?: number; // -2.0 do 2.0
  stop?: string[]; // Sekwencje stop
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string; // Nazwa schematu (snake_case)
    strict: boolean; // Zawsze true dla OpenRouter
    schema: JsonSchema; // JSON Schema object
  };
}

// Przykładowy JsonSchema
interface JsonSchema {
  type: "object";
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}
```

#### Zwracany Typ `ChatResponse`

```typescript
interface ChatResponse {
  id: string; // ID odpowiedzi z OpenRouter
  model: string; // Użyty model
  content: string; // Treść odpowiedzi
  structuredData?: unknown; // Sparsowane dane JSON (jeśli response_format)
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "content_filter" | "error";
}
```

#### Przykłady Użycia

**Przykład 1: Prosty chat bez struktury**

```typescript
const response = await openRouterService.chat({
  messages: [
    {
      role: "system",
      content: "You are a helpful coding assistant specialized in TypeScript.",
    },
    {
      role: "user",
      content: "Explain what is async/await in TypeScript",
    },
  ],
  model: "tngtech/deepseek-r1t2-chimera:free",
  temperature: 0.7,
  maxTokens: 500,
});

console.log(response.content);
```

**Przykład 2: Structured output z response_format**

```typescript
const response = await openRouterService.chat({
  messages: [
    {
      role: "system",
      content: "You are a code snippet analyzer. Analyze the given code snippet and extract metadata.",
    },
    {
      role: "user",
      content: "const sum = (a, b) => a + b;",
    },
  ],
  model: "openai/gpt-4-turbo",
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "snippet_metadata",
      strict: true,
      schema: {
        type: "object",
        properties: {
          language: {
            type: "string",
            enum: ["javascript", "typescript", "python", "go", "rust", "other"],
          },
          description: {
            type: "string",
            description: "Brief description of what the code does",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Relevant tags for the snippet",
          },
          complexity: {
            type: "string",
            enum: ["simple", "medium", "complex"],
          },
        },
        required: ["language", "description", "tags", "complexity"],
        additionalProperties: false,
      },
    },
  },
});

// Dostęp do structured data
const metadata = response.structuredData as {
  language: string;
  description: string;
  tags: string[];
  complexity: string;
};

console.log(metadata.language); // 'javascript'
console.log(metadata.tags); // ['function', 'arrow', 'math']
```

**Przykład 3: Wykrywanie języka kodu**

```typescript
const response = await openRouterService.chat({
  messages: [
    {
      role: "system",
      content: "You are a code language detector. Analyze code and identify its programming language.",
    },
    {
      role: "user",
      content: `
        def fibonacci(n):
            if n <= 1:
                return n
            return fibonacci(n-1) + fibonacci(n-2)
      `,
    },
  ],
  model: "openai/gpt-4-turbo",
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "language_detection",
      strict: true,
      schema: {
        type: "object",
        properties: {
          language: { type: "string" },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
          version: { type: "string" },
        },
        required: ["language", "confidence"],
        additionalProperties: false,
      },
    },
  },
});
```

### Metoda `validateRequest()`

Waliduje request przed wysłaniem do API.

#### Sygnatura

```typescript
validateRequest(request: ChatRequest): void
```

#### Rzuca Błędy

- `Error: Messages array cannot be empty`
- `Error: At least one user message is required`
- `Error: Invalid temperature value (must be 0.0-2.0)`
- `Error: Invalid model name`

#### Przykład

```typescript
try {
  openRouterService.validateRequest(request);
  // Jeśli nie rzuciło błędu, request jest poprawny
} catch (error) {
  console.error("Invalid request:", error.message);
}
```

### Pole `models` (getter)

Zwraca listę dostępnych modeli.

```typescript
get models(): readonly string[]
```

#### Przykład

```typescript
const availableModels = openRouterService.models;
console.log(availableModels);
// ['openai/gpt-4-turbo', 'anthropic/claude-3-sonnet', ...]
```

---

## 4. Prywatne Metody i Pola

### Pole `private apiKey: string`

Klucz API przechowywany prywatnie.

### Pole `private options: Required<OpenRouterServiceOptions>`

Opcje konfiguracyjne z ustawionymi wartościami domyślnymi.

### Pole `private rateLimitRemaining: number`

Śledzi pozostałe zapytania (opcjonalnie, jeśli OpenRouter zwraca rate limit headers).

### Metoda `private async sendRequest()`

Wysyła HTTP request do OpenRouter API.

#### Sygnatura

```typescript
private async sendRequest(
  payload: OpenRouterPayload
): Promise<OpenRouterResponse>
```

#### Implementacja

1. Dodaj nagłówki:
   - `Authorization: Bearer ${apiKey}`
   - `Content-Type: application/json`
   - `HTTP-Referer` i `X-Title` (z options lub domyślne)

2. Wyślij POST request do `/chat/completions`

3. Obsłuż timeout (użyj AbortController)

4. Sprawdź status HTTP:
   - 200-299: sukces
   - 400-499: błąd klienta (walidacja, auth, rate limit)
   - 500-599: błąd serwera

5. Zwróć sparsowaną odpowiedź JSON

### Metoda `private transformRequest()`

Przekształca `ChatRequest` na format wymagany przez OpenRouter API.

#### Sygnatura

```typescript
private transformRequest(request: ChatRequest): OpenRouterPayload
```

#### Implementacja

```typescript
private transformRequest(request: ChatRequest): OpenRouterPayload {
  const payload: OpenRouterPayload = {
    model: request.model || this.options.defaultModel,
    messages: request.messages,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    top_p: request.topP,
    frequency_penalty: request.frequencyPenalty,
    presence_penalty: request.presencePenalty,
    stop: request.stop,
  };

  // Dodaj response_format jeśli podano
  if (request.responseFormat) {
    payload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: request.responseFormat.json_schema.name,
        strict: true,
        schema: request.responseFormat.json_schema.schema
      }
    };
  }

  // Usuń undefined values
  return Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== undefined)
  );
}
```

### Metoda `private transformResponse()`

Przekształca odpowiedź OpenRouter na `ChatResponse`.

#### Sygnatura

```typescript
private transformResponse(
  response: OpenRouterResponse,
  hasResponseFormat: boolean
): ChatResponse
```

#### Implementacja

```typescript
private transformResponse(
  response: OpenRouterResponse,
  hasResponseFormat: boolean
): ChatResponse {
  const choice = response.choices[0];
  const content = choice.message.content;

  return {
    id: response.id,
    model: response.model,
    content: content,
    structuredData: hasResponseFormat ? JSON.parse(content) : undefined,
    usage: {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens
    },
    finishReason: choice.finish_reason
  };
}
```

### Metoda `private mapError()`

Mapuje błędy API na user-friendly komunikaty (wzorowane na `auth.service.ts`).

#### Sygnatura

```typescript
private mapError(error: any): Error
```

#### Implementacja

```typescript
private mapError(error: any): Error {
  const errorMessages: Record<string, string> = {
    '401': 'Invalid API key. Please check your OpenRouter credentials.',
    '429': 'Rate limit exceeded. Please try again later.',
    '400': 'Invalid request. Please check your input parameters.',
    '500': 'OpenRouter service is temporarily unavailable.',
    '503': 'OpenRouter service is temporarily unavailable.',
    'timeout': 'Request timeout. The AI model took too long to respond.',
    'network': 'Network error. Please check your internet connection.',
  };

  const statusCode = error.status?.toString();
  const message =
    errorMessages[statusCode] ||
    errorMessages[error.code] ||
    `AI service error: ${error.message}`;

  return new Error(message);
}
```

### Metoda `private async retryRequest()`

Implementuje logikę retry z exponential backoff.

#### Sygnatura

```typescript
private async retryRequest<T>(
  fn: () => Promise<T>,
  retries: number = this.options.retries
): Promise<T>
```

#### Implementacja

```typescript
private async retryRequest<T>(
  fn: () => Promise<T>,
  retries: number = this.options.retries
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Nie retry dla błędów 4xx (poza 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw this.mapError(error);
      }

      // Czekaj przed następną próbą (exponential backoff)
      if (i < retries) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw this.mapError(lastError);
}
```

---

## 5. Obsługa Błędów

### Kategorie Błędów

#### 1. Błędy Walidacji (4xx)

**Scenariusz 1: Pusty klucz API**

```typescript
Error: API key is required
```

**Rozwiązanie**: Sprawdź plik `.env.local` i ustaw `OPENROUTER_API_KEY`

**Scenariusz 2: Nieprawidłowe parametry**

```typescript
Error: Temperature must be between 0.0 and 2.0
```

**Rozwiązanie**: Waliduj dane przed wysłaniem

**Scenariusz 3: Błędny JSON Schema**

```typescript
Error: Invalid JSON Schema: missing required property 'type'
```

**Rozwiązanie**: Sprawdź strukturę schema zgodnie z JSON Schema Draft 2020-12

#### 2. Błędy Autentykacji (401)

**Scenariusz 1: Nieprawidłowy klucz API**

```typescript
Error: Invalid API key. Please check your OpenRouter credentials.
```

**Rozwiązanie**: Zweryfikuj klucz na https://openrouter.ai/keys

#### 3. Błędy Rate Limiting (429)

**Scenariusz 1: Przekroczono limit zapytań**

```typescript
Error: Rate limit exceeded. Please try again later.
```

**Rozwiązanie**: Implementuj exponential backoff (już w `retryRequest()`)

**Opcjonalne rozszerzenie**: Śledź `X-RateLimit-Remaining` header

#### 4. Błędy Serwera (5xx)

**Scenariusz 1: Internal Server Error**

```typescript
Error: OpenRouter service is temporarily unavailable.
```

**Rozwiązanie**: Użyj retry mechanism (domyślnie 3 próby)

#### 5. Błędy Sieciowe

**Scenariusz 1: Timeout**

```typescript
Error: Request timeout. The AI model took too long to respond.
```

**Rozwiązanie**: Zwiększ `timeout` w options lub użyj szybszego modelu

**Scenariusz 2: Brak połączenia**

```typescript
Error: Network error. Please check your internet connection.
```

### Strategia Obsługi Błędów

1. **Logging**:
   - Zawsze loguj pełne błędy w konsoli dla debugowania
   - Zwróć uproszczone komunikaty do UI

2. **User Feedback**:
   - Używaj toastów/notifications do wyświetlania błędów
   - Sugeruj konkretne akcje (np. "Sprawdź połączenie internetowe")

3. **Graceful Degradation**:
   - Jeśli AI nie odpowiada, nie blokuj całej aplikacji
   - Pokaż placeholder lub cached content

4. **Przykład użycia w komponencie**:

```typescript
try {
  const response = await openRouterService.chat(request);
  // Success handling
} catch (error) {
  if (error.message.includes("Rate limit")) {
    showToast("Too many requests. Please wait a moment.", "warning");
  } else if (error.message.includes("API key")) {
    showToast("Configuration error. Please contact support.", "error");
  } else {
    showToast("AI service temporarily unavailable. Try again later.", "error");
  }

  console.error("[OpenRouterService]", error);
}
```

---

## 6. Kwestie Bezpieczeństwa

### 1. Zarządzanie Kluczem API

**✅ ROBIMY:**

- Przechowuj klucz w zmiennych środowiskowych (`.env.local`)
- Dodaj `.env.local` do `.gitignore`
- Używaj `import.meta.env.OPENROUTER_API_KEY` w Astro
- Krótkoterminowe klucze dla wersji proof-of-concept

**❌ NIE ROBIMY:**

- Nigdy nie commituj kluczy do Git
- Nigdy nie hardcoduj kluczy w kodzie źródłowym
- Nigdy nie wystawiaj kluczy do klienta (browser)

### 2. Server-Side Rendering (SSR)

**KRYTYCZNE**: OpenRouter API **MUSI** być wywoływane tylko po stronie serwera!

#### Dla Astro Pages

```typescript
---
// src/pages/api/chat.ts (API endpoint)
import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openrouter.service';

export const POST: APIRoute = async ({ request }) => {
  const openRouterService = new OpenRouterService(
    import.meta.env.OPENROUTER_API_KEY
  );

  const body = await request.json();

  try {
    const response = await openRouterService.chat(body);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
---
```

#### Dla React Components

React komponenty **NIE MOGĄ** bezpośrednio wywoływać OpenRouterService. Muszą używać API endpoint:

```typescript
// ❌ ŹLE - wywołanie bezpośrednie w komponencie
const MyComponent = () => {
  const handleChat = async () => {
    const service = new OpenRouterService(apiKey); // NIGDY!
    await service.chat(...);
  };
};

// ✅ DOBRZE - wywołanie przez API endpoint
const MyComponent = () => {
  const handleChat = async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatRequest)
    });
    const data = await response.json();
  };
};
```

### 3. Walidacja Input

**ZAWSZE** waliduj dane przed wysłaniem do API:

```typescript
// Użyj Zod schema (zgodnie z projektem)
import { z } from "zod";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1).max(10000),
      })
    )
    .min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
});

// W API endpoint
const validatedRequest = ChatRequestSchema.parse(body);
```

### 4. Rate Limiting (Application-Level)

Rozważ implementację rate limitingu po stronie aplikacji:

```typescript
// Prosty in-memory rate limiter (dla MVP)
class RateLimiter {
  private requests = new Map<string, number[]>();

  canMakeRequest(userId: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Usuń stare requesty poza window
    const recentRequests = userRequests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}
```

### 5. Sanityzacja Output

Jeśli wyświetlasz odpowiedzi AI w HTML, **zawsze** używaj React auto-escaping lub DOMPurify:

```typescript
// ✅ React automatycznie escapuje
<div>{response.content}</div>

// ❌ Jeśli musisz używać dangerouslySetInnerHTML
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(response.content)
}} />
```

### 6. Content Security Policy (CSP)

Upewnij się, że CSP pozwala na połączenia z OpenRouter:

```typescript
// astro.config.mjs
export default defineConfig({
  vite: {
    server: {
      headers: {
        "Content-Security-Policy": "default-src 'self'; connect-src 'self' https://openrouter.ai;",
      },
    },
  },
});
```

---

## 7. Plan Wdrożenia Krok Po Kroku

### Faza 1: Przygotowanie Środowiska (15 min)

#### Krok 1.1: Utwórz konto OpenRouter

1. Zarejestruj się na https://openrouter.ai/
2. Przejdź do https://openrouter.ai/keys
3. Wygeneruj nowy klucz API
4. Skopiuj klucz (zaczyna się od `sk-or-v1-`)

#### Krok 1.2: Skonfiguruj zmienne środowiskowe

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

Sprawdź czy `.env.local` jest w `.gitignore`:

```bash
# .gitignore
.env.local
.env
```

#### Krok 1.3: Zainstaluj zależności (jeśli potrzebne)

Projekt używa natywnego `fetch`, więc **nie potrzeba** dodatkowych pakietów. Ale jeśli chcesz lepsze TypeScript types:

```bash
npm install --save-dev @types/node
```

---

### Faza 2: Implementacja Types (20 min)

#### Krok 2.1: Utwórz plik types

Utwórz plik `src/types/openrouter.types.ts`:

```typescript
// src/types/openrouter.types.ts

/**
 * Configuration options for OpenRouter service
 */
export interface OpenRouterServiceOptions {
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Chat message
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * JSON Schema property definition
 */
export interface SchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  additionalProperties?: boolean;
}

/**
 * JSON Schema definition
 */
export interface JsonSchema {
  type: "object";
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Response format configuration
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
}

/**
 * Chat request to OpenRouter
 */
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  responseFormat?: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

/**
 * Chat response from OpenRouter
 */
export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  structuredData?: unknown;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "content_filter" | "error";
}

/**
 * Internal OpenRouter API payload
 */
export interface OpenRouterPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: JsonSchema;
    };
  };
}

/**
 * Internal OpenRouter API response
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: "stop" | "length" | "content_filter" | "error";
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

#### Krok 2.2: Dodaj typy do głównego index

Zaktualizuj `src/types/index.ts` (jeśli istnieje) lub utwórz nowy:

```typescript
// src/types/index.ts
export * from "./openrouter.types";
// ... inne eksporty
```

---

### Faza 3: Implementacja OpenRouterService (90 min)

#### Krok 3.1: Utwórz plik service

Utwórz `src/lib/services/openrouter.service.ts`:

```typescript
// src/lib/services/openrouter.service.ts
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
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.error?.message || response.statusText,
        };
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw { code: "timeout", message: "Request timeout" };
      }

      if (!error.status) {
        throw { code: "network", message: "Network error" };
      }

      throw error;
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
   * Transform OpenRouter response to ChatResponse
   */
  private transformResponse(response: OpenRouterResponse, hasResponseFormat: boolean): ChatResponse {
    const choice = response.choices[0];
    const content = choice.message.content;

    return {
      id: response.id,
      model: response.model,
      content,
      structuredData: hasResponseFormat ? JSON.parse(content) : undefined,
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
  private mapError(error: any): Error {
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
    const message = errorMessages[statusCode] || errorMessages[error.code] || `AI service error: ${error.message}`;

    console.error("[OpenRouterService] Error:", error);
    return new Error(message);
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(fn: () => Promise<T>, retries: number = this.options.retries): Promise<T> {
    let lastError: any;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Nie retry dla błędów 4xx (poza 429)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw this.mapError(error);
        }

        // Czekaj przed następną próbą (exponential backoff)
        if (i < retries) {
          const delay = Math.min(1000 * Math.pow(2, i), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw this.mapError(lastError);
  }
}
```

---

### Faza 4: Implementacja API Endpoint (30 min)

#### Krok 4.1: Utwórz API endpoint

Utwórz `src/pages/api/chat.ts`:

```typescript
// src/pages/api/chat.ts
import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import type { ChatRequest } from "@/types";

export const POST: APIRoute = async ({ request }) => {
  // Sprawdź czy API key jest ustawiony
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OpenRouter API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    const body: ChatRequest = await request.json();

    // Inicjalizuj service
    const openRouterService = new OpenRouterService(apiKey, {
      defaultModel: "tngtech/deepseek-r1t2-chimera:free",
      timeout: 60000,
    });

    // Wyślij chat request
    const response = await openRouterService.chat(body);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[API /chat] Error:", error);

    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: error.status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

### Faza 5: Walidacja z Zod (20 min)

#### Krok 5.1: Utwórz schema walidacji

Utwórz `src/lib/validation/openrouter.validation.ts`:

```typescript
// src/lib/validation/openrouter.validation.ts
import { z } from "zod";

export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(10000),
});

export const JsonSchemaPropertySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.string(),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    items: JsonSchemaPropertySchema.optional(),
    properties: z.record(JsonSchemaPropertySchema).optional(),
    required: z.array(z.string()).optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    additionalProperties: z.boolean().optional(),
  })
);

export const JsonSchemaSchema = z.object({
  type: z.literal("object"),
  properties: z.record(JsonSchemaPropertySchema),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
});

export const ResponseFormatSchema = z.object({
  type: z.literal("json_schema"),
  json_schema: z.object({
    name: z.string(),
    strict: z.literal(true),
    schema: JsonSchemaSchema,
  }),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().optional(),
  responseFormat: ResponseFormatSchema.optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
});
```

#### Krok 5.2: Użyj walidacji w API endpoint

Zaktualizuj `src/pages/api/chat.ts`:

```typescript
// Dodaj na początku
import { ChatRequestSchema } from "@/lib/validation/openrouter.validation";

// W POST handler, przed `openRouterService.chat()`
try {
  const validatedBody = ChatRequestSchema.parse(body);
  const response = await openRouterService.chat(validatedBody);
  // ...
} catch (error: any) {
  if (error.name === "ZodError") {
    return new Response(
      JSON.stringify({
        error: "Invalid request data",
        details: error.errors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  // ... rest of error handling
}
```

---

### Faza 6: Testy i Weryfikacja (45 min)

#### Krok 6.1: Utwórz testowy skrypt

Utwórz `src/scripts/test-openrouter.ts`:

```typescript
// src/scripts/test-openrouter.ts
import { OpenRouterService } from "../lib/services/openrouter.service";

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY not found in environment");
    process.exit(1);
  }

  const service = new OpenRouterService(apiKey);

  console.log("🧪 Testing OpenRouter Service...\n");

  // Test 1: Simple chat
  console.log("Test 1: Simple chat");
  try {
    const response = await service.chat({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: 'Say "Hello World" and nothing else.',
        },
      ],
      model: "openai/gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 50,
    });

    console.log("✅ Response:", response.content);
    console.log("📊 Tokens:", response.usage);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n---\n");

  // Test 2: Structured output
  console.log("Test 2: Structured output (JSON Schema)");
  try {
    const response = await service.chat({
      messages: [
        {
          role: "system",
          content: "You are a code analyzer.",
        },
        {
          role: "user",
          content: "const add = (a, b) => a + b;",
        },
      ],
      model: "openai/gpt-4-turbo",
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "code_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              language: {
                type: "string",
                enum: ["javascript", "typescript", "python", "other"],
              },
              description: {
                type: "string",
              },
            },
            required: ["language", "description"],
            additionalProperties: false,
          },
        },
      },
    });

    console.log("✅ Structured data:", response.structuredData);
    console.log("📊 Tokens:", response.usage);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n🎉 Tests completed!");
}

testOpenRouter();
```

#### Krok 6.2: Dodaj npm script

W `package.json` dodaj:

```json
{
  "scripts": {
    "test:openrouter": "tsx src/scripts/test-openrouter.ts"
  }
}
```

Jeśli nie masz `tsx`, zainstaluj:

```bash
npm install --save-dev tsx
```

#### Krok 6.3: Uruchom testy

```bash
npm run test:openrouter
```

Oczekiwany output:

```
🧪 Testing OpenRouter Service...

Test 1: Simple chat
✅ Response: Hello World
📊 Tokens: { promptTokens: 20, completionTokens: 2, totalTokens: 22 }

---

Test 2: Structured output (JSON Schema)
✅ Structured data: { language: 'javascript', description: 'Arrow function that adds two numbers' }
📊 Tokens: { promptTokens: 45, completionTokens: 15, totalTokens: 60 }

🎉 Tests completed!
```

#### Krok 6.4: Test API endpoint manualnie

```bash
# Uruchom dev server
npm run dev

# W drugim terminalu
curl -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are helpful."},
      {"role": "user", "content": "Say hello"}
    ],
    "model": "openai/gpt-3.5-turbo"
  }'
```

---

### Faza 7: Dokumentacja (15 min)

#### Krok 7.1: Utwórz README dla service

Utwórz `src/lib/services/README.md`:

```markdown
# OpenRouter Service

Service dla komunikacji z OpenRouter API.

## Użycie

### Server-side (Astro API endpoint)

\`\`\`typescript
import { OpenRouterService } from '@/lib/services/openrouter.service';

const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);

const response = await service.chat({
messages: [
{ role: 'system', content: 'You are helpful.' },
{ role: 'user', content: 'Hello!' }
]
});
\`\`\`

### Client-side (React component)

\`\`\`typescript
const response = await fetch('/api/chat', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ messages: [...] })
});
\`\`\`

## Bezpieczeństwo

- ❌ NIE używaj bezpośrednio w React components
- ✅ Używaj tylko w API endpoints
- ✅ Przechowuj klucz API w `.env.local`
```

---

### Faza 8: Checklist Weryfikacji

Po ukończeniu implementacji, sprawdź:

- [ ] ✅ Klucz API jest w `.env.local` i NIE w Git
- [ ] ✅ `.env.local` jest w `.gitignore`
- [ ] ✅ Wszystkie typy są zdefiniowane w `openrouter.types.ts`
- [ ] ✅ Service implementuje wszystkie publiczne metody
- [ ] ✅ Walidacja Zod działa poprawnie
- [ ] ✅ API endpoint `/api/chat` odpowiada
- [ ] ✅ Testy manulane przechodzą
- [ ] ✅ Obsługa błędów działa (401, 429, 500)
- [ ] ✅ Retry mechanism działa (exponential backoff)
- [ ] ✅ Structured output (response_format) działa
- [ ] ✅ Dokumentacja README jest kompletna

---

## Podsumowanie

Ten przewodnik implementacji zapewnia:

1. **Pełną warstwę abstrakcji** dla OpenRouter API
2. **Zgodność ze stackiem** (Astro + TypeScript + Zod)
3. **Wzorce projektu** (podobne do `auth.service.ts` i `snippets.service.ts`)
4. **Bezpieczeństwo** (SSR-only, env variables, walidacja)
5. **Obsługę błędów** (retry, user-friendly messages)
6. **Strukturę danych** (JSON Schema dla AI responses)
7. **Testability** (skrypty testowe, manual verification)

Developer może teraz:

- Szybko wdrożyć funkcje AI (auto-detect języka, AI tagging)
- Rozszerzyć o nowe modele i parametry
- Zintegrować z istniejącymi componentami (snippets, search)
- Utrzymać spójność z resztą projektu

**Szacowany czas implementacji**: 3-4 godziny dla doświadczonego developera.
