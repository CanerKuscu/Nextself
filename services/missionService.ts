import { SupabaseService } from '@nextself/shared';
import { DeepSeekService } from './deepseek';
import { StreakService } from './streakService';
import { NotificationService } from './notificationService';
import { getLocalDateString } from '../utils/dateUtils';
import PlatformStorage from '@nextself/shared';
import { LogManager } from '../utils/LogManager';
import * as Notifications from 'expo-notifications';

export interface WeeklyMission {
    id: string;
    title: string;
    titleTr?: string;
    description?: string;
    descriptionTr?: string;
    category: string;
    targetValue: number;
    currentProgress: number;
    xpReward: number;
    pointReward: number;
    isCompleted: boolean;
    weekStart: string;
    weekEnd: string;
    completedAt?: string;
}

export interface DailyMission {
    id: string;
    title: string;
    titleTr?: string;
    description?: string;
    descriptionTr?: string;
    category: string;
    targetValue: number;
    currentProgress: number;
    xpReward: number;
    pointReward: number;
    isCompleted: boolean;
    missionDate: string;
    completedAt?: string;
}

export class MissionService {
    private static instance: MissionService;
    private static readonly WEEKLY_MISSIONS_GENERATED_KEY = 'NextSelf_weekly_missions_generated';
    private static isGenerating = false;

    private constructor() { }

    public static getInstance(): MissionService {
        if (!MissionService.instance) {
            MissionService.instance = new MissionService();
        }
        return MissionService.instance;
    }

    // Helper to map DB snake_case to CamelCase
    private mapWeeklyMission(m: any): WeeklyMission {
        return {
            id: m.id,
            title: m.title,
            titleTr: m.title_tr,
            description: m.description,
            descriptionTr: m.description_tr,
            category: m.category,
            targetValue: m.target_value,
            currentProgress: m.current_progress,
            xpReward: m.xp_reward,
            pointReward: m.points_reward,
            isCompleted: m.is_completed,
            weekStart: m.week_start,
            weekEnd: m.week_end,
            completedAt: m.completed_at
        };
    }

    private mapDailyMission(m: any): DailyMission {
        return {
            id: m.id,
            title: m.title,
            titleTr: m.title_tr,
            description: m.description,
            descriptionTr: m.description_tr,
            category: m.category,
            targetValue: m.target_value,
            currentProgress: m.current_progress,
            xpReward: m.xp_reward,
            pointReward: m.point_reward,
            isCompleted: m.is_completed,
            missionDate: m.mission_date,
            completedAt: m.completed_at
        };
    }

    // Helper to normalize category to match Enum
    private normalizeCategory(category: string): string {
        const VALID_CATEGORIES = [
            'workout', 'nutrition', 'wellness', 'social', 
            'health', 'hydration', 'mindfulness', 'sleep', 
            'steps', 'streak', 'supplements'
        ];
        
        const lower = category?.toLowerCase() || 'workout';
        if (VALID_CATEGORIES.includes(lower)) return lower;
        
        // Fallback mappings
        if (lower.includes('water')) return 'hydration';
        if (lower.includes('food') || lower.includes('diet')) return 'nutrition';
        if (lower.includes('run') || lower.includes('walk') || lower.includes('gym')) return 'workout';
        if (lower.includes('meditat')) return 'mindfulness';
        if (lower.includes('friend')) return 'social';
        
        return 'workout'; // Default fallback
    }

    // Get current week's missions (generate if not exist and if it's week start or new week)
    public async getWeeklyMissions(): Promise<WeeklyMission[]> {
        // Prevent concurrent generation calls
        if (MissionService.isGenerating) {
            LogManager.getInstance().info('Weekly missions generation already in progress, waiting...');
            // Simple exponential backoff or just return empty for now to avoid blocking UI
            // Better UX: return empty and let the ongoing process finish, UI can retry or show loader
            return [];
        }

        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                LogManager.getInstance().warn('getWeeklyMissions: No user logged in');
                return [];
            }

            const { weekStart, weekEnd } = this.getCurrentWeekDates();
            LogManager.getInstance().info(`Fetching weekly missions for ${weekStart} - ${weekEnd}`);

            const { data: missions, error } = await supabase
                .from('weekly_missions')
                .select('id, title, title_tr, description, description_tr, category, target_value, current_progress, xp_reward, points_reward, is_completed, week_start, week_end, completed_at')
                .eq('user_id', user.id)
                .eq('week_start', weekStart)
                .eq('week_end', weekEnd)
                .order('created_at', { ascending: true });

            if (error) {
                LogManager.getInstance().error('Error fetching weekly missions:', error);
                throw error;
            }

            // If missions exist for this week, return them
            if (missions && missions.length > 0) {
                LogManager.getInstance().info(`Found ${missions.length} existing weekly missions`);
                return missions.map(this.mapWeeklyMission);
            }

            // Check if we should generate new missions (only on week start/Monday or new week)
            const shouldGenerate = await this.shouldGenerateWeeklyMissions(weekStart);
            LogManager.getInstance().info(`Should generate new weekly missions? ${shouldGenerate}`);

            // If storage indicates we've already generated but the DB returned no missions,
            // attempt a one-time regeneration to recover from a previous failed write.
            if (!shouldGenerate) {
                LogManager.getInstance().info('Weekly missions: Stored as generated for this week but DB has none — attempting regeneration (forcing)');
            }

            // Set generation lock
            MissionService.isGenerating = true;

            // Generate missions (attempt even if shouldGenerate is false when DB empty)
            LogManager.getInstance().info('Starting weekly mission generation...');
            const generatedMissions = await this.generateWeeklyMissions(user.id, weekStart, weekEnd);
            LogManager.getInstance().info(`Generated ${generatedMissions.length} weekly missions`);

            // If generation produced results, record generation and return them
            if (generatedMissions && generatedMissions.length > 0) {
                await this.recordWeeklyMissionsGenerated(weekStart);
                return generatedMissions;
            }

            return generatedMissions;
        } catch (err) {
            LogManager.getInstance().error('Weekly missions fetch error:', err);
            return [];
        } finally {
            // Always release lock
            MissionService.isGenerating = false;
        }
    }

    // Check if we should generate weekly missions (only once per week on Monday/week start)
    private async shouldGenerateWeeklyMissions(weekStart: string): Promise<boolean> {
        try {
            const storedWeek = await PlatformStorage.getItem(MissionService.WEEKLY_MISSIONS_GENERATED_KEY);

            // If no record exists, allow generation (first time user)
            if (!storedWeek) {
                return true;
            }

            const stored = JSON.parse(storedWeek);
            const currentWeekStart = weekStart;

            // Only generate if this is a new week (different week_start)
            if (stored.weekStart !== currentWeekStart) {
                return true;
            }

            // Same week - already generated this week
            return false;
        } catch (err) {
            LogManager.getInstance().warn('Should generate check error:', err);
            // On error, allow generation to ensure user gets missions
            return true;
        }
    }

    // Record that we generated missions for this week
    private async recordWeeklyMissionsGenerated(weekStart: string): Promise<void> {
        try {
            const record = {
                weekStart: weekStart,
                generatedAt: new Date().toISOString()
            };
            await PlatformStorage.setItem(
                MissionService.WEEKLY_MISSIONS_GENERATED_KEY,
                JSON.stringify(record)
            );
        } catch (err) {
            LogManager.getInstance().warn('Record missions generation error:', err);
        }
    }

    // Get today's missions (generate if not exist)
    public async getDailyMissions(): Promise<DailyMission[]> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const today = getLocalDateString();
            LogManager.getInstance().info(`Fetching daily missions for ${today}`);

            const { data: missions, error } = await supabase
                .from('daily_missions')
                .select('id, title, title_tr, description, description_tr, category, target_value, current_progress, xp_reward, point_reward, is_completed, mission_date, completed_at')
                .eq('user_id', user.id)
                .eq('mission_date', today)
                .order('created_at', { ascending: true });

            if (error) {
                 LogManager.getInstance().error('Error fetching daily missions:', error);
                 throw error;
            }

            if (!missions || missions.length === 0) {
                LogManager.getInstance().info('No daily missions found, generating...');
                return await this.generateDailyMissions(user.id, today);
            }
            
            LogManager.getInstance().info(`Found ${missions.length} existing daily missions`);
            return missions.map(this.mapDailyMission);
        } catch (err) {
            LogManager.getInstance().error('Daily missions fetch error:', err);
            return [];
        }
    }

    public async updateProgressByCategory(category: string, increment: number = 1): Promise<void> {
        const supabase = SupabaseService.getInstance().getClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const normalizedCategory = this.normalizeCategory(category);
            const safeIncrement = Math.max(1, increment);
            const today = getLocalDateString();
            const { weekStart, weekEnd } = this.getCurrentWeekDates();

            const { data: dailyMissions, error: dailyError } = await supabase
                .from('daily_missions')
                .select('id, target_value, current_progress, is_completed')
                .eq('user_id', user.id)
                .eq('mission_date', today)
                .eq('category', normalizedCategory)
                .eq('is_completed', false);

            if (!dailyError && dailyMissions?.length) {
                for (const mission of dailyMissions) {
                    const target = Number(mission.target_value || 1);
                    const current = Number(mission.current_progress || 0);
                    const nextProgress = Math.min(target, current + safeIncrement);
                    const completed = nextProgress >= target;
                    await supabase
                        .from('daily_missions')
                        .update({
                            current_progress: nextProgress,
                            is_completed: completed,
                            status: completed ? 'completed' : 'active',
                        })
                        .eq('id', mission.id);
                }
            }

            const { data: weeklyMissions, error: weeklyError } = await supabase
                .from('weekly_missions')
                .select('id, target_value, current_progress, is_completed')
                .eq('user_id', user.id)
                .eq('week_start', weekStart)
                .eq('week_end', weekEnd)
                .eq('category', normalizedCategory)
                .eq('is_completed', false);

            if (!weeklyError && weeklyMissions?.length) {
                for (const mission of weeklyMissions) {
                    const target = Number(mission.target_value || 1);
                    const current = Number(mission.current_progress || 0);
                    const nextProgress = Math.min(target, current + safeIncrement);
                    const completed = nextProgress >= target;
                    await supabase
                        .from('weekly_missions')
                        .update({
                            current_progress: nextProgress,
                            is_completed: completed,
                            status: completed ? 'completed' : 'active',
                        })
                        .eq('id', mission.id);
                }
            }
        } catch (err) {
            LogManager.getInstance().warn('updateProgressByCategory failed', err);
        }
    }

    // Claim mission reward (add XP/Points and mark as claimed)
    public async claimMissionReward(missionId: string, type: 'weekly' | 'daily'): Promise<{ xp: number, points: number }> {
        const supabase = SupabaseService.getInstance().getClient();
        const table = type === 'weekly' ? 'weekly_missions' : 'daily_missions';
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // 1. Get mission details
            const { data: mission, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', missionId)
                .single();
                
            if (error || !mission) throw new Error('Mission not found');
            
            // 2. Check if already claimed (using completed_at as indicator)
            if (mission.completed_at) {
                LogManager.getInstance().info(`Mission ${missionId} already claimed`);
                return { xp: 0, points: 0 };
            }
            
            // 3. Check if completed
            if (!mission.is_completed && mission.current_progress < mission.target_value) {
                throw new Error('Mission not completed yet');
            }
            
            const xp = mission.xp_reward || 0;
            const points = mission.points_reward || mission.point_reward || 0;
            
            // 4. Distribute rewards via RPC (Secure)
            if (xp > 0) {
                const { error: xpError } = await supabase.rpc('add_xp', { 
                    user_id_param: user.id, 
                    amount_param: xp, 
                    source_param: 'mission', 
                    description_param: `Completed ${type} mission: ${mission.title}`
                });
                if (xpError) LogManager.getInstance().error('Error adding XP:', xpError);
            }
            
            if (points > 0) {
                const { error: pointsError } = await supabase.rpc('add_user_currency', {
                    p_user_id: user.id,
                    p_amount: points,
                    p_currency_type: 'points'
                });
                if (pointsError) LogManager.getInstance().error('Error adding points:', pointsError);
            }
            
            // 5. Update mission status to 'completed' and set completed_at
            // Note: If status enum doesn't support 'claimed', we use 'completed' and rely on completed_at
            const { error: updateError } = await supabase
                .from(table)
                .update({ 
                    status: 'completed', 
                    is_completed: true,
                    completed_at: new Date().toISOString() 
                })
                .eq('id', missionId);

            if (updateError) throw updateError;
                
            return { xp, points };
        } catch (err) {
            LogManager.getInstance().error('Claim reward error:', err);
            throw err;
        }
    }

    private async ensureUserRecord(userId: string): Promise<boolean> {
        const supabase = SupabaseService.getInstance().getClient();
        
        // 1. Check if user exists in public.users
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (existingUser) return true;

        LogManager.getInstance().warn(`User record missing for ${userId} in public.users table. Attempting to create...`);

        // 2. Try to create user record if missing
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser || authUser.id !== userId) {
                LogManager.getInstance().error('Auth user mismatch or not found');
                return false;
            }

            const email = authUser.email || '';
            const metadata = authUser.user_metadata || {};
            // Fallback for required fields
            const username = metadata.username || email.split('@')[0] || `user_${userId.substring(0, 8)}`;
            const firstName = metadata.first_name || 'User';
            const lastName = metadata.last_name || 'Member';

            const { error: insertError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    email: email,
                    username: username,
                    first_name: firstName,
                    last_name: lastName,
                    is_email_verified: !!authUser.email_confirmed_at
                }, { onConflict: 'id' });

            if (insertError) {
                LogManager.getInstance().error('Failed to create missing public.users record:', insertError);
                await new Promise(resolve => setTimeout(resolve, 400));
                const { data: afterInsertUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', userId)
                    .maybeSingle();
                return !!afterInsertUser;
            }

            LogManager.getInstance().info('Successfully created missing public.users record');
            return true;
        } catch (err) {
            LogManager.getInstance().error('Error in ensureUserRecord:', err);
            return false;
        }
    }

    // Generate weekly missions using AI — deeply personalized
    private async generateWeeklyMissions(userId: string, weekStart: string, weekEnd: string): Promise<WeeklyMission[]> {
        const supabase = SupabaseService.getInstance().getClient();
        let missions: WeeklyMission[] = [];

        // Ensure user record exists to avoid foreign key constraint errors
        if (!(await this.ensureUserRecord(userId))) {
            LogManager.getInstance().error('Cannot generate weekly missions: User record missing and creation failed');
            return [];
        }

        // Gather rich user context for AI personalization
        let userLevel = 'intermediate';
        let userContext = '';
        try {
            // ... (rest of context gathering)
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, first_name, height, weight, gender, age, fitness_goal')
                .eq('id', userId)
                .single();
            // ... (rest of context gathering logic same as before)
            
            // Re-adding this part but ensuring we catch errors properly
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
            
            // Get Assigned Supplements
            const { data: assignedSupplements } = await supabase
                .from('assigned_supplements')
                .select('name, dosage, frequency')
                .eq('client_id', userId)
                .eq('is_active', true);

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
            if (assignedSupplements && assignedSupplements.length > 0) {
                parts.push(`Assigned Supplements: ${assignedSupplements.map(s => s.name).join(', ')}`);
            }
            userContext = parts.join(', ');
        } catch (ctxErr) {
            LogManager.getInstance().warn('Error gathering user context for missions:', ctxErr);
        }

        // Try AI generation with rich personalization
        try {
            LogManager.getInstance().info('Calling DeepSeek for weekly missions...');
            const deepseek = DeepSeekService.getInstance();
            // Send structured data to Edge Function
            const response = await deepseek.generateContent('missions', {
                mode: 'weekly',
                userLevel,
                userContext,
                weekStart,
                weekEnd
            });
            LogManager.getInstance().info('DeepSeek response received');

            // Parse AI response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    for (const m of parsed) {
                        const { data: inserted, error: insertError } = await supabase
                            .from('weekly_missions')
                            .insert({
                                user_id: userId,
                                title: m.title || 'Weekly Mission',
                                title_tr: m.title_tr || 'Haftalık Görev',
                                description: m.description || 'Complete this weekly challenge',
                                description_tr: m.description_tr || 'Bu haftalık görevi tamamla',
                                category: this.normalizeCategory(m.category),
                                target_value: m.target_value || 1,
                                current_progress: 0,
                                xp_reward: m.xp_reward || 100,
                                points_reward: m.points_reward || m.point_reward || 50,
                                is_completed: false,
                                week_start: weekStart,
                                week_end: weekEnd,
                            })
                            .select()
                            .single();
                        
                        if (insertError) {
                             LogManager.getInstance().error('Error inserting generated mission:', insertError);
                        } else if (inserted) {
                             missions.push(this.mapWeeklyMission(inserted));
                        }
                    }
                }
            } else {
                 LogManager.getInstance().warn('No JSON array found in AI response');
            }
        } catch (err) {
            LogManager.getInstance().error('AI weekly mission generation failed:', err);
        }

        // Fallback if AI didn't generate enough
        if (missions.length < 3) {
            LogManager.getInstance().info(`Generated only ${missions.length} missions, using fallback...`);
            const fallbacks = await this.generateFallbackWeeklyMissions(userId, weekStart, weekEnd);
            missions = [...missions, ...fallbacks];
        }

        return missions;
    }

    // Generate daily missions using AI with user context
    private async generateDailyMissions(userId: string, date: string): Promise<DailyMission[]> {
        const supabase = SupabaseService.getInstance().getClient();
        let missions: DailyMission[] = [];

        // Ensure user record exists to avoid foreign key constraint errors
        if (!(await this.ensureUserRecord(userId))) {
            LogManager.getInstance().error('Cannot generate daily missions: User record missing and creation failed');
            return [];
        }

        // Gather user context for daily personalization
        let userInfo = '';
        try {
             // ... existing context gathering
             const { data: profile } = await supabase
                .from('profiles')
                .select('height, weight, gender, fitness_goal')
                .eq('id', userId)
                .single();
            
            // Get Assigned Supplements
            const { data: assignedSupplements } = await supabase
                .from('assigned_supplements')
                .select('name')
                .eq('client_id', userId)
                .eq('is_active', true);

            if (profile) {
                const parts: string[] = [];
                if (profile.weight) parts.push(`${profile.weight}kg`);
                if (profile.fitness_goal) parts.push(`Goal: ${profile.fitness_goal}`);
                if (profile.gender) parts.push(profile.gender);
                if (assignedSupplements && assignedSupplements.length > 0) {
                    parts.push(`Supplements: ${assignedSupplements.map(s => s.name).join(', ')}`);
                }
                userInfo = parts.join(', ');
            }
        } catch (err) {
            LogManager.getInstance().warn('Error gathering daily mission context', err);
        }

        try {
            LogManager.getInstance().info('Calling DeepSeek for daily missions...');
            const deepseek = DeepSeekService.getInstance();
            
            // Send structured data to Edge Function
            const response = await deepseek.generateContent('missions', {
                mode: 'daily',
                userInfo,
                date
            });
            LogManager.getInstance().info('DeepSeek daily response received');

            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    for (const m of parsed) {
                        const { data: inserted, error: insertError } = await supabase
                            .from('daily_missions')
                            .insert({
                                user_id: userId,
                                title: m.title || 'Daily Mission',
                                title_tr: m.title_tr || 'Günlük Görev',
                                description: m.description || 'Complete this daily task',
                                description_tr: m.description_tr || 'Bu günlük görevi tamamla',
                                category: this.normalizeCategory(m.category),
                                target_value: m.target_value || 1,
                                current_progress: 0,
                                xp_reward: m.xp_reward || 20,
                                point_reward: m.point_reward || 10,
                                is_completed: false,
                                mission_date: date,
                            })
                            .select()
                            .single();
                        
                        if (insertError) {
                            LogManager.getInstance().error('Error inserting daily mission:', insertError);
                        } else if (inserted) {
                            missions.push(this.mapDailyMission(inserted));
                        }
                    }
                }
            } else {
                 LogManager.getInstance().warn('No JSON array found in daily AI response');
            }
        } catch (err) {
            LogManager.getInstance().error('AI daily mission generation failed:', err);
        }

        // Fallback
        if (missions.length < 3) {
            LogManager.getInstance().info('Using fallback daily missions...');
            const fallbacks = await this.generateFallbackDailyMissions(userId, date);
            missions = [...missions, ...fallbacks];
        }

        return missions;
    }

    private async generateFallbackWeeklyMissions(userId: string, weekStart: string, weekEnd: string): Promise<WeeklyMission[]> {
        const supabase = SupabaseService.getInstance().getClient();
        const missions: WeeklyMission[] = [];

        const templates = [
            {
                title: "Complete 3 Workouts",
                title_tr: "3 Antrenman Tamamla",
                description: "Complete any 3 workout sessions this week",
                description_tr: "Bu hafta herhangi bir 3 antrenman seansını tamamla",
                category: "workout",
                target_value: 3,
                xp_reward: 150,
                point_reward: 75
            },
            {
                title: "Drink Water Daily",
                title_tr: "Her Gün Su İç",
                description: "Reach your daily water goal 5 times",
                description_tr: "Günlük su hedefine 5 kez ulaş",
                category: "hydration",
                target_value: 5,
                xp_reward: 100,
                point_reward: 50
            },
            {
                title: "Healthy Streak",
                title_tr: "Sağlık Serisi",
                description: "Maintain a 3-day login streak",
                description_tr: "3 günlük giriş serisi yakala",
                category: "streak",
                target_value: 3,
                xp_reward: 120,
                point_reward: 60
            },
            {
                title: "No Sugar Challenge",
                title_tr: "Şekersiz Meydan Okuma",
                description: "Avoid added sugar for 3 days",
                description_tr: "3 gün boyunca ilave şekerden kaçın",
                category: "nutrition",
                target_value: 3,
                xp_reward: 200,
                point_reward: 100
            },
            {
                title: "Mindfulness",
                title_tr: "Farkındalık",
                description: "Take 5 minutes to meditate 3 times",
                description_tr: "3 kez 5 dakika meditasyon yap",
                category: "mindfulness",
                target_value: 3,
                xp_reward: 90,
                point_reward: 45
            }
        ];

        for (const t of templates) {
            const { data: inserted } = await supabase
                .from('weekly_missions')
                .insert({
                    user_id: userId,
                    title: t.title,
                    title_tr: t.title_tr,
                    description: t.description,
                    description_tr: t.description_tr,
                    category: t.category,
                    target_value: t.target_value,
                    current_progress: 0,
                    xp_reward: t.xp_reward,
                    points_reward: t.point_reward,
                    is_completed: false,
                    week_start: weekStart,
                    week_end: weekEnd,
                })
                .select()
                .single();
            if (inserted) missions.push(this.mapWeeklyMission(inserted));
        }

        return missions;
    }
    
    // ... helper methods ...
    private getCurrentWeekDates() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        const monday = new Date(now.setDate(diff));
        const sunday = new Date(now.setDate(monday.getDate() + 6));
        return {
            weekStart: monday.toISOString().split('T')[0],
            weekEnd: sunday.toISOString().split('T')[0]
        };
    }

    private async generateFallbackDailyMissions(userId: string, date: string): Promise<DailyMission[]> {
        const supabase = SupabaseService.getInstance().getClient();
        const missions: DailyMission[] = [];

        const templates = [
            {
                title: "Daily Workout",
                title_tr: "Günlük Antrenman",
                description: "Complete 1 workout today",
                description_tr: "Bugün 1 antrenman tamamla",
                category: "workout",
                target_value: 1,
                xp_reward: 50,
                point_reward: 25
            },
            {
                title: "Hydration Goal",
                title_tr: "Su Hedefi",
                description: "Reach your water goal",
                description_tr: "Su hedefine ulaş",
                category: "hydration",
                target_value: 1,
                xp_reward: 30,
                point_reward: 15
            },
            {
                title: "Eat a Fruit",
                title_tr: "Meyve Ye",
                description: "Consume one serving of fruit",
                description_tr: "Bir porsiyon meyve tüket",
                category: "nutrition",
                target_value: 1,
                xp_reward: 20,
                point_reward: 10
            }
        ];

        for (const t of templates) {
            const { data: inserted } = await supabase
                .from('daily_missions')
                .insert({
                    user_id: userId,
                    title: t.title,
                    title_tr: t.title_tr,
                    description: t.description,
                    description_tr: t.description_tr,
                    category: t.category,
                    target_value: t.target_value,
                    current_progress: 0,
                    xp_reward: t.xp_reward,
                    point_reward: t.point_reward,
                    is_completed: false,
                    mission_date: date,
                })
                .select()
                .single();
            if (inserted) missions.push(this.mapDailyMission(inserted));
        }

        return missions;
    }
}
