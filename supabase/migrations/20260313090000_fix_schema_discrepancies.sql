-- SQL Queries to Fix Schema Discrepancies

-- Add missing columns to user_profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'goals') THEN
        ALTER TABLE user_profiles ADD COLUMN goals TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'activity_level') THEN
        ALTER TABLE user_profiles ADD COLUMN activity_level activity_level_enum DEFAULT 'sedentary';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'dietary_preferences') THEN
        ALTER TABLE user_profiles ADD COLUMN dietary_preferences TEXT;
    END IF;
END $$;

-- Add missing columns to client_relationships table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_relationships' AND column_name = 'professional_id') THEN
        ALTER TABLE client_relationships ADD COLUMN professional_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_relationships' AND column_name = 'commission_amount') THEN
        ALTER TABLE client_relationships ADD COLUMN commission_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Add missing columns to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'deleted_at') THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'professional_type') THEN
        ALTER TABLE users ADD COLUMN professional_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE users ADD COLUMN gender TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone TEXT;
    END IF;
END $$;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_professional_profiles_professional_id ON professional_profiles(professional_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_professional_id ON client_relationships(professional_id);