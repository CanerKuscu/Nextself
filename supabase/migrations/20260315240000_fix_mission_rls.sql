-- ============================================================================
-- FIX RLS FOR MISSIONS
-- Generated: March 15, 2026
-- Purpose: Allow users to create and update their own missions (since MissionService runs on client)
-- ============================================================================

-- Weekly Missions
DROP POLICY IF EXISTS "Users can view own weekly missions" ON weekly_missions;
DROP POLICY IF EXISTS "Users can manage own weekly missions" ON weekly_missions;

CREATE POLICY "Users can manage own weekly missions" ON weekly_missions
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- Daily Missions
DROP POLICY IF EXISTS "Users can view own daily missions" ON daily_missions;
DROP POLICY IF EXISTS "Users can manage own daily missions" ON daily_missions;

CREATE POLICY "Users can manage own daily missions" ON daily_missions
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

SELECT 'Mission RLS policies updated successfully' as status;
