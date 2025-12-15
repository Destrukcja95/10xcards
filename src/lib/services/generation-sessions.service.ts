import type { SupabaseClient } from '../../db/supabase.client';
import type { GenerationSessionDTO, GenerationSessionsListResponseDTO } from '../../types';
import type { GenerationSessionsQuery, UpdateSessionInput } from '../schemas/generation-sessions.schema';

/**
 * Serwis obsługujący operacje na sesjach generowania fiszek przez AI
 */
export class GenerationSessionsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Pobiera paginowaną listę sesji generowania użytkownika wraz z podsumowaniem statystyk
   * @param userId - ID użytkownika (z auth)
   * @param params - Parametry zapytania (page, limit)
   * @returns Lista sesji z metadanymi paginacji i podsumowaniem
   */
  async getSessions(userId: string, params: GenerationSessionsQuery): Promise<GenerationSessionsListResponseDTO> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    // Pobranie total count
    const { count, error: countError } = await this.supabase
      .from('generation_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Pobranie sesji z paginacją - jawna selekcja pól (bez user_id i source_text)
    const { data, error } = await this.supabase
      .from('generation_sessions')
      .select('id, generated_count, accepted_count, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Pobranie danych do obliczenia summary (wszystkie sesje użytkownika)
    const { data: summaryData, error: summaryError } = await this.supabase
      .from('generation_sessions')
      .select('generated_count, accepted_count')
      .eq('user_id', userId);

    if (summaryError) {
      throw new Error(`Database error: ${summaryError.message}`);
    }

    // Obliczenie statystyk podsumowania
    const totalGenerated = summaryData?.reduce((sum, s) => sum + s.generated_count, 0) ?? 0;
    const totalAccepted = summaryData?.reduce((sum, s) => sum + s.accepted_count, 0) ?? 0;
    const acceptanceRate = totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 10000) / 100 : 0;

    const sessions: GenerationSessionDTO[] = data ?? [];

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
      summary: {
        total_generated: totalGenerated,
        total_accepted: totalAccepted,
        acceptance_rate: acceptanceRate,
      },
    };
  }

  /**
   * Aktualizuje sesję generowania (accepted_count)
   * @param userId - ID użytkownika (z auth)
   * @param sessionId - UUID sesji generowania
   * @param input - Dane do aktualizacji (accepted_count)
   * @returns Zaktualizowana sesja lub null jeśli nie znaleziono
   */
  async updateSession(
    userId: string,
    sessionId: string,
    input: UpdateSessionInput
  ): Promise<GenerationSessionDTO | null> {
    const { data, error } = await this.supabase
      .from('generation_sessions')
      .update({ accepted_count: input.accepted_count })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select('id, generated_count, accepted_count, created_at')
      .single();

    if (error) {
      // PGRST116 = "No rows returned" - sesja nie istnieje lub nie należy do użytkownika
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }
}

