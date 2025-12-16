import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useProfileView } from "./hooks/useProfileView";
import { ProfileHeader } from "./ProfileHeader";
import { StatsOverview } from "./StatsOverview";
import { GenerationHistory } from "./GenerationHistory";
import { AccountSettings } from "./AccountSettings";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

interface ProfileViewProps {
  /** Email zalogowanego użytkownika */
  userEmail?: string;
}

/**
 * Główny komponent kontenerowy widoku profilu.
 * Zarządza stanem globalnym, koordynuje pobieranie danych i renderuje komponenty potomne.
 */
export function ProfileView({ userEmail }: ProfileViewProps) {
  const { state, actions, computed } = useProfileView();

  // Automatycznie ukrywaj komunikat sukcesu po 5 sekundach
  useEffect(() => {
    if (state.successMessage) {
      const timer = setTimeout(() => {
        actions.clearSuccess();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.successMessage, actions.clearSuccess]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <ProfileHeader userEmail={userEmail} />

      {/* Komunikat sukcesu */}
      {state.successMessage && (
        <Alert className="mb-6 border-green-500/50 bg-green-500/10">
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
            className="text-green-600"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          <AlertTitle className="text-green-600">Sukces</AlertTitle>
          <AlertDescription className="text-green-600/90">
            {state.successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Błąd statystyk */}
      {state.statsError && (
        <Alert variant="destructive" className="mb-6">
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
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <AlertTitle>Błąd ładowania statystyk</AlertTitle>
          <AlertDescription>
            <p>{state.statsError}</p>
            <Button
              onClick={actions.fetchStats}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Spróbuj ponownie
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statystyki */}
      <StatsOverview stats={state.stats} isLoading={state.statsLoading} />

      {/* Błąd historii generowania */}
      {state.sessionsError && (
        <Alert variant="destructive" className="mt-6">
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
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <AlertTitle>Błąd ładowania historii</AlertTitle>
          <AlertDescription>
            <p>{state.sessionsError}</p>
            <Button
              onClick={actions.fetchSessions}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Spróbuj ponownie
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Historia generowania */}
      <GenerationHistory
        sessions={state.sessions}
        pagination={state.sessionsPagination}
        isLoading={state.sessionsLoading}
        onPageChange={actions.changeSessionsPage}
      />

      {/* Ustawienia konta */}
      <AccountSettings onDeleteClick={actions.openDeleteDialog} />

      {/* Dialog usunięcia konta */}
      <DeleteAccountDialog
        isOpen={state.deleteDialogOpen}
        onClose={actions.closeDeleteDialog}
        onConfirm={actions.deleteAccount}
        isDeleting={state.isDeleting}
        step={state.deleteDialogStep}
        onStepChange={actions.setDeleteStep}
        confirmInput={state.deleteConfirmInput}
        onConfirmInputChange={actions.setDeleteConfirmInput}
        error={state.deleteError}
      />
    </div>
  );
}

