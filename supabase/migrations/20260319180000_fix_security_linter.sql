-- ============================================================================
-- SUPABASE SECURITY LINTER FIXES
-- Generated: March 19, 2026
-- Purpose: Fix all 29 security errors reported by the Supabase Security Advisor
--
-- Fixes:
--   1. profiles view: SECURITY DEFINER → SECURITY INVOKER
--   2. 27 tables: Enable RLS + add appropriate policies
--   3. biometric_consents: Protect sensitive session_id column via RLS
-- ============================================================================

-- ============================================================================
-- 1. FIX PROFILES VIEW — Remove SECURITY DEFINER
-- ============================================================================
-- The profiles view currently runs with the creator's permissions,
-- bypassing RLS on `users` and `user_profiles`. Recreate with SECURITY INVOKER.

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

-- ============================================================================
-- 2. ENABLE RLS — USER-OWNED TABLES (with user_id column)
-- ============================================================================

-- ---- biometric_consents (also fixes sensitive column: session_id) ----
ALTER TABLE biometric_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own biometric consents" ON biometric_consents;
CREATE POLICY "Users can manage own biometric consents" ON biometric_consents
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- distance_sales_contracts ----
ALTER TABLE distance_sales_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contracts" ON distance_sales_contracts;
CREATE POLICY "Users can view own contracts" ON distance_sales_contracts
    FOR SELECT USING (user_id = auth.uid() AND is_active_user());

DROP POLICY IF EXISTS "Users can create own contracts" ON distance_sales_contracts;
CREATE POLICY "Users can create own contracts" ON distance_sales_contracts
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- mss_pdf_results (linked via contract_id) ----
ALTER TABLE mss_pdf_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own PDF results" ON mss_pdf_results;
CREATE POLICY "Users can view own PDF results" ON mss_pdf_results
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM distance_sales_contracts WHERE user_id = auth.uid()
        )
    );

-- ---- workout_plans ----
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workout plans" ON workout_plans;
CREATE POLICY "Users can manage own workout plans" ON workout_plans
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- nutrition_plans ----
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own nutrition plans" ON nutrition_plans;
CREATE POLICY "Users can manage own nutrition plans" ON nutrition_plans
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- meal_plans (linked via nutrition_plan_id → nutrition_plans.user_id) ----
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own meal plans" ON meal_plans;
CREATE POLICY "Users can manage own meal plans" ON meal_plans
    USING (
        nutrition_plan_id IN (
            SELECT id FROM nutrition_plans WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        nutrition_plan_id IN (
            SELECT id FROM nutrition_plans WHERE user_id = auth.uid()
        )
    );

-- ---- ai_analyses ----
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own AI analyses" ON ai_analyses;
CREATE POLICY "Users can manage own AI analyses" ON ai_analyses
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- progress_logs ----
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own progress logs" ON progress_logs;
CREATE POLICY "Users can manage own progress logs" ON progress_logs
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- sleep_data ----
ALTER TABLE sleep_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own sleep data" ON sleep_data;
CREATE POLICY "Users can manage own sleep data" ON sleep_data
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- stress_logs ----
ALTER TABLE stress_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own stress logs" ON stress_logs;
CREATE POLICY "Users can manage own stress logs" ON stress_logs
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- water_configs ----
ALTER TABLE water_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own water config" ON water_configs;
CREATE POLICY "Users can manage own water config" ON water_configs
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- water_stats_logs ----
ALTER TABLE water_stats_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own water logs" ON water_stats_logs;
CREATE POLICY "Users can manage own water logs" ON water_stats_logs
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- user_supplements ----
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own supplements" ON user_supplements;
CREATE POLICY "Users can manage own supplements" ON user_supplements
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ---- supplement_logs ----
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own supplement logs" ON supplement_logs;
CREATE POLICY "Users can manage own supplement logs" ON supplement_logs
    USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

-- ============================================================================
-- 3. ENABLE RLS — PROFESSIONAL TABLES
-- ============================================================================

-- ---- personal_trainers ----
ALTER TABLE personal_trainers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view verified trainers" ON personal_trainers;
CREATE POLICY "Anyone can view verified trainers" ON personal_trainers
    FOR SELECT USING (is_verified = TRUE);

DROP POLICY IF EXISTS "Trainers can view own record" ON personal_trainers;
CREATE POLICY "Trainers can view own record" ON personal_trainers
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can create own record" ON personal_trainers;
CREATE POLICY "Trainers can create own record" ON personal_trainers
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can update own record" ON personal_trainers;
CREATE POLICY "Trainers can update own record" ON personal_trainers
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ---- dietitians ----
ALTER TABLE dietitians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view verified dietitians" ON dietitians;
CREATE POLICY "Anyone can view verified dietitians" ON dietitians
    FOR SELECT USING (is_verified = TRUE);

DROP POLICY IF EXISTS "Dietitians can view own record" ON dietitians;
CREATE POLICY "Dietitians can view own record" ON dietitians
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Dietitians can create own record" ON dietitians;
CREATE POLICY "Dietitians can create own record" ON dietitians
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Dietitians can update own record" ON dietitians;
CREATE POLICY "Dietitians can update own record" ON dietitians
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- 4. ENABLE RLS — CATALOG / REFERENCE TABLES (read-only for authenticated)
-- ============================================================================

-- ---- league_tiers (static config, everyone reads) ----
ALTER TABLE league_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "League tiers are readable by all" ON league_tiers;
CREATE POLICY "League tiers are readable by all" ON league_tiers
    FOR SELECT USING (true);

-- ---- league_groups ----
ALTER TABLE league_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "League groups are readable by all" ON league_groups;
CREATE POLICY "League groups are readable by all" ON league_groups
    FOR SELECT TO authenticated USING (true);

-- ---- store_items (catalog) ----
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store items are readable by all" ON store_items;
CREATE POLICY "Store items are readable by all" ON store_items
    FOR SELECT USING (true);

-- ---- agreement_versions (static legal docs) ----
ALTER TABLE agreement_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agreement versions are readable by all" ON agreement_versions;
CREATE POLICY "Agreement versions are readable by all" ON agreement_versions
    FOR SELECT USING (true);

-- ---- subscriptions_legacy ----
ALTER TABLE subscriptions_legacy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own legacy subscriptions" ON subscriptions_legacy;
CREATE POLICY "Users can view own legacy subscriptions" ON subscriptions_legacy
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---- supplement_ingredients (catalog reference) ----
ALTER TABLE supplement_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supplement ingredients are readable by all" ON supplement_ingredients;
CREATE POLICY "Supplement ingredients are readable by all" ON supplement_ingredients
    FOR SELECT USING (true);

-- ---- micronutrients (catalog reference) ----
ALTER TABLE micronutrients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Micronutrients are readable by all" ON micronutrients;
CREATE POLICY "Micronutrients are readable by all" ON micronutrients
    FOR SELECT USING (true);

-- ============================================================================
-- 5. ENABLE RLS — SOCIAL TABLES
-- ============================================================================

-- ---- friendships ----
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT TO authenticated 
    USING (requester_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
CREATE POLICY "Users can send friend requests" ON friendships
    FOR INSERT TO authenticated 
    WITH CHECK (requester_id = auth.uid() AND is_active_user());

DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
CREATE POLICY "Users can update own friendships" ON friendships
    FOR UPDATE TO authenticated 
    USING (requester_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
CREATE POLICY "Users can delete own friendships" ON friendships
    FOR DELETE TO authenticated 
    USING (requester_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================================================
-- 6. ENABLE RLS — FORUM TABLES
-- ============================================================================

-- ---- forum_categories (read-only catalog) ----
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forum categories are readable by all" ON forum_categories;
CREATE POLICY "Forum categories are readable by all" ON forum_categories
    FOR SELECT USING (true);

-- ---- forum_topics ----
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forum topics are readable by all" ON forum_topics;
CREATE POLICY "Forum topics are readable by all" ON forum_topics
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create topics" ON forum_topics;
CREATE POLICY "Authenticated users can create topics" ON forum_topics
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_active_user());

DROP POLICY IF EXISTS "Users can update own topics" ON forum_topics;
CREATE POLICY "Users can update own topics" ON forum_topics
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own topics" ON forum_topics;
CREATE POLICY "Users can delete own topics" ON forum_topics
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---- forum_posts ----
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forum posts are readable by all" ON forum_posts;
CREATE POLICY "Forum posts are readable by all" ON forum_posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON forum_posts;
CREATE POLICY "Authenticated users can create posts" ON forum_posts
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_active_user());

DROP POLICY IF EXISTS "Users can update own posts" ON forum_posts;
CREATE POLICY "Users can update own posts" ON forum_posts
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own posts" ON forum_posts;
CREATE POLICY "Users can delete own posts" ON forum_posts
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'Security linter fixes applied successfully — 29 errors resolved' AS status;
