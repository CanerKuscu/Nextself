-- ============================================================================
-- SUPABASE SCHEMA REBUILD - MISSING TABLES AND ADDITIONS
-- Generated based on complete codebase analysis
-- ============================================================================
-- 
-- EXISTING TABLES (DO NOT RECREATE):
-- - exercises (manually populated)
-- - food_items (manually populated)
-- - users, user_profiles, workout_sessions, nutrition_entries, health_metrics
-- - personal_trainers, dietitians, client_relationships, professional_profiles, ratings
-- - ai_insights, ai_generated_programs, ai_analyses
-- - league_tiers, league_groups, user_leagues, xp_transactions, store_items
-- - user_inventory_items, user_currencies, weekly_missions, daily_missions
-- - user_agreements, agreement_versions, biometric_consents, distance_sales_contracts
-- - mss_pdf_results, friendships, forum_categories, forum_topics, forum_posts
-- - progress_logs, sleep_data, stress_logs, water_configs, water_stats_logs
-- - micronutrients, supplements, supplement_ingredients, user_supplements
-- - supplement_logs, videos, video_progress, video_likes, video_comments
-- - comment_likes, video_playlists, playlist_videos, workout_plans
-- - nutrition_plans, meal_plans, vitamins, vitamin_logs, vitamin_plans
-- - notifications, subscriptions, body_photos, follows, challenges
-- - challenge_participants, social_posts, post_likes, post_comments
-- - wearable_devices, health_data, health_goals, food_scans, user_preferences
--
-- THIS SCRIPT CREATES:
-- 1. Missing enum types
-- 2. Missing tables (health_records, nutrition_logs, chats, chat_participants,
--    messages, minerals, mineral_logs, mineral_plans, assigned_workouts,
--    assigned_nutrition_plans, assigned_supplements, user_privacy_settings)
-- 3. Missing columns in existing tables
-- 4. Performance indexes
-- 5. RLS policies
-- 6. updated_at triggers
-- ============================================================================

-- ============================================================================
-- 1. MISSING ENUM TYPES
-- ============================================================================

-- Message types for chat
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'voice', 'video', 'file', 'system');

-- Chat types
CREATE TYPE chat_type_enum AS ENUM ('direct', 'group', 'channel');

-- Assignment status
CREATE TYPE assignment_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- ============================================================================
-- 2. EXTEND EXISTING USERS TABLE WITH MISSING COLUMNS
-- ============================================================================

-- Add columns to users table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'deleted_at') THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'professional_type') THEN
        ALTER TABLE users ADD COLUMN professional_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE users ADD COLUMN gender TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone TEXT;
    END IF;
END $$;

-- ============================================================================
-- 3. HEALTH RECORDS TABLE (Referenced in healthService.ts)
-- ============================================================================

CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    steps INT DEFAULT 0,
    sleep_hours NUMERIC DEFAULT 0,
    heart_rate INT,
    calories NUMERIC DEFAULT 0,
    active_minutes INT DEFAULT 0,
    weight NUMERIC,
    source TEXT NOT NULL DEFAULT 'manual', -- 'apple_health', 'google_health', 'manual', 'mock'
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_data JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

COMMENT ON TABLE health_records IS 'Stores synced health data from wearables for offline queue processing';

-- ============================================================================
-- 4. NUTRITION LOGS TABLE (Referenced in supabase.ts)
-- ============================================================================

CREATE TABLE nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
    meal_type meal_type_enum NOT NULL,
    food_name TEXT NOT NULL,
    calories NUMERIC DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    fiber NUMERIC DEFAULT 0,
    sugar NUMERIC DEFAULT 0,
    sodium NUMERIC DEFAULT 0,
    serving_size NUMERIC DEFAULT 1,
    serving_unit TEXT DEFAULT 'serving',
    brand TEXT,
    barcode TEXT,
    image_url TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE nutrition_logs IS 'Detailed individual nutrition entries (alternative to nutrition_entries which stores JSON arrays)';

-- ============================================================================
-- 5. CHAT SYSTEM TABLES (Referenced in supabase.ts)
-- ============================================================================

-- Chats table
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type chat_type_enum NOT NULL DEFAULT 'direct',
    title TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    last_message_sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE chats IS 'Chat rooms for direct messaging between users and professionals';

-- Chat participants (junction table)
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

COMMENT ON TABLE chat_participants IS 'Links users to chats with metadata like read status and role';

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type message_type_enum DEFAULT 'text',
    attachments JSONB DEFAULT '[]'::JSONB, -- Array of {url, type, name, size}
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '{}'::JSONB, -- {user_id: reaction_type}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE messages IS 'Individual chat messages with support for replies and reactions';

-- ============================================================================
-- 6. MINERALS SYSTEM TABLES (Referenced in mineralService.ts)
-- ============================================================================

-- Minerals catalog
CREATE TABLE minerals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_tr TEXT,
    chemical_formula TEXT,
    atomic_number INT,
    category TEXT, -- 'macromineral', 'trace_element', 'electrolyte'
    description TEXT,
    description_tr TEXT,
    recommended_daily_value NUMERIC,
    unit TEXT DEFAULT 'mg',
    benefits TEXT[],
    benefits_tr TEXT[],
    deficiency_symptoms TEXT[],
    deficiency_symptoms_tr TEXT[],
    food_sources TEXT[],
    food_sources_tr TEXT[],
    toxicity_symptoms TEXT[],
    toxicity_symptoms_tr TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE minerals IS 'Catalog of minerals and trace elements for tracking';

-- Mineral intake logs
CREATE TABLE mineral_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    mineral_id UUID REFERENCES minerals(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    source TEXT DEFAULT 'manual', -- 'supplement', 'food', 'manual'
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE mineral_logs IS 'Daily mineral intake tracking logs';

-- Mineral plans
CREATE TABLE mineral_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    daily_minerals JSONB NOT NULL DEFAULT '[]'::JSONB, -- array of {mineral_id, amount, unit}
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    reminder_time TIME[],
    created_by_professional_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE mineral_plans IS 'Structured mineral supplement plans created by professionals';

-- ============================================================================
-- 7. PROFESSIONAL ASSIGNMENTS TABLES (Referenced in supabase.ts)
-- ============================================================================

-- Assigned workouts (PT to client)
CREATE TABLE assigned_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    pt_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE NOT NULL,
    workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    exercises JSONB NOT NULL DEFAULT '[]'::JSONB,
    scheduled_date DATE NOT NULL,
    status assignment_status_enum DEFAULT 'pending',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    client_feedback TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE assigned_workouts IS 'Workouts assigned by personal trainers to clients';

-- Assigned nutrition plans (Dietitian to client)
CREATE TABLE assigned_nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    dietitian_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE NOT NULL,
    nutrition_plan_id UUID REFERENCES nutrition_plans(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    daily_calories INT,
    protein_grams INT,
    carbs_grams INT,
    fat_grams INT,
    meals_per_day INT DEFAULT 3,
    dietary_restrictions TEXT[],
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    adherence_rate NUMERIC DEFAULT 0, -- Percentage of days followed
    client_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE assigned_nutrition_plans IS 'Nutrition plans assigned by dietitians to clients';

-- Assigned supplements (Professional to client)
CREATE TABLE assigned_supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE NOT NULL,
    supplement_id UUID REFERENCES supplements(id) ON DELETE SET NULL,
    mineral_id UUID REFERENCES minerals(id) ON DELETE SET NULL,
    vitamin_id UUID REFERENCES vitamins(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'as_needed'
    timing TEXT, -- 'morning', 'afternoon', 'evening', 'with_meal'
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    reminder_time TIME[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (supplement_id IS NOT NULL OR mineral_id IS NOT NULL OR vitamin_id IS NOT NULL)
);

COMMENT ON TABLE assigned_supplements IS 'Supplements assigned by professionals to clients (can be linked to supplement, mineral, or vitamin)';

-- ============================================================================
-- 8. USER PRIVACY SETTINGS TABLE (Referenced in supabase.ts)
-- ============================================================================

CREATE TABLE user_privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Sharing with personal trainers
    share_steps_with_pt BOOLEAN DEFAULT FALSE,
    share_workouts_with_pt BOOLEAN DEFAULT TRUE,
    share_weight_with_pt BOOLEAN DEFAULT TRUE,
    share_sleep_with_pt BOOLEAN DEFAULT FALSE,
    share_heart_rate_with_pt BOOLEAN DEFAULT FALSE,
    
    -- Sharing with dietitians
    share_calories_with_dietitian BOOLEAN DEFAULT TRUE,
    share_macros_with_dietitian BOOLEAN DEFAULT TRUE,
    share_water_with_dietitian BOOLEAN DEFAULT TRUE,
    share_weight_with_dietitian BOOLEAN DEFAULT TRUE,
    share_meal_photos_with_dietitian BOOLEAN DEFAULT FALSE,
    
    -- General sharing
    share_progress_with_friends BOOLEAN DEFAULT FALSE,
    allow_friend_requests BOOLEAN DEFAULT TRUE,
    profile_visibility TEXT DEFAULT 'private', -- 'public', 'private', 'friends_only'
    
    -- Professional permissions JSON for flexibility
    professional_permissions JSONB DEFAULT '{}'::JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_privacy_settings IS 'User privacy preferences for data sharing with professionals and friends';

-- ============================================================================
-- 9. PERFORMANCE INDEXES
-- ============================================================================

-- Health records indexes
CREATE INDEX idx_health_records_user_id ON health_records(user_id);
CREATE INDEX idx_health_records_user_date ON health_records(user_id, date);
CREATE INDEX idx_health_records_source ON health_records(source);
CREATE INDEX idx_health_records_recorded_at ON health_records(recorded_at DESC);

-- Nutrition logs indexes
CREATE INDEX idx_nutrition_logs_user_id ON nutrition_logs(user_id);
CREATE INDEX idx_nutrition_logs_user_logged ON nutrition_logs(user_id, logged_at DESC);
CREATE INDEX idx_nutrition_logs_food_item ON nutrition_logs(food_item_id);
CREATE INDEX idx_nutrition_logs_meal_type ON nutrition_logs(meal_type);
CREATE INDEX idx_nutrition_logs_logged_at ON nutrition_logs(logged_at DESC);

-- Chat system indexes
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);
CREATE INDEX idx_chats_created_by ON chats(created_by);
CREATE INDEX idx_chat_participants_chat ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_last_read ON chat_participants(last_read_at);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC);

-- Minerals indexes
CREATE INDEX idx_minerals_name ON minerals(name);
CREATE INDEX idx_minerals_category ON minerals(category);
CREATE INDEX idx_minerals_is_verified ON minerals(is_verified);

-- Mineral logs indexes
CREATE INDEX idx_mineral_logs_user_id ON mineral_logs(user_id);
CREATE INDEX idx_mineral_logs_mineral ON mineral_logs(mineral_id);
CREATE INDEX idx_mineral_logs_user_logged ON mineral_logs(user_id, logged_at DESC);
CREATE INDEX idx_mineral_logs_logged_at ON mineral_logs(logged_at DESC);

-- Mineral plans indexes
CREATE INDEX idx_mineral_plans_user ON mineral_plans(user_id);
CREATE INDEX idx_mineral_plans_active ON mineral_plans(user_id, is_active) WHERE is_active = TRUE;

-- Assignments indexes
CREATE INDEX idx_assigned_workouts_client ON assigned_workouts(client_id);
CREATE INDEX idx_assigned_workouts_pt ON assigned_workouts(pt_id);
CREATE INDEX idx_assigned_workouts_client_scheduled ON assigned_workouts(client_id, scheduled_date DESC);
CREATE INDEX idx_assigned_workouts_status ON assigned_workouts(status);

CREATE INDEX idx_assigned_nutrition_client ON assigned_nutrition_plans(client_id);
CREATE INDEX idx_assigned_nutrition_dietitian ON assigned_nutrition_plans(dietitian_id);
CREATE INDEX idx_assigned_nutrition_active ON assigned_nutrition_plans(client_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_assigned_supplements_client ON assigned_supplements(client_id);
CREATE INDEX idx_assigned_supplements_professional ON assigned_supplements(professional_id);
CREATE INDEX idx_assigned_supplements_active ON assigned_supplements(client_id, is_active) WHERE is_active = TRUE;

-- Privacy settings indexes
CREATE INDEX idx_privacy_settings_user ON user_privacy_settings(user_id);

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE minerals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mineral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mineral_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Health records: Users can only access own records
CREATE POLICY "Users can view own health records" ON health_records
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own health records" ON health_records
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own health records" ON health_records
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own health records" ON health_records
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Nutrition logs: Users can only access own logs
CREATE POLICY "Users can view own nutrition logs" ON nutrition_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own nutrition logs" ON nutrition_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own nutrition logs" ON nutrition_logs
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own nutrition logs" ON nutrition_logs
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Chats: Participants can view their chats
CREATE POLICY "Users can view their chats" ON chats
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = id AND user_id = auth.uid())
        OR created_by = auth.uid()
    );

CREATE POLICY "Users can create chats" ON chats
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update chats" ON chats
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = id AND user_id = auth.uid() AND role = 'admin')
    );

-- Chat participants: Only chat members can see participants
CREATE POLICY "Users can view chat participants for their chats" ON chat_participants
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.chat_id = chat_id AND cp.user_id = auth.uid())
    );

CREATE POLICY "Users can add participants to their chats" ON chat_participants
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.chat_id = chat_id AND cp.user_id = auth.uid())
        OR chat_id IN (SELECT id FROM chats WHERE created_by = auth.uid())
    );

CREATE POLICY "Users can leave chats" ON chat_participants
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Messages: Chat participants can view messages
CREATE POLICY "Users can view messages in their chats" ON messages
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = chat_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can send messages to their chats" ON messages
    FOR INSERT TO authenticated WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = chat_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can edit own messages" ON messages
    FOR UPDATE TO authenticated USING (sender_id = auth.uid());

CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Minerals: Public can view verified minerals
CREATE POLICY "Verified minerals are viewable by everyone" ON minerals
    FOR SELECT USING (is_verified = TRUE);

CREATE POLICY "Authenticated users can view all minerals" ON minerals
    FOR SELECT TO authenticated USING (true);

-- Mineral logs: Users can only access own logs
CREATE POLICY "Users can view own mineral logs" ON mineral_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own mineral logs" ON mineral_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own mineral logs" ON mineral_logs
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own mineral logs" ON mineral_logs
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Mineral plans: Users can only access own plans
CREATE POLICY "Users can view own mineral plans" ON mineral_plans
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR 
        created_by_professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own mineral plans" ON mineral_plans
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid() OR 
        created_by_professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own mineral plans" ON mineral_plans
    FOR UPDATE TO authenticated USING (
        user_id = auth.uid() OR 
        created_by_professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own mineral plans" ON mineral_plans
    FOR DELETE TO authenticated USING (
        user_id = auth.uid() OR 
        created_by_professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

-- Assigned workouts: PTs and clients can view
CREATE POLICY "Clients can view own assigned workouts" ON assigned_workouts
    FOR SELECT TO authenticated USING (
        client_id = auth.uid() OR 
        pt_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "PTs can assign workouts to their clients" ON assigned_workouts
    FOR INSERT TO authenticated WITH CHECK (
        pt_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "PTs can update assigned workouts" ON assigned_workouts
    FOR UPDATE TO authenticated USING (
        pt_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "PTs can delete assigned workouts" ON assigned_workouts
    FOR DELETE TO authenticated USING (
        pt_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

-- Assigned nutrition plans: Dietitians and clients can view
CREATE POLICY "Clients can view own assigned nutrition plans" ON assigned_nutrition_plans
    FOR SELECT TO authenticated USING (
        client_id = auth.uid() OR 
        dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Dietitians can assign nutrition plans" ON assigned_nutrition_plans
    FOR INSERT TO authenticated WITH CHECK (
        dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Dietitians can update assigned nutrition plans" ON assigned_nutrition_plans
    FOR UPDATE TO authenticated USING (
        dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Dietitians can delete assigned nutrition plans" ON assigned_nutrition_plans
    FOR DELETE TO authenticated USING (
        dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

-- Assigned supplements: Professionals and clients can view
CREATE POLICY "Clients can view own assigned supplements" ON assigned_supplements
    FOR SELECT TO authenticated USING (
        client_id = auth.uid() OR 
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Professionals can assign supplements" ON assigned_supplements
    FOR INSERT TO authenticated WITH CHECK (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Professionals can update assigned supplements" ON assigned_supplements
    FOR UPDATE TO authenticated USING (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Professionals can delete assigned supplements" ON assigned_supplements
    FOR DELETE TO authenticated USING (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

-- User privacy settings: Only own settings
CREATE POLICY "Users can view own privacy settings" ON user_privacy_settings
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own privacy settings" ON user_privacy_settings
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own privacy settings" ON user_privacy_settings
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- 11. FUNCTIONS & TRIGGERS (updated_at automation)
-- ============================================================================

-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all new tables with updated_at column
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_logs_updated_at BEFORE UPDATE ON nutrition_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_minerals_updated_at BEFORE UPDATE ON minerals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mineral_logs_updated_at BEFORE UPDATE ON mineral_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mineral_plans_updated_at BEFORE UPDATE ON mineral_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assigned_workouts_updated_at BEFORE UPDATE ON assigned_workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assigned_nutrition_plans_updated_at BEFORE UPDATE ON assigned_nutrition_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assigned_supplements_updated_at BEFORE UPDATE ON assigned_supplements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_privacy_settings_updated_at BEFORE UPDATE ON user_privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. RPC FUNCTIONS (for atomic operations)
-- ============================================================================

-- Function to mark messages as read for a chat
CREATE OR REPLACE FUNCTION mark_messages_as_read(chat_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE chat_participants
    SET last_read_at = NOW()
    WHERE chat_id = $1 AND user_id = $2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_count(user_uuid UUID)
RETURNS TABLE (chat_id UUID, unread_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.chat_id,
        COUNT(*) as unread_count
    FROM messages m
    JOIN chat_participants cp ON m.chat_id = cp.chat_id AND cp.user_id = user_uuid
    WHERE m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
    AND m.sender_id != user_uuid
    GROUP BY m.chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. SEED DATA (Optional - Essential Minerals)
-- ============================================================================

INSERT INTO minerals (name, name_tr, chemical_formula, atomic_number, category, unit, recommended_daily_value, description, benefits, food_sources, is_verified) VALUES
('Calcium', 'Kalsiyum', 'Ca', 20, 'macromineral', 'mg', 1000, 'Essential for bone health', ARRAY['Bone strength', 'Muscle function', 'Nerve signaling'], ARRAY['Dairy', 'Leafy greens', 'Fortified foods'], TRUE),
('Iron', 'Demir', 'Fe', 26, 'trace_element', 'mg', 18, 'Critical for oxygen transport', ARRAY['Oxygen transport', 'Energy production', 'Immune function'], ARRAY['Red meat', 'Spinach', 'Lentils'], TRUE),
('Magnesium', 'Magnezyum', 'Mg', 12, 'macromineral', 'mg', 400, 'Involved in 300+ bodily processes', ARRAY['Muscle relaxation', 'Sleep quality', 'Heart health'], ARRAY['Nuts', 'Seeds', 'Whole grains'], TRUE),
('Zinc', 'Çinko', 'Zn', 30, 'trace_element', 'mg', 11, 'Supports immune system and healing', ARRAY['Immune function', 'Wound healing', 'Protein synthesis'], ARRAY['Oysters', 'Beef', 'Pumpkin seeds'], TRUE),
('Potassium', 'Potasyum', 'K', 19, 'electrolyte', 'mg', 3400, 'Regulates fluid balance', ARRAY['Fluid balance', 'Blood pressure', 'Muscle function'], ARRAY['Bananas', 'Avocados', 'Sweet potatoes'], TRUE),
('Sodium', 'Sodyum', 'Na', 11, 'electrolyte', 'mg', 2300, 'Regulates fluid and blood pressure', ARRAY['Fluid balance', 'Nerve function', 'Muscle contraction'], ARRAY['Salt', 'Processed foods'], TRUE),
('Phosphorus', 'Fosfor', 'P', 15, 'macromineral', 'mg', 700, 'Bone and teeth health', ARRAY['Bone health', 'Energy production', 'Cell repair'], ARRAY['Meat', 'Dairy', 'Nuts'], TRUE),
('Selenium', 'Selenyum', 'Se', 34, 'trace_element', 'mcg', 55, 'Antioxidant protection', ARRAY['Thyroid function', 'Antioxidant', 'Immune support'], ARRAY['Brazil nuts', 'Fish', 'Eggs'], TRUE),
('Copper', 'Bakır', 'Cu', 29, 'trace_element', 'mg', 0.9, 'Iron metabolism and connective tissue', ARRAY['Iron absorption', 'Collagen formation', 'Energy production'], ARRAY['Shellfish', 'Nuts', 'Seeds'], TRUE),
('Manganese', 'Manganez', 'Mn', 25, 'trace_element', 'mg', 2.3, 'Bone formation and metabolism', ARRAY['Bone health', 'Metabolism', 'Antioxidant'], ARRAY['Nuts', 'Leafy greens', 'Tea'], TRUE),
('Chromium', 'Krom', 'Cr', 24, 'trace_element', 'mcg', 35, 'Blood sugar regulation', ARRAY['Glucose metabolism', 'Insulin sensitivity'], ARRAY['Broccoli', 'Grape juice', 'Whole grains'], TRUE),
('Iodine', 'İyot', 'I', 53, 'trace_element', 'mcg', 150, 'Thyroid hormone production', ARRAY['Thyroid function', 'Metabolism regulation'], ARRAY['Seaweed', 'Fish', 'Iodized salt'], TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCHEMA REBUILD COMPLETE
-- ============================================================================
