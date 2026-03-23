"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHomeData = void 0;
const react_1 = require("react");
const supabase_1 = require("../services/supabase");
const streakService_1 = require("../services/streakService");
const healthService_1 = require("../services/healthService");
const leagueService_1 = require("../services/leagueService");
const storeService_1 = require("../services/storeService");
const missionService_1 = require("../services/missionService");
const notificationService_1 = require("../services/notificationService");
const dateUtils_1 = require("../utils/dateUtils");
const offlineCache_1 = require("../services/offlineCache");
const CACHE_KEY_HOME = 'home_screen_data';
const useHomeData = (language = 'en') => {
    const [data, setData] = (0, react_1.useState)({
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
    const loadData = (0, react_1.useCallback)((...args_1) => __awaiter(void 0, [...args_1], void 0, function* (isRefresh = false) {
        if (isRefresh) {
            setData(prev => (Object.assign(Object.assign({}, prev), { refreshing: true })));
        }
        else {
            setData(prev => (Object.assign(Object.assign({}, prev), { loading: true })));
        }
        // Try to load from cache first for immediate UI
        if (!isRefresh) {
            try {
                const cached = yield offlineCache_1.offlineCache.get(CACHE_KEY_HOME);
                if (cached) {
                    setData(prev => (Object.assign(Object.assign(Object.assign({}, prev), cached), { loading: false, isOfflineData: true })));
                }
            }
            catch (e) {
                console.warn('Failed to load home cache:', e);
            }
        }
        try {
            const supa = supabase_1.SupabaseService.getInstance();
            const { user } = yield supa.getCurrentUser();
            if (!user) {
                throw new Error('No user found');
            }
            // Fetch Profile
            let profileData = null;
            try {
                const { data } = yield supa.getUserProfile(user.id);
                profileData = data;
            }
            catch (error) {
                console.warn('Failed to load user profile:', error);
                // If we have cached profile, keep it, otherwise use fallback
                if (!data.profile) {
                    profileData = {
                        id: user.id,
                        email: user.email,
                        full_name: 'User',
                        username: `user_${user.id.slice(0, 8)}`
                    };
                }
                else {
                    profileData = data.profile;
                }
            }
            const today = (0, dateUtils_1.getLocalDateString)();
            // Parallel Data Fetching
            const results = yield Promise.allSettled([
                streakService_1.StreakService.getInstance().getStreak(),
                (() => __awaiter(void 0, void 0, void 0, function* () {
                    const hs = healthService_1.HealthService.getInstance();
                    yield hs.initialize();
                    const hData = yield hs.getTodayHealthData();
                    const insights = hs.generateHealthInsights(hData, (profileData === null || profileData === void 0 ? void 0 : profileData.gender) || null);
                    yield notificationService_1.NotificationService.getInstance().checkSmartReminders(hData, language);
                    return insights;
                }))(),
                supa.getClient().from('workouts').select('*').eq('user_id', user.id).gte('created_at', today + 'T00:00:00').order('created_at', { ascending: false }).limit(5),
                leagueService_1.LeagueService.getInstance().getUserLeague(),
                storeService_1.StoreService.getInstance().getUserCurrency(),
                missionService_1.MissionService.getInstance().getDailyMissions(),
                // Daily Program Items
                (() => __awaiter(void 0, void 0, void 0, function* () {
                    const [wRes, nRes, sRes] = yield Promise.all([
                        supa.getAssignedWorkouts(user.id),
                        supa.getAssignedNutritionPlans(user.id),
                        supa.getAssignedSupplements(user.id).catch(() => ({ data: [] }))
                    ]);
                    const items = [];
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (wRes.data) {
                        wRes.data.forEach((w) => {
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
                }))()
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
            missionService_1.MissionService.getInstance().getWeeklyMissions().catch(err => console.warn('Weekly mission generation trigger:', err));
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
            offlineCache_1.offlineCache.set(CACHE_KEY_HOME, {
                profile: profileData,
                streakData,
                healthInsights,
                todaysWorkouts,
                leagueData,
                currency,
                dailyMissions,
                dailyProgram,
            });
        }
        catch (error) {
            console.error('Home data load error:', error);
            setData(prev => (Object.assign(Object.assign({}, prev), { loading: false, refreshing: false, error: error, 
                // Keep isOfflineData true if we are falling back to cache
                isOfflineData: prev.isOfflineData || !!prev.profile })));
        }
    }), [language]);
    return Object.assign(Object.assign({}, data), { loadData });
};
exports.useHomeData = useHomeData;
