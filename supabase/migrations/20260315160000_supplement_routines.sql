-- Create user_supplement_routines table
CREATE TABLE IF NOT EXISTS public.user_supplement_routines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplement_id UUID REFERENCES public.supplements(id) ON DELETE CASCADE NOT NULL,
    reminder_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, supplement_id)
);

-- Enable RLS
ALTER TABLE public.user_supplement_routines ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own routines" 
ON public.user_supplement_routines FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routines" 
ON public.user_supplement_routines FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines" 
ON public.user_supplement_routines FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines" 
ON public.user_supplement_routines FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_supplement_routines_user_id ON public.user_supplement_routines(user_id);
