# API Endpoint Implementation Plan: PATCH /api/generation-sessions/:id

## 1. Przegląd punktu końcowego

Endpoint `PATCH /api/generation-sessions/:id` aktualizuje sesję generowania po zapisaniu zaakceptowanych fiszek. Wywoływany gdy użytkownik zapisuje fiszki z propozycji AI przez POST /api/flashcards. Pozwala zaktualizować `accepted_count` dla statystyk.

## 2. Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/generation-sessions/[id]`
- **Nagłówki:**
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`

### Parametry ścieżki

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Identyfikator sesji generowania |

### Request Body

```json
{
  "accepted_count": 5
}
```

### Reguły walidacji

| Pole | Reguła |
|------|--------|
| `accepted_count` | Wymagane, integer >= 0 |

## 3. Wykorzystywane typy

### Z `src/types.ts`

```typescript
interface UpdateGenerationSessionCommand {
  accepted_count: number;
}

type GenerationSessionDTO = Omit<GenerationSessionRow, "user_id" | "source_text">;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "generated_count": 10,
  "accepted_count": 5,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Błąd walidacji (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "accepted_count must be a non-negative integer"
  }
}
```

### Nie znaleziono (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Generation session not found"
  }
}
```

## 5. Przepływ danych

```
1. Klient → PATCH /api/generation-sessions/{id} { accepted_count: 5 }
2. Middleware → weryfikacja JWT
3. Endpoint → walidacja UUID i body
4. Service.updateSession()
   └── UPDATE generation_sessions 
       SET accepted_count = $1 
       WHERE id = $2 AND user_id = $3
       RETURNING id, generated_count, accepted_count, created_at
5. Sprawdzenie wyniku
   ├── Brak → 404
   └── OK → 200 z GenerationSessionDTO
```

## 6. Względy bezpieczeństwa

- user_id z tokena - można aktualizować tylko swoje sesje
- RLS policy `generation_sessions` nie pozwala na UPDATE (tylko SELECT, INSERT)
- **Uwaga:** Potrzebna nowa RLS policy dla UPDATE lub użycie service role

### Nowa RLS policy (jeśli wymagana)

```sql
CREATE POLICY generation_sessions_update_own ON generation_sessions
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
```

## 7. Obsługa błędów

| Kod | Scenariusz |
|-----|------------|
| 401 | Brak/nieprawidłowy token |
| 400 | Nieprawidłowy UUID |
| 400 | accepted_count < 0 lub nie integer |
| 404 | Sesja nie istnieje/nie należy do użytkownika |
| 500 | Błąd bazy danych |

## 8. Etapy wdrożenia

### Krok 1: Schema walidacji

**Plik:** `src/lib/schemas/generation-sessions.schema.ts`

```typescript
export const sessionIdParamSchema = z.object({
  id: z.string().uuid('Invalid session ID format'),
});

export const updateSessionSchema = z.object({
  accepted_count: z
    .number()
    .int('accepted_count must be an integer')
    .min(0, 'accepted_count must be non-negative'),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
```

### Krok 2: Rozszerzenie GenerationSessionsService

**Plik:** `src/lib/services/generation-sessions.service.ts`

```typescript
async updateSession(
  userId: string,
  sessionId: string,
  input: { accepted_count: number }
): Promise<GenerationSessionDTO | null> {
  const { data, error } = await this.supabase
    .from('generation_sessions')
    .update({ accepted_count: input.accepted_count })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select('id, generated_count, accepted_count, created_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}
```

### Krok 3: Endpoint API

**Plik:** `src/pages/api/generation-sessions/[id].ts`

```typescript
import type { APIRoute } from 'astro';
import { GenerationSessionsService } from '../../../lib/services/generation-sessions.service';
import { sessionIdParamSchema, updateSessionSchema } from '../../../lib/schemas/generation-sessions.schema';
import type { ErrorDTO } from '../../../types';

export const prerender = false;

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authentication token' }
    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  // Walidacja ID
  const idValidation = sessionIdParamSchema.safeParse({ id: params.id });
  if (!idValidation.success) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid session ID format' }
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Parsowanie body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' }
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Walidacja body
  const bodyValidation = updateSessionSchema.safeParse(body);
  if (!bodyValidation.success) {
    return new Response(JSON.stringify({
      error: { 
        code: 'VALIDATION_ERROR', 
        message: bodyValidation.error.errors[0]?.message || 'Invalid request payload' 
      }
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const service = new GenerationSessionsService(locals.supabase);
    const result = await service.updateSession(
      user.id,
      idValidation.data.id,
      bodyValidation.data
    );

    if (!result) {
      return new Response(JSON.stringify({
        error: { code: 'NOT_FOUND', message: 'Generation session not found' }
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PATCH /api/generation-sessions/:id] Error:', error);
    return new Response(JSON.stringify({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
```

### Krok 4: Migracja RLS (jeśli wymagana)

**Plik:** `supabase/migrations/XXXXXX_add_generation_sessions_update_policy.sql`

```sql
CREATE POLICY generation_sessions_update_own ON generation_sessions
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
```

### Pliki do utworzenia/modyfikacji

| Plik | Akcja |
|------|-------|
| `src/lib/schemas/generation-sessions.schema.ts` | Modyfikacja |
| `src/lib/services/generation-sessions.service.ts` | Modyfikacja |
| `src/pages/api/generation-sessions/[id].ts` | Nowy |
| `supabase/migrations/...` | Nowa migracja (RLS policy) |

