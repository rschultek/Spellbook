import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page Object for the Login page (/login).
 * Provides methods to interact with login form elements and perform login actions.
 */
export class LoginPage extends BasePage {
  // Selectors using data-test-id attributes
  private readonly pageHeading: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly emailError: Locator;
  private readonly passwordError: Locator;
  private readonly registerLink: Locator;

  /**
   * Creates a new LoginPage instance
   * @param page - Playwright Page object
   */
  constructor(page: Page) {
    super(page);

    // Initialize selectors using data-test-id
    this.pageHeading = page.getByTestId("login-page-heading");
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.emailError = page.getByTestId("login-email-error");
    this.passwordError = page.getByTestId("login-password-error");
    this.registerLink = page.getByTestId("register-link");
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await super.goto("/login");
    // Wait for network to be idle to ensure hydration is complete
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Fill in the email field
   * @param email - Email address to enter
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill in the password field
   * @param password - Password to enter
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the login submit button
   */
  async clickLogin(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform complete login flow
   * @param email - Email address
   * @param password - Password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Wait for redirect after successful login
   * @param url - Expected redirect URL (default: /snippets)
   */
  async waitForRedirect(url = "/snippets"): Promise<void> {
    await this.page.waitForURL(url);
  }

  /**
   * Click the "Sign up" link to navigate to registration
   */
  async clickRegisterLink(): Promise<void> {
    await this.registerLink.click();
  }

  // Assertions

  /**
   * Verify that user is on the login page
   */
  async expectToBeOnLoginPage(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.pageHeading).toHaveText("Welcome Back");
  }

  /**
   * Verify email validation error is displayed
   * @param message - Optional expected error message
   */
  async expectEmailError(message?: string): Promise<void> {
    await expect(this.emailError).toBeVisible();
    if (message) {
      await expect(this.emailError).toContainText(message);
    }
  }

  /**
   * Verify password validation error is displayed
   * @param message - Optional expected error message
   */
  async expectPasswordError(message?: string): Promise<void> {
    await expect(this.passwordError).toBeVisible();
    if (message) {
      await expect(this.passwordError).toContainText(message);
    }
  }

  /**
   * Verify submit button is in loading state
   */
  async expectSubmitButtonLoading(): Promise<void> {
    await expect(this.submitButton).toContainText("Logging in...");
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Verify submit button is ready for submission
   */
  async expectSubmitButtonReady(): Promise<void> {
    await expect(this.submitButton).toContainText("Log In");
    await expect(this.submitButton).toBeEnabled();
  }
  /**
   * Verify success toast message is displayed
   * @param message - Expected success message
   */
  async expectSuccessMessage(message = "Login successful!"): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  /**
   * Verify that authentication was successful by checking redirect
   * This is more reliable than checking cookies which names can vary
   */
  async expectLoginSuccess(): Promise<void> {
    // Wait for redirect to snippets page
    await this.waitForRedirect();
  }
}
