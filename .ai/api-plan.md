# REST API Plan - Spellbook MVP

## Overview

This document outlines the complete REST API design for Spellbook MVP, a personal code snippet management application. The API is implemented using **Supabase SDK** (Backend-as-a-Service) with **PostgreSQL** database and automatic **Row Level Security (RLS)**.

**Architecture:** Astro 5 + Supabase SDK (not traditional REST endpoints)  
**Database:** PostgreSQL 15+ with RLS  
**Authentication:** Supabase Auth (JWT-based)  
**API Client:** @supabase/supabase-js SDK

> [!NOTE]
> This application uses Supabase SDK instead of traditional REST endpoints. All data operations are performed through the Supabase JavaScript client, which internally uses Supabase's auto-generated REST API (PostgREST). Authentication is handled via Supabase Auth with JWT tokens.

---

## 1. Resources

The API has two main resources:

### 1.1 Users Resource

- **Database:** `auth.users` (Supabase-managed)
- **Purpose:** User authentication and account management
- **Operations:** Register, login, logout, password reset, session management
- **Managed by:** Supabase Auth (automatic)

### 1.2 Snippets Resource

- **Database:** `public.snippets`
- **Purpose:** CRUD operations for code snippets
- **Operations:** Create, read, update, delete, search, filter
- **Security:** Row Level Security (users can only access their own snippets)

---

## 2. Authentication Endpoints

### 2.1 User Registration

**SDK Method:** `supabase.auth.signUp()`

**Request Payload:**

```typescript
{
  email: string,        // Valid email format, required
  password: string      // Minimum 6 characters (Supabase default)
}
```

**Response (Success):**

```typescript
{
  user: {
    id: string,               // UUID
    email: string,
    created_at: string,       // ISO 8601 timestamp
    // ... other Supabase user fields
  },
  session: {
    access_token: string,     // JWT token
    refresh_token: string,
    expires_in: number,
    token_type: "bearer"
  }
}
```

**Success Code:** 200 OK  
**Success Message:** User registered and automatically logged in

**Error Codes:**

- `400 Bad Request` - Invalid email format or password too short
- `422 Unprocessable Entity` - Email already registered
- `500 Internal Server Error` - Database or server error

**Error Response:**

```typescript
{
  error: {
    message: string,          // User-friendly error message
    status: number
  }
}
```

**Validation:**

- Email must be valid email format
- Password minimum 6 characters
- Email uniqueness enforced by database

**Post-Action:**

- User automatically logged in with session
- JWT token stored in cookies
- Redirect to `/snippets` page

---

### 2.2 User Login

**SDK Method:** `supabase.auth.signInWithPassword()`

**Request Payload:**

```typescript
{
  email: string,        // Required
  password: string      // Required
}
```

**Response (Success):**

```typescript
{
  user: {
    id: string,
    email: string,
    // ... other user fields
  },
  session: {
    access_token: string,
    refresh_token: string,
    expires_in: number,
    token_type: "bearer"
  }
}
```

**Success Code:** 200 OK  
**Success Message:** Login successful

**Error Codes:**

- `400 Bad Request` - Invalid credentials
- `401 Unauthorized` - Wrong email or password
- `500 Internal Server Error` - Server error

**Error Messages:**

- "Invalid email or password" - for security (don't reveal which is wrong)

**Post-Action:**

- Session established with JWT token
- Token auto-refresh enabled
- Redirect to `/snippets` or originally requested page

---

### 2.3 User Logout

**SDK Method:** `supabase.auth.signOut()`

**Request:** No payload required

**Response (Success):**

```typescript
{
  error: null;
}
```

**Success Code:** 200 OK  
**Success Message:** Logged out successfully

**Error Codes:**

- `500 Internal Server Error` - Server error

**Post-Action:**

- Session destroyed
- JWT token removed from cookies
- Redirect to `/login`

---

### 2.4 Password Reset Request

**SDK Method:** `supabase.auth.resetPasswordForEmail()`

**Request Payload:**

```typescript
{
  email: string,                    // Required
  options: {
    redirectTo: string              // URL to redirect after password reset
  }
}
```

**Response (Success):**

```typescript
{
  error: null;
}
```

**Success Code:** 200 OK  
**Success Message:** "Password reset email sent (if account exists)"

**Error Codes:**

- `400 Bad Request` - Invalid email format
- `500 Internal Server Error` - Email service error

**Notes:**

- Always returns success even if email doesn't exist (security best practice)
- Email contains secure reset link with token
- Handled entirely by Supabase Auth

---

### 2.5 Session Management

**SDK Method:** `supabase.auth.getSession()`

**Request:** No payload

**Response (Success):**

```typescript
{
  session: {
    access_token: string,
    refresh_token: string,
    expires_in: number,
    user: {
      id: string,
      email: string,
      // ... other fields
    }
  } | null
}
```

**Success Code:** 200 OK

**Auto-Refresh:**

- Supabase SDK automatically refreshes tokens before expiry
- Default token expiry: 3600 seconds (1 hour)
- Refresh token rotation enabled for security

---

## 3. Snippets Endpoints

All snippet operations use Supabase SDK methods. RLS policies automatically filter by authenticated user.

### 3.1 Create Snippet

**SDK Method:** `supabase.from('snippets').insert()`

**Request Payload:**

```typescript
{
  title: string,              // Required, 1-200 characters, no whitespace-only
  content: string,            // Required, minimum 1 character
  language: string,           // Required, must be from predefined list
  description?: string,       // Optional, max 500 characters
  tags?: string[]            // Optional, array of strings
}
```

**Predefined Languages:**

```typescript
type Language =
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
```

**Response (Success):**

```typescript
{
  data: [{
    id: string,                    // UUID auto-generated
    user_id: string,               // Auto-set from auth.uid()
    title: string,
    content: string,
    language: string,
    description: string | null,
    tags: string[],
    created_at: string,            // ISO 8601 timestamp
    updated_at: string             // ISO 8601 timestamp
  }],
  error: null
}
```

**Success Code:** 201 Created  
**Success Message:** "Snippet created successfully"

**Error Codes:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - RLS policy violation
- `422 Unprocessable Entity` - Database constraint violation
- `500 Internal Server Error` - Database error

**Error Messages:**

- "Title is required"
- "Title must be 200 characters or less"
- "Title cannot be whitespace only"
- "Content is required"
- "Please select a language"
- "Language must be one of: [list]"
- "Description must be 500 characters or less"

**Validation Rules:**

- **title:** Required, 1-200 chars, no whitespace-only, trim() !== ''
- **content:** Required, minimum 1 character, no max limit
- **description:** Optional, max 500 characters
- **language:** Required, must match CHECK constraint list
- **tags:** Optional, PostgreSQL array, no limit
- **user_id:** Automatically injected via RLS policy

**Client-Side Validation:** Zod schema + React Hook Form  
**Server-Side Validation:** PostgreSQL CHECK constraints + RLS policies

**Post-Action:**

- Toast notification: "Snippet created successfully"
- Redirect to `/snippets` (list view)

---

### 3.2 List All Snippets (Current User)

**SDK Method:** `supabase.from('snippets').select()`

**Query Parameters:** None (handled by RLS - automatic filtering by user_id)

**Request:** No payload

**Response (Success):**

```typescript
{
  data: [
    {
      id: string,
      user_id: string,
      title: string,
      content: string,
      language: string,
      description: string | null,
      tags: string[],
      created_at: string,
      updated_at: string
    },
    // ... more snippets
  ],
  error: null,
  count: number | null
}
```

**Default Sorting:** `created_at DESC` (newest first)

**SDK Implementation:**

```typescript
const { data, error } = await supabase.from("snippets").select("*").order("created_at", { ascending: false });
```

**Success Code:** 200 OK

**Error Codes:**

- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Database error

**Empty State:**

- Returns empty array `[]` when user has no snippets
- Frontend displays friendly empty state with "Add your first snippet" button

**Performance:**

- Index: `idx_snippets_user_created` on `(user_id, created_at DESC)`
- No pagination in MVP (acceptable for ~200 snippets)

---

### 3.3 Get Single Snippet

**SDK Method:** `supabase.from('snippets').select().eq('id', snippetId).single()`

**Path Parameter:** `snippetId` (UUID)

**Response (Success):**

```typescript
{
  data: {
    id: string,
    user_id: string,
    title: string,
    content: string,
    language: string,
    description: string | null,
    tags: string[],
    created_at: string,
    updated_at: string
  },
  error: null
}
```

**Success Code:** 200 OK

**Error Codes:**

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Snippet belongs to another user (RLS)
- `404 Not Found` - Snippet doesn't exist
- `500 Internal Server Error` - Database error

**Error Messages:**

- "Snippet not found" - either doesn't exist or belongs to another user

**Security:**

- RLS policy automatically filters by user_id
- Attempting to access another user's snippet returns empty result (403)

---

### 3.4 Update Snippet

**SDK Method:** `supabase.from('snippets').update().eq('id', snippetId)`

**Path Parameter:** `snippetId` (UUID)

**Request Payload:**

```typescript
{
  title?: string,              // Optional (partial update)
  content?: string,
  language?: string,
  description?: string | null,
  tags?: string[]
}
```

**Response (Success):**

```typescript
{
  data: [{
    id: string,
    user_id: string,
    title: string,
    content: string,
    language: string,
    description: string | null,
    tags: string[],
    created_at: string,
    updated_at: string          // Automatically updated via trigger
  }],
  error: null
}
```

**Success Code:** 200 OK  
**Success Message:** "Snippet updated successfully"

**Error Codes:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not owner of snippet (RLS)
- `404 Not Found` - Snippet doesn't exist
- `422 Unprocessable Entity` - Constraint violation
- `500 Internal Server Error` - Database error

**Validation Rules:**

- Same validation as Create endpoint
- All fields optional (partial update supported)
- At least one field must be provided

**Automatic Behavior:**

- `updated_at` automatically set to NOW() via PostgreSQL trigger
- `user_id` cannot be changed (RLS WITH CHECK policy)
- `created_at` remains unchanged

**Post-Action:**

- Toast notification: "Snippet updated successfully"
- Redirect to snippet details page `/snippets/:id`

---

### 3.5 Delete Snippet

**SDK Method:** `supabase.from('snippets').delete().eq('id', snippetId)`

**Path Parameter:** `snippetId` (UUID)

**Request:** No payload

**Response (Success):**

```typescript
{
  data: [],
  error: null,
  status: 204,
  statusText: "No Content"
}
```

**Success Code:** 204 No Content  
**Success Message:** "Snippet deleted successfully"

**Error Codes:**

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not owner of snippet (RLS)
- `404 Not Found` - Snippet doesn't exist
- `500 Internal Server Error` - Database error

**Confirmation Flow:**

1. User clicks "Delete" button on snippet details page
2. Modal displays confirmation: "Are you sure you want to delete '[title]'?"
3. User confirms or cancels
4. If confirmed, DELETE request sent
5. On success, redirect to `/snippets`

**Delete Type:** Hard delete (permanent, no soft delete in MVP)

**Security:**

- RLS policy ensures only owner can delete
- Cascade handled by foreign key: deleting user deletes all their snippets

**Post-Action:**

- Toast notification: "Snippet deleted successfully"
- Redirect to `/snippets` (list view)

---

### 3.6 Search Snippets (Full-Text Search)

**SDK Method:** `supabase.from('snippets').select().textSearch()`

**Query Parameters:**

- `query` (string, required) - Search term

**SDK Implementation:**

```typescript
const { data, error } = await supabase
  .from("snippets")
  .select("*")
  .textSearch("title,content", searchQuery, {
    type: "websearch",
    config: "english",
  })
  .order("created_at", { ascending: false });
```

**Alternative (using to_tsvector in RPC):**

```typescript
const { data, error } = await supabase.rpc("search_snippets", {
  search_query: searchTerm,
});
```

**Search Scope:**

- `title` - weighted highest (priority A)
- `description` - weighted medium (priority B)
- `content` - weighted lowest (priority C)

**Response (Success):**

```typescript
{
  data: [
    {
      id: string,
      user_id: string,
      title: string,
      content: string,
      language: string,
      description: string | null,
      tags: string[],
      created_at: string,
      updated_at: string
    },
    // ... matching snippets
  ],
  error: null
}
```

**Success Code:** 200 OK

**Search Behavior:**

- **Case-insensitive**
- **Stemming:** Uses English dictionary (e.g., "running" matches "run")
- **Live search:** Updates results as user types (debounced)
- **Partial matching:** Matches words anywhere in title/content
- **AND logic:** Multiple words all must match

**Index Used:** `idx_snippets_search` (GIN index on tsvector)

**Empty Results:**

```typescript
{
  data: [],
  error: null
}
```

**Frontend Display:**

- If no results: "No snippets found matching '[query]'"
- Clear search button to reset

**Performance:**

- GIN index ensures fast search even with 200+ snippets
- Query cached on browser for repeated searches

---

### 3.7 Filter Snippets by Language

**SDK Method:** `supabase.from('snippets').select().eq('language', language)`

**Query Parameters:**

- `language` (string, optional) - Filter by specific language

**SDK Implementation:**

```typescript
const { data, error } = await supabase
  .from("snippets")
  .select("*")
  .eq("language", selectedLanguage)
  .order("created_at", { ascending: false });
```

**Response (Success):**

```typescript
{
  data: [
    {
      id: string,
      title: string,
      content: string,
      language: string,  // All items have same language
      // ... other fields
    }
  ],
  error: null
}
```

**Success Code:** 200 OK

**Filter Options:**

- "All" - No filter, show all snippets
- "Bash", "CSS", "Elixir", "HTML", "JavaScript", "JSON", "MySQL", "Note", "Other", "PHP", "Python", "TypeScript", "YAML"

**Combination with Search:**

```typescript
const { data, error } = await supabase
  .from("snippets")
  .select("*")
  .eq("language", language)
  .textSearch("title,content", searchQuery)
  .order("created_at", { ascending: false });
```

**Index Used:** `idx_snippets_language` (B-tree index)

**Frontend:**

- Dropdown with all languages alphabetically sorted
- Display result count: "Showing 5 JavaScript snippets"
- "Clear filters" button to reset

---

### 3.8 Filter Snippets by Tag

**SDK Method:** `supabase.from('snippets').select().contains('tags', [tag])`

**Query Parameters:**

- `tag` (string, required) - Tag to filter by

**SDK Implementation:**

```typescript
const { data, error } = await supabase
  .from("snippets")
  .select("*")
  .contains("tags", [selectedTag])
  .order("created_at", { ascending: false });
```

**Alternative (using array operators):**

```typescript
const { data, error } = await supabase
  .from("snippets")
  .select("*")
  .filter("tags", "cs", `{${tag}}`) // Contains
  .order("created_at", { ascending: false });
```

**Response (Success):**

```typescript
{
  data: [
    {
      id: string,
      tags: string[],  // All items contain the filtered tag
      // ... other fields
    }
  ],
  error: null
}
```

**Success Code:** 200 OK

**Index Used:** `idx_snippets_tags` (GIN index for array operations)

**Notes:**

- Tag filtering not in MVP scope but architecture supports it
- Can be added in v2 with minimal changes

---

## 4. Authentication and Authorization

### 4.1 Authentication Mechanism

**Type:** JWT-based authentication via Supabase Auth

**Flow:**

1. User registers or logs in via Supabase Auth
2. Supabase returns JWT access token + refresh token
3. Tokens stored in HTTP-only cookies (secure)
4. Access token included in Authorization header for all requests
5. SDK automatically handles token refresh before expiry

**Token Storage:**

- Access token: HTTP-only cookie (XSS protection)
- Refresh token: HTTP-only cookie
- Never stored in localStorage (security best practice)

**Token Expiry:**

- Access token: 3600 seconds (1 hour)
- Refresh token: Auto-refresh enabled
- SDK handles refresh transparently

**Authentication Header:**

```
Authorization: Bearer <access_token>
```

**Session Persistence:**

- Session persists across page refreshes
- Automatic login if valid session exists
- Logout clears all tokens

---

### 4.2 Authorization (Row Level Security)

**Implementation:** PostgreSQL Row Level Security (RLS) policies

**Benefits:**

- Database-level enforcement (cannot be bypassed)
- Automatic filtering without application code
- Multi-tenant ready architecture

**RLS Policies:**

#### SELECT Policy

```sql
CREATE POLICY "Users can view their own snippets"
ON public.snippets
FOR SELECT
USING (auth.uid() = user_id);
```

**Effect:** Users can only SELECT rows where `user_id` matches their authenticated ID

---

#### INSERT Policy

```sql
CREATE POLICY "Users can insert their own snippets"
ON public.snippets
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Effect:** Users can only INSERT rows with their own `user_id`  
**Automatic:** SDK doesn't need to explicitly set `user_id` in INSERT payload

---

#### UPDATE Policy

```sql
CREATE POLICY "Users can update their own snippets"
ON public.snippets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Effect:**

- `USING` - Row must belong to user (existing record check)
- `WITH CHECK` - Modified row must still belong to user (prevents ownership transfer)

---

#### DELETE Policy

```sql
CREATE POLICY "Users can delete their own snippets"
ON public.snippets
FOR DELETE
USING (auth.uid() = user_id);
```

**Effect:** Users can only DELETE rows they own

---

### 4.3 Protected Routes

**Frontend Middleware:** Astro middleware checks session before rendering protected pages

```typescript
// src/middleware/index.ts
export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  if (context.url.pathname.startsWith("/snippets") && !session) {
    return context.redirect("/login");
  }

  return next();
});
```

**Protected Routes:**

- `/snippets` - List view
- `/snippets/new` - Create form
- `/snippets/:id` - Details view
- `/snippets/:id/edit` - Edit form

**Public Routes:**

- `/login` - Login page
- `/register` - Registration page
- `/reset-password` - Password reset page
- `/` - Landing page (if exists)

---

### 4.4 Security Features

**Password Security:**

- Hashed using bcrypt (Supabase automatic)
- Minimum 6 characters (configurable in Supabase settings)
- Never stored or transmitted in plain text
- Never logged or exposed in responses

**SQL Injection Protection:**

- Supabase SDK uses parameterized queries
- PostgreSQL prepared statements
- Input sanitization automatic

**XSS Protection:**

- React auto-escapes output
- HTTP-only cookies (no JavaScript access)
- Content Security Policy headers (optional enhancement)

**CSRF Protection:**

- SameSite cookie attribute
- Supabase handles CSRF tokens internally

**Rate Limiting:**

- Supabase free tier includes basic rate limiting
- 2 emails per hour for password reset
- API rate limits handled by Supabase

---

## 5. Validation and Business Logic

### 5.1 Multi-Layer Validation Strategy

The application implements three layers of validation for defense-in-depth:

#### Layer 1: Client-Side Validation (Zod + React Hook Form)

**Purpose:** Immediate user feedback, better UX

**Implementation:**

```typescript
import { z } from "zod";

const snippetSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .refine((s) => s.trim().length > 0, "Title cannot be whitespace only"),

  content: z.string().min(1, "Content is required"),

  description: z.string().max(500, "Description must be 500 characters or less").optional(),

  language: z.enum([
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
  ]),

  tags: z.array(z.string()).default([]),
});

type SnippetFormData = z.infer<typeof snippetSchema>;
```

**Validation Timing:**

- Real-time validation on field blur
- Final validation on form submit
- Submit button disabled while errors exist

**Error Display:**

- Red error messages below each field
- Field borders turn red for invalid inputs
- Error messages clear when field becomes valid

---

#### Layer 2: Database Constraints (PostgreSQL)

**Purpose:** Ultimate data integrity enforcement

**Title Validation:**

```sql
title TEXT NOT NULL
  CHECK (
    char_length(title) >= 1
    AND char_length(title) <= 200
    AND trim(title) != ''
  )
```

**Content Validation:**

```sql
content TEXT NOT NULL
  CHECK (char_length(content) >= 1)
```

**Description Validation:**

```sql
description TEXT
  CHECK (description IS NULL OR char_length(description) <= 500)
```

**Language Validation:**

```sql
language TEXT NOT NULL
  CHECK (language IN (
    'Bash', 'CSS', 'Elixir', 'HTML', 'JavaScript',
    'JSON', 'MySQL', 'Note', 'Other', 'PHP',
    'Python', 'TypeScript', 'YAML'
  ))
```

**Error Handling:**

- Constraint violations return 422 Unprocessable Entity
- Supabase SDK translates errors to JavaScript exceptions
- Frontend catches and displays user-friendly messages

---

#### Layer 3: Row Level Security Policies

**Purpose:** Authorization and data isolation

**User ID Validation:**

```sql
-- INSERT policy
WITH CHECK (auth.uid() = user_id)

-- UPDATE policy
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

**Automatic Behavior:**

- `user_id` automatically set from JWT token
- Users cannot create snippets for other users
- Users cannot modify snippet ownership

---

### 5.2 Validation Rules Reference

| Field       | Required | Min    | Max       | Additional Rules            | Client | Database | RLS |
| ----------- | -------- | ------ | --------- | --------------------------- | ------ | -------- | --- |
| title       | ✅       | 1 char | 200 chars | No whitespace-only, trimmed | ✅     | ✅       | -   |
| content     | ✅       | 1 char | No limit  | -                           | ✅     | ✅       | -   |
| description | ❌       | -      | 500 chars | Nullable                    | ✅     | ✅       | -   |
| language    | ✅       | -      | -         | Enum (13 values)            | ✅     | ✅       | -   |
| tags        | ❌       | -      | No limit  | Array of strings            | ✅     | -        | -   |
| user_id     | ✅       | -      | -         | Must match auth.uid()       | -      | ✅       | ✅  |

---

### 5.3 Business Logic Implementation

#### Automatic Timestamps

**created_at:**

- Auto-set on INSERT via `DEFAULT NOW()`
- Immutable (cannot be changed)
- Timezone-aware (TIMESTAMPTZ)

**updated_at:**

- Auto-set on INSERT via `DEFAULT NOW()`
- Auto-updated on UPDATE via PostgreSQL trigger
- Trigger: `update_snippets_updated_at`

**Trigger Implementation:**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_snippets_updated_at
BEFORE UPDATE ON public.snippets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

#### Search Logic

**Full-Text Search:**

- Uses PostgreSQL `to_tsvector` and `to_tsquery`
- English dictionary for word stemming
- Searches across: title + description + content
- Case-insensitive matching

**Search Index:**

```sql
CREATE INDEX idx_snippets_search
ON public.snippets
USING gin(
  to_tsvector('english',
    title || ' ' || COALESCE(description, '') || ' ' || content
  )
);
```

**Query Implementation:**

```typescript
// Using Supabase RPC for custom search
const { data, error } = await supabase.rpc("search_snippets", {
  search_query: userInput,
});
```

**RPC Function (server-side):**

```sql
CREATE FUNCTION search_snippets(search_query text)
RETURNS SETOF snippets AS $$
  SELECT * FROM snippets
  WHERE to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content)
    @@ to_tsquery('english', search_query)
    AND user_id = auth.uid()
  ORDER BY created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

#### Filtering Logic

**Language Filter:**

- Simple equality match: `WHERE language = ?`
- Uses B-tree index: `idx_snippets_language`

**Tag Filter:**

- Array containment: `WHERE tags @> ARRAY[?]`
- Uses GIN index: `idx_snippets_tags`

**Combined Filters:**

- Search + Language filter supported
- All filters automatically respect RLS (user_id)

---

#### Sorting Logic

**Default Sort:** `created_at DESC` (newest first)

**Index Optimization:**

- Composite index: `(user_id, created_at DESC)`
- Enables efficient sorted retrieval per user

---

### 5.4 Error Handling Strategy

#### Client-Side Errors

**Form Validation Errors:**

```typescript
// Display under field
<span className="text-red-500 text-sm">
  {errors.title?.message}
</span>
```

**Network Errors:**

```typescript
try {
  const { data, error } = await supabase.from("snippets").insert(values);
  if (error) throw error;

  toast.success("Snippet created successfully");
} catch (error) {
  if (error.message.includes("network")) {
    toast.error("Unable to connect. Please check your connection.");
  } else {
    toast.error("Something went wrong. Please try again.");
  }
  console.error("Error creating snippet:", error);
}
```

**Error Logging:**

- All errors logged to `console.error` with full details
- User sees friendly message
- Developer sees technical details in console

---

#### Server-Side Errors

**Database Constraint Violations:**

- 422 Unprocessable Entity
- Error translated to user-friendly message

**Authentication Errors:**

- 401 Unauthorized
- Redirect to `/login`

**Authorization Errors:**

- 403 Forbidden (RLS policy violation)
- Display "Access denied" or similar

**Not Found Errors:**

- 404 Not Found
- Display "Snippet not found"

---

#### User Feedback

**Success Messages (Toast):**

- "Snippet created successfully" - Green toast, 3s auto-dismiss
- "Snippet updated successfully" - Green toast, 3s auto-dismiss
- "Snippet deleted successfully" - Green toast, 3s auto-dismiss

**Error Messages (Toast):**

- "Failed to create snippet" - Red toast, 5s auto-dismiss
- "Failed to update snippet" - Red toast, 5s auto-dismiss
- "Unable to connect. Please check your connection." - Red toast, manual dismiss

**Loading States:**

- Skeleton screens for list loading
- Spinner in submit buttons during processing
- Disabled buttons during processing
- Loading indicator for search (if >200ms)

---

## 6. Performance Considerations

### 6.1 Database Indexes

All indexes defined in database schema for optimal performance:

| Index Name                | Type   | Columns                    | Purpose             |
| ------------------------- | ------ | -------------------------- | ------------------- |
| snippets_pkey             | B-tree | (id)                       | Primary key lookups |
| idx_snippets_user_created | B-tree | (user_id, created_at DESC) | Main list query     |
| idx_snippets_user_id      | B-tree | (user_id)                  | RLS filtering       |
| idx_snippets_language     | B-tree | (language)                 | Language filter     |
| idx_snippets_tags         | GIN    | (tags)                     | Tag filtering (v2)  |
| idx_snippets_search       | GIN    | (tsvector expression)      | Full-text search    |

---

### 6.2 Query Optimization

**List Query (Most Common):**

```sql
SELECT * FROM snippets
WHERE user_id = <auth.uid()>  -- Uses idx_snippets_user_created
ORDER BY created_at DESC;      -- Covered by same index
```

**Search Query:**

```sql
SELECT * FROM snippets
WHERE user_id = <auth.uid()>
  AND to_tsvector(...) @@ to_tsquery(...)  -- Uses idx_snippets_search
ORDER BY created_at DESC;
```

**Filter Query:**

```sql
SELECT * FROM snippets
WHERE user_id = <auth.uid()>
  AND language = 'JavaScript'  -- Uses idx_snippets_language
ORDER BY created_at DESC;
```

---

### 6.3 Performance Targets

**MVP Performance Goals:**

- Page load time: < 2 seconds
- Search response: < 500ms
- Form submission: < 1 second
- Time to interactive: < 3 seconds

**Acceptable for ~200 snippets without pagination**

---

## 7. API Summary Table

| Operation          | SDK Method                        | Auth Required | RLS Applied | Validation Layers |
| ------------------ | --------------------------------- | ------------- | ----------- | ----------------- |
| Register User      | `auth.signUp()`                   | ❌            | N/A         | Client + Server   |
| Login User         | `auth.signInWithPassword()`       | ❌            | N/A         | Server            |
| Logout User        | `auth.signOut()`                  | ✅            | N/A         | -                 |
| Reset Password     | `auth.resetPasswordForEmail()`    | ❌            | N/A         | Server            |
| Get Session        | `auth.getSession()`               | ❌            | N/A         | -                 |
| Create Snippet     | `from('snippets').insert()`       | ✅            | ✅          | Client + DB + RLS |
| List Snippets      | `from('snippets').select()`       | ✅            | ✅          | RLS               |
| Get Snippet        | `from('snippets').select().eq()`  | ✅            | ✅          | RLS               |
| Update Snippet     | `from('snippets').update().eq()`  | ✅            | ✅          | Client + DB + RLS |
| Delete Snippet     | `from('snippets').delete().eq()`  | ✅            | ✅          | RLS               |
| Search Snippets    | `from('snippets').textSearch()`   | ✅            | ✅          | RLS               |
| Filter by Language | `from('snippets').eq('language')` | ✅            | ✅          | RLS               |

---

## 8. Implementation Notes

### 8.1 Supabase Client Setup

**Client Initialization:**

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

**Environment Variables:**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
```

---

### 8.2 TypeScript Types

**Auto-Generated Types:**

```bash
npx supabase gen types typescript --project-id "your-project-id" > src/types/database.types.ts
```

**Usage:**

```typescript
import type { Database } from "../types/database.types";

type Snippet = Database["public"]["Tables"]["snippets"]["Row"];
type SnippetInsert = Database["public"]["Tables"]["snippets"]["Insert"];
type SnippetUpdate = Database["public"]["Tables"]["snippets"]["Update"];
```

---

### 8.3 Error Handling Pattern

```typescript
import { PostgrestError } from "@supabase/supabase-js";

async function createSnippet(data: SnippetInsert) {
  try {
    const { data: snippet, error } = await supabase.from("snippets").insert(data).select().single();

    if (error) {
      // Handle Supabase error
      console.error("Supabase error:", error);

      // Check error code
      if (error.code === "23505") {
        throw new Error("Duplicate snippet");
      } else if (error.code === "23514") {
        throw new Error("Validation constraint violation");
      }

      throw error;
    }

    return snippet;
  } catch (error) {
    // Handle network/unexpected errors
    if (error instanceof Error) {
      console.error("Error creating snippet:", error.message);
    }
    throw error;
  }
}
```

---

## 9. Future Enhancements (v2+)

Potential API additions not in MVP scope:

### 9.1 Tag Management API

- Get all unique tags for user
- Get tag usage counts
- Tag autocomplete

### 9.2 Bulk Operations API

- Bulk delete snippets
- Bulk update (change language for multiple)
- Export snippets to JSON/CSV

### 9.3 Advanced Search API

- Search by tags
- Date range filtering
- Regex search
- Multi-language search weights

### 9.4 Sharing API

- Generate public share link
- Revoke share link
- View public snippet (no auth)

### 9.5 AI Integration API

- Auto-detect language
- Translate snippet between languages
- Generate tags automatically
- Code explanation

---

## Document Metadata

**Version:** 1.0  
**Created:** 2025-11-27  
**Author:** API Architect  
**Status:** ✅ Approved - Ready for Implementation  
**Related Documents:**

- [Database Schema Plan](./db-plan.md)
- [Product Requirements](./prd.md)
- [Tech Stack](./tech-stack.md)

---

## Appendix: Common API Patterns

### Pattern 1: Protected Page Data Loading

```typescript
// In Astro page component
---
import { supabase } from '../lib/supabase';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  return Astro.redirect('/login');
}

const { data: snippets, error } = await supabase
  .from('snippets')
  .select('*')
  .order('created_at', { ascending: false });
---

<SnippetList snippets={snippets} />
```

### Pattern 2: Form Submission with Validation

```typescript
// In React component
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<SnippetFormData>({
  resolver: zodResolver(snippetSchema),
});

async function onSubmit(values: SnippetFormData) {
  try {
    const { error } = await supabase.from("snippets").insert(values);

    if (error) throw error;

    toast.success("Snippet created successfully");
    router.push("/snippets");
  } catch (error) {
    toast.error("Failed to create snippet");
    console.error(error);
  }
}
```

### Pattern 3: Real-time Search

```typescript
import { useDebouncedCallback } from "use-debounce";

const searchSnippets = useDebouncedCallback(
  async (query: string) => {
    const { data } = await supabase
      .from("snippets")
      .select("*")
      .textSearch("title,content", query)
      .order("created_at", { ascending: false });

    setResults(data ?? []);
  },
  300 // 300ms debounce
);
```
