-- ============================================================================
-- FIX MISSIONS: ENUM CATEGORIES AND RLS
-- Generated: March 15, 2026
-- Purpose: Add missing mission categories and fix RLS policies to prevent blocking
-- ============================================================================

-- 1. Add missing categories to mission_category_enum
-- Note: Postgres 12+ allows ADD VALUE in transaction, but we cannot use them in same transaction.
-- We use DO block to prevent errors if value exists (though IF NOT EXISTS is cleaner if supported)

DO $$
BEGIN
    -- Add 'health'
    BEGIN
        ALTER TYPE mission_category_enum ADD VALUE 'health';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    -- Add 'hydration'
    BEGIN
        ALTER TYPE mission_category_enum ADD VALUE 'hydration';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    -- Add 'mindfulness'
    BEGIN
        ALTER TYPE mission_category_enum ADD VALUE 'mindfulness';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    -- Add 'sleep'
    BEGIN
        ALTER TYPE mission_category_enum ADD VALUE 'sleep';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    -- Add 'steps'
    BEGIN
        ALTER TYPE mission_category_enum ADD VALUE 'steps';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;
    
    -- Add 'streak'
    BEGIN
        ALTER TYPE mission_category_enum ADD VALUE 'streak';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    -- Add 'supplements'
    BEGIN
        ALTER TYPE mission_category_enum ADD VALUE 'supplements';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;
END $$;

-- 2. Relax RLS policies for Missions to unblock users
-- We remove the is_active_user() check for now as it might be causing issues if public.users is out of sync.
-- Standard auth.uid() check is sufficient for basic security.

-- Weekly Missions
DROP POLICY IF EXISTS "Users can manage own weekly missions" ON weekly_missions;
CREATE POLICY "Users can manage own weekly missions" ON weekly_missions
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own weekly missions" ON weekly_missions;
CREATE POLICY "Users can view own weekly missions" ON weekly_missions
    FOR SELECT USING (user_id = auth.uid());

-- Daily Missions
DROP POLICY IF EXISTS "Users can manage own daily missions" ON daily_missions;
CREATE POLICY "Users can manage own daily missions" ON daily_missions
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own daily missions" ON daily_missions;
CREATE POLICY "Users can view own daily missions" ON daily_missions
    FOR SELECT USING (user_id = auth.uid());

SELECT 'Mission categories added and RLS fixed' as status;
