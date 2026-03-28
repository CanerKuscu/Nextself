-- ============================================================================
-- FIX USER REGISTRATION TRIGGER
-- Purpose: Correctly map registration fields from auth metadata to profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_full_name TEXT;
    v_prof_type professional_type_enum;
BEGIN
    v_first_name := new.raw_user_meta_data->>'first_name';
    v_last_name := new.raw_user_meta_data->>'last_name';
    v_full_name := new.raw_user_meta_data->>'full_name';
    
    IF v_first_name IS NULL AND v_full_name IS NOT NULL THEN
        v_first_name := split_part(v_full_name, ' ', 1);
        v_last_name := substring(v_full_name FROM length(v_first_name) + 2);
    END IF;

    INSERT INTO public.users (
        id, 
        email, 
        username, 
        first_name, 
        last_name,
        date_of_birth,
        height,
        weight,
        user_type,
        gender
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(v_first_name, ''),
        COALESCE(v_last_name, ''),
        NULLIF(new.raw_user_meta_data->>'date_of_birth', '')::DATE,
        NULLIF(new.raw_user_meta_data->>'height_cm', '')::NUMERIC,
        NULLIF(new.raw_user_meta_data->>'weight_kg', '')::NUMERIC,
        COALESCE(new.raw_user_meta_data->>'user_type', 'user'),
        new.raw_user_meta_data->>'gender'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), users.first_name),
        last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), users.last_name),
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, users.date_of_birth),
        height = COALESCE(EXCLUDED.height, users.height),
        weight = COALESCE(EXCLUDED.weight, users.weight),
        user_type = COALESCE(EXCLUDED.user_type, users.user_type),
        gender = COALESCE(EXCLUDED.gender, users.gender),
        updated_at = NOW();
        
    -- Also initialize user_profiles
    INSERT INTO public.user_profiles (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialize user_currencies
    INSERT INTO public.user_currencies (user_id, points, gems)
    VALUES (new.id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- If user is a professional, initialize their specific profiles
    IF new.raw_user_meta_data->>'user_type' IN ('pt', 'trainer', 'dietitian') THEN
        IF new.raw_user_meta_data->>'user_type' = 'dietitian' THEN
            v_prof_type := 'dietitian';
        ELSE
            v_prof_type := 'trainer';
        END IF;

        INSERT INTO public.professional_profiles (
            user_id, 
            professional_type, 
            first_name, 
            last_name, 
            email
        )
        VALUES (
            new.id, 
            v_prof_type,
            COALESCE(v_first_name, ''),
            COALESCE(v_last_name, ''),
            new.email
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
