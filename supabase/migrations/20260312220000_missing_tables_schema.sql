-- ============================================================================
-- SUPABASE SCHEMA REBUILD - MISSING TABLES
-- Generated based on codebase analysis
-- WARNING: exercises and food_items tables already exist - NOT included here
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES (Add any missing ones)
-- ============================================================================

-- Video content enums
CREATE TYPE video_category_enum AS ENUM ('workout', 'nutrition', 'education', 'motivation', 'recovery');
CREATE TYPE video_difficulty_enum AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE friendship_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'blocked');
CREATE TYPE challenge_type_enum AS ENUM ('steps', 'calories', 'workout', 'nutrition', 'streak');
CREATE TYPE wearable_device_type_enum AS ENUM ('apple_health', 'google_fit', 'fitbit', 'garmin', 'samsung_health', 'huawei_health');

-- ============================================================================
-- 2. PROFILES VIEW (Exposes user data for client queries)
-- ============================================================================

-- Create profiles view that mirrors users table for client access
CREATE OR REPLACE VIEW profiles AS
SELECT 
    id,
    username,
    first_name,
    last_name,
    email,
    height,
    weight,
    date_of_birth,
    is_email_verified,
    is_deleted,
    created_at,
    updated_at
FROM users
WHERE is_deleted = FALSE;

-- ============================================================================
-- 3. VIDEO CONTENT TABLES
-- ============================================================================

-- Videos table - content metadata
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INT DEFAULT 0,
    category video_category_enum NOT NULL,
    difficulty_level video_difficulty_enum DEFAULT 'beginner',
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    instructor_name TEXT,
    instructor_avatar TEXT,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video progress tracking
CREATE TABLE video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    progress_seconds INT DEFAULT 0,
    total_seconds INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Video likes
CREATE TABLE video_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Video comments
CREATE TABLE video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    parent_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES video_comments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

-- Video playlists
CREATE TABLE video_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    creator_name TEXT NOT NULL,
    videos_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist videos (junction table)
CREATE TABLE playlist_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES video_playlists(id) ON DELETE CASCADE NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    position INT NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playlist_id, video_id)
);

-- ============================================================================
-- 4. SOCIAL FEATURES TABLES
-- ============================================================================

-- User follows (different from friendships - one-way following)
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Challenges
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type challenge_type_enum NOT NULL,
    target_value INT NOT NULL,
    unit TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    participants_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participants
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    current_value INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    rank INT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- Social posts (feed)
CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'achievement', 'progress', 'workout', 'nutrition', etc.
    content JSONB DEFAULT '{}'::JSONB,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. WEARABLE & HEALTH DATA TABLES
-- ============================================================================

-- Connected wearable devices
CREATE TABLE wearable_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    device_id TEXT NOT NULL, -- device identifier from platform
    name TEXT NOT NULL,
    type wearable_device_type_enum NOT NULL,
    connected BOOLEAN DEFAULT TRUE,
    permissions TEXT[],
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- Raw health data from wearables
CREATE TABLE health_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    source TEXT NOT NULL DEFAULT 'wearable', -- 'apple_health', 'google_fit', etc.
    steps INT DEFAULT 0,
    calories NUMERIC DEFAULT 0,
    distance NUMERIC DEFAULT 0, -- in meters
    heart_rate INT,
    sleep_hours NUMERIC DEFAULT 0,
    water_intake INT DEFAULT 0, -- in ml
    weight NUMERIC,
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    blood_glucose NUMERIC,
    oxygen_saturation NUMERIC,
    timestamp TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB DEFAULT '{}'::JSONB -- original data from wearable
);

-- Health goals
CREATE TABLE health_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    goal_type TEXT NOT NULL, -- 'steps', 'calories', 'sleep', 'water', etc.
    target_value NUMERIC NOT NULL,
    current_value NUMERIC DEFAULT 0,
    period TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, goal_type, period, start_date)
);

-- ============================================================================
-- 6. NUTRITION & SCANNING TABLES
-- ============================================================================

-- Food barcode scan history
CREATE TABLE food_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    barcode TEXT,
    food_name TEXT NOT NULL,
    brand TEXT,
    calories NUMERIC DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    fiber NUMERIC DEFAULT 0,
    sugar NUMERIC DEFAULT 0,
    sodium NUMERIC DEFAULT 0,
    serving_size TEXT,
    serving_unit TEXT,
    image_url TEXT,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. USER PREFERENCES & SETTINGS
-- ============================================================================

-- User preferences (for video recommendations, etc.)
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_categories video_category_enum[],
    preferred_difficulty video_difficulty_enum,
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. VITAMIN TRACKING TABLES (Legacy support for vitaminService.ts)
-- ============================================================================

-- Vitamins catalog (for legacy vitaminService)
CREATE TABLE vitamins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    chemical_name TEXT,
    type TEXT, -- 'fat_soluble', 'water_soluble'
    description TEXT,
    recommended_daily_value NUMERIC,
    unit TEXT,
    benefits TEXT[],
    deficiency_symptoms TEXT[],
    food_sources TEXT[],
    toxicity_symptoms TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vitamin intake logs
CREATE TABLE vitamin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    vitamin_id UUID REFERENCES vitamins(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vitamin plans
CREATE TABLE vitamin_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    daily_vitamins JSONB NOT NULL DEFAULT '[]'::JSONB, -- array of {vitamin_id, amount, unit}
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    reminder_time TIME[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. FUNCTIONS & TRIGGERS (updated_at automation)
-- ============================================================================

-- Create the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_progress_updated_at BEFORE UPDATE ON video_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_comments_updated_at BEFORE UPDATE ON video_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_playlists_updated_at BEFORE UPDATE ON video_playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_participants_updated_at BEFORE UPDATE ON challenge_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wearable_devices_updated_at BEFORE UPDATE ON wearable_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_goals_updated_at BEFORE UPDATE ON health_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vitamins_updated_at BEFORE UPDATE ON vitamins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vitamin_plans_updated_at BEFORE UPDATE ON vitamin_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. INDEXES (Performance optimization)
-- ============================================================================

-- Video content indexes
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_difficulty ON videos(difficulty_level);
CREATE INDEX idx_videos_instructor ON videos(instructor_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_is_published ON videos(is_published) WHERE is_published = TRUE;

CREATE INDEX idx_video_progress_user_id ON video_progress(user_id);
CREATE INDEX idx_video_progress_video_id ON video_progress(video_id);
CREATE INDEX idx_video_progress_user_video ON video_progress(user_id, video_id);

CREATE INDEX idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX idx_video_likes_user_id ON video_likes(user_id);

CREATE INDEX idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX idx_video_comments_user_id ON video_comments(user_id);
CREATE INDEX idx_video_comments_parent ON video_comments(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);

CREATE INDEX idx_video_playlists_creator ON video_playlists(creator_id);

CREATE INDEX idx_playlist_videos_playlist ON playlist_videos(playlist_id);
CREATE INDEX idx_playlist_videos_video ON playlist_videos(video_id);

-- Social features indexes
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_follows_unique ON follows(follower_id, following_id);

CREATE INDEX idx_challenges_creator ON challenges(created_by);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_challenges_type ON challenges(type);

CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);

CREATE INDEX idx_social_posts_user ON social_posts(user_id);
CREATE INDEX idx_social_posts_created ON social_posts(created_at DESC);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);

-- Wearable & health indexes
CREATE INDEX idx_wearable_devices_user ON wearable_devices(user_id);
CREATE INDEX idx_wearable_devices_connected ON wearable_devices(user_id, connected) WHERE connected = TRUE;

CREATE INDEX idx_health_data_user ON health_data(user_id);
CREATE INDEX idx_health_data_timestamp ON health_data(timestamp DESC);
CREATE INDEX idx_health_data_user_timestamp ON health_data(user_id, timestamp DESC);

CREATE INDEX idx_health_goals_user ON health_goals(user_id);
CREATE INDEX idx_health_goals_active ON health_goals(user_id, is_active) WHERE is_active = TRUE;

-- Nutrition indexes
CREATE INDEX idx_food_scans_user ON food_scans(user_id);
CREATE INDEX idx_food_scans_barcode ON food_scans(barcode);
CREATE INDEX idx_food_scans_scanned_at ON food_scans(scanned_at DESC);

-- User preferences indexes
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- Vitamin tracking indexes
CREATE INDEX idx_vitamin_logs_user ON vitamin_logs(user_id);
CREATE INDEX idx_vitamin_logs_vitamin ON vitamin_logs(vitamin_id);
CREATE INDEX idx_vitamin_logs_logged_at ON vitamin_logs(logged_at DESC);

CREATE INDEX idx_vitamin_plans_user ON vitamin_plans(user_id);
CREATE INDEX idx_vitamin_plans_active ON vitamin_plans(user_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitamins ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitamin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitamin_plans ENABLE ROW LEVEL SECURITY;

-- Videos: Public can view published videos, only admins can create/update
CREATE POLICY "Videos are viewable by everyone" ON videos
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Authenticated users can create videos" ON videos
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own videos" ON videos
    FOR UPDATE TO authenticated USING (instructor_id = auth.uid());

-- Video progress: Users can only see/modify their own progress
CREATE POLICY "Users can view own video progress" ON video_progress
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own video progress" ON video_progress
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own video progress" ON video_progress
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own video progress" ON video_progress
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Video likes: Users can see all likes, but only modify own
CREATE POLICY "Video likes are viewable by everyone" ON video_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own video likes" ON video_likes
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own video likes" ON video_likes
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Video comments: Public can view, authenticated can create, own can modify
CREATE POLICY "Video comments are viewable by everyone" ON video_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON video_comments
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments" ON video_comments
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON video_comments
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comment likes: Users can see all, only modify own
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own comment likes" ON comment_likes
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comment likes" ON comment_likes
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Video playlists: Public can view public playlists, private only owner
CREATE POLICY "Public playlists are viewable by everyone" ON video_playlists
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view own private playlists" ON video_playlists
    FOR SELECT TO authenticated USING (creator_id = auth.uid());

CREATE POLICY "Users can create playlists" ON video_playlists
    FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own playlists" ON video_playlists
    FOR UPDATE TO authenticated USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own playlists" ON video_playlists
    FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- Playlist videos: Same access as parent playlist
CREATE POLICY "Playlist videos viewable if playlist public" ON playlist_videos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM video_playlists WHERE id = playlist_id AND (is_public = TRUE OR creator_id = auth.uid()))
    );

CREATE POLICY "Users can modify own playlist videos" ON playlist_videos
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM video_playlists WHERE id = playlist_id AND creator_id = auth.uid())
    );

-- Follows: Users can see follows, only modify own
CREATE POLICY "Follows are viewable by everyone" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Users can create own follows" ON follows
    FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete own follows" ON follows
    FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- Challenges: Public can view public challenges, private only creator/participants
CREATE POLICY "Public challenges are viewable by everyone" ON challenges
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view own challenges" ON challenges
    FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can create challenges" ON challenges
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own challenges" ON challenges
    FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can delete own challenges" ON challenges
    FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Challenge participants: Users can view all, only modify own
CREATE POLICY "Challenge participants are viewable by everyone" ON challenge_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON challenge_participants
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own challenge progress" ON challenge_participants
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can leave challenges" ON challenge_participants
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Social posts: Users can view followed users' posts, modify own
CREATE POLICY "Users can view social posts" ON social_posts
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = user_id)
    );

CREATE POLICY "Public social posts are viewable by everyone" ON social_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create own posts" ON social_posts
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts" ON social_posts
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own posts" ON social_posts
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Post likes: Users can see all, only modify own
CREATE POLICY "Post likes are viewable by everyone" ON post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON post_likes
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts" ON post_likes
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Post comments: Same as video comments
CREATE POLICY "Post comments are viewable by everyone" ON post_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create post comments" ON post_comments
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own post comments" ON post_comments
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own post comments" ON post_comments
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Wearable devices: Users can only see/modify own
CREATE POLICY "Users can view own wearable devices" ON wearable_devices
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wearable devices" ON wearable_devices
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wearable devices" ON wearable_devices
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own wearable devices" ON wearable_devices
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Health data: Users can only see/modify own
CREATE POLICY "Users can view own health data" ON health_data
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own health data" ON health_data
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own health data" ON health_data
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own health data" ON health_data
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Health goals: Users can only see/modify own
CREATE POLICY "Users can view own health goals" ON health_goals
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own health goals" ON health_goals
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own health goals" ON health_goals
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own health goals" ON health_goals
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Food scans: Users can only see/modify own
CREATE POLICY "Users can view own food scans" ON food_scans
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own food scans" ON food_scans
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own food scans" ON food_scans
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- User preferences: Users can only see/modify own
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Vitamins: Public can view verified vitamins, admins can modify
CREATE POLICY "Verified vitamins are viewable by everyone" ON vitamins
    FOR SELECT USING (is_verified = TRUE);

CREATE POLICY "Authenticated users can view all vitamins" ON vitamins
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify vitamins" ON vitamins
    FOR ALL TO authenticated USING (false); -- Restrict to admin role check

-- Vitamin logs: Users can only see/modify own
CREATE POLICY "Users can view own vitamin logs" ON vitamin_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vitamin logs" ON vitamin_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vitamin logs" ON vitamin_logs
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own vitamin logs" ON vitamin_logs
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Vitamin plans: Users can only see/modify own
CREATE POLICY "Users can view own vitamin plans" ON vitamin_plans
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vitamin plans" ON vitamin_plans
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vitamin plans" ON vitamin_plans
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own vitamin plans" ON vitamin_plans
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- 12. RPC FUNCTIONS (for atomic increments)
-- ============================================================================

-- Video view/likes/comments increment functions
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos SET views_count = views_count + 1 WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_video_likes(video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos SET likes_count = likes_count + 1 WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_video_likes(video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_video_comments(video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos SET comments_count = comments_count + 1 WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment likes increment
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE video_comments SET likes_count = likes_count + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Playlist videos count
CREATE OR REPLACE FUNCTION increment_playlist_videos(playlist_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE video_playlists SET videos_count = videos_count + 1 WHERE id = playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_playlist_videos(playlist_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE video_playlists SET videos_count = GREATEST(0, videos_count - 1) WHERE id = playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Challenge participants
CREATE OR REPLACE FUNCTION increment_challenge_participants(challenge_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE challenges SET participants_count = participants_count + 1 WHERE id = challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Post likes/comments
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETION
-- ============================================================================
