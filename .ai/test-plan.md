# Plan Testów - 10x-cards

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu
Niniejszy dokument definiuje strategię testowania aplikacji 10x-cards - platformy do tworzenia i zarządzania fiszkami edukacyjnymi z wykorzystaniem sztucznej inteligencji. Plan skupia się na testach jednostkowych oraz testach End-to-End (E2E).

### 1.2 Cele testowania
1. **Weryfikacja funkcjonalna** - potwierdzenie, że wszystkie funkcjonalności działają zgodnie z wymaganiami PRD
2. **Zapewnienie jakości** - identyfikacja i eliminacja defektów przed wdrożeniem produkcyjnym
3. **Walidacja logiki biznesowej** - weryfikacja poprawności algorytmów (SM-2) i integracji z AI

### 1.3 Dokumenty referencyjne
- PRD (Product Requirements Document) - `.ai/prd.md`
- Specyfikacja API - `.ai/api-plan.md`
- Schemat bazy danych - `.ai/db-plan.md`
- Definicja stosu technologicznego - `.ai/tech-stack.md`

---

## 2. Zakres testów

### 2.1 Funkcjonalności objęte testami

| Moduł | Opis | Priorytet |
|-------|------|-----------|
| Autentykacja | Rejestracja, logowanie, wylogowanie, zarządzanie sesją | Krytyczny |
| Generowanie AI | Komunikacja z OpenRouter, parsowanie odpowiedzi, tworzenie propozycji | Krytyczny |
| Zarządzanie fiszkami | CRUD fiszek, walidacja danych, paginacja | Krytyczny |
| Sesja nauki | Algorytm SM-2, selekcja fiszek do powtórki, zapisywanie wyników | Wysoki |
| Statystyki | Sesje generowania, wskaźniki akceptacji | Średni |
| Profil użytkownika | Wyświetlanie danych, usuwanie konta | Średni |
| Landing page | Strona główna, nawigacja | Niski |

### 2.2 Elementy wyłączone z zakresu MVP
- Aplikacje mobilne
- Import dokumentów (PDF, DOCX)
- Publiczne API
- Współdzielenie fiszek między użytkownikami
- Zaawansowane wyszukiwanie

### 2.3 Środowiska testowe

| Środowisko | Przeznaczenie | Baza danych |
|------------|---------------|-------------|
| Lokalne (dev) | Testy jednostkowe | Supabase lokalny (Docker) / Mock |
| Staging | Testy E2E | Supabase staging |

---

## 3. Typy testów

### 3.1 Testy jednostkowe (Unit Tests)

**Cel:** Weryfikacja poprawności izolowanych jednostek kodu (funkcje, klasy, komponenty).

**Zakres:**
1. **Serwisy backendowe:**
   - `FlashcardsService` - operacje CRUD
   - `StudySessionService` - algorytm SM-2
   - `GenerationsService` - logika generowania
   - `OpenRouterService` - parsowanie odpowiedzi AI
   - `GenerationSessionsService` - obsługa statystyk

2. **Schematy walidacji (Zod):**
   - `flashcards.schema.ts`
   - `generations.schema.ts`
   - `study-session.schema.ts`
   - `auth.schemas.ts`
   - `generation-sessions.schema.ts`

3. **Komponenty React:**
   - Komponenty formularzy (auth, flashcards, generate)
   - Komponenty wyświetlania danych (listy, karty)
   - Hooki niestandardowe (`src/lib/hooks`)

4. **Algorytm SM-2:**
   - Obliczenia ease_factor
   - Obliczenia interval
   - Obsługa wszystkich ocen (0-5)
   - Warunki brzegowe (minimum ease_factor 1.30)

**Pokrycie kodu:** Minimum 80%

### 3.2 Testy End-to-End (E2E Tests)

**Cel:** Weryfikacja kompletnych ścieżek użytkownika w przeglądarce.

**Scenariusze główne:**
1. Rejestracja nowego użytkownika
2. Logowanie i wylogowanie
3. Generowanie fiszek z tekstu źródłowego
4. Przegląd i akceptacja/odrzucenie propozycji AI
5. Ręczne tworzenie fiszki
6. Edycja istniejącej fiszki
7. Usuwanie fiszki
8. Przeprowadzenie sesji nauki
9. Przeglądanie statystyk generowania
10. Usunięcie konta

**Przeglądarki docelowe:**
- Chrome (najnowsza wersja)
- Firefox (najnowsza wersja)
- Safari (najnowsza wersja)
- Edge (najnowsza wersja)

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Moduł autentykacji

#### TC-AUTH-001: Rejestracja nowego użytkownika
**Typ:** E2E  
**Warunki wstępne:** Użytkownik nie posiada konta  
**Kroki:**
1. Otwórz stronę `/auth`
2. Przejdź do formularza rejestracji
3. Wprowadź prawidłowy adres e-mail
4. Wprowadź hasło spełniające wymagania
5. Kliknij przycisk "Zarejestruj"

**Oczekiwany rezultat:**
- Konto zostaje utworzone
- Użytkownik zostaje automatycznie zalogowany
- Następuje przekierowanie do `/generate`

#### TC-AUTH-002: Logowanie z prawidłowymi danymi
**Typ:** E2E  
**Warunki wstępne:** Użytkownik posiada aktywne konto  
**Kroki:**
1. Otwórz stronę `/auth`
2. Wprowadź prawidłowy e-mail i hasło
3. Kliknij przycisk "Zaloguj"

**Oczekiwany rezultat:**
- Użytkownik zostaje zalogowany
- Sesja jest zapisana w cookies
- Przekierowanie do `/generate`

#### TC-AUTH-003: Logowanie z nieprawidłowymi danymi
**Typ:** E2E  
**Warunki wstępne:** Użytkownik podaje błędne dane logowania  
**Kroki:**
1. Otwórz stronę `/auth`
2. Wprowadź nieprawidłowy e-mail lub hasło
3. Kliknij przycisk "Zaloguj"

**Oczekiwany rezultat:**
- Wyświetlany jest komunikat o błędzie
- Użytkownik pozostaje niezalogowany
- Brak przekierowania

#### TC-AUTH-004: Dostęp do chronionych stron bez logowania
**Typ:** E2E  
**Warunki wstępne:** Użytkownik nie jest zalogowany  
**Kroki:**
1. Spróbuj otworzyć `/flashcards`, `/generate`, `/study`, `/profile`

**Oczekiwany rezultat:**
- Przekierowanie do strony logowania
- Endpoint API zwraca 401 Unauthorized

### 4.2 Moduł generowania fiszek AI

#### TC-GEN-001: Generowanie fiszek z prawidłowym tekstem
**Typ:** E2E  
**Warunki wstępne:** Użytkownik jest zalogowany  
**Kroki:**
1. Przejdź do strony `/generate`
2. Wklej tekst źródłowy (1000-10000 znaków)
3. Kliknij przycisk "Generuj fiszki"
4. Poczekaj na odpowiedź AI

**Oczekiwany rezultat:**
- Wyświetlany jest loader podczas generowania
- Pojawia się lista 5-15 propozycji fiszek
- Każda propozycja ma pola "front" i "back"
- Sesja generowania jest zapisana w bazie

#### TC-GEN-002: Walidacja długości tekstu źródłowego
**Typ:** E2E + Unit  
**Warunki wstępne:** Użytkownik jest zalogowany  
**Kroki:**
1. Przejdź do strony `/generate`
2. Wprowadź tekst krótszy niż 1000 znaków
3. Spróbuj kliknąć "Generuj"

**Oczekiwany rezultat:**
- Przycisk jest nieaktywny lub wyświetla się błąd walidacji
- Żądanie nie jest wysyłane do API

#### TC-GEN-003: Akceptacja i zapis propozycji fiszek
**Typ:** E2E  
**Warunki wstępne:** Wygenerowano propozycje fiszek  
**Kroki:**
1. Zaznacz wybrane propozycje do akceptacji
2. Opcjonalnie edytuj treść fiszki
3. Kliknij przycisk "Zapisz zaakceptowane"

**Oczekiwany rezultat:**
- Zaakceptowane fiszki są zapisane w bazie z `source = 'ai_generated'`
- Licznik `accepted_count` w sesji generowania jest zaktualizowany
- Użytkownik widzi potwierdzenie

#### TC-GEN-004: Parsowanie odpowiedzi AI
**Typ:** Unit  
**Warunki wstępne:** Mock odpowiedzi z OpenRouter  
**Kroki:**
1. Wywołaj `OpenRouterService.parseFlashcards()` z różnymi formatami odpowiedzi

**Oczekiwany rezultat:**
- Poprawnie parsuje tablicę JSON z propozycjami
- Ignoruje nieprawidłowe elementy
- Rzuca `OpenRouterError` przy braku prawidłowych fiszek

#### TC-GEN-005: Obsługa błędów API AI
**Typ:** Unit  
**Warunki wstępne:** Mock błędu z OpenRouter  
**Kroki:**
1. Symuluj błąd 503 z OpenRouter
2. Wywołaj `OpenRouterService.makeRequest()`

**Oczekiwany rezultat:**
- Wykonuje retry przy błędach 5xx
- Rzuca `OpenRouterError` z kodem `SERVICE_UNAVAILABLE`

### 4.3 Moduł zarządzania fiszkami

#### TC-FLASH-001: Wyświetlanie listy fiszek z paginacją
**Typ:** E2E  
**Warunki wstępne:** Użytkownik posiada > 20 fiszek  
**Kroki:**
1. Przejdź do strony `/flashcards`
2. Sprawdź pierwszą stronę wyników
3. Przejdź do kolejnej strony

**Oczekiwany rezultat:**
- Wyświetlane jest 20 fiszek na stronę
- Paginacja działa poprawnie
- Fiszki są posortowane wg `created_at` malejąco

#### TC-FLASH-002: Ręczne tworzenie fiszki
**Typ:** E2E  
**Warunki wstępne:** Użytkownik jest zalogowany  
**Kroki:**
1. Przejdź do strony `/flashcards`
2. Kliknij przycisk "Dodaj fiszkę"
3. Wypełnij pola "Przód" (max 500 znaków) i "Tył" (max 1000 znaków)
4. Zapisz fiszkę

**Oczekiwany rezultat:**
- Fiszka jest zapisana z `source = 'manual'`
- Fiszka pojawia się na liście
- Domyślne wartości SM-2 są ustawione

#### TC-FLASH-003: Edycja fiszki
**Typ:** E2E  
**Warunki wstępne:** Użytkownik posiada co najmniej jedną fiszkę  
**Kroki:**
1. Przejdź do strony `/flashcards`
2. Kliknij opcję edycji przy wybranej fiszce
3. Zmień treść pól front/back
4. Zapisz zmiany

**Oczekiwany rezultat:**
- Fiszka jest zaktualizowana
- `updated_at` jest zaktualizowane
- Wartości SM-2 pozostają niezmienione

#### TC-FLASH-004: Usuwanie fiszki
**Typ:** E2E  
**Warunki wstępne:** Użytkownik posiada co najmniej jedną fiszkę  
**Kroki:**
1. Przejdź do strony `/flashcards`
2. Kliknij opcję usunięcia przy wybranej fiszce
3. Potwierdź usunięcie w dialogu

**Oczekiwany rezultat:**
- Fiszka jest trwale usunięta (hard delete)
- Fiszka znika z listy

#### TC-FLASH-005: Walidacja limitów znaków
**Typ:** Unit  
**Warunki wstępne:** Testy schematu Zod  
**Kroki:**
1. Przetestuj schemat z front > 500 znaków
2. Przetestuj schemat z back > 1000 znaków

**Oczekiwany rezultat:**
- Walidacja zwraca błąd dla przekroczonych limitów
- Komunikaty błędów są odpowiednie

#### TC-FLASH-006: FlashcardsService - CRUD
**Typ:** Unit  
**Warunki wstępne:** Mock Supabase client  
**Kroki:**
1. Testuj `getFlashcards()` z różnymi parametrami paginacji
2. Testuj `createFlashcards()` z prawidłowymi danymi
3. Testuj `updateFlashcard()` z częściowymi danymi
4. Testuj `deleteFlashcard()` z istniejącym/nieistniejącym ID

**Oczekiwany rezultat:**
- Wszystkie operacje CRUD działają poprawnie
- Zwracane są odpowiednie wartości null/dane
- Błędy bazy danych są obsługiwane

### 4.4 Moduł sesji nauki

#### TC-STUDY-001: Rozpoczęcie sesji nauki
**Typ:** E2E  
**Warunki wstępne:** Użytkownik ma fiszki z `next_review_date <= now()`  
**Kroki:**
1. Przejdź do strony `/study`
2. Rozpocznij sesję nauki

**Oczekiwany rezultat:**
- Wyświetlana jest pierwsza fiszka (tylko przód)
- Widoczna jest liczba fiszek do powtórki
- Fiszki są posortowane wg `next_review_date` rosnąco

#### TC-STUDY-002: Odsłonięcie odpowiedzi i ocena
**Typ:** E2E  
**Warunki wstępne:** Sesja nauki jest rozpoczęta  
**Kroki:**
1. Kliknij "Pokaż odpowiedź"
2. Oceń fiszkę (0-5 wg skali SM-2)

**Oczekiwany rezultat:**
- Wyświetlany jest tył fiszki
- Po ocenie parametry SM-2 są zaktualizowane
- Wyświetlana jest kolejna fiszka lub komunikat o zakończeniu

#### TC-STUDY-003: Algorytm SM-2 - ocena poprawna (rating >= 3)
**Typ:** Unit  
**Warunki wstępne:** Mock parametrów SM-2  
**Kroki:**
1. Wywołaj `calculateSM2()` z rating = 5 dla nowej fiszki
2. Wywołaj `calculateSM2()` z rating = 4 dla fiszki po 1 powtórce
3. Wywołaj `calculateSM2()` z rating = 3 dla fiszki po 2+ powtórkach

**Oczekiwany rezultat:**
- Rating 5, pierwsza powtórka: `interval = 1`, `repetition_count = 1`
- Rating 4, druga powtórka: `interval = 6`, `repetition_count = 2`
- Rating 3, kolejne: `interval = poprzedni * ease_factor`
- `ease_factor` zwiększa się zgodnie ze wzorem SM-2

#### TC-STUDY-004: Algorytm SM-2 - ocena niepoprawna (rating < 3)
**Typ:** Unit  
**Warunki wstępne:** Mock parametrów SM-2 po kilku powtórkach  
**Kroki:**
1. Wywołaj `calculateSM2()` z rating = 0, 1, 2

**Oczekiwany rezultat:**
- `repetition_count` = 0 (reset)
- `interval` = 1
- `ease_factor` zmniejsza się (minimum 1.30)

#### TC-STUDY-005: Algorytm SM-2 - warunek brzegowy ease_factor
**Typ:** Unit  
**Warunki wstępne:** Fiszka z niskim ease_factor (np. 1.35)  
**Kroki:**
1. Wywołaj `calculateSM2()` z rating = 0 wielokrotnie

**Oczekiwany rezultat:**
- `ease_factor` nigdy nie spada poniżej 1.30

#### TC-STUDY-006: Brak fiszek do powtórki
**Typ:** E2E  
**Warunki wstępne:** Wszystkie fiszki mają `next_review_date > now()`  
**Kroki:**
1. Przejdź do strony `/study`

**Oczekiwany rezultat:**
- Wyświetlany jest komunikat "Brak fiszek do powtórki"
- `total_due = 0` w odpowiedzi API

### 4.5 Moduł statystyk

#### TC-STATS-001: Wyświetlanie historii generowania
**Typ:** E2E  
**Warunki wstępne:** Użytkownik wykonał kilka sesji generowania  
**Kroki:**
1. Przejdź do widoku statystyk

**Oczekiwany rezultat:**
- Lista sesji generowania z datami
- Dla każdej sesji: `generated_count` i `accepted_count`
- Podsumowanie: łączna liczba i wskaźnik akceptacji

#### TC-STATS-002: Obliczanie wskaźnika akceptacji
**Typ:** Unit  
**Warunki wstępne:** Mock danych sesji generowania  
**Kroki:**
1. Testuj obliczenie `acceptance_rate` dla różnych danych

**Oczekiwany rezultat:**
- `acceptance_rate = (total_accepted / total_generated) * 100`
- Wartość zaokrąglona do 2 miejsc po przecinku
- Obsługa przypadku dzielenia przez 0

### 4.6 Moduł profilu i konta

#### TC-PROFILE-001: Wyświetlanie danych profilu
**Typ:** E2E  
**Warunki wstępne:** Użytkownik jest zalogowany  
**Kroki:**
1. Przejdź do strony `/profile`

**Oczekiwany rezultat:**
- Wyświetlany jest e-mail użytkownika
- Widoczna jest opcja usunięcia konta

#### TC-PROFILE-002: Usunięcie konta (RODO)
**Typ:** E2E  
**Warunki wstępne:** Użytkownik jest zalogowany i ma fiszki/sesje  
**Kroki:**
1. Przejdź do `/profile`
2. Kliknij "Usuń konto"
3. Potwierdź operację

**Oczekiwany rezultat:**
- Konto jest usunięte z Supabase Auth
- Wszystkie fiszki użytkownika są usunięte (CASCADE)
- Wszystkie sesje generowania są usunięte (CASCADE)
- Użytkownik jest wylogowany i przekierowany

### 4.7 Testy jednostkowe schematów walidacji (Zod)

#### TC-SCHEMA-001: Walidacja CreateFlashcardInput
**Typ:** Unit  
**Kroki:**
1. Testuj prawidłowe dane
2. Testuj puste pola front/back
3. Testuj przekroczenie limitu znaków
4. Testuj nieprawidłowy source

**Oczekiwany rezultat:**
- Prawidłowe dane przechodzą walidację
- Błędne dane zwracają odpowiednie komunikaty

#### TC-SCHEMA-002: Walidacja GenerateFlashcardsInput
**Typ:** Unit  
**Kroki:**
1. Testuj tekst < 1000 znaków
2. Testuj tekst > 10000 znaków
3. Testuj prawidłowy tekst

**Oczekiwany rezultat:**
- Tekst 1000-10000 znaków przechodzi walidację
- Poza zakresem zwraca błąd

#### TC-SCHEMA-003: Walidacja ReviewFlashcardInput
**Typ:** Unit  
**Kroki:**
1. Testuj rating 0-5 (prawidłowe)
2. Testuj rating < 0 lub > 5
3. Testuj nieprawidłowy UUID

**Oczekiwany rezultat:**
- Rating 0-5 przechodzi walidację
- Nieprawidłowe wartości zwracają błąd

---

## 5. Środowisko testowe

### 5.1 Wymagania sprzętowe

| Komponent | Specyfikacja minimalna |
|-----------|----------------------|
| CPU | 4 rdzenie |
| RAM | 8 GB |
| Dysk | 20 GB SSD |
| Sieć | 10 Mbps |

### 5.2 Wymagania programowe

| Oprogramowanie | Wersja |
|----------------|--------|
| Node.js | 20.x LTS |
| npm | 10.x |
| Docker | 24.x (dla lokalnego Supabase) |
| Supabase CLI | Najnowsza |
| Git | 2.x |

### 5.3 Konfiguracja środowisk

#### Lokalne (testy jednostkowe)
```bash
# Mockowanie Supabase dla testów jednostkowych
# Brak potrzeby uruchamiania prawdziwej bazy

# Zmienne środowiskowe (opcjonalne dla testów z mockami)
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=test-key
OPENROUTER_API_KEY=test-key
```

#### Staging (testy E2E)
```bash
# Uruchomienie Supabase lokalnie (opcjonalnie)
supabase start

SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_KEY=<staging-anon-key>
OPENROUTER_API_KEY=<staging-key>
```

### 5.4 Dane testowe

**Użytkownicy testowi:**
- `test-user-1@example.com` - użytkownik z wieloma fiszkami
- `test-user-2@example.com` - nowy użytkownik (brak danych)
- `test-user-3@example.com` - użytkownik do testów usuwania

**Fiszki testowe:**
- 100 fiszek z różnymi wartościami SM-2
- Fiszki z `source = 'ai_generated'` i `source = 'manual'`
- Fiszki z różnymi `next_review_date`

**Sesje generowania:**
- 10 sesji z różnymi wskaźnikami akceptacji

---

## 6. Narzędzia do testowania

### 6.1 Testy jednostkowe

| Narzędzie | Przeznaczenie | Uzasadnienie |
|-----------|---------------|--------------|
| **Vitest** | Testy jednostkowe | Natywna integracja z Vite/Astro, szybkie wykonanie |
| **React Testing Library** | Testy komponentów React | Testy zorientowane na użytkownika |
| **MSW (Mock Service Worker)** | Mockowanie API | Realistyczne testy bez backendu |

### 6.2 Testy E2E

| Narzędzie | Przeznaczenie | Uzasadnienie |
|-----------|---------------|--------------|
| **Playwright** | Testy E2E | Wieloprzeglądarkowe testy, natywne wsparcie dla Astro |
| **Playwright Test** | Runner testów | Równoległe wykonanie, raportowanie |

### 6.3 Pokrycie kodu

| Narzędzie | Przeznaczenie |
|-----------|---------------|
| **c8 / istanbul** | Raportowanie pokrycia kodu |
| **Codecov** | Śledzenie pokrycia w CI |

---

## 7. Harmonogram testów

### 7.1 Faza 1: Przygotowanie (Tydzień 1)

| Dzień | Zadanie |
|-------|---------|
| 1-2 | Konfiguracja środowiska testowego |
| 2-3 | Instalacja i konfiguracja Vitest + Playwright |
| 3-4 | Przygotowanie danych testowych i fixtures |
| 4-5 | Implementacja mocków (Supabase, OpenRouter) |

### 7.2 Faza 2: Testy jednostkowe (Tydzień 2-3)

| Dzień | Moduł |
|-------|-------|
| 1-2 | Serwisy backendowe (FlashcardsService, StudySessionService) |
| 3-4 | Serwisy AI (GenerationsService, OpenRouterService) |
| 5-6 | Schematy walidacji Zod |
| 7-8 | Algorytm SM-2 - wszystkie przypadki brzegowe |
| 9-10 | Komponenty React (formularze, listy) |

### 7.3 Faza 3: Testy E2E (Tydzień 4-5)

| Dzień | Scenariusze |
|-------|-------------|
| 1-2 | Autentykacja (rejestracja, logowanie, wylogowanie) |
| 3-4 | Generowanie fiszek AI |
| 5-6 | Zarządzanie fiszkami (CRUD) |
| 7-8 | Sesja nauki |
| 9-10 | Statystyki i profil użytkownika |

### 7.4 Faza 4: Raportowanie i poprawki (Tydzień 6)

| Dzień | Zadanie |
|-------|---------|
| 1-2 | Analiza wyników i raportowanie |
| 2-4 | Retesty po naprawie defektów |
| 4-5 | Finalizacja dokumentacji |

---

## 8. Kryteria akceptacji testów

### 8.1 Kryteria wejścia (Entry Criteria)

- [ ] Kod źródłowy jest dostępny w repozytorium
- [ ] Środowisko testowe jest skonfigurowane
- [ ] Dane testowe są przygotowane
- [ ] Dokumentacja wymagań jest dostępna
- [ ] Narzędzia testowe są zainstalowane (Vitest, Playwright)

### 8.2 Kryteria wyjścia (Exit Criteria)

| Kryterium | Wartość docelowa |
|-----------|------------------|
| Pokrycie kodu (testy jednostkowe) | ≥ 80% |
| Wykonane przypadki testowe | 100% |
| Błędy krytyczne (Critical/Blocker) | 0 |
| Błędy wysokie (High) | ≤ 2 (z planem naprawy) |
| Błędy średnie (Medium) | ≤ 10 |
| Testy E2E passing | ≥ 95% |

### 8.3 Kryteria zawieszenia/wznowienia

**Zawieszenie testów:**
- Środowisko testowe niedostępne > 4 godziny
- Odkryto defekt blokujący > 50% funkcjonalności
- Brak dostępu do zewnętrznych usług (OpenRouter) - dla testów E2E

**Wznowienie testów:**
- Środowisko przywrócone i zweryfikowane
- Defekt blokujący naprawiony i potwierdzony
- Usługi zewnętrzne dostępne

---

## 9. Role i odpowiedzialności

### 9.1 Zespół testowy

| Rola | Odpowiedzialności |
|------|-------------------|
| **QA Lead** | Planowanie testów, koordynacja, raportowanie, decyzje o release |
| **QA Engineer** | Projektowanie przypadków testowych E2E, wykonanie testów |
| **Developer** | Testy jednostkowe, naprawa defektów, code review testów |
| **DevOps** | Konfiguracja CI/CD, infrastruktura testowa |

### 9.2 Macierz RACI

| Aktywność | QA Lead | QA Engineer | Developer | DevOps |
|-----------|---------|-------------|-----------|--------|
| Plan testów | A | R | C | I |
| Testy jednostkowe | I | C | R/A | I |
| Testy E2E | A | R | C | C |
| Konfiguracja CI/CD | C | I | I | R/A |
| Raportowanie błędów | A | R | I | I |
| Naprawa błędów | I | I | R/A | C |
| Akceptacja release | R/A | C | C | I |

**Legenda:** R - Responsible, A - Accountable, C - Consulted, I - Informed

---

## 10. Procedury raportowania błędów

### 10.1 Klasyfikacja błędów

| Priorytet | Opis | SLA naprawy |
|-----------|------|-------------|
| **Critical** | Aplikacja nie działa, utrata danych | 4 godziny |
| **High** | Główna funkcjonalność nie działa, brak workaround | 24 godziny |
| **Medium** | Funkcjonalność działa nieprawidłowo, istnieje workaround | 72 godziny |
| **Low** | Drobne problemy UI, literówki | Następny sprint |

### 10.2 Szablon zgłoszenia błędu

```markdown
## Tytuł
[Krótki, opisowy tytuł]

## Priorytet
[Critical / High / Medium / Low]

## Typ testu
[Unit / E2E]

## Środowisko
- Przeglądarka: [np. Chrome 120] (dla E2E)
- System: [np. Ubuntu 22.04]
- Środowisko: [Local / Staging]

## Kroki do reprodukcji
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

## Oczekiwany rezultat
[Opis oczekiwanego zachowania]

## Aktualny rezultat
[Opis aktualnego błędnego zachowania]

## Załączniki
- [Screenshot / Video]
- [Logi konsoli]
- [Stack trace]

## Dodatkowe informacje
[Wszelkie inne istotne informacje]
```

### 10.3 Workflow obsługi błędów

```
New → Assigned → In Progress → Code Review → Testing → Verified → Closed
                      ↓                           ↓
                   Reopened ← ← ← ← ← ← ← ← ← Failed
```

### 10.4 Narzędzie do śledzenia błędów

**Rekomendacja:** GitHub Issues z następującymi labelami:
- `bug`, `critical`, `high`, `medium`, `low`
- `unit-test`, `e2e-test`
- `frontend`, `backend`, `api`, `database`, `ai`
- `needs-reproduction`, `confirmed`, `wontfix`

### 10.5 Metryki raportowania

| Metryka | Częstotliwość |
|---------|---------------|
| Liczba nowych błędów | Dziennie |
| Liczba naprawionych błędów | Dziennie |
| Średni czas naprawy | Tygodniowo |
| Defect Escape Rate | Po każdym release |
| Test Pass Rate | Po każdym uruchomieniu |

---

## 11. Ryzyko i mitygacja

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Niedostępność OpenRouter API w testach E2E | Średnie | Wysoki | Mock API dla testów, retry logic |
| Niestabilne testy E2E (flaky tests) | Wysokie | Średni | Retry mechanism, stabilne selektory |
| Niewystarczające pokrycie testowe | Średnie | Średni | Automatyczne raportowanie pokrycia w CI |
| Regresja po zmianach | Wysokie | Średni | Testy automatyczne w pipeline CI/CD |

---

## 12. Załączniki

### 12.1 Checklist przed release

- [ ] Wszystkie testy jednostkowe przechodzą
- [ ] Wszystkie testy E2E przechodzą
- [ ] Brak błędów Critical i High
- [ ] Pokrycie kodu ≥ 80%
- [ ] Dokumentacja zaktualizowana

### 12.2 Polecenia uruchomienia testów

```bash
# Testy jednostkowe
npm run test

# Testy jednostkowe w trybie watch
npm run test:watch

# Testy z pokryciem
npm run test:coverage

# Testy E2E
npm run test:e2e

# Testy E2E w trybie headed (widoczna przeglądarka)
npm run test:e2e:headed

# Testy E2E dla konkretnej przeglądarki
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox

# Wszystkie testy (CI)
npm run test:ci
```

### 12.3 Struktura katalogów testów

```
tests/
├── unit/
│   ├── services/
│   │   ├── flashcards.service.test.ts
│   │   ├── study-session.service.test.ts
│   │   ├── generations.service.test.ts
│   │   └── openrouter.service.test.ts
│   ├── schemas/
│   │   ├── flashcards.schema.test.ts
│   │   ├── generations.schema.test.ts
│   │   ├── study-session.schema.test.ts
│   │   └── auth.schema.test.ts
│   ├── algorithms/
│   │   └── sm2.test.ts
│   └── components/
│       ├── flashcards/
│       ├── generate/
│       └── study/
├── e2e/
│   ├── auth.spec.ts
│   ├── flashcards.spec.ts
│   ├── generate.spec.ts
│   ├── study.spec.ts
│   └── profile.spec.ts
├── fixtures/
│   ├── users.ts
│   ├── flashcards.ts
│   └── generations.ts
└── mocks/
    ├── supabase.mock.ts
    └── openrouter.mock.ts
```

### 12.4 Przykładowa konfiguracja Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### 12.5 Przykładowa konfiguracja Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

**Dokument przygotowany przez:** Zespół QA  
**Data utworzenia:** 2024-01-15  
**Ostatnia aktualizacja:** 2024-01-15  
**Wersja:** 1.1 (skupienie na testach jednostkowych i E2E)
