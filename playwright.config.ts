import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.test for E2E tests (cloud Supabase database)
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Playwright E2E Testing Configuration
 *
 * Uses cloud Supabase database from .env.test for E2E tests.
 * Local dev (npm run dev) uses Docker Supabase from .env
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e/tests",

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["list"]],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",
  },

  // Configure projects for major browsers
  // Only Chromium as per Playwright E2E guidelines
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run your local dev server before starting the tests
  // Uses cloud Supabase database from .env.test
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Pass cloud Supabase credentials from .env.test to dev server
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || "",
      PUBLIC_SUPABASE_KEY: process.env.PUBLIC_SUPABASE_KEY || "",
      // Pass E2E test user credentials
      E2E_USERNAME: process.env.E2E_USERNAME || "",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "",
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID || "",
    },
  },
});
