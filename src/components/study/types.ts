import type { StudySessionFlashcardDTO, ReviewResultDTO, SM2Rating } from "@/types";

// ============================================================================
// VIEW STATE
// ============================================================================

/**
 * Stan widoku sesji nauki
 */
export interface StudyViewState {
  /** Lista fiszek do powtórki w bieżącej sesji */
  flashcards: StudySessionFlashcardDTO[];
  /** Indeks aktualnie wyświetlanej fiszki (0-based) */
  currentIndex: number;
  /** Czy karta jest odwrócona (pokazuje tył) */
  isFlipped: boolean;
  /** Czy trwa ładowanie sesji */
  isLoading: boolean;
  /** Czy trwa wysyłanie oceny */
  isSubmitting: boolean;
  /** Komunikat błędu */
  error: string | null;
  /** Wynik ostatniej oceny (do NextReviewInfo) */
  lastReviewResult: ReviewResultDTO | null;
  /** Całkowita liczba fiszek do powtórki (z API) */
  totalDue: number;
  /** Liczba przejrzanych fiszek w tej sesji */
  reviewedCount: number;
  /** Czy sesja została ukończona */
  isComplete: boolean;
}

// ============================================================================
// REDUCER ACTION TYPES
// ============================================================================

/**
 * Akcje reducera widoku sesji nauki
 */
export type StudyViewAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { flashcards: StudySessionFlashcardDTO[]; totalDue: number } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "FLIP_CARD" }
  | { type: "REVIEW_START" }
  | { type: "REVIEW_SUCCESS"; payload: ReviewResultDTO }
  | { type: "REVIEW_ERROR"; payload: string }
  | { type: "NEXT_CARD" }
  | { type: "COMPLETE_SESSION" }
  | { type: "RESET_SESSION" }
  | { type: "CLEAR_ERROR" };

// ============================================================================
// RATING BUTTON CONFIG
// ============================================================================

/**
 * Wariant kolorystyczny przycisku oceny
 */
export type RatingButtonVariant = "destructive" | "warning" | "secondary" | "success";

/**
 * Konfiguracja pojedynczego przycisku oceny SM-2
 */
export interface RatingButtonConfig {
  label: string;
  rating: SM2Rating;
  variant: RatingButtonVariant;
  shortcut: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Domyślny limit fiszek na sesję nauki */
export const STUDY_SESSION_LIMIT = 20;

/** Czas wyświetlania informacji o następnej powtórce (ms) */
export const NEXT_REVIEW_DISPLAY_DURATION = 2000;

/**
 * Konfiguracja przycisków oceny
 * Mapowanie przycisków UI na rating SM-2
 */
export const RATING_BUTTONS: RatingButtonConfig[] = [
  {
    label: "Nie pamiętam",
    rating: 1,
    variant: "destructive",
    shortcut: "1",
    description: "Całkowity brak pamięci, reset interwału",
  },
  {
    label: "Trudne",
    rating: 3,
    variant: "warning",
    shortcut: "2",
    description: "Poprawna odpowiedź z dużą trudnością",
  },
  {
    label: "Dobre",
    rating: 4,
    variant: "secondary",
    shortcut: "3",
    description: "Poprawna odpowiedź z lekkim wahaniem",
  },
  {
    label: "Łatwe",
    rating: 5,
    variant: "success",
    shortcut: "4",
    description: "Natychmiastowa, perfekcyjna odpowiedź",
  },
];

/**
 * Mapowanie klawiszy na rating SM-2
 */
export const KEY_TO_RATING: Record<string, SM2Rating> = {
  "1": 1,
  "2": 3,
  "3": 4,
  "4": 5,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formatowanie interwału na czytelny tekst po polsku
 */
export function formatInterval(days: number): string {
  if (days === 0) return "dzisiaj";
  if (days === 1) return "jutro";
  if (days < 7) return `za ${days} dni`;
  if (days === 7) return "za tydzień";
  if (days < 14) return `za ${Math.ceil(days / 7)} tydzień`;
  if (days < 30) return `za ${Math.round(days / 7)} tygodni`;
  if (days < 60) return "za miesiąc";
  return `za ${Math.round(days / 30)} miesięcy`;
}

