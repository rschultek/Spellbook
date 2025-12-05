import type { Page } from "@playwright/test";

/**
 * Base Page Object class providing common functionality for all page objects.
 * All page objects should extend this class.
 */
export class BasePage {
  protected readonly page: Page;

  /**
   * Creates a new BasePage instance
   * @param page - Playwright Page object
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   * @param path - Relative or absolute URL path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for navigation to complete
   * @param url - Optional URL or URL pattern to wait for
   */
  async waitForNavigation(url?: string | RegExp): Promise<void> {
    if (url) {
      await this.page.waitForURL(url);
    } else {
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for an element to be visible
   * @param selector - Element selector
   */
  async waitForElement(selector: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: "visible" });
  }

  /**
   * Check if current URL matches the expected URL
   * @param expectedUrl - Expected URL or URL pattern
   */
  async isAt(expectedUrl: string | RegExp): Promise<boolean> {
    const currentUrl = await this.getCurrentUrl();
    if (typeof expectedUrl === "string") {
      return currentUrl.includes(expectedUrl);
    }
    return expectedUrl.test(currentUrl);
  }
}
