# OpenRouter Service

Service dla komunikacji z OpenRouter API w projekcie Spellbook.

## Przegląd

OpenRouter Service umożliwia komunikację z różnymi modelami AI (GPT-4, Claude, Grok, DeepSeek, etc.) przez ujednolicone API OpenRouter. Obsługuje zarówno zwykłe chat completions jak i structured output z JSON Schema.

**Status:** ✅ Zaimplementowany i działający w produkcji  
**Główne użycie:** AI Code Explanation feature w komponencie CodeBlock  
**Domyślny model:** DeepSeek R1 Turbo Chimera (free tier)

## Instalacja i Konfiguracja

### 1. Uzyskaj API Key

1. Zarejestruj się na [OpenRouter.ai](https://openrouter.ai/)
2. Przejdź do [API Keys](https://openrouter.ai/keys)
3. Wygeneruj nowy klucz API

### 2. Konfiguracja Środowiska

Dodaj klucz API do pliku `.env.local`:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**WAŻNE:** Nigdy nie commituj pliku `.env.local` do repozytorium!

## Użycie

### Server-side (Astro API Endpoint)

OpenRouter Service **MUSI** być używany tylko po stronie serwera, nigdy w komponentach klienckich.

```typescript
// src/pages/api/chat.ts
import { OpenRouterService } from "@/lib/services/openrouter.service";

const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);

const response = await service.chat({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" },
  ],
});
```

### Client-side (React Component)

Komponenty React **NIE MOGĄ** bezpośrednio wywoływać OpenRouterService. Zamiast tego używaj API endpoint:

```typescript
const MyComponent = () => {
  const handleChat = async () => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are helpful." },
          { role: "user", content: "Hello!" },
        ],
      }),
    });

    const data = await response.json();
    console.log(data.content);
  };
};
```

## Przykłady

### Prosty Chat

```typescript
const response = await service.chat({
  messages: [
    { role: "system", content: "You are a coding assistant." },
    { role: "user", content: "Explain async/await in TypeScript" },
  ],
  model: "openai/gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 500,
});

console.log(response.content);
```

### Structured Output (JSON Schema)

```typescript
const response = await service.chat({
  messages: [
    { role: "system", content: "You are a code analyzer." },
    { role: "user", content: "const sum = (a, b) => a + b;" },
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
            enum: ["javascript", "typescript", "python", "other"],
          },
          description: { type: "string" },
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["language", "description", "tags"],
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
};
```

### ✅ Code Explanation (Zrealizowany Use Case w Spellbook)

```typescript
// Użycie w /api/explain endpoint
const response = await service.chat({
  messages: [
    {
      role: "system",
      content:
        "Jesteś pomocnym asystentem programisty. Odpowiadasz ZAWSZE po polsku, ZAWSZE w maksymalnie 2-3 krótkich zdaniach.",
    },
    {
      role: "user",
      content: `Co robi ten kod (${language})? Odpowiedz w 2-3 zdaniach:\n\n${code}`,
    },
  ],
  model: "tngtech/deepseek-r1t2-chimera:free",
  maxTokens: 500,
  temperature: 0.3,
});

// Zwracamy wyjaśnienie do UI
return { explanation: response.content };
```

**Integracja z UI:**

- Przycisk "💡 Explain" w komponencie `CodeBlock`
- Rate limiting: 3 sekundy między requestami (client-side throttle)
- Modal z wyjaśnieniem po kliknięciu
- Loading state podczas przetwarzania
- Error handling z user-friendly komunikatami

### Detekcja Języka Kodu (Możliwy przyszły Use Case)

```typescript
const response = await service.chat({
  messages: [
    { role: "system", content: "You are a code language detector." },
    { role: "user", content: userCodeSnippet },
  ],
  model: "tngtech/deepseek-r1t2-chimera:free",
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "language_detection",
      strict: true,
      schema: {
        type: "object",
        properties: {
          language: {
            type: "string",
            enum: ["Bash", "CSS", "JavaScript", "Python", "TypeScript", "Other"],
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
        },
        required: ["language", "confidence"],
        additionalProperties: false,
      },
    },
  },
});
```

## API Reference

### `OpenRouterService` Constructor

```typescript
constructor(apiKey: string, options?: OpenRouterServiceOptions)
```

**Opcje:**

- `baseUrl`: URL API (domyślnie: `https://openrouter.ai/api/v1`)
- `defaultModel`: Domyślny model (domyślnie: `tngtech/deepseek-r1t2-chimera:free`)
- `timeout`: Timeout w ms (domyślnie: 30000, w explain endpoint: 15000)
- `retries`: Liczba ponownych prób (domyślnie: 3)
- `headers`: Dodatkowe nagłówki HTTP

**Aktualne użycie w projekcie:**

W `/api/explain` endpoint używamy modelu `tngtech/deepseek-r1t2-chimera:free` z:

- Skróconym timeout: 15s
- Temperaturą: 0.3 (dla zwięzłości)
- Max tokens: 500
- System prompt w języku polskim

### `chat()` Method

```typescript
async chat(request: ChatRequest): Promise<ChatResponse>
```

**Request:**

- `messages`: Tablica wiadomości (wymagane)
- `model`: Nazwa modelu (opcjonalne)
- `responseFormat`: JSON Schema dla structured output (opcjonalne)
- `temperature`: 0.0-2.0 (opcjonalne)
- `maxTokens`: Maksymalna liczba tokenów (opcjonalne)
- `topP`: 0.0-1.0 (opcjonalne)
- `frequencyPenalty`: -2.0 do 2.0 (opcjonalne)
- `presencePenalty`: -2.0 do 2.0 (opcjonalne)

**Response:**

- `id`: ID odpowiedzi
- `model`: Użyty model
- `content`: Treść odpowiedzi
- `structuredData`: Sparsowane dane JSON (jeśli responseFormat)
- `usage`: Statystyki tokenów
- `finishReason`: Przyczyna zakończenia

### Dostępne Modele

```typescript
service.models; // getter zwracający listę dostępnych modeli
```

## Testowanie

### Testy Manualne

Uruchom skrypt testowy:

```bash
npm run test:openrouter
```

Skrypt testuje:

1. Prosty chat
2. Structured output z JSON Schema
3. Detekcję języka kodu

### Test API Endpoint

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
    ]
  }'
```

## Obsługa Błędów

Service automatycznie:

- Mapuje błędy API na user-friendly komunikaty
- Ponawia próby dla błędów serwera (5xx) i rate limit (429)
- Obsługuje timeout z konfigurowalnymi wartościami
- Waliduje requesty przed wysłaniem

Przykłady komunikatów błędów:

- `Invalid API key. Please check your OpenRouter credentials.` (401)
- `Rate limit exceeded. Please try again later.` (429)
- `Request timeout. The AI model took too long to respond.` (timeout)
- `Network error. Please check your internet connection.` (network)

**Komunikaty w /api/explain endpoint (po polsku):**

- `Za dużo zapytań. Poczekaj chwilę i spróbuj ponownie.` (rate limit)
- `Nie udało się wygenerować wyjaśnienia. Spróbuj ponownie.` (ogólny błąd)
- Client-side throttling: `Poczekaj jeszcze Xs przed kolejnym wyjaśnieniem`

## Bezpieczeństwo

✅ **ROBIMY:**

- Przechowywanie klucza w `.env.local`
- Wywoływanie serwisu tylko po stronie serwera
- Walidacja requestów z Zod
- Używanie HTTPS (OpenRouter wymaga)

❌ **NIE ROBIMY:**

- Commitowanie kluczy do Git
- Hardcodowania kluczy w kodzie
- Wywoływania serwisu z przeglądarki
- Wystawiania kluczy API do klienta

## Pliki

```
src/
├── lib/
│   ├── services/
│   │   └── openrouter.service.ts      # Główna klasa serwisu
│   └── validation/
│       └── openrouter.schemas.ts      # Schematy walidacji Zod
├── pages/
│   └── api/
│       └── chat.ts                    # API endpoint
├── scripts/
│   └── test-openrouter.ts             # Skrypt testowy
└── types/
    └── openrouter.types.ts            # Definicje typów
```

## Troubleshooting

### Błąd: "API key is required"

- Sprawdź czy `OPENROUTER_API_KEY` jest ustawiony w `.env.local`
- Zrestartuj dev server po dodaniu zmiennej

### Błąd: "Invalid API key"

- Zweryfikuj klucz na https://openrouter.ai/keys
- Upewnij się że klucz zaczyna się od `sk-or-v1-`

### Błąd: "Rate limit exceeded"

- Serwis automatycznie ponawia próby z exponential backoff
- Jeśli problem pozostaje, poczekaj kilka minut

### Timeout

- Zwiększ `timeout` w options konstruktora
- Użyj szybszego modelu (np. `grok-beta` zamiast `gpt-4`)

## ✅ Zrealizowane Features

- ✅ Basic chat completions
- ✅ Error handling z retry logic
- ✅ Timeout configuration
- ✅ Rate limiting (client-side throttling w UI)
- ✅ Code explanation endpoint
- ✅ User-friendly error messages (PL)

## Roadmap (v2+)

Przyszłe funkcjonalności:

- Streaming responses (dla dłuższych wyjaśnień)
- Token counting przed requestem
- Server-side cache dla identycznych zapytań
- Server-side rate limiting (obecnie tylko client-side)
- Monitoring i logging kosztów API
- Auto-detect language feature
- Code translation between languages
