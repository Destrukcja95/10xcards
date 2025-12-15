import type { APIRoute } from "astro";

import { generateFlashcardsSchema } from "../../lib/schemas/generations.schema";
import { GenerationsService } from "../../lib/services/generations.service";
import { OpenRouterError } from "../../lib/services/openrouter.service";
import { checkGenerationsRateLimit } from "../../lib/services/rate-limiter";
import type { ErrorDTO, GenerationResponseDTO } from "../../types";

export const prerender = false;

/**
 * POST /api/generations
 * Generuje propozycje fiszek przez AI na podstawie tekstu źródłowego
 *
 * Request body:
 * - source_text: string (1000-10000 znaków) - tekst źródłowy do analizy
 *
 * Response:
 * - 200: GenerationResponseDTO z propozycjami fiszek
 * - 400: Błąd walidacji (nieprawidłowy JSON lub długość tekstu)
 * - 401: Brak autoryzacji
 * - 429: Przekroczono limit żądań (rate limiting od OpenRouter)
 * - 500: Błąd wewnętrzny
 * - 503: Serwis AI niedostępny
 */
export const POST: APIRoute = async ({ locals, request }) => {
  // Sprawdzenie autoryzacji - middleware ustawia user w locals
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

  // Sprawdzenie rate limit (10 żądań na godzinę per użytkownik)
  if (!checkGenerationsRateLimit(user.id)) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "RATE_LIMITED",
        message: "Too many generation requests. Please try again later.",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 429,
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
  const validationResult = generateFlashcardsSchema.safeParse(body);

  if (!validationResult.success) {
    const errorResponse: ErrorDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: validationResult.error.errors[0]?.message || "Invalid request payload",
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
    const service = new GenerationsService(locals.supabase);
    const result: GenerationResponseDTO = await service.generateFlashcards(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /api/generations] Error:", error);

    // Obsługa błędów OpenRouter
    if (error instanceof OpenRouterError) {
      if (error.code === "RATE_LIMITED") {
        const errorResponse: ErrorDTO = {
          error: {
            code: "RATE_LIMITED",
            message: "Too many generation requests. Please try again later.",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.code === "SERVICE_UNAVAILABLE") {
        const errorResponse: ErrorDTO = {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "AI service is temporarily unavailable. Please try again later.",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      // PARSE_ERROR - błąd wewnętrzny (AI zwróciło nieprawidłową odpowiedź)
      const errorResponse: ErrorDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate flashcards. Please try again.",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Inne błędy (np. baza danych)
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
