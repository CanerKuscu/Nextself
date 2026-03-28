import { supabase } from './client';
import type { DailyStats } from '../../types/database';

export const AnalyticsService = {
    getDailyStats: async (days = 30) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [workoutsRes, nutritionRes, usersRes] = await Promise.all([
            supabase.from('workout_sessions')
                .select('start_time, calories_burned, duration_minutes, user:profiles!inner(assigned_professional_id)')
                .eq('user.assigned_professional_id', user.id)
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString()),
            supabase.from('nutrition_logs')
                .select('date, total_calories, user:profiles!inner(assigned_professional_id)')
                .eq('user.assigned_professional_id', user.id)
                .gte('date', startDate.toLocaleDateString('en-CA'))
                .lte('date', endDate.toLocaleDateString('en-CA')),
            supabase.from('profiles')
                .select('created_at')
                .eq('assigned_professional_id', user.id)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
        ]);

        if (workoutsRes.error || nutritionRes.error || usersRes.error) {
            return { data: null, error: workoutsRes.error || nutritionRes.error || usersRes.error };
        }

        const dailyStats: Record<string, DailyStats> = {};

        const getOrCreateDay = (dateStr: string) => {
            if (!dailyStats[dateStr]) {
                dailyStats[dateStr] = { date: dateStr, workouts: 0, caloriesBurned: 0, workoutDuration: 0, nutritionCalories: 0, newUsers: 0 };
            }
            return dailyStats[dateStr];
        };

        (workoutsRes.data || []).forEach(w => {
            const d = getOrCreateDay(w.start_time.split('T')[0]);
            d.workouts += 1;
            d.caloriesBurned += w.calories_burned || 0;
            d.workoutDuration += w.duration_minutes || 0;
        });

        (nutritionRes.data || []).forEach(n => {
            const d = getOrCreateDay(n.date);
            d.nutritionCalories += n.total_calories || 0;
        });

        (usersRes.data || []).forEach(u => {
            const d = getOrCreateDay(u.created_at.split('T')[0]);
            d.newUsers += 1;
        });

        const result = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
        return { data: result, error: null };
    },

    getHealthStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('health_data')
            .select('*, user:profiles!inner(assigned_professional_id)')
            .eq('user.assigned_professional_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(1000);

        if (error) { return { data: null, error }; }

        const totalRecords = (data || []).length;
        const avgSteps = totalRecords > 0 ? Math.round((data || []).reduce((sum, r) => sum + (r.steps || 0), 0) / totalRecords) : 0;
        const avgHeartRate = totalRecords > 0 ? Math.round((data || []).reduce((sum, r) => sum + (r.heart_rate || 0), 0) / totalRecords) : 0;
        const avgSleep = totalRecords > 0 ? Math.round((data || []).reduce((sum, r) => sum + (r.sleep_hours || 0), 0) / totalRecords * 10) / 10 : 0;

        return { data: { totalRecords, avgSteps, avgHeartRate, avgSleep }, error: null };
    },
};
