import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { SupabaseService } from '@nextself/shared';
import { StreakService, StreakData } from '../services/streakService';
import { HealthService, HealthInsight } from '../services/healthService';
import { LeagueService, UserLeagueData } from '../services/leagueService';
import { StoreService, UserCurrency } from '../services/storeService';
import { MissionService, DailyMission } from '../services/missionService';
import { NotificationService } from '../services/notificationService';
import { DailyItem } from '../components/HomeScreen/DailyProgramChecklist';
import { getLocalDateString } from '../utils/dateUtils';
import { offlineCache } from '../services/offlineCache';
import { Language } from '../locales/i18n';

const CACHE_KEY_HOME = 'home_screen_data';

export interface HomeData {
  profile: any;
  streakData: StreakData | null;
  healthInsights: HealthInsight[];
  todaysWorkouts: any[];
  leagueData: UserLeagueData | null;
  currency: UserCurrency | null;
  dailyMissions: DailyMission[];
  dailyProgram: DailyItem[];
}

export const useHomeData = (language: Language = 'en') => {
  const supa = SupabaseService.getInstance();

  // 1. Core Data (Profile, Streak, Currency) - Fast, high priority
  const coreQuery = useQuery({
    queryKey: ['homeCore', language],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { user } = await supa.getCurrentUser();
      if (!user) throw new Error('No user found');

      let profileData;
      try {
        const { data } = await supa.getUserProfile(user.id);
        profileData = data;
      } catch (error) {
        profileData = { id: user.id, email: user.email, full_name: 'User', username: `user_${user.id.slice(0, 8)}` };
      }

      const [streakData, currency, leagueData] = await Promise.all([
        StreakService.getInstance().getStreak().catch(() => null),
        StoreService.getInstance().getUserCurrency().catch(() => null),
        LeagueService.getInstance().getUserLeague().catch(() => null),
      ]);

      return { profileData, streakData, currency, leagueData, userId: user.id };
    }
  });

  const userId = coreQuery.data?.userId;
  const profileData = coreQuery.data?.profileData;

  // 2. Health & Missions (Medium priority)
  const healthQuery = useQuery({
    queryKey: ['homeHealth', language, userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      const [healthInsights, dailyMissions] = await Promise.all([
        (async () => {
          try {
            const hs = HealthService.getInstance();
            await hs.initialize();
            const hData = await hs.getTodayHealthData();
            const insights = hs.generateHealthInsights(hData, profileData?.gender || null);
            await NotificationService.getInstance().checkSmartReminders(hData, language);
            return insights;
          } catch { return []; }
        })(),
        MissionService.getInstance().getDailyMissions().catch(() => []),
      ]);
      MissionService.getInstance().getWeeklyMissions().catch(() => {});
      return { healthInsights, dailyMissions };
    }
  });

  // 3. Daily Program & Workouts (Dynamic, changes daily)
  const programQuery = useQuery({
    queryKey: ['homeProgram', language, userId],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    queryFn: async () => {
      const today = getLocalDateString();
      const [workoutsRes, assignedRes] = await Promise.all([
        (async () => {
          try {
            return await supa.getClient().from('workouts').select('*').eq('user_id', userId as string).gte('created_at', today + 'T00:00:00').order('created_at', { ascending: false }).limit(5);
          } catch {
            return { data: [] };
          }
        })(),
        (async () => {
          try {
            const [wRes] = await Promise.all([
              supa.getAssignedWorkouts(userId as string).catch(() => ({ data: [] }))
            ]);
            const items: DailyItem[] = [];
            if (wRes.data) {
              wRes.data.forEach((w: any) => {
                const scheduledDate = typeof w.scheduled_date === 'string' ? w.scheduled_date.slice(0, 10) : '';
                if (scheduledDate === today) {
                  items.push({
                    id: w.id,
                    type: 'workout',
                    title: w.workout_name || 'Workout',
                    subtitle: `${w.duration_minutes || 0} min • ${w.calories_burned || 0} cal`,
                    completed: w.is_completed,
                    time: w.scheduled_time 
                  });
                }
              });
            }
            return items;
          } catch { return []; }
        })()
      ]);
      return { todaysWorkouts: workoutsRes.data || [], dailyProgram: assignedRes };
    }
  });

  const isLoading = coreQuery.isLoading || (coreQuery.isSuccess && (healthQuery.isLoading || programQuery.isLoading));
  const isRefetching = coreQuery.isRefetching || healthQuery.isRefetching || programQuery.isRefetching;

  const refresh = useCallback(async () => {
    await Promise.all([
      coreQuery.refetch(),
      healthQuery.refetch(),
      programQuery.refetch()
    ]);
  }, [coreQuery, healthQuery, programQuery]);

  return {
    data: {
      profile: coreQuery.data?.profileData || null,
      streakData: coreQuery.data?.streakData || null,
      healthInsights: healthQuery.data?.healthInsights || [],
      todaysWorkouts: programQuery.data?.todaysWorkouts || [],
      leagueData: coreQuery.data?.leagueData || null,
      currency: coreQuery.data?.currency || null,
      dailyMissions: healthQuery.data?.dailyMissions || [],
      dailyProgram: programQuery.data?.dailyProgram || [],
    },
    loading: isLoading,
    refreshing: isRefetching,
    error: coreQuery.error || healthQuery.error || programQuery.error,
    isOfflineData: false,
    refresh,
  };
};
