import { SupabaseService } from '@nextself/shared';
import { getLocalDateString, getYesterdayDateString } from '../utils/dateUtils';
import { LogManager } from '../utils/LogManager';

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
    lastRestDate: string | null;
    isRestDay: boolean;
}

interface UserStreakRow {
    current_streak?: number;
    longest_streak?: number;
    last_workout_date?: string | null;
    last_rest_date?: string | null;
    last_activity_date?: string | null;
}

export class StreakService {
    private static instance: StreakService;

    private constructor() { }

    public static getInstance(): StreakService {
        if (!StreakService.instance) {
            StreakService.instance = new StreakService();
        }
        return StreakService.instance;
    }

    // Get current streak status
    public async getStreak(): Promise<StreakData> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            // Calculate streak from workout_sessions table (users table doesn't have streak columns)
            const today = getLocalDateString();
            const { data: workouts, error } = await supabase
                .from('workout_sessions')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(60);

            if (error) throw error;

            const { data: streakRow } = await supabase
                .from('user_streaks')
                .select('current_streak, longest_streak, last_workout_date, last_rest_date, last_activity_date')
                .eq('user_id', user.id)
                .maybeSingle();

            let currentStreak = 0;
            let longestStreak = streakRow?.longest_streak || 0;
            let lastWorkoutDate: string | null = streakRow?.last_workout_date || null;
            const lastRestDate = streakRow?.last_rest_date || null;

            if (workouts && workouts.length > 0) {
                lastWorkoutDate = lastWorkoutDate || workouts[0].created_at;
                // Count consecutive days from today
                const workoutDays = new Set(workouts.map(w => getLocalDateString(new Date(w.created_at))));
                let checkDate = new Date();
                // If today is not a workout day and not a rest day, start from yesterday
                const todayStr = getLocalDateString(checkDate);
                if (!workoutDays.has(todayStr) && lastRestDate !== todayStr) {
                    checkDate.setDate(checkDate.getDate() - 1);
                }
                while (workoutDays.has(getLocalDateString(checkDate)) || getLocalDateString(checkDate) === lastRestDate) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }

                // Check streak freeze: if yesterday was missed but user has a streak freeze item
                if (currentStreak === 0 && workoutDays.size > 0) {
                    try {
                        const { StoreService } = await import('./storeService');
                        const hasFreeze = await StoreService.getInstance().useStreakFreeze();
                        if (hasFreeze) {
                            // Recalculate from 2 days ago
                            checkDate = new Date();
                            checkDate.setDate(checkDate.getDate() - 2);
                            currentStreak = 1; // freeze counts as 1 day saved
                            while (workoutDays.has(getLocalDateString(checkDate))) {
                                currentStreak++;
                                checkDate.setDate(checkDate.getDate() - 1);
                            }
                        }
                    } catch { }
                }

                currentStreak = Math.max(currentStreak, streakRow?.current_streak || 0);
                longestStreak = Math.max(currentStreak, longestStreak);
            }

            return {
                currentStreak,
                longestStreak,
                lastWorkoutDate,
                lastRestDate,
                isRestDay: lastRestDate === today,
            };
        } catch (err) {
            LogManager.getInstance().warn('Streak fetch warning:', err);
            return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null, lastRestDate: null, isRestDay: false };
        }
    }

    // Log a completed workout
    public async logWorkout(): Promise<StreakData> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const currentData = await this.getStreak();
            const today = getLocalDateString();

            // If already logged today, do nothing
            // Compare date-only portion since lastWorkoutDate may be a full ISO timestamp
            const lastWorkoutDay = currentData.lastWorkoutDate
                ? getLocalDateString(new Date(currentData.lastWorkoutDate))
                : null;
            if (lastWorkoutDay === today) return currentData;

            let newStreak = currentData.currentStreak;

            // If yesterday was a workout OR yesterday was a rest day, increment streak
            if (this.isYesterday(currentData.lastWorkoutDate) || this.isYesterday(currentData.lastRestDate)) {
                newStreak += 1;
            } else if (!this.isToday(currentData.lastWorkoutDate)) {
                // Streak broken
                newStreak = 1;
            }

            const newLongest = Math.max(newStreak, currentData.longestStreak);

            const updateData = {
                user_id: user.id,
                current_streak: newStreak,
                longest_streak: newLongest,
                last_workout_date: today,
                last_activity_date: today,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_streaks')
                .upsert(updateData, { onConflict: 'user_id' });

            if (error) throw error;

            // Update friendship streaks asynchronously in the background
            this.updateFriendshipStreaks(user.id, today).catch(e => LogManager.getInstance().error('Friendship streak error:', e));

            return {
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastWorkoutDate: today,
                lastRestDate: currentData.lastRestDate,
                isRestDay: false,
            };

        } catch (err) {
            LogManager.getInstance().error('Error logging workout:', err);
            throw err;
        }
    }

    // Mark today as a planned rest day (keeps streak alive)
    public async setRestDay(): Promise<StreakData> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const today = getLocalDateString();
            const currentData = await this.getStreak();

            // If already a rest day, do nothing
            if (currentData.lastRestDate === today) return currentData;

            const { error } = await supabase
                .from('user_streaks')
                .upsert({
                    user_id: user.id,
                    last_rest_date: today,
                    last_activity_date: today,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;

            // Also check for mutual friendship streak updates on rest days
            this.updateFriendshipStreaks(user.id, today).catch(e => LogManager.getInstance().error('Friendship streak error:', e));

            return {
                ...currentData,
                lastRestDate: today,
                isRestDay: true,
            };

        } catch (err) {
            LogManager.getInstance().error('Error setting rest day:', err);
            throw err;
        }
    }

    // Update friendship streaks if both friends completed their goals
    private async updateFriendshipStreaks(userId: string, today: string): Promise<void> {
        try {
            const supabase = SupabaseService.getInstance().getClient();

            // 1. Get all accepted friendships for this user
            const { data: friendships, error: fetchError } = await supabase
                .from('friendships')
                .select('*')
                .eq('status', 'accepted')
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

            if (fetchError || !friendships) return;

            for (const friendship of friendships) {
                // If this friendship was already updated today, skip
                if (friendship.last_streak_date === today) continue;

                const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;

                // 2. Get friend's streak status
                const { data: friendData } = await supabase
                    .from('user_streaks')
                    .select('last_workout_date, last_rest_date')
                    .eq('user_id', friendId)
                    .maybeSingle();

                if (!friendData) continue;

                // 3. Check if friend has met the daily requirement today
                const friendMetGoal = friendData.last_workout_date === today || friendData.last_rest_date === today;

                // If friend also met goal today, we can increment the friendship streak
                if (friendMetGoal) {
                    let newStreak = friendship.current_streak || 0;
                    const lastStreak = friendship.last_streak_date;

                    if (this.isYesterday(lastStreak)) {
                        newStreak += 1;
                    } else if (!this.isToday(lastStreak)) {
                        newStreak = 1;
                    }

                    const newLongest = Math.max(newStreak, friendship.longest_streak || 0);

                    // 4. Update the friendship
                    await supabase
                        .from('friendships')
                        .update({
                            current_streak: newStreak,
                            longest_streak: newLongest,
                            last_streak_date: today,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', friendship.id);
                }
            }
        } catch (err) {
            LogManager.getInstance().error('Error updating friendship streaks:', err);
        }
    }

    // Helpers
    private isToday(dateString: string | null): boolean {
        if (!dateString) return false;
        const today = getLocalDateString();
        const dateDay = getLocalDateString(new Date(dateString));
        return dateDay === today;
    }

    private isYesterday(dateString: string | null): boolean {
        if (!dateString) return false;
        const dateDay = getLocalDateString(new Date(dateString));
        return dateDay === getYesterdayDateString();
    }
}
