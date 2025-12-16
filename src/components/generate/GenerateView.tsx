import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GenerateForm } from "./GenerateForm";
import { ProposalList } from "./ProposalList";
import { BulkActions } from "./BulkActions";
import { SaveProposalsButton } from "./SaveProposalsButton";
import { useGenerateView } from "./hooks/useGenerateView";

/**
 * GenerateView - główny komponent widoku generowania fiszek
 * Zarządza całym stanem i koordynuje komponenty potomne
 */
export function GenerateView() {
  const { state, actions, computed } = useGenerateView();

  // Auto-clear success message po 5 sekundach
  useEffect(() => {
    if (state.successMessage) {
      const timer = setTimeout(() => {
        actions.clearSuccess();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.successMessage, actions]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Nagłówek */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Generuj fiszki z AI</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
          Wklej tekst źródłowy, a sztuczna inteligencja wygeneruje dla Ciebie propozycje
          fiszek edukacyjnych. Możesz je przeglądać, edytować i zapisywać.
        </p>
      </div>

      {/* Alert błędu */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.clearError}
              className="ml-4 shrink-0"
            >
              Zamknij
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Alert sukcesu */}
      {state.successMessage && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircleIcon className="text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Sukces</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            {state.successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Formularz generowania */}
      <section className="rounded-lg border border-border bg-card p-6">
        <GenerateForm
          onSubmit={actions.generateFlashcards}
          isLoading={state.isGenerating}
          isDisabled={state.isSaving}
          rateLimit={state.rateLimit}
        />
      </section>

      {/* Sekcja propozycji - widoczna po wygenerowaniu */}
      {computed.hasProposals && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Propozycje fiszek
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({state.proposals.length})
              </span>
            </h2>
          </div>

          {/* Akcje masowe */}
          <BulkActions
            onAcceptAll={actions.acceptAll}
            onRejectAll={actions.rejectAll}
            pendingCount={computed.pendingCount}
          />

          {/* Lista propozycji */}
          <ProposalList
            proposals={state.proposals}
            onAccept={actions.acceptProposal}
            onReject={actions.rejectProposal}
            onEdit={actions.editProposal}
            onUndo={actions.undoProposal}
          />

          {/* Statystyki i przycisk zapisu */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground space-x-4">
              <span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {computed.acceptedCount}
                </span>{" "}
                zaakceptowanych
              </span>
              <span>
                <span className="font-medium text-muted-foreground">
                  {computed.rejectedCount}
                </span>{" "}
                odrzuconych
              </span>
              <span>
                <span className="font-medium text-foreground">
                  {computed.pendingCount}
                </span>{" "}
                oczekujących
              </span>
            </div>

            <SaveProposalsButton
              acceptedCount={computed.acceptedCount}
              onSave={actions.saveAcceptedFlashcards}
              isLoading={state.isSaving}
            />
          </div>
        </section>
      )}

      {/* Stan ładowania generowania */}
      {state.isGenerating && (
        <section className="rounded-lg border border-border bg-card p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner className="h-12 w-12 text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                Generowanie fiszek...
              </p>
              <p className="text-sm text-muted-foreground">
                To może potrwać do 30 sekund w zależności od długości tekstu.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// === IKONY ===

function AlertCircleIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
