-- ============================================================
-- BIOSYNC - EKSİK TABLO TANIMLARI
-- Missing Table Definitions for Supabase
-- Run this in Supabase SQL Editor to create missing tables
-- ============================================================

-- ============================================================
-- 1. SUPPLEMENTS TABLE
-- Contains supplement, vitamin, and mineral product data
-- Referenced by: supplement_vitamin_mineral_data.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS supplements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(50),
    type VARCHAR(50),
    dosage VARCHAR(50),
    unit VARCHAR(20),
    serving_size VARCHAR(100),
    ingredients TEXT[],
    benefits TEXT[],
    side_effects TEXT[],
    warnings TEXT[],
    interactions TEXT[],
    recommended_intake JSONB,
    price JSONB,
    availability BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplements (public read access)
CREATE POLICY "Anyone can view supplements" ON supplements
    FOR SELECT USING (true);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_supplements_category ON supplements(category);
CREATE INDEX IF NOT EXISTS idx_supplements_name ON supplements(name);

-- ============================================================
-- 2. STORE_ITEMS TABLE
-- In-app store items for gamification (boosters, cosmetics, etc.)
-- Referenced by: BIOSYNC_FEATURE_ENHANCEMENT_SCHEMA.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS store_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_tr VARCHAR(255),
    description TEXT,
    description_tr TEXT,
    category VARCHAR(50) CHECK (category IN ('booster', 'cosmetic', 'utility', 'equipment', 'nutrition', 'recovery', 'seasonal', 'premium')),
    icon VARCHAR(50),
    price_points INTEGER NOT NULL,
    effect_type VARCHAR(50),
    effect_duration_minutes INTEGER,
    max_stack INTEGER DEFAULT 1,
    is_consumable BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    badge_text TEXT,
    badge_color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_items (public read, admin write)
CREATE POLICY "Anyone can view store items" ON store_items
    FOR SELECT USING (is_active = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category);
CREATE INDEX IF NOT EXISTS idx_store_items_rarity ON store_items(rarity);
CREATE INDEX IF NOT EXISTS idx_store_items_active ON store_items(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_items_name_unique ON store_items(name);

-- ============================================================
-- 3. FRIENDSHIPS TABLE
-- Social connections between users with streak tracking
-- Referenced by: SUPABASE_ADDITIONAL_MODULES.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_streak_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships
CREATE POLICY "Users can view their own friendships" ON friendships
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create friendships" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own friendships" ON friendships
    FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Users can update streak data" ON friendships
    FOR UPDATE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friendships_follower ON friendships(follower_id);
CREATE INDEX IF NOT EXISTS idx_friendships_following ON friendships(following_id);
CREATE INDEX IF NOT EXISTS idx_friendships_streak ON friendships(current_streak DESC);

-- ============================================================
-- EXECUTION NOTE:
-- Run this entire file in Supabase SQL Editor
-- Tables will be created only if they don't already exist
-- ============================================================
