import { useMemo } from "react";

interface StudyProgressProps {
  /** Aktualny numer fiszki (1-based dla wyświetlania) */
  current: number;
  /** Liczba fiszek w bieżącej sesji */
  total: number;
  /** Całkowita liczba fiszek do powtórki */
  totalDue: number;
}

/**
 * Wyświetla postęp sesji nauki - aktualny numer fiszki, łączną liczbę oraz wizualny pasek postępu
 */
export function StudyProgress({ current, total, totalDue }: StudyProgressProps) {
  const progressPercent = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  }, [current, total]);

  const remaining = totalDue - current;

  return (
    <div className="w-full space-y-2">
      {/* Tekst postępu */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Fiszka {current}/{total}
        </span>
        {remaining > 0 && (
          <span className="text-muted-foreground">
            Pozostało: {remaining} do powtórki
          </span>
        )}
      </div>

      {/* Pasek postępu */}
      <div 
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Postęp: ${current} z ${total} fiszek`}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

