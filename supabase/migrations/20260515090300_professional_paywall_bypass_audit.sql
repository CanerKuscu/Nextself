-- ============================================================================
-- 20260515090300_professional_paywall_bypass_audit.sql
--
-- Companion to the usePremiumGuard refactor: log each time a professional
-- account bypasses a consumer paywall. This makes the bypass observable in
-- the database, which we previously had no visibility into.
--
-- A best-effort INSERT runs from the client; even if the insert silently
-- fails (e.g. network issue) the bypass itself still works — this is purely
-- audit signal, not a gate.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.professional_paywall_bypass_log (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        text NOT NULL,
    screen      text,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS professional_paywall_bypass_log_user_id_idx
    ON public.professional_paywall_bypass_log (user_id, occurred_at DESC);

ALTER TABLE public.professional_paywall_bypass_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users may insert their own bypass rows.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'professional_paywall_bypass_log'
          AND policyname = 'Authenticated can insert own bypass log'
    ) THEN
        CREATE POLICY "Authenticated can insert own bypass log"
            ON public.professional_paywall_bypass_log
            FOR INSERT TO authenticated
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Authenticated users may read only their own bypass rows; admins/service_role
-- bypass RLS and can read everything for analytics.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'professional_paywall_bypass_log'
          AND policyname = 'Users can read own bypass log'
    ) THEN
        CREATE POLICY "Users can read own bypass log"
            ON public.professional_paywall_bypass_log
            FOR SELECT TO authenticated
            USING (user_id = auth.uid());
    END IF;
END $$;
