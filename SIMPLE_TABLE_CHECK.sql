-- ============================================
-- SIMPLE TABLE STRUCTURE CHECK
-- ============================================

-- Get all columns from professional_profiles table
SELECT * 
FROM information_schema.columns 
WHERE table_name = 'professional_profiles' 
AND table_schema = 'public';

-- Alternative: Try to describe the table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'professional_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
