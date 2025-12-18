import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FlashcardForm } from "./FlashcardForm";
import type { FlashcardDTO } from "@/types";

interface FlashcardFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  flashcard?: FlashcardDTO | null;
  onClose: () => void;
  onSubmit: (data: { front: string; back: string }) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Dialog modalny zawierający formularz tworzenia lub edycji fiszki
 */
export function FlashcardFormDialog({
  isOpen,
  mode,
  flashcard,
  onClose,
  onSubmit,
  isSubmitting,
}: FlashcardFormDialogProps) {
  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edytuj fiszkę" : "Dodaj nową fiszkę";
  const description = isEditMode
    ? "Zmodyfikuj treść fiszki i zapisz zmiany."
    : "Wypełnij pola, aby utworzyć nową fiszkę.";
  const submitLabel = isEditMode ? "Zapisz zmiany" : "Dodaj fiszkę";

  const initialData = isEditMode && flashcard ? { front: flashcard.front, back: flashcard.back } : undefined;

  const handleSubmit = async (data: { front: string; back: string }) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <FlashcardForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
