import { useState, useId } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/db/supabase.browser";
import { useAuthForm } from "@/lib/hooks/useAuthForm";
import { registerFormSchema, type RegisterFormData } from "@/lib/schemas/auth.schemas";

import { AuthErrorAlert } from "./AuthErrorAlert";

interface RegisterFormProps {
  onSuccess: () => void;
  onError: (error: AuthError) => void;
  onEmailVerificationRequired?: () => void;
  isLoading?: boolean;
}

/**
 * Formularz rejestracji z walidacją email/hasło/potwierdzenie hasła i obsługą Supabase Auth.
 */
export function RegisterForm({
  onSuccess,
  onError,
  onEmailVerificationRequired,
  isLoading: externalLoading,
}: RegisterFormProps) {
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const confirmPasswordErrorId = useId();

  const handleRegister = async (data: RegisterFormData) => {
    setAuthError(null);

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    // Tymczasowe logowanie dla debugowania
    console.log("Supabase signUp response:", { authData, error });

    if (error) {
      console.error("Supabase signUp error:", error.message, error);
      setAuthError(error);
      onError(error);
      return;
    }

    // Sprawdź czy wymagana weryfikacja email
    if (authData.user && !authData.session) {
      // Wymagana weryfikacja email
      onEmailVerificationRequired?.();
      return;
    }

    // Poczekaj na zapisanie sesji do cookies
    await supabase.auth.getSession();

    // Użytkownik zalogowany automatycznie
    onSuccess();
  };

  const { formData, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } = useAuthForm({
    schema: registerFormSchema,
    initialValues: { email: "", password: "", confirmPassword: "" },
    onSubmit: handleRegister,
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
          placeholder="Minimum 8 znaków"
          value={formData.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          disabled={isDisabled}
          aria-invalid={touched.password && !!errors.password}
          aria-describedby={touched.password && errors.password ? passwordErrorId : undefined}
          autoComplete="new-password"
        />
        {touched.password && errors.password && (
          <p id={passwordErrorId} className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={confirmPasswordId}>Powtórz hasło</Label>
        <Input
          id={confirmPasswordId}
          type="password"
          placeholder="Powtórz hasło"
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
          onBlur={handleBlur("confirmPassword")}
          disabled={isDisabled}
          aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
          aria-describedby={touched.confirmPassword && errors.confirmPassword ? confirmPasswordErrorId : undefined}
          autoComplete="new-password"
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <p id={confirmPasswordErrorId} className="text-sm text-destructive">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isDisabled}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Rejestracja...
          </>
        ) : (
          "Zarejestruj się"
        )}
      </Button>
    </form>
  );
}
