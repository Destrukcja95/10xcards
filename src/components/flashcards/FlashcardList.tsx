import { FlashcardCard } from "./FlashcardCard";
import { FlashcardSkeleton } from "./FlashcardSkeleton";
import type { FlashcardDTO } from "@/types";

interface FlashcardListProps {
  flashcards: FlashcardDTO[];
  isLoading: boolean;
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}

/** Liczba skeletonów wyświetlanych podczas ładowania */
const SKELETON_COUNT = 6;

/**
 * Kontener renderujący siatkę kart fiszek lub skeleton loaders
 */
export function FlashcardList({ flashcards, isLoading, onEdit, onDelete }: FlashcardListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Ładowanie fiszek">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <FlashcardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Lista fiszek">
      {flashcards.map((flashcard) => (
        <div key={flashcard.id} role="listitem">
          <FlashcardCard flashcard={flashcard} onEdit={() => onEdit(flashcard)} onDelete={() => onDelete(flashcard)} />
        </div>
      ))}
    </div>
  );
}
