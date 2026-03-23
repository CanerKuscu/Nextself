ALTER TABLE client_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_relationships FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can create relationships" ON client_relationships;
DROP POLICY IF EXISTS "Professionals can update their client relationships" ON client_relationships;
DROP POLICY IF EXISTS "Professionals can update own relationships" ON client_relationships;
DROP POLICY IF EXISTS "Professionals can view own relationships" ON client_relationships;
DROP POLICY IF EXISTS "Professionals can view their client relationships" ON client_relationships;
DROP POLICY IF EXISTS "Clients can view own relationships" ON client_relationships;

CREATE POLICY "Clients can view own relationships" ON client_relationships
    FOR SELECT
    USING (client_id = auth.uid());

CREATE POLICY "Professionals can view own relationships" ON client_relationships
    FOR SELECT
    USING (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        OR trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        OR dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Professionals can update own relationships" ON client_relationships
    FOR UPDATE
    USING (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        OR trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        OR dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        OR trainer_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
        OR dietitian_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );

ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals can view own transaction logs" ON transaction_logs;

CREATE POLICY "Professionals can view own transaction logs" ON transaction_logs
    FOR SELECT
    USING (
        professional_id IN (SELECT id FROM professional_profiles WHERE user_id = auth.uid())
    );
