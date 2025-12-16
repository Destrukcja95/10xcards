import { Skeleton } from "@/components/ui/skeleton";
import type { GenerationSessionDTO } from "@/types";
import {
  GenerationHistoryRow,
  GenerationHistoryCard,
} from "./GenerationHistoryRow";

interface GenerationHistoryTableProps {
  /** Lista sesji generowania */
  sessions: GenerationSessionDTO[];
  /** Czy trwa ładowanie */
  isLoading: boolean;
}

/**
 * Skeleton dla tabeli podczas ładowania
 */
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className="p-4">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="p-4 text-center">
            <Skeleton className="mx-auto h-4 w-8" />
          </td>
          <td className="p-4 text-center">
            <Skeleton className="mx-auto h-4 w-8" />
          </td>
          <td className="p-4 text-center">
            <Skeleton className="mx-auto h-4 w-12" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Skeleton dla kart na mobile
 */
function CardsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <Skeleton className="mb-3 h-4 w-32" />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Skeleton className="mx-auto h-3 w-16" />
              <Skeleton className="mx-auto h-6 w-8" />
            </div>
            <div className="space-y-1">
              <Skeleton className="mx-auto h-3 w-16" />
              <Skeleton className="mx-auto h-6 w-8" />
            </div>
            <div className="space-y-1">
              <Skeleton className="mx-auto h-3 w-12" />
              <Skeleton className="mx-auto h-6 w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Tabela historii sesji generowania.
 * Na desktop wyświetla standardową tabelę, na mobile zamienia na stack kart.
 */
export function GenerationHistoryTable({
  sessions,
  isLoading,
}: GenerationHistoryTableProps) {
  return (
    <>
      {/* Wersja desktop - tabela */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">Historia sesji generowania AI</caption>
          <thead>
            <tr className="border-b bg-muted/50">
              <th
                scope="col"
                className="p-4 text-left text-sm font-medium text-muted-foreground"
              >
                Data
              </th>
              <th
                scope="col"
                className="p-4 text-center text-sm font-medium text-muted-foreground"
              >
                Wygenerowane
              </th>
              <th
                scope="col"
                className="p-4 text-center text-sm font-medium text-muted-foreground"
              >
                Zaakceptowane
              </th>
              <th
                scope="col"
                className="p-4 text-center text-sm font-medium text-muted-foreground"
              >
                Wskaźnik
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              sessions.map((session) => (
                <GenerationHistoryRow key={session.id} session={session} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Wersja mobile - karty */}
      <div className="md:hidden">
        {isLoading ? (
          <CardsSkeleton />
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <GenerationHistoryCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

