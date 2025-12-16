import { Button } from "@/components/ui/button";

interface AddFlashcardButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Przycisk dodawania nowej fiszki z ikoną plus
 */
export function AddFlashcardButton({
  onClick,
  disabled = false,
}: AddFlashcardButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled}>
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
        className="mr-2"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
      Dodaj fiszkę
    </Button>
  );
}

