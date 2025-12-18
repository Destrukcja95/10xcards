import type { APIRoute } from "astro";

import { studySessionQuerySchema } from "../../lib/schemas/study-session.schema";
import { StudySessionService } from "../../lib/services/study-session.service";
import type { ErrorDTO } from "../../types";

export const prerender = false;

/**
 * GET /api/study-session
 * Pobiera fiszki wymagające powtórki na podstawie algorytmu SM-2
 *
 * Zwraca fiszki, których next_review_date <= bieżąca data,
 * posortowane od najstarszych (najważniejsze do powtórki pierwsze)
 *
 * Query params:
 * - limit: number (default: 20, max: 50) - maksymalna liczba fiszek do zwrócenia
 *
 * Response:
 * - data: StudySessionFlashcardDTO[] - fiszki do powtórki
 * - count: number - liczba zwróconych fiszek
 * - total_due: number - całkowita liczba fiszek wymagających powtórki
 */
export const GET: APIRoute = async ({ locals, url }) => {
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
  const validationResult = studySessionQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: validationResult.error.errors[0]?.message || "Invalid query parameters",
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
    const service = new StudySessionService(locals.supabase);
    const result = await service.getStudySession(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/study-session] Error:", error);

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
