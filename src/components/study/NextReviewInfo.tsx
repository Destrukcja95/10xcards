import type { ReviewResultDTO } from "@/types";
import { formatInterval } from "./types";

interface NextReviewInfoProps {
  reviewResult: ReviewResultDTO;
}

/**
 * Wyświetla informację o dacie następnej powtórki po ocenie fiszki
 */
export function NextReviewInfo({ reviewResult }: NextReviewInfoProps) {
  const intervalText = formatInterval(reviewResult.interval);

  return (
    <div 
      className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 px-4 py-3 animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      {/* Ikona kalendarza */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>

      <span className="text-sm font-medium text-foreground">
        Następna powtórka: <span className="text-primary">{intervalText}</span>
      </span>
    </div>
  );
}

