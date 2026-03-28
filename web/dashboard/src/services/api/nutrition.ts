import { supabase } from './client';
import type { NutritionLog } from '../../types/database';

export const NutritionService = {
    getNutritionLogs: async (page = 1, pageSize = 20, filters: any = {}) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated'), total: 0 }; }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('nutrition_logs')
            .select(`*, user:profiles!inner(username, avatar_url, assigned_professional_id)`, { count: 'exact' })
            .eq('user.assigned_professional_id', user.id)
            .range(from, to)
            .order('date', { ascending: false });

        if (filters.date) { query = query.eq('date', filters.date); }

        const { data, error, count } = await query;
        return { data: data as NutritionLog[], error, total: count || 0 };
    },

    getNutritionStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*, user:profiles!inner(assigned_professional_id)')
            .eq('user.assigned_professional_id', user.id);

        if (error) { return { data: null, error }; }

        const totalLogs = (data || []).length;
        const totalCalories = (data || []).reduce((sum, log) => sum + (log.total_calories || 0), 0);
        const totalProtein = (data || []).reduce((sum, log) => sum + (log.total_protein || 0), 0);
        const totalCarbs = (data || []).reduce((sum, log) => sum + (log.total_carbs || 0), 0);
        const totalFat = (data || []).reduce((sum, log) => sum + (log.total_fat || 0), 0);

        const today = new Date().toLocaleDateString('en-CA');
        const logsToday = (data || []).filter(log => log.date === today).length;

        return {
            data: {
                total: totalLogs,
                totalCalories,
                totalProtein,
                totalCarbs,
                totalFat,
                logsToday,
                avgCalories: totalLogs > 0 ? Math.round(totalCalories / totalLogs) : 0,
            },
            error: null,
        };
    },
};
