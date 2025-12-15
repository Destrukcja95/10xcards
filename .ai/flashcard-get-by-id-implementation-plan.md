# API Endpoint Implementation Plan: GET /api/flashcards/:id

## 1. Przegląd punktu końcowego

Endpoint `GET /api/flashcards/:id` służy do pobierania pojedynczej fiszki po jej unikalnym identyfikatorze UUID. Zwraca pełne dane fiszki należącej do uwierzytelnionego użytkownika. Jest używany do wyświetlania szczegółów fiszki lub edycji.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/flashcards/[id]`
- **Nagłówki wymagane:**
  - `Authorization: Bearer <JWT_TOKEN>` - token uwierzytelniający z Supabase Auth

### Parametry ścieżki (Path Parameters)

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Unikalny identyfikator fiszki |

### Przykład żądania

```http
GET /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// DTO pojedynczej fiszki (bez user_id)
type FlashcardDTO = Omit<FlashcardRow, "user_id">;

// Standardowa odpowiedź błędu
interface ErrorDTO {
  error: {
    code: "UNAUTHORIZED" | "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
    message: string;
    details?: ErrorDetailDTO[];
  };
}
```

### Nowe typy do utworzenia w `src/lib/schemas/flashcards.schema.ts`

```typescript
// Schema walidacji UUID
export const flashcardIdParamSchema = z.object({
  id: z.string().uuid('Invalid flashcard ID format'),
});

export type FlashcardIdParam = z.infer<typeof flashcardIdParamSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "manual",
  "ease_factor": 2.50,
  "interval": 0,
  "repetition_count": 0,
  "next_review_date": "2024-01-15T10:00:00Z",
  "last_reviewed_at": null,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

### Brak autoryzacji (401 Unauthorized)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

### Nie znaleziono (404 Not Found)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

### Błąd walidacji (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid flashcard ID format"
  }
}
```

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GET /api/flashcards/:id                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Klient wysyła żądanie                                                   │
│     GET /api/flashcards/550e8400-e29b-41d4-a716-446655440000                │
│     Authorization: Bearer <JWT>                                             │
│                         │                                                   │
│                         ▼                                                   │
│  2. Middleware - weryfikacja JWT i ekstrakcja user_id                       │
│                         │                                                   │
│                         ▼                                                   │
│  3. Endpoint - walidacja UUID z path params                                 │
│     ├── Jeśli nieprawidłowy UUID → zwróć 400                                │
│     └── Wywołanie FlashcardsService.getFlashcardById()                      │
│                         │                                                   │
│                         ▼                                                   │
│  4. Serwis - zapytanie do bazy danych                                       │
│     SELECT * FROM flashcards WHERE id = $1 AND user_id = $2                 │
│                         │                                                   │
│                         ▼                                                   │
│  5. Sprawdzenie wyniku                                                      │
│     ├── Brak wyniku → zwróć 404                                             │
│     └── Znaleziono → mapowanie do FlashcardDTO                              │
│                         │                                                   │
│                         ▼                                                   │
│  6. Odpowiedź 200 OK z FlashcardDTO                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja
- Token JWT wymagany w nagłówku Authorization
- Weryfikacja przez middleware

### 6.2 Autoryzacja
- Zapytanie filtruje po `user_id` - użytkownik może pobrać tylko swoje fiszki
- RLS policy `flashcards_select_own` jako dodatkowa warstwa ochrony
- Próba dostępu do cudzej fiszki zwraca 404 (nie 403) - information hiding

### 6.3 Walidacja
- UUID musi być w prawidłowym formacie
- Walidacja przez Zod przed wykonaniem zapytania

## 7. Obsługa błędów

| Kod | Scenariusz | Odpowiedź |
|-----|------------|-----------|
| 401 | Brak/nieprawidłowy token JWT | `UNAUTHORIZED` |
| 400 | Nieprawidłowy format UUID | `VALIDATION_ERROR` |
| 404 | Fiszka nie istnieje lub należy do innego użytkownika | `NOT_FOUND` |
| 500 | Błąd bazy danych | `INTERNAL_ERROR` |

## 8. Rozważania dotyczące wydajności

- Zapytanie wykorzystuje klucz główny (id) - O(1) lookup
- Dodatkowy filtr po `user_id` wykorzystuje indeks `idx_flashcards_user_id`
- Pojedyncze zapytanie, brak N+1

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji

**Plik:** `src/lib/schemas/flashcards.schema.ts`

```typescript
export const flashcardIdParamSchema = z.object({
  id: z.string().uuid('Invalid flashcard ID format'),
});

export type FlashcardIdParam = z.infer<typeof flashcardIdParamSchema>;
```

### Krok 2: Rozszerzenie FlashcardsService

**Plik:** `src/lib/services/flashcards.service.ts`

```typescript
async getFlashcardById(
  userId: string,
  flashcardId: string
): Promise<FlashcardDTO | null> {
  const { data, error } = await this.supabase
    .from('flashcards')
    .select('id, front, back, source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at, updated_at')
    .eq('id', flashcardId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}
```

### Krok 3: Utworzenie endpointu API

**Plik:** `src/pages/api/flashcards/[id].ts`

```typescript
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../../lib/services/flashcards.service';
import { flashcardIdParamSchema } from '../../../lib/schemas/flashcards.schema';
import type { ErrorDTO } from '../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
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

  // Walidacja parametru id
  const validationResult = flashcardIdParamSchema.safeParse({ id: params.id });

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid flashcard ID format',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const service = new FlashcardsService(locals.supabase);
    const flashcard = await service.getFlashcardById(user.id, validationResult.data.id);

    if (!flashcard) {
      const errorResponse: ErrorDTO = {
        error: { code: 'NOT_FOUND', message: 'Flashcard not found' },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET /api/flashcards/:id] Error:', error);
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

### Podsumowanie plików do utworzenia/modyfikacji

| Plik | Akcja |
|------|-------|
| `src/lib/schemas/flashcards.schema.ts` | Modyfikacja - dodanie flashcardIdParamSchema |
| `src/lib/services/flashcards.service.ts` | Modyfikacja - dodanie getFlashcardById() |
| `src/pages/api/flashcards/[id].ts` | Nowy plik |

