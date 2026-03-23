import { SupabaseService } from '@nextself/shared';
import { getLocalDateString } from '../utils/dateUtils';
import { LogManager } from '../utils/LogManager';

// ============================================================
// LEAGUE TIERS
// ============================================================
export const LEAGUE_TIERS = [
    { tier: 1, name: 'Bronze', nameTr: 'Bronz', icon: 'shield-half', color: '#CD7F32' },
    { tier: 2, name: 'Silver', nameTr: 'Gümüş', icon: 'shield', color: '#C0C0C0' },
    { tier: 3, name: 'Gold', nameTr: 'Altın', icon: 'trophy', color: '#FFD700' },
    { tier: 4, name: 'Sapphire', nameTr: 'Safir', icon: 'diamond', color: '#0F52BA' },
    { tier: 5, name: 'Ruby', nameTr: 'Yakut', icon: 'flame', color: '#E0115F' },
    { tier: 6, name: 'Emerald', nameTr: 'Zümrüt', icon: 'leaf', color: '#50C878' },
    { tier: 7, name: 'Amethyst', nameTr: 'Ametist', icon: 'prism', color: '#9966CC' },
    { tier: 8, name: 'Pearl', nameTr: 'İnci', icon: 'ellipse', color: '#F0EAD6' },
    { tier: 9, name: 'Obsidian', nameTr: 'Obsidyen', icon: 'cube', color: '#3D3635' },
    { tier: 10, name: 'Diamond', nameTr: 'Elmas', icon: 'sparkles', color: '#B9F2FF' },
];

export interface LeagueUser {
    userId: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
    weeklyXp: number;
    rank: number;
    zone: 'promotion' | 'safe' | 'demotion';
}

export interface UserLeagueData {
    currentTier: number;
    weeklyXp: number;
    totalXp: number;
    rankInGroup: number;
    groupId: string | null;
    weeksInCurrentLeague: number;
    promotionCount: number;
}

export interface LeagueGroupData {
    members: LeagueUser[];
    weekStart: string;
    weekEnd: string;
    leagueName: string;
    leagueTier: number;
}

export class LeagueService {
    private static instance: LeagueService;

    private constructor() { }

    public static getInstance(): LeagueService {
        if (!LeagueService.instance) {
            LeagueService.instance = new LeagueService();
        }
        return LeagueService.instance;
    }

    // Get or create user league data
    public async getUserLeague(): Promise<UserLeagueData> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if user has league data
            const { data: league, error } = await supabase
                .from('user_leagues')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !league) {
                // Initialize user in Bronze league
                return await this.initializeUserLeague(user.id);
            }

            return {
                currentTier: league.current_tier,
                weeklyXp: league.weekly_xp,
                totalXp: league.total_xp,
                rankInGroup: league.rank_in_group || 0,
                groupId: league.group_id,
                weeksInCurrentLeague: league.weeks_in_current_league,
                promotionCount: league.promotion_count,
            };
        } catch (err) {
            LogManager.getInstance().warn('League fetch error:', err);
            return {
                currentTier: 1,
                weeklyXp: 0,
                totalXp: 0,
                rankInGroup: 0,
                groupId: null,
                weeksInCurrentLeague: 0,
                promotionCount: 0,
            };
        }
    }

    // Initialize user in Bronze league
    private async initializeUserLeague(userId: string): Promise<UserLeagueData> {
        const supabase = SupabaseService.getInstance().getClient();

        // Get Bronze league ID
        const { data: bronzeLeague } = await supabase
            .from('leagues')
            .select('id')
            .eq('tier', 1)
            .single();

        const leagueId = bronzeLeague?.id;

        const { error } = await supabase
            .from('user_leagues')
            .upsert({
                user_id: userId,
                league_id: leagueId,
                current_tier: 1,
                weekly_xp: 0,
                total_xp: 0,
                weeks_in_current_league: 0,
                promotion_count: 0,
                demotion_count: 0,
            }, { onConflict: 'user_id' });

        if (error) LogManager.getInstance().warn('League init error:', error);

        // Assign to a group
        await this.assignToGroup(userId, 1);

        return {
            currentTier: 1,
            weeklyXp: 0,
            totalXp: 0,
            rankInGroup: 0,
            groupId: null,
            weeksInCurrentLeague: 0,
            promotionCount: 0,
        };
    }

    // Assign user to a weekly group
    private async assignToGroup(userId: string, tier: number): Promise<void> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const now = new Date();
            const monday = this.getMonday(now);
            const sunday = new Date(monday);
            sunday.setDate(sunday.getDate() + 6);

            const weekStart = getLocalDateString(monday);
            const weekEnd = getLocalDateString(sunday);

            // Get league ID for tier
            const { data: league } = await supabase
                .from('leagues')
                .select('id')
                .eq('tier', tier)
                .single();

            if (!league) return;

            // Find or create an active group with < 30 members
            const { data: existingGroups } = await supabase
                .from('league_groups')
                .select('id, league_group_members(count)')
                .eq('league_id', league.id)
                .eq('week_start', weekStart)
                .eq('is_active', true);

            let groupId: string | null = null;

            if (existingGroups && existingGroups.length > 0) {
                for (const g of existingGroups) {
                    const memberCount = (g.league_group_members as any)?.[0]?.count || 0;
                    if (memberCount < 30) {
                        groupId = g.id;
                        break;
                    }
                }
            }

            // Create new group if none available
            if (!groupId) {
                const { data: newGroup } = await supabase
                    .from('league_groups')
                    .insert({
                        league_id: league.id,
                        week_start: weekStart,
                        week_end: weekEnd,
                        is_active: true,
                    })
                    .select('id')
                    .single();

                groupId = newGroup?.id || null;
            }

            if (groupId) {
                // Add user to group
                await supabase
                    .from('league_group_members')
                    .upsert({
                        group_id: groupId,
                        user_id: userId,
                        weekly_xp: 0,
                        rank: 0,
                        zone: 'safe',
                    }, { onConflict: 'group_id,user_id' });

                // Update user_leagues with group_id
                await supabase
                    .from('user_leagues')
                    .update({ group_id: groupId })
                    .eq('user_id', userId);
            }
        } catch (err) {
            LogManager.getInstance().warn('Group assignment error:', err);
        }
    }

    // Get leaderboard for current group
    public async getLeaderboard(): Promise<LeagueGroupData | null> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Get user's current group
            const { data: userLeague } = await supabase
                .from('user_leagues')
                .select('group_id, current_tier')
                .eq('user_id', user.id)
                .single();

            if (!userLeague?.group_id) {
                // Try to assign to group first
                const league = await this.getUserLeague();
                if (!league.groupId) return null;
            }

            const groupId = userLeague?.group_id;
            if (!groupId) return null;

            // Get group info
            const { data: group } = await supabase
                .from('league_groups')
                .select('week_start, week_end, league_id')
                .eq('id', groupId)
                .single();

            // Get group members with profiles
            const { data: members } = await supabase
                .from('league_group_members')
                .select(`
          user_id,
          weekly_xp,
          rank,
          zone,
          profiles:user_id (username, full_name, avatar_url)
        `)
                .eq('group_id', groupId)
                .order('weekly_xp', { ascending: false });

            if (!members) return null;

            const leagueTier = userLeague?.current_tier || 1;
            const tierInfo = LEAGUE_TIERS.find(l => l.tier === leagueTier);
            const totalMembers = members.length;
            const promotionThreshold = Math.ceil(totalMembers * 0.33); // Top 33%
            const demotionThreshold = Math.ceil(totalMembers * 0.17); // Bottom 17%

            const formattedMembers: LeagueUser[] = members.map((m: any, index: number) => {
                const rank = index + 1;
                let zone: 'promotion' | 'safe' | 'demotion' = 'safe';
                if (leagueTier < 10 && rank <= promotionThreshold) zone = 'promotion';
                else if (leagueTier > 1 && rank > totalMembers - demotionThreshold) zone = 'demotion';

                return {
                    userId: m.user_id,
                    username: m.profiles?.username || 'User',
                    fullName: m.profiles?.full_name || '',
                    avatarUrl: m.profiles?.avatar_url,
                    weeklyXp: m.weekly_xp || 0,
                    rank,
                    zone,
                };
            });

            return {
                members: formattedMembers,
                weekStart: group?.week_start || '',
                weekEnd: group?.week_end || '',
                leagueName: tierInfo?.name || 'Bronze',
                leagueTier: leagueTier,
            };
        } catch (err) {
            LogManager.getInstance().warn('Leaderboard fetch error:', err);
            return null;
        }
    }

    // Add XP to user
    // Uses optimistic concurrency control to prevent race conditions:
    // The update includes the read values in the WHERE clause so concurrent
    // writes don't silently overwrite each other. Retries on conflict.
    public async addXP(amount: number, source: string, description?: string): Promise<number> {
        const MAX_RETRIES = 3;
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            // Check for active multiplier boosts
            let multiplier = 1.0;
            const { data: activeBoosts } = await supabase
                .from('user_inventory')
                .select('*, store_items:item_id(*)')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .gt('expires_at', new Date().toISOString());

            if (activeBoosts) {
                for (const boost of activeBoosts) {
                    const item = boost.store_items as any;
                    if (item?.effect_type === 'double_xp') multiplier *= 2;
                    else if (item?.effect_type === 'workout_boost' && source === 'workout') multiplier *= 1.5;
                    else if (item?.effect_type === 'nutrition_boost' && source === 'nutrition_log') multiplier *= 1.5;
                }
            }

            const finalAmount = Math.round(amount * multiplier);

            // Log XP transaction
            await supabase.from('xp_transactions').insert({
                user_id: user.id,
                amount: finalAmount,
                source,
                description: description || `${source} XP`,
                multiplier,
            });

            // Update user league XP with optimistic concurrency control.
            // We read the current values and include them in the WHERE clause
            // so the update only applies if no concurrent write changed them.
            let updated = false;
            for (let attempt = 0; attempt < MAX_RETRIES && !updated; attempt++) {
                const { data: currentLeague } = await supabase
                    .from('user_leagues')
                    .select('weekly_xp, total_xp, group_id')
                    .eq('user_id', user.id)
                    .single();

                const oldWeeklyXP = currentLeague?.weekly_xp ?? 0;
                const oldTotalXP = currentLeague?.total_xp ?? 0;
                const newWeeklyXP = oldWeeklyXP + finalAmount;
                const newTotalXP = oldTotalXP + finalAmount;

                // Optimistic lock: only update if values haven't changed since read
                const { data: updateResult, error: updateError } = await supabase
                    .from('user_leagues')
                    .update({ weekly_xp: newWeeklyXP, total_xp: newTotalXP })
                    .eq('user_id', user.id)
                    .eq('weekly_xp', oldWeeklyXP)
                    .eq('total_xp', oldTotalXP)
                    .select();

                if (updateError) {
                    LogManager.getInstance().warn(`XP update attempt ${attempt + 1} error:`, updateError);
                    continue;
                }

                if (updateResult && updateResult.length > 0) {
                    updated = true;

                    // Update group member XP
                    if (currentLeague?.group_id) {
                        await supabase
                            .from('league_group_members')
                            .update({ weekly_xp: newWeeklyXP })
                            .eq('group_id', currentLeague.group_id)
                            .eq('user_id', user.id);
                    }
                } else {
                    // Conflict: another write happened between our read and update.
                    // Retry with fresh data.
                    LogManager.getInstance().warn(`XP update conflict (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
                }
            }

            if (!updated) {
                LogManager.getInstance().warn('XP update failed after max retries due to concurrent modifications');
            }

            // Also add points to user currency
            await this.addPoints(user.id, Math.round(finalAmount * 0.5));

            return finalAmount;
        } catch (err) {
            LogManager.getInstance().warn('XP add error:', err);
            return 0;
        }
    }

    // Add points to user currency
    // Uses optimistic concurrency control to prevent race conditions on
    // concurrent point awards (e.g., workout + mission completing simultaneously).
    private async addPoints(userId: string, amount: number): Promise<void> {
        const MAX_RETRIES = 3;
        try {
            const supabase = SupabaseService.getInstance().getClient();

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                const { data: existing } = await supabase
                    .from('user_currency')
                    .select('points, total_earned_points')
                    .eq('user_id', userId)
                    .single();

                if (existing) {
                    // Optimistic lock: only update if values haven't changed since read
                    const { data: updateResult } = await supabase
                        .from('user_currency')
                        .update({
                            points: existing.points + amount,
                            total_earned_points: existing.total_earned_points + amount,
                        })
                        .eq('user_id', userId)
                        .eq('points', existing.points)
                        .eq('total_earned_points', existing.total_earned_points)
                        .select();

                    if (updateResult && updateResult.length > 0) {
                        return; // Success
                    }
                    // Conflict: retry with fresh data
                    LogManager.getInstance().warn(`Points update conflict (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
                } else {
                    // No existing record — insert (upsert to handle concurrent first-time inserts safely)
                    await supabase
                        .from('user_currency')
                        .upsert({
                            user_id: userId,
                            points: amount,
                            total_earned_points: amount,
                        }, { onConflict: 'user_id' });
                    return;
                }
            }
            LogManager.getInstance().warn('Points update failed after max retries due to concurrent modifications');
        } catch (err) {
            LogManager.getInstance().warn('Points add error:', err);
        }
    }

    // Get time remaining until week end
    public getTimeRemaining(): { days: number; hours: number; minutes: number } {
        const now = new Date();
        const sunday = this.getNextSunday(now);
        sunday.setHours(23, 59, 59, 999);
        const diff = sunday.getTime() - now.getTime();

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    }

    // Helper: get Monday of current week
    private getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Helper: get next Sunday
    private getNextSunday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? 0 : 7 - day;
        d.setDate(d.getDate() + diff);
        return d;
    }

    // Get league tier info
    public getTierInfo(tier: number) {
        return LEAGUE_TIERS.find(l => l.tier === tier) || LEAGUE_TIERS[0];
    }
}
