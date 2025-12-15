# API Endpoint Implementation Plan: POST /api/study-session/review

## 1. Przegląd punktu końcowego

Endpoint `POST /api/study-session/review` zapisuje wynik powtórki fiszki i aktualizuje parametry algorytmu SM-2. Na podstawie oceny użytkownika (0-5) oblicza nowy współczynnik łatwości, interwał i datę następnej powtórki.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/study-session/review`
- **Nagłówki:**
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`

### Request Body

```json
{
  "flashcard_id": "550e8400-e29b-41d4-a716-446655440000",
  "rating": 4
}
```

### Reguły walidacji

| Pole | Reguła |
|------|--------|
| `flashcard_id` | Wymagane, UUID |
| `rating` | Wymagane, integer 0-5 |

### Skala ocen SM-2

| Ocena | Znaczenie |
|-------|-----------|
| 0 | Całkowita pustka, brak przypomnienia |
| 1 | Błąd, ale rozpoznano poprawną odpowiedź |
| 2 | Błąd, ale odpowiedź wydawała się łatwa |
| 3 | Poprawnie z dużą trudnością |
| 4 | Poprawnie z pewnym wahaniem |
| 5 | Perfekcyjna odpowiedź |

## 3. Wykorzystywane typy

### Z `src/types.ts`

```typescript
type SM2Rating = 0 | 1 | 2 | 3 | 4 | 5;

interface ReviewFlashcardCommand {
  flashcard_id: string;
  rating: SM2Rating;
}

type ReviewResultDTO = Pick<
  FlashcardDTO,
  "id" | "ease_factor" | "interval" | "repetition_count" | "next_review_date" | "last_reviewed_at"
>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ease_factor": 2.60,
  "interval": 6,
  "repetition_count": 3,
  "next_review_date": "2024-01-21T10:00:00Z",
  "last_reviewed_at": "2024-01-15T10:00:00Z"
}
```

### Błąd (400/401/404)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Rating must be between 0 and 5"
  }
}
```

## 5. Przepływ danych

```
1. Klient → POST /api/study-session/review { flashcard_id, rating }
2. Middleware → weryfikacja JWT
3. Endpoint → walidacja body
4. Service.reviewFlashcard()
   ├── Pobranie aktualnych parametrów SM-2
   ├── Obliczenie nowych parametrów (algorytm SM-2)
   └── UPDATE flashcards SET ease_factor, interval, repetition_count,
       next_review_date, last_reviewed_at
5. Odpowiedź → 200 OK z ReviewResultDTO
```

## 6. Algorytm SM-2

```typescript
function calculateSM2(current: SM2Params, rating: number): SM2Params {
  let { ease_factor, interval, repetition_count } = current;
  
  if (rating < 3) {
    // Błędna odpowiedź - reset
    repetition_count = 0;
    interval = 1;
  } else {
    // Poprawna odpowiedź
    repetition_count += 1;
    if (repetition_count === 1) interval = 1;
    else if (repetition_count === 2) interval = 6;
    else interval = Math.round(interval * ease_factor);
  }
  
  // Aktualizacja ease_factor
  ease_factor += 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02);
  ease_factor = Math.max(1.30, ease_factor);
  
  return { ease_factor, interval, repetition_count };
}
```

## 7. Obsługa błędów

| Kod | Scenariusz |
|-----|------------|
| 401 | Brak/nieprawidłowy token |
| 400 | Nieprawidłowy UUID lub rating |
| 404 | Fiszka nie istnieje/nie należy do użytkownika |
| 500 | Błąd bazy danych |

## 8. Etapy wdrożenia

### Krok 1: Schema walidacji

**Plik:** `src/lib/schemas/study-session.schema.ts`

```typescript
export const reviewFlashcardSchema = z.object({
  flashcard_id: z.string().uuid('Invalid flashcard ID'),
  rating: z.number().int().min(0).max(5, 'Rating must be between 0 and 5'),
});
```

### Krok 2: Rozszerzenie StudySessionService

**Plik:** `src/lib/services/study-session.service.ts`

```typescript
async reviewFlashcard(
  userId: string,
  input: ReviewFlashcardInput
): Promise<ReviewResultDTO | null> {
  // Pobranie aktualnych danych
  const { data: current, error: fetchError } = await this.supabase
    .from('flashcards')
    .select('ease_factor, interval, repetition_count')
    .eq('id', input.flashcard_id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !current) return null;

  // Obliczenie SM-2
  const newParams = this.calculateSM2(current, input.rating);
  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newParams.interval);

  // Aktualizacja
  const { data, error } = await this.supabase
    .from('flashcards')
    .update({
      ease_factor: newParams.ease_factor,
      interval: newParams.interval,
      repetition_count: newParams.repetition_count,
      next_review_date: nextReview.toISOString(),
      last_reviewed_at: now.toISOString(),
    })
    .eq('id', input.flashcard_id)
    .eq('user_id', userId)
    .select('id, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at')
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
}
```

### Krok 3: Endpoint API

**Plik:** `src/pages/api/study-session/review.ts`

```typescript
export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user;
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) return validationError('Invalid JSON body');

  const validation = reviewFlashcardSchema.safeParse(body);
  if (!validation.success) return validationError(validation.error);

  const service = new StudySessionService(locals.supabase);
  const result = await service.reviewFlashcard(user.id, validation.data);

  if (!result) return notFound('Flashcard not found');
  return new Response(JSON.stringify(result), { status: 200 });
};
```

### Pliki do utworzenia/modyfikacji

| Plik | Akcja |
|------|-------|
| `src/lib/schemas/study-session.schema.ts` | Modyfikacja |
| `src/lib/services/study-session.service.ts` | Modyfikacja |
| `src/pages/api/study-session/review.ts` | Nowy plik |

