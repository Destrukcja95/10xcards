-- =====================================================
-- MIGRATION: Initial database schema for 10x-cards
-- =====================================================
-- Purpose: Create the foundational database structure for the flashcard
--          application with AI generation and spaced repetition (SM-2)
-- 
-- Tables affected:
--   - flashcards (new) - stores user flashcards with SM-2 algorithm data
--   - generation_sessions (new) - stores AI generation sessions for statistics
--
-- Custom types:
--   - flashcard_source (enum) - defines the origin of a flashcard
--
-- Security:
--   - Row Level Security (RLS) enabled on all tables
--   - Users can only access their own data
--   - Cascade delete ensures GDPR compliance
--
-- Notes:
--   - Uses Supabase Auth (auth.users) for user management
--   - Uses moddatetime extension for automatic updated_at timestamps
-- =====================================================

-- ===================
-- 1. CUSTOM ENUM TYPE
-- ===================
-- Defines the source/origin of a flashcard
-- 'ai_generated' - flashcard created by AI and accepted by user
-- 'manual' - flashcard created manually by user
create type flashcard_source as enum ('ai_generated', 'manual');

-- =======================
-- 2. FLASHCARDS TABLE
-- =======================
-- Main table storing user flashcards with spaced repetition (SM-2) algorithm data
-- Each flashcard belongs to a single user and contains:
--   - Content (front/back)
--   - Source information
--   - SM-2 algorithm parameters for scheduling reviews
create table flashcards (
    -- Primary identifier
    id uuid primary key default gen_random_uuid(),
    
    -- Owner reference - CASCADE ensures GDPR compliance (right to deletion)
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- Flashcard content
    front varchar(500) not null,    -- Question side (max 500 chars)
    back varchar(1000) not null,    -- Answer side (max 1000 chars)
    
    -- Origin tracking for analytics
    source flashcard_source not null default 'manual',
    
    -- SM-2 Algorithm parameters
    -- ease_factor: difficulty multiplier (2.5 = normal, lower = harder)
    -- minimum 1.30 prevents cards from becoming too difficult
    ease_factor decimal(3,2) not null default 2.50 
        check (ease_factor >= 1.30),
    
    -- interval: days until next review (0 = new card, not yet reviewed)
    interval integer not null default 0 
        check (interval >= 0),
    
    -- repetition_count: number of successful consecutive reviews
    repetition_count integer not null default 0 
        check (repetition_count >= 0),
    
    -- Scheduling timestamps
    next_review_date timestamptz not null default now(),  -- When to show next
    last_reviewed_at timestamptz,                          -- Last review time (null = never)
    
    -- Audit timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add comment to table for documentation
comment on table flashcards is 'User flashcards with SM-2 spaced repetition algorithm data';
comment on column flashcards.ease_factor is 'SM-2 ease factor: difficulty multiplier (min 1.30, default 2.50)';
comment on column flashcards.interval is 'SM-2 interval: days until next scheduled review';
comment on column flashcards.repetition_count is 'SM-2 repetition count: consecutive successful reviews';

-- =============================
-- 3. GENERATION SESSIONS TABLE
-- =============================
-- Stores AI flashcard generation sessions for statistics and analytics
-- Used to track:
--   - How many flashcards were proposed by AI
--   - How many were accepted by users (acceptance rate metric)
-- Note: Sessions are read-only after creation (historical data)
create table generation_sessions (
    -- Primary identifier
    id uuid primary key default gen_random_uuid(),
    
    -- Owner reference - CASCADE ensures GDPR compliance
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- Source text used for generation
    -- Constraint ensures text length is between 1000-10000 characters
    source_text text not null 
        check (char_length(source_text) between 1000 and 10000),
    
    -- Generation statistics
    generated_count integer not null default 0 
        check (generated_count >= 0),    -- Number of AI-proposed flashcards
    accepted_count integer not null default 0 
        check (accepted_count >= 0),     -- Number of user-accepted flashcards
    
    -- Audit timestamp (no updated_at - sessions are immutable)
    created_at timestamptz not null default now()
);

-- Add comment to table for documentation
comment on table generation_sessions is 'AI flashcard generation sessions for analytics (immutable after creation)';
comment on column generation_sessions.source_text is 'Source text used for AI generation (1000-10000 chars)';
comment on column generation_sessions.generated_count is 'Number of flashcards proposed by AI';
comment on column generation_sessions.accepted_count is 'Number of flashcards accepted by user';

-- ==========
-- 4. INDEXES
-- ==========

-- Index for looking up all flashcards belonging to a user
-- Used in: listing user's flashcards, dashboard views
create index idx_flashcards_user_id 
    on flashcards(user_id);

-- Composite index for fetching cards due for review
-- Optimizes the main study session query: "get cards where next_review_date <= now()"
create index idx_flashcards_user_next_review 
    on flashcards(user_id, next_review_date);

-- Composite index for fetching user's generation history sorted by date
-- Optimizes: "show user's past generation sessions, most recent first"
create index idx_generation_sessions_user_created 
    on generation_sessions(user_id, created_at desc);

-- ========================
-- 5. ROW LEVEL SECURITY
-- ========================
-- Enable RLS on all tables to ensure data isolation between users
-- This is MANDATORY for Supabase security

alter table flashcards enable row level security;
alter table generation_sessions enable row level security;

-- =====================================
-- 6. RLS POLICIES FOR FLASHCARDS TABLE
-- =====================================
-- Users can only access their own flashcards
-- All operations (CRUD) are restricted to the authenticated owner

-- SELECT policy for authenticated users
-- Allows users to read only their own flashcards
create policy "flashcards_select_own_authenticated"
    on flashcards
    for select
    to authenticated
    using (user_id = auth.uid());

-- SELECT policy for anonymous users
-- Anonymous users cannot read any flashcards
create policy "flashcards_select_own_anon"
    on flashcards
    for select
    to anon
    using (false);

-- INSERT policy for authenticated users
-- Users can only create flashcards for themselves (user_id must match their auth id)
create policy "flashcards_insert_own_authenticated"
    on flashcards
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- INSERT policy for anonymous users
-- Anonymous users cannot create flashcards
create policy "flashcards_insert_own_anon"
    on flashcards
    for insert
    to anon
    with check (false);

-- UPDATE policy for authenticated users
-- Users can only update their own flashcards
-- Both USING and WITH CHECK ensure the card belongs to user before and after update
create policy "flashcards_update_own_authenticated"
    on flashcards
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- UPDATE policy for anonymous users
-- Anonymous users cannot update flashcards
create policy "flashcards_update_own_anon"
    on flashcards
    for update
    to anon
    using (false)
    with check (false);

-- DELETE policy for authenticated users
-- Users can only delete their own flashcards
create policy "flashcards_delete_own_authenticated"
    on flashcards
    for delete
    to authenticated
    using (user_id = auth.uid());

-- DELETE policy for anonymous users
-- Anonymous users cannot delete flashcards
create policy "flashcards_delete_own_anon"
    on flashcards
    for delete
    to anon
    using (false);

-- ==============================================
-- 7. RLS POLICIES FOR GENERATION_SESSIONS TABLE
-- ==============================================
-- Users can only access their own generation sessions
-- Only SELECT and INSERT are allowed (sessions are immutable after creation)

-- SELECT policy for authenticated users
-- Users can view only their own generation sessions
create policy "generation_sessions_select_own_authenticated"
    on generation_sessions
    for select
    to authenticated
    using (user_id = auth.uid());

-- SELECT policy for anonymous users
-- Anonymous users cannot read any generation sessions
create policy "generation_sessions_select_own_anon"
    on generation_sessions
    for select
    to anon
    using (false);

-- INSERT policy for authenticated users
-- Users can only create generation sessions for themselves
create policy "generation_sessions_insert_own_authenticated"
    on generation_sessions
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- INSERT policy for anonymous users
-- Anonymous users cannot create generation sessions
create policy "generation_sessions_insert_own_anon"
    on generation_sessions
    for insert
    to anon
    with check (false);

-- NOTE: No UPDATE or DELETE policies for generation_sessions
-- Sessions are historical/statistical data and should not be modified after creation
-- This is intentional - if update/delete is attempted, RLS will deny the operation

-- UPDATE policy for authenticated users - EXPLICITLY DENIED
-- Generation sessions are immutable - no updates allowed
create policy "generation_sessions_update_denied_authenticated"
    on generation_sessions
    for update
    to authenticated
    using (false)
    with check (false);

-- UPDATE policy for anonymous users - EXPLICITLY DENIED
create policy "generation_sessions_update_denied_anon"
    on generation_sessions
    for update
    to anon
    using (false)
    with check (false);

-- DELETE policy for authenticated users - EXPLICITLY DENIED
-- Generation sessions are historical data - no manual deletion allowed
-- (will be cascade deleted when user account is removed)
create policy "generation_sessions_delete_denied_authenticated"
    on generation_sessions
    for delete
    to authenticated
    using (false);

-- DELETE policy for anonymous users - EXPLICITLY DENIED
create policy "generation_sessions_delete_denied_anon"
    on generation_sessions
    for delete
    to anon
    using (false);

-- ===========================================
-- 8. AUTOMATIC updated_at TIMESTAMP TRIGGER
-- ===========================================
-- Uses Supabase's built-in moddatetime extension
-- Automatically updates the updated_at column on every UPDATE operation

-- Enable the moddatetime extension if not already enabled
-- This extension is provided by Supabase and handles timestamp updates
create extension if not exists moddatetime schema extensions;

-- Create trigger for flashcards table
-- Automatically sets updated_at to current timestamp on every update
create trigger set_flashcards_updated_at
    before update on flashcards
    for each row
    execute function moddatetime(updated_at);

-- =====================================================
-- END OF MIGRATION
-- =====================================================

