# Plan implementacji widoku Generuj fiszki

## 1. Przegląd

Widok "Generuj fiszki" (`/generate`) umożliwia zalogowanym użytkownikom generowanie propozycji fiszek edukacyjnych przy użyciu AI na podstawie wklejonego tekstu źródłowego. Użytkownik może przeglądać wygenerowane propozycje, akceptować je, edytować lub odrzucać, a następnie zapisać wybrane fiszki do bazy danych.

Główne funkcjonalności:
- Wklejanie tekstu źródłowego (1000-10000 znaków) do generowania fiszek
- Wyświetlanie propozycji fiszek wygenerowanych przez AI
- Akcje na propozycjach: akceptacja, edycja inline, odrzucenie
- Akcje masowe: akceptuj wszystkie, odrzuć wszystkie
- Zapis zaakceptowanych fiszek do bazy danych
- Informacja o limicie generowań (rate limiting: 10/godzinę)
- Walidacja w czasie rzeczywistym

## 2. Routing widoku

| Atrybut | Wartość |
|---------|---------|
| **Ścieżka** | `/generate` |
| **Plik** | `src/pages/generate.astro` |
| **Autoryzacja** | Wymagana (redirect do `/auth` dla niezalogowanych) |
| **Layout** | Dedykowany `AuthenticatedLayout.astro` lub modyfikacja `PublicLayout.astro` |

## 3. Struktura komponentów

```
generate.astro (Strona Astro)
└── AuthenticatedLayout.astro
    └── GenerateView (React, client:load)
        ├── GenerateForm
        │   ├── SourceTextArea
        │   ├── CharacterCounter
        │   └── GenerateButton
        ├── RateLimitInfo
        ├── LoadingState
        ├── ErrorAlert
        ├── ProposalSection (widoczne po generowaniu)
        │   ├── BulkActions
        │   ├── ProposalList
        │   │   └── ProposalCard (wiele instancji)
        │   │       ├── ProposalCardContent
        │   │       ├── ProposalCardActions
        │   │       └── ProposalEditForm (warunkowy)
        │   └── SaveProposalsButton
        └── SuccessToast
```

## 4. Szczegóły komponentów

### 4.1 GenerateView

- **Opis**: Główny kontener widoku, zarządza całym stanem generowania i propozycji. Jest to React Island osadzony w stronie Astro.
- **Główne elementy**: 
  - `div` jako kontener z layoutem grid/flex
  - Sekcja formularza generowania
  - Sekcja propozycji (warunkowo renderowana)
- **Obsługiwane interakcje**:
  - Inicjalizacja stanu przy montowaniu
  - Koordynacja między komponentami potomnymi
- **Obsługiwana walidacja**: Brak bezpośredniej (delegowana do komponentów potomnych)
- **Typy**:
  - `GenerateViewState` (ViewModel)
  - `GenerationResponseDTO`
  - `ProposalViewModel`
- **Propsy**: Brak (pobiera dane z API)

### 4.2 GenerateForm

- **Opis**: Formularz do wprowadzania tekstu źródłowego i uruchamiania generowania fiszek.
- **Główne elementy**:
  - `form` z `onSubmit`
  - `SourceTextArea` (textarea z auto-resize)
  - `CharacterCounter`
  - `GenerateButton`
- **Obsługiwane interakcje**:
  - `onChange` na textarea - aktualizacja tekstu źródłowego
  - `onSubmit` - wywołanie API generowania
- **Obsługiwana walidacja**:
  - Długość tekstu: minimum 1000 znaków, maksimum 10000 znaków
  - Przycisk "Generuj" nieaktywny gdy walidacja nie przechodzi
- **Typy**:
  - `GenerateFlashcardsCommand`
- **Propsy**:
  ```typescript
  interface GenerateFormProps {
    onSubmit: (sourceText: string) => Promise<void>;
    isLoading: boolean;
    isDisabled: boolean;
  }
  ```

### 4.3 SourceTextArea

- **Opis**: Komponent textarea z automatycznym dostosowywaniem wysokości.
- **Główne elementy**:
  - `textarea` z klasami Tailwind
  - `Label` z shadcn/ui
- **Obsługiwane interakcje**:
  - `onChange` - przekazanie wartości do rodzica
  - `onInput` - auto-resize wysokości
- **Obsługiwana walidacja**: 
  - Wizualna informacja o stanie walidacji (obramowanie czerwone/zielone)
- **Typy**: Brak dedykowanych
- **Propsy**:
  ```typescript
  interface SourceTextAreaProps {
    value: string;
    onChange: (value: string) => void;
    minLength: number;
    maxLength: number;
    disabled: boolean;
    hasError: boolean;
  }
  ```

### 4.4 CharacterCounter

- **Opis**: Wyświetla aktualną liczbę znaków i wizualny wskaźnik poprawności zakresu.
- **Główne elementy**:
  - `div` z tekstem "X / 1000-10000 znaków"
  - Pasek postępu (progress bar) z kolorowym wskaźnikiem
- **Obsługiwane interakcje**: Brak (komponent prezentacyjny)
- **Obsługiwana walidacja**: 
  - Kolor czerwony gdy < 1000
  - Kolor zielony gdy 1000-10000
  - Kolor czerwony gdy > 10000
- **Typy**: Brak dedykowanych
- **Propsy**:
  ```typescript
  interface CharacterCounterProps {
    currentLength: number;
    minLength: number;
    maxLength: number;
  }
  ```

### 4.5 RateLimitInfo

- **Opis**: Wyświetla informację o pozostałych generowaniach i czasie do resetu limitu.
- **Główne elementy**:
  - `div` z ikoną i tekstem
  - Liczba pozostałych generowań
  - Countdown do resetu (jeśli limit wyczerpany)
- **Obsługiwane interakcje**: Brak (komponent prezentacyjny)
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `RateLimitInfoViewModel`
- **Propsy**:
  ```typescript
  interface RateLimitInfoProps {
    remaining: number;
    resetAt: Date | null;
    isLimited: boolean;
  }
  ```

### 4.6 ProposalList

- **Opis**: Kontener renderujący listę kart z propozycjami fiszek.
- **Główne elementy**:
  - `div` z aria-live="polite" dla screen readerów
  - Lista `ProposalCard` komponentów
- **Obsługiwane interakcje**: Brak bezpośrednich (delegowane do ProposalCard)
- **Obsługiwana walidacja**: Brak
- **Typy**:
  - `ProposalViewModel[]`
- **Propsy**:
  ```typescript
  interface ProposalListProps {
    proposals: ProposalViewModel[];
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onEdit: (id: string, front: string, back: string) => void;
    onUndo: (id: string) => void;
  }
  ```

### 4.7 ProposalCard

- **Opis**: Pojedyncza karta propozycji fiszki z akcjami i możliwością edycji inline.
- **Główne elementy**:
  - `Card` z shadcn/ui
  - `CardHeader` z przód fiszki
  - `CardContent` z tył fiszki
  - `CardFooter` z przyciskami akcji
  - `ProposalEditForm` (warunkowo, gdy tryb edycji)
- **Obsługiwane interakcje**:
  - Klik "Akceptuj" - zmiana stanu na accepted
  - Klik "Edytuj" - przejście do trybu edycji
  - Klik "Odrzuć" - zmiana stanu na rejected
  - Klik "Cofnij" - przywrócenie poprzedniego stanu
- **Obsługiwana walidacja**:
  - W trybie edycji: front 1-500 znaków, back 1-1000 znaków
- **Typy**:
  - `ProposalViewModel`
  - `ProposalStatus`
- **Propsy**:
  ```typescript
  interface ProposalCardProps {
    proposal: ProposalViewModel;
    onAccept: () => void;
    onReject: () => void;
    onEdit: (front: string, back: string) => void;
    onUndo: () => void;
  }
  ```

### 4.8 ProposalEditForm

- **Opis**: Formularz inline do edycji propozycji fiszki.
- **Główne elementy**:
  - `form` z dwoma polami input/textarea
  - `Input` dla front (przód fiszki)
  - `Textarea` dla back (tył fiszki)
  - Przyciski "Zapisz" i "Anuluj"
- **Obsługiwane interakcje**:
  - `onSubmit` - zapisanie zmian
  - `onCancel` - anulowanie edycji
- **Obsługiwana walidacja**:
  - front: wymagane, 1-500 znaków
  - back: wymagane, 1-1000 znaków
- **Typy**: Brak dedykowanych
- **Propsy**:
  ```typescript
  interface ProposalEditFormProps {
    initialFront: string;
    initialBack: string;
    onSave: (front: string, back: string) => void;
    onCancel: () => void;
  }
  ```

### 4.9 BulkActions

- **Opis**: Przyciski do masowych akcji na wszystkich propozycjach.
- **Główne elementy**:
  - `div` z grupą przycisków
  - Przycisk "Akceptuj wszystkie"
  - Przycisk "Odrzuć wszystkie"
- **Obsługiwane interakcje**:
  - Klik "Akceptuj wszystkie" - zmiana stanu wszystkich pending na accepted
  - Klik "Odrzuć wszystkie" - zmiana stanu wszystkich pending na rejected
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak dedykowanych
- **Propsy**:
  ```typescript
  interface BulkActionsProps {
    onAcceptAll: () => void;
    onRejectAll: () => void;
    pendingCount: number;
  }
  ```

### 4.10 SaveProposalsButton

- **Opis**: Przycisk zapisu zaakceptowanych fiszek z licznikiem wybranych.
- **Główne elementy**:
  - `Button` z shadcn/ui
  - Badge z liczbą zaakceptowanych fiszek
- **Obsługiwane interakcje**:
  - Klik - wywołanie zapisu fiszek do API
- **Obsługiwana walidacja**:
  - Przycisk nieaktywny gdy brak zaakceptowanych fiszek
  - Przycisk nieaktywny podczas zapisywania
- **Typy**: Brak dedykowanych
- **Propsy**:
  ```typescript
  interface SaveProposalsButtonProps {
    acceptedCount: number;
    onSave: () => Promise<void>;
    isLoading: boolean;
  }
  ```

## 5. Typy

### 5.1 Typy z API (istniejące w `src/types.ts`)

```typescript
// Komenda generowania fiszek
interface GenerateFlashcardsCommand {
  source_text: string;
}

// Odpowiedź z API generowania
interface GenerationResponseDTO {
  generation_id: string;
  proposals: FlashcardProposalDTO[];
  generated_count: number;
}

// Pojedyncza propozycja fiszki z AI
interface FlashcardProposalDTO {
  front: string;
  back: string;
}

// Komenda tworzenia fiszek (batch)
interface CreateFlashcardsCommand {
  flashcards: CreateFlashcardCommand[];
}

// Pojedyncza fiszka do utworzenia
interface CreateFlashcardCommand {
  front: string;
  back: string;
  source: FlashcardSource;
}

// Źródło fiszki
type FlashcardSource = "ai_generated" | "manual";

// Standardowa odpowiedź błędu
interface ErrorDTO {
  error: {
    code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" 
        | "UNPROCESSABLE_ENTITY" | "RATE_LIMITED" | "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR";
    message: string;
    details?: ErrorDetailDTO[];
  };
}

interface ErrorDetailDTO {
  field: string;
  message: string;
}
```

### 5.2 Nowe typy ViewModel (do utworzenia w `src/components/generate/types.ts`)

```typescript
/**
 * Status pojedynczej propozycji fiszki
 */
type ProposalStatus = "pending" | "accepted" | "editing" | "rejected";

/**
 * ViewModel dla pojedynczej propozycji fiszki
 * Rozszerza FlashcardProposalDTO o stan UI
 */
interface ProposalViewModel {
  /** Unikalny identyfikator propozycji (generowany lokalnie) */
  id: string;
  /** Przód fiszki (pytanie) */
  front: string;
  /** Tył fiszki (odpowiedź) */
  back: string;
  /** Aktualny stan propozycji w UI */
  status: ProposalStatus;
  /** Oryginalne wartości przed edycją (do funkcji Cofnij) */
  originalFront: string;
  originalBack: string;
}

/**
 * ViewModel dla informacji o rate limit
 */
interface RateLimitInfoViewModel {
  /** Pozostała liczba generowań */
  remaining: number;
  /** Data resetu limitu (null jeśli nie ograniczony) */
  resetAt: Date | null;
  /** Czy limit został przekroczony */
  isLimited: boolean;
}

/**
 * Stan głównego widoku generowania
 */
interface GenerateViewState {
  /** Tekst źródłowy z textarea */
  sourceText: string;
  /** Czy trwa generowanie (loading) */
  isGenerating: boolean;
  /** Czy trwa zapisywanie fiszek */
  isSaving: boolean;
  /** ID sesji generowania (z odpowiedzi API) */
  generationId: string | null;
  /** Lista propozycji fiszek */
  proposals: ProposalViewModel[];
  /** Informacje o rate limit */
  rateLimit: RateLimitInfoViewModel;
  /** Komunikat błędu (null jeśli brak) */
  error: string | null;
  /** Komunikat sukcesu (null jeśli brak) */
  successMessage: string | null;
}

/**
 * Typ akcji dla reducera stanu
 */
type GenerateViewAction =
  | { type: "SET_SOURCE_TEXT"; payload: string }
  | { type: "START_GENERATION" }
  | { type: "GENERATION_SUCCESS"; payload: GenerationResponseDTO }
  | { type: "GENERATION_ERROR"; payload: string }
  | { type: "ACCEPT_PROPOSAL"; payload: string }
  | { type: "REJECT_PROPOSAL"; payload: string }
  | { type: "START_EDITING"; payload: string }
  | { type: "SAVE_EDIT"; payload: { id: string; front: string; back: string } }
  | { type: "CANCEL_EDIT"; payload: string }
  | { type: "UNDO_PROPOSAL"; payload: string }
  | { type: "ACCEPT_ALL" }
  | { type: "REJECT_ALL" }
  | { type: "START_SAVING" }
  | { type: "SAVE_SUCCESS"; payload: number }
  | { type: "SAVE_ERROR"; payload: string }
  | { type: "UPDATE_RATE_LIMIT"; payload: RateLimitInfoViewModel }
  | { type: "CLEAR_ERROR" }
  | { type: "CLEAR_SUCCESS" };
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: `useGenerateView`

Hook `useGenerateView` zarządza całym stanem widoku generowania. Wykorzystuje `useReducer` dla złożonego stanu i dostarcza akcje do komponentów potomnych.

```typescript
// src/components/generate/hooks/useGenerateView.ts

function useGenerateView() {
  const [state, dispatch] = useReducer(generateViewReducer, initialState);
  
  // Akcje
  const setSourceText = useCallback((text: string) => {
    dispatch({ type: "SET_SOURCE_TEXT", payload: text });
  }, []);
  
  const generateFlashcards = useCallback(async () => {
    dispatch({ type: "START_GENERATION" });
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: state.sourceText }),
      });
      
      if (!response.ok) {
        const error: ErrorDTO = await response.json();
        dispatch({ type: "GENERATION_ERROR", payload: error.error.message });
        return;
      }
      
      const data: GenerationResponseDTO = await response.json();
      dispatch({ type: "GENERATION_SUCCESS", payload: data });
    } catch (error) {
      dispatch({ type: "GENERATION_ERROR", payload: "Wystąpił nieoczekiwany błąd" });
    }
  }, [state.sourceText]);
  
  const acceptProposal = useCallback((id: string) => {
    dispatch({ type: "ACCEPT_PROPOSAL", payload: id });
  }, []);
  
  const rejectProposal = useCallback((id: string) => {
    dispatch({ type: "REJECT_PROPOSAL", payload: id });
  }, []);
  
  const editProposal = useCallback((id: string, front: string, back: string) => {
    dispatch({ type: "SAVE_EDIT", payload: { id, front, back } });
  }, []);
  
  const undoProposal = useCallback((id: string) => {
    dispatch({ type: "UNDO_PROPOSAL", payload: id });
  }, []);
  
  const acceptAll = useCallback(() => {
    dispatch({ type: "ACCEPT_ALL" });
  }, []);
  
  const rejectAll = useCallback(() => {
    dispatch({ type: "REJECT_ALL" });
  }, []);
  
  const saveAcceptedFlashcards = useCallback(async () => {
    const accepted = state.proposals.filter(p => p.status === "accepted");
    if (accepted.length === 0) return;
    
    dispatch({ type: "START_SAVING" });
    
    try {
      // 1. Zapisz fiszki
      const flashcardsResponse = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcards: accepted.map(p => ({
            front: p.front,
            back: p.back,
            source: "ai_generated" as FlashcardSource,
          })),
        }),
      });
      
      if (!flashcardsResponse.ok) {
        const error: ErrorDTO = await flashcardsResponse.json();
        dispatch({ type: "SAVE_ERROR", payload: error.error.message });
        return;
      }
      
      // 2. Zaktualizuj accepted_count w sesji generowania
      if (state.generationId) {
        await fetch(`/api/generation-sessions/${state.generationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accepted_count: accepted.length }),
        });
      }
      
      dispatch({ type: "SAVE_SUCCESS", payload: accepted.length });
    } catch (error) {
      dispatch({ type: "SAVE_ERROR", payload: "Nie udało się zapisać fiszek" });
    }
  }, [state.proposals, state.generationId]);
  
  // Obliczane wartości
  const acceptedCount = useMemo(() => 
    state.proposals.filter(p => p.status === "accepted").length,
    [state.proposals]
  );
  
  const pendingCount = useMemo(() => 
    state.proposals.filter(p => p.status === "pending").length,
    [state.proposals]
  );
  
  const isValidSourceText = useMemo(() => 
    state.sourceText.length >= 1000 && state.sourceText.length <= 10000,
    [state.sourceText]
  );
  
  return {
    state,
    actions: {
      setSourceText,
      generateFlashcards,
      acceptProposal,
      rejectProposal,
      editProposal,
      undoProposal,
      acceptAll,
      rejectAll,
      saveAcceptedFlashcards,
    },
    computed: {
      acceptedCount,
      pendingCount,
      isValidSourceText,
    },
  };
}
```

### 6.2 Reducer

```typescript
// src/components/generate/hooks/generateViewReducer.ts

const initialState: GenerateViewState = {
  sourceText: "",
  isGenerating: false,
  isSaving: false,
  generationId: null,
  proposals: [],
  rateLimit: {
    remaining: 10,
    resetAt: null,
    isLimited: false,
  },
  error: null,
  successMessage: null,
};

function generateViewReducer(
  state: GenerateViewState,
  action: GenerateViewAction
): GenerateViewState {
  switch (action.type) {
    case "SET_SOURCE_TEXT":
      return { ...state, sourceText: action.payload, error: null };
      
    case "START_GENERATION":
      return { ...state, isGenerating: true, error: null, proposals: [] };
      
    case "GENERATION_SUCCESS":
      return {
        ...state,
        isGenerating: false,
        generationId: action.payload.generation_id,
        proposals: action.payload.proposals.map((p, index) => ({
          id: `proposal-${index}-${Date.now()}`,
          front: p.front,
          back: p.back,
          status: "pending" as ProposalStatus,
          originalFront: p.front,
          originalBack: p.back,
        })),
        rateLimit: {
          ...state.rateLimit,
          remaining: Math.max(0, state.rateLimit.remaining - 1),
        },
      };
      
    case "GENERATION_ERROR":
      return { ...state, isGenerating: false, error: action.payload };
      
    case "ACCEPT_PROPOSAL":
      return {
        ...state,
        proposals: state.proposals.map(p =>
          p.id === action.payload ? { ...p, status: "accepted" } : p
        ),
      };
      
    case "REJECT_PROPOSAL":
      return {
        ...state,
        proposals: state.proposals.map(p =>
          p.id === action.payload ? { ...p, status: "rejected" } : p
        ),
      };
      
    case "START_EDITING":
      return {
        ...state,
        proposals: state.proposals.map(p =>
          p.id === action.payload ? { ...p, status: "editing" } : p
        ),
      };
      
    case "SAVE_EDIT":
      return {
        ...state,
        proposals: state.proposals.map(p =>
          p.id === action.payload.id
            ? { ...p, front: action.payload.front, back: action.payload.back, status: "accepted" }
            : p
        ),
      };
      
    case "CANCEL_EDIT":
      return {
        ...state,
        proposals: state.proposals.map(p =>
          p.id === action.payload
            ? { ...p, front: p.originalFront, back: p.originalBack, status: "pending" }
            : p
        ),
      };
      
    case "UNDO_PROPOSAL":
      return {
        ...state,
        proposals: state.proposals.map(p =>
          p.id === action.payload ? { ...p, status: "pending" } : p
        ),
      };
      
    case "ACCEPT_ALL":
      return {
        ...state,
        proposals: state.proposals.map(p =>
          p.status === "pending" ? { ...p, status: "accepted" } : p
        ),
      };
      
    case "REJECT_ALL":
      return {
        ...state,
        proposals: state.proposals.map(p =>
          p.status === "pending" ? { ...p, status: "rejected" } : p
        ),
      };
      
    case "START_SAVING":
      return { ...state, isSaving: true, error: null };
      
    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        proposals: [],
        generationId: null,
        sourceText: "",
        successMessage: `Zapisano ${action.payload} fiszek!`,
      };
      
    case "SAVE_ERROR":
      return { ...state, isSaving: false, error: action.payload };
      
    case "UPDATE_RATE_LIMIT":
      return { ...state, rateLimit: action.payload };
      
    case "CLEAR_ERROR":
      return { ...state, error: null };
      
    case "CLEAR_SUCCESS":
      return { ...state, successMessage: null };
      
    default:
      return state;
  }
}
```

## 7. Integracja API

### 7.1 POST /api/generations

**Cel**: Generowanie propozycji fiszek z tekstu źródłowego

**Request**:
```typescript
// Typ: GenerateFlashcardsCommand
{
  source_text: string // 1000-10000 znaków
}
```

**Response (200 OK)**:
```typescript
// Typ: GenerationResponseDTO
{
  generation_id: string,      // UUID sesji generowania
  proposals: FlashcardProposalDTO[], // Tablica propozycji
  generated_count: number     // Liczba wygenerowanych propozycji
}
```

**Obsługa błędów**:
| Kod | Typ błędu | Obsługa w UI |
|-----|-----------|--------------|
| 401 | UNAUTHORIZED | Redirect do `/auth` |
| 400 | VALIDATION_ERROR | Wyświetlenie komunikatu walidacji |
| 429 | RATE_LIMITED | Wyświetlenie informacji o limicie i countdown |
| 503 | SERVICE_UNAVAILABLE | Komunikat "Serwis AI tymczasowo niedostępny" |
| 500 | INTERNAL_ERROR | Ogólny komunikat błędu z możliwością ponowienia |

### 7.2 POST /api/flashcards

**Cel**: Zapisanie zaakceptowanych fiszek do bazy danych

**Request**:
```typescript
// Typ: CreateFlashcardsCommand
{
  flashcards: [
    {
      front: string,          // 1-500 znaków
      back: string,           // 1-1000 znaków
      source: "ai_generated"  // Zawsze "ai_generated" dla tego widoku
    }
  ]
}
```

**Response (201 Created)**:
```typescript
// Typ: CreateFlashcardsResponseDTO
{
  data: FlashcardDTO[]  // Utworzone fiszki z pełnymi danymi
}
```

### 7.3 PATCH /api/generation-sessions/:id

**Cel**: Aktualizacja statystyki zaakceptowanych fiszek

**Request**:
```typescript
// Typ: UpdateGenerationSessionCommand
{
  accepted_count: number  // Liczba zaakceptowanych fiszek (>= 0)
}
```

**Response (200 OK)**:
```typescript
// Typ: GenerationSessionDTO
{
  id: string,
  generated_count: number,
  accepted_count: number,
  created_at: string
}
```

## 8. Interakcje użytkownika

### 8.1 Przepływ generowania fiszek

| Krok | Akcja użytkownika | Reakcja UI |
|------|-------------------|------------|
| 1 | Wkleja tekst do textarea | Licznik znaków się aktualizuje, walidacja inline |
| 2 | Klika "Generuj fiszki" | Przycisk przechodzi w stan loading, wyświetla się skeleton/spinner |
| 3 | Generowanie zakończone | Propozycje fiszek pojawiają się pod formularzem |
| 4 | Przegląda propozycje | Może scrollować listę, każda karta ma akcje |

### 8.2 Akcje na pojedynczej propozycji

| Akcja | Efekt wizualny | Zmiana stanu |
|-------|----------------|--------------|
| Akceptuj | Zielona obwódka, ikona ✓, przyciski zmienione na "Edytuj", "Cofnij" | status: "accepted" |
| Edytuj | Karta zamienia się w formularz inline | status: "editing" |
| Odrzuć | Karta jest przekreślona, szara, przycisk "Przywróć" | status: "rejected" |
| Cofnij (z accepted) | Karta wraca do stanu neutralnego | status: "pending" |
| Przywróć (z rejected) | Karta wraca do stanu neutralnego | status: "pending" |

### 8.3 Edycja inline

| Krok | Akcja | Efekt |
|------|-------|-------|
| 1 | Klik "Edytuj" | Karta zamienia się w formularz z polami front/back |
| 2 | Modyfikacja tekstu | Walidacja inline (licznik znaków) |
| 3a | Klik "Zapisz" | Zmiany zapisane, karta wraca do widoku z status "accepted" |
| 3b | Klik "Anuluj" | Zmiany odrzucone, karta wraca do poprzedniego stanu |

### 8.4 Akcje masowe

| Akcja | Efekt |
|-------|-------|
| Akceptuj wszystkie | Wszystkie propozycje w stanie "pending" zmieniają się na "accepted" |
| Odrzuć wszystkie | Wszystkie propozycje w stanie "pending" zmieniają się na "rejected" |

### 8.5 Zapisywanie fiszek

| Krok | Akcja | Efekt |
|------|-------|-------|
| 1 | Klik "Zapisz wybrane (N)" | Przycisk w stanie loading |
| 2 | Sukces | Toast z komunikatem sukcesu, formularz wyczyszszony, propozycje usunięte |
| 3 | Błąd | Alert z komunikatem błędu, możliwość ponowienia |

## 9. Warunki i walidacja

### 9.1 Walidacja tekstu źródłowego

| Warunek | Komponent | Efekt na UI |
|---------|-----------|-------------|
| Tekst < 1000 znaków | CharacterCounter, GenerateButton | Licznik czerwony, przycisk nieaktywny |
| Tekst 1000-10000 znaków | CharacterCounter, GenerateButton | Licznik zielony, przycisk aktywny |
| Tekst > 10000 znaków | CharacterCounter, GenerateButton | Licznik czerwony, przycisk nieaktywny |

### 9.2 Walidacja edycji propozycji

| Pole | Warunek | Komunikat błędu |
|------|---------|-----------------|
| front | Puste | "Przód fiszki jest wymagany" |
| front | > 500 znaków | "Przód fiszki może mieć maksymalnie 500 znaków" |
| back | Puste | "Tył fiszki jest wymagany" |
| back | > 1000 znaków | "Tył fiszki może mieć maksymalnie 1000 znaków" |

### 9.3 Walidacja przycisków akcji

| Przycisk | Warunek aktywności |
|----------|-------------------|
| "Generuj fiszki" | Tekst 1000-10000 znaków AND nie trwa generowanie AND limit nie przekroczony |
| "Zapisz wybrane (N)" | N > 0 AND nie trwa zapisywanie |
| "Akceptuj wszystkie" | Istnieją propozycje w stanie "pending" |
| "Odrzuć wszystkie" | Istnieją propozycje w stanie "pending" |

## 10. Obsługa błędów

### 10.1 Błędy sieciowe

| Scenariusz | Obsługa |
|------------|---------|
| Brak połączenia z internetem | Alert: "Sprawdź połączenie z internetem i spróbuj ponownie" |
| Timeout (> 60s) | Alert: "Generowanie trwa zbyt długo. Spróbuj z krótszym tekstem." |
| Błąd parsowania JSON | Alert: "Wystąpił błąd komunikacji z serwerem" |

### 10.2 Błędy API

| Kod błędu | Komunikat dla użytkownika | Dodatkowa akcja |
|-----------|---------------------------|-----------------|
| UNAUTHORIZED (401) | "Sesja wygasła" | Redirect do `/auth?returnUrl=/generate` |
| VALIDATION_ERROR (400) | Wyświetlenie szczegółów z `error.details` | - |
| RATE_LIMITED (429) | "Przekroczono limit generowań. Spróbuj ponownie za X minut." | Wyświetlenie countdown |
| SERVICE_UNAVAILABLE (503) | "Usługa AI jest tymczasowo niedostępna. Spróbuj za kilka minut." | - |
| INTERNAL_ERROR (500) | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." | Przycisk "Spróbuj ponownie" |

### 10.3 Błędy walidacji client-side

| Błąd | Komponent | Sposób wyświetlenia |
|------|-----------|---------------------|
| Tekst za krótki | CharacterCounter | Czerwony kolor, komunikat pod textarea |
| Tekst za długi | CharacterCounter | Czerwony kolor, komunikat pod textarea |
| Puste pole edycji | ProposalEditForm | Czerwona obwódka, komunikat pod polem |

### 10.4 Stany brzegowe

| Scenariusz | Obsługa |
|------------|---------|
| AI zwróciło 0 propozycji | Komunikat: "Nie udało się wygenerować fiszek z podanego tekstu. Spróbuj z innym fragmentem." |
| Wszystkie propozycje odrzucone | Przycisk "Zapisz" nieaktywny, możliwość ponownego generowania |
| Utrata fokusa podczas edycji | Auto-save do localStorage (opcjonalnie) |

## 11. Kroki implementacji

### Faza 1: Przygotowanie struktury (1-2h)

1. **Utwórz stronę Astro**
   - Plik: `src/pages/generate.astro`
   - Sprawdzenie autoryzacji (redirect dla niezalogowanych)
   - Import i osadzenie głównego komponentu React

2. **Utwórz strukturę katalogów**
   - `src/components/generate/` - główny katalog
   - `src/components/generate/hooks/` - custom hooks
   - `src/components/generate/types.ts` - typy ViewModel

3. **Utwórz typy**
   - Plik: `src/components/generate/types.ts`
   - Zdefiniuj wszystkie interfejsy ViewModel

### Faza 2: Komponenty bazowe (2-3h)

4. **Utwórz komponent Textarea**
   - Plik: `src/components/ui/textarea.tsx`
   - Komponent shadcn/ui z auto-resize

5. **Utwórz CharacterCounter**
   - Plik: `src/components/generate/CharacterCounter.tsx`
   - Logika kolorowania i progress bar

6. **Utwórz RateLimitInfo**
   - Plik: `src/components/generate/RateLimitInfo.tsx`
   - Wyświetlanie limitu i countdown

### Faza 3: Formularz generowania (2-3h)

7. **Utwórz SourceTextArea**
   - Plik: `src/components/generate/SourceTextArea.tsx`
   - Integracja z CharacterCounter

8. **Utwórz GenerateForm**
   - Plik: `src/components/generate/GenerateForm.tsx`
   - Formularz z walidacją i przyciskiem

### Faza 4: Komponenty propozycji (3-4h)

9. **Utwórz ProposalEditForm**
   - Plik: `src/components/generate/ProposalEditForm.tsx`
   - Formularz inline z walidacją

10. **Utwórz ProposalCard**
    - Plik: `src/components/generate/ProposalCard.tsx`
    - Karta z wszystkimi stanami i akcjami

11. **Utwórz ProposalList**
    - Plik: `src/components/generate/ProposalList.tsx`
    - Kontener z aria-live

12. **Utwórz BulkActions**
    - Plik: `src/components/generate/BulkActions.tsx`
    - Przyciski akcji masowych

13. **Utwórz SaveProposalsButton**
    - Plik: `src/components/generate/SaveProposalsButton.tsx`
    - Przycisk z badge

### Faza 5: Zarządzanie stanem (2-3h)

14. **Utwórz reducer**
    - Plik: `src/components/generate/hooks/generateViewReducer.ts`
    - Implementacja wszystkich akcji

15. **Utwórz custom hook**
    - Plik: `src/components/generate/hooks/useGenerateView.ts`
    - Integracja z API, computed values

### Faza 6: Główny komponent (2-3h)

16. **Utwórz GenerateView**
    - Plik: `src/components/generate/GenerateView.tsx`
    - Złożenie wszystkich komponentów
    - Obsługa stanów loading i error

17. **Utwórz plik eksportowy**
    - Plik: `src/components/generate/index.ts`
    - Eksport publicznych komponentów

### Faza 7: Integracja i testy (2-3h)

18. **Zintegruj z Astro**
    - Aktualizuj `generate.astro`
    - Dodaj `client:load` directive

19. **Testy manualne**
    - Przetestuj wszystkie przepływy
    - Sprawdź obsługę błędów
    - Zweryfikuj dostępność (a11y)

20. **Poprawki i optymalizacje**
    - Memoizacja kosztownych obliczeń
    - Optymalizacja re-renderów
    - Finalne style i animacje

### Faza 8: Dodatkowe usprawnienia (opcjonalne, 1-2h)

21. **Dodaj animacje**
    - Animacje przejść między stanami kart
    - Animacja loading

22. **Dodaj skróty klawiszowe**
    - Ctrl+Enter do generowania
    - Escape do anulowania edycji

23. **Dodaj toast notifications**
    - Sukces zapisu
    - Błędy w tle

