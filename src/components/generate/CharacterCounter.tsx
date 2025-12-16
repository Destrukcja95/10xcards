import { cn } from "@/lib/utils";
import { VALIDATION_CONSTANTS } from "./types";

interface CharacterCounterProps {
  currentLength: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * CharacterCounter - wyświetla liczbę znaków i wizualny wskaźnik poprawności zakresu
 * 
 * - Kolor czerwony gdy < minLength
 * - Kolor zielony gdy minLength <= current <= maxLength
 * - Kolor czerwony gdy > maxLength
 */
export function CharacterCounter({
  currentLength,
  minLength = VALIDATION_CONSTANTS.SOURCE_TEXT_MIN_LENGTH,
  maxLength = VALIDATION_CONSTANTS.SOURCE_TEXT_MAX_LENGTH,
}: CharacterCounterProps) {
  const isUnderMin = currentLength < minLength;
  const isOverMax = currentLength > maxLength;
  const isValid = !isUnderMin && !isOverMax;

  // Oblicz procent wypełnienia dla paska postępu
  // 0% gdy 0 znaków, 100% gdy osiągnięto maxLength
  const percentage = Math.min((currentLength / maxLength) * 100, 100);
  
  // Procent dla minLength (wizualna granica)
  const minPercentage = (minLength / maxLength) * 100;

  return (
    <div className="space-y-2">
      {/* Licznik tekstowy */}
      <div className="flex items-center justify-between text-sm">
        <span
          className={cn(
            "font-medium tabular-nums",
            isValid && "text-green-600 dark:text-green-400",
            (isUnderMin || isOverMax) && "text-destructive"
          )}
        >
          {currentLength.toLocaleString("pl-PL")}
        </span>
        <span className="text-muted-foreground">
          {minLength.toLocaleString("pl-PL")} – {maxLength.toLocaleString("pl-PL")} znaków
        </span>
      </div>

      {/* Pasek postępu */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        {/* Wskaźnik minLength */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-border z-10"
          style={{ left: `${minPercentage}%` }}
          aria-hidden="true"
        />
        
        {/* Wypełnienie paska */}
        <div
          className={cn(
            "h-full transition-all duration-200",
            isValid && "bg-green-500 dark:bg-green-400",
            isUnderMin && "bg-amber-500 dark:bg-amber-400",
            isOverMax && "bg-destructive"
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={currentLength}
          aria-valuemin={0}
          aria-valuemax={maxLength}
          aria-label={`${currentLength} z ${minLength}-${maxLength} znaków`}
        />
      </div>

      {/* Komunikat pomocniczy */}
      {isUnderMin && (
        <p className="text-xs text-muted-foreground">
          Potrzebujesz jeszcze {(minLength - currentLength).toLocaleString("pl-PL")} znaków
        </p>
      )}
      {isOverMax && (
        <p className="text-xs text-destructive">
          Przekroczono limit o {(currentLength - maxLength).toLocaleString("pl-PL")} znaków
        </p>
      )}
    </div>
  );
}

