ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

INSERT INTO public.users (id, email, username, first_name, last_name)
SELECT
    au.id,
    COALESCE(au.email, ''),
    COALESCE(au.raw_user_meta_data->>'username', split_part(COALESCE(au.email, ''), '@', 1), 'user_' || substring(au.id::text, 1, 8)),
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', '')
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

INSERT INTO public.user_profiles (user_id)
SELECT au.id
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.user_id = au.id
WHERE up.user_id IS NULL;

INSERT INTO public.user_currencies (user_id, points, gems)
SELECT au.id, 0, 0
FROM auth.users au
LEFT JOIN public.user_currencies uc ON uc.user_id = au.id
WHERE uc.user_id IS NULL;
