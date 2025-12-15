-- Migration: Add UPDATE policy for generation_sessions
-- Purpose: Allow users to update accepted_count on their own generation sessions
-- This is needed for PATCH /api/generation-sessions/:id endpoint

-- ===========================================
-- 1. DROP existing UPDATE policies that block all updates
-- ===========================================

drop policy if exists "generation_sessions_update_denied_authenticated" on generation_sessions;
drop policy if exists "generation_sessions_update_denied_anon" on generation_sessions;

-- ===========================================
-- 2. CREATE new UPDATE policies that allow users to update their own sessions
-- ===========================================

-- UPDATE policy for authenticated users - allow updating own sessions
create policy "generation_sessions_update_own_authenticated"
    on generation_sessions
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- UPDATE policy for anonymous users - still denied (no auth = no access)
create policy "generation_sessions_update_denied_anon"
    on generation_sessions
    for update
    to anon
    using (false)
    with check (false);

