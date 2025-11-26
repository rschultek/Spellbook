-- ============================================================================
-- migration: create_snippets_table
-- description: initial schema for spellbook mvp - snippets table with rls
-- created: 2025-11-26
-- ============================================================================
--
-- purpose:
--   - create public.snippets table for code snippet management
--   - establish row level security (rls) for multi-user data isolation
--   - add performance indexes for common query patterns
--   - implement auto-update trigger for updated_at timestamp
--
-- affected tables:
--   - public.snippets (new)
--
-- dependencies:
--   - auth.users (supabase managed table)
--
-- special notes:
--   - all sql written in lowercase per supabase best practices
--   - rls policies ensure users can only access their own snippets
--   - tags stored as postgresql array (gin indexed)
--   - full-text search enabled via gin index on tsvector expression
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- table: public.snippets
-- ----------------------------------------------------------------------------
-- purpose: store code snippets, notes, and queries for authenticated users
-- security: row level security enforced - users can only access their own data
-- performance: optimized for listing, searching, and filtering operations

create table public.snippets (
  -- primary key: auto-generated uuid
  id uuid primary key default gen_random_uuid(),

  -- foreign key: owner of the snippet (references supabase auth.users)
  -- cascade delete: when user is deleted, all their snippets are deleted
  -- cascade update: if user id changes (theoretical), update propagates
  user_id uuid not null
    references auth.users(id)
    on delete cascade
    on update cascade,

  -- snippet data: title (required, 1-200 chars, no whitespace-only)
  -- validates against empty strings and strings containing only whitespace
  title text not null
    check (
      char_length(title) >= 1
      and char_length(title) <= 200
      and trim(title) != ''
    ),

  -- snippet data: content (required, min 1 char, no maximum)
  -- text type supports up to 1gb of data
  content text not null
    check (char_length(content) >= 1),

  -- snippet data: description (optional, max 500 chars)
  -- nullable field for additional context
  description text
    check (description is null or char_length(description) <= 500),

  -- snippet data: programming language/type (required, predefined list)
  -- check constraint enforces allowed values
  -- using text instead of enum for easier maintenance and flexibility
  language text not null
    check (language in (
      'Bash',
      'CSS',
      'Elixir',
      'HTML',
      'JavaScript',
      'JSON',
      'MySQL',
      'Note',
      'Other',
      'PHP',
      'Python',
      'TypeScript',
      'YAML'
    )),

  -- snippet data: tags (optional, array of strings)
  -- postgresql array type, default empty array
  -- gin index (created below) enables fast array containment queries
  tags text[] default '{}',

  -- timestamps: creation time (auto-set, never changes)
  -- timestamptz stores timezone-aware timestamps
  created_at timestamptz not null default now(),

  -- timestamps: last update time (auto-set via trigger)
  -- automatically updated on every update via trigger (see below)
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- indexes: performance optimization
-- ----------------------------------------------------------------------------
-- these indexes optimize the primary access patterns for the application:
-- 1. listing user's snippets sorted by newest first (composite index)
-- 2. full-text search across title/description/content (gin index)
-- 3. filtering by language (b-tree index)
-- 4. filtering by tags (gin index for array operations)

-- composite index: optimizes main query pattern
-- query: select * from snippets where user_id = ? order by created_at desc
-- this is the most common query (listing user's snippets on main page)
-- desc ordering on created_at enables efficient reverse chronological sorting
create index idx_snippets_user_created
on public.snippets(user_id, created_at desc);

-- single-column index: supports rls filtering and user-specific queries
-- essential for row level security policy enforcement
-- also used for queries that filter by user but don't need sorting
create index idx_snippets_user_id
on public.snippets(user_id);

-- single-column index: enables fast filtering by programming language
-- query: select * from snippets where user_id = ? and language = ?
-- moderate impact - used when language filter is active in ui
create index idx_snippets_language
on public.snippets(language);

-- gin index: efficient array containment queries for tags
-- query: select * from snippets where 'api' = any(tags)
-- query: select * from snippets where tags @> array['api', 'rest']
-- gin (generalized inverted index) is optimized for array operations
-- critical for tag-based filtering and search
create index idx_snippets_tags
on public.snippets using gin(tags);

-- gin index: full-text search across multiple fields
-- query: where to_tsvector('english', ...) @@ to_tsquery('english', ?)
-- searches across: title + description + content
-- uses english dictionary for word stemming (e.g., "running" matches "run")
-- coalesce handles null descriptions gracefully
-- critical for search functionality in ui
create index idx_snippets_search
on public.snippets
using gin(
  to_tsvector('english',
    title || ' ' || coalesce(description, '') || ' ' || content
  )
);

-- ----------------------------------------------------------------------------
-- trigger function: auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
-- purpose: automatically set updated_at to current timestamp on every update
-- behavior: fires before each update, modifying the new row before it's saved
-- security: user cannot override this value - ensures accurate "last modified"

create or replace function update_updated_at_column()
returns trigger as $$
begin
    -- set updated_at to current timestamp
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- ----------------------------------------------------------------------------
-- trigger: apply auto-update function to snippets table
-- ----------------------------------------------------------------------------
-- purpose: attach the update_updated_at_column function to snippets table
-- timing: before update - allows modification of the new row
-- granularity: for each row - runs once per row being updated

create trigger update_snippets_updated_at
before update on public.snippets
for each row
execute function update_updated_at_column();

-- ----------------------------------------------------------------------------
-- row level security: enable on snippets table
-- ----------------------------------------------------------------------------
-- purpose: enforce data isolation at database level
-- effect: users can only access rows where rls policies permit
-- security: impossible to bypass from application layer
-- note: even with rls enabled, policies must be created (see below)

alter table public.snippets enable row level security;

-- ----------------------------------------------------------------------------
-- rls policy: select (read access)
-- ----------------------------------------------------------------------------
-- purpose: users can only view their own snippets
-- applies to: select queries (including joins)
-- condition: auth.uid() extracts user id from jwt token, must match user_id
-- type: permissive (default) - allows access when condition is true
-- security: prevents users from viewing other users' snippets

create policy "Users can view their own snippets"
on public.snippets
for select
using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- rls policy: insert (create access)
-- ----------------------------------------------------------------------------
-- purpose: users can only create snippets with their own user_id
-- applies to: insert queries
-- validation: with check verifies user_id in new row matches authenticated user
-- security: prevents users from creating snippets "owned" by other users
-- note: application should automatically set user_id from auth.uid()

create policy "Users can insert their own snippets"
on public.snippets
for insert
with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- rls policy: update (modify access)
-- ----------------------------------------------------------------------------
-- purpose: users can only update their own snippets and cannot change ownership
-- applies to: update queries
-- using: row must belong to user (filters which rows can be updated)
-- with check: modified row must still belong to user (validates changes)
-- security: prevents both unauthorized edits and ownership transfer
-- note: even if user tries to change user_id, with check will reject it

create policy "Users can update their own snippets"
on public.snippets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- rls policy: delete (remove access)
-- ----------------------------------------------------------------------------
-- purpose: users can only delete their own snippets
-- applies to: delete queries
-- using: row must belong to user (filters which rows can be deleted)
-- security: prevents users from deleting other users' data
-- note: hard delete (no soft delete in mvp) - user confirms before deletion

create policy "Users can delete their own snippets"
on public.snippets
for delete
using (auth.uid() = user_id);

-- ============================================================================
-- migration complete
-- ============================================================================
--
-- created:
--   ✓ public.snippets table with all constraints
--   ✓ 5 performance indexes (composite, user_id, language, tags, search)
--   ✓ auto-update trigger for updated_at column
--   ✓ row level security with 4 granular policies (select, insert, update, delete)
--
-- verification queries (run manually in supabase sql editor):
--
--   -- verify table creation
--   select * from pg_tables where tablename = 'snippets';
--
--   -- verify all indexes
--   select indexname, indexdef
--   from pg_indexes
--   where tablename = 'snippets'
--   order by indexname;
--
--   -- verify rls policies
--   select policyname, cmd, qual, with_check
--   from pg_policies
--   where tablename = 'snippets'
--   order by policyname;
--
--   -- verify trigger
--   select tgname, tgtype, tgenabled
--   from pg_trigger
--   where tgname = 'update_snippets_updated_at';
--
--   -- verify rls is enabled
--   select tablename, rowsecurity
--   from pg_tables
--   where tablename = 'snippets';
--
-- ============================================================================
