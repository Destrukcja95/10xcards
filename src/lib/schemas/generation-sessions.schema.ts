import { z } from "zod";

/**
 * Schema walidacji dla parametrów query GET /api/generation-sessions
 * Obsługuje konwersję string -> number dla page/limit z URL
 */
export const generationSessionsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, "Page must be at least 1")),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100, "Limit must be between 1 and 100")),
});

export type GenerationSessionsQuery = z.infer<typeof generationSessionsQuerySchema>;

/**
 * Schema walidacji dla parametru id sesji (UUID)
 * Używany w PATCH /api/generation-sessions/:id
 */
export const sessionIdParamSchema = z.object({
  id: z.string().uuid("Invalid session ID format"),
});

export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;

/**
 * Schema walidacji dla body PATCH /api/generation-sessions/:id
 * Pozwala zaktualizować liczbę zaakceptowanych fiszek
 */
export const updateSessionSchema = z.object({
  accepted_count: z.number().int("accepted_count must be an integer").min(0, "accepted_count must be non-negative"),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
