import { AddFlashcardButton } from "./AddFlashcardButton";
import { FlashcardSortSelect } from "./FlashcardSortSelect";
import type { SortOption, SortOrder, SortValue } from "./types";

interface FlashcardsHeaderProps {
  totalCount: number;
  currentSort: SortOption;
  currentOrder: SortOrder;
  onAddClick: () => void;
  onSortChange: (sort: SortOption, order: SortOrder) => void;
  isLoading: boolean;
}

/**
 * Nagłówek widoku zawierający tytuł, licznik fiszek, przycisk dodawania i selektor sortowania
 */
export function FlashcardsHeader({
  totalCount,
  currentSort,
  currentOrder,
  onAddClick,
  onSortChange,
  isLoading,
}: FlashcardsHeaderProps) {
  const sortValue: SortValue = `${currentSort}_${currentOrder}`;

  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-foreground">Moje fiszki</h1>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">
            ({totalCount} {totalCount === 1 ? "fiszka" : totalCount < 5 ? "fiszki" : "fiszek"})
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <FlashcardSortSelect
          value={sortValue}
          onChange={onSortChange}
          disabled={isLoading}
        />
        <AddFlashcardButton onClick={onAddClick} disabled={isLoading} />
      </div>
    </header>
  );
}

