import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FlashcardDTO } from "@/types";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDTO | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

/**
 * Dialog potwierdzenia usunięcia fiszki z ostrzeżeniem o nieodwracalności
 */
export function DeleteConfirmDialog({
  isOpen,
  flashcard,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  // Skrócony przód fiszki do preview
  const previewText = flashcard
    ? flashcard.front.length > 100
      ? `${flashcard.front.substring(0, 100)}...`
      : flashcard.front
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </div>
          <DialogTitle className="text-center">Usuń fiszkę</DialogTitle>
          <DialogDescription className="text-center">
            Czy na pewno chcesz usunąć tę fiszkę? Ta operacja jest nieodwracalna.
          </DialogDescription>
        </DialogHeader>

        {/* Preview fiszki */}
        {previewText && (
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Przód fiszki
            </p>
            <p className="text-sm text-foreground">{previewText}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Usuwanie...
              </>
            ) : (
              "Usuń"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

