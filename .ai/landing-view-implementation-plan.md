# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page to strona główna aplikacji 10x-cards, której celem jest prezentacja wartości produktu oraz konwersja nowych użytkowników na rejestrację. Strona przedstawia kluczowe korzyści aplikacji: szybkie tworzenie fiszek edukacyjnych z wykorzystaniem AI oraz efektywną naukę opartą na algorytmie spaced repetition.

Jest to strona w pełni statyczna (Astro SSG), zoptymalizowana pod kątem SEO i dostępności. Nie wymaga autoryzacji ani integracji z API.

## 2. Routing widoku

| Atrybut | Wartość |
|---------|---------|
| Ścieżka | `/` |
| Plik | `src/pages/index.astro` |
| Layout | `PublicLayout.astro` |
| Typ renderowania | Statyczny (SSG) |
| Autoryzacja | Nie wymagana |

## 3. Struktura komponentów

```
src/pages/index.astro
└── PublicLayout.astro
    ├── <header>
    │   └── PublicNav.astro
    ├── <main>
    │   ├── HeroSection.astro
    │   ├── FeaturesSection.astro
    │   └── CTASection.astro
    └── <footer>
        └── Footer.astro
```

### Hierarchia plików

```
src/
├── layouts/
│   ├── Layout.astro (istniejący - base layout)
│   └── PublicLayout.astro (nowy - layout dla stron publicznych)
├── components/
│   └── landing/
│       ├── PublicNav.astro
│       ├── HeroSection.astro
│       ├── FeaturesSection.astro
│       ├── FeatureCard.astro
│       ├── CTASection.astro
│       └── Footer.astro
└── pages/
    └── index.astro (modyfikacja istniejącego)
```

## 4. Szczegóły komponentów

### PublicLayout.astro

- **Opis komponentu:** Layout wrapper dla wszystkich stron publicznych (niezalogowanych). Rozszerza bazowy `Layout.astro` i dodaje nawigację publiczną oraz stopkę.
- **Główne elementy:**
  - `<Layout>` - bazowy layout z meta tagami
  - `<header>` z komponentem `PublicNav`
  - `<main>` ze slotem na zawartość strony
  - `<footer>` z komponentem `Footer`
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:**
  - `title?: string` - tytuł strony (domyślnie: "10x-cards - Twórz fiszki z AI")
  - `description?: string` - meta description dla SEO

---

### PublicNav.astro

- **Opis komponentu:** Pasek nawigacji dla niezalogowanych użytkowników. Zawiera logo aplikacji oraz link do logowania/rejestracji.
- **Główne elementy:**
  - `<nav>` z `role="navigation"` i `aria-label="Główna nawigacja"`
  - Logo aplikacji (link do `/`)
  - Link "Zaloguj się" prowadzący do `/auth`
- **Obsługiwane interakcje:**
  - Kliknięcie logo → nawigacja do `/`
  - Kliknięcie "Zaloguj się" → nawigacja do `/auth`
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

---

### HeroSection.astro

- **Opis komponentu:** Sekcja powitalna z głównym przekazem wartości produktu i przyciskiem Call-to-Action. To pierwszy element widziany przez użytkownika, musi przyciągać uwagę i jasno komunikować wartość produktu.
- **Główne elementy:**
  - `<section>` z `aria-labelledby` wskazującym na nagłówek
  - `<h1>` - główny nagłówek z przekazem wartości (np. "Twórz fiszki 10x szybciej z AI")
  - `<p>` - podtytuł opisujący korzyści
  - `<Button>` (Shadcn) - główny CTA "Zacznij za darmo" / "Zarejestruj się"
  - Opcjonalnie: grafika/ilustracja produktu
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku CTA → nawigacja do `/auth`
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

---

### FeaturesSection.astro

- **Opis komponentu:** Sekcja prezentująca główne korzyści i funkcje produktu w formie kart z ikonami. Buduje zaufanie i wyjaśnia, co użytkownik zyska dzięki aplikacji.
- **Główne elementy:**
  - `<section>` z `aria-labelledby`
  - `<h2>` - nagłówek sekcji (np. "Dlaczego 10x-cards?")
  - Grid z komponentami `FeatureCard`
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

---

### FeatureCard.astro

- **Opis komponentu:** Pojedyncza karta prezentująca jedną korzyść/funkcję produktu z ikoną, tytułem i opisem.
- **Główne elementy:**
  - `<article>` lub `<div>` z odpowiednią stylizacją Card
  - Ikona (SVG inline lub komponent)
  - `<h3>` - tytuł korzyści
  - `<p>` - opis korzyści
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:**
  - `icon: string` - nazwa ikony lub slot na SVG
  - `title: string` - tytuł korzyści
  - `description: string` - opis korzyści

---

### CTASection.astro

- **Opis komponentu:** Końcowa sekcja z silnym wezwaniem do działania. Zamyka stronę i ponownie zachęca do rejestracji.
- **Główne elementy:**
  - `<section>` z `aria-labelledby`
  - `<h2>` - nagłówek zachęcający (np. "Gotowy, by uczyć się efektywniej?")
  - `<p>` - krótki tekst motywacyjny
  - `<Button>` (Shadcn) - CTA "Zarejestruj się teraz"
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku CTA → nawigacja do `/auth`
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

---

### Footer.astro

- **Opis komponentu:** Stopka strony z podstawowymi informacjami o produkcie i prawami autorskimi.
- **Główne elementy:**
  - `<footer>` z `role="contentinfo"`
  - Logo lub nazwa aplikacji
  - Informacja o prawach autorskich
  - Opcjonalnie: linki do regulaminu, polityki prywatności
- **Obsługiwane interakcje:** Brak (lub kliknięcie linków nawigacyjnych)
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

## 5. Typy

Landing Page jest stroną w pełni statyczną i nie wymaga żadnych typów DTO ani ViewModel. Wszystkie dane są hardcoded w komponentach Astro.

### Propsy komponentów

```typescript
// FeatureCard.astro props
interface FeatureCardProps {
  icon: "sparkles" | "clock" | "brain" | "shield";
  title: string;
  description: string;
}

// PublicLayout.astro props
interface PublicLayoutProps {
  title?: string;
  description?: string;
}
```

## 6. Zarządzanie stanem

Landing Page jest stroną statyczną i **nie wymaga zarządzania stanem**. Wszystkie komponenty są komponentami Astro bez interaktywności client-side.

Nie ma potrzeby:
- Tworzenia custom hooków
- Używania React dla tego widoku
- Integracji z TanStack Query

## 7. Integracja API

Landing Page **nie wymaga integracji z żadnym API**. Jest to strona w pełni statyczna, generowana w czasie budowania (SSG).

Wszystkie dane prezentowane na stronie (teksty, korzyści, opisy) są hardcoded w komponentach.

## 8. Interakcje użytkownika

| Interakcja | Element | Rezultat |
|------------|---------|----------|
| Kliknięcie logo | `PublicNav` | Nawigacja do `/` (odświeżenie strony) |
| Kliknięcie "Zaloguj się" | `PublicNav` | Nawigacja do `/auth` |
| Kliknięcie głównego CTA | `HeroSection` | Nawigacja do `/auth` |
| Kliknięcie końcowego CTA | `CTASection` | Nawigacja do `/auth` |
| Scroll strony | Cała strona | Naturalne scrollowanie przez sekcje |

### Nawigacja klawiaturowa

- `Tab` - przechodzenie między interaktywnymi elementami (linki, przyciski)
- `Enter` / `Space` - aktywacja przycisku/linku
- Focus powinien być widoczny na wszystkich interaktywnych elementach

## 9. Warunki i walidacja

Landing Page **nie wymaga walidacji formularzy ani danych wejściowych**. Jest to strona prezentacyjna bez formularzy.

### Warunki SEO
- Strona musi zawierać jeden element `<h1>`
- Obrazy muszą mieć atrybut `alt`
- Meta tagi `title` i `description` muszą być wypełnione
- Struktura nagłówków musi być hierarchiczna (h1 → h2 → h3)

### Warunki dostępności
- Kontrast tekstu minimum 4.5:1 (WCAG AA)
- Wszystkie interaktywne elementy muszą być dostępne z klawiatury
- Focus ring musi być widoczny
- Semantyczne elementy HTML (nav, main, section, footer)

## 10. Obsługa błędów

Landing Page jest stroną statyczną, więc potencjalne błędy są minimalne:

| Scenariusz | Obsługa |
|------------|---------|
| Brak połączenia z internetem | Strona może być serwowana z cache (ServiceWorker w przyszłości) |
| Nieprawidłowa ścieżka nawigacji | Strona `/auth` musi istnieć przed wdrożeniem landing page |
| Wolne ładowanie obrazów | Użycie `loading="lazy"` dla obrazów poniżej fold, optymalizacja przez Astro Image |
| Brak wsparcia dla CSS Grid | Fallback z flexbox (Tailwind automatycznie obsługuje) |

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury katalogów
Utworzenie katalogu `src/components/landing/` dla komponentów landing page.

### Krok 2: Implementacja PublicLayout.astro
1. Utworzenie `src/layouts/PublicLayout.astro`
2. Import i rozszerzenie istniejącego `Layout.astro`
3. Dodanie struktury z header, main i footer
4. Konfiguracja meta tagów dla SEO

### Krok 3: Implementacja PublicNav.astro
1. Utworzenie `src/components/landing/PublicNav.astro`
2. Implementacja logo (tekst lub SVG)
3. Implementacja linku "Zaloguj się"
4. Stylowanie z Tailwind (responsywność, fixed/sticky opcjonalnie)

### Krok 4: Implementacja HeroSection.astro
1. Utworzenie `src/components/landing/HeroSection.astro`
2. Implementacja nagłówka H1 z głównym przekazem
3. Implementacja podtytułu
4. Import i użycie komponentu Button z Shadcn
5. Stylowanie z Tailwind (centering, padding, gradient/background)

### Krok 5: Implementacja FeatureCard.astro
1. Utworzenie `src/components/landing/FeatureCard.astro`
2. Zdefiniowanie propsów (icon, title, description)
3. Implementacja struktury karty z ikoną
4. Stylowanie z Tailwind (Card-like appearance)

### Krok 6: Implementacja FeaturesSection.astro
1. Utworzenie `src/components/landing/FeaturesSection.astro`
2. Import komponentu FeatureCard
3. Zdefiniowanie 3-4 korzyści produktu:
   - Generowanie fiszek z AI (oszczędność czasu)
   - Algorytm spaced repetition (efektywna nauka)
   - Łatwe zarządzanie fiszkami (wygoda)
   - Bezpieczeństwo danych (RODO)
4. Implementacja grid layout dla kart
5. Responsywność (1 kolumna mobile, 2-3 kolumny desktop)

### Krok 7: Implementacja CTASection.astro
1. Utworzenie `src/components/landing/CTASection.astro`
2. Implementacja nagłówka zachęcającego
3. Implementacja tekstu motywacyjnego
4. Import i użycie komponentu Button z Shadcn
5. Stylowanie wyróżniające sekcję (tło, padding)

### Krok 8: Implementacja Footer.astro
1. Utworzenie `src/components/landing/Footer.astro`
2. Implementacja prostej stopki z prawami autorskimi
3. Stylowanie z Tailwind

### Krok 9: Aktualizacja index.astro
1. Modyfikacja `src/pages/index.astro`
2. Import PublicLayout i wszystkich sekcji
3. Złożenie strony z komponentów
4. Ustawienie odpowiedniego title i description

### Krok 10: Stylowanie i dostępność
1. Weryfikacja kontrastów kolorów
2. Dodanie focus states dla interaktywnych elementów
3. Sprawdzenie responsywności na różnych breakpointach
4. Dodanie aria-labels gdzie potrzebne

### Krok 11: Optymalizacja
1. Optymalizacja obrazów (jeśli używane) przez Astro Image
2. Weryfikacja Lighthouse score (Performance, Accessibility, SEO)
3. Testowanie na różnych przeglądarkach

### Krok 12: Testowanie
1. Testowanie nawigacji do `/auth`
2. Testowanie responsywności (mobile, tablet, desktop)
3. Testowanie dostępności (nawigacja klawiaturą, screen reader)
4. Weryfikacja poprawności linków

