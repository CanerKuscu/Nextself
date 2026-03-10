-- ============================================
-- SUPABASE TABLE COMPARISON ANALYSIS
-- ============================================

-- Tables from Supabase CSV (101 tables)
WITH supabase_tables AS (
  SELECT unnest(ARRAY[
    'agreement_versions', 'ai_analyses', 'ai_generated_programs', 'ai_meal_plans', 
    'ai_workout_recommendations', 'assigned_nutrition_plans', 'assigned_workouts',
    'available_professionals_by_time', 'billing_cycles', 'biometric_consents',
    'challenge_participants', 'challenges', 'chat_participants', 'chats',
    'client_relationships', 'comment_likes', 'courses', 'daily_missions',
    'daily_streak_activities', 'daily_streak_leaderboard', 'daily_streak_milestones',
    'daily_streak_notifications', 'daily_streak_status', 'distance_sales_contracts',
    'exercises', 'follows', 'food_items', 'food_preferences', 'food_scans',
    'forum_categories', 'forum_polls', 'forum_posts', 'forum_topics',
    'friend_activities', 'friend_comments', 'friend_likes', 'friend_requests',
    'friend_workout_shares', 'friendship_streaks', 'friendships', 'goals',
    'health_data', 'health_goals', 'health_records', 'invoices', 'league_group_members',
    'league_groups', 'league_history', 'leagues', 'meal_plans', 'message_reads',
    'messages', 'mineral_logs', 'mineral_plans', 'minerals', 'minerals_by_type',
    'minerals_tr', 'notification_preferences', 'notification_schedules',
    'notifications', 'nutrition_logs', 'nutrition_plans', 'payment_history',
    'payment_methods', 'pending_friend_requests_view', 'playlist_videos',
    'poll_votes', 'post_comments', 'post_likes', 'professional_availability',
    'professional_pricing', 'professional_profiles', 'professional_profiles_with_ratings',
    'profiles', 'progress_logs', 'progress_reports', 'purchase_history', 'ratings',
    'scheduled_notifications', 'session_checkins', 'shared_reports', 'sleep_data',
    'social_posts', 'store_items', 'streak_activities', 'streak_milestones',
    'stress_logs', 'subscription_plans', 'supplement_logs', 'supplement_plans',
    'supplements', 'supplements_by_category', 'supplements_search', 'supplements_tr',
    'top_rated_professionals', 'topic_likes', 'transaction_logs', 'user_agreements',
    'user_body_photos', 'user_currency'
  ]) as table_name
),

-- Tables defined in project SQL files
project_tables AS (
  SELECT unnest(ARRAY[
    'profiles', 'professional_profiles', 'client_relationships', 'users', 'ratings',
    'supplements', 'workouts', 'nutrition_logs', 'water_logs', 'health_data',
    'health_records', 'chats', 'chat_participants', 'messages', 'message_reads',
    'user_privacy_settings', 'assigned_workouts', 'assigned_nutrition_plans',
    'billing_cycles', 'transaction_logs', 'session_checkins', 'exercises',
    'food_items', 'food_preferences', 'food_scans', 'daily_missions',
    'weekly_missions', 'social_posts', 'notifications', 'notification_preferences',
    'notification_schedules', 'biometric_consents', 'goals', 'health_goals',
    'progress_logs', 'progress_reports', 'sleep_data', 'stress_logs',
    'supplement_logs', 'supplement_plans', 'mineral_logs', 'mineral_plans',
    'nutrition_plans', 'meal_plans', 'friendships', 'friend_requests',
    'friend_activities', 'friend_likes', 'friend_comments', 'friend_workout_shares',
    'follows', 'forum_categories', 'forum_topics', 'forum_posts', 'forum_polls',
    'challenges', 'challenge_participants', 'leagues', 'league_groups',
    'league_group_members', 'league_history', 'courses', 'playlist_videos',
    'store_items', 'purchase_history', 'payment_history', 'payment_methods',
    'invoices', 'subscription_plans', 'user_agreements', 'agreement_versions',
    'user_body_photos', 'user_currency', 'distance_sales_contracts',
    'ai_analyses', 'ai_generated_programs', 'ai_meal_plans', 'ai_workout_recommendations',
    'streak_activities', 'streak_milestones', 'daily_streak_activities',
    'daily_streak_leaderboard', 'daily_streak_milestones', 'daily_streak_notifications',
    'daily_streak_status', 'friendship_streaks', 'shared_reports', 'scheduled_notifications',
    'post_comments', 'post_likes', 'topic_likes', 'comment_likes', 'poll_votes',
    'professional_availability', 'professional_pricing', 'available_professionals_by_time',
    'professional_profiles_with_ratings', 'top_rated_professionals', 'pending_friend_requests_view',
    'minerals', 'minerals_by_type', 'minerals_tr', 'supplements_by_category',
    'supplements_search', 'supplements_tr'
  ]) as table_name
)

-- Comparison Analysis
SELECT 
  'Tables in Supabase but NOT in project' as analysis_type,
  string_agg(st.table_name, ', ') as missing_tables
FROM supabase_tables st
WHERE st.table_name NOT IN (SELECT table_name FROM project_tables)

UNION ALL

SELECT 
  'Tables in project but NOT in Supabase' as analysis_type,
  string_agg(pt.table_name, ', ') as extra_tables
FROM project_tables pt
WHERE pt.table_name NOT IN (SELECT table_name FROM supabase_tables)

UNION ALL

SELECT 
  'Common tables (both exist)' as analysis_type,
  string_agg(st.table_name, ', ') as common_tables
FROM supabase_tables st
JOIN project_tables pt ON st.table_name = pt.table_name;
