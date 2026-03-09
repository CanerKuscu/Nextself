-- ============================================
-- LIST ONLY VIEWS
-- ============================================

-- List all VIEWS in public schema
SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
