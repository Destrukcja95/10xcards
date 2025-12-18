import { useReducer, useCallback, useMemo, useEffect } from "react";
import { flashcardsViewReducer, initialState } from "./flashcardsViewReducer";
import type { FlashcardDTO, ErrorDTO, FlashcardsListResponseDTO, CreateFlashcardsResponseDTO } from "@/types";
import type { SortOption, SortOrder } from "../types";
import { DEFAULT_PAGE_SIZE } from "../types";

/**
 * Custom hook zarządzający stanem widoku listy fiszek
 * Integruje się z API i dostarcza akcje do komponentów potomnych
 */
export function useFlashcardsView() {
  const [state, dispatch] = useReducer(flashcardsViewReducer, initialState);

  // ========================================
  // FETCH FLASHCARDS
  // ========================================

  const fetchFlashcards = useCallback(async () => {
    dispatch({ type: "FETCH_START" });

    try {
      const params = new URLSearchParams({
        page: String(state.currentPage),
        limit: String(DEFAULT_PAGE_SIZE),
        sort: state.sortBy,
        order: state.sortOrder,
      });

      const response = await fetch(`/api/flashcards?${params}`);

      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();
        dispatch({ type: "FETCH_ERROR", payload: errorData.error.message });
        return;
      }

      const data: FlashcardsListResponseDTO = await response.json();
      dispatch({
        type: "FETCH_SUCCESS",
        payload: {
          flashcards: data.data,
          pagination: data.pagination,
        },
      });
    } catch {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Nie udało się pobrać fiszek. Sprawdź połączenie z internetem.",
      });
    }
  }, [state.currentPage, state.sortBy, state.sortOrder]);

  // ========================================
  // CREATE FLASHCARD
  // ========================================

  const createFlashcard = useCallback(async (data: { front: string; back: string }) => {
    dispatch({ type: "SAVE_START" });

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcards: [{ ...data, source: "manual" as const }],
        }),
      });

      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();
        dispatch({ type: "SAVE_ERROR", payload: errorData.error.message });
        return false;
      }

      const result: CreateFlashcardsResponseDTO = await response.json();
      dispatch({ type: "CREATE_SUCCESS", payload: result.data[0] });

      // Refresh listy, aby zobaczyć nową fiszkę z poprawnym sortowaniem
      return true;
    } catch {
      dispatch({
        type: "SAVE_ERROR",
        payload: "Nie udało się utworzyć fiszki. Spróbuj ponownie.",
      });
      return false;
    }
  }, []);

  // ========================================
  // UPDATE FLASHCARD
  // ========================================

  const updateFlashcard = useCallback(async (id: string, data: { front: string; back: string }) => {
    dispatch({ type: "SAVE_START" });

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();
        dispatch({ type: "SAVE_ERROR", payload: errorData.error.message });
        return false;
      }

      const updated: FlashcardDTO = await response.json();
      dispatch({ type: "UPDATE_SUCCESS", payload: updated });
      return true;
    } catch {
      dispatch({
        type: "SAVE_ERROR",
        payload: "Nie udało się zaktualizować fiszki. Spróbuj ponownie.",
      });
      return false;
    }
  }, []);

  // ========================================
  // DELETE FLASHCARD
  // ========================================

  const deleteFlashcard = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_START" });

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();
        dispatch({ type: "DELETE_ERROR", payload: errorData.error.message });
        return false;
      }

      dispatch({ type: "DELETE_SUCCESS", payload: id });
      return true;
    } catch {
      dispatch({
        type: "DELETE_ERROR",
        payload: "Nie udało się usunąć fiszki. Spróbuj ponownie.",
      });
      return false;
    }
  }, []);

  // ========================================
  // DIALOG ACTIONS
  // ========================================

  const openCreateDialog = useCallback(() => {
    dispatch({ type: "OPEN_CREATE_DIALOG" });
  }, []);

  const openEditDialog = useCallback((flashcard: FlashcardDTO) => {
    dispatch({ type: "OPEN_EDIT_DIALOG", payload: flashcard });
  }, []);

  const closeDialog = useCallback(() => {
    dispatch({ type: "CLOSE_DIALOG" });
  }, []);

  const openDeleteDialog = useCallback((flashcard: FlashcardDTO) => {
    dispatch({ type: "OPEN_DELETE_DIALOG", payload: flashcard });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    dispatch({ type: "CLOSE_DELETE_DIALOG" });
  }, []);

  // ========================================
  // PAGINATION & SORTING
  // ========================================

  const changePage = useCallback((page: number) => {
    dispatch({ type: "SET_PAGE", payload: page });
  }, []);

  const changeSort = useCallback((sort: SortOption, order: SortOrder) => {
    dispatch({ type: "SET_SORT", payload: { sort, order } });
  }, []);

  // ========================================
  // MESSAGE CLEARING
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

  // Pobierz fiszki przy montowaniu i przy zmianie strony/sortowania
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Auto-dismiss komunikatu sukcesu po 5 sekundach
  useEffect(() => {
    if (state.successMessage) {
      const timer = setTimeout(() => {
        dispatch({ type: "CLEAR_SUCCESS" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.successMessage]);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const hasFlashcards = useMemo(
    () => state.flashcards.length > 0 || state.isLoading,
    [state.flashcards.length, state.isLoading]
  );

  const isEmpty = useMemo(
    () => !state.isLoading && state.flashcards.length === 0 && state.pagination?.total === 0,
    [state.isLoading, state.flashcards.length, state.pagination?.total]
  );

  const totalCount = useMemo(() => state.pagination?.total ?? 0, [state.pagination?.total]);

  // ========================================
  // RETURN
  // ========================================

  return {
    state,
    actions: {
      fetchFlashcards,
      createFlashcard,
      updateFlashcard,
      deleteFlashcard,
      openCreateDialog,
      openEditDialog,
      closeDialog,
      openDeleteDialog,
      closeDeleteDialog,
      changePage,
      changeSort,
      clearError,
      clearSuccess,
    },
    computed: {
      hasFlashcards,
      isEmpty,
      totalCount,
    },
  };
}
