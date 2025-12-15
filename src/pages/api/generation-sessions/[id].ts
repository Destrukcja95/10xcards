import type { APIRoute } from 'astro';

import { sessionIdParamSchema, updateSessionSchema } from '../../../lib/schemas/generation-sessions.schema';
import { GenerationSessionsService } from '../../../lib/services/generation-sessions.service';
import type { ErrorDTO } from '../../../types';

export const prerender = false;

/**
 * PATCH /api/generation-sessions/:id
 * Aktualizuje sesję generowania (accepted_count) dla zalogowanego użytkownika
 *
 * Path params:
 * - id: UUID - unikalny identyfikator sesji generowania
 *
 * Request body:
 * - accepted_count: number (integer >= 0) - liczba zaakceptowanych fiszek
 *
 * Responses:
 * - 200: GenerationSessionDTO - zaktualizowane dane sesji
 * - 400: VALIDATION_ERROR - nieprawidłowy format UUID lub body
 * - 401: UNAUTHORIZED - brak tokenu uwierzytelniającego
 * - 404: NOT_FOUND - sesja nie istnieje lub należy do innego użytkownika
 * - 500: INTERNAL_ERROR - nieoczekiwany błąd serwera
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
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

  // Walidacja parametru id (UUID)
  const idValidation = sessionIdParamSchema.safeParse({ id: params.id });

  if (!idValidation.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid session ID format',
      },
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

  // Walidacja body przez Zod
  const bodyValidation = updateSessionSchema.safeParse(body);

  if (!bodyValidation.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'VALIDATION_ERROR',
        message: bodyValidation.error.errors[0]?.message || 'Invalid request payload',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const service = new GenerationSessionsService(locals.supabase);
    const result = await service.updateSession(user.id, idValidation.data.id, bodyValidation.data);

    if (!result) {
      const errorResponse: ErrorDTO = {
        error: {
          code: 'NOT_FOUND',
          message: 'Generation session not found',
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
    console.error('[PATCH /api/generation-sessions/:id] Error:', error);

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

