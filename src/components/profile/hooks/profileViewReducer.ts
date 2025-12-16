import type { ProfileViewState, ProfileViewAction } from "../types";

/**
 * Początkowy stan widoku profilu
 */
export const initialState: ProfileViewState = {
  // Statystyki
  stats: null,
  statsLoading: true,
  statsError: null,

  // Historia generowania
  sessions: [],
  sessionsPagination: null,
  sessionsLoading: true,
  sessionsError: null,
  sessionsPage: 1,

  // Usuwanie konta
  deleteDialogOpen: false,
  deleteDialogStep: 1,
  deleteConfirmInput: "",
  isDeleting: false,
  deleteError: null,

  // Ogólne
  successMessage: null,
};

/**
 * Reducer zarządzający stanem widoku profilu
 */
export function profileViewReducer(
  state: ProfileViewState,
  action: ProfileViewAction
): ProfileViewState {
  switch (action.type) {
    // ========================================
    // STATS ACTIONS
    // ========================================
    case "FETCH_STATS_START":
      return {
        ...state,
        statsLoading: true,
        statsError: null,
      };

    case "FETCH_STATS_SUCCESS":
      return {
        ...state,
        statsLoading: false,
        stats: action.payload,
        statsError: null,
      };

    case "FETCH_STATS_ERROR":
      return {
        ...state,
        statsLoading: false,
        statsError: action.payload,
      };

    // ========================================
    // SESSIONS ACTIONS
    // ========================================
    case "FETCH_SESSIONS_START":
      return {
        ...state,
        sessionsLoading: true,
        sessionsError: null,
      };

    case "FETCH_SESSIONS_SUCCESS":
      return {
        ...state,
        sessionsLoading: false,
        sessions: action.payload.sessions,
        sessionsPagination: action.payload.pagination,
        sessionsError: null,
      };

    case "FETCH_SESSIONS_ERROR":
      return {
        ...state,
        sessionsLoading: false,
        sessionsError: action.payload,
      };

    case "SET_SESSIONS_PAGE":
      return {
        ...state,
        sessionsPage: action.payload,
      };

    // ========================================
    // DELETE ACCOUNT ACTIONS
    // ========================================
    case "OPEN_DELETE_DIALOG":
      return {
        ...state,
        deleteDialogOpen: true,
        deleteDialogStep: 1,
        deleteConfirmInput: "",
        deleteError: null,
      };

    case "CLOSE_DELETE_DIALOG":
      return {
        ...state,
        deleteDialogOpen: false,
        deleteDialogStep: 1,
        deleteConfirmInput: "",
        deleteError: null,
      };

    case "SET_DELETE_STEP":
      return {
        ...state,
        deleteDialogStep: action.payload,
        deleteConfirmInput: "",
        deleteError: null,
      };

    case "SET_DELETE_CONFIRM_INPUT":
      return {
        ...state,
        deleteConfirmInput: action.payload,
      };

    case "DELETE_START":
      return {
        ...state,
        isDeleting: true,
        deleteError: null,
      };

    case "DELETE_SUCCESS":
      return {
        ...state,
        isDeleting: false,
        deleteDialogOpen: false,
        successMessage: "Konto zostało usunięte",
      };

    case "DELETE_ERROR":
      return {
        ...state,
        isDeleting: false,
        deleteError: action.payload,
      };

    // ========================================
    // GENERAL ACTIONS
    // ========================================
    case "CLEAR_ERROR":
      return {
        ...state,
        statsError: null,
        sessionsError: null,
        deleteError: null,
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

