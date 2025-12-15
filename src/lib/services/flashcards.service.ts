import type { SupabaseClient } from '../../db/supabase.client';
import type { FlashcardDTO, FlashcardsListResponseDTO } from '../../types';
import type { CreateFlashcardsInput, GetFlashcardsQuery, UpdateFlashcardInput } from '../schemas/flashcards.schema';

/**
 * Serwis obsługujący operacje na fiszkach
 */
export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera paginowaną listę fiszek użytkownika
   * @param userId - ID użytkownika (z auth)
   * @param params - Parametry zapytania (page, limit, sort, order)
   * @returns Lista fiszek z metadanymi paginacji
   */
  async getFlashcards(userId: string, params: GetFlashcardsQuery): Promise<FlashcardsListResponseDTO> {
    const { page, limit, sort, order } = params;
    const offset = (page - 1) * limit;

    // Pobranie total count
    const { count, error: countError } = await this.supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Pobranie danych z paginacją - jawna selekcja pól (bez user_id)
    const { data, error } = await this.supabase
      .from('flashcards')
      .select(
        'id, front, back, source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at, updated_at'
      )
      .eq('user_id', userId)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const flashcards: FlashcardDTO[] = data ?? [];

    return {
      data: flashcards,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Tworzy jedną lub wiele fiszek dla użytkownika
   * @param userId - ID użytkownika (z auth)
   * @param input - Dane fiszek do utworzenia
   * @returns Lista utworzonych fiszek
   */
  async createFlashcards(userId: string, input: CreateFlashcardsInput): Promise<FlashcardDTO[]> {
    // Mapowanie danych wejściowych z dodaniem user_id
    const flashcardsToInsert = input.flashcards.map((fc) => ({
      user_id: userId,
      front: fc.front,
      back: fc.back,
      source: fc.source,
      // Domyślne wartości SM-2 są ustawiane przez bazę danych
    }));

    const { data, error } = await this.supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select(
        'id, front, back, source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at, updated_at'
      );

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Pobiera pojedynczą fiszkę użytkownika po ID
   * @param userId - ID użytkownika (z auth)
   * @param flashcardId - UUID fiszki do pobrania
   * @returns Fiszka lub null jeśli nie znaleziono
   */
  async getFlashcardById(userId: string, flashcardId: string): Promise<FlashcardDTO | null> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select(
        'id, front, back, source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at, updated_at'
      )
      .eq('id', flashcardId)
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = No rows found - zwracamy null zamiast rzucać błąd
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Usuwa fiszkę użytkownika (hard delete)
   * @param userId - ID użytkownika (z auth)
   * @param flashcardId - ID fiszki do usunięcia
   * @returns true jeśli fiszka została usunięta, false jeśli nie znaleziono
   */
  async deleteFlashcard(userId: string, flashcardId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('flashcards')
      .delete({ count: 'exact' })
      .eq('id', flashcardId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return count !== null && count > 0;
  }

  /**
   * Aktualizuje fiszkę użytkownika (tylko pola front/back)
   * @param userId - ID użytkownika (z auth)
   * @param flashcardId - UUID fiszki do aktualizacji
   * @param input - Dane do aktualizacji (front i/lub back)
   * @returns Zaktualizowana fiszka lub null jeśli nie znaleziono
   */
  async updateFlashcard(
    userId: string,
    flashcardId: string,
    input: UpdateFlashcardInput
  ): Promise<FlashcardDTO | null> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .update(input)
      .eq('id', flashcardId)
      .eq('user_id', userId)
      .select(
        'id, front, back, source, ease_factor, interval, repetition_count, next_review_date, last_reviewed_at, created_at, updated_at'
      )
      .single();

    if (error) {
      // PGRST116 = No rows found - zwracamy null zamiast rzucać błąd
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }
}

