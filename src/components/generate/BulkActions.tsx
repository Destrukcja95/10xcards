import { Button } from "@/components/ui/button";

interface BulkActionsProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  pendingCount: number;
}

/**
 * BulkActions - przyciski do masowych akcji na wszystkich propozycjach w stanie pending
 */
export function BulkActions({
  onAcceptAll,
  onRejectAll,
  pendingCount,
}: BulkActionsProps) {
  const hasNoPending = pendingCount === 0;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
      <div className="text-sm text-muted-foreground">
        {pendingCount > 0 ? (
          <>
            <span className="font-medium text-foreground">{pendingCount}</span>{" "}
            {pendingCount === 1
              ? "propozycja oczekuje"
              : pendingCount < 5
                ? "propozycje oczekują"
                : "propozycji oczekuje"}{" "}
            na decyzję
          </>
        ) : (
          "Wszystkie propozycje zostały przetworzone"
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRejectAll}
          disabled={hasNoPending}
        >
          <XIcon />
          Odrzuć wszystkie
        </Button>
        <Button
          size="sm"
          onClick={onAcceptAll}
          disabled={hasNoPending}
        >
          <CheckIcon />
          Akceptuj wszystkie
        </Button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

