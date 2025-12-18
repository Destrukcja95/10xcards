import { useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DELETE_CONFIRMATION_TEXT } from "./types";

interface DeleteAccountDialogProps {
  /** Czy dialog jest otwarty */
  isOpen: boolean;
  /** Callback zamknięcia dialogu */
  onClose: () => void;
  /** Callback potwierdzenia usunięcia */
  onConfirm: () => Promise<void>;
  /** Czy trwa usuwanie */
  isDeleting: boolean;
  /** Aktualny krok (1 = ostrzeżenie, 2 = potwierdzenie) */
  step: 1 | 2;
  /** Callback zmiany kroku */
  onStepChange: (step: 1 | 2) => void;
  /** Wartość inputa potwierdzenia */
  confirmInput: string;
  /** Callback zmiany inputa potwierdzenia */
  onConfirmInputChange: (value: string) => void;
  /** Błąd usuwania */
  error: string | null;
}

/**
 * Wieloetapowy dialog potwierdzenia usunięcia konta (RODO).
 * Krok 1: ostrzeżenie o konsekwencjach
 * Krok 2: potwierdzenie przez wpisanie "USUŃ"
 */
export function DeleteAccountDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  step,
  onStepChange,
  confirmInput,
  onConfirmInputChange,
  error,
}: DeleteAccountDialogProps) {
  const descriptionId = useId();
  const inputId = useId();

  const isConfirmValid = confirmInput === DELETE_CONFIRMATION_TEXT;

  const handleContinue = () => {
    onStepChange(2);
  };

  const handleBack = () => {
    onStepChange(1);
  };

  const handleConfirm = async () => {
    if (!isConfirmValid) return;
    await onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent role="alertdialog" aria-describedby={descriptionId} className="sm:max-w-md">
        {step === 1 ? (
          // Krok 1: Ostrzeżenie
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
                Usunięcie konta
              </DialogTitle>
              <DialogDescription id={descriptionId} className="space-y-3 pt-2">
                <p>
                  <strong>Uwaga!</strong> Ta operacja jest nieodwracalna.
                </p>
                <p>Po usunięciu konta:</p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>Wszystkie Twoje fiszki zostaną usunięte</li>
                  <li>Historia generowania AI zostanie usunięta</li>
                  <li>Nie będziesz mógł odzyskać swoich danych</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button variant="destructive" onClick={handleContinue}>
                Kontynuuj
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Krok 2: Potwierdzenie
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive">Potwierdź usunięcie konta</DialogTitle>
              <DialogDescription id={descriptionId}>
                Aby potwierdzić usunięcie konta, wpisz <strong className="font-mono">{DELETE_CONFIRMATION_TEXT}</strong>{" "}
                poniżej.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label htmlFor={inputId} className="sr-only">
                Wpisz {DELETE_CONFIRMATION_TEXT} aby potwierdzić
              </Label>
              <Input
                id={inputId}
                type="text"
                value={confirmInput}
                onChange={(e) => onConfirmInputChange(e.target.value)}
                placeholder={`Wpisz "${DELETE_CONFIRMATION_TEXT}"`}
                aria-label={`Wpisz ${DELETE_CONFIRMATION_TEXT} aby potwierdzić`}
                disabled={isDeleting}
                autoComplete="off"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleBack} disabled={isDeleting}>
                Wstecz
              </Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={!isConfirmValid || isDeleting}>
                {isDeleting ? (
                  <>
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
                      className="mr-2 animate-spin"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Usuwanie...
                  </>
                ) : (
                  "Usuń konto na zawsze"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
