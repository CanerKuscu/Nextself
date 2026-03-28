import { supabase } from './client';
import type { Profile } from '../../types/database';

export const UserService = {
    getUsers: async (page = 1, pageSize = 20) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated'), total: 0 }; }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('assigned_professional_id', user.id)
            .range(from, to)
            .order('created_at', { ascending: false });

        return { data: data as Profile[], error, total: count || 0 };
    },

    getUserStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { count: totalUsers, error: totalError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_professional_id', user.id);

        if (totalError) { return { data: null, error: totalError }; }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: newToday, error: todayError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_professional_id', user.id)
            .gte('created_at', today.toISOString());

        if (todayError) { return { data: null, error: todayError }; }

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: newThisWeek, error: weekError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_professional_id', user.id)
            .gte('created_at', weekAgo.toISOString());

        if (weekError) { return { data: null, error: weekError }; }

        const { count: activeUsers, error: activeError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_professional_id', user.id)
            .or(`updated_at.gte.${weekAgo.toISOString()},created_at.gte.${weekAgo.toISOString()}`);

        if (activeError) { return { data: null, error: activeError }; }

        return {
            data: {
                total: totalUsers || 0,
                newToday: newToday || 0,
                newThisWeek: newThisWeek || 0,
                activeUsers: activeUsers || 0,
            },
            error: null,
        };
    },

    updateUser: async (userId: string, updates: Partial<Profile>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .eq('assigned_professional_id', user.id)
            .select()
            .single();

        return { data: data as Profile, error };
    },

    deleteUser: async (userId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)
            .eq('assigned_professional_id', user.id);

        return { error };
    },

    deleteOwnAccount: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { error: new Error('Not authenticated') }; }

        const { error } = await supabase.rpc('delete_own_account');
        return { error };
    },
};
