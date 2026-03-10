-- ============================================
-- CLEANUP - DELETE REDUNDANT TABLES (FIXED)
-- Separate tables and views
-- ============================================

-- ⚠️ WARNING: This will delete 31 redundant items
-- Make sure you have backups before running!

-- 🎮 VIDEO SYSTEM (5 tables)
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.video_comments CASCADE;
DROP TABLE IF EXISTS public.video_likes CASCADE;
DROP TABLE IF EXISTS public.video_playlists CASCADE;
DROP TABLE IF EXISTS public.video_progress CASCADE;

-- 👤 USER EXTRA TABLES (12 tables)
DROP TABLE IF EXISTS public.user_daily_streak_milestones CASCADE;
DROP TABLE IF EXISTS public.user_daily_streaks CASCADE;
DROP TABLE IF EXISTS public.user_feedback CASCADE;
DROP TABLE IF EXISTS public.user_goals CASCADE;
DROP TABLE IF EXISTS public.user_inventory CASCADE;
DROP TABLE IF EXISTS public.user_leagues CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_privacy_settings CASCADE;
DROP TABLE IF EXISTS public.user_progress_summary CASCADE;
DROP TABLE IF EXISTS public.user_push_tokens CASCADE;
DROP TABLE IF EXISTS public.user_streak_milestones CASCADE;
DROP TABLE IF EXISTS public.user_streaks CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- 💊 VITAMIN SYSTEM (5 tables) - supplements already exist
DROP TABLE IF EXISTS public.vitamins CASCADE;
DROP TABLE IF EXISTS public.vitamin_logs CASCADE;
DROP TABLE IF EXISTS public.vitamin_plans CASCADE;
DROP TABLE IF EXISTS public.vitamins_by_type CASCADE;
DROP TABLE IF EXISTS public.vitamins_tr CASCADE;

-- 🏋️ WORKOUT EXTRAS (3 tables)
DROP TABLE IF EXISTS public.workout_plans CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.weekly_missions CASCADE;

-- 📱 OTHER EXTRAS (3 tables)
DROP TABLE IF EXISTS public.wearable_devices CASCADE;
DROP TABLE IF EXISTS public.xp_transactions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- Using profiles instead

-- 👁️ VIEWS (1 view)
DROP VIEW IF EXISTS public.user_friends_view CASCADE;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check remaining table count
SELECT COUNT(*) as remaining_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- List remaining tables (should be 101)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
