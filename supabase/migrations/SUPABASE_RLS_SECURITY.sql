-- ============================================================================
-- BIOSYNC - TÜM TABLOLAR İÇİN ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================================================
-- Bu dosya tüm tabloların güvenliğini sağlar.
-- Supabase SQL Editor'de çalıştırın.
-- Mevcut politikalar varsa DROP POLICY ile kaldırılır, sonra yeniden oluşturulur.
-- ============================================================================

-- ████████████████████████████████████████████████████████████████████████████
-- 1. KULLANICI YÖNETİMİ (profiles, professional_profiles, client_relationships)
-- ████████████████████████████████████████████████████████████████████████████

-- === PROFILES ===
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone if not deleted." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Prevent physical deletion" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone if not deleted."
    ON public.profiles FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile."
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Prevent physical deletion"
    ON public.profiles FOR DELETE
    USING (false);

-- === PROFESSIONAL_PROFILES ===
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional profiles viewable by all" ON public.professional_profiles;
DROP POLICY IF EXISTS "Professional profiles viewable by all if not deleted" ON public.professional_profiles;
DROP POLICY IF EXISTS "Professionals can insert own details" ON public.professional_profiles;
DROP POLICY IF EXISTS "Professionals can update own details" ON public.professional_profiles;
DROP POLICY IF EXISTS "Prevent professional physical deletion" ON public.professional_profiles;

CREATE POLICY "Professional profiles viewable by all"
    ON public.professional_profiles FOR SELECT
    USING (is_active = true);

CREATE POLICY "Professionals can insert own details"
    ON public.professional_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Professionals can update own details"
    ON public.professional_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Prevent professional physical deletion"
    ON public.professional_profiles FOR DELETE
    USING (false);

-- === CLIENT_RELATIONSHIPS ===
ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own relationships" ON public.client_relationships;
DROP POLICY IF EXISTS "Users can view their own relationships" ON public.client_relationships;
DROP POLICY IF EXISTS "Clients can initiate relationships" ON public.client_relationships;
DROP POLICY IF EXISTS "Users can insert their own relationships" ON public.client_relationships;
DROP POLICY IF EXISTS "Professionals update relationships" ON public.client_relationships;
DROP POLICY IF EXISTS "Professionals can update their relationships" ON public.client_relationships;
DROP POLICY IF EXISTS "Users can delete their own relationships" ON public.client_relationships;

CREATE POLICY "Users view own relationships"
    ON public.client_relationships FOR SELECT
    USING (auth.uid() = client_id OR auth.uid() = professional_id);

CREATE POLICY "Clients can initiate relationships"
    ON public.client_relationships FOR INSERT
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Professionals update relationships"
    ON public.client_relationships FOR UPDATE
    USING (auth.uid() = professional_id);

CREATE POLICY "Clients can cancel relationships"
    ON public.client_relationships FOR DELETE
    USING (auth.uid() = client_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 2. AKTİVİTE TAKİBİ (workouts, supplement_logs, nutrition_logs, water_logs, vb.)
-- ████████████████████████████████████████████████████████████████████████████

-- === WORKOUTS ===
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Pros see active clients workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users manage own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can view their own non-deleted workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can manage their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Prevent physical deletion" ON public.workouts;
DROP POLICY IF EXISTS "Users insert own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users update own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users delete own workouts" ON public.workouts;

CREATE POLICY "Users see own workouts"
    ON public.workouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Pros see active clients workouts"
    ON public.workouts FOR SELECT
    USING (EXISTS (SELECT 1 FROM client_relationships WHERE client_id = workouts.user_id AND professional_id = auth.uid() AND status = 'active'));

CREATE POLICY "Users insert own workouts"
    ON public.workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own workouts"
    ON public.workouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own workouts"
    ON public.workouts FOR DELETE
    USING (auth.uid() = user_id);

-- === SUPPLEMENT_LOGS ===
ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own supplement logs" ON public.supplement_logs;
DROP POLICY IF EXISTS "Users can view their own supplement logs" ON public.supplement_logs;
DROP POLICY IF EXISTS "Pros see active clients supplements" ON public.supplement_logs;
DROP POLICY IF EXISTS "Users manage own supplements" ON public.supplement_logs;
DROP POLICY IF EXISTS "Users can insert their own supplement logs" ON public.supplement_logs;
DROP POLICY IF EXISTS "Users can update their own supplement logs" ON public.supplement_logs;
DROP POLICY IF EXISTS "Users can delete their own supplement logs" ON public.supplement_logs;

CREATE POLICY "Users view own supplement logs"
    ON public.supplement_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Pros see active clients supplements"
    ON public.supplement_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM client_relationships WHERE client_id = supplement_logs.user_id AND professional_id = auth.uid() AND status = 'active'));

CREATE POLICY "Users manage own supplements"
    ON public.supplement_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own supplement logs" ON public.supplement_logs;
DROP POLICY IF EXISTS "Users delete own supplement logs" ON public.supplement_logs;

CREATE POLICY "Users update own supplement logs"
    ON public.supplement_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own supplement logs"
    ON public.supplement_logs FOR DELETE
    USING (auth.uid() = user_id);

-- === NUTRITION_LOGS ===
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own nutrition_logs" ON public.nutrition_logs;

CREATE POLICY "Users manage own nutrition_logs"
    ON public.nutrition_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === WATER_LOGS ===
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own water_logs" ON public.water_logs;

CREATE POLICY "Users manage own water_logs"
    ON public.water_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === HEALTH_DATA ===
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own health_data" ON public.health_data;

CREATE POLICY "Users manage own health_data"
    ON public.health_data FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === HEALTH_RECORDS ===
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own health_records" ON public.health_records;
DROP POLICY IF EXISTS "Pros view client health records" ON public.health_records;

CREATE POLICY "Users manage own health_records"
    ON public.health_records FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pros view client health records"
    ON public.health_records FOR SELECT
    USING (EXISTS (SELECT 1 FROM client_relationships WHERE client_id = health_records.user_id AND professional_id = auth.uid() AND status = 'active'));

-- === SLEEP_DATA ===
ALTER TABLE public.sleep_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sleep_data" ON public.sleep_data;

CREATE POLICY "Users manage own sleep_data"
    ON public.sleep_data FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === STRESS_LOGS ===
ALTER TABLE public.stress_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own stress_logs" ON public.stress_logs;

CREATE POLICY "Users manage own stress_logs"
    ON public.stress_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === WORKOUT_SESSIONS ===
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workout_sessions" ON public.workout_sessions;

CREATE POLICY "Users manage own workout_sessions"
    ON public.workout_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === WORKOUT_PLANS ===
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workout_plans" ON public.workout_plans;

CREATE POLICY "Users manage own workout_plans"
    ON public.workout_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === FOOD_SCANS ===
ALTER TABLE public.food_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own food_scans" ON public.food_scans;

CREATE POLICY "Users manage own food_scans"
    ON public.food_scans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === MEAL_PLANS ===
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own meal_plans" ON public.meal_plans;

CREATE POLICY "Users manage own meal_plans"
    ON public.meal_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === NUTRITION_PLANS ===
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own nutrition_plans" ON public.nutrition_plans;

CREATE POLICY "Users manage own nutrition_plans"
    ON public.nutrition_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === PROGRESS_LOGS ===
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own progress_logs" ON public.progress_logs;

CREATE POLICY "Users manage own progress_logs"
    ON public.progress_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 3. AI İÇERİKLER (ai_meal_plans, ai_workout_recommendations, ai_generated_programs, ai_analyses)
-- ████████████████████████████████████████████████████████████████████████████

-- === AI_MEAL_PLANS ===
ALTER TABLE public.ai_meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and active Pros view AI meals" ON public.ai_meal_plans;
DROP POLICY IF EXISTS "Users insert AI Plans" ON public.ai_meal_plans;
DROP POLICY IF EXISTS "Users manage own ai_meal_plans" ON public.ai_meal_plans;

CREATE POLICY "Users view own AI meals"
    ON public.ai_meal_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Pros view client AI meals"
    ON public.ai_meal_plans FOR SELECT
    USING (EXISTS (SELECT 1 FROM client_relationships WHERE client_id = ai_meal_plans.user_id AND professional_id = auth.uid() AND status = 'active'));

CREATE POLICY "Users insert AI Plans"
    ON public.ai_meal_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own AI meals"
    ON public.ai_meal_plans FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own AI meals"
    ON public.ai_meal_plans FOR DELETE
    USING (auth.uid() = user_id);

-- === AI_WORKOUT_RECOMMENDATIONS ===
ALTER TABLE public.ai_workout_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and active Pros view AI workouts" ON public.ai_workout_recommendations;
DROP POLICY IF EXISTS "Users insert AI Workouts" ON public.ai_workout_recommendations;

CREATE POLICY "Users view own AI workouts"
    ON public.ai_workout_recommendations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Pros view client AI workouts"
    ON public.ai_workout_recommendations FOR SELECT
    USING (EXISTS (SELECT 1 FROM client_relationships WHERE client_id = ai_workout_recommendations.user_id AND professional_id = auth.uid() AND status = 'active'));

CREATE POLICY "Users insert AI Workouts"
    ON public.ai_workout_recommendations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own AI workouts"
    ON public.ai_workout_recommendations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own AI workouts"
    ON public.ai_workout_recommendations FOR DELETE
    USING (auth.uid() = user_id);

-- === AI_GENERATED_PROGRAMS ===
ALTER TABLE public.ai_generated_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own programs" ON public.ai_generated_programs;

CREATE POLICY "Users manage own AI programs"
    ON public.ai_generated_programs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === AI_ANALYSES ===
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ai_analyses" ON public.ai_analyses;

CREATE POLICY "Users manage own ai_analyses"
    ON public.ai_analyses FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === USER_BODY_PHOTOS ===
ALTER TABLE public.user_body_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own photos" ON public.user_body_photos;

CREATE POLICY "Users manage own body photos"
    ON public.user_body_photos FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 4. PROFESYONEL ATAMALAR (assigned_workouts, assigned_nutrition_plans)
-- ████████████████████████████████████████████████████████████████████████████

-- === ASSIGNED_WORKOUTS ===
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PTs can manage their assigned workouts" ON public.assigned_workouts;
DROP POLICY IF EXISTS "Clients can view their assigned workouts" ON public.assigned_workouts;
DROP POLICY IF EXISTS "Clients can update their assigned workouts (e.g to mark complete)" ON public.assigned_workouts;

CREATE POLICY "PTs can manage their assigned workouts"
    ON public.assigned_workouts FOR ALL
    USING (auth.uid() = pt_id)
    WITH CHECK (auth.uid() = pt_id);

CREATE POLICY "Clients can view their assigned workouts"
    ON public.assigned_workouts FOR SELECT
    USING (auth.uid() = client_id);

CREATE POLICY "Clients can update their assigned workouts"
    ON public.assigned_workouts FOR UPDATE
    USING (auth.uid() = client_id);

-- === ASSIGNED_NUTRITION_PLANS ===
ALTER TABLE public.assigned_nutrition_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dietitians can manage their assigned plans" ON public.assigned_nutrition_plans;
DROP POLICY IF EXISTS "Clients can view their assigned plans" ON public.assigned_nutrition_plans;

CREATE POLICY "Dietitians can manage their assigned plans"
    ON public.assigned_nutrition_plans FOR ALL
    USING (auth.uid() = dietitian_id)
    WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Clients can view their assigned plans"
    ON public.assigned_nutrition_plans FOR SELECT
    USING (auth.uid() = client_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 5. LİG & GAMİFİKASYON SİSTEMİ
-- ████████████████████████████████████████████████████████████████████████████

-- === LEAGUES (Referans Tablosu) ===
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view leagues" ON public.leagues;

CREATE POLICY "Everyone can view leagues"
    ON public.leagues FOR SELECT
    USING (true);

-- Sadece admin yazabilir (service_role ile yönetilir)

-- === LEAGUE_GROUPS ===
ALTER TABLE public.league_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view league groups" ON public.league_groups;

CREATE POLICY "Everyone can view league groups"
    ON public.league_groups FOR SELECT
    USING (true);

-- === USER_LEAGUES ===
ALTER TABLE public.user_leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own league data" ON public.user_leagues;
DROP POLICY IF EXISTS "Users can update own league data" ON public.user_leagues;
DROP POLICY IF EXISTS "Users can insert own league data" ON public.user_leagues;

CREATE POLICY "Users can view own league data"
    ON public.user_leagues FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own league data"
    ON public.user_leagues FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own league data"
    ON public.user_leagues FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === LEAGUE_GROUP_MEMBERS ===
ALTER TABLE public.league_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view group members" ON public.league_group_members;
DROP POLICY IF EXISTS "Users can update own group member" ON public.league_group_members;
DROP POLICY IF EXISTS "Users can insert group member" ON public.league_group_members;

CREATE POLICY "Users can view group members"
    ON public.league_group_members FOR SELECT
    USING (true);

CREATE POLICY "Users can update own group member"
    ON public.league_group_members FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert group member"
    ON public.league_group_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === XP_TRANSACTIONS ===
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own XP" ON public.xp_transactions;
DROP POLICY IF EXISTS "Users can insert own XP" ON public.xp_transactions;

CREATE POLICY "Users can view own XP"
    ON public.xp_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP"
    ON public.xp_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === LEAGUE_HISTORY ===
ALTER TABLE public.league_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own league history" ON public.league_history;

CREATE POLICY "Users can view own league history"
    ON public.league_history FOR SELECT
    USING (auth.uid() = user_id);

-- === DAILY_STREAK_LEADERBOARD ===
-- Bu bir VIEW olduğu için RLS uygulanamaz. View, kaynak tablolarının RLS kurallarını miras alır.


-- ████████████████████████████████████████████████████████████████████████████
-- 6. GÜNLÜK SERİ (STREAK) SİSTEMİ
-- ████████████████████████████████████████████████████████████████████████████

-- === USER_DAILY_STREAKS ===
ALTER TABLE public.user_daily_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their daily streak" ON public.user_daily_streaks;
DROP POLICY IF EXISTS "Users can update their daily streak" ON public.user_daily_streaks;
DROP POLICY IF EXISTS "Users can insert daily streak" ON public.user_daily_streaks;

CREATE POLICY "Users can view their daily streak"
    ON public.user_daily_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their daily streak"
    ON public.user_daily_streaks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert daily streak"
    ON public.user_daily_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === DAILY_STREAK_ACTIVITIES ===
ALTER TABLE public.daily_streak_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view daily activities" ON public.daily_streak_activities;
DROP POLICY IF EXISTS "Users can log daily activities" ON public.daily_streak_activities;

CREATE POLICY "Users can view daily activities"
    ON public.daily_streak_activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can log daily activities"
    ON public.daily_streak_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === USER_DAILY_STREAK_MILESTONES ===
ALTER TABLE public.user_daily_streak_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their daily milestones" ON public.user_daily_streak_milestones;

CREATE POLICY "Users can view daily milestones"
    ON public.user_daily_streak_milestones FOR SELECT
    USING (auth.uid() = user_id);


-- === DAILY_STREAK_STATUS (Kullanıcının bugünkü durumu) ===
-- Bu bir VIEW olabilir, eğer tablo ise:
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_streak_status' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE public.daily_streak_status ENABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS "Users view own streak status" ON public.daily_streak_status';
        EXECUTE 'CREATE POLICY "Users view own streak status" ON public.daily_streak_status FOR SELECT USING (auth.uid() = user_id)';
    END IF;
END $$;

-- === USER_STREAKS (per-service) ===
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own user_streaks" ON public.user_streaks;

CREATE POLICY "Users manage own user_streaks"
    ON public.user_streaks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === STREAK_ACTIVITIES ===
ALTER TABLE public.streak_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own streak_activities" ON public.streak_activities;

CREATE POLICY "Users manage own streak_activities"
    ON public.streak_activities FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === USER_STREAK_MILESTONES ===
ALTER TABLE public.user_streak_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own streak milestones" ON public.user_streak_milestones;

CREATE POLICY "Users view own streak milestones"
    ON public.user_streak_milestones FOR SELECT
    USING (auth.uid() = user_id);

-- === FRIENDSHIP_STREAKS ===
ALTER TABLE public.friendship_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage friendship streaks" ON public.friendship_streaks;

CREATE POLICY "Users view own friendship streaks"
    ON public.friendship_streaks FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users update own friendship streaks"
    ON public.friendship_streaks FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users insert friendship streaks"
    ON public.friendship_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 7. GÖREVLER (MISSIONS)
-- ████████████████████████████████████████████████████████████████████████████

-- === WEEKLY_MISSIONS ===
ALTER TABLE public.weekly_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own weekly_missions" ON public.weekly_missions;
DROP POLICY IF EXISTS "Users can view own missions" ON public.weekly_missions;
DROP POLICY IF EXISTS "Users can update own missions" ON public.weekly_missions;
DROP POLICY IF EXISTS "Users can insert own missions" ON public.weekly_missions;

CREATE POLICY "Users view own weekly missions"
    ON public.weekly_missions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own weekly missions"
    ON public.weekly_missions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own weekly missions"
    ON public.weekly_missions FOR UPDATE
    USING (auth.uid() = user_id);

-- === DAILY_MISSIONS ===
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own daily_missions" ON public.daily_missions;
DROP POLICY IF EXISTS "Users can view own daily missions" ON public.daily_missions;
DROP POLICY IF EXISTS "Users can update own daily missions" ON public.daily_missions;
DROP POLICY IF EXISTS "Users can insert own daily missions" ON public.daily_missions;

CREATE POLICY "Users view own daily missions"
    ON public.daily_missions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily missions"
    ON public.daily_missions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily missions"
    ON public.daily_missions FOR UPDATE
    USING (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 8. MAĞAZA & PARA BİRİMİ
-- ████████████████████████████████████████████████████████████████████████████

-- === STORE_ITEMS (Referans - Herkes okur) ===
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view store items" ON public.store_items;

CREATE POLICY "Everyone can view store items"
    ON public.store_items FOR SELECT
    USING (true);

-- Admin ekleme/güncelleme service_role ile yapılır

-- === USER_INVENTORY ===
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.user_inventory;

CREATE POLICY "Users can view own inventory"
    ON public.user_inventory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
    ON public.user_inventory FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
    ON public.user_inventory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === USER_CURRENCY ===
ALTER TABLE public.user_currency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own currency" ON public.user_currency;
DROP POLICY IF EXISTS "Users can update own currency" ON public.user_currency;
DROP POLICY IF EXISTS "Users can insert own currency" ON public.user_currency;

CREATE POLICY "Users can view own currency"
    ON public.user_currency FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own currency"
    ON public.user_currency FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own currency"
    ON public.user_currency FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === PURCHASE_HISTORY ===
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchase_history;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchase_history;

CREATE POLICY "Users can view own purchases"
    ON public.purchase_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
    ON public.purchase_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 9. SOHBET SİSTEMİ (chats, chat_participants, messages, message_reads)
-- ████████████████████████████████████████████████████████████████████████████

-- === CHATS ===
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.chats;

CREATE POLICY "Users can view chats they participate in"
    ON public.chats FOR SELECT
    USING (EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = chats.id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats"
    ON public.chats FOR INSERT
    WITH CHECK (true);

-- === CHAT_PARTICIPANTS ===
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own chat participations" ON public.chat_participants;

CREATE POLICY "Users view own chat participations"
    ON public.chat_participants FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.chat_id = chat_participants.chat_id AND cp.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;
CREATE POLICY "Users can join chats"
    ON public.chat_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own participation" ON public.chat_participants;
CREATE POLICY "Users update own participation"
    ON public.chat_participants FOR UPDATE
    USING (auth.uid() = user_id);

-- === MESSAGES ===
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON public.messages;

CREATE POLICY "Users can view messages in their chats"
    ON public.messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = messages.chat_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert messages to their chats"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = messages.chat_id AND user_id = auth.uid()));

-- === MESSAGE_READS ===
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own message reads" ON public.message_reads;

CREATE POLICY "Users manage own message reads"
    ON public.message_reads FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 10. SOSYAL MEDYA & TOPLULUK
-- ████████████████████████████████████████████████████████████████████████████

-- === SOCIAL_POSTS ===
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read public social_posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users manage own social_posts" ON public.social_posts;

DROP POLICY IF EXISTS "Anyone read public social posts" ON public.social_posts;
CREATE POLICY "Anyone read public social posts"
    ON public.social_posts FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own social posts" ON public.social_posts;
CREATE POLICY "Users create own social posts"
    ON public.social_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own social posts" ON public.social_posts;
CREATE POLICY "Users update own social posts"
    ON public.social_posts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own social posts" ON public.social_posts;
CREATE POLICY "Users delete own social posts"
    ON public.social_posts FOR DELETE
    USING (auth.uid() = user_id);

-- === POST_COMMENTS ===
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read post_comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users create post_comments" ON public.post_comments;

DROP POLICY IF EXISTS "Anyone read post comments" ON public.post_comments;
CREATE POLICY "Anyone read post comments"
    ON public.post_comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users create post comments" ON public.post_comments;
CREATE POLICY "Users create post comments"
    ON public.post_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own post comments" ON public.post_comments;
CREATE POLICY "Users delete own post comments"
    ON public.post_comments FOR DELETE
    USING (auth.uid() = user_id);

-- === POST_LIKES ===
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own post_likes" ON public.post_likes;

DROP POLICY IF EXISTS "Anyone view post likes" ON public.post_likes;
CREATE POLICY "Anyone view post likes"
    ON public.post_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users insert own post likes" ON public.post_likes;
CREATE POLICY "Users insert own post likes"
    ON public.post_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own post likes" ON public.post_likes;
CREATE POLICY "Users delete own post likes"
    ON public.post_likes FOR DELETE
    USING (auth.uid() = user_id);

-- === COMMENT_LIKES ===
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own comment_likes" ON public.comment_likes;

DROP POLICY IF EXISTS "Anyone view comment likes" ON public.comment_likes;
CREATE POLICY "Anyone view comment likes"
    ON public.comment_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users insert own comment likes" ON public.comment_likes;
CREATE POLICY "Users insert own comment likes"
    ON public.comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own comment likes" ON public.comment_likes;
CREATE POLICY "Users delete own comment likes"
    ON public.comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- === FOLLOWS ===
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own follows" ON public.follows;

DROP POLICY IF EXISTS "Anyone view follows" ON public.follows;
CREATE POLICY "Anyone view follows"
    ON public.follows FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users insert own follows" ON public.follows;
CREATE POLICY "Users insert own follows"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users unfollow" ON public.follows;
CREATE POLICY "Users unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 11. ARKADAŞLIK SİSTEMİ
-- ████████████████████████████████████████████████████████████████████████████

-- === FRIEND_REQUESTS ===
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Receivers can update friend request status" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.friend_requests;

CREATE POLICY "Users view own friend requests"
    ON public.friend_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users send friend requests"
    ON public.friend_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers update friend request status"
    ON public.friend_requests FOR UPDATE
    USING (auth.uid() = receiver_id);

CREATE POLICY "Users delete own friend requests"
    ON public.friend_requests FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- === FRIENDSHIPS ===
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can update their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;

CREATE POLICY "Users view own friendships"
    ON public.friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users create friendships"
    ON public.friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own friendships"
    ON public.friendships FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own friendships"
    ON public.friendships FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- === FRIEND_ACTIVITIES ===
ALTER TABLE public.friend_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view friends activities" ON public.friend_activities;
DROP POLICY IF EXISTS "Users can create their own activities" ON public.friend_activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.friend_activities;

CREATE POLICY "Users view friends activities"
    ON public.friend_activities FOR SELECT
    USING (
        auth.uid() = user_id OR
        visibility = 'public' OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM friendships f
            WHERE (f.user_id = auth.uid() AND f.friend_id = friend_activities.user_id)
               OR (f.friend_id = auth.uid() AND f.user_id = friend_activities.user_id)
        ))
    );

CREATE POLICY "Users create own activities"
    ON public.friend_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own activities"
    ON public.friend_activities FOR DELETE
    USING (auth.uid() = user_id);

-- === FRIEND_WORKOUT_SHARES ===
ALTER TABLE public.friend_workout_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shared workouts" ON public.friend_workout_shares;
DROP POLICY IF EXISTS "Users can share their workouts" ON public.friend_workout_shares;
DROP POLICY IF EXISTS "Users can update their own shares" ON public.friend_workout_shares;
DROP POLICY IF EXISTS "Users can delete their own shares" ON public.friend_workout_shares;

CREATE POLICY "Users view shared workouts"
    ON public.friend_workout_shares FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.uid() = ANY(shared_with) OR
        EXISTS (
            SELECT 1 FROM friendships f
            WHERE (f.user_id = auth.uid() AND f.friend_id = friend_workout_shares.user_id)
               OR (f.friend_id = auth.uid() AND f.user_id = friend_workout_shares.user_id)
        )
    );

CREATE POLICY "Users share own workouts"
    ON public.friend_workout_shares FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own shares"
    ON public.friend_workout_shares FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own shares"
    ON public.friend_workout_shares FOR DELETE
    USING (auth.uid() = user_id);

-- === FRIEND_COMMENTS ===
ALTER TABLE public.friend_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments on shared workouts" ON public.friend_comments;
DROP POLICY IF EXISTS "Friends can add comments" ON public.friend_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.friend_comments;

CREATE POLICY "Users view comments on shared workouts"
    ON public.friend_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM friend_workout_shares ws
            WHERE ws.id = friend_comments.workout_share_id AND (
                ws.user_id = auth.uid() OR
                auth.uid() = ANY(ws.shared_with) OR
                EXISTS (
                    SELECT 1 FROM friendships f
                    WHERE (f.user_id = auth.uid() AND f.friend_id = ws.user_id)
                       OR (f.friend_id = auth.uid() AND f.user_id = ws.user_id)
                )
            )
        )
    );

CREATE POLICY "Friends add comments"
    ON public.friend_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM friend_workout_shares ws
            WHERE ws.id = friend_comments.workout_share_id AND (
                ws.user_id = auth.uid() OR
                auth.uid() = ANY(ws.shared_with) OR
                EXISTS (
                    SELECT 1 FROM friendships f
                    WHERE (f.user_id = auth.uid() AND f.friend_id = ws.user_id)
                       OR (f.friend_id = auth.uid() AND f.user_id = ws.user_id)
                )
            )
        )
    );

CREATE POLICY "Users delete own comments"
    ON public.friend_comments FOR DELETE
    USING (auth.uid() = user_id);

-- === FRIEND_LIKES ===
ALTER TABLE public.friend_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view likes" ON public.friend_likes;
DROP POLICY IF EXISTS "Friends can like workouts" ON public.friend_likes;
DROP POLICY IF EXISTS "Users can unlike" ON public.friend_likes;

CREATE POLICY "Anyone view friend likes"
    ON public.friend_likes FOR SELECT
    USING (true);

CREATE POLICY "Friends like workouts"
    ON public.friend_likes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM friend_workout_shares ws
            WHERE ws.id = friend_likes.workout_share_id AND (
                ws.user_id = auth.uid() OR
                auth.uid() = ANY(ws.shared_with) OR
                EXISTS (
                    SELECT 1 FROM friendships f
                    WHERE (f.user_id = auth.uid() AND f.friend_id = ws.user_id)
                       OR (f.friend_id = auth.uid() AND f.user_id = ws.user_id)
                )
            )
        )
    );

CREATE POLICY "Users remove own friend likes"
    ON public.friend_likes FOR DELETE
    USING (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 12. FORUM SİSTEMİ
-- ████████████████████████████████████████████████████████████████████████████

-- === FORUM_CATEGORIES (Referans) ===
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read forum_categories" ON public.forum_categories;

CREATE POLICY "Anyone can read forum categories"
    ON public.forum_categories FOR SELECT
    USING (true);

-- === FORUM_TOPICS ===
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read public forum_topics" ON public.forum_topics;
DROP POLICY IF EXISTS "Users create forum_topics" ON public.forum_topics;
DROP POLICY IF EXISTS "Users update own forum_topics" ON public.forum_topics;

CREATE POLICY "Anyone read forum topics"
    ON public.forum_topics FOR SELECT
    USING (true);

CREATE POLICY "Users create forum topics"
    ON public.forum_topics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own forum topics"
    ON public.forum_topics FOR UPDATE
    USING (auth.uid() = user_id);

-- === FORUM_POSTS ===
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read forum_posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users create forum_posts" ON public.forum_posts;

CREATE POLICY "Anyone read forum posts"
    ON public.forum_posts FOR SELECT
    USING (true);

CREATE POLICY "Users create forum posts"
    ON public.forum_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own forum posts"
    ON public.forum_posts FOR DELETE
    USING (auth.uid() = user_id);

-- === TOPIC_LIKES ===
ALTER TABLE public.topic_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own topic_likes" ON public.topic_likes;

CREATE POLICY "Anyone view topic likes"
    ON public.topic_likes FOR SELECT
    USING (true);

CREATE POLICY "Users insert topic likes"
    ON public.topic_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own topic likes"
    ON public.topic_likes FOR DELETE
    USING (auth.uid() = user_id);

-- === FORUM_POLLS ===
ALTER TABLE public.forum_polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read forum_polls" ON public.forum_polls;

CREATE POLICY "Anyone read forum polls"
    ON public.forum_polls FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users create forum polls" ON public.forum_polls;
CREATE POLICY "Users create forum polls"
    ON public.forum_polls FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM forum_topics
        WHERE id = forum_polls.topic_id
        AND user_id = auth.uid()
    ));

-- === POLL_VOTES ===
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own poll_votes" ON public.poll_votes;

CREATE POLICY "Users view poll votes"
    ON public.poll_votes FOR SELECT
    USING (true);

CREATE POLICY "Users insert own poll votes"
    ON public.poll_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 13. VİDEO İÇERİK
-- ████████████████████████████████████████████████████████████████████████████

-- === VIDEOS ===
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read videos" ON public.videos;

CREATE POLICY "Anyone view active videos"
    ON public.videos FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Creators manage own videos" ON public.videos;
CREATE POLICY "Creators manage own videos"
    ON public.videos FOR ALL
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- === VIDEO_PROGRESS ===
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own video_progress" ON public.video_progress;

CREATE POLICY "Users manage own video progress"
    ON public.video_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === VIDEO_LIKES ===
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own video_likes" ON public.video_likes;

DROP POLICY IF EXISTS "Anyone view video likes" ON public.video_likes;
CREATE POLICY "Anyone view video likes"
    ON public.video_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users insert video likes" ON public.video_likes;
CREATE POLICY "Users insert video likes"
    ON public.video_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own video likes" ON public.video_likes;
CREATE POLICY "Users delete own video likes"
    ON public.video_likes FOR DELETE
    USING (auth.uid() = user_id);

-- === VIDEO_COMMENTS ===
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read video_comments" ON public.video_comments;
DROP POLICY IF EXISTS "Users create video_comments" ON public.video_comments;

DROP POLICY IF EXISTS "Anyone read video comments" ON public.video_comments;
CREATE POLICY "Anyone read video comments"
    ON public.video_comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users create video comments" ON public.video_comments;
CREATE POLICY "Users create video comments"
    ON public.video_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own video comments" ON public.video_comments;
CREATE POLICY "Users delete own video comments"
    ON public.video_comments FOR DELETE
    USING (auth.uid() = user_id);

-- === VIDEO_PLAYLISTS ===
ALTER TABLE public.video_playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own playlists" ON public.video_playlists;

CREATE POLICY "Users manage own playlists"
    ON public.video_playlists FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone view public playlists" ON public.video_playlists;
CREATE POLICY "Anyone view public playlists"
    ON public.video_playlists FOR SELECT
    USING (is_public = true);

-- === PLAYLIST_VIDEOS ===
ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own playlist_videos" ON public.playlist_videos;

CREATE POLICY "Users manage own playlist videos"
    ON public.playlist_videos FOR ALL
    USING (EXISTS (SELECT 1 FROM video_playlists WHERE id = playlist_videos.playlist_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM video_playlists WHERE id = playlist_videos.playlist_id AND user_id = auth.uid()));


-- ████████████████████████████████████████████████████████████████████████████
-- 14. CHALLENGES (YARIŞMALAR)
-- ████████████████████████████████████████████████████████████████████████████

-- === CHALLENGES ===
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users manage own challenges" ON public.challenges;

CREATE POLICY "Anyone read active challenges"
    ON public.challenges FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users manage own challenges"
    ON public.challenges FOR ALL
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- === CHALLENGE_PARTICIPANTS ===
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own challenge_parts" ON public.challenge_participants;

CREATE POLICY "Anyone view challenge participants"
    ON public.challenge_participants FOR SELECT
    USING (true);

CREATE POLICY "Users join challenges"
    ON public.challenge_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own participation"
    ON public.challenge_participants FOR UPDATE
    USING (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 15. REFERANS VERİLERİ (supplements, vitamins, minerals, exercises, food_items)
-- ████████████████████████████████████████████████████████████████████████████

-- === SUPPLEMENTS ===
ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view verified supplements" ON public.supplements;
DROP POLICY IF EXISTS "Only admins can insert supplements" ON public.supplements;
DROP POLICY IF EXISTS "Only admins can update supplements" ON public.supplements;
DROP POLICY IF EXISTS "Only admins can delete supplements" ON public.supplements;

CREATE POLICY "Anyone view verified supplements"
    ON public.supplements FOR SELECT
    USING (is_verified = true);

CREATE POLICY "Admins insert supplements"
    ON public.supplements FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins update supplements"
    ON public.supplements FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins delete supplements"
    ON public.supplements FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- === VITAMINS ===
ALTER TABLE public.vitamins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view verified vitamins" ON public.vitamins;
DROP POLICY IF EXISTS "Only admins can insert vitamins" ON public.vitamins;
DROP POLICY IF EXISTS "Only admins can update vitamins" ON public.vitamins;
DROP POLICY IF EXISTS "Only admins can delete vitamins" ON public.vitamins;

CREATE POLICY "Anyone view verified vitamins"
    ON public.vitamins FOR SELECT
    USING (is_verified = true);

CREATE POLICY "Admins insert vitamins"
    ON public.vitamins FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins update vitamins"
    ON public.vitamins FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins delete vitamins"
    ON public.vitamins FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- === MINERALS ===
ALTER TABLE public.minerals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view verified minerals" ON public.minerals;
DROP POLICY IF EXISTS "Only admins can insert minerals" ON public.minerals;
DROP POLICY IF EXISTS "Only admins can update minerals" ON public.minerals;
DROP POLICY IF EXISTS "Only admins can delete minerals" ON public.minerals;

CREATE POLICY "Anyone view verified minerals"
    ON public.minerals FOR SELECT
    USING (is_verified = true);

CREATE POLICY "Admins insert minerals"
    ON public.minerals FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins update minerals"
    ON public.minerals FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins delete minerals"
    ON public.minerals FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- === EXERCISES (Referans) ===
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read exercises" ON public.exercises;

CREATE POLICY "Anyone read exercises"
    ON public.exercises FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins manage exercises" ON public.exercises;
CREATE POLICY "Admins manage exercises"
    ON public.exercises FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- === FOOD_ITEMS (Referans) ===
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read food_items" ON public.food_items;

CREATE POLICY "Anyone read food items"
    ON public.food_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins manage food items" ON public.food_items;
CREATE POLICY "Admins manage food items"
    ON public.food_items FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- === SUPPLEMENT_PLANS ===
ALTER TABLE public.supplement_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own supplement plans" ON public.supplement_plans;
DROP POLICY IF EXISTS "Users can insert their own supplement plans" ON public.supplement_plans;
DROP POLICY IF EXISTS "Users can update their own supplement plans" ON public.supplement_plans;
DROP POLICY IF EXISTS "Users can delete their own supplement plans" ON public.supplement_plans;

CREATE POLICY "Users manage own supplement plans"
    ON public.supplement_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === VITAMIN_LOGS ===
ALTER TABLE public.vitamin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own vitamin logs" ON public.vitamin_logs;
DROP POLICY IF EXISTS "Users can insert their own vitamin logs" ON public.vitamin_logs;
DROP POLICY IF EXISTS "Users can update their own vitamin logs" ON public.vitamin_logs;
DROP POLICY IF EXISTS "Users can delete their own vitamin logs" ON public.vitamin_logs;

CREATE POLICY "Users manage own vitamin logs"
    ON public.vitamin_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === VITAMIN_PLANS ===
ALTER TABLE public.vitamin_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own vitamin plans" ON public.vitamin_plans;
DROP POLICY IF EXISTS "Users can insert their own vitamin plans" ON public.vitamin_plans;
DROP POLICY IF EXISTS "Users can update their own vitamin plans" ON public.vitamin_plans;
DROP POLICY IF EXISTS "Users can delete their own vitamin plans" ON public.vitamin_plans;

CREATE POLICY "Users manage own vitamin plans"
    ON public.vitamin_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === MINERAL_LOGS ===
ALTER TABLE public.mineral_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mineral logs" ON public.mineral_logs;
DROP POLICY IF EXISTS "Users can insert their own mineral logs" ON public.mineral_logs;
DROP POLICY IF EXISTS "Users can update their own mineral logs" ON public.mineral_logs;
DROP POLICY IF EXISTS "Users can delete their own mineral logs" ON public.mineral_logs;

CREATE POLICY "Users manage own mineral logs"
    ON public.mineral_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === MINERAL_PLANS ===
ALTER TABLE public.mineral_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mineral plans" ON public.mineral_plans;
DROP POLICY IF EXISTS "Users can insert their own mineral plans" ON public.mineral_plans;
DROP POLICY IF EXISTS "Users can update their own mineral plans" ON public.mineral_plans;
DROP POLICY IF EXISTS "Users can delete their own mineral plans" ON public.mineral_plans;

CREATE POLICY "Users manage own mineral plans"
    ON public.mineral_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 16. ABONELİK & ÖDEME
-- ████████████████████████████████████████████████████████████████████████████

-- === SUBSCRIPTION_PLANS (Referans) ===
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read subscription_plans" ON public.subscription_plans;

CREATE POLICY "Anyone read subscription plans"
    ON public.subscription_plans FOR SELECT
    USING (true);

-- === USER_SUBSCRIPTIONS ===
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users manage own subscriptions"
    ON public.user_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === PAYMENT_METHODS ===
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own payment_methods" ON public.payment_methods;

CREATE POLICY "Users manage own payment methods"
    ON public.payment_methods FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === INVOICES ===
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own invoices" ON public.invoices;

DROP POLICY IF EXISTS "Users view own invoices" ON public.invoices;
CREATE POLICY "Users view own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own invoices" ON public.invoices;
CREATE POLICY "Users insert own invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === PAYMENT_HISTORY ===
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own payment_history" ON public.payment_history;

DROP POLICY IF EXISTS "Users view own payment history" ON public.payment_history;
CREATE POLICY "Users view own payment history"
    ON public.payment_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own payment history" ON public.payment_history;
CREATE POLICY "Users insert own payment history"
    ON public.payment_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 17. PROFESYONEL FİNANS (billing, transactions, checkins)
-- ████████████████████████████████████████████████████████████████████████████

-- === BILLING_CYCLES ===
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals view own billing cycles" ON public.billing_cycles;

CREATE POLICY "Professionals view own billing cycles"
    ON public.billing_cycles FOR SELECT
    USING (auth.uid() = professional_id);

-- === TRANSACTION_LOGS ===
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals view own transaction logs" ON public.transaction_logs;

CREATE POLICY "Professionals view own transaction logs"
    ON public.transaction_logs FOR SELECT
    USING (auth.uid() = professional_id);

-- === SESSION_CHECKINS ===
ALTER TABLE public.session_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own checkins via relation" ON public.session_checkins;
DROP POLICY IF EXISTS "Clients can verify their sessions" ON public.session_checkins;

DROP POLICY IF EXISTS "Users view own checkins" ON public.session_checkins;
CREATE POLICY "Users view own checkins"
    ON public.session_checkins FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM client_relationships cr
        WHERE cr.id = session_checkins.client_relationship_id
        AND (cr.client_id = auth.uid() OR cr.professional_id = auth.uid())
    ));

DROP POLICY IF EXISTS "PT creates checkins" ON public.session_checkins;
CREATE POLICY "PT creates checkins"
    ON public.session_checkins FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM client_relationships cr
        WHERE cr.id = session_checkins.client_relationship_id
        AND cr.professional_id = auth.uid()
        AND cr.status = 'active'
    ));

DROP POLICY IF EXISTS "Clients verify sessions" ON public.session_checkins;
CREATE POLICY "Clients verify sessions"
    ON public.session_checkins FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM client_relationships cr
        WHERE cr.id = session_checkins.client_relationship_id
        AND cr.client_id = auth.uid()
    ));

-- === PROFESSIONAL_AVAILABILITY ===
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view professional availability" ON public.professional_availability;
DROP POLICY IF EXISTS "Professionals manage own availability" ON public.professional_availability;

CREATE POLICY "Anyone view professional availability"
    ON public.professional_availability FOR SELECT
    USING (true);

CREATE POLICY "Professionals manage own availability"
    ON public.professional_availability FOR ALL
    USING (auth.uid() = professional_id)
    WITH CHECK (auth.uid() = professional_id);

-- === PROFESSIONAL_PRICING ===
ALTER TABLE public.professional_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view professional pricing" ON public.professional_pricing;
DROP POLICY IF EXISTS "Professionals manage own pricing" ON public.professional_pricing;

CREATE POLICY "Anyone view professional pricing"
    ON public.professional_pricing FOR SELECT
    USING (true);

CREATE POLICY "Professionals manage own pricing"
    ON public.professional_pricing FOR ALL
    USING (auth.uid() = professional_id)
    WITH CHECK (auth.uid() = professional_id);

-- === RATINGS ===
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.ratings;

CREATE POLICY "Anyone view ratings"
    ON public.ratings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users insert own ratings" ON public.ratings;
CREATE POLICY "Users insert own ratings"
    ON public.ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own ratings" ON public.ratings;
CREATE POLICY "Users update own ratings"
    ON public.ratings FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own ratings" ON public.ratings;
CREATE POLICY "Users delete own ratings"
    ON public.ratings FOR DELETE
    USING (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 18. BİLDİRİMLER
-- ████████████████████████████████████████████████████████████████████████████

-- === NOTIFICATIONS ===
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;

CREATE POLICY "Users manage own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === USER_PUSH_TOKENS ===
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push_tokens" ON public.user_push_tokens;

CREATE POLICY "Users manage own push tokens"
    ON public.user_push_tokens FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === NOTIFICATION_PREFERENCES ===
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notif_prefs" ON public.notification_preferences;

CREATE POLICY "Users manage own notification preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === SCHEDULED_NOTIFICATIONS ===
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own scheduled_notifs" ON public.scheduled_notifications;

CREATE POLICY "Users manage own scheduled notifications"
    ON public.scheduled_notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === NOTIFICATION_SCHEDULES ===
ALTER TABLE public.notification_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notification schedules" ON public.notification_schedules;

CREATE POLICY "Users manage own notification schedules"
    ON public.notification_schedules FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 19. HUKUK & UYUM (KVKK/GDPR)
-- ████████████████████████████████████████████████████████████████████████████

-- === USER_AGREEMENTS ===
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own agreements" ON public.user_agreements;
DROP POLICY IF EXISTS "Users can view own agreements" ON public.user_agreements;
DROP POLICY IF EXISTS "Users can insert own agreements" ON public.user_agreements;
DROP POLICY IF EXISTS "Users can update own agreements" ON public.user_agreements;

CREATE POLICY "Users view own agreements"
    ON public.user_agreements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own agreements"
    ON public.user_agreements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own agreements"
    ON public.user_agreements FOR UPDATE
    USING (auth.uid() = user_id);

-- === AGREEMENT_VERSIONS (Referans) ===
ALTER TABLE public.agreement_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view agreement versions" ON public.agreement_versions;

CREATE POLICY "Anyone view agreement versions"
    ON public.agreement_versions FOR SELECT
    USING (true);

-- === DISTANCE_SALES_CONTRACTS ===
ALTER TABLE public.distance_sales_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contracts" ON public.distance_sales_contracts;
DROP POLICY IF EXISTS "Users can insert own contracts" ON public.distance_sales_contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON public.distance_sales_contracts;

CREATE POLICY "Users view own contracts"
    ON public.distance_sales_contracts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own contracts"
    ON public.distance_sales_contracts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own contracts"
    ON public.distance_sales_contracts FOR UPDATE
    USING (auth.uid() = user_id);

-- === BIOMETRIC_CONSENTS ===
ALTER TABLE public.biometric_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own biometric consents" ON public.biometric_consents;
DROP POLICY IF EXISTS "Users can insert own biometric consents" ON public.biometric_consents;

CREATE POLICY "Users view own biometric consents"
    ON public.biometric_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own biometric consents"
    ON public.biometric_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own biometric consents" ON public.biometric_consents;
CREATE POLICY "Users update own biometric consents"
    ON public.biometric_consents FOR UPDATE
    USING (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 20. KULLANICI TERCİHLERİ & GİZLİLİK
-- ████████████████████████████████████████████████████████████████████████████

-- === USER_PREFERENCES ===
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own preferences" ON public.user_preferences;

CREATE POLICY "Users manage own preferences"
    ON public.user_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === USER_PRIVACY_SETTINGS ===
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and edit their own privacy settings" ON public.user_privacy_settings;

CREATE POLICY "Users manage own privacy settings"
    ON public.user_privacy_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === FOOD_PREFERENCES ===
ALTER TABLE public.food_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own food_prefs" ON public.food_preferences;

CREATE POLICY "Users manage own food preferences"
    ON public.food_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === USER_GOALS ===
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own goals_table" ON public.user_goals;

CREATE POLICY "Users manage own user goals"
    ON public.user_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === GOALS ===
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own goals_gen" ON public.goals;

CREATE POLICY "Users manage own goals"
    ON public.goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === HEALTH_GOALS ===
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own health_goals" ON public.health_goals;

CREATE POLICY "Users manage own health goals"
    ON public.health_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === USER_FEEDBACK ===
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own feedback" ON public.user_feedback;

CREATE POLICY "Users manage own feedback"
    ON public.user_feedback FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 21. WEARABLE CİHAZLAR
-- ████████████████████████████████████████████████████████████████████████████

-- === WEARABLE_DEVICES ===
ALTER TABLE public.wearable_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wearables" ON public.wearable_devices;

CREATE POLICY "Users manage own wearable devices"
    ON public.wearable_devices FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████████████████████
-- 22. İLERLEME RAPORLARI (progress_reports, shared_reports)
-- ████████████████████████████████████████████████████████████████████████████

-- === PROGRESS_REPORTS ===
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reports" ON public.progress_reports;

CREATE POLICY "Users manage own progress reports"
    ON public.progress_reports FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- === SHARED_REPORTS ===
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own shared_reports" ON public.shared_reports;

DROP POLICY IF EXISTS "Users view shared reports" ON public.shared_reports;
CREATE POLICY "Users view shared reports"
    ON public.shared_reports FOR SELECT
    USING (auth.uid() = shared_with);

DROP POLICY IF EXISTS "Report owners share reports" ON public.shared_reports;
CREATE POLICY "Report owners share reports"
    ON public.shared_reports FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM progress_reports WHERE id = shared_reports.report_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Report owners delete shared" ON public.shared_reports;
CREATE POLICY "Report owners delete shared"
    ON public.shared_reports FOR DELETE
    USING (EXISTS (SELECT 1 FROM progress_reports WHERE id = shared_reports.report_id AND user_id = auth.uid()));


-- ████████████████████████████████████████████████████████████████████████████
-- 23. İÇERİK MODERASYONu
-- ████████████████████████████████████████████████████████████████████████████

-- === CONTENT_VIOLATIONS ===
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_violations') THEN
        ALTER TABLE public.content_violations ENABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS "Only admins can view content violations" ON public.content_violations';
        EXECUTE 'DROP POLICY IF EXISTS "System can insert violations" ON public.content_violations';
        EXECUTE 'DROP POLICY IF EXISTS "Admins view content violations" ON public.content_violations';
        EXECUTE 'CREATE POLICY "Admins view content violations" ON public.content_violations FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''))';
        EXECUTE 'DROP POLICY IF EXISTS "Users view own violations" ON public.content_violations';
        EXECUTE 'CREATE POLICY "Users view own violations" ON public.content_violations FOR SELECT USING (auth.uid() = user_id)';
    END IF;
END $$;

-- System inserts via service_role

-- === CONTENT_REPORTS ===
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_reports') THEN
        ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS "Users can report content" ON public.content_reports';
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own reports" ON public.content_reports';
        EXECUTE 'DROP POLICY IF EXISTS "Users report content" ON public.content_reports';
        EXECUTE 'CREATE POLICY "Users report content" ON public.content_reports FOR INSERT WITH CHECK (auth.uid() = reported_by)';
        EXECUTE 'DROP POLICY IF EXISTS "Users view own reports" ON public.content_reports';
        EXECUTE 'CREATE POLICY "Users view own reports" ON public.content_reports FOR SELECT USING (auth.uid() = reported_by)';
        EXECUTE 'DROP POLICY IF EXISTS "Admins view all reports" ON public.content_reports';
        EXECUTE 'CREATE POLICY "Admins view all reports" ON public.content_reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''))';
        EXECUTE 'DROP POLICY IF EXISTS "Admins update report status" ON public.content_reports';
        EXECUTE 'CREATE POLICY "Admins update report status" ON public.content_reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''))';
    END IF;
END $$;


-- ████████████████████████████████████████████████████████████████████████████
-- 24. DAILY_STREAK_MILESTONES (Referans tablosu - milestone tanımları)
-- ████████████████████████████████████████████████████████████████████████████

-- === DAILY_STREAK_MILESTONES (genel milestone tanımları) ===
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_streak_milestones' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE public.daily_streak_milestones ENABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS "Anyone view streak milestone definitions" ON public.daily_streak_milestones';
        EXECUTE 'CREATE POLICY "Anyone view streak milestone definitions" ON public.daily_streak_milestones FOR SELECT USING (true)';
    END IF;
END $$;

-- === STREAK_MILESTONES (genel milestone tanımları) ===
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'streak_milestones' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE public.streak_milestones ENABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS "Anyone view streak milestones" ON public.streak_milestones';
        EXECUTE 'CREATE POLICY "Anyone view streak milestones" ON public.streak_milestones FOR SELECT USING (true)';
    END IF;
END $$;


-- ████████████████████████████████████████████████████████████████████████████
-- 25. SUPABASE STORAGE BUCKET GÜVENLİĞİ
-- ████████████████████████████████████████████████████████████████████████████

-- Profil fotoğrafları bucket'ı
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Vücut fotoğrafları bucket'ı (özel)
INSERT INTO storage.buckets (id, name, public) VALUES ('body-photos', 'body-photos', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own body photos" ON storage.objects;
CREATE POLICY "Users upload own body photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users view own body photos" ON storage.objects;
CREATE POLICY "Users view own body photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own body photos" ON storage.objects;
CREATE POLICY "Users delete own body photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Chat medya bucket'ı (özel)
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Chat participants upload media" ON storage.objects;
CREATE POLICY "Chat participants upload media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Chat participants view media" ON storage.objects;
CREATE POLICY "Chat participants view media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

-- Progress fotoğrafları bucket'ı (özel)
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own progress photos" ON storage.objects;
CREATE POLICY "Users upload own progress photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users view own progress photos" ON storage.objects;
CREATE POLICY "Users view own progress photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own progress photos" ON storage.objects;
CREATE POLICY "Users delete own progress photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ████████████████████████████████████████████████████████████████████████████
-- TEK SEFERLE ÇALIŞTIRMAK İÇİN SONLANDIRMA
-- ████████████████████████████████████████████████████████████████████████████

-- Bu SQL dosyasını Supabase Dashboard > SQL Editor'de çalıştırın.
-- Tüm tablolarda RLS aktif edilecek ve güvenlik politikaları uygulanacaktır.
-- service_role key ile yapılan istekler RLS'i bypass eder (backend fonksiyonları için).
-- anon key ve authenticated key ile yapılan istekler bu kurallara tabi olur.
