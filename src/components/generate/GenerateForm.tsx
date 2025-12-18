import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SourceTextArea } from "./SourceTextArea";
import { RateLimitInfo } from "./RateLimitInfo";
import { VALIDATION_CONSTANTS } from "./types";
import type { RateLimitInfoViewModel } from "./types";

interface GenerateFormProps {
  onSubmit: (sourceText: string) => Promise<void>;
  isLoading: boolean;
  isDisabled?: boolean;
  rateLimit: RateLimitInfoViewModel;
}

/**
 * GenerateForm - formularz do wprowadzania tekstu źródłowego i uruchamiania generowania
 */
export function GenerateForm({ onSubmit, isLoading, isDisabled = false, rateLimit }: GenerateFormProps) {
  const [sourceText, setSourceText] = useState("");

  const currentLength = sourceText.length;
  const isValidLength =
    currentLength >= VALIDATION_CONSTANTS.SOURCE_TEXT_MIN_LENGTH &&
    currentLength <= VALIDATION_CONSTANTS.SOURCE_TEXT_MAX_LENGTH;

  const canSubmit = isValidLength && !isLoading && !isDisabled && !rateLimit.isLimited;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit(sourceText);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informacja o limicie */}
      <RateLimitInfo remaining={rateLimit.remaining} resetAt={rateLimit.resetAt} isLimited={rateLimit.isLimited} />

      {/* Pole tekstowe */}
      <SourceTextArea
        value={sourceText}
        onChange={setSourceText}
        disabled={isLoading || isDisabled}
        hasError={currentLength > VALIDATION_CONSTANTS.SOURCE_TEXT_MAX_LENGTH}
      />

      {/* Przycisk generowania */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!canSubmit} className="min-w-[200px]">
          {isLoading ? (
            <>
              <LoadingSpinner />
              Generowanie...
            </>
          ) : (
            <>
              <SparklesIcon />
              Generuj fiszki
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * Ikona sparkles (AI/magia)
 */
function SparklesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

/**
 * Spinner ładowania
 */
function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
