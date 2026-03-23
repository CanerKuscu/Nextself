-- ============================================================================
-- BIOSYNC SECURITY ENHANCEMENTS: SESSION & RELATIONSHIPS
-- Generated: March 15, 2026
-- Purpose: Create and secure session_checkins and client_relationships tables with RLS.
-- ============================================================================

-- 0. CREATE MISSING TABLES

-- Client Relationships Table
CREATE TABLE IF NOT EXISTS client_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL, -- Generic pro reference
    trainer_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL,      -- Specific for PT
    dietitian_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL,    -- Specific for Dietitian
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Checkins Table
CREATE TABLE IF NOT EXISTS session_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_relationship_id UUID REFERENCES client_relationships(id) ON DELETE CASCADE,
    qr_token TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    checkin_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. ENABLE RLS ON KEY TABLES
ALTER TABLE session_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_relationships ENABLE ROW LEVEL SECURITY;

-- 2. CLIENT RELATIONSHIPS POLICIES
-- Professionals can view their own relationships
DROP POLICY IF EXISTS "Professionals can view own relationships" ON client_relationships;
CREATE POLICY "Professionals can view own relationships" ON client_relationships
    FOR SELECT
    USING (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
        trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
        dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

-- Clients can view their own relationships
DROP POLICY IF EXISTS "Clients can view own relationships" ON client_relationships;
CREATE POLICY "Clients can view own relationships" ON client_relationships
    FOR SELECT
    USING (client_id = auth.uid());

-- Professionals can update their own relationships (e.g. status)
DROP POLICY IF EXISTS "Professionals can update own relationships" ON client_relationships;
CREATE POLICY "Professionals can update own relationships" ON client_relationships
    FOR UPDATE
    USING (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
        trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
        dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

-- 3. SESSION CHECKINS POLICIES
-- Professionals can insert checkins for their clients
DROP POLICY IF EXISTS "Professionals can insert checkins" ON session_checkins;
CREATE POLICY "Professionals can insert checkins" ON session_checkins
    FOR INSERT
    WITH CHECK (
        client_relationship_id IN (
            SELECT id FROM client_relationships 
            WHERE 
                professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
                trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
                dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        )
    );

-- Professionals can view checkins for their clients
DROP POLICY IF EXISTS "Professionals can view checkins" ON session_checkins;
CREATE POLICY "Professionals can view checkins" ON session_checkins
    FOR SELECT
    USING (
        client_relationship_id IN (
            SELECT id FROM client_relationships 
            WHERE 
                professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
                trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid()) OR
                dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        )
    );

-- Clients can view and update (verify) their own checkins
DROP POLICY IF EXISTS "Clients can view own checkins" ON session_checkins;
CREATE POLICY "Clients can view own checkins" ON session_checkins
    FOR SELECT
    USING (
        client_relationship_id IN (SELECT id FROM client_relationships WHERE client_id = auth.uid())
    );

DROP POLICY IF EXISTS "Clients can verify own checkins" ON session_checkins;
CREATE POLICY "Clients can verify own checkins" ON session_checkins
    FOR UPDATE
    USING (
        client_relationship_id IN (SELECT id FROM client_relationships WHERE client_id = auth.uid())
    )
    WITH CHECK (
        client_relationship_id IN (SELECT id FROM client_relationships WHERE client_id = auth.uid())
    );

DROP POLICY IF EXISTS "Clients can delete own unverified checkins" ON session_checkins;
CREATE POLICY "Clients can delete own unverified checkins" ON session_checkins
    FOR DELETE
    USING (
        client_relationship_id IN (SELECT id FROM client_relationships WHERE client_id = auth.uid()) AND
        is_verified = false
    );

-- 4. OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_session_checkins_relationship ON session_checkins(client_relationship_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_client ON client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_pro ON client_relationships(professional_id);

SELECT 'Session and Relationship Tables Created and Secured' as status;
