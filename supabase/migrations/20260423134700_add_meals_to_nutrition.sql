-- Add meals JSONB array to assigned_nutrition_plans if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assigned_nutrition_plans' AND column_name = 'meals') THEN
        ALTER TABLE assigned_nutrition_plans ADD COLUMN meals JSONB NOT NULL DEFAULT '[]'::JSONB;
    END IF;
END $$;
