import type { GenerationSessionDTO, PaginationDTO } from "@/types";
import { GenerationHistoryTable } from "./GenerationHistoryTable";
import { GenerationHistoryPagination } from "./GenerationHistoryPagination";
import { EmptyGenerationHistory } from "./EmptyGenerationHistory";

interface GenerationHistoryProps {
  /** Lista sesji generowania */
  sessions: GenerationSessionDTO[];
  /** Metadane paginacji */
  pagination: PaginationDTO | null;
  /** Czy trwa ładowanie */
  isLoading: boolean;
  /** Callback wywoływany przy zmianie strony */
  onPageChange: (page: number) => void;
}

/**
 * Sekcja z tabelą historii generowania AI.
 * Zawiera nagłówek sekcji, tabelę z danymi i paginację.
 */
export function GenerationHistory({ sessions, pagination, isLoading, onPageChange }: GenerationHistoryProps) {
  // Sprawdź czy jest pusty stan (nie ładowanie i brak sesji)
  const isEmpty = !isLoading && sessions.length === 0;

  return (
    <section className="mt-10" aria-labelledby="generation-history-heading">
      <h2 id="generation-history-heading" className="mb-4 text-xl font-semibold">
        Historia generowania AI
      </h2>

      {isEmpty ? (
        <EmptyGenerationHistory />
      ) : (
        <>
          <GenerationHistoryTable sessions={sessions} isLoading={isLoading} />

          {pagination && (
            <GenerationHistoryPagination pagination={pagination} onPageChange={onPageChange} isLoading={isLoading} />
          )}
        </>
      )}
    </section>
  );
}
