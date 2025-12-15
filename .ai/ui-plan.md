# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Aplikacja 10x-cards to SPA-like aplikacja webowa zbudowana na Astro 5 z React 19 dla interaktywnych komponentów. Struktura UI składa się z 6 głównych widoków zorganizowanych wokół trzech głównych przepływów: autoryzacji, generowania/zarządzania fiszkami oraz nauki.

### Główne założenia architektoniczne

- **Rendering:** Strony statyczne Astro (SSG) dla Landing i Auth, dynamiczne wyspy React dla interaktywnych widoków
- **Routing:** File-based routing Astro z ochroną tras przez middleware
- **Stylowanie:** Tailwind CSS 4 z podejściem mobile-first
- **Komponenty:** Shadcn/ui jako biblioteka bazowa + custom komponenty domenowe
- **Stan:** TanStack Query dla cache API + lokalny useState/useReducer dla formularzy
- **Autoryzacja:** Supabase Auth z JWT w cookies, middleware sprawdza sesję

### Hierarchia layoutów

```
BaseLayout.astro (meta, fonty, global styles)
├── PublicLayout.astro (nawigacja niezalogowana)
│   ├── / (Landing)
│   └── /auth (Autoryzacja)
└── AuthLayout.astro (nawigacja zalogowana, ochrona tras)
    ├── /generate (Generowanie)
    ├── /flashcards (Moje fiszki)
    ├── /study (Sesja nauki)
    └── /profile (Profil)
```

---

## 2. Lista widoków

### 2.1 Landing Page (`/`)

| Atrybut | Opis |
|---------|------|
| **Ścieżka** | `/` |
| **Cel** | Prezentacja produktu, konwersja nowych użytkowników na rejestrację |
| **Autoryzacja** | Nie wymagana |
| **Typ strony** | Statyczna (Astro SSG, SEO-optimized) |

#### Kluczowe informacje do wyświetlenia
- Wartość produktu (szybkie tworzenie fiszek z AI)
- Główne korzyści (oszczędność czasu, spaced repetition)
- Call-to-action do rejestracji
- Opcjonalnie: przykład działania, social proof

#### Kluczowe komponenty widoku
| Komponent | Typ | Opis |
|-----------|-----|------|
| `HeroSection` | Astro | Nagłówek z głównym przekazem i CTA |
| `FeaturesList` | Astro | Lista korzyści z ikonami |
| `CTASection` | Astro | Sekcja z przyciskiem rejestracji |
| `PublicNav` | Astro | Nawigacja dla niezalogowanych |

#### UX, dostępność i bezpieczeństwo
- **UX:** Prosty, jednoznaczny przekaz, wyraźne CTA, szybkie ładowanie
- **Dostępność:** Semantyczny HTML (h1, nav, main, section), odpowiedni kontrast, alt dla obrazów
- **Bezpieczeństwo:** Brak wrażliwych danych, statyczny content

---

### 2.2 Autoryzacja (`/auth`)

| Atrybut | Opis |
|---------|------|
| **Ścieżka** | `/auth` |
| **Cel** | Logowanie i rejestracja użytkowników |
| **Autoryzacja** | Nie wymagana (redirect do /generate jeśli zalogowany) |
| **Typ strony** | Statyczna z React Islands dla formularzy |

#### Kluczowe informacje do wyświetlenia
- Formularz logowania (email, hasło)
- Formularz rejestracji (email, hasło, powtórz hasło)
- Komunikaty błędów walidacji i API
- Link do odzyskiwania hasła (przyszłość)

#### Kluczowe komponenty widoku
| Komponent | Typ | Opis |
|-----------|-----|------|
| `AuthTabs` | React | Zakładki przełączające między logowaniem a rejestracją |
| `LoginForm` | React | Formularz logowania z walidacją |
| `RegisterForm` | React | Formularz rejestracji z walidacją |
| `AuthErrorAlert` | React | Wyświetlanie błędów z Supabase Auth |

#### Walidacja formularzy
| Pole | Reguły |
|------|--------|
| Email | Wymagane, format email, max 255 znaków |
| Hasło | Wymagane, min 8 znaków, zalecana siła hasła |
| Powtórz hasło | Musi być identyczne z hasłem |

#### UX, dostępność i bezpieczeństwo
- **UX:** Inline walidacja real-time, clear error messages, loading state na przyciskach
- **Dostępność:** Labels powiązane z inputs (htmlFor), focus management, aria-describedby dla błędów
- **Bezpieczeństwo:** Hasła nigdy nie wyświetlane w plain text, ochrona przed brute-force (rate limiting API), HTTPS

---

### 2.3 Generuj fiszki (`/generate`)

| Atrybut | Opis |
|---------|------|
| **Ścieżka** | `/generate` |
| **Cel** | Generowanie propozycji fiszek z tekstu za pomocą AI |
| **Autoryzacja** | Wymagana |
| **Typ strony** | Dynamiczna React Island |
| **Główny endpoint** | `POST /api/generations` |

#### Kluczowe informacje do wyświetlenia
- Pole tekstowe na source text (1000-10000 znaków)
- Licznik znaków z wizualnym wskaźnikiem zakresu
- Info o pozostałych generowaniach (rate limit: 10/godzinę)
- Lista propozycji fiszek z akcjami
- Podsumowanie wybranych fiszek do zapisu

#### Kluczowe komponenty widoku
| Komponent | Typ | Opis |
|-----------|-----|------|
| `GenerateForm` | React | Główny formularz z textarea |
| `CharacterCounter` | React | Licznik znaków z kolorowym wskaźnikiem |
| `RateLimitInfo` | React | Wyświetla pozostałe generowania i countdown |
| `ProposalList` | React | Kontener na listę propozycji |
| `ProposalCard` | React | Pojedyncza propozycja z akcjami inline |
| `BulkActions` | React | Akcje masowe (akceptuj/odrzuć wszystkie) |
| `SaveProposalsButton` | React | Przycisk zapisu z licznikiem wybranych |

#### Stany propozycji fiszki
| Stan | Wizualizacja | Akcje dostępne |
|------|--------------|----------------|
| Pending | Neutralna karta | Akceptuj, Edytuj, Odrzuć |
| Accepted | Zielona obwódka, ✓ | Edytuj, Cofnij |
| Editing | Formularz inline | Zapisz, Anuluj |
| Rejected | Przekreślona, szara | Przywróć |

#### Przepływ generowania
1. Użytkownik wkleja tekst → walidacja długości (live)
2. Klik "Generuj" → loading state (do 60s)
3. Sukces → propozycje wyświetlone pod formularzem
4. Użytkownik przegląda → akceptuje/edytuje/odrzuca
5. Klik "Zapisz wybrane (N)" → `POST /api/flashcards` → toast sukcesu
6. `PATCH /api/generation-sessions/:id` → aktualizacja accepted_count

#### UX, dostępność i bezpieczeństwo
- **UX:** Auto-resize textarea, wyraźny feedback podczas generowania, optimistic UI dla akcji
- **Dostępność:** aria-live region dla propozycji, focus trap w inline editing, keyboard shortcuts
- **Bezpieczeństwo:** Rate limiting z UI feedback, sanityzacja tekstu wejściowego

---

### 2.4 Moje fiszki (`/flashcards`)

| Atrybut | Opis |
|---------|------|
| **Ścieżka** | `/flashcards` |
| **Cel** | Przeglądanie, tworzenie, edycja i usuwanie fiszek |
| **Autoryzacja** | Wymagana |
| **Typ strony** | Dynamiczna React Island |
| **Główne endpointy** | `GET/POST/PUT/DELETE /api/flashcards` |

#### Kluczowe informacje do wyświetlenia
- Lista fiszek z przód/tył (paginowana)
- Badge AI dla fiszek `source: "ai_generated"`
- Opcje sortowania (data utworzenia, aktualizacji, następna powtórka)
- Liczba fiszek ogółem
- Akcje CRUD

#### Kluczowe komponenty widoku
| Komponent | Typ | Opis |
|-----------|-----|------|
| `FlashcardList` | React | Kontener listy z paginacją |
| `FlashcardCard` | React | Karta fiszki z przód/tył i akcjami |
| `FlashcardForm` | React | Formularz tworzenia/edycji (w Dialog) |
| `FlashcardSortSelect` | React | Select z opcjami sortowania |
| `AddFlashcardButton` | React | FAB lub przycisk dodawania |
| `DeleteConfirmDialog` | React | Dialog potwierdzenia usunięcia |
| `FlashcardSkeleton` | React | Skeleton loader dla kart |
| `EmptyFlashcardsState` | React | Stan pustej listy z CTA |

#### Walidacja formularza fiszki
| Pole | Reguły | Komunikat błędu |
|------|--------|-----------------|
| Front | 1-500 znaków | "Przód fiszki musi mieć 1-500 znaków" |
| Back | 1-1000 znaków | "Tył fiszki musi mieć 1-1000 znaków" |

#### UX, dostępność i bezpieczeństwo
- **UX:** Skeleton loaders, optimistic updates, inline feedback, infinite scroll lub paginacja
- **Dostępność:** Focus management w dialogach, aria-labels na akcjach, lista jako semantic list
- **Bezpieczeństwo:** Potwierdzenie przed usunięciem, RLS na backendzie

---

### 2.5 Sesja nauki (`/study`)

| Atrybut | Opis |
|---------|------|
| **Ścieżka** | `/study` |
| **Cel** | Nauka fiszek z algorytmem spaced repetition SM-2 |
| **Autoryzacja** | Wymagana |
| **Typ strony** | Dynamiczna React Island |
| **Główne endpointy** | `GET /api/study-session`, `POST /api/study-session/review` |

#### Kluczowe informacje do wyświetlenia
- Aktualna fiszka (przód, po flip → tył)
- Progress sesji (np. "Fiszka 5/20")
- Łączna liczba fiszek do przeglądu
- Przyciski oceny po odsłonięciu tyłu
- Info o następnej powtórce po ocenie

#### Kluczowe komponenty widoku
| Komponent | Typ | Opis |
|-----------|-----|------|
| `StudyCard` | React | Karta z animacją flip (CSS 3D transform) |
| `RatingButtons` | React | 4 przyciski oceny (uproszczone z SM-2) |
| `StudyProgress` | React | Pasek postępu + licznik fiszek |
| `NextReviewInfo` | React | Info "Następna powtórka za X dni" |
| `StudyComplete` | React | Ekran ukończenia sesji |
| `EmptyStudyState` | React | Stan braku fiszek do nauki |

#### Mapowanie przycisków na rating SM-2
| Przycisk | Rating SM-2 | Opis |
|----------|-------------|------|
| "Nie pamiętam" | 0-1 | Całkowity brak pamięci |
| "Trudne" | 3 | Poprawne z trudnością |
| "Dobre" | 4 | Poprawne z lekkim wahaniem |
| "Łatwe" | 5 | Natychmiastowa odpowiedź |

#### Przepływ sesji
1. Załadowanie fiszek due (`next_review_date <= now`)
2. Wyświetlenie przodu pierwszej fiszki
3. Użytkownik klika/naciska Space → flip z animacją
4. Wyświetlenie tyłu + przyciski oceny
5. Klik oceny → natychmiastowy `POST /api/study-session/review`
6. Krótkie info o następnej powtórce → kolejna fiszka
7. Po ostatniej → ekran ukończenia lub opcja kontynuacji

#### UX, dostępność i bezpieczeństwo
- **UX:** Płynna animacja flip, natychmiastowy feedback, limit sesji (20-50 fiszek)
- **Dostępność:** `prefers-reduced-motion` → brak animacji, keyboard shortcuts (Space/Enter = flip, 1-4 = ocena)
- **Bezpieczeństwo:** Każda ocena zapisywana natychmiast (brak utraty postępu)

---

### 2.6 Profil i ustawienia (`/profile`)

| Atrybut | Opis |
|---------|------|
| **Ścieżka** | `/profile` |
| **Cel** | Statystyki użytkowania, zarządzanie kontem |
| **Autoryzacja** | Wymagana |
| **Typ strony** | Dynamiczna React Island |
| **Główne endpointy** | `GET /api/generation-sessions`, Supabase Auth |

#### Kluczowe informacje do wyświetlenia
- Łączna liczba fiszek
- Podział: fiszki AI vs. ręczne
- Wskaźnik akceptacji AI (%)
- Historia sesji generowania (tabela)
- Opcje konta (usunięcie)

#### Kluczowe komponenty widoku
| Komponent | Typ | Opis |
|-----------|-----|------|
| `StatsOverview` | React | Karty ze statystykami |
| `GenerationHistory` | React | Tabela z historią generowania |
| `AccountSettings` | React | Sekcja ustawień konta |
| `DeleteAccountDialog` | React | Wieloetapowy dialog usunięcia |

#### Statystyki do wyświetlenia
| Statystyka | Źródło |
|------------|--------|
| Łączna liczba fiszek | `GET /api/flashcards` (total z pagination) |
| Fiszki AI | Filtr `source: "ai_generated"` |
| Fiszki ręczne | Filtr `source: "manual"` |
| Wskaźnik akceptacji | `GET /api/generation-sessions` (summary.acceptance_rate) |
| Historia generowania | `GET /api/generation-sessions` (data) |

#### Przepływ usunięcia konta (RODO)
1. Klik "Usuń konto" → Dialog ostrzeżenie
2. Użytkownik wpisuje hasło lub frazę "USUŃ"
3. Klik "Potwierdzam usunięcie"
4. API: usunięcie użytkownika (CASCADE na flashcards, generation_sessions)
5. Wylogowanie → redirect do `/` → toast potwierdzenia

#### UX, dostępność i bezpieczeństwo
- **UX:** Czytelne statystyki, jasne ostrzeżenia przy usuwaniu
- **Dostępność:** Tabela z nagłówkami, focus trap w dialogach
- **Bezpieczeństwo:** Wieloetapowe potwierdzenie usunięcia, wymagane uwierzytelnienie

---

## 3. Mapa podróży użytkownika

### 3.1 Podróż nowego użytkownika

```
┌─────────────┐    CTA         ┌─────────────┐   Sukces      ┌─────────────┐
│   Landing   │  ─────────►    │    Auth     │  ─────────►   │  Generate   │
│     (/)     │  "Zarejestruj" │   (/auth)   │   redirect    │ (/generate) │
└─────────────┘                └─────────────┘               └─────────────┘
                                    │                              │
                                    │ Zakładka                     │ Propozycje
                                    ▼                              ▼
                               ┌─────────────┐               ┌─────────────┐
                               │ RegisterForm│               │ ProposalList│
                               │ ──────────► │               │ ──────────► │
                               │  LoginForm  │               │  Zapisz     │
                               └─────────────┘               └─────────────┘
```

### 3.2 Przepływ generowania fiszek AI (główny przypadek użycia)

```
1. Użytkownik wchodzi na /generate
   │
2. ├─► Wkleja tekst źródłowy (1000-10000 znaków)
   │    └─► CharacterCounter pokazuje status
   │
3. ├─► Klika "Generuj fiszki"
   │    └─► Loading state (spinner + komunikat)
   │    └─► POST /api/generations
   │
4. ├─► Otrzymuje propozycje (lub error state)
   │    └─► ProposalList renderuje karty
   │
5. ├─► Przegląda propozycje
   │    ├─► ✅ Akceptuje (zielona obwódka)
   │    ├─► ✏️ Edytuje (inline form)
   │    └─► ❌ Odrzuca (szara, przekreślona)
   │
6. ├─► Klika "Zapisz wybrane (N)"
   │    └─► POST /api/flashcards (bulk)
   │    └─► PATCH /api/generation-sessions/:id
   │
7. └─► Toast sukcesu "Zapisano N fiszek"
        └─► Możliwość kolejnego generowania
```

### 3.3 Przepływ sesji nauki

```
1. Użytkownik wchodzi na /study
   │
2. ├─► GET /api/study-session
   │    └─► Ładowanie fiszek due (skeleton)
   │
3. ├─► Wyświetlenie przodu pierwszej fiszki
   │
4. ├─► Klik/Space → Flip (animacja CSS 3D)
   │    └─► Wyświetlenie tyłu
   │
5. ├─► Klik oceny (Nie pamiętam/Trudne/Dobre/Łatwe)
   │    └─► POST /api/study-session/review
   │    └─► Info "Następna powtórka za X dni"
   │
6. ├─► Kolejna fiszka → powrót do kroku 3
   │
7. └─► Koniec sesji (brak fiszek lub limit)
        └─► StudyComplete z podsumowaniem
        └─► Opcja: "Kontynuuj (pozostało X)"
```

### 3.4 Przepływ CRUD fiszek

```
┌─────────────────────────────────────────────────────────────┐
│                     /flashcards                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [+ Dodaj fiszkę]  [Sortowanie ▼]                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Przód fiszki (truncated...)                    ✨AI │   │
│  │ Tył fiszki (truncated...)                           │   │
│  │                              [Edytuj] [Usuń]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Kolejna fiszka...                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [← Poprzednia]  Strona 1 z 5  [Następna →]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌───────────┐        ┌───────────┐        ┌───────────┐
   │  Dialog   │        │  Dialog   │        │  Dialog   │
   │  Dodaj    │        │  Edytuj   │        │  Potwierdź│
   │  Fiszkę   │        │  Fiszkę   │        │  Usunięcie│
   └───────────┘        └───────────┘        └───────────┘
```

---

## 4. Układ i struktura nawigacji

### 4.1 Główna nawigacja (MainNav)

#### Dla niezalogowanych użytkowników
```
┌─────────────────────────────────────────────────────────────┐
│  🃏 10x-cards                              [Zaloguj się]    │
└─────────────────────────────────────────────────────────────┘
```

#### Dla zalogowanych użytkowników
```
┌─────────────────────────────────────────────────────────────┐
│  🃏 10x-cards   Generuj   Moje fiszki   Sesja nauki   [👤▼] │
└─────────────────────────────────────────────────────────────┘
```

#### UserMenu (dropdown)
```
┌─────────────────┐
│ 📊 Profil       │
│ ─────────────── │
│ 🚪 Wyloguj      │
└─────────────────┘
```

### 4.2 Nawigacja mobilna

```
┌─────────────────────────────────────────────────────────────┐
│  🃏 10x-cards                                         [☰]   │
└─────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
                                          ┌─────────────────────┐
                                          │ Generuj fiszki      │
                                          │ Moje fiszki         │
                                          │ Sesja nauki         │
                                          │ ─────────────────── │
                                          │ Profil              │
                                          │ Wyloguj             │
                                          └─────────────────────┘
```

### 4.3 Ochrona tras (Middleware)

| Ścieżka | Wymagana auth | Akcja przy braku sesji |
|---------|---------------|------------------------|
| `/` | ❌ | - |
| `/auth` | ❌ | Redirect do `/generate` jeśli zalogowany |
| `/generate` | ✅ | Redirect do `/auth?returnUrl=/generate` |
| `/flashcards` | ✅ | Redirect do `/auth?returnUrl=/flashcards` |
| `/study` | ✅ | Redirect do `/auth?returnUrl=/study` |
| `/profile` | ✅ | Redirect do `/auth?returnUrl=/profile` |

### 4.4 Aktywny stan nawigacji

- Aktywny link: wyróżniony kolorem primary, underline lub background
- Hover state: subtelna zmiana koloru/tła
- Focus state: visible focus ring (a11y)

---

## 5. Kluczowe komponenty

### 5.1 Komponenty layoutu

| Komponent | Lokalizacja | Użycie |
|-----------|-------------|--------|
| `BaseLayout.astro` | `src/layouts/` | Meta tagi, fonty, global styles |
| `PublicLayout.astro` | `src/layouts/` | Layout dla stron publicznych |
| `AuthLayout.astro` | `src/layouts/` | Layout dla stron chronionych |
| `MainNav` | `src/components/layout/` | Główna nawigacja (React) |
| `MobileMenu` | `src/components/layout/` | Menu mobilne (React) |
| `UserMenu` | `src/components/layout/` | Dropdown użytkownika (React) |
| `Footer` | `src/components/layout/` | Stopka (Astro) |

### 5.2 Komponenty autoryzacji

| Komponent | Lokalizacja | Opis |
|-----------|-------------|------|
| `AuthTabs` | `src/components/auth/` | Zakładki login/register |
| `LoginForm` | `src/components/auth/` | Formularz logowania |
| `RegisterForm` | `src/components/auth/` | Formularz rejestracji |
| `AuthErrorAlert` | `src/components/auth/` | Alert błędów autoryzacji |

### 5.3 Komponenty fiszek

| Komponent | Lokalizacja | Opis |
|-----------|-------------|------|
| `FlashcardCard` | `src/components/flashcards/` | Karta fiszki w liście |
| `FlashcardForm` | `src/components/flashcards/` | Formularz tworzenia/edycji |
| `FlashcardList` | `src/components/flashcards/` | Lista z paginacją |
| `ProposalCard` | `src/components/flashcards/` | Propozycja AI z akcjami |
| `ProposalList` | `src/components/flashcards/` | Lista propozycji |
| `FlashcardSkeleton` | `src/components/ui/` | Skeleton loader dla karty |

### 5.4 Komponenty generowania

| Komponent | Lokalizacja | Opis |
|-----------|-------------|------|
| `GenerateForm` | `src/components/generate/` | Formularz z textarea |
| `CharacterCounter` | `src/components/generate/` | Licznik znaków z wizualizacją |
| `RateLimitInfo` | `src/components/generate/` | Info o limicie generowań |
| `BulkActions` | `src/components/generate/` | Akcje masowe na propozycjach |

### 5.5 Komponenty nauki

| Komponent | Lokalizacja | Opis |
|-----------|-------------|------|
| `StudyCard` | `src/components/study/` | Karta z animacją flip |
| `RatingButtons` | `src/components/study/` | Przyciski oceny SM-2 |
| `StudyProgress` | `src/components/study/` | Progress bar sesji |
| `NextReviewInfo` | `src/components/study/` | Info o następnej powtórce |
| `StudyComplete` | `src/components/study/` | Ekran ukończenia |

### 5.6 Komponenty statystyk

| Komponent | Lokalizacja | Opis |
|-----------|-------------|------|
| `StatsOverview` | `src/components/stats/` | Karty ze statystykami |
| `GenerationHistory` | `src/components/stats/` | Tabela historii generowania |
| `AcceptanceRateChart` | `src/components/stats/` | Wizualizacja wskaźnika (opcjonalnie) |

### 5.7 Komponenty UI (Shadcn/ui)

| Komponent | Użycie główne |
|-----------|---------------|
| `Button` | Wszystkie akcje (primary, secondary, destructive, ghost, outline) |
| `Dialog` | Modalne formularze, potwierdzenia |
| `Tabs` | Przełącznik logowanie/rejestracja |
| `Card` | Fiszki, propozycje, statystyki |
| `Input` | Pola tekstowe jednoliniowe |
| `Textarea` | Pola tekstowe wieloliniowe |
| `Skeleton` | Loading states |
| `Toast` (Sonner) | Powiadomienia feedback |
| `Badge` | Tag "AI" na fiszkach |
| `Select` | Sortowanie, filtry |
| `Tooltip` | Podpowiedzi kontekstowe |
| `Pagination` | Nawigacja po listach |
| `Alert` | Komunikaty błędów, ostrzeżenia |
| `DropdownMenu` | UserMenu |

### 5.8 Komponenty wspólne (reużywalne)

| Komponent | Lokalizacja | Opis |
|-----------|-------------|------|
| `EmptyState` | `src/components/ui/` | Uniwersalny stan pusty z CTA |
| `LoadingOverlay` | `src/components/ui/` | Overlay podczas długich operacji |
| `ConfirmDialog` | `src/components/ui/` | Reużywalny dialog potwierdzenia |
| `ErrorBoundary` | `src/components/` | Obsługa błędów React |

---

## 6. Mapowanie wymagań na elementy UI

### 6.1 User Stories → Komponenty UI

| User Story | Widok | Komponenty |
|------------|-------|------------|
| US-001: Rejestracja | `/auth` | `AuthTabs`, `RegisterForm`, `AuthErrorAlert` |
| US-002: Logowanie | `/auth` | `AuthTabs`, `LoginForm`, `AuthErrorAlert` |
| US-003: Generowanie AI | `/generate` | `GenerateForm`, `CharacterCounter`, `RateLimitInfo` |
| US-004: Przegląd propozycji | `/generate` | `ProposalList`, `ProposalCard`, `BulkActions` |
| US-005: Edycja fiszek | `/flashcards`, `/generate` | `FlashcardForm`, inline editing |
| US-006: Usuwanie fiszek | `/flashcards` | `DeleteConfirmDialog` |
| US-007: Ręczne tworzenie | `/flashcards` | `FlashcardForm` w `Dialog` |
| US-008: Sesja nauki | `/study` | `StudyCard`, `RatingButtons`, `StudyProgress` |
| US-009: Bezpieczeństwo | Middleware, RLS | Ochrona tras, walidacja sesji |

### 6.2 Metryki sukcesu → Elementy UI

| Metryka | Komponent/Funkcjonalność |
|---------|-------------------------|
| 75% akceptacji AI | `StatsOverview`, `GenerationHistory` (tracking) |
| 75% fiszek z AI | Badge AI na `FlashcardCard`, statystyki w `StatsOverview` |

---

## 7. Obsługa stanów i błędów

### 7.1 Stany ładowania

| Kontekst | Rozwiązanie |
|----------|-------------|
| Lista fiszek | `FlashcardSkeleton` × N (matching layout) |
| Generowanie AI | Spinner + "Generowanie fiszek... (do 60 sekund)" |
| Zapisywanie bulk | `LoadingOverlay` z progress |
| Pojedyncze akcje | Button z `disabled` + spinner icon |
| Sesja nauki | `StudyCard` skeleton podczas ładowania |

### 7.2 Obsługa błędów API

| Kod HTTP | Obsługa UI |
|----------|------------|
| 401 Unauthorized | Redirect do `/auth` + toast "Sesja wygasła" |
| 400 Validation | Inline errors pod polami formularza |
| 404 Not Found | Toast error + redirect (gdzie sensowne) |
| 422 Unprocessable | Toast z opisem błędu biznesowego |
| 429 Rate Limited | `RateLimitInfo` z countdown timer |
| 503 AI Unavailable | "Spróbuj ponownie" button + retry logic |
| 500 Internal Error | Generic error toast + możliwość retry |
| Timeout (60s) | "Spróbuj ponownie" z zachowanym stanem formularza |

### 7.3 Stany puste (Empty States)

| Widok | Komunikat | CTA |
|-------|-----------|-----|
| `/flashcards` (pusta lista) | "Nie masz jeszcze fiszek. Zacznij od wygenerowania fiszek AI lub dodaj pierwszą ręcznie." | [Generuj z AI] [Dodaj ręcznie] |
| `/study` (brak due) | "Świetna robota! Nie masz fiszek do powtórki. Wróć później lub dodaj nowe fiszki." | [Idź do Moje fiszki] |
| `/generate` (brak propozycji) | "AI nie wygenerowało fiszek z tego tekstu. Spróbuj z innym tekstem lub dodaj fiszki ręcznie." | [Spróbuj ponownie] [Dodaj ręcznie] |
| `/profile` (brak historii) | "Nie masz jeszcze historii generowania. Wygeneruj pierwsze fiszki!" | [Generuj fiszki] |

### 7.4 Toast Notifications

| Typ | Kolor | Przykłady | Auto-dismiss |
|-----|-------|-----------|--------------|
| Success | Zielony | "Fiszka została dodana", "Zapisano N fiszek" | 3s |
| Error | Czerwony | "Nie udało się zapisać fiszki", "Błąd połączenia" | 5s |
| Warning | Żółty | "Limit generowań wyczerpany" | 5s |
| Info | Niebieski | "Sesja wygasła, zaloguj się ponownie" | 5s |

---

## 8. Responsywność

### 8.1 Breakpoints (Tailwind 4)

| Breakpoint | Min-width | Użycie |
|------------|-----------|--------|
| `sm` | 640px | Telefony landscape |
| `md` | 768px | Tablety |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Duże ekrany |

### 8.2 Adaptacje per element

| Element | Mobile (<768px) | Desktop (≥768px) |
|---------|-----------------|------------------|
| MainNav | Hamburger menu | Horizontal links |
| FlashcardList | 1 kolumna, full-width | Grid 2-3 kolumny |
| ProposalList | 1 kolumna, stack | 2 kolumny grid |
| StudyCard | Full-width, duże przyciski | Centered, max-width |
| Forms | Full-width | Max-width container |
| Dialogs | Full-screen (mobile sheet) | Centered modal |
| Tables (historia) | Card stack | Pełna tabela |

---

## 9. Dostępność (a11y)

### 9.1 Wymagania WCAG AA

| Obszar | Implementacja |
|--------|---------------|
| Kontrast | Min 4.5:1 dla tekstu, 3:1 dla dużego tekstu |
| Focus | Visible focus ring (`ring-2 ring-offset-2`) |
| Keyboard | Wszystkie akcje dostępne z klawiatury |
| Screen readers | ARIA labels, aria-live regions |
| Motion | `prefers-reduced-motion` respektowane |

### 9.2 Keyboard shortcuts

| Skrót | Kontekst | Akcja |
|-------|----------|-------|
| `Tab` | Globalnie | Nawigacja między elementami |
| `Enter` / `Space` | Przyciski, linki | Aktywacja |
| `Escape` | Dialogi | Zamknięcie |
| `Space` / `Enter` | `/study` | Flip karty |
| `1` / `2` / `3` / `4` | `/study` (po flip) | Ocena fiszki |

### 9.3 ARIA patterns

| Komponent | ARIA pattern |
|-----------|--------------|
| Dialog | `role="dialog"`, `aria-modal="true"`, focus trap |
| Toast | `role="alert"`, `aria-live="polite"` |
| Tabs | `role="tablist"`, `role="tab"`, `role="tabpanel"` |
| Loading | `aria-busy="true"`, `aria-live="polite"` |
| Errors | `aria-invalid="true"`, `aria-describedby` |

---

## 10. Struktura plików

```
src/
├── components/
│   ├── ui/                      # Shadcn/ui + custom base
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── skeleton.tsx
│   │   ├── empty-state.tsx      # Custom
│   │   ├── loading-overlay.tsx  # Custom
│   │   └── ...
│   ├── auth/
│   │   ├── AuthTabs.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthErrorAlert.tsx
│   ├── flashcards/
│   │   ├── FlashcardCard.tsx
│   │   ├── FlashcardForm.tsx
│   │   ├── FlashcardList.tsx
│   │   ├── ProposalCard.tsx
│   │   └── ProposalList.tsx
│   ├── generate/
│   │   ├── GenerateForm.tsx
│   │   ├── CharacterCounter.tsx
│   │   ├── RateLimitInfo.tsx
│   │   └── BulkActions.tsx
│   ├── study/
│   │   ├── StudyCard.tsx
│   │   ├── RatingButtons.tsx
│   │   ├── StudyProgress.tsx
│   │   ├── NextReviewInfo.tsx
│   │   └── StudyComplete.tsx
│   ├── layout/
│   │   ├── MainNav.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── UserMenu.tsx
│   │   └── Footer.astro
│   └── stats/
│       ├── StatsOverview.tsx
│       └── GenerationHistory.tsx
├── layouts/
│   ├── BaseLayout.astro
│   ├── PublicLayout.astro
│   └── AuthLayout.astro
├── pages/
│   ├── index.astro              # Landing
│   ├── auth.astro               # Login/Register
│   ├── generate.astro           # Generowanie AI
│   ├── flashcards.astro         # Moje fiszki
│   ├── study.astro              # Sesja nauki
│   ├── profile.astro            # Profil/Ustawienia
│   └── api/
│       ├── flashcards/
│       ├── generations/
│       ├── study-session/
│       └── generation-sessions/
├── lib/
│   ├── hooks/                   # React hooks
│   │   ├── useFlashcards.ts
│   │   ├── useGenerations.ts
│   │   └── useStudySession.ts
│   └── utils/
│       ├── api-client.ts
│       └── validation.ts
└── styles/
    └── globals.css              # Tailwind + CSS variables
```

---

## 11. Integracja z API

### 11.1 TanStack Query - Query Keys

```typescript
// Flashcards
['flashcards', { page, limit, sort, order }]
['flashcard', id]

// Study Session
['study-session', { limit }]

// Generation Sessions
['generation-sessions', { page, limit }]
```

### 11.2 Konfiguracja Query

```typescript
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minut
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
};
```

### 11.3 Optimistic Updates

| Operacja | Strategia |
|----------|-----------|
| Dodanie fiszki | Optimistic add do listy |
| Edycja fiszki | Optimistic update |
| Usunięcie fiszki | Optimistic remove |
| Ocena w sesji | Optimistic update + kolejna fiszka |
| Akceptacja propozycji | Lokalna zmiana stanu (nie w cache) |

---

## 12. Bezpieczeństwo UI

### 12.1 Ochrona tras

- **Middleware Astro:** Sprawdza JWT cookie dla chronionych tras
- **Redirect:** `/auth?returnUrl=X` przy braku sesji
- **Zachowanie stanu:** Po re-auth powrót do poprzedniej strony

### 12.2 Rate Limiting UI

- **LocalStorage:** Timestamps ostatnich generowań
- **Display:** "Pozostało X/10 generowań w tej godzinie"
- **Countdown:** Timer przy osiągnięciu limitu
- **Fallback:** Obsługa 429 z API (źródło prawdy)

### 12.3 Usunięcie konta (RODO)

1. Klik "Usuń konto" → informacyjny dialog
2. Potwierdzenie: wpisanie hasła lub "USUŃ"
3. Jasny komunikat o nieodwracalności
4. Loading state podczas usuwania
5. Wylogowanie + redirect + toast

### 12.4 Walidacja danych

- **Client-side:** Zod schemas dla formularzy (UX)
- **Server-side:** Walidacja API (bezpieczeństwo)
- **Sanityzacja:** Escape HTML w wyświetlanych danych

