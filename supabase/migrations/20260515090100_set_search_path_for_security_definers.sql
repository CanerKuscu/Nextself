-- ============================================================================
-- 20260515090100_set_search_path_for_security_definers.sql
--
-- Apply `SET search_path = public` to every SECURITY DEFINER function in the
-- `public` schema that does not already have an explicit search_path setting.
--
-- Background: A SECURITY DEFINER function runs with the privileges of its
-- owner. If `search_path` is mutable (the default), a caller can prepend a
-- malicious schema and shadow built-in functions/tables that the SECURITY
-- DEFINER body references unqualified. Pinning search_path closes this hole.
--
-- The script is idempotent — it skips functions that already have a
-- search_path config and re-applying it is a no-op.
-- ============================================================================

DO $$
DECLARE
    fn record;
BEGIN
    FOR fn IN
        SELECT
            n.nspname AS schema_name,
            p.proname AS func_name,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = TRUE
          AND NOT EXISTS (
              SELECT 1
              FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) cfg
              WHERE cfg LIKE 'search_path=%'
          )
    LOOP
        EXECUTE format(
            'ALTER FUNCTION %I.%I(%s) SET search_path = public',
            fn.schema_name, fn.func_name, fn.args
        );
    END LOOP;
END $$;
