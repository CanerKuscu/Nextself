-- ============================================
-- SEPARATE TABLES AND VIEWS
-- ============================================

-- List all VIEWS in public schema
SELECT table_name, 'VIEW' as type
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- List all TABLES in public schema  
SELECT table_name, 'TABLE' as type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
