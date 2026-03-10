-- ============================================
-- FINAL CLEANUP - DELETE REDUNDANT ITEMS (CORRECTED)
-- Tables and Views separated properly
-- ============================================

-- ⚠️ WARNING: This will delete redundant items
-- Make sure you have backups before running!

-- 🎮 VIDEO SYSTEM (5 tables) - Not in original CSV
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.video_comments CASCADE;
DROP TABLE IF EXISTS public.video_likes CASCADE;
DROP TABLE IF EXISTS public.video_playlists CASCADE;
DROP TABLE IF EXISTS public.video_progress CASCADE;

-- 👤 USER EXTRA TABLES (12 tables) - Not in original CSV
DROP TABLE IF EXISTS public.user_daily_streak_milestones CASCADE;
DROP TABLE IF EXISTS public.user_daily_streaks CASCADE;
DROP TABLE IF EXISTS public.user_feedback CASCADE;
DROP TABLE IF EXISTS public.user_goals CASCADE;
DROP TABLE IF EXISTS public.user_inventory CASCADE;
DROP TABLE IF EXISTS public.user_leagues CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_privacy_settings CASCADE;
DROP TABLE IF EXISTS public.user_push_tokens CASCADE;
DROP TABLE IF EXISTS public.user_streak_milestones CASCADE;
DROP TABLE IF EXISTS public.user_streaks CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- 💊 VITAMIN SYSTEM (5 tables) - Not in original CSV (supplements already exist)
DROP TABLE IF EXISTS public.vitamins CASCADE;
DROP TABLE IF EXISTS public.vitamin_logs CASCADE;
DROP TABLE IF EXISTS public.vitamin_plans CASCADE;
DROP TABLE IF EXISTS public.vitamins_by_type CASCADE;
DROP TABLE IF EXISTS public.vitamins_tr CASCADE;

-- 🏋️ WORKOUT EXTRAS (3 tables) - Not in original CSV
DROP TABLE IF EXISTS public.workout_plans CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.weekly_missions CASCADE;

-- 📱 OTHER EXTRAS (3 tables) - Not in original CSV
DROP TABLE IF EXISTS public.wearable_devices CASCADE;
DROP TABLE IF EXISTS public.xp_transactions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- Using profiles instead

-- 👁️ VIEWS - Check which ones are redundant vs needed
-- Some views might be needed, let's keep the important ones for now
-- DROP VIEW IF EXISTS public.user_progress_summary CASCADE; -- This might not exist anymore

-- ============================================
-- VERIFICATION
-- ============================================

-- Check remaining counts
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as remaining_tables,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as remaining_views;

-- List remaining tables (should be close to 101)
SELECT 'TABLE' as type, table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'VIEW' as type, table_name  
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY type, table_name;
