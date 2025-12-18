import type { StudyViewState, StudyViewAction } from "../types";

/**
 * Początkowy stan widoku sesji nauki
 */
export const initialState: StudyViewState = {
  flashcards: [],
  currentIndex: 0,
  isFlipped: false,
  isLoading: true,
  isSubmitting: false,
  error: null,
  lastReviewResult: null,
  totalDue: 0,
  reviewedCount: 0,
  isComplete: false,
};

/**
 * Reducer zarządzający stanem widoku sesji nauki
 */
export function studyViewReducer(state: StudyViewState, action: StudyViewAction): StudyViewState {
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
        totalDue: action.payload.totalDue,
        currentIndex: 0,
        isFlipped: false,
        isComplete: action.payload.flashcards.length === 0,
        error: null,
      };

    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ========================================
    // CARD FLIP ACTION
    // ========================================
    case "FLIP_CARD":
      return {
        ...state,
        isFlipped: true,
      };

    // ========================================
    // REVIEW ACTIONS
    // ========================================
    case "REVIEW_START":
      return {
        ...state,
        isSubmitting: true,
        error: null,
      };

    case "REVIEW_SUCCESS":
      return {
        ...state,
        isSubmitting: false,
        lastReviewResult: action.payload,
        reviewedCount: state.reviewedCount + 1,
      };

    case "REVIEW_ERROR":
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };

    // ========================================
    // NAVIGATION ACTIONS
    // ========================================
    case "NEXT_CARD":
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        isFlipped: false,
        lastReviewResult: null,
      };

    case "COMPLETE_SESSION":
      return {
        ...state,
        isComplete: true,
        lastReviewResult: null,
      };

    // ========================================
    // SESSION MANAGEMENT
    // ========================================
    case "RESET_SESSION":
      return {
        ...initialState,
        isLoading: true,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}
