# API Endpoint Implementation Plan: GET /api/study-session

## 1. Przegląd punktu końcowego

Endpoint `GET /api/study-session` pobiera fiszki wymagające powtórki na podstawie algorytmu SM-2 (Spaced Repetition). Zwraca fiszki, których `next_review_date` jest mniejsza lub równa bieżącej dacie, posortowane od najstarszych. Służy do rozpoczęcia sesji nauki.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/study-session`
- **Nagłówki wymagane:**
  - `Authorization: Bearer <JWT_TOKEN>`

### Query Parameters

| Parametr | Typ | Wymagany | Domyślnie | Opis |
|----------|-----|----------|-----------|------|
| `limit` | integer | Nie | 20 | Maksymalna liczba fiszek (max: 50) |

### Przykład żądania

```http
GET /api/study-session?limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Query params
interface StudySessionQueryParams {
  limit?: number;
}

// Fiszka w sesji nauki (podzbiór pól)
type StudySessionFlashcardDTO = Pick<
  FlashcardDTO,
  "id" | "front" | "back" | "ease_factor" | "interval" | "repetition_count"
>;

// Response DTO
interface StudySessionResponseDTO {
  data: StudySessionFlashcardDTO[];
  count: number;
  total_due: number;
}
```

### Nowe typy do utworzenia

**Plik:** `src/lib/schemas/study-session.schema.ts`

```typescript
export const studySessionQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(50, 'Limit must be between 1 and 50')),
});

export type StudySessionQuery = z.infer<typeof studySessionQuerySchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "front": "What is the capital of France?",
      "back": "Paris",
      "ease_factor": 2.50,
      "interval": 1,
      "repetition_count": 2
    }
  ],
  "count": 10,
  "total_due": 25
}
```

**Opis pól:**
- `data` - tablica fiszek do powtórki (max `limit`)
- `count` - liczba zwróconych fiszek
- `total_due` - całkowita liczba fiszek wymagających powtórki

### Brak fiszek do powtórki (200 OK)

```json
{
  "data": [],
  "count": 0,
  "total_due": 0
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

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GET /api/study-session                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Klient wysyła żądanie sesji nauki                                       │
│     GET /api/study-session?limit=20                                         │
│                         │                                                   │
│                         ▼                                                   │
│  2. Middleware - weryfikacja JWT                                            │
│                         │                                                   │
│                         ▼                                                   │
│  3. Endpoint - walidacja query params                                       │
│     ├── limit >= 1 && limit <= 50                                           │
│     └── Domyślnie 20                                                        │
│                         │                                                   │
│                         ▼                                                   │
│  4. StudySessionService.getStudySession()                                   │
│     │                                                                       │
│     ├── 4a. Pobranie total_due (COUNT)                                      │
│     │       SELECT COUNT(*) FROM flashcards                                 │
│     │       WHERE user_id = $1 AND next_review_date <= now()                │
│     │                   │                                                   │
│     │                   ▼                                                   │
│     └── 4b. Pobranie fiszek do powtórki                                     │
│             SELECT id, front, back, ease_factor, interval, repetition_count │
│             FROM flashcards                                                 │
│             WHERE user_id = $1 AND next_review_date <= now()                │
│             ORDER BY next_review_date ASC                                   │
│             LIMIT $2                                                        │
│                         │                                                   │
│                         ▼                                                   │
│  5. Odpowiedź 200 OK z StudySessionResponseDTO                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja
- Token JWT wymagany
- user_id z tokena używany do filtrowania

### 6.2 Autoryzacja
- Zapytanie filtruje po `user_id = auth.uid()`
- RLS policy jako dodatkowa warstwa ochrony

### 6.3 Walidacja
- Limit walidowany (1-50)
- Chronione przed manipulacją parametrów

## 7. Obsługa błędów

| Kod | Scenariusz | Odpowiedź |
|-----|------------|-----------|
| 401 | Brak/nieprawidłowy token JWT | `UNAUTHORIZED` |
| 400 | Nieprawidłowy limit | `VALIDATION_ERROR` |
| 500 | Błąd bazy danych | `INTERNAL_ERROR` |

## 8. Rozważania dotyczące wydajności

### 8.1 Indeksy
- Wykorzystuje indeks `idx_flashcards_user_next_review` (user_id, next_review_date)
- Optymalny dla tego zapytania

### 8.2 Dwa zapytania
- Osobne zapytania dla COUNT i SELECT
- Można zoptymalizować do jednego zapytania z window function (przyszła optymalizacja)

### 8.3 Limity
- Max 50 fiszek zapobiega zbyt dużym odpowiedziom
- Sortowanie po next_review_date daje najważniejsze fiszki pierwsze

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji

**Plik:** `src/lib/schemas/study-session.schema.ts`

```typescript
import { z } from 'zod';

export const studySessionQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(50, 'Limit must be between 1 and 50')),
});

export type StudySessionQuery = z.infer<typeof studySessionQuerySchema>;
```

### Krok 2: Utworzenie StudySessionService

**Plik:** `src/lib/services/study-session.service.ts`

```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { StudySessionResponseDTO, StudySessionFlashcardDTO } from '../../types';
import type { StudySessionQuery } from '../schemas/study-session.schema';

export class StudySessionService {
  constructor(private supabase: SupabaseClient) {}

  async getStudySession(
    userId: string,
    params: StudySessionQuery
  ): Promise<StudySessionResponseDTO> {
    const { limit } = params;
    const now = new Date().toISOString();

    // Pobranie total_due
    const { count: totalDue, error: countError } = await this.supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review_date', now);

    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }

    // Pobranie fiszek do powtórki
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('id, front, back, ease_factor, interval, repetition_count')
      .eq('user_id', userId)
      .lte('next_review_date', now)
      .order('next_review_date', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const flashcards: StudySessionFlashcardDTO[] = data ?? [];

    return {
      data: flashcards,
      count: flashcards.length,
      total_due: totalDue ?? 0,
    };
  }
}
```

### Krok 3: Utworzenie endpointu API

**Plik:** `src/pages/api/study-session.ts`

```typescript
import type { APIRoute } from 'astro';
import { StudySessionService } from '../../lib/services/study-session.service';
import { studySessionQuerySchema } from '../../lib/schemas/study-session.schema';
import type { ErrorDTO } from '../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
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

  // Walidacja query params
  const queryParams = Object.fromEntries(url.searchParams);
  const validationResult = studySessionQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors[0]?.message || 'Invalid query parameters',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const service = new StudySessionService(locals.supabase);
    const result = await service.getStudySession(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET /api/study-session] Error:', error);
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
| `src/lib/schemas/study-session.schema.ts` | Nowy plik |
| `src/lib/services/study-session.service.ts` | Nowy plik |
| `src/pages/api/study-session.ts` | Nowy plik |

