import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { SM2Rating } from "@/types";
import { RATING_BUTTONS, type RatingButtonVariant } from "./types";

interface RatingButtonsProps {
  onRate: (rating: SM2Rating) => void;
  isSubmitting: boolean;
}

/**
 * Mapowanie wariantów na klasy Tailwind
 * Używamy customowych kolorów ponieważ Button ma tylko niektóre warianty
 */
const variantStyles: Record<RatingButtonVariant, string> = {
  destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
  warning: "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700",
  secondary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800",
};

/**
 * Grupa 4 przycisków oceny SM-2
 * Każdy przycisk ma dedykowany kolor i mapuje się na konkretny rating
 */
export function RatingButtons({ onRate, isSubmitting }: RatingButtonsProps) {
  const handleRate = useCallback(
    (rating: SM2Rating) => {
      if (!isSubmitting) {
        onRate(rating);
      }
    },
    [onRate, isSubmitting]
  );

  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-3" role="group" aria-label="Oceń swoją odpowiedź">
      {RATING_BUTTONS.map((button) => (
        <Button
          key={button.rating}
          onClick={() => handleRate(button.rating)}
          disabled={isSubmitting}
          className={`
            h-12 text-sm font-medium transition-all
            ${variantStyles[button.variant]}
            disabled:opacity-50 disabled:pointer-events-none
          `}
          aria-label={`${button.label} - ${button.description}`}
          title={`${button.label} (${button.shortcut}) - ${button.description}`}
        >
          <span className="flex items-center gap-2">
            {isSubmitting ? (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <>
                <kbd className="hidden sm:inline-flex items-center justify-center rounded bg-white/20 px-1.5 py-0.5 text-xs font-mono">
                  {button.shortcut}
                </kbd>
                {button.label}
              </>
            )}
          </span>
        </Button>
      ))}
    </div>
  );
}
