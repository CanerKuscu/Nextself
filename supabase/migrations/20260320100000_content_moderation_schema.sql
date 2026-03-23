-- ============================================================
-- Content Moderation: ban columns on users + content_violations table
-- ============================================================

-- 1) Add ban / violation columns to "users" (IF NOT EXISTS guards)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='is_banned') THEN
        ALTER TABLE public.users ADD COLUMN is_banned boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='ban_reason') THEN
        ALTER TABLE public.users ADD COLUMN ban_reason text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='ban_expires_at') THEN
        ALTER TABLE public.users ADD COLUMN ban_expires_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='content_violation_count') THEN
        ALTER TABLE public.users ADD COLUMN content_violation_count integer DEFAULT 0;
    END IF;
END $$;

-- Recreate "profiles" VIEW to include new ban columns from users table
DROP VIEW IF EXISTS profiles;

CREATE VIEW profiles WITH (security_invoker = true) AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.height,
    u.weight,
    u.is_email_verified,
    u.is_deleted,
    u.created_at,
    u.updated_at,
    u.avatar_url,
    u.professional_type,
    u.gender,
    u.phone,
    u.user_type,
    u.is_banned,
    u.ban_reason,
    u.ban_expires_at,
    u.content_violation_count,
    up.goals,
    up.activity_level,
    up.dietary_preferences,
    up.dietary_restrictions,
    up.personal_trainer_id,
    up.dietitian_id,
    up.data_sharing_permissions
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_deleted = FALSE;

COMMENT ON VIEW profiles IS 'Public view of user profiles combining users and user_profiles tables (SECURITY INVOKER)';

-- 2) Create content_violations table
CREATE TABLE IF NOT EXISTS public.content_violations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    violation_type text NOT NULL,
    details text,
    created_at timestamptz DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_content_violations_user_id ON public.content_violations(user_id);

-- 3) RLS
ALTER TABLE public.content_violations ENABLE ROW LEVEL SECURITY;

-- Users can read their own violations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='content_violations' AND policyname='Users can view own violations') THEN
        CREATE POLICY "Users can view own violations"
            ON public.content_violations FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Only service role can insert/update (Edge Functions use service_role key)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='content_violations' AND policyname='Service role insert violations') THEN
        CREATE POLICY "Service role insert violations"
            ON public.content_violations FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;
