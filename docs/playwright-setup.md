# Playwright E2E Setup - Quick Start

## ✅ Gotowe do użycia!

Playwright został skonfigurowany i jest gotowy do uruchamiania testów E2E.

## 📦 Co zostało skonfigurowane:

### 1. Konfiguracja Playwright

- **Plik:** [`playwright.config.ts`](/workspace/kurs/Spellbook/playwright.config.ts)
- **Przeglądarka:** Chromium (Desktop Chrome)
- **Dev Server:** Automatyczne uruchamianie `npm run dev` na http://localhost:3000
- **Testy:** Katalog `./e2e/tests`
- **Raporty:** HTML + lista w konsoli

### 2. Zainstalowane przeglądarki

```bash
✅ Chromium 143.0.7499.4 (playwright build v1200)
✅ FFMPEG (do nagrywania wideo)
✅ Chromium Headless Shell
```

### 3. Dodane skrypty NPM

```json
"test:e2e": "playwright test"              // Uruchom wszystkie testy
"test:e2e:ui": "playwright test --ui"      // Tryb UI (interaktywny)
"test:e2e:headed": "playwright test --headed"  // Widoczna przeglądarka
"test:e2e:report": "playwright show-report"    // Pokaż raport HTML
```

---

## 🚀 Jak uruchomić testy:

### Podstawowe uruchomienie (headless):

```bash
npm run test:e2e
```

### Tryb UI (interaktywny):

```bash
npm run test:e2e:ui
```

### Z widoczną przeglądarką:

```bash
npm run test:e2e:headed
```

### Wyświetl raport HTML:

```bash
npm run test:e2e:report
```

---

## 📋 Dostępne testy:

### [login.spec.ts](/workspace/kurs/Spellbook/e2e/tests/login.spec.ts)

Testy komponentu logowania:

- ✅ Poprawne logowanie z prawidłowymi danymi
- ✅ Błędy walidacji dla pustych pól
- ✅ Błąd walidacji dla nieprawidłowego emaila
- ✅ Nawigacja do strony rejestracji
- ✅ Stan ładowania przycisku submit

**Dane testowe z `.env.test`:**

- Email: `test@e2e.com`
- Hasło: `teste2e`

---

## 🔍 Przykład użycia:

```bash
# Uruchom wszystkie testy
npm run test:e2e

# Uruchom tylko testy logowania
npm run test:e2e -- login.spec.ts

# Uruchom konkretny test
npm run test:e2e -- login.spec.ts -g "should successfully log in"

# Debug z UI
npm run test:e2e:ui
```

---

## 📊 Funkcje Playwright:

- **Trace Viewer:** Automatyczne nagrywanie przy pierwszym powtórzeniu testu
- **Screenshots:** Zrzuty ekranu przy błędach
- **Video:** Nagrywanie wideo przy błędach
- **Parallel Testing:** Testy uruchamiane równolegle
- **Auto-retry:** 2 powtórzenia na CI

---

## 📝 Struktura projektu E2E:

```
e2e/
├── page-objects/
│   ├── base.page.ts       # Bazowa klasa POM
│   └── login.page.ts      # LoginPage POM
├── fixtures/
│   └── test-users.ts      # Dane testowe
└── tests/
    └── login.spec.ts      # Testy logowania
```

---

## 🎯 Następne kroki:

1. **Uruchom testy:** `npm run test:e2e`
2. **Sprawdź wyniki** w konsoli lub otwórz raport HTML
3. **Dodaj nowe testy** w katalogu `e2e/tests/`
4. **Rozbuduj POM** dodając nowe klasy page objects

---

**Wszystko gotowe! 🎉** Możesz teraz uruchamiać testy E2E dla komponentu logowania.
