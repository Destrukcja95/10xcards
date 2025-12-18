import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { VALIDATION_CONSTANTS } from "./types";

interface ProposalEditFormProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
}

interface FieldError {
  front?: string;
  back?: string;
}

/**
 * ProposalEditForm - formularz inline do edycji propozycji fiszki
 */
export function ProposalEditForm({ initialFront, initialBack, onSave, onCancel }: ProposalEditFormProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState({ front: false, back: false });

  const frontId = useId();
  const backId = useId();

  const validate = (): FieldError => {
    const newErrors: FieldError = {};

    if (!front.trim()) {
      newErrors.front = "Przód fiszki jest wymagany";
    } else if (front.length > VALIDATION_CONSTANTS.FRONT_MAX_LENGTH) {
      newErrors.front = `Przód fiszki może mieć maksymalnie ${VALIDATION_CONSTANTS.FRONT_MAX_LENGTH} znaków`;
    }

    if (!back.trim()) {
      newErrors.back = "Tył fiszki jest wymagany";
    } else if (back.length > VALIDATION_CONSTANTS.BACK_MAX_LENGTH) {
      newErrors.back = `Tył fiszki może mieć maksymalnie ${VALIDATION_CONSTANTS.BACK_MAX_LENGTH} znaków`;
    }

    return newErrors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({ front: true, back: true });

    if (Object.keys(validationErrors).length === 0) {
      onSave(front.trim(), back.trim());
    }
  };

  const handleBlur = (field: "front" | "back") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validationErrors = validate();
    setErrors(validationErrors);
  };

  const frontError = touched.front ? errors.front : undefined;
  const backError = touched.back ? errors.back : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pole front */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={frontId}>Przód fiszki (pytanie)</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {front.length}/{VALIDATION_CONSTANTS.FRONT_MAX_LENGTH}
          </span>
        </div>
        <Input
          id={frontId}
          value={front}
          onChange={(e) => setFront(e.target.value)}
          onBlur={() => handleBlur("front")}
          placeholder="Wprowadź pytanie lub pojęcie..."
          className={cn(frontError && "border-destructive")}
          aria-invalid={!!frontError}
          aria-describedby={frontError ? `${frontId}-error` : undefined}
        />
        {frontError && (
          <p id={`${frontId}-error`} className="text-xs text-destructive">
            {frontError}
          </p>
        )}
      </div>

      {/* Pole back */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={backId}>Tył fiszki (odpowiedź)</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {back.length}/{VALIDATION_CONSTANTS.BACK_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id={backId}
          value={back}
          onChange={(e) => setBack(e.target.value)}
          onBlur={() => handleBlur("back")}
          placeholder="Wprowadź odpowiedź lub definicję..."
          className={cn("min-h-[80px]", backError && "border-destructive")}
          aria-invalid={!!backError}
          aria-describedby={backError ? `${backId}-error` : undefined}
        />
        {backError && (
          <p id={`${backId}-error`} className="text-xs text-destructive">
            {backError}
          </p>
        )}
      </div>

      {/* Przyciski akcji */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit">Zapisz zmiany</Button>
      </div>
    </form>
  );
}
