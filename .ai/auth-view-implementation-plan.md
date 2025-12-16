# Plan implementacji widoku Autoryzacja

## 1. Przegląd

Widok autoryzacji (`/auth`) jest punktem wejścia dla użytkowników do systemu 10x-cards. Umożliwia logowanie istniejących użytkowników oraz rejestrację nowych kont. Widok składa się ze strony Astro z React Islands dla interaktywnych formularzy. Wykorzystuje Supabase Auth do obsługi uwierzytelniania z użyciem email/hasło.

Widok realizuje wymagania z User Stories:
- **US-001**: Rejestracja konta
- **US-002**: Logowanie do aplikacji

## 2. Routing widoku

| Atrybut | Wartość |
|---------|---------|
| **Ścieżka** | `/auth` |
| **Plik strony** | `src/pages/auth.astro` |
| **Autoryzacja** | Nie wymagana |
| **Zachowanie dla zalogowanych** | Automatyczny redirect do `/generate` |

### Logika redirectów

```
Użytkownik wchodzi na /auth
         │
         ▼
    Czy zalogowany?
         │
    ┌────┴────┐
    │ TAK     │ NIE
    ▼         ▼
Redirect   Wyświetl
/generate  formularze
```

Po pomyślnym logowaniu/rejestracji:
- Jeśli URL zawiera `?returnUrl=X` → redirect do X
- W przeciwnym razie → redirect do `/generate`

## 3. Struktura komponentów

```
src/pages/auth.astro
└── PublicLayout.astro
    └── <main> (container ze stylami)
        └── AuthCard (React Island, client:load)
            ├── Logo + Nagłówek
            ├── AuthTabs
            │   ├── Tab "Zaloguj się"
            │   └── Tab "Zarejestruj się"
            ├── TabContent
            │   ├── LoginForm (gdy aktywna zakładka login)
            │   │   ├── Input (email)
            │   │   ├── Input (hasło)
            │   │   ├── Button (submit)
            │   │   └── AuthErrorAlert (warunkowo)
            │   └── RegisterForm (gdy aktywna zakładka register)
            │       ├── Input (email)
            │       ├── Input (hasło)
            │       ├── Input (powtórz hasło)
            │       ├── Button (submit)
            │       └── AuthErrorAlert (warunkowo)
            └── LinkToLanding ("Wróć na stronę główną")
```

## 4. Szczegóły komponentów

### 4.1 AuthCard

- **Opis:** Główny kontener widoku autoryzacji, React Island zarządzający stanem formularzy i komunikacją z Supabase Auth. Odpowiada za koordynację między zakładkami oraz obsługę sukcesu/błędów.
- **Lokalizacja:** `src/components/auth/AuthCard.tsx`
- **Główne elementy:**
  - Card (Shadcn/ui) jako wrapper
  - CardHeader z logo i tytułem
  - CardContent z AuthTabs i formularzami
  - CardFooter z linkiem powrotu
- **Obsługiwane interakcje:**
  - Przełączanie między zakładkami login/register
  - Przekazywanie callback'ów sukcesu/błędu do formularzy
- **Obsługiwana walidacja:** Brak (delegowana do formularzy podrzędnych)
- **Typy:**
  - `AuthTab` (typ wewnętrzny)
- **Propsy:**
  - `defaultTab?: "login" | "register"` - domyślna aktywna zakładka (default: "login")
  - `returnUrl?: string` - URL do przekierowania po sukcesie

### 4.2 AuthTabs

- **Opis:** Komponent zakładek przełączający między formularzem logowania a rejestracji. Oparty na Shadcn/ui Tabs.
- **Lokalizacja:** `src/components/auth/AuthTabs.tsx`
- **Główne elementy:**
  - Tabs (Shadcn/ui)
  - TabsList z dwoma TabsTrigger
  - TabsContent dla każdej zakładki
- **Obsługiwane interakcje:**
  - Kliknięcie zakładki → zmiana aktywnego formularza
  - Obsługa keyboard navigation (Tab, Arrow keys, Enter)
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `AuthTabValue = "login" | "register"`
- **Propsy:**
  - `value: AuthTabValue` - aktywna zakładka
  - `onValueChange: (value: AuthTabValue) => void` - callback zmiany
  - `children: React.ReactNode` - zawartość zakładek

### 4.3 LoginForm

- **Opis:** Formularz logowania z walidacją email/hasło i obsługą Supabase Auth signInWithPassword.
- **Lokalizacja:** `src/components/auth/LoginForm.tsx`
- **Główne elementy:**
  - `<form>` z atrybutem noValidate
  - Label + Input dla email (type="email")
  - Label + Input dla hasła (type="password")
  - Button submit z loading state
  - AuthErrorAlert (warunkowo, gdy błąd)
- **Obsługiwane interakcje:**
  - Wpisywanie w pola (onChange) → aktualizacja stanu + walidacja inline
  - Submit formularza → walidacja + wywołanie Supabase signInWithPassword
  - Focus/blur na polach → pokazanie/ukrycie błędów inline
- **Obsługiwana walidacja:**
  - Email: wymagane, format email, max 255 znaków
  - Hasło: wymagane, min 1 znak (logowanie nie wymaga min 8)
- **Typy:**
  - `LoginFormData`
  - `LoginFormErrors`
- **Propsy:**
  - `onSuccess: () => void` - callback po pomyślnym logowaniu
  - `onError: (error: AuthError) => void` - callback przy błędzie API
  - `isLoading?: boolean` - zewnętrzny stan ładowania (opcjonalny)

### 4.4 RegisterForm

- **Opis:** Formularz rejestracji z walidacją email/hasło/potwierdzenie hasła i obsługą Supabase Auth signUp.
- **Lokalizacja:** `src/components/auth/RegisterForm.tsx`
- **Główne elementy:**
  - `<form>` z atrybutem noValidate
  - Label + Input dla email (type="email")
  - Label + Input dla hasła (type="password")
  - Label + Input dla potwierdzenia hasła (type="password")
  - PasswordStrengthIndicator (opcjonalny)
  - Button submit z loading state
  - AuthErrorAlert (warunkowo, gdy błąd)
- **Obsługiwane interakcje:**
  - Wpisywanie w pola → aktualizacja stanu + walidacja inline
  - Submit formularza → walidacja + wywołanie Supabase signUp
  - Blur na polu "powtórz hasło" → walidacja zgodności haseł
- **Obsługiwana walidacja:**
  - Email: wymagane, format email, max 255 znaków
  - Hasło: wymagane, min 8 znaków
  - Powtórz hasło: wymagane, musi być identyczne z hasłem
- **Typy:**
  - `RegisterFormData`
  - `RegisterFormErrors`
- **Propsy:**
  - `onSuccess: () => void` - callback po pomyślnej rejestracji
  - `onError: (error: AuthError) => void` - callback przy błędzie API
  - `isLoading?: boolean` - zewnętrzny stan ładowania

### 4.5 AuthErrorAlert

- **Opis:** Komponent wyświetlający błędy z Supabase Auth w czytelnej formie dla użytkownika.
- **Lokalizacja:** `src/components/auth/AuthErrorAlert.tsx`
- **Główne elementy:**
  - Alert (Shadcn/ui) z variant="destructive"
  - AlertTitle
  - AlertDescription z przetłumaczonym komunikatem błędu
- **Obsługiwane interakcje:**
  - Przycisk zamknięcia (opcjonalny) → ukrycie alertu
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `AuthError` (z @supabase/supabase-js)
- **Propsy:**
  - `error: AuthError | null` - obiekt błędu do wyświetlenia
  - `onDismiss?: () => void` - callback zamknięcia alertu

## 5. Typy

### 5.1 Typy formularzy (nowe typy do utworzenia)

```typescript
// src/lib/schemas/auth.schemas.ts

import { z } from "zod";

/**
 * Schema walidacji formularza logowania
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .max(255, "Email może mieć maksymalnie 255 znaków"),
  password: z
    .string()
    .min(1, "Hasło jest wymagane"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Schema walidacji formularza rejestracji
 */
export const registerFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .max(255, "Email może mieć maksymalnie 255 znaków"),
  password: z
    .string()
    .min(1, "Hasło jest wymagane")
    .min(8, "Hasło musi mieć co najmniej 8 znaków"),
  confirmPassword: z
    .string()
    .min(1, "Potwierdzenie hasła jest wymagane"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;
```

### 5.2 Typy błędów formularzy

```typescript
// src/components/auth/types.ts

/**
 * Błędy walidacji formularza logowania
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Błędy walidacji formularza rejestracji
 */
export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Typ zakładki autoryzacji
 */
export type AuthTabValue = "login" | "register";

/**
 * Mapowanie kodów błędów Supabase na komunikaty użytkownika
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Nieprawidłowy email lub hasło",
  "Email not confirmed": "Email nie został potwierdzony. Sprawdź skrzynkę pocztową",
  "User already registered": "Użytkownik z tym adresem email już istnieje",
  "Password should be at least 6 characters": "Hasło musi mieć co najmniej 6 znaków",
  "Unable to validate email address: invalid format": "Nieprawidłowy format adresu email",
  "Signup requires a valid password": "Rejestracja wymaga podania hasła",
  "Email rate limit exceeded": "Zbyt wiele prób. Spróbuj ponownie za chwilę",
};
```

### 5.3 Typy Supabase Auth (istniejące)

```typescript
// z @supabase/supabase-js
import type { AuthError, User, Session } from "@supabase/supabase-js";
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentów

Widok autoryzacji używa lokalnego stanu React (useState) bez potrzeby globalnego store'a:

| Komponent | Stan | Typ | Opis |
|-----------|------|-----|------|
| AuthCard | `activeTab` | `AuthTabValue` | Aktywna zakładka |
| AuthCard | `authError` | `AuthError \| null` | Błąd z API |
| LoginForm | `formData` | `LoginFormData` | Wartości pól formularza |
| LoginForm | `errors` | `LoginFormErrors` | Błędy walidacji |
| LoginForm | `isSubmitting` | `boolean` | Stan wysyłania |
| LoginForm | `touched` | `Record<string, boolean>` | Które pola były edytowane |
| RegisterForm | `formData` | `RegisterFormData` | Wartości pól formularza |
| RegisterForm | `errors` | `RegisterFormErrors` | Błędy walidacji |
| RegisterForm | `isSubmitting` | `boolean` | Stan wysyłania |
| RegisterForm | `touched` | `Record<string, boolean>` | Które pola były edytowane |

### 6.2 Custom Hook: useAuthForm

```typescript
// src/lib/hooks/useAuthForm.ts

import { useState, useCallback } from "react";
import type { ZodSchema } from "zod";

interface UseAuthFormOptions<T> {
  schema: ZodSchema<T>;
  initialValues: T;
  onSubmit: (data: T) => Promise<void>;
}

interface UseAuthFormReturn<T> {
  formData: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFieldError: (field: keyof T, message: string) => void;
  resetForm: () => void;
}

export function useAuthForm<T extends Record<string, unknown>>({
  schema,
  initialValues,
  onSubmit,
}: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  // Implementacja hooka
}
```

Hook zapewnia:
- Walidację inline przy blur (dotknięte pola)
- Walidację całego formularza przy submit
- Stan isSubmitting do blokowania wielokrotnego wysłania
- Możliwość ustawienia zewnętrznych błędów (z API)

## 7. Integracja API

### 7.1 Klient Supabase dla komponentów React

Komponenty React używają klienta Supabase utworzonego w przeglądarce:

```typescript
// src/db/supabase.browser.ts

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

**Uwaga:** Zmienne środowiskowe dla klienta przeglądarki muszą mieć prefix `PUBLIC_` w Astro.

### 7.2 Operacje autoryzacji

#### Logowanie (signInWithPassword)

```typescript
// W LoginForm
const handleLogin = async (data: LoginFormData) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  
  if (error) {
    throw error;
  }
  
  // Sukces - cookies ustawione automatycznie przez Supabase
  window.location.href = returnUrl || "/generate";
};
```

**Typ odpowiedzi sukcesu:**
```typescript
{
  data: {
    user: User;
    session: Session;
  };
  error: null;
}
```

**Typ odpowiedzi błędu:**
```typescript
{
  data: { user: null; session: null };
  error: AuthError;
}
```

#### Rejestracja (signUp)

```typescript
// W RegisterForm
const handleRegister = async (data: RegisterFormData) => {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  
  if (error) {
    throw error;
  }
  
  // Sprawdź czy wymagana weryfikacja email
  if (authData.user && !authData.session) {
    // Wymagana weryfikacja email
    // Wyświetl komunikat o konieczności potwierdzenia
  } else {
    // Użytkownik zalogowany automatycznie
    window.location.href = returnUrl || "/generate";
  }
};
```

### 7.3 Sprawdzenie sesji w Astro

```astro
---
// src/pages/auth.astro
import PublicLayout from "@/layouts/PublicLayout.astro";
import AuthCard from "@/components/auth/AuthCard";

// Sprawdź czy użytkownik jest zalogowany
const { data: { user } } = await Astro.locals.supabase.auth.getUser();

// Redirect zalogowanych użytkowników
if (user) {
  return Astro.redirect("/generate");
}

// Pobierz returnUrl z query params
const returnUrl = Astro.url.searchParams.get("returnUrl") || "/generate";
const defaultTab = Astro.url.searchParams.get("tab") === "register" ? "register" : "login";
---

<PublicLayout title="Zaloguj się - 10x-cards">
  <main class="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
    <AuthCard 
      client:load 
      defaultTab={defaultTab} 
      returnUrl={returnUrl} 
    />
  </main>
</PublicLayout>
```

## 8. Interakcje użytkownika

### 8.1 Przepływ logowania

```
1. Użytkownik wchodzi na /auth
         │
2. Widzi formularz logowania (domyślna zakładka)
         │
3. Wpisuje email i hasło
         │ (walidacja inline przy blur)
         │
4. Klika "Zaloguj się"
         │
         ├─► Walidacja nieudana → Wyświetl błędy inline
         │
         └─► Walidacja OK → Wysłanie do Supabase
                   │
                   ├─► Błąd API → Wyświetl AuthErrorAlert
                   │
                   └─► Sukces → Redirect do /generate (lub returnUrl)
```

### 8.2 Przepływ rejestracji

```
1. Użytkownik klika zakładkę "Zarejestruj się"
         │
2. Wypełnia formularz (email, hasło, powtórz hasło)
         │ (walidacja inline: email format, hasło min 8, zgodność haseł)
         │
3. Klika "Zarejestruj się"
         │
         ├─► Walidacja nieudana → Wyświetl błędy inline
         │
         └─► Walidacja OK → Wysłanie do Supabase
                   │
                   ├─► Błąd API → Wyświetl AuthErrorAlert
                   │
                   └─► Sukces
                         │
                         ├─► Brak sesji (weryfikacja email) → Komunikat o sprawdzeniu skrzynki
                         │
                         └─► Sesja utworzona → Redirect do /generate
```

### 8.3 Interakcje klawiszowe

| Klawisz | Kontekst | Akcja |
|---------|----------|-------|
| Tab | Formularze | Przejście do następnego pola |
| Shift+Tab | Formularze | Przejście do poprzedniego pola |
| Enter | W polu formularza | Submit formularza |
| Arrow Left/Right | AuthTabs | Przełączanie zakładek |
| Enter/Space | AuthTabs (focus) | Aktywacja zakładki |

## 9. Warunki i walidacja

### 9.1 Walidacja formularza logowania

| Pole | Reguły walidacji | Komunikat błędu | Moment walidacji |
|------|------------------|-----------------|------------------|
| Email | Wymagane | "Email jest wymagany" | blur, submit |
| Email | Format email | "Nieprawidłowy format email" | blur, submit |
| Email | Max 255 znaków | "Email może mieć maksymalnie 255 znaków" | blur, submit |
| Hasło | Wymagane | "Hasło jest wymagane" | blur, submit |

### 9.2 Walidacja formularza rejestracji

| Pole | Reguły walidacji | Komunikat błędu | Moment walidacji |
|------|------------------|-----------------|------------------|
| Email | Wymagane | "Email jest wymagany" | blur, submit |
| Email | Format email | "Nieprawidłowy format email" | blur, submit |
| Email | Max 255 znaków | "Email może mieć maksymalnie 255 znaków" | blur, submit |
| Hasło | Wymagane | "Hasło jest wymagane" | blur, submit |
| Hasło | Min 8 znaków | "Hasło musi mieć co najmniej 8 znaków" | blur, submit |
| Powtórz hasło | Wymagane | "Potwierdzenie hasła jest wymagane" | blur, submit |
| Powtórz hasło | Zgodność z hasłem | "Hasła muszą być identyczne" | blur (oba pola), submit |

### 9.3 Wpływ walidacji na UI

- **Pole z błędem:** czerwona ramka (`border-destructive`), komunikat pod polem
- **Pole poprawne (touched):** opcjonalnie zielona ramka lub checkmark
- **Przycisk submit:** disabled gdy `isSubmitting` lub brak zmian w formularzu
- **Błędy wyświetlane:** tylko dla pól `touched` (po blur) lub po próbie submit

## 10. Obsługa błędów

### 10.1 Błędy walidacji (client-side)

Obsługiwane przez Zod schema i wyświetlane inline pod polami formularza.

### 10.2 Błędy Supabase Auth

| Kod błędu Supabase | Komunikat dla użytkownika | Akcja UI |
|--------------------|---------------------------|----------|
| Invalid login credentials | "Nieprawidłowy email lub hasło" | AuthErrorAlert |
| User already registered | "Użytkownik z tym adresem email już istnieje" | AuthErrorAlert + focus na email |
| Email not confirmed | "Email nie został potwierdzony. Sprawdź skrzynkę pocztową" | AuthErrorAlert + opcja ponownego wysłania |
| Email rate limit exceeded | "Zbyt wiele prób. Spróbuj ponownie za chwilę" | AuthErrorAlert + disable form |
| Signup requires a valid password | "Rejestracja wymaga podania hasła" | Focus na pole hasła |
| Network error | "Błąd połączenia. Sprawdź połączenie internetowe" | AuthErrorAlert + przycisk retry |
| Unknown error | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie" | AuthErrorAlert |

### 10.3 Błędy sieciowe

```typescript
const handleAuthAction = async (action: () => Promise<void>) => {
  try {
    await action();
  } catch (error) {
    if (error instanceof Error && error.message === "Failed to fetch") {
      setAuthError({
        message: "Błąd połączenia. Sprawdź połączenie internetowe",
        name: "NetworkError",
      } as AuthError);
    } else {
      throw error;
    }
  }
};
```

### 10.4 Obsługa przekierowania po wygaśnięciu sesji

Gdy użytkownik zostanie przekierowany z chronionej strony:

```astro
---
// W protected pages (np. /generate)
const { data: { user } } = await Astro.locals.supabase.auth.getUser();

if (!user) {
  const returnUrl = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/auth?returnUrl=${returnUrl}`);
}
---
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie infrastruktury (30 min)

1. Utwórz zmienne środowiskowe dla klienta przeglądarki:
   ```
   PUBLIC_SUPABASE_URL=...
   PUBLIC_SUPABASE_KEY=...
   ```

2. Utwórz klienta Supabase dla przeglądarki:
   - Plik: `src/db/supabase.browser.ts`

3. Zainstaluj brakujące komponenty Shadcn/ui:
   ```bash
   npx shadcn@latest add card tabs input label alert
   ```

### Krok 2: Implementacja schematów walidacji (20 min)

1. Utwórz katalog `src/lib/schemas/`
2. Utwórz plik `src/lib/schemas/auth.schemas.ts` z:
   - `loginFormSchema`
   - `registerFormSchema`
   - Eksport typów `LoginFormData`, `RegisterFormData`

### Krok 3: Implementacja typów (15 min)

1. Utwórz katalog `src/components/auth/`
2. Utwórz plik `src/components/auth/types.ts` z:
   - `LoginFormErrors`
   - `RegisterFormErrors`
   - `AuthTabValue`
   - `AUTH_ERROR_MESSAGES`

### Krok 4: Implementacja custom hook useAuthForm (30 min)

1. Utwórz katalog `src/lib/hooks/` (jeśli nie istnieje)
2. Utwórz plik `src/lib/hooks/useAuthForm.ts`
3. Zaimplementuj hook z obsługą:
   - Walidacji Zod
   - Stanu touched
   - Submit handling
   - Error setting

### Krok 5: Implementacja AuthErrorAlert (20 min)

1. Utwórz plik `src/components/auth/AuthErrorAlert.tsx`
2. Zaimplementuj mapowanie błędów Supabase na komunikaty PL
3. Dodaj warunkowe renderowanie i animację wejścia

### Krok 6: Implementacja LoginForm (45 min)

1. Utwórz plik `src/components/auth/LoginForm.tsx`
2. Zaimplementuj:
   - Formularz z polami email/hasło
   - Użycie useAuthForm hook
   - Wywołanie supabase.auth.signInWithPassword
   - Obsługę loading state
   - Integrację z AuthErrorAlert

### Krok 7: Implementacja RegisterForm (45 min)

1. Utwórz plik `src/components/auth/RegisterForm.tsx`
2. Zaimplementuj:
   - Formularz z polami email/hasło/powtórz hasło
   - Użycie useAuthForm hook
   - Wywołanie supabase.auth.signUp
   - Obsługę weryfikacji email
   - Obsługę loading state
   - Integrację z AuthErrorAlert

### Krok 8: Implementacja AuthTabs (20 min)

1. Utwórz plik `src/components/auth/AuthTabs.tsx`
2. Zaimplementuj wrapper na Shadcn Tabs z:
   - Dwoma zakładkami (login/register)
   - Poprawną obsługą ARIA
   - Animacją przejścia

### Krok 9: Implementacja AuthCard (30 min)

1. Utwórz plik `src/components/auth/AuthCard.tsx`
2. Zaimplementuj:
   - Główny kontener z Card
   - Stan activeTab
   - Obsługę props (defaultTab, returnUrl)
   - Koordynację sukcesu/błędów
   - Link powrotu na landing

### Krok 10: Implementacja strony Astro (20 min)

1. Utwórz plik `src/pages/auth.astro`
2. Zaimplementuj:
   - Sprawdzenie sesji i redirect
   - Odczyt returnUrl i defaultTab z query params
   - Renderowanie AuthCard z client:load
   - Odpowiednie meta tagi SEO

### Krok 11: Stylowanie i responsywność (30 min)

1. Dodaj style Tailwind do komponentów
2. Przetestuj na różnych breakpointach
3. Upewnij się o poprawnym działaniu na mobile (full-width, touch-friendly)

### Krok 12: Dostępność (a11y) (20 min)

1. Dodaj odpowiednie atrybuty ARIA:
   - `aria-describedby` dla błędów pól
   - `aria-invalid` dla pól z błędami
   - `aria-live="polite"` dla AuthErrorAlert
2. Przetestuj nawigację klawiaturą
3. Sprawdź focus management po submit

### Krok 13: Testy manualne (30 min)

1. Przetestuj scenariusze:
   - Pomyślne logowanie
   - Nieudane logowanie (złe dane)
   - Pomyślna rejestracja
   - Rejestracja istniejącego użytkownika
   - Walidacja inline
   - Redirect po zalogowaniu
   - Redirect zalogowanego użytkownika z /auth
   - Działanie na mobile

### Krok 14: Finalizacja (15 min)

1. Przegląd kodu
2. Usunięcie console.log i debugowania
3. Sprawdzenie linterów
4. Commit i PR

## Podsumowanie

Łączny szacowany czas implementacji: **~6 godzin**

Główne pliki do utworzenia:
- `src/db/supabase.browser.ts`
- `src/lib/schemas/auth.schemas.ts`
- `src/lib/hooks/useAuthForm.ts`
- `src/components/auth/types.ts`
- `src/components/auth/AuthCard.tsx`
- `src/components/auth/AuthTabs.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/AuthErrorAlert.tsx`
- `src/pages/auth.astro`

