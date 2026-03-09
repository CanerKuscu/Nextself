import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export const auth = {
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        return { data, error };
    },

    resetPassword: async (email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { data, error };
    },
};

// Database operations
export const db = {
    // Users
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

        return { data, error, total: count };
    },

    getUserStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, created_at')
            .eq('assigned_professional_id', user.id); // Secure tenant isolation

        if (error) { return { data: null, error }; }

        const totalUsers = data.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = data.filter(u => new Date(u.created_at) >= today).length;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newThisWeek = data.filter(u => new Date(u.created_at) >= weekAgo).length;

        return {
            data: {
                total: totalUsers,
                newToday,
                newThisWeek,
                activeUsers: data.filter(u => {
                    const lastSeen = new Date(u.updated_at || u.created_at);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return lastSeen >= sevenDaysAgo;
                }).length,
            },
            error: null,
        };
    },

    // Workouts
    getWorkouts: async (page = 1, pageSize = 20, filters = {}) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated'), total: 0 }; }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('workout_sessions')
            .select(`
        *,
        user:profiles!inner(username, avatar_url, assigned_professional_id)
      `, { count: 'exact' })
            .eq('user.assigned_professional_id', user.id)
            .range(from, to)
            .order('start_time', { ascending: false });

        if (filters.startDate) {
            query = query.gte('start_time', filters.startDate);
        }

        if (filters.endDate) {
            query = query.lte('start_time', filters.endDate);
        }

        const { data, error, count } = await query;
        return { data, error, total: count };
    },

    getWorkoutStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('workout_sessions')
            .select('*, user:profiles!inner(assigned_professional_id)')
            .eq('user.assigned_professional_id', user.id); // Isolation filter

        if (error) { return { data: null, error }; }

        const totalWorkouts = data.length;
        const totalCalories = data.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0);
        const totalDuration = data.reduce((sum, workout) => sum + (workout.duration_minutes || 0), 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const workoutsToday = data.filter(workout => new Date(workout.start_time) >= today).length;

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

    // Nutrition
    getNutritionLogs: async (page = 1, pageSize = 20, filters = {}) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated'), total: 0 }; }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('nutrition_logs')
            .select(`
        *,
        user:profiles!inner(username, avatar_url, assigned_professional_id)
      `, { count: 'exact' })
            .eq('user.assigned_professional_id', user.id)
            .range(from, to)
            .order('date', { ascending: false });

        if (filters.date) {
            query = query.eq('date', filters.date);
        }

        const { data, error, count } = await query;
        return { data, error, total: count };
    },

    getNutritionStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*, user:profiles!inner(assigned_professional_id)')
            .eq('user.assigned_professional_id', user.id);

        if (error) { return { data: null, error }; }

        const totalLogs = data.length;
        const totalCalories = data.reduce((sum, log) => sum + (log.total_calories || 0), 0);
        const totalProtein = data.reduce((sum, log) => sum + (log.total_protein || 0), 0);
        const totalCarbs = data.reduce((sum, log) => sum + (log.total_carbs || 0), 0);
        const totalFat = data.reduce((sum, log) => sum + (log.total_fat || 0), 0);

        const today = new Date().toLocaleDateString('en-CA');
        const logsToday = data.filter(log => log.date === today).length;

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

    // Analytics
    getDailyStats: async (days = 30) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: workouts, error: workoutsError } = await supabase
            .from('workout_sessions')
            .select('start_time, calories_burned, duration_minutes, user:profiles!inner(assigned_professional_id)')
            .eq('user.assigned_professional_id', user.id)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString());

        const { data: nutrition, error: nutritionError } = await supabase
            .from('nutrition_logs')
            .select('date, total_calories, user:profiles!inner(assigned_professional_id)')
            .eq('user.assigned_professional_id', user.id)
            .gte('date', startDate.toLocaleDateString('en-CA'))
            .lte('date', endDate.toLocaleDateString('en-CA'));

        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('assigned_professional_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (workoutsError || nutritionError || usersError) {
            return { data: null, error: workoutsError || nutritionError || usersError };
        }

        // Group by day
        const dailyStats = {};

        workouts.forEach(workout => {
            const date = workout.start_time.split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    workouts: 0,
                    caloriesBurned: 0,
                    workoutDuration: 0,
                    nutritionCalories: 0,
                    newUsers: 0,
                };
            }
            dailyStats[date].workouts += 1;
            dailyStats[date].caloriesBurned += workout.calories_burned || 0;
            dailyStats[date].workoutDuration += workout.duration_minutes || 0;
        });

        nutrition.forEach(log => {
            const date = log.date;
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    workouts: 0,
                    caloriesBurned: 0,
                    workoutDuration: 0,
                    nutritionCalories: 0,
                    newUsers: 0,
                };
            }
            dailyStats[date].nutritionCalories += log.total_calories || 0;
        });

        users.forEach(user => {
            const date = user.created_at.split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    workouts: 0,
                    caloriesBurned: 0,
                    workoutDuration: 0,
                    nutritionCalories: 0,
                    newUsers: 0,
                };
            }
            dailyStats[date].newUsers += 1;
        });

        const result = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
        return { data: result, error: null };
    },

    // Health data
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

        const totalRecords = data.length;
        const avgSteps = totalRecords > 0
            ? Math.round(data.reduce((sum, record) => sum + (record.steps || 0), 0) / totalRecords)
            : 0;
        const avgHeartRate = totalRecords > 0
            ? Math.round(data.reduce((sum, record) => sum + (record.heart_rate || 0), 0) / totalRecords)
            : 0;
        const avgSleep = totalRecords > 0
            ? Math.round(data.reduce((sum, record) => sum + (record.sleep_hours || 0), 0) / totalRecords * 10) / 10
            : 0;

        return {
            data: {
                totalRecords,
                avgSteps,
                avgHeartRate,
                avgSleep,
            },
            error: null,
        };
    },
    // Recent Activities
    getRecentActivities: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        // Fetch recent workouts for clients of this professional
        const { data, error } = await supabase
            .from('workout_sessions')
            .select(`
                id,
                start_time,
                duration_minutes,
                status,
                user:profiles!inner(username, assigned_professional_id)
            `)
            .eq('user.assigned_professional_id', user.id)
            .order('start_time', { ascending: false })
            .limit(5);

        if (error) { return { data: null, error }; }

        const activities = data.map(workout => {
            const date = new Date(workout.start_time);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.round(diffMs / 60000);
            const diffHours = Math.round(diffMins / 60);

            let timeStr = 'Just now';
            if (diffMins > 0 && diffMins < 60) { timeStr = `${diffMins} min ago`; }
            else if (diffHours >= 1 && diffHours < 24) { timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`; }
            else if (diffHours >= 24) {
                const diffDays = Math.floor(diffHours / 24);
                timeStr = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            }

            // derive status from duration/flags if status field isn't standard
            const statusStr = workout.status || (workout.duration_minutes > 0 ? 'success' : 'warning');

            return {
                user: workout.user?.username || 'Unknown',
                activity: workout.duration_minutes > 0 ? `Completed workout (${workout.duration_minutes}m)` : 'Started workout',
                time: timeStr,
                status: statusStr
            };
        });

        return { data: activities, error: null };
    },

    // Top Clients (real data for Dashboard leaderboard)
    getTopClients: async (limit = 5) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        // Get clients assigned to this professional
        const { data: clients, error: clientErr } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name, avatar_url')
            .eq('assigned_professional_id', user.id);

        if (clientErr || !clients) { return { data: [], error: clientErr }; }

        // For each client, count workouts in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: workouts } = await supabase
            .from('workout_sessions')
            .select('user_id, start_time')
            .in('user_id', clients.map(c => c.id))
            .gte('start_time', thirtyDaysAgo.toISOString());

        // Count workouts + calculate streaks per client
        const clientMap = {};
        clients.forEach(c => {
            clientMap[c.id] = {
                name: c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : (c.username || 'User'),
                avatar_url: c.avatar_url,
                workouts: 0,
                streak: 0,
                progress: 0,
                dates: new Set(),
            };
        });

        (workouts || []).forEach(w => {
            if (clientMap[w.user_id]) {
                clientMap[w.user_id].workouts += 1;
                clientMap[w.user_id].dates.add(w.start_time.split('T')[0]);
            }
        });

        // Calculate streak (consecutive days from today backward)
        Object.values(clientMap).forEach(c => {
            const sortedDates = Array.from(c.dates).sort().reverse();
            let streak = 0;
            const today = new Date();
            for (let i = 0; i < 60; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = checkDate.toLocaleDateString('en-CA');
                if (sortedDates.includes(dateStr)) { streak++; }
                else if (i > 0) { break; }
            }
            c.streak = streak;
            c.progress = Math.min(100, Math.round((c.workouts / 20) * 100)); // Progress out of 20 workouts goal
            delete c.dates;
        });

        const sorted = Object.values(clientMap)
            .sort((a, b) => b.workouts - a.workouts)
            .slice(0, limit);

        return { data: sorted, error: null };
    },

    // Client health overview (for Users page detail)
    getClientHealthOverview: async (clientId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        // Ensure client belongs to this professional
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('id, weight, height, first_name, last_name')
            .eq('id', clientId)
            .eq('assigned_professional_id', user.id)
            .single();

        if (profileErr || !profile) { return { data: null, error: profileErr || new Error('Client not found') }; }

        // Fetch latest health data
        const { data: healthData } = await supabase
            .from('health_data')
            .select('steps, heart_rate, sleep_hours, calories_burned, date')
            .eq('user_id', clientId)
            .order('date', { ascending: false })
            .limit(7);

        // Fetch workout count
        const { count: workoutCount } = await supabase
            .from('workout_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', clientId);

        // Fetch nutrition avg
        const { data: nutritionData } = await supabase
            .from('nutrition_logs')
            .select('total_calories, total_protein')
            .eq('user_id', clientId)
            .order('date', { ascending: false })
            .limit(7);

        const avgCalories = nutritionData && nutritionData.length > 0
            ? Math.round(nutritionData.reduce((s, n) => s + (n.total_calories || 0), 0) / nutritionData.length)
            : 0;
        const avgProtein = nutritionData && nutritionData.length > 0
            ? Math.round(nutritionData.reduce((s, n) => s + (n.total_protein || 0), 0) / nutritionData.length)
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

    createCourse: async (courseData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('professional_courses')
            .insert({ ...courseData, professional_id: user.id })
            .select()
            .single();

        return { data, error };
    },

    updateCourse: async (courseId, updates) => {
        const { data, error } = await supabase
            .from('professional_courses')
            .update(updates)
            .eq('id', courseId)
            .select()
            .single();

        return { data, error };
    },

    deleteCourse: async (courseId) => {
        const { error } = await supabase
            .from('professional_courses')
            .delete()
            .eq('id', courseId);

        return { error };
    },

    // Calendar Sessions
    getSessions: async (startDate, endDate) => {
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

    createSession: async (sessionData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('sessions')
            .insert({ ...sessionData, professional_id: user.id })
            .select()
            .single();

        return { data, error };
    },

    deleteSession: async (sessionId) => {
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

    saveSettings: async (settings) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('professional_settings')
            .upsert({ ...settings, user_id: user.id }, { onConflict: 'user_id' })
            .select()
            .single();

        return { data, error };
    },

    // User management
    updateUser: async (userId, updates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return { data: null, error: new Error('Not authenticated') }; }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .eq('assigned_professional_id', user.id)
            .select()
            .single();

        return { data, error };
    },

    deleteUser: async (userId) => {
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

export default supabase;