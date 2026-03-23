-- ============================================================================
-- SUPABASE SCHEMA FIXES - CODE-DATABASE ALIGNMENT
-- Generated: March 2026
-- Purpose: Fix schema mismatches between code expectations and database
-- 
-- CRITICAL: This migration assumes all previous migrations (20260312* - 20260313*)
-- have been executed. It fixes CODE-DATABASE mismatches discovered during analysis.
--
-- DO NOT MODIFY exercises OR food_items tables - they are imported externally
-- ============================================================================

-- ============================================================================
-- 1. FIX PROFESSIONAL_PROFILES TABLE - Code expects 'professional_id' column
-- ============================================================================

-- The code (ratingService.ts) queries .eq('professional_id', ...) but the 
-- migration defines the PK as 'id'. We create a generated column to align them.
DO $$
BEGIN
    -- Check if professional_id column exists, if not add it as a generated column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_profiles' AND column_name = 'professional_id') THEN
        ALTER TABLE professional_profiles ADD COLUMN professional_id UUID GENERATED ALWAYS AS (id) STORED;
    END IF;
END $$;

-- Add index on the generated column for performance
CREATE INDEX IF NOT EXISTS idx_professional_profiles_professional_id ON professional_profiles(professional_id);

-- ============================================================================
-- 2. FIX CLIENT_RELATIONSHIPS TABLE - Add missing columns code expects
-- ============================================================================

-- Add professional_id column (code expects this for unified professional references)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_relationships' AND column_name = 'professional_id') THEN
        ALTER TABLE client_relationships ADD COLUMN professional_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add commission_amount column (code expects this, migration only had commission_paid boolean)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_relationships' AND column_name = 'commission_amount') THEN
        ALTER TABLE client_relationships ADD COLUMN commission_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Add missing timestamps if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_relationships' AND column_name = 'updated_at') THEN
        ALTER TABLE client_relationships ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create index on professional_id for performance
CREATE INDEX IF NOT EXISTS idx_client_relationships_professional_id ON client_relationships(professional_id);

-- ============================================================================
-- 3. FIX USERS TABLE - Add missing columns referenced in code
-- ============================================================================

-- Add user_type column (referenced in paymentService.ts for admin checks)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'user_type') THEN
        ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'user';
    END IF;
END $$;

-- Add other commonly referenced columns
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
-- 4. FIX RATINGS TABLE - Ensure all columns code expects exist
-- ============================================================================

-- Add helpful_count column if missing (referenced in ratingService.ts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ratings' AND column_name = 'helpful_count') THEN
        ALTER TABLE ratings ADD COLUMN helpful_count INT DEFAULT 0;
    END IF;
END $$;

-- Add response column if missing (JSONB for professional responses to reviews)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ratings' AND column_name = 'response') THEN
        ALTER TABLE ratings ADD COLUMN response JSONB;
    END IF;
END $$;

-- ============================================================================
-- 5. FIX PROFESSIONAL_PROFILES TABLE - Add location columns code expects
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_profiles' AND column_name = 'city') THEN
        ALTER TABLE professional_profiles ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_profiles' AND column_name = 'district') THEN
        ALTER TABLE professional_profiles ADD COLUMN district TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_profiles' AND column_name = 'country') THEN
        ALTER TABLE professional_profiles ADD COLUMN country TEXT DEFAULT 'Turkey';
    END IF;
END $$;

-- ============================================================================
-- 6. ENSURE PROFILES VIEW IS CORRECTLY DEFINED
-- ============================================================================

-- First ensure all users columns exist (run this before creating view)
DO $$
BEGIN
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
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'user_type') THEN
        ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'user';
    END IF;
END $$;

-- Drop and recreate the profiles view
DROP VIEW IF EXISTS profiles;

CREATE VIEW profiles AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.height,
    u.weight,
    u.is_email_verified,
    u.is_deleted,
    u.created_at,
    u.updated_at,
    u.avatar_url,
    u.professional_type,
    u.gender,
    u.phone,
    u.user_type,
    up.goals,
    up.activity_level,
    up.dietary_preferences,
    up.dietary_restrictions,
    up.personal_trainer_id,
    up.dietitian_id,
    up.data_sharing_permissions
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_deleted = FALSE;

COMMENT ON VIEW profiles IS 'Public view of user profiles combining users and user_profiles tables';

-- ============================================================================
-- 7. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for client_relationships
CREATE INDEX IF NOT EXISTS idx_client_relationships_client ON client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_trainer ON client_relationships(trainer_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_dietitian ON client_relationships(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_status ON client_relationships(status);

-- Indexes for ratings
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_professional_id ON ratings(professional_id);
CREATE INDEX IF NOT EXISTS idx_ratings_date ON ratings(date DESC);

-- Indexes for professional_profiles
CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id ON professional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_type ON professional_profiles(professional_type);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_city ON professional_profiles(city);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_country ON professional_profiles(country);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_verified ON professional_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_active ON professional_profiles(is_active) WHERE is_active = TRUE;

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type) WHERE user_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_professional_type ON users(professional_type) WHERE professional_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(is_deleted) WHERE is_deleted = FALSE;

-- ============================================================================
-- 8. ENSURE RLS POLICIES EXIST FOR CRITICAL TABLES
-- ============================================================================

-- Enable RLS on tables if not already enabled
ALTER TABLE IF EXISTS professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_relationships ENABLE ROW LEVEL SECURITY;

-- Professional Profiles RLS Policies
DO $$
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Professional profiles are viewable by everyone" ON professional_profiles;
    DROP POLICY IF EXISTS "Users can create own professional profile" ON professional_profiles;
    DROP POLICY IF EXISTS "Users can update own professional profile" ON professional_profiles;
    DROP POLICY IF EXISTS "Users can delete own professional profile" ON professional_profiles;
    
    -- Create new policies
    CREATE POLICY "Professional profiles are viewable by everyone" ON professional_profiles
        FOR SELECT USING (is_active = TRUE);
    
    CREATE POLICY "Users can create own professional profile" ON professional_profiles
        FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can update own professional profile" ON professional_profiles
        FOR UPDATE TO authenticated USING (user_id = auth.uid());
    
    CREATE POLICY "Users can delete own professional profile" ON professional_profiles
        FOR DELETE TO authenticated USING (user_id = auth.uid());
END $$;

-- Ratings RLS Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON ratings;
    DROP POLICY IF EXISTS "Authenticated users can create ratings" ON ratings;
    DROP POLICY IF EXISTS "Users can update own ratings" ON ratings;
    DROP POLICY IF EXISTS "Users can delete own ratings" ON ratings;
    
    CREATE POLICY "Ratings are viewable by everyone" ON ratings
        FOR SELECT USING (true);
    
    CREATE POLICY "Authenticated users can create ratings" ON ratings
        FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can update own ratings" ON ratings
        FOR UPDATE TO authenticated USING (user_id = auth.uid());
    
    CREATE POLICY "Users can delete own ratings" ON ratings
        FOR DELETE TO authenticated USING (user_id = auth.uid());
END $$;

-- Client Relationships RLS Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Clients can view own relationships" ON client_relationships;
    DROP POLICY IF EXISTS "Professionals can view their client relationships" ON client_relationships;
    DROP POLICY IF EXISTS "System can create relationships" ON client_relationships;
    
    CREATE POLICY "Clients can view own relationships" ON client_relationships
        FOR SELECT TO authenticated USING (client_id = auth.uid());
    
    CREATE POLICY "Professionals can view their client relationships" ON client_relationships
        FOR SELECT TO authenticated USING (
            professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
            OR trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
            OR dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        );
    
    CREATE POLICY "System can create relationships" ON client_relationships
        FOR INSERT TO authenticated WITH CHECK (true);
    
    CREATE POLICY "Professionals can update their client relationships" ON client_relationships
        FOR UPDATE TO authenticated USING (
            professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
            OR trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
            OR dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        );
END $$;

-- ============================================================================
-- 9. UPDATE TRIGGERS FOR NEW COLUMNS
-- ============================================================================

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables that need updated_at automation
DO $$
BEGIN
    -- client_relationships
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_relationships_updated_at') THEN
        CREATE TRIGGER update_client_relationships_updated_at 
        BEFORE UPDATE ON client_relationships
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- ratings
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ratings_updated_at') THEN
        CREATE TRIGGER update_ratings_updated_at 
        BEFORE UPDATE ON ratings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- 10. DATA MIGRATION - Sync existing data with new columns
-- ============================================================================

-- Migrate existing client_relationships to populate professional_id
UPDATE client_relationships 
SET professional_id = COALESCE(trainer_id, dietitian_id)
WHERE professional_id IS NULL AND (trainer_id IS NOT NULL OR dietitian_id IS NOT NULL);

-- ============================================================================
-- 11. HELPER FUNCTIONS FOR APPLICATION CODE
-- ============================================================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_subscription BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = user_uuid
        AND status = 'active'
        AND current_period_end > NOW()
    ) INTO has_subscription;
    
    RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    plan_name TEXT;
BEGIN
    SELECT sp.name INTO plan_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.current_period_end > NOW()
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(plan_name, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_subscriptions
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
    AND current_period_end < NOW()
    AND (trial_end IS NULL OR trial_end < NOW());
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for chat system
DROP FUNCTION IF EXISTS get_unread_count(UUID);

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

-- Function to mark messages as read
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID);

CREATE OR REPLACE FUNCTION mark_messages_as_read(chat_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE chat_participants
    SET last_read_at = NOW()
    WHERE chat_id = chat_uuid AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'Schema alignment migration executed successfully!' AS status;
