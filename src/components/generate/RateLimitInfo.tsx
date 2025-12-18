import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { VALIDATION_CONSTANTS } from "./types";

interface RateLimitInfoProps {
  remaining: number;
  resetAt: Date | null;
  isLimited: boolean;
}

/**
 * RateLimitInfo - wyświetla informację o pozostałych generowaniach i czasie do resetu
 */
export function RateLimitInfo({ remaining, resetAt, isLimited }: RateLimitInfoProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!resetAt || !isLimited) {
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = resetAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [resetAt, isLimited]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
        isLimited
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : "border-border bg-muted/50 text-muted-foreground"
      )}
      role="status"
      aria-live="polite"
    >
      {/* Ikona */}
      <svg
        className="h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        {isLimited ? (
          // Ikona blokady
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        ) : (
          // Ikona zegara/limitu
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        )}
      </svg>

      {/* Tekst */}
      <div className="flex-1">
        {isLimited ? (
          <span>
            Przekroczono limit generowań.
            {timeLeft && <span className="ml-1 font-medium">Spróbuj ponownie za {timeLeft}</span>}
          </span>
        ) : (
          <span>
            Pozostało{" "}
            <span className="font-medium tabular-nums">
              {remaining}/{VALIDATION_CONSTANTS.RATE_LIMIT_MAX}
            </span>{" "}
            generowań w tej godzinie
          </span>
        )}
      </div>
    </div>
  );
}
