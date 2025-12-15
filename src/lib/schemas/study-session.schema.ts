import { z } from 'zod';

/**
 * Schema walidacji dla parametrów query GET /api/study-session
 * Obsługuje konwersję string -> number dla limit z URL
 */
export const studySessionQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(50, 'Limit must be between 1 and 50')),
});

export type StudySessionQuery = z.infer<typeof studySessionQuerySchema>;

/**
 * Schema walidacji dla POST /api/study-session/review
 * Zapisuje wynik powtórki fiszki z oceną SM-2 (0-5)
 */
export const reviewFlashcardSchema = z.object({
  flashcard_id: z.string().uuid('Invalid flashcard ID'),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(0, 'Rating must be between 0 and 5')
    .max(5, 'Rating must be between 0 and 5'),
});

export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardSchema>;

