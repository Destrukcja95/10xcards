import type { AuthError } from "@supabase/supabase-js";
import { AlertCircle, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { getAuthErrorMessage } from "./types";

interface AuthErrorAlertProps {
  error: AuthError | null;
  onDismiss?: () => void;
}

/**
 * Komponent wyświetlający błędy z Supabase Auth w czytelnej formie dla użytkownika.
 * Automatycznie tłumaczy komunikaty błędów na język polski.
 */
export function AuthErrorAlert({ error, onDismiss }: AuthErrorAlertProps) {
  if (!error) {
    return null;
  }

  const errorMessage = getAuthErrorMessage(error.message);

  return (
    <Alert variant="destructive" aria-live="polite" className="relative">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onDismiss}
          aria-label="Zamknij komunikat błędu"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
