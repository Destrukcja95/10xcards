import { Button } from "@/components/ui/button";

/**
 * Stan pusty wyświetlany gdy brak fiszek do powtórki
 */
export function EmptyStudyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Ikona sukcesu - kalendarz z checkmark */}
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
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      </div>

      {/* Tekst */}
      <h2 className="mb-2 text-xl font-semibold text-foreground">Świetna robota!</h2>
      <p className="mb-8 max-w-sm text-muted-foreground">
        Nie masz fiszek do powtórki. Wróć później lub dodaj nowe fiszki.
      </p>

      {/* Przyciski CTA */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="default">
          <a href="/flashcards">Idź do Moje fiszki</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/generate">Generuj nowe fiszki</a>
        </Button>
      </div>
    </div>
  );
}
