-- ============================================
-- CHECK ALL COLUMNS IN PROFESSIONAL_PROFILES
-- ============================================

-- Get the actual structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'professional_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also try to see what's actually in the table
SELECT * FROM professional_profiles LIMIT 1;
