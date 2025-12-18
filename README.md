# 10x-cards

Platforma do tworzenia i zarządzania fiszkami edukacyjnymi z wykorzystaniem sztucznej inteligencji.

## Opis projektu

10x-cards to aplikacja webowa umożliwiająca:
- Automatyczne generowanie fiszek z tekstu źródłowego przy pomocy AI
- Ręczne tworzenie i zarządzanie fiszkami
- Naukę z wykorzystaniem algorytmu powtórek SM-2
- Śledzenie postępów i statystyk nauki

## Stos technologiczny

### Frontend
- **Astro 5** - framework do budowy szybkich stron z minimalną ilością JavaScript
- **React 19** - interaktywne komponenty
- **TypeScript 5** - statyczne typowanie
- **Tailwind 4** - stylowanie
- **Shadcn/ui** - biblioteka komponentów UI

### Backend
- **Supabase** - Backend-as-a-Service z bazą PostgreSQL i wbudowaną autentykacją

### AI
- **OpenRouter.ai** - dostęp do modeli AI (OpenAI, Anthropic, Google i inne)

### Testowanie
- **Vitest** - testy jednostkowe
- **React Testing Library** - testy komponentów React
- **MSW (Mock Service Worker)** - mockowanie API
- **Playwright** - testy End-to-End
- **c8/istanbul** - raportowanie pokrycia kodu

## Instalacja

```bash
# Instalacja zależności
npm install

# Uruchomienie w trybie deweloperskim
npm run dev

# Budowanie produkcyjne
npm run build
```

## Testowanie

```bash
# Testy jednostkowe
npm run test

# Testy jednostkowe w trybie watch
npm run test:watch

# Testy z pokryciem kodu
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

### Struktura testów

```
tests/
├── unit/                    # Testy jednostkowe
│   ├── services/            # Testy serwisów
│   ├── schemas/             # Testy schematów walidacji Zod
│   ├── algorithms/          # Testy algorytmów (SM-2)
│   └── components/          # Testy komponentów React
├── e2e/                     # Testy End-to-End
├── fixtures/                # Dane testowe
└── mocks/                   # Mocki (Supabase, OpenRouter)
```

## Zmienne środowiskowe

```bash
SUPABASE_URL=<url-projektu-supabase>
SUPABASE_KEY=<klucz-anon-supabase>
OPENROUTER_API_KEY=<klucz-api-openrouter>
```

## Dokumentacja

Szczegółowa dokumentacja projektu znajduje się w katalogu `.ai/`:
- `prd.md` - wymagania produktowe
- `api-plan.md` - specyfikacja API
- `db-plan.md` - schemat bazy danych
- `tech-stack.md` - stos technologiczny
- `test-plan.md` - plan testów

## CI/CD

Projekt wykorzystuje GitHub Actions do automatyzacji CI/CD oraz DigitalOcean do hostowania aplikacji.

## Licencja

Projekt prywatny.
