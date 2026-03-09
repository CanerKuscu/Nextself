-- RLS_POLICY_SNIPPETS.sql
-- Safe templates to enable row-level security and add owner-based/view policies.
-- Replace <schema>.<table>, <user_id_col>, and adjust condition expressions to match your schema.

-- 1) Enable RLS on a table
-- Example: enable RLS on public.league_group_members
ALTER TABLE public.league_group_members ENABLE ROW LEVEL SECURITY;

-- 2) Restrictive owner-only policy (SELECT/INSERT/UPDATE/DELETE) using `auth.uid()`
-- Good for user-scoped tables where a `user_id` column exists and is authoritative.
CREATE POLICY "Users manage own <table>" ON public.<table>
  FOR ALL
  USING (auth.uid() = <user_id_col>)
  WITH CHECK (auth.uid() = <user_id_col>);

-- Example applied to league_group_members if rows are owned by `user_id`:
-- ALTER TABLE public.league_group_members ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users manage own league_group_members" ON public.league_group_members
--   FOR ALL
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- 3) View-only policy for members of a group (more permissive than owner-only)
-- This example assumes there is a `group_members` table linking `group_id` and `user_id`.
CREATE POLICY "Users can view members of groups they belong to" ON public.league_group_members
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = league_group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- 4) Policy for shared resources that uses a `shared_with` array or join table.
-- If `shared_with` is an array of uuids:
CREATE POLICY "Users can access shared_reports if listed in shared_with" ON public.shared_reports
  FOR ALL
  USING (auth.uid() = owner_id OR auth.uid() = ANY(shared_with))
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = ANY(shared_with));

-- 5) Public read policy template (only for safe, non-sensitive data)
CREATE POLICY "Public read" ON public.<table>
  FOR SELECT
  USING (TRUE);

-- 6) Prevent physical deletion (soft-delete pattern)
CREATE POLICY "Prevent physical deletion" ON public.<table>
  FOR DELETE
  USING (false);

-- Notes:
-- - Ensure server-side functions or Edge Functions set `user_id`/`owner_id` fields rather than trusting client input.
-- - Review any `USING (TRUE)` policies and confirm no sensitive columns are exposed.
-- - Run `SELECT * FROM pg_policies WHERE schemaname='public' AND tablename='<table>'` to inspect applied policies.

-- End of snippets
