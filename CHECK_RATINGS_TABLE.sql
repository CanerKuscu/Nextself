-- ============================================
-- CHECK RATINGS TABLE STRUCTURE
-- ============================================

-- Check ratings table columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ratings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check what's in ratings table
SELECT * FROM ratings LIMIT 1;
