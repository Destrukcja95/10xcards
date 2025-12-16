import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { GraduationCap, Mail } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { AuthTabs } from "./AuthTabs";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import type { AuthTabValue } from "./types";

interface AuthCardProps {
  defaultTab?: AuthTabValue;
  returnUrl?: string;
}

/**
 * Główny kontener widoku autoryzacji.
 * Zarządza stanem formularzy i komunikacją z Supabase Auth.
 */
export function AuthCard({ defaultTab = "login", returnUrl = "/generate" }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<AuthTabValue>(defaultTab);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const handleLoginSuccess = () => {
    // Przekierowanie po pomyślnym logowaniu
    console.log("[AuthCard] handleLoginSuccess called, returnUrl:", returnUrl);
    console.log("[AuthCard] document.cookie before redirect:", document.cookie);
    
    // Opóźnienie pozwala na zapisanie cookies sesji przez Supabase
    setTimeout(() => {
      console.log("[AuthCard] Redirecting to:", returnUrl);
      window.location.href = returnUrl;
    }, 300);
  };

  const handleRegisterSuccess = () => {
    // Przekierowanie po pomyślnej rejestracji (automatyczne logowanie)
    setTimeout(() => {
      window.location.href = returnUrl;
    }, 300);
  };

  const handleEmailVerificationRequired = () => {
    setShowEmailVerification(true);
  };

  const handleAuthError = (_error: AuthError) => {
    // Błędy są obsługiwane bezpośrednio w komponentach formularzy
    // Ten callback może być użyty do dodatkowej logiki (np. analytics)
  };

  // Ekran potwierdzenia email po rejestracji
  if (showEmailVerification) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sprawdź swoją skrzynkę</CardTitle>
          <CardDescription>
            Wysłaliśmy link weryfikacyjny na podany adres email. Kliknij w link, aby aktywować konto.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Wróć na stronę główną
          </a>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">10x-cards</CardTitle>
        <CardDescription>
          {activeTab === "login"
            ? "Zaloguj się, aby kontynuować naukę"
            : "Utwórz konto i zacznij tworzyć fiszki"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AuthTabs
          value={activeTab}
          onValueChange={setActiveTab}
          loginContent={
            <LoginForm
              onSuccess={handleLoginSuccess}
              onError={handleAuthError}
            />
          }
          registerContent={
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onError={handleAuthError}
              onEmailVerificationRequired={handleEmailVerificationRequired}
            />
          }
        />
      </CardContent>

      <CardFooter className="flex justify-center">
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Wróć na stronę główną
        </a>
      </CardFooter>
    </Card>
  );
}

