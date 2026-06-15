-- Add days_of_week array to supplement_routines to know which days the supplement must be taken
ALTER TABLE public.user_supplement_routines
ADD COLUMN IF NOT EXISTS days_of_week INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]; -- 0=Sunday, 6=Saturday

-- Create an RPC to easily log supplement intake directly from action triggers safely
CREATE OR REPLACE FUNCTION public.log_supplement_intake(
  p_supplement_id UUID,
  p_quantity NUMERIC DEFAULT 1,
  p_unit TEXT DEFAULT 'serving',
  p_notes TEXT DEFAULT 'Logged from push notification'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_supplement_logs (
    user_id,
    supplement_id,
    quantity,
    unit,
    notes,
    taken_at
  ) VALUES (
    v_user_id,
    p_supplement_id,
    p_quantity,
    p_unit,
    p_notes,
    NOW()
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
