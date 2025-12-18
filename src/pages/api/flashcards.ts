import type { APIRoute } from "astro";

import { createFlashcardsSchema, getFlashcardsQuerySchema } from "../../lib/schemas/flashcards.schema";
import { FlashcardsService } from "../../lib/services/flashcards.service";
import type { CreateFlashcardsResponseDTO, ErrorDTO } from "../../types";

export const prerender = false;

/**
 * GET /api/flashcards
 * Pobiera paginowaną listę fiszek zalogowanego użytkownika
 *
 * Query params:
 * - page: number (default: 1) - numer strony
 * - limit: number (default: 20, max: 100) - liczba elementów na stronie
 * - sort: 'created_at' | 'updated_at' | 'next_review_date' (default: 'created_at')
 * - order: 'asc' | 'desc' (default: 'desc')
 */
export const GET: APIRoute = async ({ locals, url }) => {
  // Użytkownik jest już zweryfikowany przez middleware
  const user = locals.user;

  if (!user) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authentication token",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parsowanie i walidacja query params
  const queryParams = Object.fromEntries(url.searchParams);
  const validationResult = getFlashcardsQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: validationResult.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const service = new FlashcardsService(locals.supabase);
    const result = await service.getFlashcards(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/flashcards] Error:", error);

    const errorResponse: ErrorDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/flashcards
 * Tworzy jedną lub wiele fiszek dla zalogowanego użytkownika
 *
 * Request body:
 * - flashcards: array (min: 1, max: 100) - tablica fiszek do utworzenia
 *   - front: string (1-500 znaków) - przód fiszki
 *   - back: string (1-1000 znaków) - tył fiszki
 *   - source: 'ai_generated' | 'manual' - źródło fiszki
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user;

  if (!user) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authentication token",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parsowanie JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Walidacja przez Zod
  const validationResult = createFlashcardsSchema.safeParse(body);

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: validationResult.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const service = new FlashcardsService(locals.supabase);
    const createdFlashcards = await service.createFlashcards(user.id, validationResult.data);

    const response: CreateFlashcardsResponseDTO = {
      data: createdFlashcards,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /api/flashcards] Error:", error);

    const errorResponse: ErrorDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
