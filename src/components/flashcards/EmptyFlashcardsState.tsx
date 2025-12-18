import { Button } from "@/components/ui/button";

interface EmptyFlashcardsStateProps {
  onAddClick: () => void;
}

/**
 * Stan pusty wyświetlany gdy użytkownik nie ma żadnych fiszek
 */
export function EmptyFlashcardsState({ onAddClick }: EmptyFlashcardsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Ikona pustego stanu */}
      <div className="mb-6 rounded-full bg-muted p-6">
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
          className="text-muted-foreground"
          aria-hidden="true"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 7h10" />
          <path d="M7 12h10" />
          <path d="M7 17h10" />
        </svg>
      </div>

      {/* Tekst */}
      <h2 className="mb-2 text-xl font-semibold text-foreground">Nie masz jeszcze fiszek</h2>
      <p className="mb-8 max-w-sm text-muted-foreground">
        Zacznij od wygenerowania fiszek AI lub dodaj pierwszą ręcznie.
      </p>

      {/* Przyciski CTA */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="default">
          <a href="/generate">Generuj z AI</a>
        </Button>
        <Button variant="outline" onClick={onAddClick}>
          Dodaj ręcznie
        </Button>
      </div>
    </div>
  );
}
