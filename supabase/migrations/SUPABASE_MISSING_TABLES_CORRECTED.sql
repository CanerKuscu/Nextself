-- ============================================
-- BIOSYNC MISSING TABLES - CORRECTED VERSION
-- Based on actual table structures from project files
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- DROP EXISTING VIEWS FIRST (to avoid conflicts)
-- ============================================

DROP VIEW IF EXISTS public.professional_profiles_with_ratings CASCADE;
DROP VIEW IF EXISTS public.top_rated_professionals CASCADE;
DROP VIEW IF EXISTS public.pending_friend_requests_view CASCADE;
DROP VIEW IF EXISTS public.available_professionals_by_time CASCADE;

-- ============================================
-- MISSING TABLES FROM PROJECT
-- ============================================

-- 1. POST LIKES and COMMENTS SYSTEM
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 2. TOPIC LIKES and POLL VOTES
CREATE TABLE IF NOT EXISTS public.topic_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.forum_polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_option TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- 3. STREAK SYSTEM
CREATE TABLE IF NOT EXISTS public.streak_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date, activity_type)
);

CREATE TABLE IF NOT EXISTS public.streak_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL,
    milestone_value INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. DAILY STREAK SYSTEM
CREATE TABLE IF NOT EXISTS public.daily_streak_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activities_completed INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS public.daily_streak_leaderboard (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    rank_position INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_streak_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone_days INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reward_points INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.daily_streak_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_streak_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_days_active INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. FRIENDSHIP STREAKS
CREATE TABLE IF NOT EXISTS public.friendship_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_interaction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- 6. SCHEDULED NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SHARED REPORTS
CREATE TABLE IF NOT EXISTS public.shared_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    report_data JSONB NOT NULL,
    share_token TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. MINERALS SYSTEM (extended version)
CREATE TABLE IF NOT EXISTS public.minerals_by_type (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mineral_id UUID REFERENCES public.minerals(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.minerals_tr (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mineral_id UUID REFERENCES public.minerals(id) ON DELETE CASCADE,
    name_tr TEXT NOT NULL,
    description_tr TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. SUPPLEMENT SEARCH and CATEGORIES
CREATE TABLE IF NOT EXISTS public.supplements_by_category (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplement_id UUID REFERENCES public.supplements(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplements_search (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplement_id UUID REFERENCES public.supplements(id) ON DELETE CASCADE UNIQUE,
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplements_tr (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplement_id UUID REFERENCES public.supplements(id) ON DELETE CASCADE UNIQUE,
    name_tr TEXT NOT NULL,
    description_tr TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. PROFESSIONAL AVAILABILITY and PRICING
CREATE TABLE IF NOT EXISTS public.professional_availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.professional_pricing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RECREATE VIEWS (using correct column names from actual tables)
-- ============================================

-- 11. VIEWS FOR PROFESSIONAL PROFILES
CREATE OR REPLACE VIEW public.professional_profiles_with_ratings AS
SELECT 
    pp.id,
    pp.user_id,
    pp.professional_type,
    pp.bio,
    pp.specialties,
    pp.experience_years,
    pp.is_verified,
    pp.commission_rate,
    pp.average_rating as profile_avg_rating,
    pp.total_ratings as profile_total_ratings,
    pp.location,
    pp.pricing,
    pp.languages,
    pp.is_active,
    pp.created_at,
    pp.updated_at,
    COALESCE(AVG(r.rating), 0) as calculated_avg_rating,
    COUNT(r.id) as rating_count
FROM public.professional_profiles pp
LEFT JOIN public.ratings r ON pp.user_id = r.professional_id
GROUP BY pp.id;

CREATE OR REPLACE VIEW public.top_rated_professionals AS
SELECT 
    pp.id,
    pp.user_id,
    pp.professional_type,
    pp.bio,
    pp.specialties,
    pp.experience_years,
    pp.is_verified,
    pp.commission_rate,
    pp.average_rating as profile_avg_rating,
    pp.total_ratings as profile_total_ratings,
    pp.location,
    pp.pricing,
    pp.languages,
    pp.is_active,
    pp.created_at,
    pp.updated_at,
    COALESCE(AVG(r.rating), 0) as calculated_avg_rating,
    COUNT(r.id) as rating_count
FROM public.professional_profiles pp
LEFT JOIN public.ratings r ON pp.user_id = r.professional_id
WHERE pp.is_active = TRUE
GROUP BY pp.id
HAVING COUNT(r.id) >= 3
ORDER BY calculated_avg_rating DESC, rating_count DESC;

-- 12. PENDING FRIEND REQUESTS VIEW
CREATE OR REPLACE VIEW public.pending_friend_requests_view AS
SELECT 
    fr.id,
    fr.sender_id,
    fr.receiver_id,
    fr.status,
    fr.created_at,
    fr.updated_at,
    sender.full_name as sender_name,
    receiver.full_name as receiver_name
FROM public.friend_requests fr
JOIN public.profiles sender ON fr.sender_id = sender.id
JOIN public.profiles receiver ON fr.receiver_id = receiver.id
WHERE fr.status = 'pending';

-- 13. AVAILABLE PROFESSIONALS BY TIME
CREATE OR REPLACE VIEW public.available_professionals_by_time AS
SELECT 
    pp.id,
    pp.user_id,
    pp.professional_type,
    pp.bio,
    pp.specialties,
    pp.experience_years,
    pp.is_verified,
    pp.commission_rate,
    pp.average_rating,
    pp.total_ratings,
    pp.location,
    pp.pricing,
    pp.languages,
    pp.is_active,
    pp.created_at,
    pp.updated_at,
    pa.day_of_week,
    pa.start_time,
    pa.end_time
FROM public.professional_profiles pp
JOIN public.professional_availability pa ON pp.id = pa.professional_id
WHERE pp.is_active = TRUE AND pa.is_available = TRUE;

-- ============================================
-- INDEXES FOR MISSING TABLES
-- ============================================

-- Post likes and comments
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id);

-- Topic likes and poll votes
CREATE INDEX IF NOT EXISTS idx_topic_likes_topic ON public.topic_likes(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_likes_user ON public.topic_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON public.poll_votes(user_id);

-- Streak activities
CREATE INDEX IF NOT EXISTS idx_streak_activities_user ON public.streak_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_activities_date ON public.streak_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_streak_milestones_user ON public.streak_milestones(user_id);

-- Daily streak
CREATE INDEX IF NOT EXISTS idx_daily_streak_activities_user ON public.daily_streak_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streak_activities_date ON public.daily_streak_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_user ON public.daily_streak_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_rank ON public.daily_streak_leaderboard(rank_position);
CREATE INDEX IF NOT EXISTS idx_daily_streak_milestones_user ON public.daily_streak_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streak_notifications_user ON public.daily_streak_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streak_status_user ON public.daily_streak_status(user_id);

-- Friendship streaks
CREATE INDEX IF NOT EXISTS idx_friendship_streaks_user ON public.friendship_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_friendship_streaks_friend ON public.friendship_streaks(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendship_streaks_current ON public.friendship_streaks(current_streak DESC);

-- Scheduled notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user ON public.scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_time ON public.scheduled_notifications(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON public.scheduled_notifications(is_sent);

-- Shared reports
CREATE INDEX IF NOT EXISTS idx_shared_reports_user ON public.shared_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON public.shared_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_reports_expires ON public.shared_reports(expires_at);

-- Minerals (additional tables)
CREATE INDEX IF NOT EXISTS idx_minerals_by_type_mineral ON public.minerals_by_type(mineral_id);
CREATE INDEX IF NOT EXISTS idx_minerals_tr_mineral ON public.minerals_tr(mineral_id);

-- Supplements search and categories
CREATE INDEX IF NOT EXISTS idx_supplements_by_category_supplement ON public.supplements_by_category(supplement_id);
CREATE INDEX IF NOT EXISTS idx_supplements_by_category_category ON public.supplements_by_category(category);
CREATE INDEX IF NOT EXISTS idx_supplements_search_supplement ON public.supplements_search(supplement_id);
CREATE INDEX IF NOT EXISTS idx_supplements_search_vector ON public.supplements_search USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_supplements_tr_supplement ON public.supplements_tr(supplement_id);

-- Professional availability and pricing
CREATE INDEX IF NOT EXISTS idx_professional_availability_professional ON public.professional_availability(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_availability_day ON public.professional_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_professional_pricing_professional ON public.professional_pricing(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_pricing_service ON public.professional_pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_professional_pricing_active ON public.professional_pricing(is_active);
