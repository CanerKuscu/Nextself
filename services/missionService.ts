import { SupabaseService } from './supabase';
import { DeepSeekService } from './deepseek';
import { StreakService } from './streakService';
import { NotificationService } from './notificationService';
import { getLocalDateString } from '../utils/dateUtils';
import * as Notifications from 'expo-notifications';

export interface WeeklyMission {
    id: string;
    title: string;
    title_tr?: string;
    description?: string;
    description_tr?: string;
    category: string;
    target_value: number;
    current_progress: number;
    xp_reward: number;
    point_reward: number;
    is_completed: boolean;
    week_start: string;
    week_end: string;
    completed_at?: string;
}

export interface DailyMission {
    id: string;
    title: string;
    title_tr?: string;
    description?: string;
    description_tr?: string;
    category: string;
    target_value: number;
    current_progress: number;
    xp_reward: number;
    point_reward: number;
    is_completed: boolean;
    mission_date: string;
    completed_at?: string;
}

export class MissionService {
    private static instance: MissionService;

    private constructor() { }

    public static getInstance(): MissionService {
        if (!MissionService.instance) {
            MissionService.instance = new MissionService();
        }
        return MissionService.instance;
    }

    // Get current week's missions (generate if not exist)
    public async getWeeklyMissions(): Promise<WeeklyMission[]> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { weekStart, weekEnd } = this.getCurrentWeekDates();

            const { data: missions, error } = await supabase
                .from('weekly_missions')
                .select('*')
                .eq('user_id', user.id)
                .eq('week_start', weekStart)
                .eq('week_end', weekEnd)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!missions || missions.length === 0) {
                return await this.generateWeeklyMissions(user.id, weekStart, weekEnd);
            }

            return missions;
        } catch (err) {
            console.warn('Weekly missions fetch error:', err);
            return [];
        }
    }

    // Get today's missions (generate if not exist)
    public async getDailyMissions(): Promise<DailyMission[]> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const today = getLocalDateString();

            const { data: missions, error } = await supabase
                .from('daily_missions')
                .select('*')
                .eq('user_id', user.id)
                .eq('mission_date', today)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!missions || missions.length === 0) {
                return await this.generateDailyMissions(user.id, today);
            }

            return missions;
        } catch (err) {
            console.warn('Daily missions fetch error:', err);
            return [];
        }
    }

    // Generate weekly missions using AI — deeply personalized
    private async generateWeeklyMissions(userId: string, weekStart: string, weekEnd: string): Promise<WeeklyMission[]> {
        const supabase = SupabaseService.getInstance().getClient();

        // Gather rich user context for AI personalization
        let userLevel = 'intermediate';
        let userContext = '';
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, first_name, height, weight, gender, age, fitness_goal')
                .eq('id', userId)
                .single();

            const { data: leagueData } = await supabase
                .from('user_leagues')
                .select('current_tier, total_xp')
                .eq('user_id', userId)
                .single();

            // Recent workout count (last 7 days)
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const { count: recentWorkouts } = await supabase
                .from('workouts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', lastWeek.toISOString());

            // Recent water log
            const today = getLocalDateString();
            const { data: waterLog } = await supabase
                .from('water_logs')
                .select('amount_ml, goal_ml')
                .eq('user_id', userId)
                .eq('date', today)
                .single();

            if (leagueData) {
                if (leagueData.current_tier <= 3) userLevel = 'beginner';
                else if (leagueData.current_tier <= 6) userLevel = 'intermediate';
                else userLevel = 'advanced';
            }

            const parts: string[] = [];
            if (profile?.height) parts.push(`Height: ${profile.height}cm`);
            if (profile?.weight) parts.push(`Weight: ${profile.weight}kg`);
            if (profile?.gender) parts.push(`Gender: ${profile.gender}`);
            if (profile?.age) parts.push(`Age: ${profile.age}`);
            if (profile?.fitness_goal) parts.push(`Goal: ${profile.fitness_goal}`);
            if (leagueData?.total_xp) parts.push(`Total XP: ${leagueData.total_xp}`);
            if (recentWorkouts !== null) parts.push(`Workouts last 7 days: ${recentWorkouts}`);
            if (waterLog) parts.push(`Today's water: ${waterLog.amount_ml}/${waterLog.goal_ml}ml`);
            userContext = parts.join(', ');
        } catch { }

        // Try AI generation with rich personalization
        let missions: WeeklyMission[] = [];
        try {
            const deepseek = DeepSeekService.getInstance();
            const prompt = `You are a fitness gamification AI. Generate 5 unique, PERSONALIZED weekly missions for this user.

USER INFO: Level=${userLevel}. ${userContext || 'No extra data.'}
WEEK: ${weekStart} to ${weekEnd}

Rules:
- Missions must be VARIED across categories (workout, nutrition, health, social, streak, mindfulness, hydration)
- Difficulty should match user level (${userLevel})
- Each mission must be achievable within 7 days and trackable with a numeric target
- Make missions specific and fun, not generic (e.g. "Do 15 minutes of stretching 4 times" not just "Exercise")
- If user had few recent workouts, include motivational starter missions
- If user is advanced, include challenging progressive missions

Output MUST be ONLY a valid JSON array, no other text.
Format: [{"title":"English title","title_tr":"Turkish title","description":"Brief description in English","description_tr":"Brief description in Turkish","category":"workout|nutrition|health|social|streak|mindfulness|hydration","target_value":3,"xp_reward":100,"point_reward":50}]
XP rewards: 50-200. Point rewards: 25-100. Target values: 1-7.`;

            const response = await deepseek.generateContent(prompt, 'missions');

            // Parse AI response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    for (const m of parsed) {
                        const { data: inserted } = await supabase
                            .from('weekly_missions')
                            .insert({
                                user_id: userId,
                                title: m.title || 'Weekly Mission',
                                title_tr: m.title_tr || 'Haftalık Görev',
                                description: m.description,
                                description_tr: m.description_tr,
                                category: m.category || 'workout',
                                target_value: m.target_value || 1,
                                current_progress: 0,
                                xp_reward: m.xp_reward || 100,
                                point_reward: m.point_reward || 50,
                                is_completed: false,
                                week_start: weekStart,
                                week_end: weekEnd,
                            })
                            .select()
                            .single();
                        if (inserted) missions.push(inserted);
                    }
                }
            }
        } catch (err) {
            console.warn('AI weekly mission generation failed:', err);
        }

        // Fallback if AI didn't generate enough
        if (missions.length < 3) {
            missions = await this.generateFallbackWeeklyMissions(userId, weekStart, weekEnd);
        }

        return missions;
    }

    // Generate daily missions using AI with user context
    private async generateDailyMissions(userId: string, date: string): Promise<DailyMission[]> {
        const supabase = SupabaseService.getInstance().getClient();

        // Gather user context for daily personalization
        let userInfo = '';
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('height, weight, gender, fitness_goal')
                .eq('id', userId)
                .single();
            if (profile) {
                const parts: string[] = [];
                if (profile.weight) parts.push(`${profile.weight}kg`);
                if (profile.fitness_goal) parts.push(`Goal: ${profile.fitness_goal}`);
                if (profile.gender) parts.push(profile.gender);
                userInfo = parts.join(', ');
            }
        } catch { }

        let missions: DailyMission[] = [];
        try {
            const deepseek = DeepSeekService.getInstance();
            const dayName = new Date(date).toLocaleDateString('en', { weekday: 'long' });
            const prompt = `You are a fitness gamification AI. Generate 3 daily missions for today (${dayName}, ${date}).

USER: ${userInfo || 'Standard user'}.

Rules:
- One workout task, one nutrition task, one health/wellness task
- Each must be completable TODAY in a single action or measurable count
- Make them fun and specific (e.g. "Do 20 squats before lunch" not "Exercise")
- Vary from day to day; consider the day of the week (weekend = more time, weekday = quicker tasks)
- Categories can include: workout, nutrition, health, mindfulness, hydration

Output MUST be ONLY a valid JSON array, no other text.
Format: [{"title":"English title","title_tr":"Turkish title","category":"workout|nutrition|health|mindfulness|hydration","target_value":1,"xp_reward":30,"point_reward":15}]
XP rewards: 10-50. Point rewards: 5-25.`;

            const response = await deepseek.generateContent(prompt, 'missions');

            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    for (const m of parsed) {
                        const { data: inserted } = await supabase
                            .from('daily_missions')
                            .insert({
                                user_id: userId,
                                title: m.title || 'Daily Mission',
                                title_tr: m.title_tr || 'Günlük Görev',
                                description: m.description,
                                description_tr: m.description_tr,
                                category: m.category || 'workout',
                                target_value: m.target_value || 1,
                                current_progress: 0,
                                xp_reward: m.xp_reward || 20,
                                point_reward: m.point_reward || 10,
                                is_completed: false,
                                mission_date: date,
                            })
                            .select()
                            .single();
                        if (inserted) missions.push(inserted);
                    }
                }
            }
        } catch (err) {
            console.warn('AI daily mission generation failed:', err);
        }

        // Fallback
        if (missions.length < 3) {
            missions = await this.generateFallbackDailyMissions(userId, date);
        }

        return missions;
    }

    // Fallback weekly missions
    private async generateFallbackWeeklyMissions(userId: string, weekStart: string, weekEnd: string): Promise<WeeklyMission[]> {
        const supabase = SupabaseService.getInstance().getClient();
        const fallbackMissions = [
            { title: 'Complete 5 Workouts', title_tr: '5 Antrenman Tamamla', category: 'workout', target_value: 5, xp_reward: 150, point_reward: 75 },
            { title: 'Log 7 Meals', title_tr: '7 Öğün Kaydet', category: 'nutrition', target_value: 7, xp_reward: 100, point_reward: 50 },
            { title: 'Drink 2L Water Daily for 5 Days', title_tr: '5 Gün Boyunca Günde 2L Su İç', category: 'health', target_value: 5, xp_reward: 120, point_reward: 60 },
            { title: 'Maintain Your Streak for 7 Days', title_tr: '7 Gün Seri Sürdür', category: 'streak', target_value: 7, xp_reward: 200, point_reward: 100 },
            { title: 'Try 3 New Exercises', title_tr: '3 Yeni Egzersiz Dene', category: 'workout', target_value: 3, xp_reward: 100, point_reward: 50 },
        ];

        const missions: WeeklyMission[] = [];
        for (const m of fallbackMissions) {
            const { data: inserted } = await supabase
                .from('weekly_missions')
                .insert({
                    user_id: userId,
                    ...m,
                    current_progress: 0,
                    is_completed: false,
                    week_start: weekStart,
                    week_end: weekEnd,
                })
                .select()
                .single();
            if (inserted) missions.push(inserted);
        }
        return missions;
    }

    // Fallback daily missions
    private async generateFallbackDailyMissions(userId: string, date: string): Promise<DailyMission[]> {
        const supabase = SupabaseService.getInstance().getClient();
        const fallbackMissions = [
            { title: 'Complete a Workout', title_tr: 'Bir Antrenman Tamamla', category: 'workout', target_value: 1, xp_reward: 30, point_reward: 15 },
            { title: 'Log All 3 Meals', title_tr: '3 Öğünü Kaydet', category: 'nutrition', target_value: 3, xp_reward: 25, point_reward: 12 },
            { title: 'Drink 8 Glasses of Water', title_tr: '8 Bardak Su İç', category: 'health', target_value: 8, xp_reward: 20, point_reward: 10 },
        ];

        const missions: DailyMission[] = [];
        for (const m of fallbackMissions) {
            const { data: inserted } = await supabase
                .from('daily_missions')
                .insert({
                    user_id: userId,
                    ...m,
                    current_progress: 0,
                    is_completed: false,
                    mission_date: date,
                })
                .select()
                .single();
            if (inserted) missions.push(inserted);
        }
        return missions;
    }

    // Update mission progress
    public async updateMissionProgress(missionId: string, type: 'weekly' | 'daily', increment: number = 1): Promise<boolean> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const table = type === 'weekly' ? 'weekly_missions' : 'daily_missions';

            const { data: mission } = await supabase
                .from(table)
                .select('*')
                .eq('id', missionId)
                .single();

            if (!mission || mission.is_completed) return false;

            const newProgress = Math.min(mission.current_progress + increment, mission.target_value);
            const isCompleted = newProgress >= mission.target_value;

            await supabase
                .from(table)
                .update({
                    current_progress: newProgress,
                    is_completed: isCompleted,
                    completed_at: isCompleted ? new Date().toISOString() : null,
                })
                .eq('id', missionId);

            // Award XP and points if completed
            if (isCompleted) {
                const { LeagueService } = await import('./leagueService');
                await LeagueService.getInstance().addXP(mission.xp_reward, 'mission', `Mission completed: ${mission.title}`);

                // Send completion notification
                try {
                    const notifService = NotificationService.getInstance();
                    await notifService.requestPermissions();
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: '🎯 Mission Complete!',
                            body: `${mission.title} — +${mission.xp_reward} XP`,
                        },
                        trigger: null, // Immediate
                    });
                } catch { }

                // Also contribute to the user's daily streak
                try {
                    await StreakService.getInstance().logWorkout();
                } catch (streakErr) {
                    console.warn('Failed to update streak upon mission completion:', streakErr);
                }
            }

            return isCompleted;
        } catch (err) {
            console.warn('Mission progress error:', err);
            return false;
        }
    }

    // Complete a mission manually (claim reward)
    public async claimMissionReward(missionId: string, type: 'weekly' | 'daily'): Promise<{ xp: number; points: number }> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const table = type === 'weekly' ? 'weekly_missions' : 'daily_missions';

            const { data: mission } = await supabase
                .from(table)
                .select('*')
                .eq('id', missionId)
                .single();

            if (!mission || !mission.is_completed) return { xp: 0, points: 0 };

            // Mark as claimed (set progress to max to indicate claimed)
            await supabase
                .from(table)
                .update({ current_progress: mission.target_value })
                .eq('id', missionId);

            return { xp: mission.xp_reward, points: mission.point_reward };
        } catch (err) {
            console.warn('Claim reward error:', err);
            return { xp: 0, points: 0 };
        }
    }

    // Helper: get current week dates
    private getCurrentWeekDates(): { weekStart: string; weekEnd: string } {
        const now = new Date();
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            weekStart: getLocalDateString(monday),
            weekEnd: getLocalDateString(sunday),
        };
    }
}
