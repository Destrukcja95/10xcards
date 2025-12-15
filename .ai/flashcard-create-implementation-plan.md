# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego

Endpoint `POST /api/flashcards` służy do tworzenia jednej lub wielu fiszek. Obsługuje zarówno ręczne tworzenie fiszek przez użytkownika, jak i zapisywanie fiszek zaakceptowanych z propozycji AI. Zwraca listę utworzonych fiszek z pełnymi danymi.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/flashcards`
- **Nagłówki wymagane:**
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`

### Request Body

```json
{
  "flashcards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "manual"
    },
    {
      "front": "What is 2+2?",
      "back": "4",
      "source": "ai_generated"
    }
  ]
}
```

### Reguły walidacji

| Pole | Reguła |
|------|--------|
| `flashcards` | Wymagane, tablica, min 1 element, max 100 elementów |
| `front` | Wymagane, string, 1-500 znaków |
| `back` | Wymagane, string, 1-1000 znaków |
| `source` | Wymagane, enum: `ai_generated`, `manual` |

### Przykład żądania

```http
POST /api/flashcards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "flashcards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "manual"
    }
  ]
}
```

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// Command model dla pojedynczej fiszki
type CreateFlashcardCommand = Pick<FlashcardInsert, "front" | "back" | "source">;

// Command model dla batch creation
interface CreateFlashcardsCommand {
  flashcards: CreateFlashcardCommand[];
}

// Response DTO
interface CreateFlashcardsResponseDTO {
  data: FlashcardDTO[];
}

// DTO pojedynczej fiszki
type FlashcardDTO = Omit<FlashcardRow, "user_id">;
```

### Nowe typy do utworzenia w `src/lib/schemas/flashcards.schema.ts`

```typescript
export const createFlashcardSchema = z.object({
  front: z.string().min(1, 'Front text is required').max(500, 'Front text must be at most 500 characters'),
  back: z.string().min(1, 'Back text is required').max(1000, 'Back text must be at most 1000 characters'),
  source: z.enum(['ai_generated', 'manual'], {
    errorMap: () => ({ message: "Source must be 'ai_generated' or 'manual'" }),
  }),
});

export const createFlashcardsSchema = z.object({
  flashcards: z
    .array(createFlashcardSchema)
    .min(1, 'At least one flashcard is required')
    .max(100, 'Maximum 100 flashcards can be created at once'),
});

export type CreateFlashcardsInput = z.infer<typeof createFlashcardsSchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

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
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
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
        "field": "flashcards.0.front",
        "message": "Front text must be at most 500 characters"
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

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POST /api/flashcards                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Klient wysyła żądanie z tablicą fiszek                                  │
│     POST /api/flashcards                                                    │
│     Body: { flashcards: [...] }                                             │
│                         │                                                   │
│                         ▼                                                   │
│  2. Middleware - weryfikacja JWT i ekstrakcja user_id                       │
│                         │                                                   │
│                         ▼                                                   │
│  3. Endpoint - parsowanie JSON body                                         │
│     ├── Błąd parsowania → zwróć 400                                         │
│     └── Walidacja przez Zod schema                                          │
│         ├── Błąd walidacji → zwróć 400 z details                            │
│         └── OK → kontynuuj                                                  │
│                         │                                                   │
│                         ▼                                                   │
│  4. FlashcardsService.createFlashcards()                                    │
│     ├── Mapowanie danych + dodanie user_id                                  │
│     ├── Ustawienie domyślnych wartości SM-2                                 │
│     └── INSERT INTO flashcards (...) VALUES (...) RETURNING *               │
│                         │                                                   │
│                         ▼                                                   │
│  5. Mapowanie wyników do FlashcardDTO[] (usunięcie user_id)                 │
│                         │                                                   │
│                         ▼                                                   │
│  6. Odpowiedź 201 Created z CreateFlashcardsResponseDTO                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja
- Token JWT wymagany
- user_id pobierany z tokena, nie z request body

### 6.2 Autoryzacja
- Każda fiszka jest automatycznie przypisywana do zalogowanego użytkownika
- RLS policy `flashcards_insert_own` weryfikuje user_id

### 6.3 Walidacja
- Walidacja długości pól front/back
- Walidacja enum source
- Limit maksymalnie 100 fiszek w jednym żądaniu (ochrona przed DoS)
- Sanityzacja danych wejściowych przez Zod

### 6.4 Ochrona przed atakami
- Limit rozmiaru request body (domyślny limit Astro)
- Walidacja JSON przed przetwarzaniem
- Brak możliwości nadpisania user_id

## 7. Obsługa błędów

| Kod | Scenariusz | Odpowiedź |
|-----|------------|-----------|
| 401 | Brak/nieprawidłowy token JWT | `UNAUTHORIZED` |
| 400 | Nieprawidłowy JSON | `VALIDATION_ERROR` - "Invalid JSON body" |
| 400 | Brak pola flashcards | `VALIDATION_ERROR` - "At least one flashcard is required" |
| 400 | Przekroczony limit fiszek | `VALIDATION_ERROR` - "Maximum 100 flashcards..." |
| 400 | Nieprawidłowe pole front/back/source | `VALIDATION_ERROR` z details |
| 500 | Błąd bazy danych | `INTERNAL_ERROR` |

## 8. Rozważania dotyczące wydajności

### 8.1 Batch Insert
- Używamy pojedynczego INSERT z wieloma wartościami
- Supabase SDK obsługuje to automatycznie przy `.insert(array)`

### 8.2 Limity
- Max 100 fiszek na żądanie zapobiega długim transakcjom
- Kontrola rozmiaru payload

### 8.3 Transakcyjność
- Supabase domyślnie wykonuje batch insert jako pojedynczą transakcję
- W przypadku błędu żadna fiszka nie zostanie utworzona

## 9. Etapy wdrożenia

### Krok 1: Dodanie schematu walidacji

**Plik:** `src/lib/schemas/flashcards.schema.ts`

```typescript
export const createFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, 'Front text is required')
    .max(500, 'Front text must be at most 500 characters'),
  back: z
    .string()
    .min(1, 'Back text is required')
    .max(1000, 'Back text must be at most 1000 characters'),
  source: z.enum(['ai_generated', 'manual'], {
    errorMap: () => ({ message: "Source must be 'ai_generated' or 'manual'" }),
  }),
});

export const createFlashcardsSchema = z.object({
  flashcards: z
    .array(createFlashcardSchema)
    .min(1, 'At least one flashcard is required')
    .max(100, 'Maximum 100 flashcards can be created at once'),
});

export type CreateFlashcardsInput = z.infer<typeof createFlashcardsSchema>;
```

### Krok 2: Rozszerzenie FlashcardsService

**Plik:** `src/lib/services/flashcards.service.ts`

```typescript
async createFlashcards(
  userId: string,
  input: CreateFlashcardsInput
): Promise<FlashcardDTO[]> {
  // Mapowanie danych wejściowych z dodaniem user_id
  const flashcardsToInsert = input.flashcards.map((fc) => ({
    user_id: userId,
    front: fc.front,
    back: fc.back,
    source: fc.source,
    // Domyślne wartości SM-2 są ustawiane przez bazę danych
  }));

  const { data, error } = await this.supabase
    .from('flashcards')
    .insert(flashcardsToInsert)
    .select('id, front, back, source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at, updated_at');

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data ?? [];
}
```

### Krok 3: Utworzenie endpointu API

**Plik:** `src/pages/api/flashcards.ts` (dodanie metody POST)

```typescript
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

  // Walidacja przez Zod
  const validationResult = createFlashcardsSchema.safeParse(body);

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
    const createdFlashcards = await service.createFlashcards(user.id, validationResult.data);

    return new Response(JSON.stringify({ data: createdFlashcards }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[POST /api/flashcards] Error:', error);
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
| `src/lib/schemas/flashcards.schema.ts` | Modyfikacja - dodanie createFlashcardsSchema |
| `src/lib/services/flashcards.service.ts` | Modyfikacja - dodanie createFlashcards() |
| `src/pages/api/flashcards.ts` | Modyfikacja - dodanie handlera POST |

