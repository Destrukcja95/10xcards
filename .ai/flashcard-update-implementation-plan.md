# API Endpoint Implementation Plan: PUT /api/flashcards/:id

## 1. Przegląd punktu końcowego

Endpoint `PUT /api/flashcards/:id` służy do aktualizacji istniejącej fiszki. Pozwala na zmianę pól `front` i `back`. Pozostałe pola (dane SM-2, source) nie mogą być modyfikowane przez ten endpoint. Automatycznie aktualizuje pole `updated_at`.

## 2. Szczegóły żądania

- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/flashcards/[id]`
- **Nagłówki wymagane:**
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Unikalny identyfikator fiszki |

### Request Body

```json
{
  "front": "Updated question",
  "back": "Updated answer"
}
```

### Reguły walidacji

| Pole | Reguła |
|------|--------|
| `front` | Opcjonalne, string, 1-500 znaków |
| `back` | Opcjonalne, string, 1-1000 znaków |

**Uwaga:** Przynajmniej jedno z pól musi być podane.

### Przykład żądania

```http
PUT /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "front": "Updated question",
  "back": "Updated answer"
}
```

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Command model dla aktualizacji
type UpdateFlashcardCommand = Pick<FlashcardUpdate, "front" | "back">;

// DTO pojedynczej fiszki
type FlashcardDTO = Omit<FlashcardRow, "user_id">;
```

### Nowe typy do utworzenia w `src/lib/schemas/flashcards.schema.ts`

```typescript
export const updateFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, 'Front text cannot be empty')
    .max(500, 'Front text must be at most 500 characters')
    .optional(),
  back: z
    .string()
    .min(1, 'Back text cannot be empty')
    .max(1000, 'Back text must be at most 1000 characters')
    .optional(),
}).refine((data) => data.front !== undefined || data.back !== undefined, {
  message: 'At least one field (front or back) must be provided',
});

export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "front": "Updated question",
  "back": "Updated answer",
  "source": "manual",
  "ease_factor": 2.50,
  "interval": 0,
  "repetition_count": 0,
  "next_review_date": "2024-01-15T10:00:00Z",
  "last_reviewed_at": null,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Błąd walidacji (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "field": "front",
        "message": "Front text must be at most 500 characters"
      }
    ]
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

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PUT /api/flashcards/:id                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Klient wysyła żądanie aktualizacji                                      │
│     PUT /api/flashcards/{id}                                                │
│     Body: { front?: "...", back?: "..." }                                   │
│                         │                                                   │
│                         ▼                                                   │
│  2. Middleware - weryfikacja JWT                                            │
│                         │                                                   │
│                         ▼                                                   │
│  3. Endpoint - walidacja                                                    │
│     ├── Walidacja UUID z path params                                        │
│     ├── Parsowanie JSON body                                                │
│     └── Walidacja body przez Zod                                            │
│                         │                                                   │
│                         ▼                                                   │
│  4. FlashcardsService.updateFlashcard()                                     │
│     ├── UPDATE flashcards SET ... WHERE id = $1 AND user_id = $2            │
│     └── Trigger moddatetime aktualizuje updated_at                          │
│                         │                                                   │
│                         ▼                                                   │
│  5. Sprawdzenie wyniku                                                      │
│     ├── Brak zaktualizowanych wierszy → 404                                 │
│     └── Sukces → zwróć zaktualizowaną fiszkę                                │
│                         │                                                   │
│                         ▼                                                   │
│  6. Odpowiedź 200 OK z FlashcardDTO                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja
- Token JWT wymagany
- user_id z tokena używany do filtrowania

### 6.2 Autoryzacja
- Zapytanie UPDATE filtruje po `user_id = auth.uid()`
- RLS policy `flashcards_update_own` jako dodatkowa warstwa
- Nie można zaktualizować cudzej fiszki (zwraca 404)

### 6.3 Walidacja
- UUID musi być prawidłowy
- Pola front/back muszą spełniać ograniczenia długości
- Przynajmniej jedno pole musi być podane

### 6.4 Ochrona pól
- Nie można zmodyfikować: source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at
- updated_at aktualizowane automatycznie przez trigger

## 7. Obsługa błędów

| Kod | Scenariusz | Odpowiedź |
|-----|------------|-----------|
| 401 | Brak/nieprawidłowy token JWT | `UNAUTHORIZED` |
| 400 | Nieprawidłowy format UUID | `VALIDATION_ERROR` |
| 400 | Nieprawidłowy JSON | `VALIDATION_ERROR` |
| 400 | Brak pól do aktualizacji | `VALIDATION_ERROR` - "At least one field..." |
| 400 | Nieprawidłowe wartości front/back | `VALIDATION_ERROR` z details |
| 404 | Fiszka nie istnieje lub należy do innego użytkownika | `NOT_FOUND` |
| 500 | Błąd bazy danych | `INTERNAL_ERROR` |

## 8. Rozważania dotyczące wydajności

- Pojedyncze zapytanie UPDATE z RETURNING
- Wykorzystanie indeksu klucza głównego
- Trigger moddatetime jest lekki

## 9. Etapy wdrożenia

### Krok 1: Dodanie schematu walidacji

**Plik:** `src/lib/schemas/flashcards.schema.ts`

```typescript
export const updateFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, 'Front text cannot be empty')
    .max(500, 'Front text must be at most 500 characters')
    .optional(),
  back: z
    .string()
    .min(1, 'Back text cannot be empty')
    .max(1000, 'Back text must be at most 1000 characters')
    .optional(),
}).refine((data) => data.front !== undefined || data.back !== undefined, {
  message: 'At least one field (front or back) must be provided',
});

export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
```

### Krok 2: Rozszerzenie FlashcardsService

**Plik:** `src/lib/services/flashcards.service.ts`

```typescript
async updateFlashcard(
  userId: string,
  flashcardId: string,
  input: UpdateFlashcardInput
): Promise<FlashcardDTO | null> {
  const { data, error } = await this.supabase
    .from('flashcards')
    .update(input)
    .eq('id', flashcardId)
    .eq('user_id', userId)
    .select('id, front, back, source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at, updated_at')
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

### Krok 3: Rozszerzenie endpointu API

**Plik:** `src/pages/api/flashcards/[id].ts` (dodanie metody PUT)

```typescript
export const PUT: APIRoute = async ({ locals, params, request }) => {
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
  const idValidation = flashcardIdParamSchema.safeParse({ id: params.id });
  if (!idValidation.success) {
    const errorResponse: ErrorDTO = {
      error: { code: 'VALIDATION_ERROR', message: 'Invalid flashcard ID format' },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
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

  // Walidacja body
  const validationResult = updateFlashcardSchema.safeParse(body);
  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
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
    const updatedFlashcard = await service.updateFlashcard(
      user.id,
      idValidation.data.id,
      validationResult.data
    );

    if (!updatedFlashcard) {
      const errorResponse: ErrorDTO = {
        error: { code: 'NOT_FOUND', message: 'Flashcard not found' },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PUT /api/flashcards/:id] Error:', error);
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
| `src/lib/schemas/flashcards.schema.ts` | Modyfikacja - dodanie updateFlashcardSchema |
| `src/lib/services/flashcards.service.ts` | Modyfikacja - dodanie updateFlashcard() |
| `src/pages/api/flashcards/[id].ts` | Modyfikacja - dodanie handlera PUT |

