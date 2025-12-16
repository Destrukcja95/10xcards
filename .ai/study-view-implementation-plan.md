# Plan implementacji widoku Sesja nauki (Study View)

## 1. Przegląd

Widok sesji nauki (`/study`) umożliwia użytkownikowi naukę fiszek z wykorzystaniem algorytmu spaced repetition SM-2. Użytkownik przegląda fiszki wymagające powtórki, odsłania odpowiedzi za pomocą animacji flip, a następnie ocenia poziom przyswojenia materiału. Każda ocena natychmiast aktualizuje parametry algorytmu i oblicza datę następnej powtórki.

Widok stanowi kluczowy element aplikacji realizujący historię użytkownika US-008 i wspiera efektywną naukę poprzez scientifically-proven metodę powtórek rozłożonych w czasie.

## 2. Routing widoku

| Atrybut | Wartość |
|---------|---------|
| Ścieżka | `/study` |
| Plik strony | `src/pages/study.astro` |
| Autoryzacja | Wymagana (redirect do `/auth?returnUrl=/study` jeśli niezalogowany) |
| Typ strony | Strona Astro z dynamiczną React Island (`client:load`) |

## 3. Struktura komponentów

```
study.astro
└── Layout
    └── StudyView (React Island - client:load)
        ├── Alert (błędy)
        ├── StudyProgress
        ├── StudyCard
        │   ├── CardFront
        │   └── CardBack
        ├── RatingButtons
        ├── NextReviewInfo
        ├── StudyComplete
        └── EmptyStudyState
```

### Hierarchia i relacje komponentów

```
StudyView (główny kontener)
│
├── [isLoading && !hasFlashcards] → StudySkeleton
│
├── [error] → Alert (z opcją retry)
│
├── [isEmpty] → EmptyStudyState
│
├── [isComplete] → StudyComplete
│
└── [hasCurrentFlashcard]
    ├── StudyProgress
    ├── StudyCard
    │   └── [isFlipped] → CardBack : CardFront
    ├── [isFlipped] → RatingButtons
    └── [lastReviewResult] → NextReviewInfo
```

## 4. Szczegóły komponentów

### 4.1 StudyView

**Opis:** Główny komponent widoku odpowiedzialny za zarządzanie stanem sesji nauki, integrację z API oraz koordynację komponentów potomnych. Korzysta z customowego hooka `useStudySession`.

**Główne elementy:**
- `<div>` kontener z `max-w-2xl mx-auto` dla wycentrowanego layoutu
- Alert dla błędów
- Warunkowe renderowanie stanów (loading, empty, complete, active)

**Obsługiwane interakcje:**
- Inicjalizacja sesji przy montowaniu (fetch fiszek)
- Przekazywanie akcji flip/rate do komponentów potomnych
- Obsługa keyboard shortcuts (delegowane do window event listeners)

**Walidacja:** Brak bezpośredniej walidacji - delegowane do hooka

**Typy:**
- `StudySessionState` (z hooka)
- `StudySessionActions` (z hooka)

**Propsy:** Brak (komponent top-level)

---

### 4.2 StudyCard

**Opis:** Karta fiszki z animacją 3D flip. Wyświetla przód lub tył fiszki w zależności od stanu. Animacja CSS 3D transform z respektowaniem `prefers-reduced-motion`.

**Główne elementy:**
- `<div>` kontener z klasą `perspective` (CSS 3D)
- `<div>` inner wrapper z `transform-style: preserve-3d` i `transition`
- `<div>` front face z `backface-visibility: hidden`
- `<div>` back face z `rotateY(180deg)` i `backface-visibility: hidden`
- `<button>` overlay do obsługi kliknięcia flip

**Obsługiwane interakcje:**
- `onClick` → wywołuje `onFlip()` jeśli nie jest odwrócona
- Keyboard: Space/Enter → flip (obsługiwane przez parent)

**Walidacja:** Brak

**Typy:**
- `StudySessionFlashcardDTO` - dane fiszki

**Propsy:**
```typescript
interface StudyCardProps {
  flashcard: StudySessionFlashcardDTO;
  isFlipped: boolean;
  onFlip: () => void;
  isDisabled?: boolean;
}
```

---

### 4.3 RatingButtons

**Opis:** Grupa 4 przycisków oceny SM-2. Każdy przycisk ma dedykowany kolor i mapuje się na konkretny rating. Wyświetlany tylko gdy karta jest odwrócona.

**Główne elementy:**
- `<div>` kontener z `grid grid-cols-2 gap-3` lub `flex flex-wrap`
- 4× `<Button>` z różnymi wariantami/kolorami:
  - "Nie pamiętam" (rating 1) - destructive/czerwony
  - "Trudne" (rating 3) - warning/pomarańczowy
  - "Dobre" (rating 4) - secondary/niebieski
  - "Łatwe" (rating 5) - success/zielony

**Obsługiwane interakcje:**
- `onClick` na każdym przycisku → `onRate(rating)`
- Keyboard: 1/2/3/4 → odpowiedni rating (obsługiwane przez parent)

**Walidacja:** Brak

**Typy:**
- `SM2Rating` - typ ratingu

**Propsy:**
```typescript
interface RatingButtonsProps {
  onRate: (rating: SM2Rating) => void;
  isSubmitting: boolean;
}
```

---

### 4.4 StudyProgress

**Opis:** Wyświetla postęp sesji nauki - aktualny numer fiszki, łączną liczbę oraz wizualny pasek postępu.

**Główne elementy:**
- `<div>` kontener
- `<span>` tekst "Fiszka X/Y"
- `<div>` pasek postępu (progress bar) z wypełnieniem procentowym
- Opcjonalnie: `<span>` "Pozostało: Z do powtórki"

**Obsługiwane interakcje:** Brak (komponent prezentacyjny)

**Walidacja:** Brak

**Typy:** Proste typy prymitywne

**Propsy:**
```typescript
interface StudyProgressProps {
  current: number;
  total: number;
  totalDue: number;
}
```

---

### 4.5 NextReviewInfo

**Opis:** Wyświetla informację o dacie następnej powtórki po ocenie fiszki. Pokazuje się na krótko (2-3 sekundy) po ocenie przed przejściem do kolejnej fiszki.

**Główne elementy:**
- `<div>` z animacją fade-in
- Ikona kalendarza (SVG)
- `<span>` "Następna powtórka za X dni" lub "Następna powtórka: jutro"

**Obsługiwane interakcje:** Brak (komponent prezentacyjny)

**Walidacja:** Brak

**Typy:**
- `ReviewResultDTO` - wynik oceny

**Propsy:**
```typescript
interface NextReviewInfoProps {
  reviewResult: ReviewResultDTO;
}
```

---

### 4.6 StudyComplete

**Opis:** Ekran wyświetlany po ukończeniu wszystkich fiszek w sesji. Pokazuje podsumowanie i opcje dalszego działania.

**Główne elementy:**
- `<div>` wycentrowany kontener
- Ikona sukcesu (checkmark w kółku)
- `<h2>` "Gratulacje!"
- `<p>` "Ukończyłeś sesję nauki. Przejrzałeś X fiszek."
- `<div>` przyciski akcji:
  - "Kontynuuj naukę" (jeśli `totalDue > reviewedCount`)
  - "Wróć do fiszek" (link do `/flashcards`)

**Obsługiwane interakcje:**
- `onClick` "Kontynuuj naukę" → `onContinue()` (reload sesji)
- Link do `/flashcards`

**Walidacja:** Brak

**Typy:** Proste typy prymitywne

**Propsy:**
```typescript
interface StudyCompleteProps {
  reviewedCount: number;
  totalDue: number;
  onContinue: () => void;
}
```

---

### 4.7 EmptyStudyState

**Opis:** Stan pusty wyświetlany gdy brak fiszek do powtórki (`total_due === 0`).

**Główne elementy:**
- `<div>` wycentrowany kontener
- Ikona (np. kalendarz z checkmark)
- `<h2>` "Świetna robota!"
- `<p>` "Nie masz fiszek do powtórki. Wróć później lub dodaj nowe fiszki."
- `<div>` przyciski CTA:
  - "Idź do Moje fiszki" (link do `/flashcards`)
  - "Generuj nowe fiszki" (link do `/generate`)

**Obsługiwane interakcje:**
- Linki nawigacyjne

**Walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak

---

### 4.8 StudySkeleton

**Opis:** Skeleton loader wyświetlany podczas ładowania sesji nauki.

**Główne elementy:**
- `<Skeleton>` dla progress bar
- `<Skeleton>` dla karty fiszki (duży prostokąt)
- `<Skeleton>` × 4 dla przycisków oceny

**Obsługiwane interakcje:** Brak

**Walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak

## 5. Typy

### 5.1 Typy z API (istniejące w `src/types.ts`)

```typescript
// Fiszka do sesji nauki
type StudySessionFlashcardDTO = Pick<
  FlashcardDTO,
  "id" | "front" | "back" | "ease_factor" | "interval" | "repetition_count"
>;

// Odpowiedź GET /api/study-session
interface StudySessionResponseDTO {
  data: StudySessionFlashcardDTO[];
  count: number;
  total_due: number;
}

// Ocena SM-2 (0-5)
type SM2Rating = 0 | 1 | 2 | 3 | 4 | 5;

// Komenda POST /api/study-session/review
interface ReviewFlashcardCommand {
  flashcard_id: string;
  rating: SM2Rating;
}

// Wynik oceny
type ReviewResultDTO = Pick<
  FlashcardDTO,
  "id" | "ease_factor" | "interval" | "repetition_count" | "next_review_date" | "last_reviewed_at"
>;
```

### 5.2 Nowe typy dla widoku (do utworzenia w `src/components/study/types.ts`)

```typescript
// Stan widoku sesji nauki
interface StudyViewState {
  /** Lista fiszek do powtórki w bieżącej sesji */
  flashcards: StudySessionFlashcardDTO[];
  /** Indeks aktualnie wyświetlanej fiszki (0-based) */
  currentIndex: number;
  /** Czy karta jest odwrócona (pokazuje tył) */
  isFlipped: boolean;
  /** Czy trwa ładowanie sesji */
  isLoading: boolean;
  /** Czy trwa wysyłanie oceny */
  isSubmitting: boolean;
  /** Komunikat błędu */
  error: string | null;
  /** Wynik ostatniej oceny (do NextReviewInfo) */
  lastReviewResult: ReviewResultDTO | null;
  /** Całkowita liczba fiszek do powtórki (z API) */
  totalDue: number;
  /** Liczba przejrzanych fiszek w tej sesji */
  reviewedCount: number;
  /** Czy sesja została ukończona */
  isComplete: boolean;
}

// Akcje reducera
type StudyViewAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: StudySessionResponseDTO }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "FLIP_CARD" }
  | { type: "REVIEW_START" }
  | { type: "REVIEW_SUCCESS"; payload: ReviewResultDTO }
  | { type: "REVIEW_ERROR"; payload: string }
  | { type: "NEXT_CARD" }
  | { type: "COMPLETE_SESSION" }
  | { type: "RESET_SESSION" }
  | { type: "CLEAR_ERROR" };

// Mapowanie przycisków UI na rating SM-2
interface RatingButtonConfig {
  label: string;
  rating: SM2Rating;
  variant: "destructive" | "warning" | "secondary" | "success";
  shortcut: string; // "1", "2", "3", "4"
}

// Konfiguracja przycisków oceny
const RATING_BUTTONS: RatingButtonConfig[] = [
  { label: "Nie pamiętam", rating: 1, variant: "destructive", shortcut: "1" },
  { label: "Trudne", rating: 3, variant: "warning", shortcut: "2" },
  { label: "Dobre", rating: 4, variant: "secondary", shortcut: "3" },
  { label: "Łatwe", rating: 5, variant: "success", shortcut: "4" },
];

// Stałe widoku
const STUDY_SESSION_LIMIT = 20; // Domyślny limit fiszek na sesję
const NEXT_REVIEW_DISPLAY_DURATION = 2000; // ms pokazywania info o następnej powtórce
```

### 5.3 Helper do formatowania interwału

```typescript
// Formatowanie interwału na tekst
function formatInterval(days: number): string {
  if (days === 0) return "dzisiaj";
  if (days === 1) return "jutro";
  if (days < 7) return `za ${days} dni`;
  if (days === 7) return "za tydzień";
  if (days < 30) return `za ${Math.round(days / 7)} tygodni`;
  if (days < 60) return "za miesiąc";
  return `za ${Math.round(days / 30)} miesięcy`;
}
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: `useStudySession`

Hook zarządza całym stanem sesji nauki, analogicznie do `useFlashcardsView` w widoku fiszek. Wykorzystuje `useReducer` dla przewidywalnych aktualizacji stanu.

```typescript
// src/components/study/hooks/useStudySession.ts

export function useStudySession() {
  const [state, dispatch] = useReducer(studyViewReducer, initialState);

  // ========================================
  // FETCH SESSION
  // ========================================
  const fetchSession = useCallback(async (limit: number = STUDY_SESSION_LIMIT) => {
    dispatch({ type: "FETCH_START" });
    try {
      const response = await fetch(`/api/study-session?limit=${limit}`);
      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();
        dispatch({ type: "FETCH_ERROR", payload: errorData.error.message });
        return;
      }
      const data: StudySessionResponseDTO = await response.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch {
      dispatch({ type: "FETCH_ERROR", payload: "Nie udało się pobrać fiszek do nauki." });
    }
  }, []);

  // ========================================
  // FLIP CARD
  // ========================================
  const flipCard = useCallback(() => {
    if (!state.isFlipped && !state.isSubmitting) {
      dispatch({ type: "FLIP_CARD" });
    }
  }, [state.isFlipped, state.isSubmitting]);

  // ========================================
  // RATE FLASHCARD
  // ========================================
  const rateFlashcard = useCallback(async (rating: SM2Rating) => {
    const currentFlashcard = state.flashcards[state.currentIndex];
    if (!currentFlashcard || state.isSubmitting) return;

    dispatch({ type: "REVIEW_START" });
    try {
      const response = await fetch("/api/study-session/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcard_id: currentFlashcard.id,
          rating,
        } as ReviewFlashcardCommand),
      });

      if (!response.ok) {
        const errorData: ErrorDTO = await response.json();
        dispatch({ type: "REVIEW_ERROR", payload: errorData.error.message });
        return;
      }

      const result: ReviewResultDTO = await response.json();
      dispatch({ type: "REVIEW_SUCCESS", payload: result });

      // Po krótkim opóźnieniu przejdź do następnej fiszki
      setTimeout(() => {
        if (state.currentIndex >= state.flashcards.length - 1) {
          dispatch({ type: "COMPLETE_SESSION" });
        } else {
          dispatch({ type: "NEXT_CARD" });
        }
      }, NEXT_REVIEW_DISPLAY_DURATION);
    } catch {
      dispatch({ type: "REVIEW_ERROR", payload: "Nie udało się zapisać oceny." });
    }
  }, [state.flashcards, state.currentIndex, state.isSubmitting]);

  // ========================================
  // CONTINUE SESSION
  // ========================================
  const continueSession = useCallback(() => {
    dispatch({ type: "RESET_SESSION" });
    fetchSession();
  }, [fetchSession]);

  // ========================================
  // CLEAR ERROR
  // ========================================
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // ========================================
  // EFFECTS
  // ========================================
  
  // Pobierz sesję przy montowaniu
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignoruj jeśli fokus jest na input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!state.isFlipped && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        flipCard();
      }

      if (state.isFlipped && !state.isSubmitting) {
        const keyToRating: Record<string, SM2Rating> = {
          "1": 1,
          "2": 3,
          "3": 4,
          "4": 5,
        };
        if (keyToRating[e.key]) {
          e.preventDefault();
          rateFlashcard(keyToRating[e.key]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isFlipped, state.isSubmitting, flipCard, rateFlashcard]);

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const currentFlashcard = state.flashcards[state.currentIndex] ?? null;
  const isEmpty = !state.isLoading && state.totalDue === 0;
  const hasFlashcards = state.flashcards.length > 0;

  // ========================================
  // RETURN
  // ========================================
  return {
    state,
    actions: {
      fetchSession,
      flipCard,
      rateFlashcard,
      continueSession,
      clearError,
    },
    computed: {
      currentFlashcard,
      isEmpty,
      hasFlashcards,
    },
  };
}
```

### 6.2 Reducer: `studyViewReducer`

```typescript
// src/components/study/hooks/studyViewReducer.ts

export const initialState: StudyViewState = {
  flashcards: [],
  currentIndex: 0,
  isFlipped: false,
  isLoading: true,
  isSubmitting: false,
  error: null,
  lastReviewResult: null,
  totalDue: 0,
  reviewedCount: 0,
  isComplete: false,
};

export function studyViewReducer(
  state: StudyViewState,
  action: StudyViewAction
): StudyViewState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        flashcards: action.payload.data,
        totalDue: action.payload.total_due,
        currentIndex: 0,
        isFlipped: false,
        isComplete: action.payload.data.length === 0,
      };

    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };

    case "FLIP_CARD":
      return { ...state, isFlipped: true };

    case "REVIEW_START":
      return { ...state, isSubmitting: true, error: null };

    case "REVIEW_SUCCESS":
      return {
        ...state,
        isSubmitting: false,
        lastReviewResult: action.payload,
        reviewedCount: state.reviewedCount + 1,
      };

    case "REVIEW_ERROR":
      return { ...state, isSubmitting: false, error: action.payload };

    case "NEXT_CARD":
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        isFlipped: false,
        lastReviewResult: null,
      };

    case "COMPLETE_SESSION":
      return { ...state, isComplete: true, lastReviewResult: null };

    case "RESET_SESSION":
      return { ...initialState, isLoading: true };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}
```

## 7. Integracja API

### 7.1 GET /api/study-session

**Cel:** Pobranie fiszek wymagających powtórki

**Request:**
```
GET /api/study-session?limit=20
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```typescript
interface StudySessionResponseDTO {
  data: StudySessionFlashcardDTO[];
  count: number;    // Liczba zwróconych fiszek
  total_due: number; // Całkowita liczba fiszek do powtórki
}
```

**Obsługa błędów:**
- 401 Unauthorized → redirect do `/auth`
- 400 Validation Error → wyświetl komunikat błędu
- 500 Internal Error → wyświetl komunikat i opcję retry

---

### 7.2 POST /api/study-session/review

**Cel:** Zapisanie oceny fiszki i aktualizacja parametrów SM-2

**Request:**
```typescript
// POST /api/study-session/review
// Authorization: Bearer <jwt_token>
// Content-Type: application/json

interface ReviewFlashcardCommand {
  flashcard_id: string; // UUID fiszki
  rating: SM2Rating;    // 0-5
}
```

**Response (200 OK):**
```typescript
interface ReviewResultDTO {
  id: string;
  ease_factor: number;
  interval: number;           // Dni do następnej powtórki
  repetition_count: number;
  next_review_date: string;   // ISO date
  last_reviewed_at: string;   // ISO date
}
```

**Obsługa błędów:**
- 401 Unauthorized → redirect do `/auth`
- 404 Not Found → "Fiszka nie została znaleziona"
- 400 Validation Error → wyświetl komunikat
- 500 Internal Error → wyświetl komunikat i opcję retry

## 8. Interakcje użytkownika

### 8.1 Wejście na widok `/study`

1. Wyświetlenie skeleton loadera
2. Wywołanie `GET /api/study-session`
3. Sukces → wyświetlenie pierwszej fiszki (przód)
4. Brak fiszek → wyświetlenie `EmptyStudyState`
5. Błąd → wyświetlenie alertu z opcją retry

### 8.2 Flip karty

| Trigger | Warunek | Akcja |
|---------|---------|-------|
| Klik na kartę | `!isFlipped && !isSubmitting` | Animacja flip, wyświetlenie tyłu |
| Space/Enter | `!isFlipped && !isSubmitting` | Animacja flip, wyświetlenie tyłu |

### 8.3 Ocena fiszki

| Trigger | Warunek | Akcja |
|---------|---------|-------|
| Klik na przycisk oceny | `isFlipped && !isSubmitting` | POST review, wyświetlenie NextReviewInfo |
| Klawisz 1/2/3/4 | `isFlipped && !isSubmitting` | POST review, wyświetlenie NextReviewInfo |

### 8.4 Przejście do następnej fiszki

Po 2 sekundach od wyświetlenia `NextReviewInfo`:
- Jeśli są kolejne fiszki → `NEXT_CARD` (flip reset, następna fiszka)
- Jeśli brak fiszek → `COMPLETE_SESSION` (ekran ukończenia)

### 8.5 Ukończenie sesji

Na ekranie `StudyComplete`:
- "Kontynuuj naukę" (jeśli `totalDue > reviewedCount`) → `continueSession()`
- "Wróć do fiszek" → nawigacja do `/flashcards`

### 8.6 Keyboard shortcuts

| Klawisz | Kontekst | Akcja |
|---------|----------|-------|
| Space/Enter | Przód karty | Flip do tyłu |
| 1 | Tył karty | Ocena "Nie pamiętam" (rating 1) |
| 2 | Tył karty | Ocena "Trudne" (rating 3) |
| 3 | Tył karty | Ocena "Dobre" (rating 4) |
| 4 | Tył karty | Ocena "Łatwe" (rating 5) |

## 9. Warunki i walidacja

### 9.1 Walidacja na poziomie API

| Pole | Warunek | Komunikat błędu |
|------|---------|-----------------|
| `limit` | 1-50, integer | "Limit must be between 1 and 50" |
| `flashcard_id` | Valid UUID | "Invalid flashcard ID" |
| `rating` | Integer 0-5 | "Rating must be between 0 and 5" |

### 9.2 Walidacja na poziomie UI

| Warunek | Komponent | Zachowanie |
|---------|-----------|------------|
| Sesja w trakcie ładowania | StudyView | Wyświetl skeleton, zablokuj interakcje |
| Karta nie jest odwrócona | RatingButtons | Przyciski niewidoczne |
| Trwa wysyłanie oceny | RatingButtons | Przyciski disabled, loading state |
| Brak fiszek do powtórki | StudyView | Wyświetl EmptyStudyState |
| Sesja ukończona | StudyView | Wyświetl StudyComplete |

### 9.3 Mapowanie przycisków na rating

| Przycisk UI | Rating SM-2 | Znaczenie |
|-------------|-------------|-----------|
| "Nie pamiętam" | 1 | Całkowity brak pamięci, reset interwału |
| "Trudne" | 3 | Poprawna odpowiedź z dużą trudnością |
| "Dobre" | 4 | Poprawna odpowiedź z lekkim wahaniem |
| "Łatwe" | 5 | Natychmiastowa, perfekcyjna odpowiedź |

## 10. Obsługa błędów

### 10.1 Błędy sieciowe

| Scenariusz | Obsługa |
|------------|---------|
| Brak połączenia | Alert "Nie udało się pobrać fiszek. Sprawdź połączenie." + Retry button |
| Timeout | Alert "Przekroczono czas oczekiwania." + Retry button |

### 10.2 Błędy API

| Kod HTTP | Obsługa UI |
|----------|------------|
| 401 Unauthorized | Redirect do `/auth?returnUrl=/study` |
| 404 Flashcard Not Found | Alert "Fiszka nie została znaleziona" + przejdź do następnej |
| 400 Validation Error | Alert z komunikatem błędu |
| 500 Internal Error | Alert "Wystąpił nieoczekiwany błąd" + Retry |

### 10.3 Edge cases

| Przypadek | Obsługa |
|-----------|---------|
| Użytkownik zamyka kartę przed zapisem | Ocena nie jest zapisana - brak problemu (optimistic UI nie używane) |
| Szybkie klikanie przycisków oceny | `isSubmitting` blokuje kolejne kliknięcia |
| Sesja wygasa podczas nauki | 401 → redirect do logowania |
| Fiszka usunięta podczas sesji | 404 przy review → przejdź do następnej |

### 10.4 Retry logic

```typescript
// W przypadku błędu pobierania sesji
const handleRetry = useCallback(() => {
  clearError();
  fetchSession();
}, [clearError, fetchSession]);
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

```
src/
├── components/
│   └── study/
│       ├── index.ts
│       ├── types.ts
│       ├── StudyView.tsx
│       ├── StudyCard.tsx
│       ├── RatingButtons.tsx
│       ├── StudyProgress.tsx
│       ├── NextReviewInfo.tsx
│       ├── StudyComplete.tsx
│       ├── EmptyStudyState.tsx
│       ├── StudySkeleton.tsx
│       └── hooks/
│           ├── useStudySession.ts
│           └── studyViewReducer.ts
└── pages/
    └── study.astro
```

### Krok 2: Implementacja typów

1. Utworzyć `src/components/study/types.ts`
2. Zdefiniować `StudyViewState`, `StudyViewAction`
3. Zdefiniować `RatingButtonConfig`, stałe `RATING_BUTTONS`
4. Dodać helper `formatInterval()`

### Krok 3: Implementacja reducera i hooka

1. Utworzyć `src/components/study/hooks/studyViewReducer.ts`
2. Zaimplementować reducer ze wszystkimi akcjami
3. Utworzyć `src/components/study/hooks/useStudySession.ts`
4. Zaimplementować fetch, flip, rate, continue, keyboard shortcuts

### Krok 4: Implementacja komponentów atomowych

1. **StudySkeleton** - skeleton loader
2. **EmptyStudyState** - stan pusty z CTA
3. **StudyProgress** - progress bar i licznik
4. **NextReviewInfo** - info o następnej powtórce

### Krok 5: Implementacja StudyCard

1. Struktura HTML z CSS 3D (perspective, transform-style)
2. Animacja flip z transition
3. Obsługa `prefers-reduced-motion`
4. Klikalne overlay do flipowania

CSS dla animacji flip:
```css
.study-card {
  perspective: 1000px;
}

.study-card-inner {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.study-card-inner.flipped {
  transform: rotateY(180deg);
}

.study-card-front,
.study-card-back {
  backface-visibility: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
}

.study-card-back {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .study-card-inner {
    transition: none;
  }
}
```

### Krok 6: Implementacja RatingButtons

1. 4 przyciski z odpowiednimi kolorami
2. Obsługa `isSubmitting` (disabled state)
3. Ikony lub tekst na przyciskach
4. Tooltips z opisem i skrótem klawiszowym

### Krok 7: Implementacja StudyComplete

1. Ikona sukcesu
2. Komunikat gratulacyjny z liczbą przejrzanych fiszek
3. Warunkowy przycisk "Kontynuuj" (jeśli są pozostałe)
4. Link do `/flashcards`

### Krok 8: Implementacja StudyView

1. Użycie `useStudySession()` hook
2. Warunkowe renderowanie stanów (loading, error, empty, complete, active)
3. Integracja wszystkich komponentów
4. Alert dla błędów z przyciskiem retry

### Krok 9: Utworzenie strony Astro

1. Utworzyć `src/pages/study.astro`
2. Sprawdzenie autoryzacji (redirect jeśli niezalogowany)
3. Layout z nawigacją
4. `<StudyView client:load />`

### Krok 10: Utworzenie pliku eksportującego

1. Utworzyć `src/components/study/index.ts`
2. Eksportować `StudyView` jako named export

### Krok 11: Dodanie linku w nawigacji

1. Zaktualizować nawigację o link do `/study` (Sesja nauki)
2. Upewnić się, że link jest aktywny gdy jesteśmy na stronie

### Krok 12: Testowanie i poprawki

1. Testowanie przepływu sesji nauki
2. Testowanie keyboard shortcuts
3. Testowanie animacji flip i `prefers-reduced-motion`
4. Testowanie obsługi błędów
5. Testowanie stanu pustego i ukończenia
6. Testowanie responsywności (mobile)

### Krok 13: Dostępność (a11y)

1. Dodanie `aria-labels` na przyciskach
2. Focus management po flip
3. `aria-live` dla zmian stanu
4. Screen reader announcements dla postępu

### Krok 14: Optymalizacja UX

1. Smooth animations
2. Odpowiedni timing dla NextReviewInfo
3. Loading states na przyciskach
4. Feedback wizualny przy ocenie

