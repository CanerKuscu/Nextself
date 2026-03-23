DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'ai_program_type_enum' AND e.enumlabel = 'supplement'
    ) THEN
        ALTER TYPE ai_program_type_enum ADD VALUE 'supplement';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'ai_program_type_enum' AND e.enumlabel = 'water'
    ) THEN
        ALTER TYPE ai_program_type_enum ADD VALUE 'water';
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can insert own AI programs" ON ai_generated_programs;
CREATE POLICY "Users can insert own AI programs" ON ai_generated_programs
    FOR INSERT WITH CHECK (user_id = auth.uid() AND is_active_user());

DROP POLICY IF EXISTS "Users can update own AI programs" ON ai_generated_programs;
CREATE POLICY "Users can update own AI programs" ON ai_generated_programs
    FOR UPDATE USING (user_id = auth.uid() AND is_active_user())
    WITH CHECK (user_id = auth.uid() AND is_active_user());

DROP POLICY IF EXISTS "Users can delete own AI programs" ON ai_generated_programs;
CREATE POLICY "Users can delete own AI programs" ON ai_generated_programs
    FOR DELETE USING (user_id = auth.uid() AND is_active_user());
