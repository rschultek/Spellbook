# Snippets Implementation Plan

> **Architecture**: Hybrid - Supabase SDK + Services Layer  
> **Status**: Ready for Implementation  
> **Last Updated**: 2025-11-27

---

## Table of Contents

1. [Overview](#overview)
2. [Shared Patterns](#shared-patterns)
3. [Create Snippet](#1-create-snippet)
4. [List All Snippets](#2-list-all-snippets)
5. [Get Single Snippet](#3-get-single-snippet)
6. [Update Snippet](#4-update-snippet)
7. [Delete Snippet](#5-delete-snippet)
8. [Search Snippets](#6-search-snippets)
9. [Filter by Language](#7-filter-by-language)
10. [Testing Strategy](#testing-strategy)

---

## Overview

### Purpose

Implement complete CRUD operations for code snippets with search, filtering, and proper data validation using Supabase and Row Level Security.

### Key Technologies

- **Supabase SDK**: Database operations with RLS
- **Zod**: Input validation
- **React Hook Form**: Form state management
- **Astro Pages**: Server-side rendering

### Architecture Pattern

```
┌─────────────────┐
│  Astro Pages    │ ← User interaction
│  (/snippets/*)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ React Components│ ← Forms, lists, cards
│  (SnippetForm)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Snippets Service│ ← Business logic
│ (src/lib/)      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Supabase Client │ ← Database + RLS
│ (context.locals)│
└─────────────────┘
```

---

## Shared Patterns

### File Structure

```
src/
├── lib/
│   ├── services/
│   │   └── snippets.service.ts      # Snippets business logic
│   └── validation/
│       └── snippet.schemas.ts       # Zod validation schemas
├── pages/
│   ├── snippets/
│   │   ├── index.astro              # List view
│   │   ├── new.astro                # Create form
│   │   ├── [id].astro               # Detail view
│   │   └── [id]/
│   │       └── edit.astro           # Edit form
├── components/
│   └── snippets/
│       ├── SnippetForm.tsx          # Create/Edit form
│       ├── SnippetCard.tsx          # List item card
│       ├── SnippetDetail.tsx        # Detail view
│       ├── SnippetList.tsx          # List grid
│       ├── SearchBar.tsx            # Search input
│       ├── LanguageFilter.tsx       # Language dropdown
│       └── DeleteConfirmModal.tsx   # Delete confirmation
└── types.ts                         # DTOs (already exists)
```

### Common Validation Schemas

**File**: `src/lib/validation/snippet.schemas.ts`

```typescript
import { z } from "zod";
import { SNIPPET_LANGUAGES, VALIDATION_CONSTRAINTS } from "../../types";

/**
 * Snippet creation validation schema
 * Matches CreateSnippetDto and database constraints
 */
export const createSnippetSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_CONSTRAINTS.title.min, "Title is required")
    .max(VALIDATION_CONSTRAINTS.title.max, `Title must be ${VALIDATION_CONSTRAINTS.title.max} characters or less`)
    .refine((s) => s.trim().length > 0, "Title cannot be whitespace only"),

  content: z.string().min(VALIDATION_CONSTRAINTS.content.min, "Content is required"),

  language: z.enum(SNIPPET_LANGUAGES as any, {
    errorMap: () => ({ message: "Please select a language" }),
  }),

  description: z
    .string()
    .max(
      VALIDATION_CONSTRAINTS.description.max,
      `Description must be ${VALIDATION_CONSTRAINTS.description.max} characters or less`
    )
    .optional()
    .nullable(),

  tags: z.array(z.string()).default([]),
});

/**
 * Snippet update validation schema
 * All fields optional (partial update)
 */
export const updateSnippetSchema = createSnippetSchema.partial();

/**
 * Search query validation schema
 */
export const searchQuerySchema = z.object({
  query: z.string().optional(),
  language: z.enum([...SNIPPET_LANGUAGES, "All"] as any).optional(),
});
```

### Snippets Service Base

**File**: `src/lib/services/snippets.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateSnippetDto, UpdateSnippetDto, SnippetResponseDto, SnippetLanguage } from "../../types";

/**
 * Snippets service
 * Handles all snippet-related business logic
 * RLS automatically filters by user_id
 */
export class SnippetsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new snippet
   * RLS automatically sets user_id from JWT
   */
  async create(dto: CreateSnippetDto): Promise<SnippetResponseDto> {
    const { data, error } = await this.supabase
      .from("snippets")
      .insert({
        title: dto.title,
        content: dto.content,
        language: dto.language,
        description: dto.description || null,
        tags: dto.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error("[SnippetsService] Create error:", error);
      throw this.mapError(error);
    }

    return data;
  }

  /**
   * Get all snippets for current user
   * Sorted by newest first
   */
  async getAll(): Promise<SnippetResponseDto[]> {
    const { data, error } = await this.supabase.from("snippets").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("[SnippetsService] GetAll error:", error);
      throw this.mapError(error);
    }

    return data || [];
  }

  /**
   * Get single snippet by ID
   * RLS ensures user can only access their own
   */
  async getById(id: string): Promise<SnippetResponseDto | null> {
    const { data, error } = await this.supabase.from("snippets").select("*").eq("id", id).single();

    if (error) {
      // 404 if not found or belongs to another user
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[SnippetsService] GetById error:", error);
      throw this.mapError(error);
    }

    return data;
  }

  /**
   * Update snippet
   * RLS ensures only owner can update
   */
  async update(id: string, dto: UpdateSnippetDto): Promise<SnippetResponseDto> {
    const { data, error } = await this.supabase
      .from("snippets")
      .update({
        ...dto,
        // updated_at set automatically by DB trigger
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[SnippetsService] Update error:", error);
      throw this.mapError(error);
    }

    return data;
  }

  /**
   * Delete snippet
   * RLS ensures only owner can delete
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("snippets").delete().eq("id", id);

    if (error) {
      console.error("[SnippetsService] Delete error:", error);
      throw this.mapError(error);
    }
  }

  /**
   * Search snippets by query
   * Full-text search in title and content
   */
  async search(query: string): Promise<SnippetResponseDto[]> {
    // Using textSearch for full-text search
    const { data, error } = await this.supabase
      .from("snippets")
      .select("*")
      .textSearch("title,content", query, {
        type: "websearch",
        config: "english",
      })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SnippetsService] Search error:", error);
      throw this.mapError(error);
    }

    return data || [];
  }

  /**
   * Filter snippets by language
   */
  async filterByLanguage(language: SnippetLanguage): Promise<SnippetResponseDto[]> {
    const { data, error } = await this.supabase
      .from("snippets")
      .select("*")
      .eq("language", language)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SnippetsService] FilterByLanguage error:", error);
      throw this.mapError(error);
    }

    return data || [];
  }

  /**
   * Combined search and filter
   */
  async searchAndFilter(query?: string, language?: SnippetLanguage): Promise<SnippetResponseDto[]> {
    let supabaseQuery = this.supabase.from("snippets").select("*");

    // Apply search if provided
    if (query && query.trim()) {
      supabaseQuery = supabaseQuery.textSearch("title,content", query, {
        type: "websearch",
        config: "english",
      });
    }

    // Apply language filter if provided
    if (language) {
      supabaseQuery = supabaseQuery.eq("language", language);
    }

    // Always sort by newest first
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false });

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error("[SnippetsService] SearchAndFilter error:", error);
      throw this.mapError(error);
    }

    return data || [];
  }

  /**
   * Map Supabase errors to user-friendly messages
   */
  private mapError(error: any): Error {
    const errorMessages: Record<string, string> = {
      "23505": "A snippet with this title already exists",
      "23514": "Invalid data. Please check your input.",
      "42501": "You don't have permission to perform this action",
      PGRST116: "Snippet not found",
    };

    const message = errorMessages[error.code] || error.message || "An error occurred. Please try again.";
    return new Error(message);
  }
}
```

---

## 1. Create Snippet

### 1.1 Endpoint Overview

- **Purpose**: Create new code snippet
- **Method**: `supabase.from('snippets').insert()`
- **Success**: Snippet created, redirect to list
- **Validation**: Client (Zod) + Database (constraints) + RLS

### 1.2 Request Details

**DTO**: `CreateSnippetDto`

```typescript
{
  title: string;              // 1-200 chars, no whitespace-only
  content: string;            // Min 1 char
  language: SnippetLanguage;  // Enum value
  description?: string;       // Max 500 chars, optional
  tags?: string[];           // Array of strings, optional
}
```

### 1.3 Response Details

**Success (201)**:

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
    updated_at: string
  }],
  error: null
}
```

**Error Codes**:

- `400`: Validation error
- `401`: Not authenticated
- `403`: RLS policy violation
- `422`: Database constraint violation

### 1.4 Implementation Steps

#### Step 1: Create New Snippet Page

**File**: `src/pages/snippets/new.astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import SnippetForm from "../../components/snippets/SnippetForm";

// Require authentication
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (!session) {
  return Astro.redirect("/login");
}
---

<Layout title="New Snippet - Spellbook">
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">Create New Snippet</h1>
      <a href="/snippets" class="text-blue-600 hover:underline"> ← Back to snippets </a>
    </div>

    <SnippetForm client:load mode="create" />
  </div>
</Layout>
```

#### Step 2: Create Snippet Form Component

**File**: `src/components/snippets/SnippetForm.tsx`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSnippetSchema } from "../../lib/validation/snippet.schemas";
import { SnippetsService } from "../../lib/services/snippets.service";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { SNIPPET_LANGUAGES } from "../../types";
import type { CreateSnippetDto, SnippetResponseDto } from "../../types";

interface Props {
  mode: "create" | "edit";
  initialData?: SnippetResponseDto;
}

export default function SnippetForm({ mode, initialData }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createSnippetSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          content: initialData.content,
          language: initialData.language,
          description: initialData.description,
          tags: initialData.tags || [],
        }
      : {
          title: "",
          content: "",
          language: "Other",
          description: "",
          tags: [],
        },
  });

  const onSubmit = async (data: any) => {
    try {
      const supabase = (window as any).supabase;
      const service = new SnippetsService(supabase);

      const dto: CreateSnippetDto = {
        title: data.title,
        content: data.content,
        language: data.language,
        description: data.description || null,
        tags: data.tags || [],
      };

      if (mode === "create") {
        await service.create(dto);
        toast.success("Snippet created successfully!");
        window.location.href = "/snippets";
      } else {
        await service.update(initialData!.id, dto);
        toast.success("Snippet updated successfully!");
        window.location.href = `/snippets/${initialData!.id}`;
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(`Failed to ${mode} snippet`);
      }
      console.error(`${mode} snippet error:`, error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title *
        </label>
        <input
          {...register("title")}
          type="text"
          id="title"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="My awesome snippet"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Language */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium mb-1">
          Language *
        </label>
        <select
          {...register("language")}
          id="language"
          className="w-full px-3 py-2 border rounded-md"
        >
          {SNIPPET_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        {errors.language && (
          <p className="text-red-500 text-sm mt-1">{errors.language.message}</p>
        )}
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">
          Content *
        </label>
        <textarea
          {...register("content")}
          id="content"
          rows={15}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="Enter your code or note here..."
        />
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Brief description of this snippet..."
          maxLength={500}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-1">
          Tags <span className="text-gray-500">(optional, comma-separated)</span>
        </label>
        <input
          {...register("tags", {
            setValueAs: (v) =>
              v ? v.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          })}
          type="text"
          id="tags"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="api, authentication, utility"
        />
        {errors.tags && (
          <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
            ? "Create Snippet"
            : "Update Snippet"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

### 1.5 Security Considerations

- ✅ RLS automatically sets `user_id` from JWT
- ✅ Title whitespace validation prevents empty titles
- ✅ XSS protection: React auto-escapes output
- ✅ SQL injection: Supabase uses parameterized queries

---

## 2. List All Snippets

### 2.1 Endpoint Overview

- **Purpose**: Display all user's snippets
- **Method**: `supabase.from('snippets').select()`
- **Sorting**: `created_at DESC` (newest first)
- **RLS**: Automatic filtering by `user_id`

### 2.2 Implementation Steps

#### Step 1: Create Snippets List Page

**File**: `src/pages/snippets/index.astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import SnippetList from "../../components/snippets/SnippetList";
import SearchBar from "../../components/snippets/SearchBar";
import LanguageFilter from "../../components/snippets/LanguageFilter";
import { SnippetsService } from "../../lib/services/snippets.service";

// Require authentication
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (!session) {
  return Astro.redirect("/login");
}

// Get query parameters
const searchQuery = Astro.url.searchParams.get("q") || "";
const languageFilter = Astro.url.searchParams.get("lang") || "All";

// Fetch snippets
const service = new SnippetsService(Astro.locals.supabase);
let snippets;

if (searchQuery || (languageFilter && languageFilter !== "All")) {
  snippets = await service.searchAndFilter(
    searchQuery || undefined,
    languageFilter !== "All" ? (languageFilter as any) : undefined
  );
} else {
  snippets = await service.getAll();
}
---

<Layout title="My Snippets - Spellbook">
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">My Snippets</h1>
      <a href="/snippets/new" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"> + New Snippet </a>
    </div>

    {/* Search and Filter */}
    <div class="mb-6 flex gap-4">
      <SearchBar client:load initialQuery={searchQuery} />
      <LanguageFilter client:load initialLanguage={languageFilter} />
    </div>

    {/* Results count */}
    {
      (searchQuery || languageFilter !== "All") && (
        <p class="text-gray-600 mb-4">
          Found {snippets.length} snippet{snippets.length !== 1 ? "s" : ""}
          {languageFilter !== "All" && ` in ${languageFilter}`}
          {searchQuery && ` matching "${searchQuery}"`}
          <a href="/snippets" class="ml-2 text-blue-600 hover:underline">
            Clear filters
          </a>
        </p>
      )
    }

    {/* Snippet List */}
    <SnippetList snippets={snippets} />
  </div>
</Layout>
```

#### Step 2: Create Snippet List Component

**File**: `src/components/snippets/SnippetList.tsx`

```typescript
import SnippetCard from "./SnippetCard";
import type { SnippetResponseDto } from "../../types";

interface Props {
  snippets: SnippetResponseDto[];
}

export default function SnippetList({ snippets }: Props) {
  if (snippets.length === 0) {
    return (
      <div class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No snippets</h3>
        <p class="mt-1 text-sm text-gray-500">
          Get started by creating your first snippet
        </p>
        <div class="mt-6">
          <a
            href="/snippets/new"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            + Add your first snippet
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} />
      ))}
    </div>
  );
}
```

#### Step 3: Create Snippet Card Component

**File**: `src/components/snippets/SnippetCard.tsx`

```typescript
import type { SnippetResponseDto } from "../../types";

interface Props {
  snippet: SnippetResponseDto;
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "bg-yellow-100 text-yellow-800",
  TypeScript: "bg-blue-100 text-blue-800",
  Python: "bg-green-100 text-green-800",
  PHP: "bg-purple-100 text-purple-800",
  Bash: "bg-gray-100 text-gray-800",
  CSS: "bg-pink-100 text-pink-800",
  HTML: "bg-orange-100 text-orange-800",
  JSON: "bg-teal-100 text-teal-800",
  MySQL: "bg-indigo-100 text-indigo-800",
  Note: "bg-amber-100 text-amber-800",
  Other: "bg-slate-100 text-slate-800",
};

export default function SnippetCard({ snippet }: Props) {
  const colorClass = LANGUAGE_COLORS[snippet.language] || LANGUAGE_COLORS.Other;
  const preview = snippet.content.substring(0, 150);
  const needsEllipsis = snippet.content.length > 150;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <a
      href={`/snippets/${snippet.id}`}
      class="block p-6 bg-white border rounded-lg hover:shadow-lg transition-shadow"
    >
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-semibold truncate flex-1">{snippet.title}</h3>
        <span class={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
          {snippet.language}
        </span>
      </div>

      {snippet.description && (
        <p class="text-gray-600 text-sm mb-3">{snippet.description}</p>
      )}

      <pre class="bg-gray-50 p-3 rounded text-xs font-mono overflow-hidden mb-3">
        <code class="text-gray-700">
          {preview}
          {needsEllipsis && "..."}
        </code>
      </pre>

      {snippet.tags && snippet.tags.length > 0 && (
        <div class="flex flex-wrap gap-2 mb-3">
          {snippet.tags.map((tag) => (
            <span
              key={tag}
              class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p class="text-xs text-gray-500">
        Created {formatDate(snippet.created_at)}
      </p>
    </a>
  );
}
```

---

## 3. Get Single Snippet

### 3.1 Implementation Steps

#### Step 1: Create Snippet Detail Page

**File**: `src/pages/snippets/[id].astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import SnippetDetail from "../../components/snippets/SnippetDetail";
import { SnippetsService } from "../../lib/services/snippets.service";

// Require authentication
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (!session) {
  return Astro.redirect("/login");
}

// Get snippet ID from URL
const { id } = Astro.params;

// Fetch snippet
const service = new SnippetsService(Astro.locals.supabase);
const snippet = await service.getById(id!);

// 404 if not found (or belongs to another user due to RLS)
if (!snippet) {
  return Astro.redirect("/snippets");
}
---

<Layout title={`${snippet.title} - Spellbook`}>
  <SnippetDetail snippet={snippet} client:load />
</Layout>
```

#### Step 2: Create Snippet Detail Component

**File**: `src/components/snippets/SnippetDetail.tsx`

```typescript
import { useState } from "react";
import { Button } from "../ui/button";
import DeleteConfirmModal from "./DeleteConfirmModal";
import type { SnippetResponseDto } from "../../types";

interface Props {
  snippet: SnippetResponseDto;
}

export default function SnippetDetail({ snippet }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(snippet.content);
    // Show toast notification
    const toast = (window as any).toast;
    if (toast) {
      toast.success("Copied to clipboard!");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <a href="/snippets" class="text-blue-600 hover:underline">
          ← Back to snippets
        </a>
        <div class="flex gap-2">
          <a href={`/snippets/${snippet.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </a>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Title and Language */}
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">{snippet.title}</h1>
        <div class="flex items-center gap-4 text-sm text-gray-600">
          <span class="font-medium">{snippet.language}</span>
          <span>Created {formatDate(snippet.created_at)}</span>
          {snippet.updated_at !== snippet.created_at && (
            <span>Updated {formatDate(snippet.updated_at)}</span>
          )}
        </div>
      </div>

      {/* Description */}
      {snippet.description && (
        <p class="text-gray-700 mb-6">{snippet.description}</p>
      )}

      {/* Tags */}
      {snippet.tags && snippet.tags.length > 0 && (
        <div class="flex flex-wrap gap-2 mb-6">
          {snippet.tags.map((tag) => (
            <span
              key={tag}
              class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div class="relative">
        <Button
          onClick={copyToClipboard}
          class="absolute top-4 right-4"
          variant="secondary"
          size="sm"
        >
          📋 Copy
        </Button>
        <pre class="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
          <code class="font-mono text-sm">{snippet.content}</code>
        </pre>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        snippet={snippet}
      />
    </div>
  );
}
```

---

## 4. Update Snippet

### 4.1 Implementation Steps

**File**: `src/pages/snippets/[id]/edit.astro`

```astro
---
import Layout from "../../../layouts/Layout.astro";
import SnippetForm from "../../../components/snippets/SnippetForm";
import { SnippetsService } from "../../../lib/services/snippets.service";

// Require authentication
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (!session) {
  return Astro.redirect("/login");
}

// Get snippet
const { id } = Astro.params;
const service = new SnippetsService(Astro.locals.supabase);
const snippet = await service.getById(id!);

if (!snippet) {
  return Astro.redirect("/snippets");
}
---

<Layout title={`Edit ${snippet.title} - Spellbook`}>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">Edit Snippet</h1>
      <a href={`/snippets/${snippet.id}`} class="text-blue-600 hover:underline"> ← Back to details </a>
    </div>

    <SnippetForm client:load mode="edit" initialData={snippet} />
  </div>
</Layout>
```

(Form component already handles both create and edit modes)

---

## 5. Delete Snippet

### 5.1 Implementation Steps

**File**: `src/components/snippets/DeleteConfirmModal.tsx`

```typescript
import { Button } from "../ui/button";
import { SnippetsService } from "../../lib/services/snippets.service";
import { toast } from "sonner";
import type { SnippetResponseDto } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  snippet: SnippetResponseDto;
}

export default function DeleteConfirmModal({ isOpen, onClose, snippet }: Props) {
  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      const supabase = (window as any).supabase;
      const service = new SnippetsService(supabase);

      await service.delete(snippet.id);

      toast.success("Snippet deleted successfully!");
      window.location.href = "/snippets";
    } catch (error) {
      toast.error("Failed to delete snippet");
      console.error("Delete error:", error);
    }
  };

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">Delete Snippet</h2>
        <p class="text-gray-700 mb-6">
          Are you sure you want to delete "<strong>{snippet.title}</strong>"?
          This action cannot be undone.
        </p>
        <div class="flex gap-4 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Search Snippets

### 6.1 Implementation Steps

**File**: `src/components/snippets/SearchBar.tsx`

```typescript
import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce"; // You'll need to create this hook

interface Props {
  initialQuery?: string;
}

export default function SearchBar({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300); // 300ms debounce

  useEffect(() => {
    // Update URL with search query
    const url = new URL(window.location.href);
    if (debouncedQuery) {
      url.searchParams.set("q", debouncedQuery);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState({}, "", url);

    // Reload page to fetch new results
    if (debouncedQuery !== initialQuery) {
      window.location.href = url.toString();
    }
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery("");
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    window.location.href = url.toString();
  };

  return (
    <div class="relative flex-1">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search snippets..."
        class="w-full px-4 py-2 pl-10 pr-10 border rounded-md"
      />
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {query && (
        <button
          onClick={handleClear}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

**File**: `src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 7. Filter by Language

### 7.1 Implementation Steps

**File**: `src/components/snippets/LanguageFilter.tsx`

```typescript
import { SNIPPET_LANGUAGES } from "../../types";

interface Props {
  initialLanguage?: string;
}

export default function LanguageFilter({ initialLanguage = "All" }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    const url = new URL(window.location.href);

    if (lang === "All") {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", lang);
    }

    window.location.href = url.toString();
  };

  return (
    <select
      value={initialLanguage}
      onChange={handleChange}
      class="px-4 py-2 border rounded-md"
    >
      <option value="All">All Languages</option>
      {SNIPPET_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  );
}
```

---

## Testing Strategy

### Manual Testing Checklist

#### Create Snippet

- [ ] Navigate to `/snippets/new`
- [ ] Try submitting without title → Should show error
- [ ] Try submitting without content → Should show error
- [ ] Try title > 200 chars → Should show error
- [ ] Try description > 500 chars → Should show error
- [ ] Create valid snippet → Should redirect to `/snippets`
- [ ] Verify snippet appears in list

#### List Snippets

- [ ] Navigate to `/snippets`
- [ ] Verify all snippets shown
- [ ] Verify sorted by newest first
- [ ] Verify empty state when no snippets
- [ ] Click snippet card → Should go to detail page

#### View Snippet

- [ ] Click snippet from list
- [ ] Verify all fields displayed correctly
- [ ] Click copy button → Should copy content
- [ ] Try accessing another user's snippet ID → Should redirect (RLS)

#### Update Snippet

- [ ] Click Edit on detail page
- [ ] Update fields → Should save and redirect
- [ ] Try clearing required field → Should show error

#### Delete Snippet

- [ ] Click Delete on detail page
- [ ] Cancel in modal → Should close modal
- [ ] Confirm delete → Should redirect to list
- [ ] Verify snippet removed from list

#### Search

- [ ] Enter search query → Should filter results
- [ ] Clear search → Should show all snippets
- [ ] Search for non-existent term → Should show empty state

#### Filter

- [ ] Select language from dropdown → Should filter
- [ ] Combine search + filter → Should work together
- [ ] Select "All" → Should show all snippets

### Performance Testing

- [ ] Create 50+ snippets
- [ ] Verify list loads < 2 seconds
- [ ] Verify search responds < 500ms
- [ ] Check browser console for errors

---

## Performance Considerations

### Optimization Strategies

1. **Indexing**: Database indexes already defined in schema
   - `idx_snippets_user_created` for main list query
   - `idx_snippets_search` for full-text search
   - `idx_snippets_language` for language filter

2. **Pagination**: Not in MVP but architecture supports it

   ```typescript
   // Example for v2
   .range(startIndex, endIndex)
   ```

3. **Debouncing**: Search input debounced 300ms

4. **Server-Side Rendering**: Astro pages render on server

### Known Limitations

- No pagination (acceptable for ~200 snippets)
- Full page reload for search/filter (can be improved with Astro View Transitions)
- No infinite scroll (can add in v2)

---

## Implementation Checklist

- [ ] Create validation schemas (`src/lib/validation/snippet.schemas.ts`)
- [ ] Create SnippetsService (`src/lib/services/snippets.service.ts`)
- [ ] Create snippets index page (`src/pages/snippets/index.astro`)
- [ ] Create new snippet page (`src/pages/snippets/new.astro`)
- [ ] Create snippet detail page (`src/pages/snippets/[id].astro`)
- [ ] Create edit snippet page (`src/pages/snippets/[id]/edit.astro`)
- [ ] Create SnippetForm component (`src/components/snippets/SnippetForm.tsx`)
- [ ] Create SnippetList component (`src/components/snippets/SnippetList.tsx`)
- [ ] Create SnippetCard component (`src/components/snippets/SnippetCard.tsx`)
- [ ] Create SnippetDetail component (`src/components/snippets/SnippetDetail.tsx`)
- [ ] Create SearchBar component (`src/components/snippets/SearchBar.tsx`)
- [ ] Create LanguageFilter component (`src/components/snippets/LanguageFilter.tsx`)
- [ ] Create DeleteConfirmModal component (`src/components/snippets/DeleteConfirmModal.tsx`)
- [ ] Create useDebounce hook (`src/hooks/useDebounce.ts`)
- [ ] Add toast notification library (Sonner)
- [ ] Test all CRUD operations
- [ ] Test search functionality
- [ ] Test language filter
- [ ] Test RLS (try accessing other user's snippets)

---

**End of Snippets Implementation Plan**
