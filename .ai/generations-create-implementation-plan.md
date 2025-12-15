# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

Endpoint `POST /api/generations` służy do generowania propozycji fiszek przez AI na podstawie dostarczonego tekstu źródłowego. Wykorzystuje OpenRouter API do komunikacji z modelem LLM. Propozycje nie są zapisywane w bazie danych - pozostają w odpowiedzi do akceptacji przez użytkownika. Tworzona jest sesja generowania dla celów statystycznych.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/generations`
- **Nagłówki wymagane:**
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`

### Request Body

```json
{
  "source_text": "Long text content between 1000 and 10000 characters..."
}
```

### Reguły walidacji

| Pole | Reguła |
|------|--------|
| `source_text` | Wymagane, string, 1000-10000 znaków |

### Przykład żądania

```http
POST /api/generations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "source_text": "Machine learning is a subset of artificial intelligence..."
}
```

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Command model
interface GenerateFlashcardsCommand {
  source_text: string;
}

// Propozycja fiszki od AI
interface FlashcardProposalDTO {
  front: string;
  back: string;
}

// Response DTO
interface GenerationResponseDTO {
  generation_id: string;
  proposals: FlashcardProposalDTO[];
  generated_count: number;
}
```

### Nowe typy do utworzenia

**Plik:** `src/lib/schemas/generations.schema.ts`

```typescript
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, 'Source text must be at least 1000 characters')
    .max(10000, 'Source text must be at most 10000 characters'),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

**Plik:** `src/lib/services/openrouter.types.ts`

```typescript
// Typy dla OpenRouter API
interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "generation_id": "550e8400-e29b-41d4-a716-446655440000",
  "proposals": [
    {
      "front": "What is machine learning?",
      "back": "A subset of AI that enables systems to learn from data"
    },
    {
      "front": "What are the main types of machine learning?",
      "back": "Supervised, unsupervised, and reinforcement learning"
    }
  ],
  "generated_count": 2
}
```

### Błąd walidacji (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Source text must be between 1000 and 10000 characters"
  }
}
```

### AI Service Unavailable (503 Service Unavailable)

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable"
  }
}
```

### Rate Limited (429 Too Many Requests)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many generation requests. Please try again later."
  }
}
```

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POST /api/generations                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Klient wysyła tekst źródłowy                                            │
│     POST /api/generations                                                   │
│     Body: { source_text: "..." }                                            │
│                         │                                                   │
│                         ▼                                                   │
│  2. Middleware - weryfikacja JWT                                            │
│                         │                                                   │
│                         ▼                                                   │
│  3. Endpoint - walidacja długości tekstu (1000-10000 znaków)                │
│                         │                                                   │
│                         ▼                                                   │
│  4. GenerationsService.generateFlashcards()                                 │
│     │                                                                       │
│     ├── 4a. Utworzenie rekordu generation_session                           │
│     │       INSERT INTO generation_sessions                                 │
│     │       (user_id, source_text, generated_count=0, accepted_count=0)     │
│     │                   │                                                   │
│     │                   ▼                                                   │
│     ├── 4b. Wywołanie OpenRouterService.generateFlashcards()                │
│     │       POST https://openrouter.ai/api/v1/chat/completions              │
│     │                   │                                                   │
│     │                   ▼                                                   │
│     ├── 4c. Parsowanie odpowiedzi LLM                                       │
│     │       Ekstrakcja par pytanie-odpowiedź                                │
│     │                   │                                                   │
│     │                   ▼                                                   │
│     └── 4d. Aktualizacja generation_session.generated_count                 │
│             UPDATE generation_sessions SET generated_count = X              │
│                         │                                                   │
│                         ▼                                                   │
│  5. Odpowiedź 200 OK z GenerationResponseDTO                                │
│     { generation_id, proposals[], generated_count }                         │
│                                                                             │
│  ⚠️  Propozycje NIE są zapisywane do tabeli flashcards!                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja
- Token JWT wymagany
- Generowanie dostępne tylko dla zalogowanych użytkowników

### 6.2 Rate Limiting
- 10 żądań na godzinę per użytkownik (zgodnie ze specyfikacją)
- Implementacja przez middleware lub serwis
- Przechowywanie liczników w pamięci lub Redis

### 6.3 Walidacja
- Ścisła walidacja długości tekstu (1000-10000 znaków)
- Ochrona przed zbyt dużymi payloadami

### 6.4 Ochrona klucza API
- OPENROUTER_API_KEY przechowywany w zmiennych środowiskowych
- Nigdy nie eksponowany w odpowiedziach

### 6.5 Sanityzacja
- Tekst źródłowy przekazywany do LLM bez modyfikacji
- Odpowiedź LLM parsowana i walidowana przed zwróceniem

## 7. Obsługa błędów

| Kod | Scenariusz | Odpowiedź |
|-----|------------|-----------|
| 401 | Brak/nieprawidłowy token JWT | `UNAUTHORIZED` |
| 400 | Tekst < 1000 lub > 10000 znaków | `VALIDATION_ERROR` |
| 400 | Nieprawidłowy JSON | `VALIDATION_ERROR` |
| 429 | Przekroczono limit 10 żądań/h | `RATE_LIMITED` |
| 503 | OpenRouter API niedostępne | `SERVICE_UNAVAILABLE` |
| 503 | Timeout OpenRouter (30s) | `SERVICE_UNAVAILABLE` |
| 500 | Błąd parsowania odpowiedzi LLM | `INTERNAL_ERROR` |
| 500 | Błąd bazy danych | `INTERNAL_ERROR` |

## 8. Rozważania dotyczące wydajności

### 8.1 Timeout
- Timeout dla OpenRouter API: 30 sekund
- Użytkownik informowany o długim czasie oczekiwania

### 8.2 Prompt Engineering
- Optymalizacja promptu dla szybszych odpowiedzi
- Strukturalny format odpowiedzi (JSON) dla łatwiejszego parsowania

### 8.3 Retries
- 1 retry przy timeout lub błędzie 5xx
- Exponential backoff

### 8.4 Koszty
- Monitorowanie użycia tokenów
- Limit znaków source_text (10000) kontroluje koszty

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji

**Plik:** `src/lib/schemas/generations.schema.ts`

```typescript
import { z } from 'zod';

export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, 'Source text must be at least 1000 characters')
    .max(10000, 'Source text must be at most 10000 characters'),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

### Krok 2: Utworzenie OpenRouterService

**Plik:** `src/lib/services/openrouter.service.ts`

```typescript
import type { FlashcardProposalDTO } from '../../types';

interface OpenRouterConfig {
  apiKey: string;
  model: string;
  timeout: number;
}

export class OpenRouterService {
  private config: OpenRouterConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      model: 'anthropic/claude-3-haiku', // lub inny model
      timeout: 30000,
    };
  }

  async generateFlashcards(sourceText: string): Promise<FlashcardProposalDTO[]> {
    const systemPrompt = `You are a flashcard generator. Generate educational flashcards from the provided text.
Each flashcard should have a clear question (front) and concise answer (back).
Return ONLY a JSON array of objects with "front" and "back" fields.
Generate 5-15 flashcards depending on content richness.
Example format: [{"front": "Question?", "back": "Answer"}]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://10xcards.app',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sourceText },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      throw new Error('SERVICE_UNAVAILABLE');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return this.parseFlashcards(content);
  }

  private parseFlashcards(content: string): FlashcardProposalDTO[] {
    try {
      // Ekstrakcja JSON z odpowiedzi
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Walidacja struktury
      return parsed.filter((item: unknown) => 
        typeof item === 'object' &&
        item !== null &&
        'front' in item &&
        'back' in item &&
        typeof item.front === 'string' &&
        typeof item.back === 'string' &&
        item.front.length > 0 &&
        item.back.length > 0
      );
    } catch {
      throw new Error('Failed to parse LLM response');
    }
  }
}
```

### Krok 3: Utworzenie GenerationsService

**Plik:** `src/lib/services/generations.service.ts`

```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { GenerationResponseDTO } from '../../types';
import type { GenerateFlashcardsInput } from '../schemas/generations.schema';
import { OpenRouterService } from './openrouter.service';

export class GenerationsService {
  private openRouterService: OpenRouterService;

  constructor(private supabase: SupabaseClient) {
    this.openRouterService = new OpenRouterService();
  }

  async generateFlashcards(
    userId: string,
    input: GenerateFlashcardsInput
  ): Promise<GenerationResponseDTO> {
    // 1. Utworzenie sesji generowania
    const { data: session, error: sessionError } = await this.supabase
      .from('generation_sessions')
      .insert({
        user_id: userId,
        source_text: input.source_text,
        generated_count: 0,
        accepted_count: 0,
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      throw new Error(`Database error: ${sessionError?.message}`);
    }

    try {
      // 2. Generowanie propozycji przez AI
      const proposals = await this.openRouterService.generateFlashcards(input.source_text);

      // 3. Aktualizacja licznika wygenerowanych
      await this.supabase
        .from('generation_sessions')
        .update({ generated_count: proposals.length })
        .eq('id', session.id);

      return {
        generation_id: session.id,
        proposals,
        generated_count: proposals.length,
      };
    } catch (error) {
      // W przypadku błędu AI, sesja pozostaje z generated_count = 0
      throw error;
    }
  }
}
```

### Krok 4: Utworzenie endpointu API

**Plik:** `src/pages/api/generations.ts`

```typescript
import type { APIRoute } from 'astro';
import { GenerationsService } from '../../lib/services/generations.service';
import { generateFlashcardsSchema } from '../../lib/schemas/generations.schema';
import type { ErrorDTO } from '../../types';

export const prerender = false;

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user;
  
  if (!user) {
    const errorResponse: ErrorDTO = {
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authentication token' },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parsowanie JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorDTO = {
      error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Walidacja
  const validationResult = generateFlashcardsSchema.safeParse(body);
  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors[0]?.message || 'Invalid request payload',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const service = new GenerationsService(locals.supabase);
    const result = await service.generateFlashcards(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[POST /api/generations] Error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'RATE_LIMITED') {
      const errorResponse: ErrorDTO = {
        error: { code: 'RATE_LIMITED', message: 'Too many generation requests. Please try again later.' },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (message === 'SERVICE_UNAVAILABLE') {
      const errorResponse: ErrorDTO = {
        error: { code: 'SERVICE_UNAVAILABLE', message: 'AI service is temporarily unavailable' },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const errorResponse: ErrorDTO = {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

### Krok 5 (Opcjonalny): Rate Limiting Middleware

**Plik:** `src/lib/services/rate-limiter.ts`

```typescript
// Prosta implementacja in-memory rate limiter
// W produkcji użyć Redis

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `generations:${userId}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

### Podsumowanie plików do utworzenia/modyfikacji

| Plik | Akcja |
|------|-------|
| `src/lib/schemas/generations.schema.ts` | Nowy plik |
| `src/lib/services/openrouter.service.ts` | Nowy plik |
| `src/lib/services/generations.service.ts` | Nowy plik |
| `src/lib/services/rate-limiter.ts` | Nowy plik (opcjonalny) |
| `src/pages/api/generations.ts` | Nowy plik |

