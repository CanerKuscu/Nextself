CREATE TABLE IF NOT EXISTS public.professional_success_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
    client_alias TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    before_weight_kg NUMERIC,
    after_weight_kg NUMERIC,
    before_image_url TEXT,
    after_image_url TEXT,
    summary TEXT NOT NULL,
    consent_approved BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professional_success_stories_professional_id ON public.professional_success_stories(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_success_stories_public ON public.professional_success_stories(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_professional_success_stories_created_at ON public.professional_success_stories(created_at DESC);

ALTER TABLE public.professional_success_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional success stories public read" ON public.professional_success_stories;
CREATE POLICY "Professional success stories public read"
    ON public.professional_success_stories
    FOR SELECT
    USING (is_public = true AND consent_approved = true);

DROP POLICY IF EXISTS "Professionals can read own success stories" ON public.professional_success_stories;
CREATE POLICY "Professionals can read own success stories"
    ON public.professional_success_stories
    FOR SELECT
    TO authenticated
    USING (professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Professionals can create own success stories" ON public.professional_success_stories;
CREATE POLICY "Professionals can create own success stories"
    ON public.professional_success_stories
    FOR INSERT
    TO authenticated
    WITH CHECK (professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Professionals can update own success stories" ON public.professional_success_stories;
CREATE POLICY "Professionals can update own success stories"
    ON public.professional_success_stories
    FOR UPDATE
    TO authenticated
    USING (professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()))
    WITH CHECK (professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Professionals can delete own success stories" ON public.professional_success_stories;
CREATE POLICY "Professionals can delete own success stories"
    ON public.professional_success_stories
    FOR DELETE
    TO authenticated
    USING (professional_id IN (SELECT id FROM public.professional_profiles WHERE user_id = auth.uid()));
