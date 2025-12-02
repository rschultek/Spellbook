/**
 * DTO and Command Model Type Definitions
 *
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * used throughout the Spellbook application. All types are derived from
 * the database schema types to ensure type safety and consistency.
 *
 * @module types
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Database Type Aliases
// ============================================================================

/**
 * Snippet entity as stored in the database (complete row)
 */
export type Snippet = Database["public"]["Tables"]["snippets"]["Row"];

/**
 * Snippet data required for INSERT operations (auto-generated fields optional)
 */
export type SnippetInsert = Database["public"]["Tables"]["snippets"]["Insert"];

/**
 * Snippet data for UPDATE operations (all fields optional)
 */
export type SnippetUpdate = Database["public"]["Tables"]["snippets"]["Update"];

// ============================================================================
// Language Enum
// ============================================================================

/**
 * Allowed programming languages/snippet types
 * Matches database CHECK constraint on snippets.language column
 */
export type SnippetLanguage =
  | "Bash"
  | "CSS"
  | "Elixir"
  | "HTML"
  | "JavaScript"
  | "JSON"
  | "MySQL"
  | "Note"
  | "Other"
  | "PHP"
  | "Python"
  | "TypeScript"
  | "YAML";

// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * DTO for user registration
 * Used in signup form and auth.signUp() call
 */
export interface RegisterUserDto {
  email: string; // Valid email format, required
  password: string; // Minimum 6 characters (Supabase default)
}

/**
 * DTO for user login
 * Used in login form and auth.signInWithPassword() call
 */
export interface LoginUserDto {
  email: string; // Required
  password: string; // Required
}

/**
 * User session data returned by Supabase Auth
 * Represents authenticated user information
 */
export interface UserSession {
  user: {
    id: string; // UUID
    email: string;
    created_at: string; // ISO 8601 timestamp
  };
  session: {
    access_token: string; // JWT token
    refresh_token: string;
    expires_in: number; // Seconds
    token_type: "bearer";
  };
}

// ============================================================================
// Snippet Command Models (Create/Update)
// ============================================================================

/**
 * Command Model for creating a new snippet
 * Derived from SnippetInsert but excludes auto-generated fields
 * Used in create snippet form and API insert operation
 *
 * Validation rules (enforced by Zod schema + DB constraints):
 * - title: 1-200 chars, no whitespace-only
 * - content: min 1 char, no max limit
 * - description: max 500 chars, optional
 * - language: must be valid SnippetLanguage
 * - tags: optional array of strings
 */
export type CreateSnippetDto = Omit<SnippetInsert, "id" | "user_id" | "created_at" | "updated_at"> & {
  title: string; // Required, 1-200 characters
  content: string; // Required, minimum 1 character
  language: SnippetLanguage; // Required, constrained to enum
  description?: string | null; // Optional, max 500 characters
  tags?: string[]; // Optional, array of tag strings (note: null converted to empty array)
};

/**
 * Command Model for updating an existing snippet
 * All fields optional (partial update supported)
 * Excludes fields that cannot be modified by user
 *
 * Note: user_id, created_at cannot be changed
 * updated_at is automatically set by database trigger
 */
export type UpdateSnippetDto = Omit<SnippetUpdate, "id" | "user_id" | "created_at" | "updated_at"> & {
  title?: string; // 1-200 characters if provided
  content?: string; // Minimum 1 character if provided
  language?: SnippetLanguage; // Must be valid enum value if provided
  description?: string | null; // Max 500 characters if provided
  tags?: string[]; // Array of tag strings if provided
};

// ============================================================================
// Snippet Response DTOs
// ============================================================================

/**
 * Complete snippet data returned from API
 * Includes all fields from database row
 */
export type SnippetResponseDto = Snippet;

/**
 * Snippet data for list/card display
 * Includes all fields but typically only subset displayed in UI
 */
export type SnippetListItemDto = Snippet;

/**
 * Minimal snippet data for preview/card display
 * Used in snippet list grid view
 */
export type SnippetPreviewDto = Pick<Snippet, "id" | "title" | "language" | "tags" | "created_at"> & {
  content_preview: string; // First 100-150 characters of content
};

// ============================================================================
// Search and Filter DTOs
// ============================================================================

/**
 * DTO for full-text search query
 * Used in search bar input
 */
export interface SearchSnippetsDto {
  query: string; // Search term for full-text search
}

/**
 * DTO for filtering snippets by language
 * Used in language dropdown filter
 */
export interface FilterByLanguageDto {
  language: SnippetLanguage | "All"; // "All" shows all languages
}

/**
 * DTO for filtering snippets by tag
 * Used in tag filtering (v2 feature)
 */
export interface FilterByTagDto {
  tag: string; // Tag to filter by
}

/**
 * Combined search and filter parameters
 * Used when multiple filters are active
 */
export interface SnippetSearchFilters {
  query?: string; // Optional search term
  language?: SnippetLanguage; // Optional language filter
  tag?: string; // Optional tag filter (v2)
  sortBy?: "created_at" | "updated_at"; // Sort field (default: created_at)
  sortOrder?: "asc" | "desc"; // Sort direction (default: desc)
}

// ============================================================================
// API Response Wrappers
// ============================================================================

/**
 * Generic success response structure from Supabase
 */
export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
}

/**
 * Generic error response structure from Supabase
 */
export interface ApiErrorResponse {
  data: null;
  error: {
    message: string; // User-friendly error message
    status?: number; // HTTP status code
    code?: string; // Supabase error code
  };
}

/**
 * Union type for API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * List response with optional count
 */
export interface ApiListResponse<T> {
  data: T[];
  error: null;
  count?: number | null; // Total count if requested
}

// ============================================================================
// Form Data Types (Client-Side)
// ============================================================================

/**
 * Form data for snippet creation
 * Used with React Hook Form and Zod validation
 * Matches CreateSnippetDto structure for form binding
 */
export type SnippetFormData = CreateSnippetDto;

/**
 * Form data for snippet editing
 * All fields present (populated from existing snippet) but submit as partial
 */
export type SnippetEditFormData = Required<Omit<UpdateSnippetDto, "tags">> & {
  tags: string[]; // Always array, never null in form
};

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error structure for form fields
 */
export interface ValidationError {
  field: string; // Field name that has error
  message: string; // User-friendly error message
}

/**
 * Form validation state
 */
export interface FormValidationState {
  isValid: boolean;
  errors: ValidationError[];
  isDirty: boolean; // Has form been modified
  isSubmitting: boolean; // Is form currently submitting
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * URL query parameters for snippet list page
 * Used for shareable/bookmarkable filtered views
 */
export interface SnippetListQueryParams {
  q?: string; // Search query
  lang?: SnippetLanguage; // Language filter
  tag?: string; // Tag filter
}

/**
 * Pagination parameters (v2 feature)
 * Not used in MVP but included for future extension
 */
export interface PaginationParams {
  page?: number; // Page number (1-indexed)
  limit?: number; // Items per page
  offset?: number; // Alternative to page number
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract ID type from snippet
 */
export type SnippetId = Snippet["id"];

/**
 * Extract user ID type
 */
export type UserId = Snippet["user_id"];

/**
 * Timestamp string (ISO 8601 format)
 */
export type Timestamp = string;

/**
 * Type guard to check if response is error
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.error !== null;
}

/**
 * Type guard to check if response is success
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.error === null;
}

// ============================================================================
// Supabase SDK Helper Types
// ============================================================================

/**
 * Type for Supabase query builder result
 * Used when working directly with Supabase SDK
 */
export type SupabaseQueryResult<T> = { data: T; error: null } | { data: null; error: Error };

/**
 * Type for Supabase auth response
 */
export type SupabaseAuthResult =
  | { data: UserSession; error: null }
  | { data: { user: null; session: null }; error: Error };

// ============================================================================
// Constants
// ============================================================================

/**
 * All available snippet languages as readonly array
 * Useful for dropdown options and validation
 */
export const SNIPPET_LANGUAGES: readonly SnippetLanguage[] = [
  "Bash",
  "CSS",
  "Elixir",
  "HTML",
  "JavaScript",
  "JSON",
  "MySQL",
  "Note",
  "Other",
  "PHP",
  "Python",
  "TypeScript",
  "YAML",
] as const;

/**
 * Validation constraints matching database schema
 */
export const VALIDATION_CONSTRAINTS = {
  title: {
    min: 1,
    max: 200,
  },
  content: {
    min: 1,
  },
  description: {
    max: 500,
  },
  password: {
    min: 6, // Supabase default
  },
} as const;

/**
 * Default values for forms
 */
export const DEFAULT_SNIPPET_VALUES: CreateSnippetDto = {
  title: "",
  content: "",
  language: "Other",
  description: null,
  tags: [],
};

// ============================================================================
// OpenRouter AI Service Types
// ============================================================================

export * from "./types/openrouter.types";
