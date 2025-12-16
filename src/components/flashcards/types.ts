import type { FlashcardDTO, PaginationDTO } from "@/types";

// ============================================================================
// SORTING TYPES
// ============================================================================

/** Opcje sortowania listy fiszek */
export type SortOption = "created_at" | "updated_at" | "next_review_date";

/** Kierunek sortowania */
export type SortOrder = "asc" | "desc";

/** Kombinowana wartość sortowania dla selecta */
export type SortValue = `${SortOption}_${SortOrder}`;

// ============================================================================
// DIALOG TYPES
// ============================================================================

/** Tryb dialogu formularza */
export type FlashcardDialogMode = "create" | "edit" | null;

/** Stan dialogu formularza */
export interface FlashcardDialogState {
  mode: FlashcardDialogMode;
  flashcard: FlashcardDTO | null;
}

/** Stan dialogu usunięcia */
export interface DeleteDialogState {
  isOpen: boolean;
  flashcard: FlashcardDTO | null;
}

// ============================================================================
// VIEW STATE
// ============================================================================

/** Stan głównego widoku fiszek */
export interface FlashcardsViewState {
  /** Lista fiszek z aktualnej strony */
  flashcards: FlashcardDTO[];
  /** Metadane paginacji */
  pagination: PaginationDTO | null;
  /** Czy trwa ładowanie listy */
  isLoading: boolean;
  /** Czy trwa zapisywanie (create/update) */
  isSaving: boolean;
  /** Czy trwa usuwanie */
  isDeleting: boolean;
  /** Komunikat błędu */
  error: string | null;
  /** Komunikat sukcesu */
  successMessage: string | null;
  /** Aktualne pole sortowania */
  sortBy: SortOption;
  /** Aktualny kierunek sortowania */
  sortOrder: SortOrder;
  /** Aktualna strona */
  currentPage: number;
  /** Stan dialogu formularza */
  dialogState: FlashcardDialogState;
  /** Stan dialogu usunięcia */
  deleteDialogState: DeleteDialogState;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Stałe walidacji */
export const FLASHCARD_VALIDATION = {
  FRONT_MIN_LENGTH: 1,
  FRONT_MAX_LENGTH: 500,
  BACK_MIN_LENGTH: 1,
  BACK_MAX_LENGTH: 1000,
} as const;

/** Domyślna liczba fiszek na stronę */
export const DEFAULT_PAGE_SIZE = 20;

/** Opcje sortowania dla selecta */
export const SORT_OPTIONS: Array<{
  value: SortValue;
  label: string;
  sort: SortOption;
  order: SortOrder;
}> = [
  {
    value: "created_at_desc",
    label: "Data utworzenia (najnowsze)",
    sort: "created_at",
    order: "desc",
  },
  {
    value: "created_at_asc",
    label: "Data utworzenia (najstarsze)",
    sort: "created_at",
    order: "asc",
  },
  {
    value: "updated_at_desc",
    label: "Data aktualizacji (najnowsze)",
    sort: "updated_at",
    order: "desc",
  },
  {
    value: "updated_at_asc",
    label: "Data aktualizacji (najstarsze)",
    sort: "updated_at",
    order: "asc",
  },
  {
    value: "next_review_date_asc",
    label: "Następna powtórka (najbliższe)",
    sort: "next_review_date",
    order: "asc",
  },
  {
    value: "next_review_date_desc",
    label: "Następna powtórka (najdalsze)",
    sort: "next_review_date",
    order: "desc",
  },
];

// ============================================================================
// REDUCER ACTION TYPES
// ============================================================================

/** Akcje reducera widoku fiszek */
export type FlashcardsViewAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      payload: { flashcards: FlashcardDTO[]; pagination: PaginationDTO };
    }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SAVE_START" }
  | { type: "CREATE_SUCCESS"; payload: FlashcardDTO }
  | { type: "UPDATE_SUCCESS"; payload: FlashcardDTO }
  | { type: "SAVE_ERROR"; payload: string }
  | { type: "DELETE_START" }
  | { type: "DELETE_SUCCESS"; payload: string } // flashcard id
  | { type: "DELETE_ERROR"; payload: string }
  | { type: "OPEN_CREATE_DIALOG" }
  | { type: "OPEN_EDIT_DIALOG"; payload: FlashcardDTO }
  | { type: "CLOSE_DIALOG" }
  | { type: "OPEN_DELETE_DIALOG"; payload: FlashcardDTO }
  | { type: "CLOSE_DELETE_DIALOG" }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_SORT"; payload: { sort: SortOption; order: SortOrder } }
  | { type: "CLEAR_ERROR" }
  | { type: "CLEAR_SUCCESS" };

