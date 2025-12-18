import { Button } from "@/components/ui/button";
import type { PaginationDTO } from "@/types";

interface GenerationHistoryPaginationProps {
  /** Metadane paginacji */
  pagination: PaginationDTO;
  /** Callback wywoływany przy zmianie strony */
  onPageChange: (page: number) => void;
  /** Czy trwa ładowanie */
  isLoading?: boolean;
}

/**
 * Komponent paginacji dla historii generowania.
 * Reużywalny wzorzec z FlashcardsPagination.
 */
export function GenerationHistoryPagination({
  pagination,
  onPageChange,
  isLoading = false,
}: GenerationHistoryPaginationProps) {
  const { page, total_pages } = pagination;

  const isFirstPage = page <= 1;
  const isLastPage = page >= total_pages;

  // Nie renderuj jeśli jest tylko jedna strona lub mniej
  if (total_pages <= 1) {
    return null;
  }

  return (
    <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Paginacja historii generowania">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={isFirstPage || isLoading}
        aria-label="Poprzednia strona"
      >
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
          className="mr-1"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Poprzednia
      </Button>

      <span className="text-sm text-muted-foreground tabular-nums" aria-current="page">
        Strona {page} z {total_pages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={isLastPage || isLoading}
        aria-label="Następna strona"
      >
        Następna
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
          className="ml-1"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Button>
    </nav>
  );
}
