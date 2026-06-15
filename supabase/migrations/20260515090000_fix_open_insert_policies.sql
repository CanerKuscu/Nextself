-- ============================================================================
-- 20260515090000_fix_open_insert_policies.sql
--
-- Tighten two INSERT policies that currently use `WITH CHECK (true)` and allow
-- any authenticated user to insert arbitrary rows:
--
--   1. client_relationships — was: WITH CHECK (true)
--      Risk: any authenticated user could create a fake professional <-> client
--      relationship by claiming the other side. The legitimate creator is
--      either the client (signing up) or an Edge Function running with the
--      service_role key (which bypasses RLS anyway). So we limit the
--      authenticated-user check to require client_id = auth.uid().
--
--   2. content_violations — was: WITH CHECK (true) (despite comment "only service role")
--      Risk: any authenticated user could insert violation rows against any user.
--      Edge functions write through service_role which bypasses RLS — there is
--      no need to allow direct client writes. Forbid them.
-- ============================================================================

-- 1) client_relationships ----------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'client_relationships'
          AND policyname = 'System can create relationships'
    ) THEN
        DROP POLICY "System can create relationships" ON client_relationships;
    END IF;
END $$;

CREATE POLICY "Clients or pros can create relationships" ON client_relationships
    FOR INSERT TO authenticated
    WITH CHECK (
        -- The signing-up client owns the new row
        client_id = auth.uid()
        OR
        -- Or an existing professional is creating the relationship under one of
        -- their own professional_profile ids (service_role bypasses RLS).
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        OR trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        OR dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

-- 2) content_violations ------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'content_violations'
          AND policyname = 'Service role insert violations'
    ) THEN
        DROP POLICY "Service role insert violations" ON public.content_violations;
    END IF;
END $$;

-- service_role bypasses RLS, so no policy is needed for it. We explicitly
-- deny authenticated direct INSERTs.
CREATE POLICY "Deny authenticated insert into content_violations"
    ON public.content_violations FOR INSERT
    TO authenticated
    WITH CHECK (false);
