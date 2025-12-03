# Plan Testów - Spellbook MVP

## 1. Wprowadzenie i Cele Testowania

### 1.1 Cel dokumentu

Niniejszy dokument definiuje kompleksowy plan testów dla aplikacji **Spellbook** - webowej aplikacji do zarządzania snippetami kodu. Plan został dostosowany do specyfiki projektu, uwzględniając wykorzystywane technologie, architekturę oraz wymagania funkcjonalne zdefiniowane w PRD.

### 1.2 Cele testowania

Główne cele procesu testowania:

1. **Weryfikacja funkcjonalności** - Potwierdzenie, że wszystkie wymagania funkcjonalne (FR-001 do FR-014) zostały poprawnie zaimplementowane
2. **Zapewnienie bezpieczeństwa** - Weryfikacja działania Row Level Security, właściwego haszowania haseł i izolacji danych użytkowników
3. **Walidacja UX** - Sprawdzenie responsywności, loading states, error handling i toast notifications
4. **Gwarancja jakości kodu** - Weryfikacja TypeScript type checking, linting i build process
5. **Zapewnienie zgodności z kursem** - Spełnienie wszystkich wymagań kursu 10xDevs (auth, CRUD, testy, CI/CD)

### 1.3 Metryki sukcesu

- ✅ Minimum 1 test E2E przechodzi pomyślnie (główny przepływ użytkownika)
- ✅ Build aplikacji wykonuje się bez błędów
- ✅ TypeScript kompilacja bez błędów
- ✅ Wszystkie testy uruchamiane w CI/CD przechodzą
- ✅ Wszystkie critical user stories działają poprawnie w środowisku lokalnym

## 2. Zakres Testów

### 2.1 Funkcjonalności w zakresie testów (In Scope)

#### Moduł Autentykacji

- Rejestracja nowego użytkownika (email/password)
- Logowanie istniejącego użytkownika
- Wylogowanie użytkownika
- Przekierowanie niezalogowanych użytkowników do strony logowania
- Utrzymywanie sesji (session persistence)
- Walidacja formularzy auth (email format, długość hasła)

#### Moduł Zarządzania Snippetami (CRUD)

- **Create**: Dodawanie nowego snippetu z walidacją pól
- **Read**: Wyświetlanie listy snippetów i szczegółów pojedynczego snippetu
- **Update**: Edycja istniejącego snippetu
- **Delete**: Usuwanie snippetu z modal confirmation

#### Wyszukiwanie i Filtrowanie

- Full-text search w tytule i treści (PostgreSQL `to_tsvector`)
- Filtrowanie po języku programowania
- Łączenie search + filter
- Sortowanie od najnowszych (created_at DESC)

#### Walidacja Danych

- Client-side validation (Zod + React Hook Form)
- Server-side validation (PostgreSQL constraints)
- Real-time validation feedback
- Error messages dla nieprawidłowych danych

#### UX i UI

- Toast notifications (success/error)
- Loading states (skeleton screens, button spinners)
- Empty states (brak snippetów, brak wyników wyszukiwania)
- Responsywny grid layout (1/2/3 kolumny)
- Error handling i graceful degradation

#### Bezpieczeństwo

- Row Level Security (RLS) - izolacja danych użytkowników
- Haszowanie haseł (bcrypt przez Supabase)
- Parametryzowane queries (ochrona przed SQL injection)
- Auto-escaping w React (ochrona przed XSS)

### 2.2 Funkcjonalności poza zakresem testów (Out of Scope)

> [!NOTE]
> Poniższe funkcjonalności nie są częścią MVP i zostaną przetestowane w przyszłych iteracjach (v2+)

- Syntax highlighting kodu
- Dark mode
- AI features (auto-detect language, tłumaczenie kodu)
- Import/eksport snippetów
- Snippet versioning
- Collaboracja i sharing
- Browser extension
- Mobile native apps
- Performance testing (load testing, stress testing)
- Accessibility testing (WCAG 2.1 compliance)
- Cross-browser testing (testujemy tylko Chrome/Chromium w Playwright)

## 3. Typy Testów do Przeprowadzenia

### 3.1 Testy End-to-End (E2E) - Playwright

**Priorytet**: 🔴 **KRYTYCZNY**

**Cel**: Weryfikacja pełnego przepływu użytkownika od logowania do operacji CRUD

**Narzędzie**: Playwright

**Lokalizacja testów**: `tests/e2e/` (do utworzenia)

**Zakres**:

- Pełny flow użytkownika: Login → Create snippet → Edit snippet → Delete snippet → Logout
- Weryfikacja przekierowań (niezalogowany → /login)
- Walidacja formularzy
- Search i filtering
- Toast notifications
- Empty states

**Wymaganie MVP**: ✅ Minimum 1 test E2E pokrywający główny flow

> [!IMPORTANT]
> Ten typ testów jest **wymagany przez kurs** i stanowi podstawowe kryterium akceptacji MVP.

### 3.2 Testy Integracyjne - Supabase SDK

**Priorytet**: 🟡 **WYSOKI**

**Cel**: Weryfikacja poprawnej komunikacji z backend (Supabase)

**Narzędzie**: Vitest (opcjonalnie) lub manual testing

**Zakres**:

- Komunikacja z Supabase Auth API
- Operacje CRUD przez Supabase SDK
- Row Level Security policies
- Full-text search queries
- Error handling dla błędów API

**Przykładowe scenariusze**:

- Utworzenie snippetu przez `SnippetsService.create()`
- Pobranie snippetów przez `SnippetsService.getAll()`
- Weryfikacja RLS: użytkownik A nie może zobaczyć snippetów użytkownika B
- Search przez `SnippetsService.search()`

### 3.3 Testy Walidacji - Zod Schemas

**Priorytet**: 🟡 **WYSOKI**

**Cel**: Weryfikacja poprawności schematów walidacji

**Narzędzie**: Vitest lub manual testing

**Zakres**:

- Walidacja `createSnippetSchema`
- Walidacja `loginSchema` i `registerSchema`
- Edge cases (empty fields, too long values, invalid formats)

**Przykładowe scenariusze**:

- Title pusty → błąd "Title is required"
- Title > 200 znaków → błąd "Title must be 200 characters or less"
- Email nieprawidłowy format → błąd "Please enter a valid email address"
- Password < 6 znaków → błąd "Password must be at least 6 characters"

### 3.4 Testy Komponentów React

**Priorytet**: 🟢 **ŚREDNI** (opcjonalny w MVP)

**Cel**: Weryfikacja izolowanych komponentów UI

**Narzędzie**: Vitest + React Testing Library (do rozważenia w v2)

**Zakres**:

- Rendering komponentów (`SnippetCard`, `SnippetForm`)
- Interakcje użytkownika (kliknięcia, wpisywanie tekstu)
- Conditional rendering (empty states, loading states)

> [!NOTE]
> Testy komponentów są opcjonalne w MVP - główny focus jest na E2E tests

### 3.5 Testy Bezpieczeństwa (Security Testing)

**Priorytet**: 🔴 **KRYTYCZNY**

**Cel**: Weryfikacja bezpieczeństwa aplikacji

**Typ**: Manual testing

**Zakres**:

- **Row Level Security (RLS)**: Próba dostępu do snippetów innego użytkownika
- **SQL Injection**: Próba wstawienia SQL w formularzach (powinno być zablokowane przez Supabase SDK)
- **XSS**: Próba wstawienia `<script>alert('XSS')</script>` w snippet content (powinno być escaped przez React)
- **Session Management**: Weryfikacja, że wylogowany użytkownik nie może uzyskać dostępu do /snippets
- **Password Storage**: Weryfikacja, że hasła są haszowane (sprawdzenie w Supabase dashboard)

### 3.6 Testy Responsywności (Responsive Testing)

**Priorytet**: 🟡 **WYSOKI**

**Cel**: Weryfikacja poprawnego wyświetlania na różnych rozdzielczościach

**Narzędzie**: Playwright (różne viewports) + manual testing

**Zakres**:

- Mobile (< 768px): 1 kolumna w grid
- Tablet (768px - 1024px): 2 kolumny w grid
- Desktop (> 1024px): 3 kolumny w grid
- Touch targets minimum 44x44px
- Formularze poprawnie wyświetlane na mobile

### 3.7 Testy Build i CI/CD

**Priorytet**: 🔴 **KRYTYCZNY**

**Cel**: Weryfikacja procesu build i pipeline

**Narzędzie**: GitHub Actions

**Zakres**:

- `npm run build` bez błędów
- TypeScript type checking (`tsc --noEmit`)
- Linting (`npm run lint`)
- Uruchomienie testów E2E w CI

**Wymaganie MVP**: ✅ Pipeline CI/CD działa poprawnie

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 Scenariusz E2E: Pełny Flow Użytkownika

**ID**: TC-E2E-001  
**Priorytet**: 🔴 KRYTYCZNY  
**Typ**: End-to-End

**Cel**: Weryfikacja pełnego przepływu użytkownika od rejestracji do operacji CRUD

**Warunki wstępne**:

- Aplikacja działa na localhost:3000
- Baza danych jest pusta (fresh start)
- Supabase jest skonfigurowane

**Kroki testowe**:

1. **Rejestracja**

   - Wejdź na `/register`
   - Uzupełnij email: `test@example.com`
   - Uzupełnij password: `password123`
   - Uzupełnij confirmPassword: `password123`
   - Kliknij "Register"
   - **Oczekiwany rezultat**: Przekierowanie do `/snippets`

2. **Empty State**

   - **Oczekiwany rezultat**: Widoczny komunikat "No snippets yet" i przycisk "Add your first snippet"

3. **Utworzenie Snippetu**

   - Kliknij "Add your first snippet" lub przejdź do `/snippets/new`
   - Uzupełnij formularz:
     - Title: "MySQL SELECT Query"
     - Language: "MySQL"
     - Content: "SELECT \* FROM users WHERE active = 1;"
     - Description: "Get all active users"
     - Tags: "database, sql, query"
   - Kliknij "Create Snippet"
   - **Oczekiwany rezultat**:
     - Toast notification "Snippet created successfully!"
     - Przekierowanie do `/snippets`
     - Snippet widoczny na liście

4. **Wyświetlenie Szczegółów**

   - Kliknij na kartę snippetu
   - **Oczekiwany rezultat**: Przekierowanie do `/snippets/:id`
   - Weryfikuj wyświetlanie: title, content, language badge, description, tags

5. **Edycja Snippetu**

   - Kliknij "Edit"
   - Zmień title na "MySQL Active Users Query"
   - Kliknij "Update Snippet"
   - **Oczekiwany rezultat**:
     - Toast notification "Snippet updated successfully!"
     - Zaktualizowany tytuł widoczny w szczegółach

6. **Wyszukiwanie**

   - Wróć do `/snippets`
   - W search bar wpisz "active"
   - **Oczekiwany rezultat**: Snippet jest widoczny w wynikach

7. **Filtrowanie**

   - Wybierz filter "MySQL" z dropdown
   - **Oczekiwany rezultat**: Snippet jest widoczny (tylko MySQL snippety)
   - Wybierz filter "JavaScript"
   - **Oczekiwany rezultat**: Empty state "No snippets found"

8. **Usunięcie Snippetu**

   - Wróć do szczegółów snippetu
   - Kliknij "Delete"
   - **Oczekiwany rezultat**: Modal confirmation z tytułem snippetu
   - Kliknij "Confirm Delete"
   - **Oczekiwany rezultat**:
     - Toast notification "Snippet deleted successfully!"
     - Przekierowanie do `/snippets`
     - Empty state widoczny

9. **Wylogowanie**

   - Kliknij "Logout" w nagłówku
   - **Oczekiwany rezultat**: Przekierowanie do `/login`

10. **Weryfikacja Ochrony Routes**
    - Spróbuj wejść bezpośrednio na `/snippets`
    - **Oczekiwany rezultat**: Przekierowanie do `/login`

**Kryteria akceptacji**: Wszystkie kroki przechodzą bez błędów

---

### 4.2 Scenariusz: Walidacja Formularza Snippetu

**ID**: TC-VAL-001  
**Priorytet**: 🟡 WYSOKI  
**Typ**: Functional

**Cel**: Weryfikacja client-side validation w formularzu snippetu

**Kroki testowe**:

1. Wejdź na `/snippets/new` jako zalogowany użytkownik
2. Kliknij "Create Snippet" bez wypełniania formularza
3. **Oczekiwany rezultat**:
   - Błąd pod polem Title: "Title is required"
   - Błąd pod polem Content: "Content is required"
   - Przycisk pozostaje disabled
4. Wpisz title o długości 201 znaków
5. **Oczekiwany rezultat**: Błąd "Title must be 200 characters or less"
6. Wpisz prawidłowy title (< 200 znaków) i content
7. Wpisz description o długości 501 znaków
8. **Oczekiwany rezultat**: Błąd "Description must be 500 characters or less"
9. Popraw wszystkie pola
10. **Oczekiwany rezultat**: Przycisk "Create Snippet" jest enabled

**Kryteria akceptacji**: Wszystkie błędy walidacji działają zgodnie z oczekiwaniami

---

### 4.3 Scenariusz: Row Level Security

**ID**: TC-SEC-001  
**Priorytet**: 🔴 KRYTYCZNY  
**Typ**: Security

**Cel**: Weryfikacja, że użytkownik A nie może zobaczyć snippetów użytkownika B

**Warunki wstępne**:

- Użytkownik A: `userA@test.com` ma 2 snippety
- Użytkownik B: `userB@test.com` ma 3 snippety

**Kroki testowe**:

1. Zaloguj się jako użytkownik A
2. Przejdź do `/snippets`
3. **Oczekiwany rezultat**: Widoczne są **tylko 2 snippety** użytkownika A
4. Skopiuj ID snippetu użytkownika B (z bazy danych)
5. Spróbuj wejść bezpośrednio na `/snippets/{id-snippetu-B}`
6. **Oczekiwany rezultat**: Error 404 lub "Snippet not found"
7. Wyloguj się
8. Zaloguj się jako użytkownik B
9. Przejdź do `/snippets`
10. **Oczekiwany rezultat**: Widoczne są **tylko 3 snippety** użytkownika B

**Kryteria akceptacji**: RLS skutecznie izoluje dane użytkowników

---

### 4.4 Scenariusz: Full-Text Search

**ID**: TC-SEARCH-001  
**Priorytet**: 🟡 WYSOKI  
**Typ**: Functional

**Cel**: Weryfikacja działania full-text search

**Warunki wstępne**:

- Użytkownik ma 5 snippetów:
  1. Title: "JavaScript Array Methods", Content: "map, filter, reduce"
  2. Title: "Python List Comprehension", Content: "[x for x in range(10)]"
  3. Title: "MySQL JOIN Query", Content: "SELECT \* FROM users JOIN orders"
  4. Title: "Bash Script", Content: "#!/bin/bash\necho 'Hello'"
  5. Title: "CSS Flexbox", Content: "display: flex; justify-content: center;"

**Kroki testowe**:

1. Przejdź do `/snippets`
2. W search bar wpisz "array"
3. **Oczekiwany rezultat**: Widoczny tylko snippet #1 (JavaScript Array Methods)
4. Wyczyść search, wpisz "SELECT"
5. **Oczekiwany rezultat**: Widoczny tylko snippet #3 (MySQL JOIN Query)
6. Wyczyść search, wpisz "python"
7. **Oczekiwany rezultat**: Widoczny tylko snippet #2 (Python List Comprehension)
8. Wpisz "xyz123nonexistent"
9. **Oczekiwany rezultat**: Empty state "No snippets found matching 'xyz123nonexistent'"

**Kryteria akceptacji**: Search działa w title i content, case-insensitive

---

### 4.5 Scenariusz: Loading States i Toast Notifications

**ID**: TC-UX-001  
**Priorytet**: 🟡 WYSOKI  
**Typ**: User Experience

**Cel**: Weryfikacja loading states i feedback dla użytkownika

**Kroki testowe**:

1. **Create Loading State**

   - Wejdź na `/snippets/new`
   - Uzupełnij formularz poprawnie
   - Kliknij "Create Snippet"
   - **Oczekiwany rezultat**: Tekst przycisku zmienia się na "Creating..." i przycisk jest disabled

2. **Create Success Toast**

   - Po zapisaniu snippetu
   - **Oczekiwany rezultat**: Toast notification (zielony) "Snippet created successfully!" pojawia się w prawym górnym rogu
   - Toast znika automatycznie po 3-5 sekundach

3. **Update Loading State**

   - Edytuj snippet
   - Kliknij "Update Snippet"
   - **Oczekiwany rezultat**: Tekst przycisku zmienia się na "Updating..."

4. **Delete Confirmation Modal**

   - Na stronie szczegółów kliknij "Delete"
   - **Oczekiwany rezultat**: Modal z tytułem snippetu i pytaniem "Are you sure...?"
   - Kliknij "Cancel"
   - **Oczekiwany rezultat**: Modal zamyka się bez usuwania

5. **Skeleton Screens**
   - Odśwież stronę `/snippets`
   - **Oczekiwany rezultat**: Podczas ładowania widoczne skeleton screens (placeholder cards)

**Kryteria akceptacji**: Wszystkie loading states i toasts działają zgodnie z oczekiwaniami

---

### 4.6 Scenariusz: Responsywny Grid Layout

**ID**: TC-RESP-001  
**Priorytet**: 🟡 WYSOKI  
**Typ**: Responsive Design

**Cel**: Weryfikacja responsywnego layoutu na różnych rozdzielczościach

**Warunki wstępne**:

- Użytkownik ma co najmniej 6 snippetów

**Kroki testowe**:

1. **Desktop (> 1024px)**

   - Ustaw viewport na 1920x1080
   - Przejdź do `/snippets`
   - **Oczekiwany rezultat**: Grid z **3 kolumnami**

2. **Tablet (768px - 1024px)**

   - Ustaw viewport na 800x600
   - **Oczekiwany rezultat**: Grid z **2 kolumnami**

3. **Mobile (< 768px)**

   - Ustaw viewport na 375x667 (iPhone)
   - **Oczekiwany rezultat**: Grid z **1 kolumną**

4. **Touch Targets (Mobile)**
   - Sprawdź przyciski i linki
   - **Oczekiwany rezultat**: Wszystkie elementy interaktywne mają minimum 44x44px

**Kryteria akceptacji**: Layout dostosowuje się poprawnie do wszystkich breakpoints

---

### 4.7 Scenariusz: Error Handling

**ID**: TC-ERROR-001  
**Priorytet**: 🟡 WYSOKI  
**Typ**: Error Handling

**Cel**: Weryfikacja obsługi błędów

**Kroki testowe**:

1. **Network Error Simulation**

   - Wyłącz Supabase (lub internet)
   - Spróbuj utworzyć snippet
   - **Oczekiwany rezultat**: Toast error "Unable to connect. Please check your connection."

2. **Invalid Credentials**

   - Wejdź na `/login`
   - Wpisz nieprawidłowy email/password
   - Kliknij "Login"
   - **Oczekiwany rezultat**: Error message "Invalid email or password"

3. **Duplicate Email Registration**

   - Wejdź na `/register`
   - Wpisz email który już istnieje w bazie
   - **Oczekiwany rezultat**: Error "An account with this email already exists"

4. **404 Protected Route**
   - Jako niezalogowany użytkownik wejdź na `/snippets/fake-id-123`
   - **Oczekiwany rezultat**: Przekierowanie do `/login`

**Kryteria akceptacji**: Wszystkie błędy są obsługiwane gracefully z user-friendly messages

## 5. Środowisko Testowe

### 5.1 Konfiguracja Środowiska Lokalnego

**Wymagania**:

- **Node.js**: v22.14.0 (zgodnie z `.nvmrc`)
- **npm**: 9.6.5 lub wyższy
- **Supabase CLI**: najnowsza wersja
- **Docker**: wymagany do lokalnego Supabase (opcjonalnie)
- **Przeglądarka**: Chrome/Chromium (dla Playwright)

**Setup**:

```bash
# 1. Zainstaluj dependencies
npm install

# 2. Uruchom lokalny Supabase (opcjonalnie)
supabase start

# 3. Zastosuj migracje
npx supabase migration up

# 4. Uruchom dev server
npm run dev

# 5. Zainstaluj Playwright browsers
npx playwright install
```

### 5.2 Dane Testowe

**Użytkownicy testowi**:

- User A: `testA@example.com` / `password123`
- User B: `testB@example.com` / `password123`

**Snippety testowe** (przykładowe):

```json
{
  "title": "MySQL SELECT Query",
  "content": "SELECT * FROM users WHERE active = 1;",
  "language": "MySQL",
  "description": "Get all active users",
  "tags": ["database", "sql", "query"]
}
```

### 5.3 Konfiguracja Supabase

**Environment Variables** (`.env`):

```
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Database**: PostgreSQL z migracją `20251126200821_create_snippets_table.sql`

**RLS Policies**: Włączone dla tabeli `snippets`

## 6. Narzędzia do Testowania

### 6.1 Playwright (E2E Tests)

**Wersja**: Latest stable  
**Dokumentacja**: https://playwright.dev/

**Konfiguracja** (`playwright.config.ts`):

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**Uruchomienie testów**:

```bash
# Wszystkie testy
npx playwright test

# Pojedynczy test
npx playwright test tests/e2e/main-flow.spec.ts

# Headed mode (z GUI)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### 6.2 Vitest (Unit/Integration Tests - opcjonalnie)

**Wersja**: Latest stable  
**Dokumentacja**: https://vitest.dev/

**Zastosowanie**: Testy walidacji Zod schemas, testy serwisów

**Instalacja**:

```bash
npm install -D vitest @vitest/ui
```

### 6.3 ESLint + TypeScript

**Cel**: Static code analysis, type checking

**Uruchomienie**:

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### 6.4 GitHub Actions

**Cel**: CI/CD pipeline

**Workflow** (`.github/workflows/ci.yml`):

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22.14.0"
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

### 6.5 Supabase CLI

**Cel**: Zarządzanie bazą danych, migracjami, local dev

**Komendy**:

```bash
# Start local Supabase
supabase start

# Zastosuj migracje
npx supabase migration up

# Reset bazy danych
supabase db reset

# Stop Supabase
supabase stop
```

## 7. Harmonogram Testów

### 7.1 Faza 1: Setup Środowiska Testowego (Dzień 1)

**Czas**: 2 godziny

**Zadania**:

- [ ] Instalacja Playwright
- [ ] Stworzenie `playwright.config.ts`
- [ ] Stworzenie folderu `tests/e2e/`
- [ ] Weryfikacja, że testy uruchamiają się lokalnie
- [ ] Przygotowanie danych testowych (2 użytkowników, 5 snippetów)

### 7.2 Faza 2: Implementacja Testów E2E (Dzień 2-3)

**Czas**: 4 godziny

**Zadania**:

- [ ] **TC-E2E-001**: Pełny flow użytkownika (rejestracja → CRUD → logout)
- [ ] **TC-SEC-001**: Weryfikacja Row Level Security
- [ ] **TC-SEARCH-001**: Full-text search
- [ ] **TC-RESP-001**: Responsywny layout (różne viewports)

### 7.3 Faza 3: Testy Walidacji i UX (Dzień 4)

**Czas**: 2 godziny

**Zadania**:

- [ ] **TC-VAL-001**: Walidacja formularza snippetu
- [ ] **TC-UX-001**: Loading states i toast notifications
- [ ] **TC-ERROR-001**: Error handling

### 7.4 Faza 4: Konfiguracja CI/CD (Dzień 5)

**Czas**: 2 godziny

**Zadania**:

- [ ] Stworzenie `.github/workflows/ci.yml`
- [ ] Konfiguracja GitHub Actions do uruchamiania testów
- [ ] Weryfikacja, że pipeline działa na push/PR
- [ ] Dodanie badge do README.md

### 7.5 Faza 5: Testy Manualne i Bugfixy (Dzień 6-7)

**Czas**: 4 godziny

**Zadania**:

- [ ] Manual testing wszystkich user stories
- [ ] Testy bezpieczeństwa (RLS, SQL injection, XSS)
- [ ] Testy responsywności na fizycznych urządzeniach
- [ ] Naprawa znalezionych bugów
- [ ] Regression testing po fixach

### 7.6 Faza 6: Dokumentacja i Raportowanie (Dzień 7)

**Czas**: 1 godzina

**Zadania**:

- [ ] Aktualizacja tego planu testów z wynikami
- [ ] Stworzenie test report (ile testów passed/failed)
- [ ] Dokumentacja known issues (jeśli są)
- [ ] Przygotowanie do prezentacji/oddania projektu

## 8. Kryteria Akceptacji Testów

### 8.1 Kryteria MVP (Must Have)

✅ **Minimum 1 test E2E przechodzi** - TC-E2E-001 (pełny flow użytkownika)  
✅ **Build aplikacji działa** - `npm run build` bez błędów  
✅ **TypeScript kompilacja** - `npx tsc --noEmit` bez błędów  
✅ **CI/CD pipeline działa** - GitHub Actions uruchamia testy automatycznie  
✅ **Wszystkie User Stories z PRD działają** - Manual testing potwierdza

### 8.2 Kryteria Jakości (Should Have)

🟡 **Code coverage** - Minimum 1 test pokrywa główny flow (login → CRUD → logout)  
🟡 **Security tests pass** - RLS działa, hasła są haszowane  
🟡 **Responsive design works** - Grid layout dostosowuje się do 1/2/3 kolumn  
🟡 **Error handling works** - Wszystkie błędy mają user-friendly messages  
🟡 **UX elements work** - Toast notifications, loading states, empty states

### 8.3 Kryteria Sukcesu Kursu 10xDevs

✅ **Authentication** - Supabase Auth z email/password  
✅ **CRUD operations** - Snippet management działa  
✅ **Business logic** - Validation, search, filtering, RLS  
✅ **Tests** - Minimum 1 E2E test  
✅ **CI/CD** - GitHub Actions pipeline  
✅ **Documentation** - PRD, Tech Stack, Architecture, **Plan Testów**

### 8.4 Definition of Done

Test jest uznany za **ukończony** gdy:

1. ✅ Test case jest zaimplementowany w Playwright (lub odpowiednim narzędziu)
2. ✅ Test przechodzi lokalnie na świeżej bazie danych
3. ✅ Test przechodzi w CI/CD pipeline
4. ✅ Test jest udokumentowany (cel, kroki, oczekiwane rezultaty)
5. ✅ Znalezione bugi są naprawione i zweryfikowane (regression testing)

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1 Developer/Tester (Ty)

**Odpowiedzialności**:

- ✍️ Implementacja testów E2E w Playwright
- 🐛 Wykonywanie testów manualnych
- 🔧 Naprawa znalezionych bugów
- 📝 Dokumentacja wyników testów
- 🚀 Konfiguracja CI/CD pipeline
- ✅ Weryfikacja, że wszystkie kryteria akceptacji są spełnione

### 9.2 Supabase (BaaS Provider)

**Odpowiedzialności**:

- 🔒 Zapewnienie Row Level Security enforcement
- 🗄️ Zarządzanie bazą danych PostgreSQL
- 🔐 Haszowanie haseł (bcrypt)
- 📡 API dla autentykacji i operacji CRUD

### 9.3 GitHub Actions (CI/CD)

**Odpowiedzialności**:

- 🔄 Automatyczne uruchamianie testów przy push/PR
- ✅ Weryfikacja build i type checking
- 📊 Raportowanie wyników testów

### 9.4 Kurs 10xDevs (Reviewer)

**Odpowiedzialności**:

- 👀 Weryfikacja, że wymagania kursu są spełnione
- ✅ Akceptacja projektu MVP
- 📚 Feedback na dokumentację i implementację

## 10. Procedury Raportowania Błędów

### 10.1 Format Zgłoszenia Błędu

Każdy znaleziony bug powinien być udokumentowany w następującym formacie:

```markdown
## BUG-{ID}: {Krótki Tytuł}

**Priorytet**: 🔴 Critical / 🟡 High / 🟢 Medium / ⚪ Low  
**Status**: Open / In Progress / Resolved / Closed  
**Znaleziony w**: {Test ID lub Manual Testing}  
**Dotyczy**: {Feature/Component}

### Opis

{Co się nie działa zgodnie z oczekiwaniami}

### Kroki do Reprodukcji

1. {Krok 1}
2. {Krok 2}
3. {Krok 3}

### Oczekiwane Zachowanie

{Co powinno się wydarzyć}

### Faktyczne Zachowanie

{Co faktycznie się dzieje}

### Środowisko

- Node.js: v22.14.0
- Browser: Chrome 120
- OS: {Linux/macOS/Windows}
- Supabase: Local / Cloud

### Screenshots/Logs

{Dołącz screenshot lub console logs jeśli applicable}

### Propozycja Rozwiązania (opcjonalnie)

{Jak można to naprawić}
```

### 10.2 Priorytety Błędów

**🔴 Critical (P0)**:

- Aplikacja się crashuje
- Security vulnerability (np. RLS nie działa)
- Data loss (np. snippet nie zapisuje się)
- Complete blocker dla main flow

**Przykład**: Row Level Security nie działa - użytkownik A widzi snippety użytkownika B

---

**🟡 High (P1)**:

- Funkcjonalność nie działa zgodnie z wymaganiami
- UX severely impacted
- Workaround exists ale jest trudny

**Przykład**: Search nie zwraca wyników mimo że snippety istnieją

---

**🟢 Medium (P2)**:

- Minor funkcjonalność broken
- UX degraded ale użytkownik może dokończyć zadanie
- Visual bugs

**Przykład**: Toast notification nie znika automatycznie

---

**⚪ Low (P3)**:

- Cosmetic issues
- Nice-to-have features
- Nie wpływa na funkcjonalność

**Przykład**: Button hover color nie jest idealny

### 10.3 Bug Tracking

**Narzędzie**: GitHub Issues

**Workflow**:

1. **Discover** - Bug znaleziony podczas testów
2. **Report** - Stworzenie GitHub Issue z powyższym formatem
3. **Triage** - Przypisanie priorytetu i labeli
4. **Fix** - Implementacja poprawki
5. **Verify** - Regression testing
6. **Close** - Zamknięcie issue po weryfikacji

**Labels**:

- `bug` - Potwierdzony błąd
- `priority: critical` - P0
- `priority: high` - P1
- `priority: medium` - P2
- `priority: low` - P3
- `area: auth` - Dotyczy autentykacji
- `area: crud` - Dotyczy operacji CRUD
- `area: search` - Dotyczy wyszukiwania
- `area: ui` - Dotyczy interfejsu użytkownika
- `area: security` - Dotyczy bezpieczeństwa

### 10.4 Critical Bug Response Time

**P0 (Critical)**:

- ⏱️ Response time: Natychmiast
- 🔧 Fix time: W ciągu 24 godzin
- ✅ Verification: Regression testing dla całego affected flow

**P1 (High)**:

- ⏱️ Response time: W ciągu 24 godzin
- 🔧 Fix time: W ciągu 2-3 dni
- ✅ Verification: Test case affected feature

**P2 (Medium)**:

- ⏱️ Response time: W ciągu 2-3 dni
- 🔧 Fix time: Przed końcem MVP (w miarę możliwości)
- ✅ Verification: Manual testing

**P3 (Low)**:

- ⏱️ Response time: Acknowledged
- 🔧 Fix time: Post-MVP (v2)
- ✅ Verification: Not required

### 10.5 Regression Testing po Bug Fixach

Po naprawieniu każdego buga **P0** lub **P1**:

1. ✅ Uruchom test E2E pokrywający affected area
2. ✅ Manual testing dla pełnego flow
3. ✅ Weryfikacja, że fix nie wprowadził nowych bugów
4. ✅ Update test case jeśli było to uncovered scenario
5. ✅ Commit z referencją do Issue: "Fix BUG-123: ..."

---

## 11. Obszary Ryzyka i Mitygacja

### 11.1 Wysokie Ryzyko: Row Level Security (RLS)

**Ryzyko**: Błędna konfiguracja RLS może pozwolić użytkownikowi A zobaczyć dane użytkownika B

**Wpływ**: 🔴 **KRYTYCZNY** - Data breach, naruszenie prywatności

**Mitygacja**:

- ✅ Dedykowany test **TC-SEC-001** weryfikujący RLS
- ✅ Manual testing z 2 różnymi użytkownikami
- ✅ Code review migracji SQL (RLS policies)
- ✅ Weryfikacja w Supabase SQL Editor przed deploymentem

**Test weryfikacyjny**:

```sql
-- Run as User A
SELECT * FROM snippets; -- Should return only User A's snippets

-- Try to access User B's snippet by ID
SELECT * FROM snippets WHERE id = 'user-b-snippet-id'; -- Should return 0 rows
```

---

### 11.2 Wysokie Ryzyko: Search Performance

**Ryzyko**: Full-text search może być wolny dla dużej ilości snippetów

**Wpływ**: 🟡 **WYSOKI** - UX degraded, search > 500ms

**Mitygacja**:

- ✅ Testy wydajnościowe z 100+ snippetami (opcjonalne w MVP)
- ✅ Weryfikacja, że GIN index jest stworzony w migracji
- ✅ Monitoring response time w dev tools

**Threshold**: Search query powinien zwrócić wyniki w < 500ms

---

### 11.3 Średnie Ryzyko: Session Management

**Ryzyko**: Sesja użytkownika może wygasnąć niespodziewanie lub nie być maintained

**Wpływ**: 🟡 **ŚREDNI** - Użytkownik musi się ponownie logować

**Mitygacja**:

- ✅ Weryfikacja auto-refresh token w Supabase SDK
- ✅ Test: Pozostawienie aplikacji otwartej przez 24h
- ✅ Sprawdzenie middleware (`src/middleware/index.ts`)

---

### 11.4 Średnie Ryzyko: Build w CI/CD

**Ryzyko**: Build może przechodzić lokalnie ale failować w CI

**Wpływ**: 🟡 **ŚREDNI** - Broken pipeline, nie można merge PR

**Mitygacja**:

- ✅ Testowanie build lokalnie przed push (`npm run build`)
- ✅ Weryfikacja, że `.env` variables nie są hardcoded
- ✅ Użycie `npm ci` zamiast `npm install` w CI

---

### 11.5 Niskie Ryzyko: Browser Compatibility

**Ryzyko**: Aplikacja może nie działać w starszych przeglądarkach

**Wpływ**: 🟢 **NISKI** - Target audience używa nowoczesnych przeglądarek

**Mitygacja**:

- ✅ Playwright testuje tylko Chrome/Chromium (acceptable dla MVP)
- ✅ Astro + React generują kompatybilny kod
- ⚠️ **Post-MVP**: Cross-browser testing (Firefox, Safari)

---

## 12. Podsumowanie i Next Steps

### 12.1 Kluczowe Wnioski z Analizy

1. **Priorytet: E2E Testing** - Minimum 1 test E2E (TC-E2E-001) jest **wymagany** dla MVP i kursu
2. **Security First** - RLS testing jest **krytyczny** dla bezpieczeństwa aplikacji
3. **Supabase jako Fundament** - Wszystkie testy integracyjne polegają na Supabase SDK i RLS
4. **CI/CD jest Must-Have** - GitHub Actions pipeline jest wymaganiem kursu
5. **Manual Testing Complement** - E2E testy muszą być uzupełnione manual testingiem dla edge cases

### 12.2 Rekomendacje

#### Dla MVP (3 tygodnie)

- ✅ **Zaimplementuj TC-E2E-001** (pełny flow) - TO JEST MINIMUM
- ✅ **Skonfiguruj CI/CD** - GitHub Actions z Playwright
- ✅ **Security testing** - TC-SEC-001 (RLS verification)
- ✅ **Manual testing** - Wszystkie user stories z PRD
- ⚠️ **Nice to have**: TC-SEARCH-001, TC-RESP-001, TC-UX-001

#### Dla v2 (Post-MVP)

- 📈 **Zwiększyć code coverage** - Dodać więcej scenariuszy E2E
- 🧪 **Unit tests** - Testy dla Zod schemas, serwisów
- 🌐 **Cross-browser testing** - Firefox, Safari
- ♿ **Accessibility testing** - WCAG 2.1 compliance
- 📊 **Performance testing** - Load testing dla search

### 12.3 Gotowość do Implementacji

| Area                        | Status   | Notatki                           |
| --------------------------- | -------- | --------------------------------- |
| **Setup Środowiska**        | ✅ Ready | Node.js, Supabase skonfigurowane  |
| **Playwright Installation** | ⏳ To Do | `npm install -D @playwright/test` |
| **Test Data Preparation**   | ⏳ To Do | Stworzenie seed data              |
| **CI/CD Configuration**     | ⏳ To Do | `.github/workflows/ci.yml`        |
| **Test Implementation**     | ⏳ To Do | `tests/e2e/main-flow.spec.ts`     |

### 12.4 Next Steps (Action Items)

1. **Tydzień 1-2**: Dokończenie implementacji funkcjonalności (auth, CRUD, search)
2. **Tydzień 3 - Dzień 1-2**: Setup Playwright + implementacja TC-E2E-001
3. **Tydzień 3 - Dzień 3**: Security testing (TC-SEC-001) + bug fixes
4. **Tydzień 3 - Dzień 4**: CI/CD setup + manual testing
5. **Tydzień 3 - Dzień 5-7**: Bug fixes, regression testing, dokumentacja

### 12.5 Success Criteria - Final Checklist

Przed oddaniem projektu, zweryfikuj:

- [ ] ✅ Minimum 1 test E2E przechodzi (`npx playwright test`)
- [ ] ✅ CI/CD pipeline działa (GitHub Actions badge zielony)
- [ ] ✅ Build bez błędów (`npm run build`)
- [ ] ✅ TypeScript bez błędów (`npx tsc --noEmit`)
- [ ] ✅ Linting passes (`npm run lint`)
- [ ] ✅ RLS działa poprawnie (manual testing z 2 userami)
- [ ] ✅ Wszystkie user stories z PRD działają
- [ ] ✅ Dokumentacja kompletna (PRD, Tech Stack, Architecture, **Plan Testów**)
- [ ] ✅ README.md zaktualizowane z instrukcjami uruchomienia testów

---

## Appendix A: Przykładowy Test Playwright

```typescript
// tests/e2e/main-flow.spec.ts

import { test, expect } from "@playwright/test";

test("TC-E2E-001: Full user flow - Register, CRUD, Logout", async ({
  page,
}) => {
  // 1. Register
  await page.goto("/register");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.fill('input[name="confirmPassword"]', "password123");
  await page.click('button[type="submit"]');

  // Verify redirect to /snippets
  await expect(page).toHaveURL("/snippets");

  // 2. Verify empty state
  await expect(page.locator("text=No snippets yet")).toBeVisible();

  // 3. Create snippet
  await page.click("text=Add your first snippet");
  await page.fill('input[name="title"]', "MySQL SELECT Query");
  await page.selectOption('select[name="language"]', "MySQL");
  await page.fill(
    'textarea[name="content"]',
    "SELECT * FROM users WHERE active = 1;"
  );
  await page.fill('textarea[name="description"]', "Get all active users");
  await page.fill('input[name="tags"]', "database, sql, query");
  await page.click('button[type="submit"]');

  // Verify toast notification
  await expect(
    page.locator("text=Snippet created successfully!")
  ).toBeVisible();

  // Verify redirect and snippet visible
  await expect(page).toHaveURL("/snippets");
  await expect(page.locator("text=MySQL SELECT Query")).toBeVisible();

  // 4. View details
  await page.click("text=MySQL SELECT Query");
  await expect(page.locator("text=SELECT * FROM users")).toBeVisible();

  // 5. Edit snippet
  await page.click("text=Edit");
  await page.fill('input[name="title"]', "MySQL Active Users Query");
  await page.click('button[type="submit"]');

  await expect(
    page.locator("text=Snippet updated successfully!")
  ).toBeVisible();
  await expect(page.locator("text=MySQL Active Users Query")).toBeVisible();

  // 6. Search
  await page.goto("/snippets");
  await page.fill('input[type="search"]', "active");
  await expect(page.locator("text=MySQL Active Users Query")).toBeVisible();

  // 7. Delete
  await page.click("text=MySQL Active Users Query");
  await page.click("text=Delete");
  await page.click("text=Confirm Delete"); // Modal confirmation

  await expect(
    page.locator("text=Snippet deleted successfully!")
  ).toBeVisible();
  await expect(page.locator("text=No snippets yet")).toBeVisible();

  // 8. Logout
  await page.click("text=Logout");
  await expect(page).toHaveURL("/login");

  // 9. Verify protected route
  await page.goto("/snippets");
  await expect(page).toHaveURL("/login"); // Should redirect
});
```

---

## Appendix B: GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml

name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "22.14.0"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: TypeScript type check
        run: npx tsc --noEmit

      - name: Build application
        run: npm run build

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

**Document Version**: 1.0  
**Created**: 2025-12-03  
**Last Updated**: 2025-12-03  
**Status**: ✅ Approved - Ready for Implementation  
**Author**: QA Engineer / Developer - Spellbook MVP Team
