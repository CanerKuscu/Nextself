-- ============================================================================
-- 🏛️ THE COUNCIL'S VERDICT: CODEBASE FORENSICS
-- Security Fix: Server-side RBAC Guard for Professional Features
-- ============================================================================

-- Function to check if a user is a professional (pt, dietitian, trainer) or admin
CREATE OR REPLACE FUNCTION is_professional(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    u_type TEXT;
BEGIN
    SELECT user_type INTO u_type FROM public.profiles WHERE id = user_id;
    RETURN u_type IN ('pt', 'dietitian', 'trainer', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce RLS on professional_profiles
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

-- Allow only professionals to create or update their own professional profile
CREATE POLICY "Professionals can manage their own profile"
    ON public.professional_profiles
    FOR ALL
    USING (
        auth.uid() = user_id AND 
        is_professional(auth.uid())
    )
    WITH CHECK (
        auth.uid() = user_id AND 
        is_professional(auth.uid())
    );

-- Enforce RLS on client_relationships
ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;

-- Professionals can view/manage relationships where they are the professional
CREATE POLICY "Professionals can manage their client relationships"
    ON public.client_relationships
    FOR ALL
    USING (
        (professional_id = (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
         trainer_id = (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
         dietitian_id = (SELECT id FROM professional_profiles WHERE user_id = auth.uid()))
        AND is_professional(auth.uid())
    );

-- Clients can view their own relationships
CREATE POLICY "Clients can view their relationships"
    ON public.client_relationships
    FOR SELECT
    USING (client_id = auth.uid());

-- Enforce RLS on assigned_workouts
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage workouts they assigned"
    ON public.assigned_workouts
    FOR ALL
    USING (
        pt_id = auth.uid() AND 
        is_professional(auth.uid())
    );

CREATE POLICY "Clients can view assigned workouts"
    ON public.assigned_workouts
    FOR SELECT
    USING (client_id = auth.uid());

-- Enforce RLS on assigned_nutrition_plans
ALTER TABLE public.assigned_nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage nutrition plans they assigned"
    ON public.assigned_nutrition_plans
    FOR ALL
    USING (
        dietitian_id = auth.uid() AND 
        is_professional(auth.uid())
    );

CREATE POLICY "Clients can view assigned nutrition plans"
    ON public.assigned_nutrition_plans
    FOR SELECT
    USING (client_id = auth.uid());

-- Enforce RLS on sessions (Appointments)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage their sessions"
    ON public.sessions
    FOR ALL
    USING (
        professional_id = auth.uid() AND 
        is_professional(auth.uid())
    );

CREATE POLICY "Clients can view their sessions"
    ON public.sessions
    FOR SELECT
    USING (client_id = auth.uid());
