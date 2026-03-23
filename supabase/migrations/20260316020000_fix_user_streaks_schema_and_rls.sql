DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_streaks'
          AND column_name = 'last_workout_date'
    ) THEN
        ALTER TABLE public.user_streaks ADD COLUMN last_workout_date DATE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_streaks'
          AND column_name = 'last_rest_date'
    ) THEN
        ALTER TABLE public.user_streaks ADD COLUMN last_rest_date DATE;
    END IF;
END $$;

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_streaks'
          AND policyname = 'Users can insert own streak'
    ) THEN
        CREATE POLICY "Users can insert own streak"
            ON public.user_streaks
            FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_streaks'
          AND policyname = 'Users can update own streak'
    ) THEN
        CREATE POLICY "Users can update own streak"
            ON public.user_streaks
            FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;
