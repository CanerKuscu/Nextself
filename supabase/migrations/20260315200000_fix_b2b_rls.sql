-- ============================================================================
-- FIX B2B RLS POLICIES
-- Purpose: Allow Professionals (PTs, Dietitians) to view their clients' data
-- ============================================================================

-- Helper function to check if auth user is a professional for the target user
CREATE OR REPLACE FUNCTION is_professional_for_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_relationships
    WHERE client_id = target_user_id
      AND (
        professional_id = auth.uid() 
        OR trainer_id = auth.uid() 
        OR dietitian_id = auth.uid()
      )
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Workout Sessions
DROP POLICY IF EXISTS "Users can manage own workouts" ON workout_sessions;
CREATE POLICY "Users can manage own workouts" ON workout_sessions
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Professionals can view client workouts" ON workout_sessions
    FOR SELECT
    USING (is_professional_for_user(user_id));

-- 2. Nutrition Entries
DROP POLICY IF EXISTS "Users can manage own nutrition" ON nutrition_entries;
CREATE POLICY "Users can manage own nutrition" ON nutrition_entries
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Professionals can view client nutrition" ON nutrition_entries
    FOR SELECT
    USING (is_professional_for_user(user_id));

-- 3. Health Metrics
DROP POLICY IF EXISTS "Users can manage own health metrics" ON health_metrics;
CREATE POLICY "Users can manage own health metrics" ON health_metrics
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Professionals can view client health metrics" ON health_metrics
    FOR SELECT
    USING (is_professional_for_user(user_id));

-- 4. Body Photos (Sensitive!)
-- Only allow if explicitly needed. Usually PTs need to see progress photos.
DROP POLICY IF EXISTS "Users can manage own body photos" ON body_photos;
CREATE POLICY "Users can manage own body photos" ON body_photos
    USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Professionals can view client body photos" ON body_photos
    FOR SELECT
    USING (is_professional_for_user(user_id));

-- 5. AI Insights
DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
CREATE POLICY "Users can view own insights" ON ai_insights
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Professionals can view client insights" ON ai_insights
    FOR SELECT
    USING (is_professional_for_user(user_id));

-- 6. User Inventory/Currency (Optional, but good for gamification tracking)
DROP POLICY IF EXISTS "Users can view own xp history" ON xp_transactions;
CREATE POLICY "Users can view own xp history" ON xp_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Professionals can view client xp history" ON xp_transactions
    FOR SELECT
    USING (is_professional_for_user(user_id));
