import { useState, useCallback, useEffect } from 'react';
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
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  isOfflineData: boolean;
}

export const useHomeData = (language: Language = 'en') => {
  const [data, setData] = useState<HomeData>({
    profile: null,
    streakData: null,
    healthInsights: [],
    todaysWorkouts: [],
    leagueData: null,
    currency: null,
    dailyMissions: [],
    dailyProgram: [],
    loading: true,
    refreshing: false,
    error: null,
    isOfflineData: false,
  });

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setData(prev => ({ ...prev, refreshing: true }));
    } else {
      setData(prev => ({ ...prev, loading: true }));
    }

    // Try to load from cache first for immediate UI
    if (!isRefresh) {
      try {
        const cached = await offlineCache.get<Partial<HomeData>>(CACHE_KEY_HOME);
        if (cached) {
          setData(prev => ({
            ...prev,
            ...cached,
            loading: false, // Show cached content immediately
            isOfflineData: true
          }));
        }
      } catch (e) {
        console.warn('Failed to load home cache:', e);
      }
    }

    try {
      const supa = SupabaseService.getInstance();
      const { user } = await supa.getCurrentUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      // Fetch Profile
      let profileData = null;
      try {
        const { data } = await supa.getUserProfile(user.id);
        profileData = data;
      } catch (error) {
        console.warn('Failed to load user profile:', error);
        // If we have cached profile, keep it, otherwise use fallback
        if (!data.profile) {
            profileData = {
            id: user.id,
            email: user.email,
            full_name: 'User',
            username: `user_${user.id.slice(0, 8)}`
            };
        } else {
            profileData = data.profile;
        }
      }

      const today = getLocalDateString();

      // Parallel Data Fetching
      const results = await Promise.allSettled([
        StreakService.getInstance().getStreak(),
        (async () => {
          const hs = HealthService.getInstance();
          await hs.initialize();
          const hData = await hs.getTodayHealthData();
          const insights = hs.generateHealthInsights(hData, profileData?.gender || null);
          await NotificationService.getInstance().checkSmartReminders(hData, language);
          return insights;
        })(),
        supa.getClient().from('workouts').select('*').eq('user_id', user.id).gte('created_at', today + 'T00:00:00').order('created_at', { ascending: false }).limit(5),
        LeagueService.getInstance().getUserLeague(),
        StoreService.getInstance().getUserCurrency(),
        MissionService.getInstance().getDailyMissions(),
        // Daily Program Items
        (async () => {
          const [wRes, nRes, sRes] = await Promise.all([
            supa.getAssignedWorkouts(user.id),
            supa.getAssignedNutritionPlans(user.id),
            supa.getAssignedSupplements(user.id).catch(() => ({ data: [] }))
          ]);

          const items: DailyItem[] = [];
          const todayStr = new Date().toISOString().split('T')[0];

          if (wRes.data) {
            wRes.data.forEach((w: any) => {
              if (w.scheduled_date && w.scheduled_date.startsWith(todayStr)) {
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
          // Add nutrition and supplements processing here if needed
          return items;
        })()
      ]);

      // Extract results
      const streakData = results[0].status === 'fulfilled' ? results[0].value : null;
      const healthInsights = results[1].status === 'fulfilled' ? results[1].value : [];
      const todaysWorkouts = results[2].status === 'fulfilled' ? (results[2].value.data || []) : [];
      const leagueData = results[3].status === 'fulfilled' ? results[3].value : null;
      const currency = results[4].status === 'fulfilled' ? results[4].value : null;
      const dailyMissions = results[5].status === 'fulfilled' ? results[5].value : [];
      const dailyProgram = results[6].status === 'fulfilled' ? results[6].value : [];

      // Background task
      MissionService.getInstance().getWeeklyMissions().catch(err => console.warn('Weekly mission generation trigger:', err));

      const newData = {
        profile: profileData,
        streakData,
        healthInsights,
        todaysWorkouts,
        leagueData,
        currency,
        dailyMissions,
        dailyProgram,
        loading: false,
        refreshing: false,
        error: null,
        isOfflineData: false,
      };

      setData(newData);

      // Update Cache
      offlineCache.set(CACHE_KEY_HOME, {
        profile: profileData,
        streakData,
        healthInsights,
        todaysWorkouts,
        leagueData,
        currency,
        dailyMissions,
        dailyProgram,
      });

    } catch (error: any) {
      console.error('Home data load error:', error);
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        refreshing: false, 
        error: error,
        // Keep isOfflineData true if we are falling back to cache
        isOfflineData: prev.isOfflineData || !!prev.profile 
      }));
    }
  }, [language]);

  return { ...data, loadData };
};
