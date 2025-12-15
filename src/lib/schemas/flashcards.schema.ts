import { z } from 'zod';

/**
 * Schema walidacji dla parametrów query GET /api/flashcards
 * Obsługuje konwersję string -> number dla page/limit z URL
 */
export const getFlashcardsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100, 'Limit must be between 1 and 100')),
  sort: z.enum(['created_at', 'updated_at', 'next_review_date']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetFlashcardsQuery = z.infer<typeof getFlashcardsQuerySchema>;

// ============================================================================
// CREATE FLASHCARDS SCHEMAS
// ============================================================================

/**
 * Schema walidacji dla pojedynczej fiszki w żądaniu POST /api/flashcards
 */
export const createFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, 'Front text is required')
    .max(500, 'Front text must be at most 500 characters'),
  back: z
    .string()
    .min(1, 'Back text is required')
    .max(1000, 'Back text must be at most 1000 characters'),
  source: z.enum(['ai_generated', 'manual'], {
    errorMap: () => ({ message: "Source must be 'ai_generated' or 'manual'" }),
  }),
});

/**
 * Schema walidacji dla żądania POST /api/flashcards
 * Obsługuje batch creation z limitem 100 fiszek
 */
export const createFlashcardsSchema = z.object({
  flashcards: z
    .array(createFlashcardSchema)
    .min(1, 'At least one flashcard is required')
    .max(100, 'Maximum 100 flashcards can be created at once'),
});

export type CreateFlashcardsInput = z.infer<typeof createFlashcardsSchema>;

// ============================================================================
// FLASHCARD ID PARAMETER SCHEMA
// ============================================================================

/**
 * Schema walidacji dla parametru id fiszki (UUID)
 * Używana w endpointach /api/flashcards/:id
 */
export const flashcardIdParamSchema = z.object({
  id: z.string().uuid('Invalid flashcard ID format'),
});

export type FlashcardIdParam = z.infer<typeof flashcardIdParamSchema>;

// ============================================================================
// UPDATE FLASHCARD SCHEMA
// ============================================================================

/**
 * Schema walidacji dla PUT /api/flashcards/:id
 * Przynajmniej jedno pole (front lub back) musi być podane
 */
export const updateFlashcardSchema = z
  .object({
    front: z
      .string()
      .min(1, 'Front text cannot be empty')
      .max(500, 'Front text must be at most 500 characters')
      .optional(),
    back: z
      .string()
      .min(1, 'Back text cannot be empty')
      .max(1000, 'Back text must be at most 1000 characters')
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: 'At least one field (front or back) must be provided',
  });

export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;

