import { useReducer, useCallback, useMemo, useEffect } from "react";
import { studyViewReducer, initialState } from "./studyViewReducer";
import type { ErrorDTO, StudySessionResponseDTO, ReviewResultDTO, SM2Rating } from "@/types";
import { STUDY_SESSION_LIMIT, NEXT_REVIEW_DISPLAY_DURATION, KEY_TO_RATING } from "../types";

/**
 * Custom hook zarządzający stanem sesji nauki
 * Integruje się z API i dostarcza akcje do komponentów potomnych
 */
export function useStudySession() {
  const [state, dispatch] = useReducer(studyViewReducer, initialState);

  // ========================================
  // FETCH SESSION
  // ========================================

  const fetchSession = useCallback(async (limit: number = STUDY_SESSION_LIMIT) => {
    dispatch({ type: "FETCH_START" });

    try {
      const params = new URLSearchParams({
        limit: String(limit),
      });

      const response = await fetch(`/api/study-session?${params}`);

      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();
        dispatch({ type: "FETCH_ERROR", payload: errorData.error.message });
        return;
      }

      const data: StudySessionResponseDTO = await response.json();
      dispatch({
        type: "FETCH_SUCCESS",
        payload: {
          flashcards: data.data,
          totalDue: data.total_due,
        },
      });
    } catch {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Nie udało się pobrać fiszek do nauki. Sprawdź połączenie z internetem.",
      });
    }
  }, []);

  // ========================================
  // FLIP CARD
  // ========================================

  const flipCard = useCallback(() => {
    if (!state.isFlipped && !state.isSubmitting) {
      dispatch({ type: "FLIP_CARD" });
    }
  }, [state.isFlipped, state.isSubmitting]);

  // ========================================
  // RATE FLASHCARD
  // ========================================

  const rateFlashcard = useCallback(
    async (rating: SM2Rating) => {
      const currentFlashcard = state.flashcards[state.currentIndex];
      if (!currentFlashcard || state.isSubmitting) return;

      dispatch({ type: "REVIEW_START" });

      try {
        const response = await fetch("/api/study-session/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flashcard_id: currentFlashcard.id,
            rating,
          }),
        });

        if (!response.ok) {
          const errorData: ErrorDTO = await response.json();
          dispatch({ type: "REVIEW_ERROR", payload: errorData.error.message });
          return;
        }

        const result: ReviewResultDTO = await response.json();
        dispatch({ type: "REVIEW_SUCCESS", payload: result });

        // Po krótkim opóźnieniu przejdź do następnej fiszki
        setTimeout(() => {
          if (state.currentIndex >= state.flashcards.length - 1) {
            dispatch({ type: "COMPLETE_SESSION" });
          } else {
            dispatch({ type: "NEXT_CARD" });
          }
        }, NEXT_REVIEW_DISPLAY_DURATION);
      } catch {
        dispatch({
          type: "REVIEW_ERROR",
          payload: "Nie udało się zapisać oceny. Spróbuj ponownie.",
        });
      }
    },
    [state.flashcards, state.currentIndex, state.isSubmitting]
  );

  // ========================================
  // CONTINUE SESSION
  // ========================================

  const continueSession = useCallback(() => {
    dispatch({ type: "RESET_SESSION" });
    fetchSession();
  }, [fetchSession]);

  // ========================================
  // CLEAR ERROR
  // ========================================

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // ========================================
  // EFFECTS
  // ========================================

  // Pobierz sesję przy montowaniu
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignoruj jeśli fokus jest na input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Flip card na Space/Enter gdy nie jest odwrócona
      if (!state.isFlipped && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        flipCard();
        return;
      }

      // Obsługa klawiszy 1-4 gdy karta jest odwrócona
      if (state.isFlipped && !state.isSubmitting && KEY_TO_RATING[e.key]) {
        e.preventDefault();
        rateFlashcard(KEY_TO_RATING[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isFlipped, state.isSubmitting, flipCard, rateFlashcard]);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const currentFlashcard = useMemo(
    () => state.flashcards[state.currentIndex] ?? null,
    [state.flashcards, state.currentIndex]
  );

  const isEmpty = useMemo(
    () => !state.isLoading && state.totalDue === 0,
    [state.isLoading, state.totalDue]
  );

  const hasFlashcards = useMemo(
    () => state.flashcards.length > 0,
    [state.flashcards.length]
  );

  // ========================================
  // RETURN
  // ========================================

  return {
    state,
    actions: {
      fetchSession,
      flipCard,
      rateFlashcard,
      continueSession,
      clearError,
    },
    computed: {
      currentFlashcard,
      isEmpty,
      hasFlashcards,
    },
  };
}

