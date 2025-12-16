import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FLASHCARD_VALIDATION } from "./types";

interface FlashcardFormProps {
  initialData?: { front: string; back: string };
  onSubmit: (data: { front: string; back: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

interface FieldErrors {
  front?: string;
  back?: string;
}

/**
 * Formularz tworzenia/edycji fiszki z walidacją inline i licznikami znaków
 */
export function FlashcardForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: FlashcardFormProps) {
  const [front, setFront] = useState(initialData?.front ?? "");
  const [back, setBack] = useState(initialData?.back ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState({ front: false, back: false });

  const frontId = useId();
  const backId = useId();

  const validate = (): FieldErrors => {
    const newErrors: FieldErrors = {};

    if (!front.trim()) {
      newErrors.front = "Przód fiszki jest wymagany";
    } else if (front.length > FLASHCARD_VALIDATION.FRONT_MAX_LENGTH) {
      newErrors.front = `Przód fiszki może mieć maksymalnie ${FLASHCARD_VALIDATION.FRONT_MAX_LENGTH} znaków`;
    }

    if (!back.trim()) {
      newErrors.back = "Tył fiszki jest wymagany";
    } else if (back.length > FLASHCARD_VALIDATION.BACK_MAX_LENGTH) {
      newErrors.back = `Tył fiszki może mieć maksymalnie ${FLASHCARD_VALIDATION.BACK_MAX_LENGTH} znaków`;
    }

    return newErrors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({ front: true, back: true });

    if (Object.keys(validationErrors).length === 0) {
      onSubmit({ front: front.trim(), back: back.trim() });
    }
  };

  const handleBlur = (field: "front" | "back") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validationErrors = validate();
    setErrors(validationErrors);
  };

  const frontError = touched.front ? errors.front : undefined;
  const backError = touched.back ? errors.back : undefined;

  const isFrontOverLimit = front.length > FLASHCARD_VALIDATION.FRONT_MAX_LENGTH;
  const isBackOverLimit = back.length > FLASHCARD_VALIDATION.BACK_MAX_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pole przód */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={frontId}>Przód fiszki (pytanie)</Label>
          <span
            className={cn(
              "text-xs tabular-nums",
              isFrontOverLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {front.length}/{FLASHCARD_VALIDATION.FRONT_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id={frontId}
          value={front}
          onChange={(e) => setFront(e.target.value)}
          onBlur={() => handleBlur("front")}
          placeholder="Wprowadź pytanie lub pojęcie..."
          className={cn("min-h-[80px] resize-none", frontError && "border-destructive")}
          aria-invalid={!!frontError}
          aria-describedby={frontError ? `${frontId}-error` : undefined}
          disabled={isSubmitting}
        />
        {frontError && (
          <p id={`${frontId}-error`} className="text-xs text-destructive">
            {frontError}
          </p>
        )}
      </div>

      {/* Pole tył */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={backId}>Tył fiszki (odpowiedź)</Label>
          <span
            className={cn(
              "text-xs tabular-nums",
              isBackOverLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {back.length}/{FLASHCARD_VALIDATION.BACK_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id={backId}
          value={back}
          onChange={(e) => setBack(e.target.value)}
          onBlur={() => handleBlur("back")}
          placeholder="Wprowadź odpowiedź lub definicję..."
          className={cn("min-h-[120px] resize-none", backError && "border-destructive")}
          aria-invalid={!!backError}
          aria-describedby={backError ? `${backId}-error` : undefined}
          disabled={isSubmitting}
        />
        {backError && (
          <p id={`${backId}-error`} className="text-xs text-destructive">
            {backError}
          </p>
        )}
      </div>

      {/* Przyciski akcji */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Zapisywanie...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

