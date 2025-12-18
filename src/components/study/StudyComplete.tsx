import { Button } from "@/components/ui/button";

interface StudyCompleteProps {
  /** Liczba przejrzanych fiszek w tej sesji */
  reviewedCount: number;
  /** Całkowita liczba fiszek do powtórki */
  totalDue: number;
  /** Callback do kontynuowania nauki */
  onContinue: () => void;
}

/**
 * Ekran wyświetlany po ukończeniu wszystkich fiszek w sesji
 * Pokazuje podsumowanie i opcje dalszego działania
 */
export function StudyComplete({ reviewedCount, totalDue, onContinue }: StudyCompleteProps) {
  const hasMoreToReview = totalDue > reviewedCount;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" role="status" aria-live="polite">
      {/* Ikona sukcesu */}
      <div className="mb-6 rounded-full bg-emerald-100 p-6 dark:bg-emerald-950">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      </div>

      {/* Tekst gratulacyjny */}
      <h2 className="mb-2 text-2xl font-bold text-foreground">Gratulacje! 🎉</h2>
      <p className="mb-2 text-lg text-muted-foreground">Ukończyłeś sesję nauki.</p>
      <p className="mb-8 text-muted-foreground">
        Przejrzałeś <span className="font-semibold text-foreground">{reviewedCount}</span>{" "}
        {reviewedCount === 1 ? "fiszkę" : reviewedCount < 5 ? "fiszki" : "fiszek"}.
      </p>

      {/* Przyciski akcji */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {hasMoreToReview && (
          <Button onClick={onContinue} variant="default">
            Kontynuuj naukę
            <span className="ml-1 text-xs opacity-75">({totalDue - reviewedCount} pozostało)</span>
          </Button>
        )}
        <Button asChild variant={hasMoreToReview ? "outline" : "default"}>
          <a href="/flashcards">Wróć do fiszek</a>
        </Button>
      </div>
    </div>
  );
}
