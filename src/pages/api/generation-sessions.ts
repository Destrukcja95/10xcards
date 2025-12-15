import type { APIRoute } from 'astro';

import { generationSessionsQuerySchema } from '../../lib/schemas/generation-sessions.schema';
import { GenerationSessionsService } from '../../lib/services/generation-sessions.service';
import type { ErrorDTO } from '../../types';

export const prerender = false;

/**
 * GET /api/generation-sessions
 * Pobiera paginowaną historię sesji generowania fiszek przez AI
 *
 * Query params:
 * - page: number (default: 1) - numer strony
 * - limit: number (default: 20, max: 100) - liczba elementów na stronie
 *
 * Response:
 * - data: lista sesji (id, generated_count, accepted_count, created_at)
 * - pagination: metadane paginacji
 * - summary: statystyki (total_generated, total_accepted, acceptance_rate)
 */
export const GET: APIRoute = async ({ locals, url }) => {
  // Sprawdzenie autoryzacji - użytkownik musi być zalogowany
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
  const validationResult = generationSessionsQuerySchema.safeParse(queryParams);

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
    const service = new GenerationSessionsService(locals.supabase);
    const result = await service.getSessions(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET /api/generation-sessions] Error:', error);

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

