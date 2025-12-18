import { useState, useId } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/db/supabase.browser";
import { useAuthForm } from "@/lib/hooks/useAuthForm";
import { loginFormSchema, type LoginFormData } from "@/lib/schemas/auth.schemas";

import { AuthErrorAlert } from "./AuthErrorAlert";

interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: AuthError) => void;
  isLoading?: boolean;
}

/**
 * Formularz logowania z walidacją email/hasło i obsługą Supabase Auth.
 */
export function LoginForm({ onSuccess, onError, isLoading: externalLoading }: LoginFormProps) {
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  const handleLogin = async (data: LoginFormData) => {
    setAuthError(null);

    console.log("[LoginForm] Starting signInWithPassword...");

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    console.log("[LoginForm] signInWithPassword result:", { authData, error });

    if (error) {
      console.error("[LoginForm] Auth error:", error.message);
      setAuthError(error);
      onError(error);
      return;
    }

    // Poczekaj na zapisanie sesji do cookies
    // Pobierz sesję żeby upewnić się, że jest zapisana
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("[LoginForm] getSession result:", sessionData);
    console.log("[LoginForm] document.cookie:", document.cookie);

    console.log("[LoginForm] Calling onSuccess...");
    onSuccess();
  };

  const { formData, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } = useAuthForm({
    schema: loginFormSchema,
    initialValues: { email: "", password: "" },
    onSubmit: handleLogin,
  });

  const isDisabled = isSubmitting || externalLoading;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthErrorAlert error={authError} onDismiss={() => setAuthError(null)} />

      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          placeholder="twoj@email.pl"
          value={formData.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          disabled={isDisabled}
          aria-invalid={touched.email && !!errors.email}
          aria-describedby={touched.email && errors.email ? emailErrorId : undefined}
          autoComplete="email"
        />
        {touched.email && errors.email && (
          <p id={emailErrorId} className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Hasło</Label>
        <Input
          id={passwordId}
          type="password"
          placeholder="Wpisz hasło"
          value={formData.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          disabled={isDisabled}
          aria-invalid={touched.password && !!errors.password}
          aria-describedby={touched.password && errors.password ? passwordErrorId : undefined}
          autoComplete="current-password"
        />
        {touched.password && errors.password && (
          <p id={passwordErrorId} className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isDisabled}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logowanie...
          </>
        ) : (
          "Zaloguj się"
        )}
      </Button>
    </form>
  );
}
