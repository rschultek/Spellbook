/**
 * Test user credentials interface
 */
export interface TestUser {
  email: string;
  password: string;
  userId?: string;
}

/**
 * Test user credentials loaded from .env.test
 *
 * To use these credentials in tests:
 * - E2E_USERNAME: test@e2e.com
 * - E2E_PASSWORD: teste2e
 * - E2E_USERNAME_ID: 825b6ffe-c0a8-4c07-a7b1-497370754915
 */
export const testUsers = {
  /**
   * Valid E2E test user from .env.test
   */
  valid: {
    email: process.env.E2E_USERNAME || "test@e2e.com",
    password: process.env.E2E_PASSWORD || "teste2e",
    userId: process.env.E2E_USERNAME_ID || "825b6ffe-c0a8-4c07-a7b1-497370754915",
  } as TestUser,

  /**
   * Invalid user for testing error scenarios
   */
  invalid: {
    email: "invalid@example.com",
    password: "wrongpassword",
  } as TestUser,

  /**
   * User with invalid email format
   */
  invalidEmail: {
    email: "not-an-email",
    password: "password123",
  } as TestUser,

  /**
   * User with empty credentials
   */
  empty: {
    email: "",
    password: "",
  } as TestUser,
} as const;

/**
 * Helper function to get a test user by type
 * @param type - Type of test user to retrieve
 */
export function getTestUser(type: keyof typeof testUsers): TestUser {
  return testUsers[type];
}
