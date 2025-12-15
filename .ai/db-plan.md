# Schemat bazy danych PostgreSQL - 10x-cards

## 1. Lista tabel

### 1.1 Tabela `flashcards`

Główna tabela przechowująca fiszki użytkowników wraz z danymi algorytmu spaced repetition (SM-2).

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator fiszki |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Właściciel fiszki |
| `front` | VARCHAR(500) | NOT NULL | Przód fiszki (pytanie) |
| `back` | VARCHAR(1000) | NOT NULL | Tył fiszki (odpowiedź) |
| `source` | flashcard_source | NOT NULL, DEFAULT 'manual' | Pochodzenie fiszki (ENUM) |
| `ease_factor` | DECIMAL(3,2) | NOT NULL, DEFAULT 2.50, CHECK (ease_factor >= 1.30) | Współczynnik łatwości SM-2 |
| `interval` | INTEGER | NOT NULL, DEFAULT 0, CHECK (interval >= 0) | Interwał powtórki w dniach |
| `repetition_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (repetition_count >= 0) | Licznik powtórzeń |
| `next_review_date` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data następnej powtórki |
| `last_reviewed_at` | TIMESTAMPTZ | NULL | Data ostatniej powtórki |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data utworzenia |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data ostatniej modyfikacji |

### 1.2 Tabela `generation_sessions`

Tabela przechowująca sesje generowania fiszek przez AI dla celów statystycznych.

| Kolumna | Typ danych | Ograniczenia | Opis |
|---------|-----------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator sesji |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Użytkownik wykonujący generowanie |
| `source_text` | TEXT | NOT NULL, CHECK (char_length(source_text) BETWEEN 1000 AND 10000) | Tekst źródłowy do generowania |
| `generated_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (generated_count >= 0) | Liczba wygenerowanych propozycji |
| `accepted_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (accepted_count >= 0) | Liczba zaakceptowanych fiszek |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data sesji generowania |

### 1.3 Typ ENUM `flashcard_source`

```sql
CREATE TYPE flashcard_source AS ENUM ('ai_generated', 'manual');
```

Określa pochodzenie fiszki:
- `ai_generated` - fiszka wygenerowana przez AI i zaakceptowana przez użytkownika
- `manual` - fiszka utworzona ręcznie przez użytkownika

---

## 2. Relacje między tabelami

### 2.1 Diagram ERD

```
auth.users (Supabase - wbudowana)
├── id (UUID, PK)
├── email
├── encrypted_password
└── ...inne pola Supabase Auth
    │
    ├──────────────────────────────────┐
    │ 1:N                              │ 1:N
    │ ON DELETE CASCADE                │ ON DELETE CASCADE
    ▼                                  ▼
flashcards                      generation_sessions
├── id (UUID, PK)               ├── id (UUID, PK)
├── user_id (FK) ◄──────────────├── user_id (FK)
├── front                       ├── source_text
├── back                        ├── generated_count
├── source                      ├── accepted_count
├── ease_factor                 └── created_at
├── interval
├── repetition_count
├── next_review_date
├── last_reviewed_at
├── created_at
└── updated_at
```

### 2.2 Opis relacji

| Relacja | Typ | Opis |
|---------|-----|------|
| auth.users → flashcards | 1:N | Jeden użytkownik może mieć wiele fiszek. Usunięcie użytkownika kaskadowo usuwa wszystkie jego fiszki. |
| auth.users → generation_sessions | 1:N | Jeden użytkownik może mieć wiele sesji generowania. Usunięcie użytkownika kaskadowo usuwa wszystkie jego sesje. |

---

## 3. Indeksy

### 3.1 Tabela `flashcards`

```sql
-- Indeks dla wyszukiwania fiszek użytkownika
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);

-- Indeks złożony dla pobierania fiszek do sesji nauki (spaced repetition)
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
```

### 3.2 Tabela `generation_sessions`

```sql
-- Indeks złożony dla pobierania historii sesji użytkownika posortowanej chronologicznie
CREATE INDEX idx_generation_sessions_user_created ON generation_sessions(user_id, created_at DESC);
```

---

## 4. Zasady PostgreSQL (Row Level Security)

### 4.1 Włączenie RLS

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;
```

### 4.2 Polityki dla tabeli `flashcards`

```sql
-- Użytkownik może wyświetlać tylko swoje fiszki
CREATE POLICY flashcards_select_own ON flashcards
    FOR SELECT
    USING (user_id = auth.uid());

-- Użytkownik może dodawać fiszki tylko dla siebie
CREATE POLICY flashcards_insert_own ON flashcards
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Użytkownik może aktualizować tylko swoje fiszki
CREATE POLICY flashcards_update_own ON flashcards
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Użytkownik może usuwać tylko swoje fiszki
CREATE POLICY flashcards_delete_own ON flashcards
    FOR DELETE
    USING (user_id = auth.uid());
```

### 4.3 Polityki dla tabeli `generation_sessions`

```sql
-- Użytkownik może wyświetlać tylko swoje sesje generowania
CREATE POLICY generation_sessions_select_own ON generation_sessions
    FOR SELECT
    USING (user_id = auth.uid());

-- Użytkownik może tworzyć sesje tylko dla siebie
CREATE POLICY generation_sessions_insert_own ON generation_sessions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
```

> **Uwaga:** Brak polityk UPDATE i DELETE dla `generation_sessions` - sesje są tylko do odczytu po utworzeniu (dane historyczne/statystyczne).

---

## 5. Triggery i funkcje

### 5.1 Automatyczna aktualizacja `updated_at`

Wykorzystanie wbudowanego rozszerzenia `moddatetime` Supabase:

```sql
-- Upewnienie się, że rozszerzenie jest włączone
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Trigger automatycznie aktualizujący kolumnę updated_at
CREATE TRIGGER set_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
```

---

## 6. Pełny skrypt SQL migracji

```sql
-- =====================================================
-- MIGRACJA: Inicjalny schemat bazy danych 10x-cards
-- =====================================================

-- 1. Typ ENUM dla źródła fiszki
CREATE TYPE flashcard_source AS ENUM ('ai_generated', 'manual');

-- 2. Tabela flashcards
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    front VARCHAR(500) NOT NULL,
    back VARCHAR(1000) NOT NULL,
    source flashcard_source NOT NULL DEFAULT 'manual',
    ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30),
    interval INTEGER NOT NULL DEFAULT 0 CHECK (interval >= 0),
    repetition_count INTEGER NOT NULL DEFAULT 0 CHECK (repetition_count >= 0),
    next_review_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela generation_sessions
CREATE TABLE generation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL CHECK (char_length(source_text) BETWEEN 1000 AND 10000),
    generated_count INTEGER NOT NULL DEFAULT 0 CHECK (generated_count >= 0),
    accepted_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indeksy
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_generation_sessions_user_created ON generation_sessions(user_id, created_at DESC);

-- 5. Row Level Security
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Polityki RLS dla flashcards
CREATE POLICY flashcards_select_own ON flashcards
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY flashcards_insert_own ON flashcards
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_update_own ON flashcards
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_delete_own ON flashcards
    FOR DELETE USING (user_id = auth.uid());

-- 7. Polityki RLS dla generation_sessions
CREATE POLICY generation_sessions_select_own ON generation_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY generation_sessions_insert_own ON generation_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. Trigger dla updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TRIGGER set_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
```

---

## 7. Dodatkowe uwagi i decyzje projektowe

### 7.1 Wykorzystanie Supabase Auth

- **Brak własnej tabeli użytkowników** - wykorzystujemy wbudowaną tabelę `auth.users` Supabase
- Wszystkie tabele z danymi użytkownika mają FK do `auth.users.id`
- Funkcja `auth.uid()` w RLS zwraca ID zalogowanego użytkownika

### 7.2 Zgodność z RODO

- **ON DELETE CASCADE** - usunięcie konta w Supabase Auth automatycznie usuwa wszystkie powiązane dane (fiszki, sesje generowania)
- **Twarde usuwanie (hard delete)** - brak soft delete dla uproszczenia i pełnej zgodności z prawem do usunięcia danych

### 7.3 Algorytm Spaced Repetition (SM-2)

Dane algorytmu SM-2 przechowywane bezpośrednio w tabeli `flashcards`:
- `ease_factor` - współczynnik łatwości (domyślnie 2.50, minimum 1.30)
- `interval` - interwał w dniach do następnej powtórki
- `repetition_count` - liczba udanych powtórzeń
- `next_review_date` - data następnej planowanej powtórki
- `last_reviewed_at` - data ostatniej powtórki

### 7.4 Propozycje AI

Propozycje fiszek generowane przez AI **nie są przechowywane w bazie danych** - pozostają w stanie React do momentu akceptacji lub odrzucenia przez użytkownika. Tylko zaakceptowane fiszki trafiają do tabeli `flashcards` z `source = 'ai_generated'`.

### 7.5 Limity znaków

- **front**: 500 znaków (pytanie)
- **back**: 1000 znaków (odpowiedź)
- **source_text**: 1000-10000 znaków (walidacja w bazie danych poprzez CHECK)

### 7.6 Metryki sukcesu

Schemat wspiera zbieranie metryk określonych w PRD:

```sql
-- Wskaźnik akceptacji fiszek AI (cel: 75%)
SELECT 
    ROUND(SUM(accepted_count)::numeric / NULLIF(SUM(generated_count), 0) * 100, 2) AS acceptance_rate
FROM generation_sessions;

-- Procent fiszek tworzonych przez AI (cel: 75%)
SELECT 
    ROUND(COUNT(*) FILTER (WHERE source = 'ai_generated')::numeric / COUNT(*) * 100, 2) AS ai_generated_percentage
FROM flashcards;
```

### 7.7 Normalizacja

Schemat jest znormalizowany do 3NF:
- Brak redundancji danych
- Każda tabela ma jednoznaczny klucz główny
- Wszystkie atrybuty zależą bezpośrednio od klucza głównego

### 7.8 Skalowalność

- Indeksy zoptymalizowane pod najczęstsze zapytania (pobieranie fiszek użytkownika, sesja nauki)
- UUID jako klucze główne umożliwiają przyszłą dystrybucję danych
- Prosta struktura bez zbędnych relacji ułatwia ewentualny sharding

