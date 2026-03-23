-- Add new values to agreement_type_enum
-- Ensure idempotency so it does not crash if run multiple times

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
        WHERE pg_type.typname = 'agreement_type_enum' 
        AND pg_enum.enumlabel = 'consent'
    ) THEN
        ALTER TYPE agreement_type_enum ADD VALUE 'consent';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
        WHERE pg_type.typname = 'agreement_type_enum' 
        AND pg_enum.enumlabel = 'subscription'
    ) THEN
        ALTER TYPE agreement_type_enum ADD VALUE 'subscription';
    END IF;
END $$;
