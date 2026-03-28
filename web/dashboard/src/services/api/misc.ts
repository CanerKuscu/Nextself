import { supabase } from './client';

export const MiscService = {
    getRecentActivities: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('workout_sessions')
            .select(`id, start_time, duration_minutes, status, user:profiles!inner(username, assigned_professional_id)`)
            .eq('user.assigned_professional_id', user.id)
            .order('start_time', { ascending: false })
            .limit(5);

        if (error) { return { data: null, error }; }

        const activities = (data || []).map(w => {
            const date = new Date(w.start_time);
            const diffMins = Math.round((Date.now() - date.getTime()) / 60000);
            const diffHours = Math.round(diffMins / 60);

            let timeStr = 'Just now';
            if (diffMins > 0 && diffMins < 60) timeStr = `${diffMins} min ago`;
            else if (diffHours >= 1 && diffHours < 24) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            else if (diffHours >= 24) {
                const diffDays = Math.floor(diffHours / 24);
                timeStr = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            }

            const workoutUser = Array.isArray(w.user) ? w.user[0] : w.user;
            return {
                user: workoutUser?.username || 'Unknown',
                activity: w.duration_minutes > 0 ? `Completed workout (${w.duration_minutes}m)` : 'Started workout',
                time: timeStr,
                status: w.status || (w.duration_minutes > 0 ? 'success' : 'warning')
            };
        });

        return { data: activities, error: null };
    },

    getTopClients: async (limit = 5) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data: clients, error: clientErr } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name, avatar_url')
            .eq('assigned_professional_id', user.id);

        if (clientErr || !clients) { return { data: [], error: clientErr }; }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: workouts } = await supabase
            .from('workout_sessions')
            .select('user_id, start_time')
            .in('user_id', clients.map(c => c.id))
            .gte('start_time', thirtyDaysAgo.toISOString());

        const clientMap: Record<string, any> = {};
        clients.forEach(c => {
            clientMap[c.id] = {
                name: c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : (c.username || 'User'),
                avatar_url: c.avatar_url,
                workouts: 0,
                streak: 0,
                progress: 0,
                dates: new Set<string>(),
            };
        });

        (workouts || []).forEach(w => {
            if (clientMap[w.user_id]) {
                clientMap[w.user_id].workouts += 1;
                clientMap[w.user_id].dates.add(w.start_time.split('T')[0]);
            }
        });

        Object.values(clientMap).forEach(c => {
            const sortedDates = Array.from(c.dates).sort().reverse();
            let streak = 0;
            const today = new Date();
            for (let i = 0; i < 60; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = checkDate.toLocaleDateString('en-CA');
                if ((sortedDates as string[]).includes(dateStr)) { streak++; }
                else if (i > 0) { break; }
            }
            c.streak = streak;
            c.progress = Math.min(100, Math.round((c.workouts / 20) * 100));
            delete c.dates;
        });

        const sorted = Object.values(clientMap).sort((a: any, b: any) => b.workouts - a.workouts).slice(0, limit);
        return { data: sorted, error: null };
    },
    
    // Client health overview (for Users page detail)
    getClientHealthOverview: async (clientId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('id, weight, height, first_name, last_name')
            .eq('id', clientId)
            .eq('assigned_professional_id', user.id)
            .single();

        if (profileErr || !profile) { return { data: null, error: profileErr || new Error('Client not found') }; }

        const { data: healthData } = await supabase
            .from('health_data')
            .select('steps, heart_rate, sleep_hours, calories_burned, date')
            .eq('user_id', clientId)
            .order('date', { ascending: false })
            .limit(7);

        const { count: workoutCount } = await supabase
            .from('workout_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', clientId);

        const { data: nutritionData } = await supabase
            .from('nutrition_logs')
            .select('total_calories, total_protein')
            .eq('user_id', clientId)
            .order('date', { ascending: false })
            .limit(7);

        const avgCalories = nutritionData && nutritionData.length > 0
            ? Math.round((nutritionData.reduce((s, n) => s + (n.total_calories || 0), 0)) / nutritionData.length)
            : 0;
        const avgProtein = nutritionData && nutritionData.length > 0
            ? Math.round((nutritionData.reduce((s, n) => s + (n.total_protein || 0), 0)) / nutritionData.length)
            : 0;

        return {
            data: {
                profile,
                recentHealth: healthData || [],
                workoutCount: workoutCount || 0,
                avgCalories,
                avgProtein,
            },
            error: null,
        };
    },

    // Courses
    getCourses: async (page = 1, pageSize = 20) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated'), total: 0 }; }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('professional_courses')
            .select('*', { count: 'exact' })
            .eq('professional_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);

        return { data: data || [], error, total: count || 0 };
    },

    createCourse: async (courseData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('professional_courses')
            .insert({ ...courseData, professional_id: user.id })
            .select()
            .single();

        return { data, error };
    },

    updateCourse: async (courseId: string, updates: any) => {
        const { data, error } = await supabase
            .from('professional_courses')
            .update(updates)
            .eq('id', courseId)
            .select()
            .single();

        return { data, error };
    },

    deleteCourse: async (courseId: string) => {
        const { error } = await supabase
            .from('professional_courses')
            .delete()
            .eq('id', courseId);

        return { error };
    },

    // Calendar Sessions
    getSessions: async (startDate?: string, endDate?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        let query = supabase
            .from('sessions')
            .select(`
                *,
                client:profiles!sessions_client_id_fkey(username, avatar_url)
            `)
            .eq('professional_id', user.id)
            .order('start_time', { ascending: true });

        if (startDate) { query = query.gte('start_time', startDate); }
        if (endDate) { query = query.lte('start_time', endDate); }

        const { data, error } = await query;
        return { data: data || [], error };
    },

    createSession: async (sessionData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('sessions')
            .insert({ ...sessionData, professional_id: user.id })
            .select()
            .single();

        return { data, error };
    },

    deleteSession: async (sessionId: string) => {
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId);

        return { error };
    },

    // Settings
    getSettings: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('professional_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // If no settings exist, return defaults
        if (error && error.code === 'PGRST116') {
            return { data: null, error: null };
        }
        return { data, error };
    },

    saveSettings: async (settings: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('professional_settings')
            .upsert({ ...settings, user_id: user.id }, { onConflict: 'user_id' })
            .select()
            .single();

        return { data, error };
    }
};
