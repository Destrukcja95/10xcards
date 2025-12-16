import { useReducer, useCallback, useEffect, useMemo } from "react";
import { profileViewReducer, initialState } from "./profileViewReducer";
import type { ProfileStatsDTO } from "../types";
import type {
  FlashcardsListResponseDTO,
  GenerationSessionsListResponseDTO,
  FlashcardDTO,
} from "@/types";

const MAX_PAGE_SIZE = 100;

/**
 * Pobiera wszystkie fiszki iterując po stronach (limit API = 100)
 */
async function fetchAllFlashcards(): Promise<FlashcardDTO[]> {
  const allFlashcards: FlashcardDTO[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/api/flashcards?page=${currentPage}&limit=${MAX_PAGE_SIZE}`
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/auth?returnUrl=/profile";
        return [];
      }
      throw new Error("Nie udało się pobrać fiszek");
    }

    const data: FlashcardsListResponseDTO = await response.json();
    allFlashcards.push(...data.data);

    // Sprawdź czy są kolejne strony
    hasMore = currentPage < data.pagination.total_pages;
    currentPage++;

    // Zabezpieczenie przed nieskończoną pętlą
    if (currentPage > 100) break;
  }

  return allFlashcards;
}

/**
 * Oblicza statystyki na podstawie listy fiszek
 */
function calculateStats(
  flashcards: FlashcardDTO[],
  acceptanceRate: number
): ProfileStatsDTO {
  const totalFlashcards = flashcards.length;
  const aiFlashcards = flashcards.filter(
    (fc) => fc.source === "ai_generated"
  ).length;
  const manualFlashcards = flashcards.filter(
    (fc) => fc.source === "manual"
  ).length;

  return {
    totalFlashcards,
    aiFlashcards,
    manualFlashcards,
    acceptanceRate,
  };
}

/**
 * Hook zarządzający stanem widoku profilu
 */
export function useProfileView() {
  const [state, dispatch] = useReducer(profileViewReducer, initialState);

  // ========================================
  // FETCH STATS
  // ========================================
  const fetchStats = useCallback(async () => {
    dispatch({ type: "FETCH_STATS_START" });

    try {
      // Pobieramy wszystkie fiszki iterując po stronach (limit API = 100)
      // W przyszłości można dodać dedykowany endpoint /api/flashcards/stats
      const allFlashcards = await fetchAllFlashcards();

      // Pobieramy wskaźnik akceptacji z sesji generowania
      const sessionsResponse = await fetch("/api/generation-sessions?limit=1");

      let acceptanceRate = 0;
      if (sessionsResponse.ok) {
        const sessionsData: GenerationSessionsListResponseDTO =
          await sessionsResponse.json();
        acceptanceRate = sessionsData.summary.acceptance_rate;
      }

      const stats = calculateStats(allFlashcards, acceptanceRate);
      dispatch({ type: "FETCH_STATS_SUCCESS", payload: stats });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas pobierania statystyk";
      dispatch({ type: "FETCH_STATS_ERROR", payload: message });
    }
  }, []);

  // ========================================
  // FETCH SESSIONS
  // ========================================
  const fetchSessions = useCallback(async () => {
    dispatch({ type: "FETCH_SESSIONS_START" });

    try {
      const response = await fetch(
        `/api/generation-sessions?page=${state.sessionsPage}&limit=10`
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth?returnUrl=/profile";
          return;
        }
        throw new Error("Nie udało się pobrać historii generowania");
      }

      const data: GenerationSessionsListResponseDTO = await response.json();

      dispatch({
        type: "FETCH_SESSIONS_SUCCESS",
        payload: {
          sessions: data.data,
          pagination: data.pagination,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas pobierania historii";
      dispatch({ type: "FETCH_SESSIONS_ERROR", payload: message });
    }
  }, [state.sessionsPage]);

  // ========================================
  // PAGE CHANGE
  // ========================================
  const changeSessionsPage = useCallback((page: number) => {
    dispatch({ type: "SET_SESSIONS_PAGE", payload: page });
  }, []);

  // ========================================
  // DELETE DIALOG ACTIONS
  // ========================================
  const openDeleteDialog = useCallback(() => {
    dispatch({ type: "OPEN_DELETE_DIALOG" });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    dispatch({ type: "CLOSE_DELETE_DIALOG" });
  }, []);

  const setDeleteStep = useCallback((step: 1 | 2) => {
    dispatch({ type: "SET_DELETE_STEP", payload: step });
  }, []);

  const setDeleteConfirmInput = useCallback((value: string) => {
    dispatch({ type: "SET_DELETE_CONFIRM_INPUT", payload: value });
  }, []);

  // ========================================
  // DELETE ACCOUNT
  // ========================================
  const deleteAccount = useCallback(async () => {
    dispatch({ type: "DELETE_START" });

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || "Nie udało się usunąć konta"
        );
      }

      dispatch({ type: "DELETE_SUCCESS" });

      // Przekierowanie do strony głównej po usunięciu konta
      window.location.href = "/";
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas usuwania konta";
      dispatch({ type: "DELETE_ERROR", payload: message });
    }
  }, []);

  // ========================================
  // CLEAR ACTIONS
  // ========================================
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const clearSuccess = useCallback(() => {
    dispatch({ type: "CLEAR_SUCCESS" });
  }, []);

  // ========================================
  // EFFECTS
  // ========================================

  // Pobierz statystyki przy pierwszym renderze
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Pobierz sesje przy zmianie strony
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const isConfirmValid = useMemo(
    () => state.deleteConfirmInput === "USUŃ",
    [state.deleteConfirmInput]
  );

  const hasNoHistory = useMemo(
    () => !state.sessionsLoading && state.sessions.length === 0,
    [state.sessionsLoading, state.sessions.length]
  );

  return {
    state,
    actions: {
      fetchStats,
      fetchSessions,
      changeSessionsPage,
      openDeleteDialog,
      closeDeleteDialog,
      setDeleteStep,
      setDeleteConfirmInput,
      deleteAccount,
      clearError,
      clearSuccess,
    },
    computed: {
      isConfirmValid,
      hasNoHistory,
    },
  };
}

