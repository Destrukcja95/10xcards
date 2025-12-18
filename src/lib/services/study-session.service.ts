import type { SupabaseClient } from "../../db/supabase.client";
import type { StudySessionResponseDTO, StudySessionFlashcardDTO, ReviewResultDTO } from "../../types";
import type { StudySessionQuery, ReviewFlashcardInput } from "../schemas/study-session.schema";

/**
 * Parametry algorytmu SM-2 używane do obliczeń
 */
interface SM2Params {
  ease_factor: number;
  interval: number;
  repetition_count: number;
}

/**
 * Serwis obsługujący sesję nauki z wykorzystaniem algorytmu SM-2
 * Pobiera fiszki wymagające powtórki (next_review_date <= now)
 */
export class StudySessionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera fiszki do powtórki dla użytkownika
   * Zwraca fiszki, których next_review_date <= bieżąca data,
   * posortowane od najstarszych (najważniejsze do powtórki pierwsze)
   *
   * @param userId - ID użytkownika (z auth)
   * @param params - Parametry zapytania (limit)
   * @returns Lista fiszek do powtórki z metadanymi
   */
  async getStudySession(userId: string, params: StudySessionQuery): Promise<StudySessionResponseDTO> {
    const { limit } = params;
    const now = new Date().toISOString();

    // Pobranie total_due - całkowita liczba fiszek wymagających powtórki
    const { count: totalDue, error: countError } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_date", now);

    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }

    // Pobranie fiszek do powtórki z limitem
    // Selekcja tylko pól wymaganych w StudySessionFlashcardDTO
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("id, front, back, ease_factor, interval, repetition_count")
      .eq("user_id", userId)
      .lte("next_review_date", now)
      .order("next_review_date", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const flashcards: StudySessionFlashcardDTO[] = data ?? [];

    return {
      data: flashcards,
      count: flashcards.length,
      total_due: totalDue ?? 0,
    };
  }

  /**
   * Zapisuje wynik powtórki fiszki i aktualizuje parametry SM-2
   *
   * @param userId - ID użytkownika (z auth)
   * @param input - Dane powtórki (flashcard_id, rating)
   * @returns Zaktualizowane parametry SM-2 lub null jeśli fiszka nie istnieje
   */
  async reviewFlashcard(userId: string, input: ReviewFlashcardInput): Promise<ReviewResultDTO | null> {
    // Pobranie aktualnych parametrów SM-2 dla fiszki
    const { data: current, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("ease_factor, interval, repetition_count")
      .eq("id", input.flashcard_id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !current) {
      return null;
    }

    // Obliczenie nowych parametrów SM-2
    const newParams = this.calculateSM2(current, input.rating);
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + newParams.interval);

    // Aktualizacja fiszki w bazie danych
    const { data, error } = await this.supabase
      .from("flashcards")
      .update({
        ease_factor: newParams.ease_factor,
        interval: newParams.interval,
        repetition_count: newParams.repetition_count,
        next_review_date: nextReview.toISOString(),
        last_reviewed_at: now.toISOString(),
      })
      .eq("id", input.flashcard_id)
      .eq("user_id", userId)
      .select("id, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at")
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Implementacja algorytmu SM-2 (SuperMemo 2)
   *
   * Skala ocen:
   * 0 = Całkowita pustka, brak przypomnienia
   * 1 = Błąd, ale rozpoznano poprawną odpowiedź
   * 2 = Błąd, ale odpowiedź wydawała się łatwa
   * 3 = Poprawnie z dużą trudnością
   * 4 = Poprawnie z pewnym wahaniem
   * 5 = Perfekcyjna odpowiedź
   *
   * @param current - Aktualne parametry SM-2
   * @param rating - Ocena użytkownika (0-5)
   * @returns Nowe parametry SM-2
   */
  private calculateSM2(current: SM2Params, rating: number): SM2Params {
    let { ease_factor, interval, repetition_count } = current;

    if (rating < 3) {
      // Błędna odpowiedź - reset powtórek
      repetition_count = 0;
      interval = 1;
    } else {
      // Poprawna odpowiedź - zwiększ interwał
      repetition_count += 1;

      if (repetition_count === 1) {
        interval = 1;
      } else if (repetition_count === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease_factor);
      }
    }

    // Aktualizacja współczynnika łatwości (ease_factor)
    // Wzór SM-2: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ease_factor += 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02);

    // Minimalny ease_factor to 1.30
    ease_factor = Math.max(1.3, ease_factor);

    return { ease_factor, interval, repetition_count };
  }
}
