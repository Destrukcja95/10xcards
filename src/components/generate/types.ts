import type { GenerationResponseDTO } from "@/types";

/**
 * Status pojedynczej propozycji fiszki
 */
export type ProposalStatus = "pending" | "accepted" | "editing" | "rejected";

/**
 * ViewModel dla pojedynczej propozycji fiszki
 * Rozszerza FlashcardProposalDTO o stan UI
 */
export interface ProposalViewModel {
  /** Unikalny identyfikator propozycji (generowany lokalnie) */
  id: string;
  /** Przód fiszki (pytanie) */
  front: string;
  /** Tył fiszki (odpowiedź) */
  back: string;
  /** Aktualny stan propozycji w UI */
  status: ProposalStatus;
  /** Oryginalne wartości przed edycją (do funkcji Cofnij) */
  originalFront: string;
  originalBack: string;
}

/**
 * ViewModel dla informacji o rate limit
 */
export interface RateLimitInfoViewModel {
  /** Pozostała liczba generowań */
  remaining: number;
  /** Data resetu limitu (null jeśli nie ograniczony) */
  resetAt: Date | null;
  /** Czy limit został przekroczony */
  isLimited: boolean;
}

/**
 * Stan głównego widoku generowania
 */
export interface GenerateViewState {
  /** Tekst źródłowy z textarea */
  sourceText: string;
  /** Czy trwa generowanie (loading) */
  isGenerating: boolean;
  /** Czy trwa zapisywanie fiszek */
  isSaving: boolean;
  /** ID sesji generowania (z odpowiedzi API) */
  generationId: string | null;
  /** Lista propozycji fiszek */
  proposals: ProposalViewModel[];
  /** Informacje o rate limit */
  rateLimit: RateLimitInfoViewModel;
  /** Komunikat błędu (null jeśli brak) */
  error: string | null;
  /** Komunikat sukcesu (null jeśli brak) */
  successMessage: string | null;
}

/**
 * Typ akcji dla reducera stanu
 */
export type GenerateViewAction =
  | { type: "SET_SOURCE_TEXT"; payload: string }
  | { type: "START_GENERATION" }
  | { type: "GENERATION_SUCCESS"; payload: GenerationResponseDTO }
  | { type: "GENERATION_ERROR"; payload: string }
  | { type: "ACCEPT_PROPOSAL"; payload: string }
  | { type: "REJECT_PROPOSAL"; payload: string }
  | { type: "START_EDITING"; payload: string }
  | { type: "SAVE_EDIT"; payload: { id: string; front: string; back: string } }
  | { type: "CANCEL_EDIT"; payload: string }
  | { type: "UNDO_PROPOSAL"; payload: string }
  | { type: "ACCEPT_ALL" }
  | { type: "REJECT_ALL" }
  | { type: "START_SAVING" }
  | { type: "SAVE_SUCCESS"; payload: number }
  | { type: "SAVE_ERROR"; payload: string }
  | { type: "UPDATE_RATE_LIMIT"; payload: RateLimitInfoViewModel }
  | { type: "CLEAR_ERROR" }
  | { type: "CLEAR_SUCCESS" };

/**
 * Stałe walidacji
 */
export const VALIDATION_CONSTANTS = {
  SOURCE_TEXT_MIN_LENGTH: 1000,
  SOURCE_TEXT_MAX_LENGTH: 10000,
  FRONT_MAX_LENGTH: 500,
  BACK_MAX_LENGTH: 1000,
  RATE_LIMIT_MAX: 10,
} as const;

