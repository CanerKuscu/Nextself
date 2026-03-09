-- ============================================================================
-- BIOSYNC - KESİN ÇALIŞACAK INDEXLER (Veritabanınızdaki Tablolar İçin)
-- ============================================================================
-- Mevcut tablolar: chats, client_relationships, daily_missions, health_data,
-- health_records, notifications, nutrition_logs, professional_profiles,
-- social_posts, supplement_logs, users, water_logs, weekly_missions, workouts
-- ============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_professional ON users(is_professional) WHERE is_professional = TRUE;

-- Professional Profiles
CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id ON professional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_type_active ON professional_profiles(professional_type, is_active) WHERE is_active = TRUE;

-- Client Relationships (RLS için kritik)
CREATE INDEX IF NOT EXISTS idx_client_relationships_client_id ON client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_professional_id ON client_relationships(professional_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_status ON client_relationships(status);

-- Workouts
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);

-- Supplement Logs
CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_id ON supplement_logs(user_id);

-- Nutrition Logs
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id ON nutrition_logs(user_id);

-- Water Logs
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);

-- Health Data
CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON health_data(user_id);

-- Health Records
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);

-- Chats
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);

-- Social Posts
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Weekly Missions
CREATE INDEX IF NOT EXISTS idx_weekly_missions_user ON weekly_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_missions_user_completed ON weekly_missions(user_id, is_completed);

-- Daily Missions
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON daily_missions(user_id, mission_date);
