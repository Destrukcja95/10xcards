# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego

Endpoint `GET /api/flashcards` służy do pobierania paginowanej listy fiszek należących do uwierzytelnionego użytkownika. Wspiera sortowanie po różnych polach oraz konfigurowalną paginację. Jest to podstawowy endpoint do wyświetlania kolekcji fiszek użytkownika w interfejsie aplikacji.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/flashcards`
- **Nagłówki wymagane:**
  - `Authorization: Bearer <JWT_TOKEN>` - token uwierzytelniający z Supabase Auth

### Parametry zapytania (Query Parameters)

| Parametr | Typ | Wymagany | Domyślnie | Opis |
|----------|-----|----------|-----------|------|
| `page` | integer | Nie | 1 | Numer strony (1-based) |
| `limit` | integer | Nie | 20 | Liczba elementów na stronie (max: 100) |
| `sort` | string | Nie | `created_at` | Pole sortowania: `created_at`, `updated_at`, `next_review_date` |
| `order` | string | Nie | `desc` | Kierunek sortowania: `asc`, `desc` |

### Przykład żądania

```http
GET /api/flashcards?page=1&limit=20&sort=created_at&order=desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Parametry zapytania
interface FlashcardsQueryParams {
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at" | "next_review_date";
  order?: "asc" | "desc";
}

// DTO pojedynczej fiszki (bez user_id)
type FlashcardDTO = Omit<FlashcardRow, "user_id">;

// Metadane paginacji
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Pełna odpowiedź endpointu
interface FlashcardsListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// Standardowa odpowiedź błędu
interface ErrorDTO {
  error: {
    code: "UNAUTHORIZED" | "VALIDATION_ERROR" | "INTERNAL_ERROR" | ...;
    message: string;
    details?: ErrorDetailDTO[];
  };
}
```

### Nowe typy do utworzenia w `src/lib/services/flashcards.service.ts`

```typescript
// Wewnętrzny interfejs dla parametrów serwisu
interface GetFlashcardsParams {
  page: number;
  limit: number;
  sort: "created_at" | "updated_at" | "next_review_date";
  order: "asc" | "desc";
}

// Wynik serwisu
interface GetFlashcardsResult {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}
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
      "source": "manual",
      "ease_factor": 2.50,
      "interval": 0,
      "repetition_count": 0,
      "next_review_date": "2024-01-15T10:00:00Z",
      "last_reviewed_at": null,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Błąd walidacji (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "limit",
        "message": "Limit must be between 1 and 100"
      }
    ]
  }
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

### Błąd serwera (500 Internal Server Error)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GET /api/flashcards                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Klient wysyła żądanie                                                   │
│     GET /api/flashcards?page=1&limit=20&sort=created_at&order=desc          │
│     Authorization: Bearer <JWT>                                             │
│                         │                                                   │
│                         ▼                                                   │
│  2. Middleware (src/middleware/index.ts)                                    │
│     ├── Weryfikacja tokenu JWT przez Supabase                               │
│     ├── Ekstrakcja user_id z tokenu                                         │
│     ├── Ustawienie user w context.locals                                    │
│     └── Jeśli błąd → zwróć 401                                              │
│                         │                                                   │
│                         ▼                                                   │
│  3. Endpoint (src/pages/api/flashcards.ts)                                  │
│     ├── Parsowanie query params z URL                                       │
│     ├── Walidacja przez Zod schema                                          │
│     ├── Jeśli błąd walidacji → zwróć 400                                    │
│     └── Wywołanie FlashcardsService.getFlashcards()                         │
│                         │                                                   │
│                         ▼                                                   │
│  4. Serwis (src/lib/services/flashcards.service.ts)                         │
│     ├── Budowanie zapytania Supabase                                        │
│     ├── Wykonanie count query dla total                                     │
│     ├── Wykonanie select query z paginacją i sortowaniem                    │
│     ├── Mapowanie wyników do FlashcardDTO[]                                 │
│     └── Obliczenie metadanych paginacji                                     │
│                         │                                                   │
│                         ▼                                                   │
│  5. Baza danych (Supabase PostgreSQL)                                       │
│     ├── RLS policy: flashcards_select_own                                   │
│     ├── Automatyczne filtrowanie po user_id = auth.uid()                    │
│     └── Zwrócenie tylko fiszek należących do użytkownika                    │
│                         │                                                   │
│                         ▼                                                   │
│  6. Odpowiedź                                                               │
│     └── 200 OK z FlashcardsListResponseDTO                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Token JWT** - wymagany w nagłówku `Authorization: Bearer <token>`
- **Weryfikacja** - middleware weryfikuje token przez `supabase.auth.getUser()`
- **Automatyczne odświeżanie** - Supabase SDK obsługuje refresh tokenów

### 6.2 Autoryzacja

- **Row Level Security (RLS)** - polityka `flashcards_select_own` w bazie danych
- **Defense in depth** - nawet jeśli API zostanie ominięte, RLS chroni dane
- **Brak dostępu do cudzych danych** - query zawsze filtruje po `user_id = auth.uid()`

### 6.3 Walidacja danych wejściowych

- **Zod schema** - wszystkie parametry query są walidowane
- **Ograniczenie limit** - maksymalnie 100 elementów na stronę (ochrona przed DoS)
- **Whitelist sort fields** - tylko dozwolone pola sortowania
- **Type coercion** - konwersja string → number dla page/limit

### 6.4 Ochrona przed atakami

| Atak | Zabezpieczenie |
|------|----------------|
| SQL Injection | Supabase SDK z parametryzowanymi zapytaniami |
| Mass Assignment | Jawna selekcja pól w query |
| Broken Access Control | RLS + walidacja user_id |
| Rate Limiting | Do implementacji w przyszłości (nie w MVP) |

## 7. Obsługa błędów

### 7.1 Scenariusze błędów

| Kod | Scenariusz | Odpowiedź |
|-----|------------|-----------|
| 401 | Brak tokenu Authorization | `UNAUTHORIZED` - "Missing or invalid authentication token" |
| 401 | Token wygasł/nieprawidłowy | `UNAUTHORIZED` - "Missing or invalid authentication token" |
| 400 | `page` < 1 | `VALIDATION_ERROR` - "Page must be at least 1" |
| 400 | `limit` < 1 lub > 100 | `VALIDATION_ERROR` - "Limit must be between 1 and 100" |
| 400 | `sort` nieprawidłowa wartość | `VALIDATION_ERROR` - "Sort must be one of: created_at, updated_at, next_review_date" |
| 400 | `order` nieprawidłowa wartość | `VALIDATION_ERROR` - "Order must be 'asc' or 'desc'" |
| 500 | Błąd połączenia z bazą | `INTERNAL_ERROR` - "An unexpected error occurred" |

### 7.2 Logowanie błędów

```typescript
// W przypadku błędu serwera - logowanie do konsoli
console.error("[GET /api/flashcards] Database error:", error);

// Odpowiedź do klienta nie zawiera szczegółów wewnętrznych
return new Response(JSON.stringify({
  error: {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred"
  }
}), { status: 500 });
```

### 7.3 Graceful degradation

- Przy pustych wynikach zwracamy pustą tablicę `data: []` z `total: 0`
- Przy `page` > `total_pages` zwracamy pustą tablicę (nie błąd 404)

## 8. Rozważania dotyczące wydajności

### 8.1 Indeksy bazodanowe

Wykorzystywane istniejące indeksy:
- `idx_flashcards_user_id` - dla filtrowania po user_id
- `idx_flashcards_user_next_review` - złożony indeks (user_id, next_review_date)

### 8.2 Optymalizacja zapytań

```sql
-- Zapytanie count (dla total)
SELECT COUNT(*) FROM flashcards WHERE user_id = $1;

-- Zapytanie główne z paginacją
SELECT * FROM flashcards 
WHERE user_id = $1 
ORDER BY $sort $order 
LIMIT $limit OFFSET $offset;
```

### 8.3 Potencjalne wąskie gardła

| Problem | Rozwiązanie |
|---------|-------------|
| Duża liczba fiszek | Paginacja (max 100 na stronę) |
| Wolne COUNT(*) | Cache'owanie total lub approximate count (przyszła optymalizacja) |
| N+1 queries | Brak - pojedyncze zapytanie pobiera wszystkie dane |

### 8.4 Rekomendacje przyszłe

- **Cursor-based pagination** - dla bardzo dużych zbiorów danych
- **Redis cache** - dla często pobieranych danych
- **Response compression** - gzip dla dużych odpowiedzi

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie middleware o autentykację

**Plik:** `src/middleware/index.ts`

```typescript
import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const onRequest = defineMiddleware(async (context, next) => {
  // Utworzenie klienta Supabase z obsługą cookies
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(context.request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  context.locals.supabase = supabase;

  // Dla ścieżek API - weryfikacja użytkownika
  if (context.url.pathname.startsWith('/api')) {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return new Response(JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authentication token'
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    context.locals.user = user;
  }

  return next();
});
```

**Aktualizacja:** `src/env.d.ts` - dodanie typu `user`

```typescript
import type { User } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user?: User;
    }
  }
}
```

---

### Krok 2: Utworzenie schematu walidacji Zod

**Plik:** `src/lib/schemas/flashcards.schema.ts`

```typescript
import { z } from 'zod';

export const getFlashcardsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100, 'Limit must be between 1 and 100')),
  sort: z
    .enum(['created_at', 'updated_at', 'next_review_date'])
    .optional()
    .default('created_at'),
  order: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

export type GetFlashcardsQuery = z.infer<typeof getFlashcardsQuerySchema>;
```

---

### Krok 3: Utworzenie serwisu FlashcardsService

**Plik:** `src/lib/services/flashcards.service.ts`

```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { FlashcardDTO, FlashcardsListResponseDTO } from '../../types';
import type { GetFlashcardsQuery } from '../schemas/flashcards.schema';

export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  async getFlashcards(
    userId: string,
    params: GetFlashcardsQuery
  ): Promise<FlashcardsListResponseDTO> {
    const { page, limit, sort, order } = params;
    const offset = (page - 1) * limit;

    // Pobranie total count
    const { count, error: countError } = await this.supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Pobranie danych z paginacją
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('id, front, back, source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at, updated_at')
      .eq('user_id', userId)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const flashcards: FlashcardDTO[] = data ?? [];

    return {
      data: flashcards,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }
}
```

---

### Krok 4: Utworzenie endpointu API

**Plik:** `src/pages/api/flashcards.ts`

```typescript
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../lib/services/flashcards.service';
import { getFlashcardsQuerySchema } from '../../lib/schemas/flashcards.schema';
import type { ErrorDTO } from '../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  // Użytkownik jest już zweryfikowany przez middleware
  const user = locals.user;
  
  if (!user) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authentication token',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parsowanie i walidacja query params
  const queryParams = Object.fromEntries(url.searchParams);
  const validationResult = getFlashcardsQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const service = new FlashcardsService(locals.supabase);
    const result = await service.getFlashcards(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET /api/flashcards] Error:', error);

    const errorResponse: ErrorDTO = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

---

### Krok 5: Utworzenie struktury katalogów

```bash
mkdir -p src/pages/api
mkdir -p src/lib/services
mkdir -p src/lib/schemas
```

---

### Krok 6: Instalacja zależności

```bash
npm install @supabase/ssr zod
```

---

### Krok 7: Testy manualne

1. **Test bez autoryzacji:**
   ```bash
   curl -X GET http://localhost:4321/api/flashcards
   # Oczekiwany wynik: 401 Unauthorized
   ```

2. **Test z autoryzacją:**
   ```bash
   curl -X GET http://localhost:4321/api/flashcards \
     -H "Authorization: Bearer <valid_jwt_token>"
   # Oczekiwany wynik: 200 OK z listą fiszek
   ```

3. **Test paginacji:**
   ```bash
   curl -X GET "http://localhost:4321/api/flashcards?page=2&limit=10"
   # Oczekiwany wynik: 200 OK z drugą stroną wyników
   ```

4. **Test błędnej walidacji:**
   ```bash
   curl -X GET "http://localhost:4321/api/flashcards?limit=999"
   # Oczekiwany wynik: 400 Bad Request z komunikatem o błędzie
   ```

---

### Podsumowanie plików do utworzenia/modyfikacji

| Plik | Akcja |
|------|-------|
| `src/middleware/index.ts` | Modyfikacja - dodanie autentykacji |
| `src/env.d.ts` | Modyfikacja - dodanie typu user |
| `src/lib/schemas/flashcards.schema.ts` | Nowy plik |
| `src/lib/services/flashcards.service.ts` | Nowy plik |
| `src/pages/api/flashcards.ts` | Nowy plik |

