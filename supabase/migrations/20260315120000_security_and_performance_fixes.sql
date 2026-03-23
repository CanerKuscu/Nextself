-- ============================================================================
-- BIOSYNC SECURITY & PERFORMANCE FIXES
-- Generated: March 15, 2026
-- Purpose: Enable RLS on all unprotected tables, add missing indexes, and enforce is_deleted checks.
-- ============================================================================

-- ============================================================================
-- 1. HELPER FUNCTION FOR ACTIVE USER CHECK
-- ============================================================================

-- Efficiently check if the current user is not deleted
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
DECLARE
    is_deleted_status BOOLEAN;
BEGIN
    -- Check if the user exists and is not deleted in the public.users table
    -- We use a direct query to leverage the primary key index
    SELECT is_deleted INTO is_deleted_status
    FROM public.users
    WHERE id = auth.uid();
    
    -- If user not found (null), they are not active. If found, return opposite of is_deleted.
    RETURN COALESCE(NOT is_deleted_status, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. ENABLE RLS ON SENSITIVE TABLES
-- ============================================================================

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_leagues ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE RLS POLICIES WITH IS_DELETED CHECK
-- ============================================================================

-- Workout Sessions
DROP POLICY IF EXISTS "Users can manage own workouts" ON workout_sessions;
CREATE POLICY "Users can manage own workouts" ON workout_sessions
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- Nutrition Entries
DROP POLICY IF EXISTS "Users can manage own nutrition" ON nutrition_entries;
CREATE POLICY "Users can manage own nutrition" ON nutrition_entries
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- Health Metrics
DROP POLICY IF EXISTS "Users can manage own health metrics" ON health_metrics;
CREATE POLICY "Users can manage own health metrics" ON health_metrics
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- AI Insights (Read Only for User, Insert by System/Edge Functions)
DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
CREATE POLICY "Users can view own insights" ON ai_insights
    FOR SELECT USING (user_id = auth.uid() AND is_active_user());

-- Notifications
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- XP Transactions (Read Only for User)
DROP POLICY IF EXISTS "Users can view own xp history" ON xp_transactions;
CREATE POLICY "Users can view own xp history" ON xp_transactions
    FOR SELECT USING (user_id = auth.uid() AND is_active_user());

-- User Currencies (Read Only for User)
DROP POLICY IF EXISTS "Users can view own wallet" ON user_currencies;
CREATE POLICY "Users can view own wallet" ON user_currencies
    FOR SELECT USING (user_id = auth.uid() AND is_active_user());

-- User Inventory Items
DROP POLICY IF EXISTS "Users can manage own inventory" ON user_inventory_items;
CREATE POLICY "Users can manage own inventory" ON user_inventory_items
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- Weekly Missions
DROP POLICY IF EXISTS "Users can view own weekly missions" ON weekly_missions;
CREATE POLICY "Users can view own weekly missions" ON weekly_missions
    FOR SELECT USING (user_id = auth.uid() AND is_active_user());

-- Daily Missions
DROP POLICY IF EXISTS "Users can view own daily missions" ON daily_missions;
CREATE POLICY "Users can view own daily missions" ON daily_missions
    FOR SELECT USING (user_id = auth.uid() AND is_active_user());

-- Body Photos
DROP POLICY IF EXISTS "Users can manage own body photos" ON body_photos;
CREATE POLICY "Users can manage own body photos" ON body_photos
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- AI Generated Programs
DROP POLICY IF EXISTS "Users can view own AI programs" ON ai_generated_programs;
CREATE POLICY "Users can view own AI programs" ON ai_generated_programs
    FOR SELECT USING (user_id = auth.uid() AND is_active_user());

-- User Agreements
DROP POLICY IF EXISTS "Users can view own agreements" ON user_agreements;
CREATE POLICY "Users can view own agreements" ON user_agreements
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- User Leagues
DROP POLICY IF EXISTS "Users can view own league status" ON user_leagues;
CREATE POLICY "Users can view own league status" ON user_leagues
    FOR SELECT USING (user_id = auth.uid() AND is_active_user());

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================

-- Workout Sessions: optimize history queries
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(start_time DESC);

-- Nutrition: optimize logs by date
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_date ON nutrition_entries(logged_at DESC);

-- Notifications: optimize by creation date (for "recent notifications")
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- XP Transactions: optimize history
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

-- Users: optimize is_deleted filtering
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted) WHERE is_deleted = TRUE;

-- ============================================================================
-- 5. MISSING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES professional_profiles(id),
    client_id UUID REFERENCES users(id),
    amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL,
    payment_gateway_ref TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;

-- Only admins or the professional involved can view logs (simplified for now)
CREATE POLICY "Professionals can view own transaction logs" ON transaction_logs
    FOR SELECT USING (professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'Security and performance fixes applied successfully' as status;
