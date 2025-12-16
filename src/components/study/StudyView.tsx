import { useStudySession } from "./hooks/useStudySession";
import { StudySkeleton } from "./StudySkeleton";
import { EmptyStudyState } from "./EmptyStudyState";
import { StudyComplete } from "./StudyComplete";
import { StudyProgress } from "./StudyProgress";
import { StudyCard } from "./StudyCard";
import { RatingButtons } from "./RatingButtons";
import { NextReviewInfo } from "./NextReviewInfo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Główny komponent widoku sesji nauki
 * Zarządza stanem sesji, integruje się z API oraz koordynuje komponenty potomne
 */
export function StudyView() {
  const { state, actions, computed } = useStudySession();

  // Obsługa retry po błędzie
  const handleRetry = () => {
    actions.clearError();
    actions.fetchSession();
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4">
      {/* Alert błędu */}
      {state.error && (
        <Alert variant="destructive" className="w-full">
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
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Spróbuj ponownie
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stan ładowania */}
      {state.isLoading && !computed.hasFlashcards && <StudySkeleton />}

      {/* Stan pusty - brak fiszek do powtórki */}
      {computed.isEmpty && !state.isLoading && <EmptyStudyState />}

      {/* Sesja ukończona */}
      {state.isComplete && !computed.isEmpty && (
        <StudyComplete
          reviewedCount={state.reviewedCount}
          totalDue={state.totalDue}
          onContinue={actions.continueSession}
        />
      )}

      {/* Aktywna sesja nauki */}
      {computed.currentFlashcard && !state.isComplete && !state.isLoading && (
        <>
          {/* Pasek postępu */}
          <StudyProgress
            current={state.currentIndex + 1}
            total={state.flashcards.length}
            totalDue={state.totalDue}
          />

          {/* Karta fiszki */}
          <StudyCard
            flashcard={computed.currentFlashcard}
            isFlipped={state.isFlipped}
            onFlip={actions.flipCard}
            isDisabled={state.isSubmitting}
          />

          {/* Przyciski oceny - widoczne tylko gdy karta jest odwrócona */}
          {state.isFlipped && (
            <RatingButtons
              onRate={actions.rateFlashcard}
              isSubmitting={state.isSubmitting}
            />
          )}

          {/* Info o następnej powtórce */}
          {state.lastReviewResult && (
            <NextReviewInfo reviewResult={state.lastReviewResult} />
          )}
        </>
      )}
    </div>
  );
}

