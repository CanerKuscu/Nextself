-- ============================================
-- CHECK ALL TABLES IN SUPABASE DATABASE
-- ============================================

-- List all tables in public schema
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Also check table counts
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
