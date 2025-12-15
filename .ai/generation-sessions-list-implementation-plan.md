# API Endpoint Implementation Plan: GET /api/generation-sessions

## 1. Przegląd punktu końcowego

Endpoint `GET /api/generation-sessions` pobiera paginowaną historię sesji generowania fiszek przez AI. Służy do wyświetlania statystyk użytkowania funkcji AI, w tym wskaźnika akceptacji propozycji.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/generation-sessions`
- **Nagłówki:**
  - `Authorization: Bearer <JWT_TOKEN>`

### Query Parameters

| Parametr | Typ | Wymagany | Domyślnie | Opis |
|----------|-----|----------|-----------|------|
| `page` | integer | Nie | 1 | Numer strony |
| `limit` | integer | Nie | 20 | Elementów na stronę (max 100) |

## 3. Wykorzystywane typy

### Z `src/types.ts`

```typescript
interface GenerationSessionsQueryParams {
  page?: number;
  limit?: number;
}

type GenerationSessionDTO = Omit<GenerationSessionRow, "user_id" | "source_text">;

interface GenerationSessionsSummaryDTO {
  total_generated: number;
  total_accepted: number;
  acceptance_rate: number;
}

interface GenerationSessionsListResponseDTO {
  data: GenerationSessionDTO[];
  pagination: PaginationDTO;
  summary: GenerationSessionsSummaryDTO;
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "generated_count": 10,
      "accepted_count": 7,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  },
  "summary": {
    "total_generated": 150,
    "total_accepted": 112,
    "acceptance_rate": 74.67
  }
}
```

## 5. Przepływ danych

```
1. Klient → GET /api/generation-sessions?page=1&limit=20
2. Middleware → weryfikacja JWT
3. Endpoint → walidacja query params
4. GenerationSessionsService.getSessions()
   ├── SELECT COUNT(*) dla total
   ├── SELECT sesje z paginacją
   └── Obliczenie summary (SUM i acceptance_rate)
5. Odpowiedź → 200 OK z listą i podsumowaniem
```

## 6. Obsługa błędów

| Kod | Scenariusz |
|-----|------------|
| 401 | Brak/nieprawidłowy token |
| 400 | Nieprawidłowe parametry paginacji |
| 500 | Błąd bazy danych |

## 7. Etapy wdrożenia

### Krok 1: Schema walidacji

**Plik:** `src/lib/schemas/generation-sessions.schema.ts`

```typescript
import { z } from 'zod';

export const generationSessionsQuerySchema = z.object({
  page: z.string().optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z.string().optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

export type GenerationSessionsQuery = z.infer<typeof generationSessionsQuerySchema>;
```

### Krok 2: GenerationSessionsService

**Plik:** `src/lib/services/generation-sessions.service.ts`

```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { GenerationSessionsListResponseDTO } from '../../types';

export class GenerationSessionsService {
  constructor(private supabase: SupabaseClient) {}

  async getSessions(
    userId: string,
    params: { page: number; limit: number }
  ): Promise<GenerationSessionsListResponseDTO> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    // Total count
    const { count, error: countError } = await this.supabase
      .from('generation_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw new Error(countError.message);

    // Sessions with pagination
    const { data, error } = await this.supabase
      .from('generation_sessions')
      .select('id, generated_count, accepted_count, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    // Summary calculation
    const { data: summaryData } = await this.supabase
      .from('generation_sessions')
      .select('generated_count, accepted_count')
      .eq('user_id', userId);

    const totalGenerated = summaryData?.reduce((sum, s) => sum + s.generated_count, 0) ?? 0;
    const totalAccepted = summaryData?.reduce((sum, s) => sum + s.accepted_count, 0) ?? 0;
    const acceptanceRate = totalGenerated > 0 
      ? Math.round((totalAccepted / totalGenerated) * 10000) / 100 
      : 0;

    return {
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
      summary: {
        total_generated: totalGenerated,
        total_accepted: totalAccepted,
        acceptance_rate: acceptanceRate,
      },
    };
  }
}
```

### Krok 3: Endpoint API

**Plik:** `src/pages/api/generation-sessions.ts`

```typescript
import type { APIRoute } from 'astro';
import { GenerationSessionsService } from '../../lib/services/generation-sessions.service';
import { generationSessionsQuerySchema } from '../../lib/schemas/generation-sessions.schema';
import type { ErrorDTO } from '../../types';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authentication token' }
    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const queryParams = Object.fromEntries(url.searchParams);
  const validation = generationSessionsQuerySchema.safeParse(queryParams);

  if (!validation.success) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' }
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const service = new GenerationSessionsService(locals.supabase);
    const result = await service.getSessions(user.id, validation.data);
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('[GET /api/generation-sessions] Error:', error);
    return new Response(JSON.stringify({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
```

### Pliki do utworzenia

| Plik | Akcja |
|------|-------|
| `src/lib/schemas/generation-sessions.schema.ts` | Nowy |
| `src/lib/services/generation-sessions.service.ts` | Nowy |
| `src/pages/api/generation-sessions.ts` | Nowy |

