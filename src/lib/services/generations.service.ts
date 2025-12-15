import type { SupabaseClient } from "../../db/supabase.client";
import type { GenerationResponseDTO } from "../../types";
import type { GenerateFlashcardsInput } from "../schemas/generations.schema";
import { OpenRouterError, OpenRouterService } from "./openrouter.service";

/**
 * Serwis obsługujący generowanie propozycji fiszek przez AI
 */
export class GenerationsService {
  private openRouterService: OpenRouterService;

  constructor(private supabase: SupabaseClient) {
    this.openRouterService = new OpenRouterService();
  }

  /**
   * Generuje propozycje fiszek na podstawie tekstu źródłowego
   *
   * Przepływ:
   * 1. Tworzy sesję generowania w bazie danych
   * 2. Wywołuje OpenRouter API do generowania fiszek
   * 3. Aktualizuje licznik wygenerowanych fiszek
   * 4. Zwraca propozycje (NIE zapisuje ich jako fiszki w bazie)
   *
   * @param userId - ID zalogowanego użytkownika
   * @param input - Zwalidowane dane wejściowe (source_text)
   * @returns GenerationResponseDTO z propozycjami fiszek
   * @throws OpenRouterError przy problemach z AI
   * @throws Error przy problemach z bazą danych
   */
  async generateFlashcards(userId: string, input: GenerateFlashcardsInput): Promise<GenerationResponseDTO> {
    // Krok 1: Utworzenie sesji generowania
    const { data: session, error: sessionError } = await this.supabase
      .from("generation_sessions")
      .insert({
        user_id: userId,
        source_text: input.source_text,
        generated_count: 0,
        accepted_count: 0,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      throw new Error(`Database error: ${sessionError?.message || "Failed to create generation session"}`);
    }

    try {
      // Krok 2: Generowanie propozycji przez AI
      const proposals = await this.openRouterService.generateFlashcards(input.source_text);

      // Krok 3: Aktualizacja licznika wygenerowanych
      const { error: updateError } = await this.supabase
        .from("generation_sessions")
        .update({ generated_count: proposals.length })
        .eq("id", session.id);

      if (updateError) {
        console.error("[GenerationsService] Failed to update generated_count:", updateError);
        // Nie przerywamy - propozycje zostały wygenerowane
      }

      // Krok 4: Zwrócenie propozycji
      return {
        generation_id: session.id,
        proposals,
        generated_count: proposals.length,
      };
    } catch (error) {
      // W przypadku błędu AI, sesja pozostaje z generated_count = 0
      // (pozwala na analizę nieudanych prób generowania)

      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw error;
    }
  }
}
