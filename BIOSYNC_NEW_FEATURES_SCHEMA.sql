-- ============================================================
-- BIOSYNC NEW FEATURES SCHEMA
-- League System, In-App Store, AI Weekly Tasks, Photo Analysis
-- ============================================================

-- ============================================================
-- 1. LEAGUE SYSTEM (Duolingo-style)
-- ============================================================

-- League definitions
CREATE TABLE IF NOT EXISTS leagues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    tier INTEGER NOT NULL UNIQUE, -- 1=Bronze, 2=Silver, ..., 10=Diamond
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    min_xp_to_maintain INTEGER DEFAULT 0,
    promotion_slots INTEGER DEFAULT 10, -- top N get promoted
    demotion_slots INTEGER DEFAULT 5,   -- bottom N get demoted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert league tiers
INSERT INTO leagues (name, tier, icon, color, promotion_slots, demotion_slots) VALUES
    ('Bronze', 1, '🥉', '#CD7F32', 10, 0),
    ('Silver', 2, '🥈', '#C0C0C0', 10, 5),
    ('Gold', 3, '🥇', '#FFD700', 10, 5),
    ('Sapphire', 4, '💎', '#0F52BA', 10, 5),
    ('Ruby', 5, '🔴', '#E0115F', 10, 5),
    ('Emerald', 6, '🟢', '#50C878', 10, 5),
    ('Amethyst', 7, '🟣', '#9966CC', 10, 5),
    ('Pearl', 8, '⚪', '#F0EAD6', 10, 5),
    ('Obsidian', 9, '⚫', '#3D3635', 10, 5),
    ('Diamond', 10, '💠', '#B9F2FF', 0, 5)
ON CONFLICT (name) DO NOTHING;

-- User league data
CREATE TABLE IF NOT EXISTS user_leagues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id),
    current_tier INTEGER NOT NULL DEFAULT 1,
    weekly_xp INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    group_id UUID, -- weekly group assignment
    rank_in_group INTEGER,
    weeks_in_current_league INTEGER DEFAULT 0,
    promotion_count INTEGER DEFAULT 0,
    demotion_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Weekly league groups (30 people per group)
CREATE TABLE IF NOT EXISTS league_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS league_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES league_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    weekly_xp INTEGER DEFAULT 0,
    rank INTEGER,
    zone VARCHAR(20) DEFAULT 'safe', -- 'promotion', 'safe', 'demotion'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- XP transaction log
CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'workout', 'nutrition_log', 'mission', 'streak', 'store_boost'
    description TEXT,
    multiplier FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- League history
CREATE TABLE IF NOT EXISTS league_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    from_tier INTEGER NOT NULL,
    to_tier INTEGER NOT NULL,
    weekly_xp INTEGER NOT NULL,
    rank_in_group INTEGER,
    action VARCHAR(20) NOT NULL, -- 'promoted', 'demoted', 'maintained'
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. IN-APP STORE
-- ============================================================

-- Store items catalog
CREATE TABLE IF NOT EXISTS store_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_tr VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    description_tr TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'booster', 'cosmetic', 'utility'
    icon VARCHAR(50) NOT NULL,
    price_points INTEGER NOT NULL, -- cost in points/gems
    price_real DECIMAL(10,2), -- real money price (nullable)
    effect_type VARCHAR(50), -- 'streak_freeze', 'double_xp', 'extra_life', 'avatar_frame', 'profile_badge'
    effect_duration_minutes INTEGER, -- duration of effect (for boosters)
    effect_value JSONB, -- additional effect data
    max_stack INTEGER DEFAULT 1, -- max owned at a time
    is_consumable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default store items
INSERT INTO store_items (name, name_tr, description, description_tr, category, icon, price_points, effect_type, effect_duration_minutes, max_stack, is_consumable) VALUES
    ('Streak Freeze', 'Seri Dondurucu', 'Protects your streak for 1 missed day', '1 gün kaçırırsan serin bozulmaz', 'utility', '🧊', 200, 'streak_freeze', NULL, 3, TRUE),
    ('Double XP Potion', '2x XP İksiri', 'Earn double XP for 15 minutes', '15 dakika boyunca çifte XP kazan', 'booster', '⚡', 150, 'double_xp', 15, 5, TRUE),
    ('Extra Life', 'Ekstra Can', 'Get an extra life for your daily challenge', 'Günlük görev için ekstra can', 'utility', '❤️', 100, 'extra_life', NULL, 5, TRUE),
    ('Premium Avatar Frame', 'Premium Çerçeve', 'An exclusive frame for your profile picture', 'Profil fotoğrafın için özel çerçeve', 'cosmetic', '👑', 500, 'avatar_frame', NULL, 1, FALSE),
    ('Gold Badge', 'Altın Rozet', 'Show off your dedication with a gold profile badge', 'Profilinde altın rozet ile adanmışlığını göster', 'cosmetic', '🏅', 300, 'profile_badge', NULL, 1, FALSE),
    ('XP Shield', 'XP Kalkanı', 'Prevent XP loss for 24 hours', '24 saat XP kaybını önle', 'booster', '🛡️', 250, 'xp_shield', 1440, 3, TRUE),
    ('Workout Boost', 'Antrenman Güçlendirici', 'Get 50% more XP from workouts for 1 hour', '1 saat boyunca antrenmanlardan %50 fazla XP', 'booster', '💪', 175, 'workout_boost', 60, 3, TRUE),
    ('Nutrition Multiplier', 'Beslenme Çarpanı', 'Get 50% more XP from nutrition logs for 1 hour', '1 saat beslenme kayıtlarından %50 fazla XP', 'booster', '🥗', 175, 'nutrition_boost', 60, 3, TRUE)
ON CONFLICT DO NOTHING;

-- User inventory (purchased/owned items)
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES store_items(id),
    quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT FALSE, -- for cosmetics: currently equipped
    activated_at TIMESTAMPTZ, -- when booster was activated
    expires_at TIMESTAMPTZ, -- when booster expires
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- Purchase history
CREATE TABLE IF NOT EXISTS purchase_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES store_items(id),
    quantity INTEGER DEFAULT 1,
    price_paid INTEGER NOT NULL, -- points spent
    price_real_paid DECIMAL(10,2), -- real money (if any)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User points/currency
CREATE TABLE IF NOT EXISTS user_currency (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    total_earned_points INTEGER DEFAULT 0,
    total_spent_points INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================
-- 3. AI WEEKLY TASKS / MISSIONS
-- ============================================================

-- Weekly AI-generated missions
CREATE TABLE IF NOT EXISTS weekly_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    title_tr VARCHAR(200),
    description TEXT,
    description_tr TEXT,
    category VARCHAR(50) NOT NULL, -- 'workout', 'nutrition', 'health', 'social', 'streak'
    target_value INTEGER DEFAULT 1, -- e.g., "Do 3 workouts" → 3
    current_progress INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 50,
    point_reward INTEGER DEFAULT 25,
    is_completed BOOLEAN DEFAULT FALSE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Daily missions (shorter term)
CREATE TABLE IF NOT EXISTS daily_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    title_tr VARCHAR(200),
    description TEXT,
    description_tr TEXT,
    category VARCHAR(50) NOT NULL,
    target_value INTEGER DEFAULT 1,
    current_progress INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 20,
    point_reward INTEGER DEFAULT 10,
    is_completed BOOLEAN DEFAULT FALSE,
    mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 4. PHOTO ANALYSIS (AI PT & Dietitian)
-- ============================================================

-- User body photos for AI analysis
CREATE TABLE IF NOT EXISTS user_body_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50) NOT NULL, -- 'front', 'side', 'back', 'custom'
    analysis_type VARCHAR(50) NOT NULL, -- 'fitness', 'nutrition', 'posture'
    ai_analysis JSONB, -- structured AI analysis result
    ai_analysis_text TEXT, -- full text analysis
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated programs (workout or nutrition)
CREATE TABLE IF NOT EXISTS ai_generated_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_type VARCHAR(50) NOT NULL, -- 'workout', 'nutrition'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    program_data JSONB NOT NULL, -- full program details
    based_on_photo_id UUID REFERENCES user_body_photos(id),
    duration_weeks INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. USER AGREEMENTS TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS user_agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agreement_type VARCHAR(50) NOT NULL, -- 'terms', 'privacy', 'kvkk', 'data_processing'
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    UNIQUE(user_id, agreement_type, version)
);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE user_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currency ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_body_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own league data" ON user_leagues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own league data" ON user_leagues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own league data" ON user_leagues FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view group members" ON league_group_members FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own group member" ON league_group_members FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own XP" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own XP" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own league history" ON league_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view store items" ON store_items FOR SELECT USING (TRUE);

CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases" ON purchase_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON purchase_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own currency" ON user_currency FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own currency" ON user_currency FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own currency" ON user_currency FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own missions" ON weekly_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON weekly_missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON weekly_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own daily missions" ON daily_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own daily missions" ON daily_missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily missions" ON daily_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own photos" ON user_body_photos FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own programs" ON ai_generated_programs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agreements" ON user_agreements FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_leagues_user ON user_leagues(user_id);
CREATE INDEX IF NOT EXISTS idx_user_leagues_group ON user_leagues(group_id);
CREATE INDEX IF NOT EXISTS idx_league_group_members_group ON league_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_league_group_members_user ON league_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_league_history_user ON league_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_user ON purchase_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_currency_user ON user_currency(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_missions_user ON weekly_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_missions_dates ON weekly_missions(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON daily_missions(user_id, mission_date);
CREATE INDEX IF NOT EXISTS idx_user_body_photos_user ON user_body_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_programs_user ON ai_generated_programs(user_id);

-- ============================================================
-- 8. AUTO-UPDATE TRIGGERS
-- ============================================================

CREATE TRIGGER set_timestamp_user_leagues BEFORE UPDATE ON user_leagues FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_league_group_members BEFORE UPDATE ON league_group_members FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_currency BEFORE UPDATE ON user_currency FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_inventory BEFORE UPDATE ON user_inventory FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_ai_programs BEFORE UPDATE ON ai_generated_programs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
