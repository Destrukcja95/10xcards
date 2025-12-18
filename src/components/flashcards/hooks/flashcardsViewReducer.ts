import type { FlashcardsViewState, FlashcardsViewAction } from "../types";

/**
 * Początkowy stan widoku fiszek
 */
export const initialState: FlashcardsViewState = {
  flashcards: [],
  pagination: null,
  isLoading: true,
  isSaving: false,
  isDeleting: false,
  error: null,
  successMessage: null,
  sortBy: "created_at",
  sortOrder: "desc",
  currentPage: 1,
  dialogState: { mode: null, flashcard: null },
  deleteDialogState: { isOpen: false, flashcard: null },
};

/**
 * Reducer zarządzający stanem widoku fiszek
 */
export function flashcardsViewReducer(state: FlashcardsViewState, action: FlashcardsViewAction): FlashcardsViewState {
  switch (action.type) {
    // ========================================
    // FETCH ACTIONS
    // ========================================
    case "FETCH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        flashcards: action.payload.flashcards,
        pagination: action.payload.pagination,
        error: null,
      };

    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ========================================
    // SAVE ACTIONS (CREATE/UPDATE)
    // ========================================
    case "SAVE_START":
      return {
        ...state,
        isSaving: true,
        error: null,
      };

    case "CREATE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        dialogState: { mode: null, flashcard: null },
        successMessage: "Fiszka została utworzona",
      };

    case "UPDATE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        flashcards: state.flashcards.map((fc) => (fc.id === action.payload.id ? action.payload : fc)),
        dialogState: { mode: null, flashcard: null },
        successMessage: "Fiszka została zaktualizowana",
      };

    case "SAVE_ERROR":
      return {
        ...state,
        isSaving: false,
        error: action.payload,
      };

    // ========================================
    // DELETE ACTIONS
    // ========================================
    case "DELETE_START":
      return {
        ...state,
        isDeleting: true,
        error: null,
      };

    case "DELETE_SUCCESS":
      return {
        ...state,
        isDeleting: false,
        flashcards: state.flashcards.filter((fc) => fc.id !== action.payload),
        deleteDialogState: { isOpen: false, flashcard: null },
        successMessage: "Fiszka została usunięta",
      };

    case "DELETE_ERROR":
      return {
        ...state,
        isDeleting: false,
        error: action.payload,
      };

    // ========================================
    // DIALOG ACTIONS
    // ========================================
    case "OPEN_CREATE_DIALOG":
      return {
        ...state,
        dialogState: { mode: "create", flashcard: null },
      };

    case "OPEN_EDIT_DIALOG":
      return {
        ...state,
        dialogState: { mode: "edit", flashcard: action.payload },
      };

    case "CLOSE_DIALOG":
      return {
        ...state,
        dialogState: { mode: null, flashcard: null },
      };

    case "OPEN_DELETE_DIALOG":
      return {
        ...state,
        deleteDialogState: { isOpen: true, flashcard: action.payload },
      };

    case "CLOSE_DELETE_DIALOG":
      return {
        ...state,
        deleteDialogState: { isOpen: false, flashcard: null },
      };

    // ========================================
    // PAGINATION & SORTING
    // ========================================
    case "SET_PAGE":
      return {
        ...state,
        currentPage: action.payload,
      };

    case "SET_SORT":
      return {
        ...state,
        sortBy: action.payload.sort,
        sortOrder: action.payload.order,
        currentPage: 1, // Reset do pierwszej strony przy zmianie sortowania
      };

    // ========================================
    // MESSAGE CLEARING
    // ========================================
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "CLEAR_SUCCESS":
      return {
        ...state,
        successMessage: null,
      };

    default:
      return state;
  }
}
