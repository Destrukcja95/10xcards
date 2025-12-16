import type { GenerationSessionDTO } from "@/types";

interface GenerationHistoryRowProps {
  /** Dane sesji generowania */
  session: GenerationSessionDTO;
}

/**
 * Formatuje datę do czytelnego formatu
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Oblicza wskaźnik akceptacji dla pojedynczej sesji
 */
function calculateSessionRate(
  generated: number,
  accepted: number
): string {
  if (generated === 0) return "0%";
  return `${((accepted / generated) * 100).toFixed(0)}%`;
}

/**
 * Pojedynczy wiersz tabeli historii generowania.
 */
export function GenerationHistoryRow({ session }: GenerationHistoryRowProps) {
  const rate = calculateSessionRate(
    session.generated_count,
    session.accepted_count
  );

  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4 align-middle">{formatDate(session.created_at)}</td>
      <td className="p-4 align-middle text-center tabular-nums">
        {session.generated_count}
      </td>
      <td className="p-4 align-middle text-center tabular-nums">
        {session.accepted_count}
      </td>
      <td className="p-4 align-middle text-center tabular-nums">{rate}</td>
    </tr>
  );
}

/**
 * Wersja kart dla mobile - pojedyncza karta sesji
 */
export function GenerationHistoryCard({ session }: GenerationHistoryRowProps) {
  const rate = calculateSessionRate(
    session.generated_count,
    session.accepted_count
  );

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 text-sm text-muted-foreground">
        {formatDate(session.created_at)}
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs text-muted-foreground">Wygenerowane</div>
          <div className="text-lg font-semibold tabular-nums">
            {session.generated_count}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Zaakceptowane</div>
          <div className="text-lg font-semibold tabular-nums">
            {session.accepted_count}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Wskaźnik</div>
          <div className="text-lg font-semibold tabular-nums">{rate}</div>
        </div>
      </div>
    </div>
  );
}

