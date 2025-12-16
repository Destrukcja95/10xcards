# Plan implementacji widoku Profil i ustawienia

## 1. Przegląd

Widok profilu (`/profile`) służy do wyświetlania statystyk użytkowania aplikacji oraz zarządzania kontem użytkownika. Główne funkcje to:
- Prezentacja statystyk fiszek (łączna liczba, podział AI vs. ręczne)
- Wyświetlanie wskaźnika akceptacji fiszek AI
- Historia sesji generowania AI w formie tabeli z paginacją
- Usunięcie konta (zgodność z RODO) z wieloetapowym potwierdzeniem

Widok jest dynamiczną React Island wymagającą autoryzacji.

## 2. Routing widoku

- **Ścieżka:** `/profile`
- **Plik:** `src/pages/profile.astro`
- **Ochrona:** Middleware Astro sprawdza sesję JWT, redirect do `/auth?returnUrl=/profile` przy braku autoryzacji
- **Layout:** Standardowy layout z nawigacją dla zalogowanych użytkowników

## 3. Struktura komponentów

```
ProfileView (React Island)
├── ProfileHeader
│   └── Tytuł + email użytkownika
├── StatsOverview
│   ├── StatCard (Łączna liczba fiszek)
│   ├── StatCard (Fiszki AI)
│   ├── StatCard (Fiszki ręczne)
│   └── StatCard (Wskaźnik akceptacji AI)
├── GenerationHistory
│   ├── GenerationHistoryTable
│   │   └── GenerationHistoryRow[]
│   ├── GenerationHistoryPagination
│   └── EmptyGenerationHistory (warunkowo)
├── AccountSettings
│   └── DeleteAccountButton
└── DeleteAccountDialog
    ├── Krok 1: Ostrzeżenie
    └── Krok 2: Potwierdzenie (input + przycisk)
```

## 4. Szczegóły komponentów

### ProfileView
- **Opis:** Główny komponent kontenerowy widoku profilu. Zarządza stanem globalnym, koordynuje pobieranie danych i renderuje komponenty potomne.
- **Główne elementy:** `<div>` container z max-width, komponenty potomne, Alert dla błędów/sukcesu
- **Obsługiwane interakcje:** Inicjalne ładowanie danych, zmiana strony historii, otwarcie/zamknięcie dialogu usunięcia konta
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji
- **Typy:** `ProfileViewState`, `ProfileViewAction`
- **Propsy:** Brak (komponent najwyższego poziomu)

### ProfileHeader
- **Opis:** Nagłówek widoku z tytułem "Profil" i opcjonalnie emailem użytkownika.
- **Główne elementy:** `<header>`, `<h1>`, `<p>` z emailem
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak specyficznych
- **Propsy:** `{ userEmail?: string }`

### StatsOverview
- **Opis:** Sekcja wyświetlająca 4 karty statystyk w siatce responsywnej. Pokazuje skeleton podczas ładowania.
- **Główne elementy:** Grid container (`<div class="grid">`), 4× `StatCard`
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie)
- **Obsługiwana walidacja:** Brak
- **Typy:** `ProfileStatsDTO`
- **Propsy:** `{ stats: ProfileStatsDTO | null; isLoading: boolean }`

### StatCard
- **Opis:** Pojedyncza karta statystyki z etykietą, wartością liczbową i opcjonalną ikoną.
- **Główne elementy:** Shadcn `Card`, `CardHeader`, `CardContent`, ikona SVG
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak specyficznych
- **Propsy:** `{ label: string; value: number | string; icon?: React.ReactNode; variant?: 'default' | 'highlight'; isLoading?: boolean }`

### GenerationHistory
- **Opis:** Sekcja z tabelą historii generowania AI. Zawiera nagłówek sekcji, tabelę z danymi i paginację.
- **Główne elementy:** `<section>`, `<h2>`, `GenerationHistoryTable`, `GenerationHistoryPagination`
- **Obsługiwane interakcje:** Zmiana strony paginacji
- **Obsługiwana walidacja:** Brak
- **Typy:** `GenerationSessionDTO[]`, `PaginationDTO`
- **Propsy:** `{ sessions: GenerationSessionDTO[]; pagination: PaginationDTO | null; isLoading: boolean; onPageChange: (page: number) => void }`

### GenerationHistoryTable
- **Opis:** Tabela HTML z historią sesji generowania. Na mobile zamieniana na stack kart.
- **Główne elementy:** `<table>`, `<thead>`, `<tbody>`, `GenerationHistoryRow` dla każdej sesji
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** `GenerationSessionDTO[]`
- **Propsy:** `{ sessions: GenerationSessionDTO[]; isLoading: boolean }`

### GenerationHistoryRow
- **Opis:** Pojedynczy wiersz tabeli historii z datą, liczbą wygenerowanych, zaakceptowanych i wskaźnikiem sesji.
- **Główne elementy:** `<tr>`, `<td>` × 4
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** `GenerationSessionDTO`
- **Propsy:** `{ session: GenerationSessionDTO }`

### GenerationHistoryPagination
- **Opis:** Komponent paginacji dla historii generowania, reużywalny wzorzec z FlashcardsPagination.
- **Główne elementy:** `<nav>`, przyciski Poprzednia/Następna, info o stronach
- **Obsługiwane interakcje:** Klik na przyciski zmiany strony
- **Obsługiwana walidacja:** Blokada przycisków na pierwszej/ostatniej stronie
- **Typy:** `PaginationDTO`
- **Propsy:** `{ pagination: PaginationDTO; onPageChange: (page: number) => void; isLoading: boolean }`

### EmptyGenerationHistory
- **Opis:** Stan pusty wyświetlany gdy użytkownik nie ma historii generowania.
- **Główne elementy:** `<div>` centered, ikona, tekst, przycisk CTA do `/generate`
- **Obsługiwane interakcje:** Klik na CTA
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

### AccountSettings
- **Opis:** Sekcja ustawień konta z przyciskiem usunięcia konta.
- **Główne elementy:** `<section>`, `<h2>`, `<p>` z ostrzeżeniem, `DeleteAccountButton`
- **Obsługiwane interakcje:** Klik na przycisk usunięcia
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** `{ onDeleteClick: () => void }`

### DeleteAccountButton
- **Opis:** Przycisk destructive uruchamiający dialog usunięcia konta.
- **Główne elementy:** Shadcn `Button` variant="destructive"
- **Obsługiwane interakcje:** Klik otwiera dialog
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** `{ onClick: () => void }`

### DeleteAccountDialog
- **Opis:** Wieloetapowy dialog potwierdzenia usunięcia konta (RODO). Krok 1: ostrzeżenie, Krok 2: potwierdzenie przez wpisanie "USUŃ".
- **Główne elementy:** Shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `Input`, `Button`
- **Obsługiwane interakcje:** 
  - Zmiana wartości inputa potwierdzenia
  - Klik "Anuluj" → zamknięcie
  - Klik "Kontynuuj" (krok 1) → przejście do kroku 2
  - Klik "Usuń konto na zawsze" (krok 2) → wywołanie API
- **Obsługiwana walidacja:** 
  - Input musi zawierać dokładnie "USUŃ" (case-sensitive)
  - Przycisk potwierdzenia disabled gdy warunek nie spełniony
- **Typy:** `DeleteAccountDialogState`
- **Propsy:** `{ isOpen: boolean; onClose: () => void; onConfirm: () => Promise<void>; isDeleting: boolean }`

## 5. Typy

### ProfileStatsDTO (nowy ViewModel)
```typescript
interface ProfileStatsDTO {
  totalFlashcards: number;      // Łączna liczba fiszek
  aiFlashcards: number;         // Fiszki źródło: ai_generated
  manualFlashcards: number;     // Fiszki źródło: manual
  acceptanceRate: number;       // Wskaźnik akceptacji AI (%)
}
```

### ProfileViewState (nowy typ stanu)
```typescript
interface ProfileViewState {
  // Statystyki
  stats: ProfileStatsDTO | null;
  statsLoading: boolean;
  statsError: string | null;
  
  // Historia generowania
  sessions: GenerationSessionDTO[];
  sessionsPagination: PaginationDTO | null;
  sessionsLoading: boolean;
  sessionsError: string | null;
  sessionsPage: number;
  
  // Usuwanie konta
  deleteDialogOpen: boolean;
  deleteDialogStep: 1 | 2;
  deleteConfirmInput: string;
  isDeleting: boolean;
  deleteError: string | null;
  
  // Ogólne
  successMessage: string | null;
}
```

### ProfileViewAction (akcje reducera)
```typescript
type ProfileViewAction =
  | { type: 'FETCH_STATS_START' }
  | { type: 'FETCH_STATS_SUCCESS'; payload: ProfileStatsDTO }
  | { type: 'FETCH_STATS_ERROR'; payload: string }
  | { type: 'FETCH_SESSIONS_START' }
  | { type: 'FETCH_SESSIONS_SUCCESS'; payload: { sessions: GenerationSessionDTO[]; pagination: PaginationDTO } }
  | { type: 'FETCH_SESSIONS_ERROR'; payload: string }
  | { type: 'SET_SESSIONS_PAGE'; payload: number }
  | { type: 'OPEN_DELETE_DIALOG' }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'SET_DELETE_STEP'; payload: 1 | 2 }
  | { type: 'SET_DELETE_CONFIRM_INPUT'; payload: string }
  | { type: 'DELETE_START' }
  | { type: 'DELETE_SUCCESS' }
  | { type: 'DELETE_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_SUCCESS' };
```

### DeleteAccountDialogState (stan dialogu)
```typescript
interface DeleteAccountDialogState {
  isOpen: boolean;
  step: 1 | 2;
  confirmInput: string;
}
```

### Typy z src/types.ts (reużywane)
- `GenerationSessionDTO` - pojedyncza sesja generowania
- `GenerationSessionsListResponseDTO` - odpowiedź API z sesjami
- `GenerationSessionsSummaryDTO` - podsumowanie statystyk
- `FlashcardsListResponseDTO` - odpowiedź API z fiszkami
- `PaginationDTO` - metadane paginacji
- `ErrorDTO` - format błędów API

## 6. Zarządzanie stanem

### Custom Hook: useProfileView

Hook `useProfileView` zarządza całym stanem widoku profilu używając wzorca `useReducer`:

```typescript
// src/components/profile/hooks/useProfileView.ts

function useProfileView() {
  const [state, dispatch] = useReducer(profileViewReducer, initialState);
  
  // Akcje
  const fetchStats = useCallback(async () => { ... }, []);
  const fetchSessions = useCallback(async () => { ... }, [state.sessionsPage]);
  const changeSessionsPage = useCallback((page: number) => { ... }, []);
  const openDeleteDialog = useCallback(() => { ... }, []);
  const closeDeleteDialog = useCallback(() => { ... }, []);
  const setDeleteStep = useCallback((step: 1 | 2) => { ... }, []);
  const setDeleteConfirmInput = useCallback((value: string) => { ... }, []);
  const deleteAccount = useCallback(async () => { ... }, []);
  const clearError = useCallback(() => { ... }, []);
  
  // Effects
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchSessions(); }, [state.sessionsPage]);
  
  // Computed
  const isConfirmValid = useMemo(() => state.deleteConfirmInput === 'USUŃ', [state.deleteConfirmInput]);
  const hasNoHistory = useMemo(() => !state.sessionsLoading && state.sessions.length === 0, [...]);
  
  return { state, actions, computed };
}
```

### Reducer: profileViewReducer

Reducer obsługuje wszystkie akcje związane ze zmianą stanu widoku, w tym:
- Ładowanie statystyk
- Ładowanie historii generowania z paginacją
- Zarządzanie dialogiem usunięcia konta
- Obsługę błędów i komunikatów sukcesu

## 7. Integracja API

### Pobieranie statystyk fiszek

**Endpoint:** `GET /api/flashcards?limit=1`

**Cel:** Pobranie `pagination.total` dla łącznej liczby fiszek.

**Żądanie:**
```typescript
const response = await fetch('/api/flashcards?limit=1');
const data: FlashcardsListResponseDTO = await response.json();
// data.pagination.total → łączna liczba fiszek
```

**Uwaga:** API nie obsługuje filtrowania po `source`, więc liczby AI vs. ręczne muszą być obliczone na podstawie pełnej listy lub osobnego endpointu. Alternatywnie można pobrać wszystkie fiszki z dużym limitem i policzyć lokalnie, lub rozszerzyć API o statystyki.

**Rekomendacja:** Dla MVP pobierz wszystkie fiszki (z paginacją po wszystkich stronach) i policz lokalnie. Dla skalowalności rozważ dodanie endpointu `GET /api/flashcards/stats`.

### Pobieranie historii i wskaźnika akceptacji

**Endpoint:** `GET /api/generation-sessions?page={page}&limit=10`

**Typ odpowiedzi:** `GenerationSessionsListResponseDTO`

**Żądanie:**
```typescript
const response = await fetch(`/api/generation-sessions?page=${page}&limit=10`);
const data: GenerationSessionsListResponseDTO = await response.json();
// data.data → lista sesji
// data.pagination → metadane paginacji
// data.summary.acceptance_rate → wskaźnik akceptacji AI
```

### Usunięcie konta

**Metoda:** Supabase Auth Admin API (wymaga wywołania z poziomu serwera lub dedykowanego endpointu)

**Rekomendowany endpoint:** `DELETE /api/account` (do utworzenia)

**Przepływ:**
1. Frontend wywołuje `DELETE /api/account`
2. Backend weryfikuje sesję użytkownika
3. Backend wywołuje `supabase.auth.admin.deleteUser(userId)`
4. RLS CASCADE automatycznie usuwa flashcards i generation_sessions
5. Backend zwraca 204 No Content
6. Frontend przekierowuje do `/` z toast potwierdzenia

**Typ żądania:** Brak body
**Typ odpowiedzi:** 204 No Content lub ErrorDTO

## 8. Interakcje użytkownika

| Interakcja | Element UI | Rezultat |
|------------|------------|----------|
| Wejście na `/profile` | - | Automatyczne pobranie statystyk i historii |
| Zmiana strony historii | Przyciski paginacji | Pobranie nowej strony sesji, aktualizacja tabeli |
| Klik "Usuń konto" | DeleteAccountButton | Otwarcie dialogu, krok 1 (ostrzeżenie) |
| Klik "Kontynuuj" w dialogu | Dialog krok 1 | Przejście do kroku 2 (potwierdzenie) |
| Wpisanie "USUŃ" | Input w kroku 2 | Aktywacja przycisku potwierdzenia |
| Klik "Usuń konto na zawsze" | Dialog krok 2 | Wywołanie API, loading state, redirect po sukcesie |
| Klik "Anuluj" w dialogu | Dialog | Zamknięcie dialogu, reset stanu |
| Klik "Generuj fiszki" (CTA) | EmptyGenerationHistory | Nawigacja do `/generate` |

## 9. Warunki i walidacja

### Walidacja potwierdzenia usunięcia konta

| Warunek | Komponent | Efekt UI |
|---------|-----------|----------|
| `confirmInput !== 'USUŃ'` | DeleteAccountDialog | Przycisk "Usuń konto na zawsze" disabled |
| `confirmInput === 'USUŃ'` | DeleteAccountDialog | Przycisk enabled, można kliknąć |
| `isDeleting === true` | DeleteAccountDialog | Wszystkie przyciski disabled, spinner na przycisku |

### Walidacja paginacji

| Warunek | Komponent | Efekt UI |
|---------|-----------|----------|
| `page === 1` | GenerationHistoryPagination | Przycisk "Poprzednia" disabled |
| `page === total_pages` | GenerationHistoryPagination | Przycisk "Następna" disabled |
| `isLoading === true` | GenerationHistoryPagination | Oba przyciski disabled |

### Wymagania dostępności

- Dialog usunięcia: `role="alertdialog"`, `aria-describedby` dla ostrzeżenia
- Input potwierdzenia: `aria-label="Wpisz USUŃ aby potwierdzić"`
- Tabela historii: `<caption>` dla screen readers, `scope="col"` w nagłówkach
- Focus trap w dialogu
- Focus powraca na przycisk "Usuń konto" po zamknięciu dialogu

## 10. Obsługa błędów

### Błędy API

| Kod HTTP | Źródło | Obsługa |
|----------|--------|---------|
| 401 Unauthorized | Dowolny endpoint | Redirect do `/auth?returnUrl=/profile` |
| 500 Internal Error | GET /api/flashcards | Alert z błędem w sekcji statystyk, przycisk "Spróbuj ponownie" |
| 500 Internal Error | GET /api/generation-sessions | Alert z błędem w sekcji historii, przycisk "Spróbuj ponownie" |
| 500 Internal Error | DELETE /api/account | Alert w dialogu, dialog pozostaje otwarty |

### Błędy sieciowe

| Scenariusz | Obsługa |
|------------|---------|
| Brak połączenia | Alert "Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem." |
| Timeout | Alert "Operacja trwała zbyt długo. Spróbuj ponownie." |

### Stany puste

| Stan | Komponent | Komunikat |
|------|-----------|-----------|
| Brak historii generowania | EmptyGenerationHistory | "Nie masz jeszcze historii generowania. Wygeneruj pierwsze fiszki!" + CTA |
| Brak fiszek | StatsOverview | Wartość "0" w karcie statystyk (nie jest to błąd) |

### Alert błędów

```tsx
{state.statsError && (
  <Alert variant="destructive">
    <AlertTitle>Błąd ładowania statystyk</AlertTitle>
    <AlertDescription>
      {state.statsError}
      <Button onClick={actions.fetchStats} variant="outline" size="sm">
        Spróbuj ponownie
      </Button>
    </AlertDescription>
  </Alert>
)}
```

## 11. Kroki implementacji

### Etap 1: Przygotowanie struktury plików

1. Utworzenie folderu `src/components/profile/`
2. Utworzenie pliku `src/components/profile/types.ts` z typami ViewModel
3. Utworzenie pliku `src/components/profile/hooks/profileViewReducer.ts`
4. Utworzenie pliku `src/components/profile/hooks/useProfileView.ts`

### Etap 2: Implementacja komponentów statycznych

5. Implementacja `StatCard.tsx` - reużywalna karta statystyki ze skeletonem
6. Implementacja `StatsOverview.tsx` - siatka 4 kart
7. Implementacja `ProfileHeader.tsx` - nagłówek z tytułem

### Etap 3: Implementacja tabeli historii

8. Implementacja `GenerationHistoryRow.tsx` - pojedynczy wiersz
9. Implementacja `GenerationHistoryTable.tsx` - tabela z nagłówkami
10. Implementacja `GenerationHistoryPagination.tsx` - paginacja (wzorce z FlashcardsPagination)
11. Implementacja `EmptyGenerationHistory.tsx` - stan pusty
12. Implementacja `GenerationHistory.tsx` - kontener sekcji

### Etap 4: Implementacja dialogu usunięcia

13. Implementacja `DeleteAccountButton.tsx`
14. Implementacja `DeleteAccountDialog.tsx` z dwoma krokami
15. Implementacja `AccountSettings.tsx` - sekcja ustawień

### Etap 5: Integracja i hook

16. Implementacja `profileViewReducer.ts`
17. Implementacja `useProfileView.ts` z integracją API
18. Implementacja głównego `ProfileView.tsx`

### Etap 6: Strona i API

19. Utworzenie `src/pages/profile.astro` z ochroną tras
20. Utworzenie `src/pages/api/account.ts` dla DELETE (usunięcie konta)

### Etap 7: Finalizacja

21. Utworzenie `src/components/profile/index.ts` z eksportami
22. Testy manualne wszystkich przepływów
23. Weryfikacja dostępności (keyboard navigation, screen reader)
24. Weryfikacja responsywności (mobile, tablet, desktop)

### Etap 8 (opcjonalnie): Optymalizacja

25. Rozważenie dodania endpointu `GET /api/flashcards/stats` dla efektywniejszego pobierania statystyk
26. Cache'owanie statystyk w TanStack Query (jeśli używane w projekcie)

