-- ============================================
-- CHECK VIDEO SYSTEM TABLES
-- ============================================

-- Check videos table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'videos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if videos table has any data
SELECT COUNT(*) as video_count FROM videos;

-- Check other video tables
SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_name IN ('videos', 'video_comments', 'video_likes', 'video_playlists', 'video_progress')
AND table_schema = 'public';
