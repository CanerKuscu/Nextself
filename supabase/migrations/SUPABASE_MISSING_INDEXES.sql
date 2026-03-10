-- ============================================
-- MISSING INDEXES ANALYSIS
-- Indexes that exist in Supabase but missing from project
-- ============================================

-- Based on comparison between Supabase CSV indexes and project FINAL_INDEXES.sql

-- CRITICAL MISSING INDEXES:

-- 1. AGREEMENT VERSIONS
CREATE INDEX IF NOT EXISTS unique_agreement_version ON public.agreement_versions(agreement_type, version);

-- 2. AI GENERATED PROGRAMS
CREATE INDEX IF NOT EXISTS idx_ai_programs_user ON public.ai_generated_programs(user_id);

-- 3. BIOMETRIC CONSENTS (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS idx_bio_consent_granted_at ON public.biometric_consents(granted_at);
CREATE INDEX IF NOT EXISTS idx_bio_consent_type ON public.biometric_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_bio_consent_user_id ON public.biometric_consents(user_id);

-- 4. CHALLENGE PARTICIPANTS
CREATE INDEX IF NOT EXISTS challenge_participants_challenge_id_user_id_key ON public.challenge_participants(challenge_id, user_id);

-- 5. CHAT PARTICIPANTS
CREATE INDEX IF NOT EXISTS chat_participants_chat_id_user_id_key ON public.chat_participants(chat_id, user_id);

-- 6. CLIENT RELATIONSHIPS (Additional indexes)
CREATE INDEX IF NOT EXISTS idx_client_relationships_client_id ON public.client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_professional_id ON public.client_relationships(professional_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_status ON public.client_relationships(status);

-- 7. COMMENT LIKES
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_user_id_key ON public.comment_likes(comment_id, user_id);

-- 8. DAILY MISSIONS (Additional index)
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON public.daily_missions(user_id, mission_date);

-- 9. DAILY STREAK ACTIVITIES (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS daily_streak_activities_user_id_activity_date_key ON public.daily_streak_activities(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_daily_streak_activities_date ON public.daily_streak_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_daily_streak_activities_user ON public.daily_streak_activities(user_id);

-- 10. DISTANCE SALES CONTRACTS (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS distance_sales_contracts_contract_number_key ON public.distance_sales_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_dsc_contract_number ON public.distance_sales_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_dsc_created_at ON public.distance_sales_contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_dsc_status ON public.distance_sales_contracts(status);
CREATE INDEX IF NOT EXISTS idx_dsc_user_id ON public.distance_sales_contracts(user_id);

-- 11. EXERCISES (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON public.exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON public.exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON public.exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_name_tr ON public.exercises USING gin(name_tr gin_trgm_ops);

-- 12. FOLLOWS (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS follows_follower_id_following_id_key ON public.follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- 13. FOOD ITEMS (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS food_items_barcode_key ON public.food_items(barcode);
CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON public.food_items(barcode);
CREATE INDEX IF NOT EXISTS idx_food_items_name ON public.food_items USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_food_items_name_tr ON public.food_items USING gin(name_tr gin_trgm_ops);

-- 14. FOOD PREFERENCES
CREATE INDEX IF NOT EXISTS food_preferences_user_id_key ON public.food_preferences(user_id);

-- 15. FOOD SCANS
CREATE INDEX IF NOT EXISTS idx_food_scans_user ON public.food_scans(user_id);

-- 16. FORUM POSTS
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON public.forum_posts(topic_id);

-- 17. FORUM TOPICS
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON public.forum_topics(category_id);

-- 18. FRIEND ACTIVITIES (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS idx_friend_activities_created ON public.friend_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_friend_activities_type ON public.friend_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_friend_activities_user_id ON public.friend_activities(user_id);

-- 19. FRIEND COMMENTS
CREATE INDEX IF NOT EXISTS idx_friend_comments_workout ON public.friend_comments(workout_share_id);

-- 20. FRIEND LIKES (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS friend_likes_workout_share_id_user_id_key ON public.friend_likes(workout_share_id, user_id);
CREATE INDEX IF NOT EXISTS idx_friend_likes_workout ON public.friend_likes(workout_share_id);

-- 21. FRIEND REQUESTS (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS friend_requests_sender_id_receiver_id_key ON public.friend_requests(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

-- 22. FRIEND WORKOUT SHARES (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS idx_friend_workout_shares_created ON public.friend_workout_shares(created_at);
CREATE INDEX IF NOT EXISTS idx_friend_workout_shares_user ON public.friend_workout_shares(user_id);

-- 23. FRIENDSHIPS (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS friendships_user_id_friend_id_key ON public.friendships(user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);

-- 24. FRIENDSHIP STREAKS (Multiple missing indexes)
CREATE INDEX IF NOT EXISTS friendship_streaks_user_id_friend_id_key ON public.friendship_streaks(user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_friendship_streaks_current ON public.friendship_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_friendship_streaks_friend ON public.friendship_streaks(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendship_streaks_user ON public.friendship_streaks(user_id);

-- 25. HEALTH DATA (Additional missing indexes)
CREATE INDEX IF NOT EXISTS idx_health_data_user ON public.health_data(user_id, data_type);
CREATE INDEX IF NOT EXISTS idx_health_data_user_weight ON public.health_data(user_id, recorded_at DESC) WHERE (weight IS NOT NULL);

-- 26. HEALTH GOALS
CREATE INDEX IF NOT EXISTS health_goals_user_id_goal_type_key ON public.health_goals(user_id, goal_type);

-- PERFORMANCE OPTIMIZATION INDEXES:

-- 27. SOCIAL POSTS (Missing created_at index)
CREATE INDEX IF NOT EXISTS idx_social_posts_created_desc ON public.social_posts(created_at DESC);

-- 28. NOTIFICATIONS (Missing composite index for unread)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE (is_read = FALSE);

-- 29. PROFESSIONAL PROFILES (Missing type and active composite index)
CREATE INDEX IF NOT EXISTS idx_professional_profiles_type_active ON public.professional_profiles(professional_type, is_active) WHERE (is_active = TRUE);

-- 30. USERS (Missing professional index)
CREATE INDEX IF NOT EXISTS idx_users_is_professional ON public.users(is_professional) WHERE (is_professional = TRUE);

-- TRIGRAM INDEXES for Turkish search:
CREATE INDEX IF NOT EXISTS idx_exercises_name_tr ON public.exercises USING gin(name_tr gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_food_items_name_tr ON public.food_items USING gin(name_tr gin_trgm_ops);
