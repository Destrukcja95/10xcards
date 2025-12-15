import { z } from "zod";

/**
 * Schema walidacji dla żądania POST /api/generations
 * Tekst źródłowy musi mieć od 1000 do 10000 znaków
 */
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must be at most 10000 characters"),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
