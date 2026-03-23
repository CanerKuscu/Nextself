-- ============================================================================
-- FIX MISSION SCHEMA ALIGNMENT
-- Generated: March 15, 2026
-- Purpose: Align database columns with application code expectations (point_reward)
-- ============================================================================

-- 1. Weekly Missions: Ensure column name is points_reward (code updated to match DB)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'weekly_missions' AND column_name = 'point_reward') THEN
        ALTER TABLE weekly_missions RENAME COLUMN point_reward TO points_reward;
    END IF;
END $$;

-- 2. Daily Missions: Add point_reward column (missing in schema but used in code)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_missions' AND column_name = 'point_reward') THEN
        ALTER TABLE daily_missions ADD COLUMN point_reward INT DEFAULT 0;
    END IF;
END $$;

-- 3. Daily Missions: Fix column name mismatch for date/mission_date if any
-- Code uses 'mission_date', schema uses 'date'.
-- Let's check schema: "date DATE NOT NULL"
-- Code: "missionDate: m.mission_date" and ".eq('mission_date', today)"
-- This implies code expects 'mission_date'.
-- We should rename 'date' to 'mission_date' to avoid reserved word issues and match code.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'daily_missions' AND column_name = 'date') THEN
        ALTER TABLE daily_missions RENAME COLUMN date TO mission_date;
    END IF;
END $$;

-- 4. Weekly Missions: Fix status/is_completed mismatch
-- Code uses 'is_completed', schema uses 'status'.
-- We can add a generated column or just let the code handle it if it maps it.
-- But wait, code does: "isCompleted: m.is_completed"
-- And insert: "is_completed: false"
-- So code expects 'is_completed' column.
-- Schema has 'status' (enum).
-- We should add 'is_completed' as a boolean, or better, generated from status.
-- But code inserts it, so it must be a real column.
-- Let's add is_completed column and migrate data.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weekly_missions' AND column_name = 'is_completed') THEN
        ALTER TABLE weekly_missions ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
        -- Migrate existing status to is_completed
        UPDATE weekly_missions SET is_completed = (status = 'completed');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_missions' AND column_name = 'is_completed') THEN
        ALTER TABLE daily_missions ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
        UPDATE daily_missions SET is_completed = (status = 'completed');
    END IF;
END $$;

-- 5. Weekly Missions: Add completed_at if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weekly_missions' AND column_name = 'completed_at') THEN
        ALTER TABLE weekly_missions ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_missions' AND column_name = 'completed_at') THEN
        ALTER TABLE daily_missions ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- 6. Add missing created_at columns to missions tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_missions' AND column_name = 'created_at') THEN
        ALTER TABLE daily_missions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weekly_missions' AND column_name = 'created_at') THEN
        ALTER TABLE weekly_missions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 7. User Leagues: Add current_tier column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_leagues' AND column_name = 'current_tier') THEN
        ALTER TABLE user_leagues ADD COLUMN current_tier INT DEFAULT 1;
    END IF;
END $$;

SELECT 'Mission schema fixed successfully' as status;
