-- ============================================================================
-- SUPABASE SCHEMA AUDIT & OPTIMIZATION
-- Generated: March 2026
-- Purpose: Address security gaps, performance bottlenecks, and structural inconsistencies
-- found during comprehensive schema audit.
-- ============================================================================

-- ============================================================================
-- 1. SECURITY: ENABLE RLS ON CORE TABLES
-- ============================================================================

-- Enable RLS on 'users' table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT TO authenticated USING (auth.uid() = id);

-- Policy: Users can update their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Policy: Public profiles are viewable by everyone (via the 'profiles' view usually, but base table access might be needed)
-- We'll rely on the 'profiles' view for public access to avoid exposing sensitive columns in 'users'.
-- But we need a policy for service role or admin if they query directly.

-- Enable RLS on 'user_profiles' table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. AUTOMATION: SYNC AUTH.USERS TO PUBLIC.USERS
-- ============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, first_name, last_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        updated_at = NOW();
        
    -- Also initialize user_profiles
    INSERT INTO public.user_profiles (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialize user_currencies
    INSERT INTO public.user_currencies (user_id, points, gems)
    VALUES (new.id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
-- Note: This requires permissions on auth.users which might need to be run in Supabase dashboard SQL editor if migrations fail
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ============================================================================
-- 3. PERFORMANCE: ADD MISSING INDEXES
-- ============================================================================

-- Notifications: Filter by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- Missions: Filter by user and status (active/completed)
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_status ON daily_missions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_weekly_missions_user_status ON weekly_missions(user_id, status);

-- Store Items: Filter by category
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category);

-- User Inventory: Filter by user and active items
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_active ON user_inventory_items(user_id, is_active);

-- Chats: optimize getting unread counts
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_unread ON chat_participants(user_id, last_read_at);

-- ============================================================================
-- 4. DATA INTEGRITY: CLEANUP & CONSISTENCY
-- ============================================================================

-- Deprecate old 'subscriptions' table in favor of 'user_subscriptions'
-- We rename it to avoid confusion, but keep data just in case.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        ALTER TABLE subscriptions RENAME TO subscriptions_legacy;
    END IF;
END $$;

-- Ensure 'professional_profiles' has consistent constraints
ALTER TABLE professional_profiles DROP CONSTRAINT IF EXISTS professional_profiles_user_id_key;
ALTER TABLE professional_profiles ADD CONSTRAINT professional_profiles_user_id_key UNIQUE (user_id);

-- Ensure 'user_profiles' has consistent constraints
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- ============================================================================
-- 5. FUNCTIONALITY: ENHANCED HELPER FUNCTIONS
-- ============================================================================

-- Function to get user stats summary
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_workouts BIGINT,
    total_minutes NUMERIC,
    current_streak INT,
    points_balance INT,
    gems_balance INT,
    level INT,
    rank INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM workout_sessions WHERE user_id = user_uuid) as total_workouts,
        (SELECT COALESCE(SUM(duration)/60, 0) FROM workout_sessions WHERE user_id = user_uuid) as total_minutes,
        (SELECT current_streak FROM user_streaks WHERE user_id = user_uuid LIMIT 1) as current_streak, -- Assuming user_streaks exists or will be created
        (SELECT points FROM user_currencies WHERE user_id = user_uuid LIMIT 1) as points_balance,
        (SELECT gems FROM user_currencies WHERE user_id = user_uuid LIMIT 1) as gems_balance,
        (SELECT current_level FROM user_levels WHERE user_id = user_uuid LIMIT 1) as level, -- Assuming user_levels exists
        (SELECT rank FROM user_leagues WHERE user_id = user_uuid LIMIT 1) as rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix for potentially missing user_streaks and user_levels tables referenced above
-- If they don't exist, we should create them or stub them
CREATE TABLE IF NOT EXISTS user_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_levels (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_level INT DEFAULT 1,
    current_xp INT DEFAULT 0,
    next_level_xp INT DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON user_streaks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view own level" ON user_levels FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'Audit and optimization migration executed successfully' as status;
