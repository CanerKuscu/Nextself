-- ============================================================================
-- ADD DELETE USER RPC
-- Purpose: Allow users to permanently delete their account from auth.users
-- which cascades to public.users and all related tables.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users. 
  -- Due to cascading deletes, this will also delete them from public.users and other tables.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
