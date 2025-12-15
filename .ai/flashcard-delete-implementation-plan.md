# API Endpoint Implementation Plan: DELETE /api/flashcards/:id

## 1. Przegląd punktu końcowego

Endpoint `DELETE /api/flashcards/:id` służy do trwałego usuwania fiszki. Jest to hard delete - fiszka jest całkowicie usuwana z bazy danych bez możliwości odzyskania. Zgodne z wymogami RODO dotyczącymi prawa do usunięcia danych.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/flashcards/[id]`
- **Nagłówki wymagane:**
  - `Authorization: Bearer <JWT_TOKEN>`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Unikalny identyfikator fiszki |

### Przykład żądania

```http
DELETE /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Wykorzystywane typy

### Istniejące typy

```typescript
// Schema walidacji UUID (z flashcards.schema.ts)
const flashcardIdParamSchema = z.object({
  id: z.string().uuid('Invalid flashcard ID format'),
});

// Standardowa odpowiedź błędu
interface ErrorDTO {
  error: {
    code: "UNAUTHORIZED" | "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
    message: string;
  };
}
```

## 4. Szczegóły odpowiedzi

### Sukces (204 No Content)

Pusta odpowiedź bez body.

### Brak autoryzacji (401 Unauthorized)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
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
│                       DELETE /api/flashcards/:id                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Klient wysyła żądanie usunięcia                                         │
│     DELETE /api/flashcards/{id}                                             │
│                         │                                                   │
│                         ▼                                                   │
│  2. Middleware - weryfikacja JWT                                            │
│                         │                                                   │
│                         ▼                                                   │
│  3. Endpoint - walidacja UUID                                               │
│     ├── Nieprawidłowy UUID → 400                                            │
│     └── OK → kontynuuj                                                      │
│                         │                                                   │
│                         ▼                                                   │
│  4. FlashcardsService.deleteFlashcard()                                     │
│     DELETE FROM flashcards WHERE id = $1 AND user_id = $2                   │
│                         │                                                   │
│                         ▼                                                   │
│  5. Sprawdzenie wyniku                                                      │
│     ├── count = 0 → 404 Not Found                                           │
│     └── count = 1 → 204 No Content                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja
- Token JWT wymagany
- user_id z tokena używany do filtrowania

### 6.2 Autoryzacja
- Zapytanie DELETE filtruje po `user_id = auth.uid()`
- RLS policy `flashcards_delete_own` jako dodatkowa warstwa
- Nie można usunąć cudzej fiszki (zwraca 404)

### 6.3 Walidacja
- UUID musi być prawidłowy
- Walidacja przed wykonaniem operacji

### 6.4 Idempotentność
- Wielokrotne wywołanie DELETE dla tego samego ID zwraca 404 (po pierwszym usunięciu)
- Nie powoduje błędów ani efektów ubocznych

## 7. Obsługa błędów

| Kod | Scenariusz | Odpowiedź |
|-----|------------|-----------|
| 401 | Brak/nieprawidłowy token JWT | `UNAUTHORIZED` |
| 400 | Nieprawidłowy format UUID | `VALIDATION_ERROR` |
| 404 | Fiszka nie istnieje lub należy do innego użytkownika | `NOT_FOUND` |
| 500 | Błąd bazy danych | `INTERNAL_ERROR` |

## 8. Rozważania dotyczące wydajności

- Pojedyncze zapytanie DELETE
- Wykorzystanie indeksu klucza głównego
- Brak kaskadowych operacji (fiszka nie ma relacji potomnych)

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie FlashcardsService

**Plik:** `src/lib/services/flashcards.service.ts`

```typescript
async deleteFlashcard(
  userId: string,
  flashcardId: string
): Promise<boolean> {
  const { error, count } = await this.supabase
    .from('flashcards')
    .delete({ count: 'exact' })
    .eq('id', flashcardId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return count !== null && count > 0;
}
```

### Krok 2: Rozszerzenie endpointu API

**Plik:** `src/pages/api/flashcards/[id].ts` (dodanie metody DELETE)

```typescript
export const DELETE: APIRoute = async ({ locals, params }) => {
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

  try {
    const service = new FlashcardsService(locals.supabase);
    const deleted = await service.deleteFlashcard(user.id, idValidation.data.id);

    if (!deleted) {
      const errorResponse: ErrorDTO = {
        error: { code: 'NOT_FOUND', message: 'Flashcard not found' },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/flashcards/:id] Error:', error);
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
| `src/lib/services/flashcards.service.ts` | Modyfikacja - dodanie deleteFlashcard() |
| `src/pages/api/flashcards/[id].ts` | Modyfikacja - dodanie handlera DELETE |

