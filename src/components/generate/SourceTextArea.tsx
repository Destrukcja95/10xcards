import { useId } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharacterCounter } from "./CharacterCounter";
import { cn } from "@/lib/utils";
import { VALIDATION_CONSTANTS } from "./types";

interface SourceTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * SourceTextArea - textarea do wprowadzania tekstu źródłowego z walidacją
 * Integruje Label, Textarea z auto-resize oraz CharacterCounter
 */
export function SourceTextArea({
  value,
  onChange,
  minLength = VALIDATION_CONSTANTS.SOURCE_TEXT_MIN_LENGTH,
  maxLength = VALIDATION_CONSTANTS.SOURCE_TEXT_MAX_LENGTH,
  disabled = false,
  hasError = false,
}: SourceTextAreaProps) {
  const id = useId();
  const currentLength = value.length;
  const isUnderMin = currentLength < minLength;
  const isOverMax = currentLength > maxLength;
  const isValid = currentLength >= minLength && currentLength <= maxLength;

  // Określ stan wizualny
  const showError = hasError || isOverMax;
  const showSuccess = isValid && !hasError;

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="text-base font-medium">
        Tekst źródłowy
      </Label>
      
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoResize
        placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki. Może to być fragment podręcznika, notatki z wykładu, artykuł naukowy lub dowolny inny materiał edukacyjny..."
        className={cn(
          "min-h-[200px] transition-colors",
          showError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50",
          showSuccess && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/50"
        )}
        aria-invalid={showError}
        aria-describedby={`${id}-counter`}
      />

      <div id={`${id}-counter`}>
        <CharacterCounter
          currentLength={currentLength}
          minLength={minLength}
          maxLength={maxLength}
        />
      </div>
    </div>
  );
}

