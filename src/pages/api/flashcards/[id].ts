import type { APIRoute } from "astro";

import { flashcardIdParamSchema, updateFlashcardSchema } from "../../../lib/schemas/flashcards.schema";
import { FlashcardsService } from "../../../lib/services/flashcards.service";
import type { ErrorDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/flashcards/:id
 * Pobiera pojedynczą fiszkę po ID dla zalogowanego użytkownika
 *
 * Path params:
 * - id: UUID - unikalny identyfikator fiszki
 *
 * Responses:
 * - 200: FlashcardDTO - dane fiszki
 * - 400: VALIDATION_ERROR - nieprawidłowy format UUID
 * - 401: UNAUTHORIZED - brak tokenu uwierzytelniającego
 * - 404: NOT_FOUND - fiszka nie istnieje lub należy do innego użytkownika
 * - 500: INTERNAL_ERROR - nieoczekiwany błąd serwera
 */
export const GET: APIRoute = async ({ locals, params }) => {
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

  // Walidacja parametru id (UUID)
  const validationResult = flashcardIdParamSchema.safeParse({ id: params.id });

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid flashcard ID format",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const service = new FlashcardsService(locals.supabase);
    const flashcard = await service.getFlashcardById(user.id, validationResult.data.id);

    if (!flashcard) {
      const errorResponse: ErrorDTO = {
        error: {
          code: "NOT_FOUND",
          message: "Flashcard not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/flashcards/:id] Error:", error);

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
 * PUT /api/flashcards/:id
 * Aktualizuje fiszkę (tylko pola front i/lub back)
 *
 * Path params:
 * - id: UUID - unikalny identyfikator fiszki
 *
 * Request body:
 * - front?: string (1-500 znaków) - przód fiszki
 * - back?: string (1-1000 znaków) - tył fiszki
 * Uwaga: Przynajmniej jedno pole musi być podane
 *
 * Responses:
 * - 200: FlashcardDTO - zaktualizowane dane fiszki
 * - 400: VALIDATION_ERROR - nieprawidłowy format UUID lub body
 * - 401: UNAUTHORIZED - brak tokenu uwierzytelniającego
 * - 404: NOT_FOUND - fiszka nie istnieje lub należy do innego użytkownika
 * - 500: INTERNAL_ERROR - nieoczekiwany błąd serwera
 */
export const PUT: APIRoute = async ({ locals, params, request }) => {
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

  // Walidacja parametru id (UUID)
  const idValidation = flashcardIdParamSchema.safeParse({ id: params.id });

  if (!idValidation.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid flashcard ID format",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
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

  // Walidacja body przez Zod
  const validationResult = updateFlashcardSchema.safeParse(body);

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
    const updatedFlashcard = await service.updateFlashcard(user.id, idValidation.data.id, validationResult.data);

    if (!updatedFlashcard) {
      const errorResponse: ErrorDTO = {
        error: {
          code: "NOT_FOUND",
          message: "Flashcard not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PUT /api/flashcards/:id] Error:", error);

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
 * DELETE /api/flashcards/:id
 * Usuwa fiszkę użytkownika
 *
 * Path params:
 * - id: UUID - unikalny identyfikator fiszki
 *
 * Responses:
 * - 204: No Content - fiszka została usunięta
 * - 400: VALIDATION_ERROR - nieprawidłowy format UUID
 * - 401: UNAUTHORIZED - brak tokenu uwierzytelniającego
 * - 404: NOT_FOUND - fiszka nie istnieje lub należy do innego użytkownika
 * - 500: INTERNAL_ERROR - nieoczekiwany błąd serwera
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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

  // Walidacja parametru id (UUID)
  const idValidation = flashcardIdParamSchema.safeParse({ id: params.id });

  if (!idValidation.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid flashcard ID format",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const service = new FlashcardsService(locals.supabase);
    const deleted = await service.deleteFlashcard(user.id, idValidation.data.id);

    if (!deleted) {
      const errorResponse: ErrorDTO = {
        error: {
          code: "NOT_FOUND",
          message: "Flashcard not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/flashcards/:id] Error:", error);

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
