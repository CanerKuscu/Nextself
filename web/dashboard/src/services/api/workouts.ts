import { supabase } from './client';
import type { WorkoutSession, DailyStats } from '../../types/database';

export const WorkoutService = {
    getWorkouts: async (page = 1, pageSize = 20, filters: any = {}) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated'), total: 0 }; }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('workout_sessions')
            .select(`*, user:profiles!inner(username, avatar_url, assigned_professional_id)`, { count: 'exact' })
            .eq('user.assigned_professional_id', user.id)
            .range(from, to)
            .order('start_time', { ascending: false });

        if (filters.startDate) { query = query.gte('start_time', filters.startDate); }
        if (filters.endDate) { query = query.lte('start_time', filters.endDate); }

        const { data, error, count } = await query;
        return { data: data as WorkoutSession[], error, total: count || 0 };
    },

    getWorkoutStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('workout_sessions')
            .select('*, user:profiles!inner(assigned_professional_id)')
            .eq('user.assigned_professional_id', user.id);

        if (error) { return { data: null, error }; }

        const totalWorkouts = (data || []).length;
        const totalCalories = (data || []).reduce((sum, workout) => sum + (workout.calories_burned || 0), 0);
        const totalDuration = (data || []).reduce((sum, workout) => sum + (workout.duration_minutes || 0), 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const workoutsToday = (data || []).filter(workout => new Date(workout.start_time) >= today).length;

        return {
            data: {
                total: totalWorkouts,
                totalCalories,
                totalDuration,
                workoutsToday,
                avgDuration: totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0,
                avgCalories: totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0,
            },
            error: null,
        };
    },
};
