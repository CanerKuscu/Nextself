-- ============================================================================
-- BIOSYNC SECURITY & PERFORMANCE FIXES
-- Purpose: Enable RLS on all unprotected tables and add missing indexes.
-- ============================================================================

-- 1. ENABLE RLS ON ALL SENSITIVE TABLES
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

-- 2. CREATE BASELINE "OWNER ACCESS" POLICIES
-- Pattern: Users can only see/edit their own rows (user_id = auth.uid())

-- Workout Sessions
CREATE POLICY "Users can manage own workouts" ON workout_sessions
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Nutrition Entries
CREATE POLICY "Users can manage own nutrition" ON nutrition_entries
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Health Metrics
CREATE POLICY "Users can manage own health metrics" ON health_metrics
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- AI Insights (Read Only for User, Insert by System/Edge Functions)
CREATE POLICY "Users can view own insights" ON ai_insights
    FOR SELECT USING (user_id = auth.uid());

-- Notifications
CREATE POLICY "Users can manage own notifications" ON notifications
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- XP & Currency (Read Only for User)
CREATE POLICY "Users can view own xp history" ON xp_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own wallet" ON user_currencies
    FOR SELECT USING (user_id = auth.uid());

-- Missions
CREATE POLICY "Users can view own missions" ON weekly_missions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view own daily missions" ON daily_missions
    FOR SELECT USING (user_id = auth.uid());

-- Photos & Programs
CREATE POLICY "Users can manage own body photos" ON body_photos
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own AI programs" ON ai_generated_programs
    USING (user_id = auth.uid());

-- Agreements
CREATE POLICY "Users can view own agreements" ON user_agreements
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. PERFORMANCE INDEXES (Missing from previous audits)
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_date ON nutrition_entries(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

-- 4. SOFT DELETE ENFORCEMENT
-- Ensure queries filter out deleted users by default if accessing via raw tables
-- (Note: It is better to use Views for this, but adding an index helps)
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted) WHERE is_deleted = TRUE;