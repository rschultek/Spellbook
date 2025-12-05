# Test Selectors - Login Component

Dokumentacja atrybutów `data-test-id` dla testów E2E Playwright komponentu logowania.

## Scenariusz testowy: Login Flow

### Krok 1: Weryfikacja, że użytkownik jest na stronie logowania

```typescript
// Sprawdź obecność nagłówka strony logowania
await expect(page.getByTestId("login-page-heading")).toBeVisible();
await expect(page.getByTestId("login-page-heading")).toHaveText("Welcome Back");
```

**Element:** `data-test-id="login-page-heading"`  
**Typ:** `<h1>`  
**Plik:** [`login.astro`](/workspace/kurs/Spellbook/src/pages/login.astro)  
**Znaczenie:** Potwierdzenie, że użytkownik znajduje się na właściwej stronie

---

### Krok 2: Wpisz Email oraz Password

```typescript
// Formularz logowania
const form = page.getByTestId("login-form");
await expect(form).toBeVisible();

// Wypełnij pole email
const emailInput = page.getByTestId("login-email-input");
await emailInput.fill("user@example.com");

// Wypełnij pole hasła
const passwordInput = page.getByTestId("login-password-input");
await passwordInput.fill("password123");
```

**Elementy:**

- `data-test-id="login-form"` - `<form>` - Cały formularz logowania
- `data-test-id="login-email-input"` - `<input type="email">` - Pole wprowadzania emaila
- `data-test-id="login-password-input"` - `<input type="password">` - Pole wprowadzania hasła

**Plik:** [`LoginForm.tsx`](/workspace/kurs/Spellbook/src/components/auth/LoginForm.tsx)

---

---

## 🎯 Page Object Model (POM) Usage

### Using LoginPage Class

The recommended approach for E2E testing is to use the **Page Object Model** pattern with the [`LoginPage`](/workspace/kurs/Spellbook/e2e/page-objects/login.page.ts) class.

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/login.page";
import { testUsers } from "../fixtures/test-users";

test("login with valid credentials", async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.expectToBeOnLoginPage();

  // Act
  await loginPage.login(testUsers.valid.email, testUsers.valid.password);

  // Assert - verify via UI redirection (more reliable than cookie check for SSR)
  await loginPage.expectLoginSuccess();
});
```

### Benefits of POM

✅ **Maintainability**: Selector changes only require updates in one place  
✅ **Reusability**: Login actions can be reused across multiple tests  
✅ **Readability**: Tests read like user stories with clear intent  
✅ **Type Safety**: Full TypeScript support with IntelliSense

### Available LoginPage Methods

**Navigation:**

- `goto()` - Navigate to login page
- `waitForRedirect(url?)` - Wait for post-login redirect

**Actions:**

- `fillEmail(email)` - Enter email address
- `fillPassword(password)` - Enter password
- `clickLogin()` - Click submit button
- `login(email, password)` - Complete login flow
- `clickRegisterLink()` - Navigate to registration

**Assertions:**

- `expectToBeOnLoginPage()` - Verify on login page
- `expectLoginSuccess()` - Verify successful login via redirect (recommended)
- `expectSuccessMessage(message?)` - Verify success toast message
- `expectEmailError(message?)` - Verify email error
- `expectPasswordError(message?)` - Verify password error
- `expectSubmitButtonLoading()` - Verify loading state
- `expectSubmitButtonReady()` - Verify ready state

### Test Users Fixture

Use pre-configured test users from [`test-users.ts`](/workspace/kurs/Spellbook/e2e/fixtures/test-users.ts):

```typescript
import { testUsers, getTestUser } from "../fixtures/test-users";

// Valid user from .env.test
testUsers.valid.email; // test@e2e.com
testUsers.valid.password; // teste2e

// Invalid users for error scenarios
testUsers.invalid.email; // invalid@example.com
testUsers.invalidEmail.email; // not-an-email
testUsers.empty.email; // (empty string)
```

---

## Krok 3: Naciśnij przycisk "Log In"

```typescript
// Kliknij przycisk logowania
const submitButton = page.getByTestId("login-submit-button");
await expect(submitButton).toBeEnabled();
await submitButton.click();

// Opcjonalnie: sprawdź stan ładowania
await expect(submitButton).toHaveText("Logging in...");
```

**Element:** `data-test-id="login-submit-button"`  
**Typ:** `<Button>` - komponent React  
**Plik:** [`LoginForm.tsx`](/workspace/kurs/Spellbook/src/components/auth/LoginForm.tsx)  
**Znaczenie:** Przycisk wysyłający formularz logowania

---

### Krok 4: Potwierdź zalogowanie

```typescript
// Zalecane: Sprawdź pomyślne logowanie (oczekiwanie na przekierowanie)
await loginPage.expectLoginSuccess();

// Alternatywnie (bezpośrednio Playwright):
await page.waitForURL("/snippets");
```

**Uwaga:** Przekierowanie następuje po krótkim opóźnieniu (1s) zdefiniowanym w `LoginForm.tsx`.
Metoda `expectLoginSuccess()` w Page Object obsługuje to oczekiwanie.

---

## Testy walidacji i błędów

### Test błędów walidacji

```typescript
// Wyślij formularz bez wypełniania pól
await page.getByTestId("login-submit-button").click();

// Sprawdź komunikaty błędów
const emailError = page.getByTestId("login-email-error");
await expect(emailError).toBeVisible();
await expect(emailError).toContainText("Email is required");

const passwordError = page.getByTestId("login-password-error");
await expect(passwordError).toBeVisible();
await expect(passwordError).toContainText("Password is required");
```

**Elementy:**

- `data-test-id="login-email-error"` - `<p>` - Komunikat błędu dla pola email
- `data-test-id="login-password-error"` - `<p>` - Komunikat błędu dla pola hasła

**Plik:** [`LoginForm.tsx`](/workspace/kurs/Spellbook/src/components/auth/LoginForm.tsx)  
**Walidacja:** Schematy Zod w [`auth.schemas.ts`](/workspace/kurs/Spellbook/src/lib/validation/auth.schemas.ts)

---

## Dodatkowe elementy testowe

### Link do rejestracji

```typescript
// Kliknij link "Sign up"
await page.getByTestId("register-link").click();
await expect(page).toHaveURL("/register");
```

**Element:** `data-test-id="register-link"`  
**Typ:** `<a href="/register">`  
**Plik:** [`login.astro`](/workspace/kurs/Spellbook/src/pages/login.astro)  
**Znaczenie:** Nawigacja do strony rejestracji

---

## Kompletny przykład testu E2E

```typescript
import { test, expect } from "@playwright/test";

test.describe.serial("Login Flow", () => {
  test("should successfully log in with valid credentials", async ({ page }) => {
    // 1. Nawiguj do strony logowania
    await page.goto("/login");

    // 2. Weryfikuj, że jesteś na stronie logowania
    await expect(page.getByTestId("login-page-heading")).toBeVisible();

    // 3. Wypełnij formularz
    await page.getByTestId("login-email-input").fill("test@example.com");
    await page.getByTestId("login-password-input").fill("password123");

    // 4. Kliknij przycisk logowania
    await page.getByTestId("login-submit-button").click();

    // 5. Potwierdź zalogowanie przez sprawdzenie przekierowania
    await expect(page).toHaveURL("/snippets");
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    await page.goto("/login");

    // Kliknij bez wypełniania pól
    await page.getByTestId("login-submit-button").click();

    // Sprawdź komunikaty błędów
    await expect(page.getByTestId("login-email-error")).toBeVisible();
    await expect(page.getByTestId("login-password-error")).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/login");

    // Kliknij link rejestracji
    await page.getByTestId("register-link").click();
    await expect(page).toHaveURL("/register");
  });
});
```

---

## Podsumowanie wszystkich селекторów

| Selektor               | Element    | Plik          | Cel testowy              |
| ---------------------- | ---------- | ------------- | ------------------------ |
| `login-page-heading`   | `<h1>`     | login.astro   | Weryfikacja strony       |
| `login-form`           | `<form>`   | LoginForm.tsx | Interakcja z formularzem |
| `login-email-input`    | `<input>`  | LoginForm.tsx | Wprowadzanie emaila      |
| `login-email-error`    | `<p>`      | LoginForm.tsx | Błędy walidacji email    |
| `login-password-input` | `<input>`  | LoginForm.tsx | Wprowadzanie hasła       |
| `login-password-error` | `<p>`      | LoginForm.tsx | Błędy walidacji hasła    |
| `login-submit-button`  | `<Button>` | LoginForm.tsx | Wysyłanie formularza     |
| `register-link`        | `<a>`      | login.astro   | Nawigacja do rejestracji |
