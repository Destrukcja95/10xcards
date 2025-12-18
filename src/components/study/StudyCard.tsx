import { useId } from "react";
import type { StudySessionFlashcardDTO } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface StudyCardProps {
  flashcard: StudySessionFlashcardDTO;
  isFlipped: boolean;
  onFlip: () => void;
  isDisabled?: boolean;
}

/**
 * Karta fiszki z animacją 3D flip
 * Wyświetla przód lub tył fiszki w zależności od stanu
 */
export function StudyCard({ flashcard, isFlipped, onFlip, isDisabled = false }: StudyCardProps) {
  const cardId = useId();
  const frontId = `${cardId}-front`;
  const backId = `${cardId}-back`;

  const handleClick = () => {
    if (!isFlipped && !isDisabled) {
      onFlip();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && !isFlipped && !isDisabled) {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div className="perspective-1000 w-full max-w-md" style={{ perspective: "1000px" }}>
      <div
        role="button"
        tabIndex={isFlipped ? -1 : 0}
        aria-pressed={isFlipped}
        aria-label={isFlipped ? "Karta odwrócona" : "Kliknij aby odsłonić odpowiedź"}
        aria-describedby={isFlipped ? backId : frontId}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative h-64 w-full cursor-pointer transition-transform duration-500 ease-in-out
          motion-reduce:transition-none
          ${isFlipped ? "[transform:rotateY(180deg)]" : ""}
          ${isDisabled ? "pointer-events-none opacity-50" : ""}
        `}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front face */}
        <Card
          className={`
            absolute inset-0 flex items-center justify-center p-6
            [backface-visibility:hidden]
            ${!isFlipped ? "shadow-lg hover:shadow-xl transition-shadow" : ""}
          `}
        >
          <CardContent className="flex h-full w-full items-center justify-center p-0">
            <div id={frontId} className="text-center">
              <p className="text-lg font-medium text-foreground leading-relaxed">{flashcard.front}</p>
              {!isFlipped && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Kliknij lub naciśnij spację, aby zobaczyć odpowiedź
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back face */}
        <Card
          className={`
            absolute inset-0 flex items-center justify-center p-6
            [backface-visibility:hidden] [transform:rotateY(180deg)]
            ${isFlipped ? "shadow-lg" : ""}
          `}
        >
          <CardContent className="flex h-full w-full items-center justify-center p-0">
            <div id={backId} className="text-center">
              <p className="text-lg font-medium text-foreground leading-relaxed">{flashcard.back}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
