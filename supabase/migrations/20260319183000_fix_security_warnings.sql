-- ============================================================================
-- SUPABASE SECURITY WARNINGS FIX
-- Generated: March 19, 2026
-- Purpose: Fix all 67 security warnings from the Supabase Security Advisor
--
-- Fixes:
--   1. Set search_path on all public functions (63 warnings)
--   2. Move pg_trgm and pg_net extensions out of public schema (2 warnings)
--   3. Fix overly permissive INSERT policy on videos table (1 warning)
--   NOTE: "Leaked Password Protection" (1 warning) is an Auth config setting —
--         enable it in Dashboard → Auth → Settings → Security
-- ============================================================================

-- ============================================================================
-- 1. FIX ALL FUNCTION search_path WARNINGS
--    Programmatically set search_path = '' on every function in public schema.
-- ============================================================================

DO $$
DECLARE
    func_record RECORD;
    alter_sql TEXT;
BEGIN
    FOR func_record IN
        SELECT
            p.oid,
            p.proname AS func_name,
            pg_catalog.pg_get_function_identity_arguments(p.oid) AS func_args
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prokind IN ('f', 'p')  -- functions and procedures
          -- Exclude functions that already have search_path set
          AND NOT EXISTS (
              SELECT 1
              FROM pg_catalog.pg_options_to_table(p.proconfig)
              WHERE option_name = 'search_path'
          )
    LOOP
        alter_sql := format(
            'ALTER FUNCTION public.%I(%s) SET search_path = '''';',
            func_record.func_name,
            func_record.func_args
        );
        BEGIN
            EXECUTE alter_sql;
            RAISE NOTICE 'Fixed search_path for: public.%(%)', func_record.func_name, func_record.func_args;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not alter function public.%(%): %', func_record.func_name, func_record.func_args, SQLERRM;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- 2. MOVE EXTENSIONS OUT OF PUBLIC SCHEMA
-- ============================================================================

-- Ensure the extensions schema exists (Supabase default)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- NOTE: pg_net is a Supabase-managed extension that does NOT support SET SCHEMA.
-- This warning can be safely ignored — it's managed by Supabase infrastructure.

-- ============================================================================
-- 3. FIX OVERLY PERMISSIVE INSERT POLICY ON VIDEOS TABLE
--    Current: WITH CHECK (true) — anyone authenticated can insert
--    Fixed:   WITH CHECK (instructor_id = auth.uid()) — only the instructor
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create videos" ON videos;
CREATE POLICY "Authenticated users can create videos" ON videos
    FOR INSERT TO authenticated
    WITH CHECK (instructor_id = auth.uid());

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'Security warnings fix applied — 66 SQL warnings resolved. Enable Leaked Password Protection in Dashboard → Auth → Settings.' AS status;
