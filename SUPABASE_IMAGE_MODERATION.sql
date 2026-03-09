-- ==========================================
-- SUPABASE IMAGE MODERATION SETUP
-- ==========================================
-- This script sets up a database trigger to call an Edge Function
-- whenever a new image is uploaded to the "avatars" bucket.
-- ==========================================

-- 1. Enable the pg_net extension if not already enabled
create extension if not exists pg_net;

-- 2. Create the webhook function
-- Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
create or replace function public.trigger_image_moderation()
returns trigger
language plpgsql
security definer
as $$
declare
  -- Your Supabase Edge Function URL for moderation
  edge_function_url text := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/moderate-image-hook';
  -- Your Supabase Anon or Service Role key
  auth_header text := 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY';
  payload jsonb;
begin
  -- Ensure this only runs for the 'avatars' bucket
  if new.bucket_id = 'avatars' then
    -- Prepare payload to send to the Edge Function
    payload := jsonb_build_object(
      'record', row_to_json(new)
    );

    -- Call the Edge Function asynchronously
    perform net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', auth_header
      ),
      body := payload
    );
  end if;
  
  return new;
end;
$$;

-- 3. Create the trigger on storage.objects
drop trigger if exists on_avatar_upload on storage.objects;
create trigger on_avatar_upload
  after insert on storage.objects
  for each row
  execute function public.trigger_image_moderation();

-- ==========================================
-- NOTE:
-- Once you run this SQL, you'll need to deploy the `moderate-image-hook`
-- edge function which will receive the 'record', check it with a Moderation API
-- (e.g. Sightengine), and if NSFW, delete the object and flag the user profile.
-- ==========================================
