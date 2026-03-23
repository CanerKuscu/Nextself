-- Fix for Enum error: "invalid input value for enum agreement_type_enum: \"subscription\""
ALTER TYPE agreement_type_enum ADD VALUE IF NOT EXISTS 'subscription';

-- Fix for RLS error: "new row violates row-level security policy for table \"user_agreements\""
-- We need to allow users to insert their own agreements
DROP POLICY IF EXISTS "Users can insert own agreements" ON user_agreements;
CREATE POLICY "Users can insert own agreements" ON user_agreements
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agreements" ON user_agreements
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Fix for RLS recursion error: "infinite recursion detected in policy for relation \"chat_participants\""
-- Create a security definer function to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM chat_participants
    WHERE chat_id = chat_uuid
    AND user_id = auth.uid()
  );
END;
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view chat participants for their chats" ON chat_participants;

-- Create the new non-recursive policy
CREATE POLICY "Users can view chat participants for their chats" ON chat_participants
    FOR SELECT TO authenticated 
    USING (
        -- User can see participants if they are a participant themselves
        is_chat_participant(chat_id)
    );

-- Optimizing the INSERT policy to use the function as well, though not strictly necessary if SELECT is fixed
DROP POLICY IF EXISTS "Users can add participants to their chats" ON chat_participants;
CREATE POLICY "Users can add participants to their chats" ON chat_participants
    FOR INSERT TO authenticated 
    WITH CHECK (
        -- User can add participants if they are already a participant
        is_chat_participant(chat_id)
        -- Or if they are the creator of the chat (requires access to chats table)
        OR EXISTS (SELECT 1 FROM chats WHERE id = chat_id AND created_by = auth.uid())
    );
