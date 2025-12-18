import { useReducer, useCallback, useMemo } from "react";
import { generateViewReducer, initialState } from "./generateViewReducer";
import type { ErrorDTO, GenerationResponseDTO, FlashcardSource } from "@/types";

/**
 * Custom hook zarządzający stanem widoku generowania fiszek
 * Integruje się z API i dostarcza akcje do komponentów potomnych
 */
export function useGenerateView() {
  const [state, dispatch] = useReducer(generateViewReducer, initialState);

  // === AKCJE ===

  const setSourceText = useCallback((text: string) => {
    dispatch({ type: "SET_SOURCE_TEXT", payload: text });
  }, []);

  const generateFlashcards = useCallback(async (sourceText: string) => {
    dispatch({ type: "START_GENERATION" });

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: sourceText }),
      });

      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();

        // Obsługa rate limit
        if (response.status === 429) {
          const resetAt = new Date(Date.now() + 60 * 60 * 1000); // +1h
          dispatch({
            type: "UPDATE_RATE_LIMIT",
            payload: { remaining: 0, resetAt, isLimited: true },
          });
        }

        dispatch({
          type: "GENERATION_ERROR",
          payload: errorData.error.message,
        });
        return;
      }

      const data: GenerationResponseDTO = await response.json();
      dispatch({ type: "GENERATION_SUCCESS", payload: data });
    } catch {
      dispatch({
        type: "GENERATION_ERROR",
        payload: "Wystąpił nieoczekiwany błąd. Sprawdź połączenie z internetem.",
      });
    }
  }, []);

  const acceptProposal = useCallback((id: string) => {
    dispatch({ type: "ACCEPT_PROPOSAL", payload: id });
  }, []);

  const rejectProposal = useCallback((id: string) => {
    dispatch({ type: "REJECT_PROPOSAL", payload: id });
  }, []);

  const editProposal = useCallback((id: string, front: string, back: string) => {
    dispatch({ type: "SAVE_EDIT", payload: { id, front, back } });
  }, []);

  const undoProposal = useCallback((id: string) => {
    dispatch({ type: "UNDO_PROPOSAL", payload: id });
  }, []);

  const acceptAll = useCallback(() => {
    dispatch({ type: "ACCEPT_ALL" });
  }, []);

  const rejectAll = useCallback(() => {
    dispatch({ type: "REJECT_ALL" });
  }, []);

  const saveAcceptedFlashcards = useCallback(async () => {
    const accepted = state.proposals.filter((p) => p.status === "accepted");
    if (accepted.length === 0) return;

    dispatch({ type: "START_SAVING" });

    try {
      // 1. Zapisz fiszki
      const flashcardsResponse = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcards: accepted.map((p) => ({
            front: p.front,
            back: p.back,
            source: "ai_generated" as FlashcardSource,
          })),
        }),
      });

      if (!flashcardsResponse.ok) {
        const errorData: ErrorDTO = await flashcardsResponse.json();
        dispatch({ type: "SAVE_ERROR", payload: errorData.error.message });
        return;
      }

      // 2. Zaktualizuj accepted_count w sesji generowania (fire and forget)
      if (state.generationId) {
        fetch(`/api/generation-sessions/${state.generationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accepted_count: accepted.length }),
        }).catch(() => {
          // Ignoruj błędy - to tylko statystyka
        });
      }

      dispatch({ type: "SAVE_SUCCESS", payload: accepted.length });
    } catch {
      dispatch({
        type: "SAVE_ERROR",
        payload: "Nie udało się zapisać fiszek. Spróbuj ponownie.",
      });
    }
  }, [state.proposals, state.generationId]);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const clearSuccess = useCallback(() => {
    dispatch({ type: "CLEAR_SUCCESS" });
  }, []);

  // === COMPUTED VALUES ===

  const acceptedCount = useMemo(() => state.proposals.filter((p) => p.status === "accepted").length, [state.proposals]);

  const pendingCount = useMemo(() => state.proposals.filter((p) => p.status === "pending").length, [state.proposals]);

  const rejectedCount = useMemo(() => state.proposals.filter((p) => p.status === "rejected").length, [state.proposals]);

  const hasProposals = state.proposals.length > 0;

  return {
    state,
    actions: {
      setSourceText,
      generateFlashcards,
      acceptProposal,
      rejectProposal,
      editProposal,
      undoProposal,
      acceptAll,
      rejectAll,
      saveAcceptedFlashcards,
      clearError,
      clearSuccess,
    },
    computed: {
      acceptedCount,
      pendingCount,
      rejectedCount,
      hasProposals,
    },
  };
}
