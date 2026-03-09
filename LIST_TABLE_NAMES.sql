-- ============================================
-- LIST ALL TABLE NAMES (separate query)
-- ============================================

-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
