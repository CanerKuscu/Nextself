-- ============================================
-- CHECK REAL TABLE STRUCTURE IN SUPABASE
-- Run this first to see actual column names
-- ============================================

-- Check professional_profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'professional_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any professional_profiles tables
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name LIKE '%professional%' 
AND table_schema = 'public';
