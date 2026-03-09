-- ==========================================
-- BioSync Progress Report Aggregations RPCs
-- ==========================================

-- 1. Get workout summary for a period
CREATE OR REPLACE FUNCTION get_workout_summary(p_user_id UUID, p_start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    total_workouts BIGINT,
    total_duration BIGINT,
    calories_burned BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_workouts,
        COALESCE(SUM(duration_minutes), 0)::BIGINT as total_duration,
        COALESCE(SUM(calories_burned), 0)::BIGINT as calories_burned
    FROM workout_logs
    WHERE user_id = p_user_id AND created_at >= p_start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get nutrition summary for a period
CREATE OR REPLACE FUNCTION get_nutrition_summary(p_user_id UUID, p_start_date DATE)
RETURNS TABLE (
    days_logged BIGINT,
    avg_calories BIGINT,
    avg_protein BIGINT,
    avg_carbs BIGINT,
    avg_fat BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as days_logged,
        COALESCE(ROUND(AVG(total_calories)), 0)::BIGINT as avg_calories,
        COALESCE(ROUND(AVG(total_protein)), 0)::BIGINT as avg_protein,
        COALESCE(ROUND(AVG(total_carbs)), 0)::BIGINT as avg_carbs,
        COALESCE(ROUND(AVG(total_fat)), 0)::BIGINT as avg_fat
    FROM nutrition_diary
    WHERE user_id = p_user_id AND date >= p_start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get health metrics summary
-- This doesn't necessarily need a complex RPC if we just want all records,
-- but if we wanted to downsample (e.g., avg per week for yearly view) we could do it here.
-- For now we just use a small limit or raw select as it was since it's only 1 record a day max usually.
