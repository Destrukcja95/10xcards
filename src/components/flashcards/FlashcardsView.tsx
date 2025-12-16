import { useFlashcardsView } from "./hooks/useFlashcardsView";
import { FlashcardsHeader } from "./FlashcardsHeader";
import { FlashcardList } from "./FlashcardList";
import { FlashcardsPagination } from "./FlashcardsPagination";
import { EmptyFlashcardsState } from "./EmptyFlashcardsState";
import { FlashcardFormDialog } from "./FlashcardFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Główny komponent widoku "Moje fiszki"
 * Zarządza stanem globalnym, integruje się z API i koordynuje komponenty potomne
 */
export function FlashcardsView() {
  const { state, actions, computed } = useFlashcardsView();

  // Obsługa submitu formularza (create/edit)
  const handleFormSubmit = async (data: { front: string; back: string }) => {
    if (state.dialogState.mode === "edit" && state.dialogState.flashcard) {
      const success = await actions.updateFlashcard(
        state.dialogState.flashcard.id,
        data
      );
      if (success) {
        // Odśwież listę po edycji
        actions.fetchFlashcards();
      }
    } else {
      const success = await actions.createFlashcard(data);
      if (success) {
        // Odśwież listę po utworzeniu
        actions.fetchFlashcards();
      }
    }
  };

  // Obsługa potwierdzenia usunięcia
  const handleDeleteConfirm = async () => {
    if (state.deleteDialogState.flashcard) {
      const success = await actions.deleteFlashcard(
        state.deleteDialogState.flashcard.id
      );
      if (success) {
        // Odśwież listę po usunięciu - sprawdź czy trzeba cofnąć stronę
        const remainingOnPage = state.flashcards.length - 1;
        if (remainingOnPage === 0 && state.currentPage > 1) {
          actions.changePage(state.currentPage - 1);
        } else {
          actions.fetchFlashcards();
        }
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Alert błędu */}
      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{state.error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.clearError}
            >
              Zamknij
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Alert sukcesu */}
      {state.successMessage && (
        <Alert className="mb-6 border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/50 dark:text-emerald-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          <AlertTitle>Sukces</AlertTitle>
          <AlertDescription>{state.successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Nagłówek */}
      <FlashcardsHeader
        totalCount={computed.totalCount}
        currentSort={state.sortBy}
        currentOrder={state.sortOrder}
        onAddClick={actions.openCreateDialog}
        onSortChange={actions.changeSort}
        isLoading={state.isLoading}
      />

      {/* Główna treść */}
      {computed.isEmpty ? (
        <EmptyFlashcardsState onAddClick={actions.openCreateDialog} />
      ) : (
        <>
          <FlashcardList
            flashcards={state.flashcards}
            isLoading={state.isLoading}
            onEdit={actions.openEditDialog}
            onDelete={actions.openDeleteDialog}
          />

          {/* Paginacja */}
          {state.pagination && (
            <FlashcardsPagination
              pagination={state.pagination}
              onPageChange={actions.changePage}
              isLoading={state.isLoading}
            />
          )}
        </>
      )}

      {/* Dialog formularza (tworzenie/edycja) */}
      <FlashcardFormDialog
        isOpen={state.dialogState.mode !== null}
        mode={state.dialogState.mode ?? "create"}
        flashcard={state.dialogState.flashcard}
        onClose={actions.closeDialog}
        onSubmit={handleFormSubmit}
        isSubmitting={state.isSaving}
      />

      {/* Dialog potwierdzenia usunięcia */}
      <DeleteConfirmDialog
        isOpen={state.deleteDialogState.isOpen}
        flashcard={state.deleteDialogState.flashcard}
        onClose={actions.closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        isDeleting={state.isDeleting}
      />
    </div>
  );
}

