# Plan implementacji widoku Moje fiszki

## 1. Przegląd

Widok "Moje fiszki" (`/flashcards`) umożliwia zalogowanym użytkownikom przeglądanie, tworzenie, edycję i usuwanie własnych fiszek edukacyjnych. Jest to centralny hub zarządzania fiszkami w aplikacji 10x-cards. Widok prezentuje paginowaną listę fiszek z możliwością sortowania, wyróżnieniem fiszek wygenerowanych przez AI oraz pełnym zestawem operacji CRUD realizowanych przez dialogi modalne.

Widok realizuje wymagania User Stories: US-005 (Edycja fiszek), US-006 (Usuwanie fiszek), US-007 (Ręczne tworzenie fiszek).

## 2. Routing widoku

| Atrybut | Wartość |
|---------|---------|
| **Ścieżka** | `/flashcards` |
| **Plik strony** | `src/pages/flashcards.astro` |
| **Typ renderowania** | SSR z React Island (`client:load`) |
| **Autoryzacja** | Wymagana - redirect do `/auth?returnUrl=/flashcards` |

## 3. Struktura komponentów

```
flashcards.astro
└── FlashcardsView (React Island)
    ├── FlashcardsHeader
    │   ├── AddFlashcardButton
    │   └── FlashcardSortSelect
    ├── FlashcardsContent
    │   ├── FlashcardList
    │   │   ├── FlashcardCard (×N)
    │   │   │   └── FlashcardActions
    │   │   └── FlashcardSkeleton (×N, podczas ładowania)
    │   ├── EmptyFlashcardsState (gdy brak fiszek)
    │   └── FlashcardsPagination
    ├── FlashcardFormDialog (tworzenie/edycja)
    │   └── FlashcardForm
    └── DeleteConfirmDialog
```

## 4. Szczegóły komponentów

### 4.1 FlashcardsView

**Opis:** Główny komponent kontenera widoku, zarządza stanem globalnym, integruje się z API i koordynuje komponenty potomne. Wzorowany na `GenerateView`.

**Główne elementy:**
- `<div>` jako główny kontener z max-width i padding
- `FlashcardsHeader` - nagłówek z akcjami
- `FlashcardsContent` - główna treść z listą lub pustym stanem
- `FlashcardFormDialog` - dialog formularza (tworzenie/edycja)
- `DeleteConfirmDialog` - dialog potwierdzenia usunięcia
- `Alert` (warianty error/success) - komunikaty zwrotne

**Obsługiwane interakcje:**
- Zmiana sortowania → ponowne pobranie listy
- Zmiana strony paginacji → pobranie nowej strony
- Otwarcie dialogu dodawania → `setDialogState({ mode: 'create' })`
- Otwarcie dialogu edycji → `setDialogState({ mode: 'edit', flashcard })`
- Otwarcie dialogu usunięcia → `setDeleteTarget(flashcard)`
- Zamknięcie alertów → auto-dismiss lub klik

**Obsługiwana walidacja:** Brak (delegowana do `FlashcardForm`)

**Typy:**
- `FlashcardsViewState`
- `FlashcardDTO`
- `FlashcardsListResponseDTO`

**Propsy:** Brak (komponent najwyższego poziomu)

---

### 4.2 FlashcardsHeader

**Opis:** Nagłówek widoku zawierający tytuł, licznik fiszek, przycisk dodawania i selektor sortowania.

**Główne elementy:**
- `<header>` z flexbox layout
- `<h1>` z tytułem "Moje fiszki"
- `<span>` z liczbą fiszek (z `pagination.total`)
- `AddFlashcardButton`
- `FlashcardSortSelect`

**Obsługiwane interakcje:**
- Klik "Dodaj fiszkę" → `onAddClick()`
- Zmiana sortowania → `onSortChange(sort, order)`

**Obsługiwana walidacja:** Brak

**Typy:**
- `SortOption`
- `SortOrder`

**Propsy:**
```typescript
interface FlashcardsHeaderProps {
  totalCount: number;
  currentSort: SortOption;
  currentOrder: SortOrder;
  onAddClick: () => void;
  onSortChange: (sort: SortOption, order: SortOrder) => void;
  isLoading: boolean;
}
```

---

### 4.3 AddFlashcardButton

**Opis:** Przycisk dodawania nowej fiszki z ikoną plus.

**Główne elementy:**
- `<Button>` z wariantem `default`, ikoną `+` i tekstem "Dodaj fiszkę"

**Obsługiwane interakcje:**
- Klik → `onClick()`

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface AddFlashcardButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

---

### 4.4 FlashcardSortSelect

**Opis:** Dropdown do wyboru pola i kierunku sortowania listy fiszek.

**Główne elementy:**
- Shadcn `Select` z opcjami:
  - "Data utworzenia (najnowsze)" → `created_at`, `desc`
  - "Data utworzenia (najstarsze)" → `created_at`, `asc`
  - "Data aktualizacji (najnowsze)" → `updated_at`, `desc`
  - "Data aktualizacji (najstarsze)" → `updated_at`, `asc`
  - "Następna powtórka (najbliższe)" → `next_review_date`, `asc`
  - "Następna powtórka (najdalsze)" → `next_review_date`, `desc`

**Obsługiwane interakcje:**
- Zmiana wartości → `onChange(sort, order)`

**Obsługiwana walidacja:** Brak

**Typy:**
- `SortOption`: `'created_at' | 'updated_at' | 'next_review_date'`
- `SortOrder`: `'asc' | 'desc'`

**Propsy:**
```typescript
interface FlashcardSortSelectProps {
  value: string; // combined key: `${sort}_${order}`
  onChange: (sort: SortOption, order: SortOrder) => void;
  disabled?: boolean;
}
```

---

### 4.5 FlashcardList

**Opis:** Kontener renderujący siatkę kart fiszek lub skeleton loaders.

**Główne elementy:**
- `<div>` z CSS Grid (1 kolumna mobile, 2-3 kolumny desktop)
- `FlashcardCard` dla każdej fiszki w `data`
- `FlashcardSkeleton` × 6 podczas ładowania

**Obsługiwane interakcje:** Brak (delegowane do `FlashcardCard`)

**Obsługiwana walidacja:** Brak

**Typy:**
- `FlashcardDTO[]`

**Propsy:**
```typescript
interface FlashcardListProps {
  flashcards: FlashcardDTO[];
  isLoading: boolean;
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}
```

---

### 4.6 FlashcardCard

**Opis:** Pojedyncza karta fiszki wyświetlająca przód, tył, badge źródła (AI) oraz przyciski akcji.

**Główne elementy:**
- Shadcn `Card` z `CardHeader`, `CardContent`, `CardFooter`
- Badge "AI" (wariant subtle, zielony) dla `source === 'ai_generated'`
- Sekcja "Przód" z truncated tekstem
- Sekcja "Tył" z truncated tekstem
- `FlashcardActions` w stopce

**Obsługiwane interakcje:**
- Klik "Edytuj" → `onEdit()`
- Klik "Usuń" → `onDelete()`

**Obsługiwana walidacja:** Brak

**Typy:**
- `FlashcardDTO`

**Propsy:**
```typescript
interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEdit: () => void;
  onDelete: () => void;
}
```

---

### 4.7 FlashcardSkeleton

**Opis:** Placeholder loading dla karty fiszki, matching layout `FlashcardCard`.

**Główne elementy:**
- Shadcn `Card` ze `Skeleton` elementami symulującymi:
  - Badge (mały prostokąt)
  - Przód (2 linie)
  - Tył (3 linie)
  - Przyciski akcji (2 prostokąty)

**Obsługiwane interakcje:** Brak

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak

---

### 4.8 EmptyFlashcardsState

**Opis:** Stan pusty wyświetlany gdy użytkownik nie ma żadnych fiszek.

**Główne elementy:**
- Ikona (np. empty folder lub cards)
- Nagłówek: "Nie masz jeszcze fiszek"
- Opis: "Zacznij od wygenerowania fiszek AI lub dodaj pierwszą ręcznie."
- Dwa przyciski CTA:
  - "Generuj z AI" → link do `/generate`
  - "Dodaj ręcznie" → `onAddClick()`

**Obsługiwane interakcje:**
- Klik "Generuj z AI" → nawigacja do `/generate`
- Klik "Dodaj ręcznie" → `onAddClick()`

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface EmptyFlashcardsStateProps {
  onAddClick: () => void;
}
```

---

### 4.9 FlashcardsPagination

**Opis:** Komponent paginacji do nawigacji między stronami listy fiszek.

**Główne elementy:**
- Przyciski "Poprzednia" / "Następna" (disabled gdy na pierwszej/ostatniej stronie)
- Wskaźnik "Strona X z Y"
- Opcjonalnie: bezpośrednie linki do stron (jeśli mało stron)

**Obsługiwane interakcje:**
- Klik "Poprzednia" → `onPageChange(page - 1)`
- Klik "Następna" → `onPageChange(page + 1)`

**Obsługiwana walidacja:** Brak

**Typy:**
- `PaginationDTO`

**Propsy:**
```typescript
interface FlashcardsPaginationProps {
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}
```

---

### 4.10 FlashcardFormDialog

**Opis:** Dialog modalny zawierający formularz tworzenia lub edycji fiszki.

**Główne elementy:**
- Shadcn `Dialog` z `DialogContent`, `DialogHeader`, `DialogTitle`
- Tytuł dynamiczny: "Dodaj fiszkę" lub "Edytuj fiszkę"
- `FlashcardForm` jako treść
- Obsługa focus trap i zamykania przez Escape

**Obsługiwane interakcje:**
- Zamknięcie dialogu → `onClose()`
- Submit formularza → `onSubmit(data)`

**Obsługiwana walidacja:** Delegowana do `FlashcardForm`

**Typy:**
- `FlashcardFormDialogMode`: `'create' | 'edit'`
- `FlashcardDTO` (dla trybu edycji)

**Propsy:**
```typescript
interface FlashcardFormDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  flashcard?: FlashcardDTO; // wymagane gdy mode === 'edit'
  onClose: () => void;
  onSubmit: (data: CreateFlashcardCommand | UpdateFlashcardCommand) => Promise<void>;
  isSubmitting: boolean;
}
```

---

### 4.11 FlashcardForm

**Opis:** Formularz tworzenia/edycji fiszki z walidacją inline.

**Główne elementy:**
- `<form>` z `onSubmit`
- Pole "Przód fiszki":
  - `Label` + `Input` (dla krótkiego tekstu) lub `Textarea`
  - Licznik znaków `X/500`
  - Komunikat błędu walidacji
- Pole "Tył fiszki":
  - `Label` + `Textarea`
  - Licznik znaków `X/1000`
  - Komunikat błędu walidacji
- Przyciski akcji:
  - "Anuluj" (variant outline) → `onCancel()`
  - "Zapisz" / "Dodaj" (variant default) → submit

**Obsługiwane interakcje:**
- Zmiana wartości pól → aktualizacja stanu + walidacja on blur
- Submit formularza → walidacja + `onSubmit(data)`
- Klik "Anuluj" → `onCancel()`

**Obsługiwana walidacja:**
| Pole | Reguły | Komunikat błędu |
|------|--------|-----------------|
| `front` | Wymagane, 1-500 znaków | "Przód fiszki jest wymagany" / "Przód fiszki może mieć maksymalnie 500 znaków" |
| `back` | Wymagane, 1-1000 znaków | "Tył fiszki jest wymagany" / "Tył fiszki może mieć maksymalnie 1000 znaków" |

**Typy:**
- `FlashcardFormData`
- `FlashcardFormErrors`

**Propsy:**
```typescript
interface FlashcardFormProps {
  initialData?: { front: string; back: string };
  onSubmit: (data: { front: string; back: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string; // "Dodaj" lub "Zapisz zmiany"
}
```

---

### 4.12 DeleteConfirmDialog

**Opis:** Dialog potwierdzenia usunięcia fiszki z ostrzeżeniem o nieodwracalności.

**Główne elementy:**
- Shadcn `Dialog` z `DialogContent`
- Ikona ostrzeżenia (warning/trash)
- Nagłówek: "Usuń fiszkę"
- Treść: "Czy na pewno chcesz usunąć tę fiszkę? Ta operacja jest nieodwracalna."
- Preview fiszki (skrócony przód)
- Przyciski:
  - "Anuluj" (variant outline)
  - "Usuń" (variant destructive)

**Obsługiwane interakcje:**
- Klik "Anuluj" → `onClose()`
- Klik "Usuń" → `onConfirm()`

**Obsługiwana walidacja:** Brak

**Typy:**
- `FlashcardDTO`

**Propsy:**
```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDTO | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}
```

## 5. Typy

### 5.1 Typy z `src/types.ts` (istniejące)

```typescript
// DTO fiszki (odpowiedź API)
type FlashcardDTO = {
  id: string;
  front: string;
  back: string;
  source: 'ai_generated' | 'manual';
  ease_factor: number;
  interval: number;
  repetition_count: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Paginacja
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Odpowiedź listy fiszek
interface FlashcardsListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// Komendy tworzenia
type CreateFlashcardCommand = {
  front: string;
  back: string;
  source: 'ai_generated' | 'manual';
};

interface CreateFlashcardsCommand {
  flashcards: CreateFlashcardCommand[];
}

// Komenda aktualizacji
type UpdateFlashcardCommand = {
  front?: string;
  back?: string;
};

// Odpowiedź błędu
interface ErrorDTO {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
```

### 5.2 Nowe typy ViewModel dla widoku

```typescript
// src/components/flashcards/types.ts

/** Opcje sortowania listy fiszek */
export type SortOption = 'created_at' | 'updated_at' | 'next_review_date';

/** Kierunek sortowania */
export type SortOrder = 'asc' | 'desc';

/** Kombinowana wartość sortowania dla selecta */
export type SortValue = `${SortOption}_${SortOrder}`;

/** Tryb dialogu formularza */
export type FlashcardDialogMode = 'create' | 'edit' | null;

/** Stan dialogu formularza */
export interface FlashcardDialogState {
  mode: FlashcardDialogMode;
  flashcard: FlashcardDTO | null;
}

/** Stan dialogu usunięcia */
export interface DeleteDialogState {
  isOpen: boolean;
  flashcard: FlashcardDTO | null;
}

/** Stan głównego widoku fiszek */
export interface FlashcardsViewState {
  /** Lista fiszek z aktualnej strony */
  flashcards: FlashcardDTO[];
  /** Metadane paginacji */
  pagination: PaginationDTO | null;
  /** Czy trwa ładowanie listy */
  isLoading: boolean;
  /** Czy trwa zapisywanie (create/update) */
  isSaving: boolean;
  /** Czy trwa usuwanie */
  isDeleting: boolean;
  /** Komunikat błędu */
  error: string | null;
  /** Komunikat sukcesu */
  successMessage: string | null;
  /** Aktualne pole sortowania */
  sortBy: SortOption;
  /** Aktualny kierunek sortowania */
  sortOrder: SortOrder;
  /** Aktualna strona */
  currentPage: number;
  /** Stan dialogu formularza */
  dialogState: FlashcardDialogState;
  /** Stan dialogu usunięcia */
  deleteDialogState: DeleteDialogState;
}

/** Stałe walidacji */
export const FLASHCARD_VALIDATION = {
  FRONT_MIN_LENGTH: 1,
  FRONT_MAX_LENGTH: 500,
  BACK_MIN_LENGTH: 1,
  BACK_MAX_LENGTH: 1000,
} as const;

/** Opcje sortowania dla selecta */
export const SORT_OPTIONS: Array<{
  value: SortValue;
  label: string;
  sort: SortOption;
  order: SortOrder;
}> = [
  { value: 'created_at_desc', label: 'Data utworzenia (najnowsze)', sort: 'created_at', order: 'desc' },
  { value: 'created_at_asc', label: 'Data utworzenia (najstarsze)', sort: 'created_at', order: 'asc' },
  { value: 'updated_at_desc', label: 'Data aktualizacji (najnowsze)', sort: 'updated_at', order: 'desc' },
  { value: 'updated_at_asc', label: 'Data aktualizacji (najstarsze)', sort: 'updated_at', order: 'asc' },
  { value: 'next_review_date_asc', label: 'Następna powtórka (najbliższe)', sort: 'next_review_date', order: 'asc' },
  { value: 'next_review_date_desc', label: 'Następna powtórka (najdalsze)', sort: 'next_review_date', order: 'desc' },
];
```

## 6. Zarządzanie stanem

### 6.1 Custom hook `useFlashcardsView`

Wzorowany na `useGenerateView` - używa `useReducer` do zarządzania złożonym stanem widoku.

```typescript
// src/components/flashcards/hooks/useFlashcardsView.ts

export function useFlashcardsView() {
  const [state, dispatch] = useReducer(flashcardsViewReducer, initialState);

  // Akcje
  const fetchFlashcards = useCallback(async () => { /* ... */ }, []);
  const createFlashcard = useCallback(async (data) => { /* ... */ }, []);
  const updateFlashcard = useCallback(async (id, data) => { /* ... */ }, []);
  const deleteFlashcard = useCallback(async (id) => { /* ... */ }, []);
  const openCreateDialog = useCallback(() => { /* ... */ }, []);
  const openEditDialog = useCallback((flashcard) => { /* ... */ }, []);
  const closeDialog = useCallback(() => { /* ... */ }, []);
  const openDeleteDialog = useCallback((flashcard) => { /* ... */ }, []);
  const closeDeleteDialog = useCallback(() => { /* ... */ }, []);
  const changePage = useCallback((page) => { /* ... */ }, []);
  const changeSort = useCallback((sort, order) => { /* ... */ }, []);
  const clearError = useCallback(() => { /* ... */ }, []);
  const clearSuccess = useCallback(() => { /* ... */ }, []);

  // Computed
  const hasFlashcards = state.flashcards.length > 0 || state.isLoading;
  const isEmpty = !state.isLoading && state.flashcards.length === 0 && state.pagination?.total === 0;

  // Effect: fetch on mount and when sort/page changes
  useEffect(() => {
    fetchFlashcards();
  }, [state.currentPage, state.sortBy, state.sortOrder]);

  return {
    state,
    actions: {
      fetchFlashcards,
      createFlashcard,
      updateFlashcard,
      deleteFlashcard,
      openCreateDialog,
      openEditDialog,
      closeDialog,
      openDeleteDialog,
      closeDeleteDialog,
      changePage,
      changeSort,
      clearError,
      clearSuccess,
    },
    computed: {
      hasFlashcards,
      isEmpty,
    },
  };
}
```

### 6.2 Reducer `flashcardsViewReducer`

```typescript
// src/components/flashcards/hooks/flashcardsViewReducer.ts

export type FlashcardsViewAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: FlashcardsListResponseDTO }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SAVE_START' }
  | { type: 'CREATE_SUCCESS'; payload: FlashcardDTO }
  | { type: 'UPDATE_SUCCESS'; payload: FlashcardDTO }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'DELETE_START' }
  | { type: 'DELETE_SUCCESS'; payload: string } // id
  | { type: 'DELETE_ERROR'; payload: string }
  | { type: 'OPEN_CREATE_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG'; payload: FlashcardDTO }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'OPEN_DELETE_DIALOG'; payload: FlashcardDTO }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_SORT'; payload: { sort: SortOption; order: SortOrder } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_SUCCESS' };

export const initialState: FlashcardsViewState = {
  flashcards: [],
  pagination: null,
  isLoading: true,
  isSaving: false,
  isDeleting: false,
  error: null,
  successMessage: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
  currentPage: 1,
  dialogState: { mode: null, flashcard: null },
  deleteDialogState: { isOpen: false, flashcard: null },
};

export function flashcardsViewReducer(
  state: FlashcardsViewState,
  action: FlashcardsViewAction
): FlashcardsViewState {
  // ... implementacja reducera
}
```

## 7. Integracja API

### 7.1 Endpointy

| Operacja | Metoda | Endpoint | Request | Response |
|----------|--------|----------|---------|----------|
| Lista fiszek | `GET` | `/api/flashcards` | Query: `page`, `limit`, `sort`, `order` | `FlashcardsListResponseDTO` |
| Tworzenie | `POST` | `/api/flashcards` | `CreateFlashcardsCommand` | `CreateFlashcardsResponseDTO` |
| Aktualizacja | `PUT` | `/api/flashcards/:id` | `UpdateFlashcardCommand` | `FlashcardDTO` |
| Usunięcie | `DELETE` | `/api/flashcards/:id` | - | `204 No Content` |

### 7.2 Funkcje API w hooku

```typescript
// Pobieranie listy
const fetchFlashcards = async () => {
  dispatch({ type: 'FETCH_START' });
  try {
    const params = new URLSearchParams({
      page: String(state.currentPage),
      limit: '20',
      sort: state.sortBy,
      order: state.sortOrder,
    });
    const response = await fetch(`/api/flashcards?${params}`);
    if (!response.ok) {
      const error: ErrorDTO = await response.json();
      dispatch({ type: 'FETCH_ERROR', payload: error.error.message });
      return;
    }
    const data: FlashcardsListResponseDTO = await response.json();
    dispatch({ type: 'FETCH_SUCCESS', payload: data });
  } catch {
    dispatch({ type: 'FETCH_ERROR', payload: 'Nie udało się pobrać fiszek' });
  }
};

// Tworzenie fiszki
const createFlashcard = async (data: { front: string; back: string }) => {
  dispatch({ type: 'SAVE_START' });
  try {
    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flashcards: [{ ...data, source: 'manual' as const }],
      }),
    });
    if (!response.ok) {
      const error: ErrorDTO = await response.json();
      dispatch({ type: 'SAVE_ERROR', payload: error.error.message });
      return;
    }
    const result: CreateFlashcardsResponseDTO = await response.json();
    dispatch({ type: 'CREATE_SUCCESS', payload: result.data[0] });
    // Refresh listy, aby zobaczyć nową fiszkę
    fetchFlashcards();
  } catch {
    dispatch({ type: 'SAVE_ERROR', payload: 'Nie udało się utworzyć fiszki' });
  }
};

// Aktualizacja fiszki
const updateFlashcard = async (id: string, data: { front: string; back: string }) => {
  dispatch({ type: 'SAVE_START' });
  try {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error: ErrorDTO = await response.json();
      dispatch({ type: 'SAVE_ERROR', payload: error.error.message });
      return;
    }
    const updated: FlashcardDTO = await response.json();
    dispatch({ type: 'UPDATE_SUCCESS', payload: updated });
  } catch {
    dispatch({ type: 'SAVE_ERROR', payload: 'Nie udało się zaktualizować fiszki' });
  }
};

// Usunięcie fiszki
const deleteFlashcard = async (id: string) => {
  dispatch({ type: 'DELETE_START' });
  try {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error: ErrorDTO = await response.json();
      dispatch({ type: 'DELETE_ERROR', payload: error.error.message });
      return;
    }
    dispatch({ type: 'DELETE_SUCCESS', payload: id });
    // Refresh aby zaktualizować paginację
    fetchFlashcards();
  } catch {
    dispatch({ type: 'DELETE_ERROR', payload: 'Nie udało się usunąć fiszki' });
  }
};
```

### 7.3 Wymagany endpoint DELETE (do implementacji)

Endpoint `DELETE /api/flashcards/:id` nie istnieje jeszcze w pliku `src/pages/api/flashcards/[id].ts`. Należy go dodać:

```typescript
// src/pages/api/flashcards/[id].ts

export const DELETE: APIRoute = async ({ locals, params }) => {
  const user = locals.user;

  if (!user) {
    const errorResponse: ErrorDTO = {
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authentication token' },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const idValidation = flashcardIdParamSchema.safeParse({ id: params.id });
  if (!idValidation.success) {
    const errorResponse: ErrorDTO = {
      error: { code: 'VALIDATION_ERROR', message: 'Invalid flashcard ID format' },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const service = new FlashcardsService(locals.supabase);
    const deleted = await service.deleteFlashcard(user.id, idValidation.data.id);

    if (!deleted) {
      const errorResponse: ErrorDTO = {
        error: { code: 'NOT_FOUND', message: 'Flashcard not found' },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/flashcards/:id] Error:', error);
    const errorResponse: ErrorDTO = {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

## 8. Interakcje użytkownika

| Interakcja | Element UI | Rezultat |
|------------|-----------|----------|
| Wejście na stronę | - | Automatyczne pobranie listy fiszek z domyślnym sortowaniem |
| Klik "Dodaj fiszkę" | `AddFlashcardButton` | Otwarcie dialogu formularza w trybie tworzenia |
| Zmiana sortowania | `FlashcardSortSelect` | Ponowne pobranie listy z nowym sortowaniem, reset do strony 1 |
| Klik "Edytuj" na karcie | `FlashcardCard` → `FlashcardActions` | Otwarcie dialogu formularza w trybie edycji z danymi fiszki |
| Klik "Usuń" na karcie | `FlashcardCard` → `FlashcardActions` | Otwarcie dialogu potwierdzenia usunięcia |
| Submit formularza tworzenia | `FlashcardForm` | Walidacja → POST API → Zamknięcie dialogu → Toast sukcesu → Refresh listy |
| Submit formularza edycji | `FlashcardForm` | Walidacja → PUT API → Zamknięcie dialogu → Toast sukcesu → Update listy |
| Potwierdzenie usunięcia | `DeleteConfirmDialog` | DELETE API → Zamknięcie dialogu → Toast sukcesu → Refresh listy |
| Anulowanie dialogu | Przycisk "Anuluj" lub Escape | Zamknięcie dialogu bez zmian |
| Zmiana strony paginacji | `FlashcardsPagination` | Pobranie wskazanej strony |
| Klik "Generuj z AI" (pusty stan) | `EmptyFlashcardsState` | Nawigacja do `/generate` |
| Klik "Dodaj ręcznie" (pusty stan) | `EmptyFlashcardsState` | Otwarcie dialogu formularza |

## 9. Warunki i walidacja

### 9.1 Walidacja formularza fiszki

| Pole | Warunek | Komunikat błędu | Kiedy sprawdzane |
|------|---------|-----------------|------------------|
| `front` | Niepuste | "Przód fiszki jest wymagany" | onBlur, onSubmit |
| `front` | ≤ 500 znaków | "Przód fiszki może mieć maksymalnie 500 znaków" | onChange (licznik), onSubmit |
| `back` | Niepuste | "Tył fiszki jest wymagany" | onBlur, onSubmit |
| `back` | ≤ 1000 znaków | "Tył fiszki może mieć maksymalnie 1000 znaków" | onChange (licznik), onSubmit |

### 9.2 Warunki UI

| Warunek | Wpływ na UI |
|---------|-------------|
| `isLoading === true` | Wyświetlenie skeleton loaders zamiast kart |
| `flashcards.length === 0 && !isLoading` | Wyświetlenie `EmptyFlashcardsState` |
| `pagination.page === 1` | Przycisk "Poprzednia" disabled |
| `pagination.page === pagination.total_pages` | Przycisk "Następna" disabled |
| `isSaving === true` | Przycisk submit w dialogu disabled + spinner |
| `isDeleting === true` | Przycisk "Usuń" w dialogu usunięcia disabled + spinner |
| `dialogState.mode === 'create'` | Tytuł "Dodaj fiszkę", przycisk "Dodaj" |
| `dialogState.mode === 'edit'` | Tytuł "Edytuj fiszkę", przycisk "Zapisz zmiany", wstępne dane |
| `flashcard.source === 'ai_generated'` | Badge "AI" na karcie |

## 10. Obsługa błędów

### 10.1 Błędy API

| Kod HTTP | Obsługa | Komunikat użytkownika |
|----------|---------|----------------------|
| 401 Unauthorized | Redirect do `/auth?returnUrl=/flashcards` | - (automatyczny redirect) |
| 400 Validation Error | Wyświetlenie błędów inline w formularzu | Z `details` API |
| 404 Not Found | Toast error + zamknięcie dialogu | "Fiszka nie została znaleziona" |
| 500 Internal Error | Alert error + możliwość retry | "Wystąpił błąd serwera. Spróbuj ponownie." |
| Network Error | Alert error + możliwość retry | "Sprawdź połączenie z internetem." |

### 10.2 Stany błędów w UI

- **Alert globalny**: Dla błędów pobierania listy i ogólnych błędów
- **Inline errors**: Pod polami formularza dla błędów walidacji
- **Toast**: Dla potwierdzeń sukcesu i krótkich informacji
- **Auto-dismiss**: Komunikaty sukcesu znikają po 5 sekundach

### 10.3 Scenariusze edge case

| Scenariusz | Obsługa |
|------------|---------|
| Usunięcie ostatniej fiszki na stronie | Przejście do poprzedniej strony lub wyświetlenie pustego stanu |
| Edycja fiszki usuniętej przez inną sesję | 404 → Toast error → Refresh listy |
| Timeout przy ładowaniu | Retry button w alert |
| Pusta odpowiedź przy pierwszym ładowaniu | `EmptyFlashcardsState` z CTA |

## 11. Kroki implementacji

### Faza 1: Przygotowanie backendu

1. **Dodanie endpointu DELETE** do `src/pages/api/flashcards/[id].ts`
   - Implementacja handlera `DELETE`
   - Wykorzystanie istniejącej metody `FlashcardsService.deleteFlashcard`
   - Testy manualne endpointu

### Faza 2: Struktura komponentów i typy

2. **Utworzenie katalogu** `src/components/flashcards/`

3. **Utworzenie pliku typów** `src/components/flashcards/types.ts`
   - Definicja `SortOption`, `SortOrder`, `SortValue`
   - Definicja `FlashcardsViewState`, `FlashcardDialogState`, `DeleteDialogState`
   - Eksport stałych `FLASHCARD_VALIDATION`, `SORT_OPTIONS`

4. **Implementacja reducera** `src/components/flashcards/hooks/flashcardsViewReducer.ts`
   - Definicja `FlashcardsViewAction`
   - Implementacja `flashcardsViewReducer`
   - Eksport `initialState`

5. **Implementacja hooka** `src/components/flashcards/hooks/useFlashcardsView.ts`
   - Integracja z reducerem
   - Implementacja wszystkich akcji (fetch, create, update, delete, dialogs)
   - Computed values

### Faza 3: Komponenty UI podstawowe

6. **Dodanie brakujących komponentów Shadcn/ui**
   - `Dialog` (`npx shadcn-ui@latest add dialog`)
   - `Select` (`npx shadcn-ui@latest add select`)
   - `Skeleton` (`npx shadcn-ui@latest add skeleton`)
   - `Badge` (`npx shadcn-ui@latest add badge`)

7. **Implementacja `FlashcardSkeleton`** - prosty skeleton loader

8. **Implementacja `EmptyFlashcardsState`** - stan pusty z CTA

9. **Implementacja `FlashcardCard`** - karta fiszki z akcjami

10. **Implementacja `FlashcardList`** - kontener listy/siatki

### Faza 4: Formularze i dialogi

11. **Implementacja `FlashcardForm`** - formularz z walidacją
    - Wzorowany na `ProposalEditForm`
    - Liczniki znaków
    - Walidacja inline

12. **Implementacja `FlashcardFormDialog`** - wrapper dialogu dla formularza

13. **Implementacja `DeleteConfirmDialog`** - dialog potwierdzenia usunięcia

### Faza 5: Komponenty nawigacji

14. **Implementacja `FlashcardSortSelect`** - dropdown sortowania

15. **Implementacja `AddFlashcardButton`** - przycisk dodawania

16. **Implementacja `FlashcardsHeader`** - nagłówek widoku

17. **Implementacja `FlashcardsPagination`** - paginacja

### Faza 6: Integracja

18. **Implementacja `FlashcardsView`** - główny komponent widoku
    - Integracja z hookiem `useFlashcardsView`
    - Kompozycja wszystkich komponentów
    - Obsługa alertów błędów/sukcesu
    - Auto-dismiss komunikatów

19. **Utworzenie pliku eksportów** `src/components/flashcards/index.ts`

20. **Utworzenie strony Astro** `src/pages/flashcards.astro`
    - Weryfikacja autoryzacji (wzorowana na `generate.astro`)
    - Osadzenie `FlashcardsView` jako React Island
    - Nawigacja (header z linkami)

### Faza 7: Stylowanie i UX

21. **Stylowanie responsywne**
    - Grid layout dla kart (1 kolumna mobile, 2-3 desktop)
    - Mobile-first podejście
    - Dialogi jako full-screen na mobile

22. **Dostępność**
    - Focus trap w dialogach
    - Aria-labels na przyciskach akcji
    - Keyboard navigation
    - `aria-live` dla dynamicznych komunikatów

### Faza 8: Testy i poprawki

23. **Testy manualne**
    - CRUD fiszek
    - Paginacja i sortowanie
    - Obsługa błędów
    - Responsywność
    - Dostępność (keyboard, screen reader)

24. **Poprawki UX**
    - Optimistic updates (opcjonalnie)
    - Animacje przejść
    - Loading states

