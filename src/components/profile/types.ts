import type { GenerationSessionDTO, PaginationDTO } from "@/types";

// ============================================================================
// PROFILE STATS DTO
// ============================================================================

/**
 * Statystyki fiszek użytkownika
 */
export interface ProfileStatsDTO {
  /** Łączna liczba fiszek */
  totalFlashcards: number;
  /** Fiszki źródło: ai_generated */
  aiFlashcards: number;
  /** Fiszki źródło: manual */
  manualFlashcards: number;
  /** Wskaźnik akceptacji AI (%) */
  acceptanceRate: number;
}

// ============================================================================
// DELETE ACCOUNT DIALOG STATE
// ============================================================================

/**
 * Stan dialogu usunięcia konta
 */
export interface DeleteAccountDialogState {
  isOpen: boolean;
  step: 1 | 2;
  confirmInput: string;
}

// ============================================================================
// VIEW STATE
// ============================================================================

/**
 * Stan głównego widoku profilu
 */
export interface ProfileViewState {
  // Statystyki
  stats: ProfileStatsDTO | null;
  statsLoading: boolean;
  statsError: string | null;

  // Historia generowania
  sessions: GenerationSessionDTO[];
  sessionsPagination: PaginationDTO | null;
  sessionsLoading: boolean;
  sessionsError: string | null;
  sessionsPage: number;

  // Usuwanie konta
  deleteDialogOpen: boolean;
  deleteDialogStep: 1 | 2;
  deleteConfirmInput: string;
  isDeleting: boolean;
  deleteError: string | null;

  // Ogólne
  successMessage: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Domyślna liczba sesji na stronę */
export const DEFAULT_SESSIONS_PAGE_SIZE = 10;

/** Tekst wymagany do potwierdzenia usunięcia konta */
export const DELETE_CONFIRMATION_TEXT = "USUŃ";

// ============================================================================
// REDUCER ACTION TYPES
// ============================================================================

/**
 * Akcje reducera widoku profilu
 */
export type ProfileViewAction =
  // Stats actions
  | { type: "FETCH_STATS_START" }
  | { type: "FETCH_STATS_SUCCESS"; payload: ProfileStatsDTO }
  | { type: "FETCH_STATS_ERROR"; payload: string }
  // Sessions actions
  | { type: "FETCH_SESSIONS_START" }
  | {
      type: "FETCH_SESSIONS_SUCCESS";
      payload: { sessions: GenerationSessionDTO[]; pagination: PaginationDTO };
    }
  | { type: "FETCH_SESSIONS_ERROR"; payload: string }
  | { type: "SET_SESSIONS_PAGE"; payload: number }
  // Delete account actions
  | { type: "OPEN_DELETE_DIALOG" }
  | { type: "CLOSE_DELETE_DIALOG" }
  | { type: "SET_DELETE_STEP"; payload: 1 | 2 }
  | { type: "SET_DELETE_CONFIRM_INPUT"; payload: string }
  | { type: "DELETE_START" }
  | { type: "DELETE_SUCCESS" }
  | { type: "DELETE_ERROR"; payload: string }
  // General actions
  | { type: "CLEAR_ERROR" }
  | { type: "CLEAR_SUCCESS" };
