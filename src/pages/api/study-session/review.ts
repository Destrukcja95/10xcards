import type { APIRoute } from 'astro';

import { reviewFlashcardSchema } from '../../../lib/schemas/study-session.schema';
import { StudySessionService } from '../../../lib/services/study-session.service';
import type { ErrorDTO } from '../../../types';

export const prerender = false;

/**
 * POST /api/study-session/review
 * Zapisuje wynik powtórki fiszki i aktualizuje parametry algorytmu SM-2
 *
 * Na podstawie oceny użytkownika (0-5) oblicza nowy współczynnik łatwości,
 * interwał i datę następnej powtórki.
 *
 * Request body:
 * - flashcard_id: string (UUID) - identyfikator fiszki
 * - rating: number (0-5) - ocena SM-2
 *   0 = Całkowita pustka, brak przypomnienia
 *   1 = Błąd, ale rozpoznano poprawną odpowiedź
 *   2 = Błąd, ale odpowiedź wydawała się łatwa
 *   3 = Poprawnie z dużą trudnością
 *   4 = Poprawnie z pewnym wahaniem
 *   5 = Perfekcyjna odpowiedź
 *
 * Response (200 OK):
 * - id: string - identyfikator fiszki
 * - ease_factor: number - współczynnik łatwości
 * - interval: number - interwał w dniach
 * - repetition_count: number - liczba powtórek
 * - next_review_date: string - data następnej powtórki
 * - last_reviewed_at: string - data ostatniej powtórki
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user;

  // Weryfikacja autoryzacji
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

  // Parsowanie JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON body',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Walidacja przez Zod
  const validationResult = reviewFlashcardSchema.safeParse(body);

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors[0]?.message || 'Invalid request payload',
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
    const service = new StudySessionService(locals.supabase);
    const result = await service.reviewFlashcard(user.id, validationResult.data);

    // Fiszka nie istnieje lub nie należy do użytkownika
    if (!result) {
      const errorResponse: ErrorDTO = {
        error: {
          code: 'NOT_FOUND',
          message: 'Flashcard not found',
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[POST /api/study-session/review] Error:', error);

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

