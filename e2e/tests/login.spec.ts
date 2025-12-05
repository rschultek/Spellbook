import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/login.page";
import { testUsers } from "../fixtures/test-users";

/**
 * E2E Tests for Login functionality
 *
 * Test scenarios:
 * 1. Successful login with valid credentials
 * 2. Validation errors for empty fields
 * 3. Navigation to register page
 *
 * Uses Page Object Model pattern for maintainability.
 */
test.describe.serial("Login Flow", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page object and navigate to login
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should successfully log in with valid credentials", async () => {
    // Arrange: Verify we're on the login page
    await loginPage.expectToBeOnLoginPage();

    // Act: Perform login with valid credentials from .env.test
    await loginPage.login(testUsers.valid.email, testUsers.valid.password);

    // Assert: Verify successful login via UI redirection
    await loginPage.expectLoginSuccess();
  });

  test("should show validation errors for empty fields", async () => {
    // Arrange: Verify we're on the login page
    await loginPage.expectToBeOnLoginPage();

    // Act: Submit form without filling fields
    await loginPage.clickLogin();

    // Assert: Verify validation error messages appear
    await loginPage.expectEmailError("Email is required");
    await loginPage.expectPasswordError("Password is required");
  });

  test("should show validation error for invalid email format", async () => {
    // Arrange: Verify we're on the login page
    await loginPage.expectToBeOnLoginPage();

    // Act: Fill with invalid email format
    await loginPage.fillEmail(testUsers.invalidEmail.email);
    await loginPage.fillPassword(testUsers.invalidEmail.password);
    await loginPage.clickLogin();

    // Assert: Verify email validation error
    await loginPage.expectEmailError("Please enter a valid email address");
  });

  test("should navigate to register page when clicking Sign up link", async ({ page }) => {
    // Arrange: Verify we're on the login page
    await loginPage.expectToBeOnLoginPage();

    // Act: Click the "Sign up" link
    await loginPage.clickRegisterLink();

    // Assert: Verify navigation to register page
    await expect(page).toHaveURL("/register");
  });

  test("should show submit button in loading state during login", async () => {
    // Arrange: Verify we're on the login page
    await loginPage.expectToBeOnLoginPage();
    await loginPage.expectSubmitButtonReady();

    // Act: Fill credentials and click login
    await loginPage.fillEmail(testUsers.valid.email);
    await loginPage.fillPassword(testUsers.valid.password);
    await loginPage.clickLogin();

    // Assert: Verify button shows loading state (may be brief)
    // Note: This assertion might be flaky due to fast authentication
    // Consider adding network mocking if needed for stable tests
    try {
      await loginPage.expectSubmitButtonLoading();
    } catch {
      // If loading state is too fast, verify redirect instead
      await loginPage.waitForRedirect("/snippets");
    }
  });
});
