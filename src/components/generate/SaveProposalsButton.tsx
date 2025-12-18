import { Button } from "@/components/ui/button";

interface SaveProposalsButtonProps {
  acceptedCount: number;
  onSave: () => Promise<void>;
  isLoading: boolean;
}

/**
 * SaveProposalsButton - przycisk zapisu zaakceptowanych fiszek z licznikiem
 */
export function SaveProposalsButton({ acceptedCount, onSave, isLoading }: SaveProposalsButtonProps) {
  const canSave = acceptedCount > 0 && !isLoading;

  return (
    <Button size="lg" onClick={onSave} disabled={!canSave} className="min-w-[200px]">
      {isLoading ? (
        <>
          <LoadingSpinner />
          Zapisywanie...
        </>
      ) : (
        <>
          <SaveIcon />
          Zapisz wybrane
          {acceptedCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-xs font-medium">
              {acceptedCount}
            </span>
          )}
        </>
      )}
    </Button>
  );
}

function SaveIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
