"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const CustomAlert_1 = require("../components/CustomAlert");
const navigation_1 = require("../utils/navigation");
const supabase_1 = require("../services/supabase");
const leagueService_1 = require("../services/leagueService");
const streakService_1 = require("../services/streakService");
const storeService_1 = require("../services/storeService");
const useTranslation_1 = require("../hooks/useTranslation");
const SupabaseContext_1 = require("../contexts/SupabaseContext");
const theme_1 = require("../config/theme");
const LeagueTierIcon_1 = __importDefault(require("../components/LeagueTierIcon"));
const ThemeContext_1 = require("../contexts/ThemeContext");
const native_1 = require("@react-navigation/native");
let LineChart;
try {
    LineChart = require('react-native-chart-kit').LineChart;
}
catch (_a) { }
const ProfileScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { width } = (0, react_native_1.useWindowDimensions)();
    const STAT_W = (width - 40 - 12) / 2;
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [leagueData, setLeagueData] = (0, react_1.useState)(null);
    const [streakData, setStreakData] = (0, react_1.useState)(null);
    const [currency, setCurrency] = (0, react_1.useState)(null);
    const [workoutCount, setWorkoutCount] = (0, react_1.useState)(0);
    const [monthlyTracking, setMonthlyTracking] = (0, react_1.useState)({ labels: [], datasets: [] });
    const [monthlyProgramProgress, setMonthlyProgramProgress] = (0, react_1.useState)({ labels: [], data: [] });
    const [programAdjustments, setProgramAdjustments] = (0, react_1.useState)({ increase: 0, stable: 0, decrease: 0 });
    const { t, isTurkish, language } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const [isProfessional, setIsProfessional] = (0, react_1.useState)(false);
    const { session: authSession, user: contextUser, proxiedFetch } = (0, SupabaseContext_1.useSupabaseAuth)();
    const buildMonthlyTracking = (0, react_1.useCallback)((workoutRows, nutritionRows, waterRows, vitaminRows, mineralRows, assignedWorkoutRows) => {
        const locale = language === 'tr' ? 'tr-TR' : 'en-US';
        const monthBuckets = Array.from({ length: 6 }, (_, index) => {
            const monthDate = new Date();
            monthDate.setDate(1);
            monthDate.setHours(0, 0, 0, 0);
            monthDate.setMonth(monthDate.getMonth() - (5 - index));
            const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
            return {
                key,
                label: monthDate.toLocaleDateString(locale, { month: 'short' }),
            };
        });
        const buildSeries = (rows, getDate) => {
            const counts = new Map(monthBuckets.map((bucket) => [bucket.key, 0]));
            for (const row of rows || []) {
                const rawDate = getDate(row);
                if (!rawDate)
                    continue;
                const dt = new Date(rawDate);
                if (Number.isNaN(dt.getTime()))
                    continue;
                const key = `${dt.getFullYear()}-${dt.getMonth()}`;
                if (!counts.has(key))
                    continue;
                counts.set(key, (counts.get(key) || 0) + 1);
            }
            return monthBuckets.map((bucket) => counts.get(bucket.key) || 0);
        };
        const labels = monthBuckets.map((bucket) => bucket.label);
        const workoutSeries = buildSeries(workoutRows, (row) => row.created_at);
        const nutritionSeries = buildSeries(nutritionRows, (row) => row.logged_at);
        const waterSeries = buildSeries(waterRows, (row) => row.date || row.created_at);
        const vitaminSeries = buildSeries(vitaminRows, (row) => row.logged_at);
        const mineralSeries = buildSeries(mineralRows, (row) => row.created_at);
        const assignedSeries = buildSeries((assignedWorkoutRows || []).filter((row) => !!(row === null || row === void 0 ? void 0 : row.is_completed)), (row) => row.completed_at);
        setMonthlyTracking({
            labels,
            datasets: [
                { label: isTurkish ? 'Spor' : 'Workout', data: workoutSeries, color: '#1CB0F6' },
                { label: isTurkish ? 'Beslenme' : 'Nutrition', data: nutritionSeries, color: '#FF9600' },
                { label: isTurkish ? 'Su' : 'Water', data: waterSeries, color: '#00B7FF' },
                { label: isTurkish ? 'Vitamin' : 'Vitamin', data: vitaminSeries, color: '#8E44AD' },
                { label: isTurkish ? 'Mineral' : 'Mineral', data: mineralSeries, color: '#2ECC71' },
            ],
        });
        setMonthlyProgramProgress({
            labels,
            data: assignedSeries,
        });
        const summary = { increase: 0, stable: 0, decrease: 0 };
        for (const row of assignedWorkoutRows || []) {
            const payloadRaw = row === null || row === void 0 ? void 0 : row.client_feedback;
            if (!payloadRaw)
                continue;
            try {
                const parsed = JSON.parse(payloadRaw);
                const action = parsed === null || parsed === void 0 ? void 0 : parsed.weeklyAction;
                if (action === 'increase' || action === 'decrease' || action === 'stable') {
                    summary[action] += 1;
                }
            }
            catch (_a) { }
        }
        setProgramAdjustments(summary);
    }, [isTurkish, language]);
    const loadProfile = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            let currentUser = contextUser !== null && contextUser !== void 0 ? contextUser : null;
            if (!currentUser) {
                const cur = yield supabase.getCurrentUser();
                currentUser = cur.user;
            }
            if (currentUser) {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setDate(1);
                sixMonthsAgo.setHours(0, 0, 0, 0);
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
                const sixMonthsAgoIso = sixMonthsAgo.toISOString();
                const sixMonthsAgoDateOnly = sixMonthsAgoIso.split('T')[0];
                // On web prefer proxied fetch through Edge Function to avoid client-stored tokens
                if (react_native_1.Platform.OS === 'web' && proxiedFetch) {
                    const select = 'id,full_name,first_name,last_name,username,avatar_url,created_at,height,weight,gender,dob';
                    const profRes = yield proxiedFetch('GET', 'profiles', { query: `id=eq.${currentUser.id}&select=${select}` });
                    if (profRes && profRes.ok) {
                        const payload = Array.isArray(profRes.data) ? profRes.data[0] : profRes.data;
                        setProfile(payload);
                    }
                    else {
                        // fallback to client
                        const { data } = yield supabase.getUserProfile(currentUser.id);
                        setProfile(data);
                    }
                    // Load gamification data in parallel (keep existing service calls)
                    const [leagueResult, streakResult, currencyResult, workoutResult, nutritionResult, waterResult, vitaminResult, mineralResult, assignedResult] = yield Promise.allSettled([
                        leagueService_1.LeagueService.getInstance().getUserLeague(),
                        streakService_1.StreakService.getInstance().getStreak(),
                        storeService_1.StoreService.getInstance().getUserCurrency(),
                        // Use proxiedFetch to get workouts list and count on web
                        proxiedFetch('GET', 'workouts', { query: `user_id=eq.${currentUser.id}&select=id,created_at&created_at=gte.${sixMonthsAgoIso}` }),
                        supabase.getClient().from('nutrition_logs').select('logged_at').eq('user_id', currentUser.id).gte('logged_at', sixMonthsAgoIso),
                        supabase.getClient().from('water_logs').select('date,created_at').eq('user_id', currentUser.id).gte('date', sixMonthsAgoDateOnly),
                        supabase.getClient().from('vitamin_logs').select('logged_at').eq('user_id', currentUser.id).gte('logged_at', sixMonthsAgoIso),
                        supabase.getClient().from('mineral_logs').select('created_at').eq('user_id', currentUser.id).gte('created_at', sixMonthsAgoIso),
                        supabase.getClient().from('assigned_workouts').select('completed_at,is_completed,client_feedback').eq('client_id', currentUser.id).gte('scheduled_date', sixMonthsAgoDateOnly),
                    ]);
                    if (leagueResult.status === 'fulfilled')
                        setLeagueData(leagueResult.value);
                    if (streakResult.status === 'fulfilled')
                        setStreakData(streakResult.value);
                    if (currencyResult.status === 'fulfilled')
                        setCurrency(currencyResult.value);
                    if (workoutResult.status === 'fulfilled') {
                        const v = workoutResult.value;
                        if (v && v.ok && Array.isArray(v.data)) {
                            setWorkoutCount(v.data.length || 0);
                            buildMonthlyTracking(v.data, nutritionResult.status === 'fulfilled' ? ((_a = nutritionResult.value) === null || _a === void 0 ? void 0 : _a.data) || [] : [], waterResult.status === 'fulfilled' ? ((_b = waterResult.value) === null || _b === void 0 ? void 0 : _b.data) || [] : [], vitaminResult.status === 'fulfilled' ? ((_c = vitaminResult.value) === null || _c === void 0 ? void 0 : _c.data) || [] : [], mineralResult.status === 'fulfilled' ? ((_d = mineralResult.value) === null || _d === void 0 ? void 0 : _d.data) || [] : [], assignedResult.status === 'fulfilled' ? ((_e = assignedResult.value) === null || _e === void 0 ? void 0 : _e.data) || [] : []);
                        }
                        else if (v && typeof v.data === 'object' && 'count' in v.data)
                            setWorkoutCount(v.data.count || 0);
                    }
                    // Professional check — keep using client for reliability
                    try {
                        const { data: profData } = yield supabase.getClient()
                            .from('professional_profiles')
                            .select('professional_type')
                            .eq('user_id', currentUser.id)
                            .eq('is_active', true)
                            .maybeSingle();
                        setIsProfessional(!!profData);
                    }
                    catch (_) { }
                }
                else {
                    // Native / fallback: original flow
                    const { data } = yield supabase.getUserProfile(currentUser.id);
                    setProfile(data);
                    // Load gamification data in parallel
                    const [leagueResult, streakResult, currencyResult, workoutCountResult, workoutProgressResult, nutritionResult, waterResult, vitaminResult, mineralResult, assignedResult] = yield Promise.allSettled([
                        leagueService_1.LeagueService.getInstance().getUserLeague(),
                        streakService_1.StreakService.getInstance().getStreak(),
                        storeService_1.StoreService.getInstance().getUserCurrency(),
                        supabase.getClient().from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
                        supabase.getClient()
                            .from('workouts')
                            .select('id,created_at')
                            .eq('user_id', currentUser.id)
                            .gte('created_at', sixMonthsAgoIso)
                            .order('created_at', { ascending: false }),
                        supabase.getClient().from('nutrition_logs').select('logged_at').eq('user_id', currentUser.id).gte('logged_at', sixMonthsAgoIso),
                        supabase.getClient().from('water_logs').select('date,created_at').eq('user_id', currentUser.id).gte('date', sixMonthsAgoDateOnly),
                        supabase.getClient().from('vitamin_logs').select('logged_at').eq('user_id', currentUser.id).gte('logged_at', sixMonthsAgoIso),
                        supabase.getClient().from('mineral_logs').select('created_at').eq('user_id', currentUser.id).gte('created_at', sixMonthsAgoIso),
                        supabase.getClient().from('assigned_workouts').select('completed_at,is_completed,client_feedback').eq('client_id', currentUser.id).gte('scheduled_date', sixMonthsAgoDateOnly),
                    ]);
                    if (leagueResult.status === 'fulfilled')
                        setLeagueData(leagueResult.value);
                    if (streakResult.status === 'fulfilled')
                        setStreakData(streakResult.value);
                    if (currencyResult.status === 'fulfilled')
                        setCurrency(currencyResult.value);
                    if (workoutCountResult.status === 'fulfilled')
                        setWorkoutCount(workoutCountResult.value.count || 0);
                    if (workoutProgressResult.status === 'fulfilled') {
                        const workoutRows = workoutProgressResult.value.data || [];
                        buildMonthlyTracking(workoutRows, nutritionResult.status === 'fulfilled' ? ((_f = nutritionResult.value) === null || _f === void 0 ? void 0 : _f.data) || [] : [], waterResult.status === 'fulfilled' ? ((_g = waterResult.value) === null || _g === void 0 ? void 0 : _g.data) || [] : [], vitaminResult.status === 'fulfilled' ? ((_h = vitaminResult.value) === null || _h === void 0 ? void 0 : _h.data) || [] : [], mineralResult.status === 'fulfilled' ? ((_j = mineralResult.value) === null || _j === void 0 ? void 0 : _j.data) || [] : [], assignedResult.status === 'fulfilled' ? ((_k = assignedResult.value) === null || _k === void 0 ? void 0 : _k.data) || [] : []);
                    }
                    const { data: profData } = yield supabase.getClient()
                        .from('professional_profiles')
                        .select('professional_type')
                        .eq('user_id', currentUser.id)
                        .eq('is_active', true)
                        .maybeSingle();
                    setIsProfessional(!!profData);
                }
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
    }), [contextUser, proxiedFetch, buildMonthlyTracking]);
    (0, native_1.useFocusEffect)((0, react_1.useCallback)(() => {
        loadProfile();
    }, [loadProfile]));
    const parseBirthDate = (value) => {
        if (!value || typeof value !== 'string')
            return null;
        const normalized = value.trim();
        const direct = new Date(normalized);
        if (!Number.isNaN(direct.getTime()))
            return direct;
        const parts = normalized.split(/[./-]/).map((p) => Number(p));
        if (parts.length === 3) {
            const [p1, p2, p3] = parts;
            if (p3 > 1900 && p3 < 3000) {
                const dayFirst = new Date(p3, p2 - 1, p1);
                if (!Number.isNaN(dayFirst.getTime()))
                    return dayFirst;
            }
        }
        return null;
    };
    const calculateAge = (dob) => {
        const bd = parseBirthDate(dob);
        if (!bd)
            return null;
        const today = new Date();
        let age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate()))
            age--;
        return age;
    };
    const handleLogout = () => {
        showAlert({
            type: 'confirm',
            title: t('signOut'),
            message: t('logout_confirm_msg'),
            buttons: [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('signOut'), style: 'destructive',
                    onPress: () => __awaiter(void 0, void 0, void 0, function* () { const s = supabase_1.SupabaseService.getInstance(); yield s.signOut(); navigation.replace('Auth'); })
                },
            ],
        });
    };
    const birthDate = (profile === null || profile === void 0 ? void 0 : profile.dob) || (profile === null || profile === void 0 ? void 0 : profile.birth_date) || (profile === null || profile === void 0 ? void 0 : profile.date_of_birth) || null;
    const age = birthDate ? calculateAge(birthDate) : null;
    const name = (profile === null || profile === void 0 ? void 0 : profile.full_name) || ((profile === null || profile === void 0 ? void 0 : profile.first_name) ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile === null || profile === void 0 ? void 0 : profile.username) || t('user_default');
    const streak = (streakData === null || streakData === void 0 ? void 0 : streakData.currentStreak) || 0;
    const totalXP = (leagueData === null || leagueData === void 0 ? void 0 : leagueData.totalXp) || 0;
    const tierInfo = leagueData ? leagueService_1.LEAGUE_TIERS.find(l => l.tier === leagueData.currentTier) || leagueService_1.LEAGUE_TIERS[0] : leagueService_1.LEAGUE_TIERS[0];
    // Memoized health calculations to prevent re-renders
    const healthStats = react_1.default.useMemo(() => {
        if (!(profile === null || profile === void 0 ? void 0 : profile.height) || !(profile === null || profile === void 0 ? void 0 : profile.weight))
            return null;
        const h = profile.height / 100; // meters
        const w = profile.weight;
        const bmi = w / (h * h);
        const bmiCategory = bmi < 18.5 ? t('bmi_underweight')
            : bmi < 25 ? t('bmi_normal')
                : bmi < 30 ? t('bmi_overweight')
                    : t('bmi_obese');
        const bmiColor = bmi < 18.5 ? '#1CB0F6' : bmi < 25 ? '#58CC02' : bmi < 30 ? '#FF9600' : '#FF4B4B';
        // BMR (Mifflin-St Jeor)
        let bmr = 10 * w + 6.25 * profile.height - 5 * (age || 25);
        bmr = (profile === null || profile === void 0 ? void 0 : profile.gender) === 'female' ? bmr - 161 : bmr + 5;
        const tdee = Math.round(bmr * 1.55); // moderate activity
        const proteinNeed = Math.round(w * 1.8);
        return { bmi, bmiCategory, bmiColor, bmr, tdee, proteinNeed };
    }, [profile === null || profile === void 0 ? void 0 : profile.height, profile === null || profile === void 0 ? void 0 : profile.weight, profile === null || profile === void 0 ? void 0 : profile.gender, age, isTurkish]);
    const trackingChartData = react_1.default.useMemo(() => ({
        labels: monthlyTracking.labels.length > 0 ? monthlyTracking.labels : [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun')],
        datasets: (monthlyTracking.datasets.length > 0 ? monthlyTracking.datasets : [
            { label: isTurkish ? 'Spor' : 'Workout', data: [0, 0, 0, 0, 0, 0], color: '#1CB0F6' },
            { label: isTurkish ? 'Beslenme' : 'Nutrition', data: [0, 0, 0, 0, 0, 0], color: '#FF9600' },
            { label: isTurkish ? 'Su' : 'Water', data: [0, 0, 0, 0, 0, 0], color: '#00B7FF' },
            { label: isTurkish ? 'Vitamin' : 'Vitamin', data: [0, 0, 0, 0, 0, 0], color: '#8E44AD' },
            { label: isTurkish ? 'Mineral' : 'Mineral', data: [0, 0, 0, 0, 0, 0], color: '#2ECC71' },
        ]).map((dataset) => ({
            data: dataset.data,
            color: () => dataset.color,
            strokeWidth: 2,
        })),
    }), [monthlyTracking, t, isTurkish]);
    const trackingLegend = react_1.default.useMemo(() => (monthlyTracking.datasets.length > 0 ? monthlyTracking.datasets : [
        { label: isTurkish ? 'Spor' : 'Workout', data: [], color: '#1CB0F6' },
        { label: isTurkish ? 'Beslenme' : 'Nutrition', data: [], color: '#FF9600' },
        { label: isTurkish ? 'Su' : 'Water', data: [], color: '#00B7FF' },
        { label: isTurkish ? 'Vitamin' : 'Vitamin', data: [], color: '#8E44AD' },
        { label: isTurkish ? 'Mineral' : 'Mineral', data: [], color: '#2ECC71' },
    ]), [monthlyTracking.datasets, isTurkish]);
    const programProgressData = react_1.default.useMemo(() => ({
        labels: monthlyProgramProgress.labels.length > 0 ? monthlyProgramProgress.labels : [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun')],
        datasets: [{ data: monthlyProgramProgress.data.length > 0 ? monthlyProgramProgress.data : [0, 0, 0, 0, 0, 0] }],
    }), [monthlyProgramProgress, t]);
    const achievements = react_1.default.useMemo(() => ([
        { icon: 'flame', iconColor: '#FF6B6B', bg: '#FFF0F0', label: t('week_streak'), unlocked: streak >= 7 },
        { icon: 'flash', iconColor: '#FFC800', bg: '#FFFBEB', label: '100 XP', unlocked: totalXP >= 100 },
        { icon: 'trophy', iconColor: '#FF9600', bg: '#FFF5EB', label: t('top_10'), unlocked: ((leagueData === null || leagueData === void 0 ? void 0 : leagueData.rankInGroup) || 0) > 0 && ((leagueData === null || leagueData === void 0 ? void 0 : leagueData.rankInGroup) || 99) <= 10 },
        { icon: 'barbell', iconColor: '#1CB0F6', bg: '#E0F4FF', label: t('workouts_10'), unlocked: workoutCount >= 10 },
        { icon: 'fitness', iconColor: '#58CC02', bg: '#E8FFE0', label: t('strong'), unlocked: workoutCount >= 50 },
        { icon: 'rocket', iconColor: '#CE82FF', bg: '#F5F0FF', label: t('day_one'), unlocked: true },
        { icon: 'star', iconColor: '#FFD700', bg: '#FFFBEB', label: '500 XP', unlocked: totalXP >= 500 },
        { icon: 'medal', iconColor: '#CD7F32', bg: '#FFF5EB', label: t('streak_30_day'), unlocked: streak >= 30 },
        { icon: 'shield-checkmark', iconColor: '#0F52BA', bg: '#E0F4FF', label: t('top_3'), unlocked: ((leagueData === null || leagueData === void 0 ? void 0 : leagueData.rankInGroup) || 0) > 0 && ((leagueData === null || leagueData === void 0 ? void 0 : leagueData.rankInGroup) || 99) <= 3 },
        { icon: 'restaurant', iconColor: '#FF9600', bg: '#FFF5EB', label: t('meals_50'), unlocked: false },
        { icon: 'water', iconColor: '#1CB0F6', bg: '#E0F4FF', label: t('hydrated'), unlocked: false },
        { icon: 'ribbon', iconColor: '#E0115F', bg: '#FFF0F5', label: t('promoted'), unlocked: ((leagueData === null || leagueData === void 0 ? void 0 : leagueData.promotionCount) || 0) > 0 },
        { icon: 'sparkles', iconColor: '#B9F2FF', bg: '#F0FAFF', label: '1000 XP', unlocked: totalXP >= 1000 },
        { icon: 'body', iconColor: '#58CC02', bg: '#E8FFE0', label: t('workouts_100'), unlocked: workoutCount >= 100 },
        { icon: 'heart', iconColor: '#FF4B4B', bg: '#FFF0F0', label: t('healthy'), unlocked: false },
        { icon: 'people', iconColor: '#CE82FF', bg: '#F5F0FF', label: t('social'), unlocked: false },
        { icon: 'trending-up', iconColor: '#58CC02', bg: '#E8FFE0', label: t('goal_5kg'), unlocked: false },
        { icon: 'time', iconColor: '#FF9600', bg: '#FFF5EB', label: t('streak_90_day'), unlocked: streak >= 90 },
        { icon: 'diamond', iconColor: '#0F52BA', bg: '#E0F4FF', label: '5000 XP', unlocked: totalXP >= 5000 },
        { icon: 'globe', iconColor: '#1CB0F6', bg: '#E0F4FF', label: t('world_league'), unlocked: ((leagueData === null || leagueData === void 0 ? void 0 : leagueData.currentTier) || 1) >= 10 },
    ]), [isTurkish, streak, totalXP, leagueData, workoutCount]);
    const menuItems = react_1.default.useMemo(() => ([
        ...(isProfessional ? [
            { icon: 'briefcase-outline', title: t('professional_panel'), color: '#8B5CF6', onPress: () => navigation.navigate('ProfessionalHome') },
            { icon: 'people-circle-outline', title: t('my_clients'), color: '#06B6D4', onPress: () => navigation.navigate('ClientsList') },
        ] : []),
        { icon: 'trophy-outline', title: t('league_rankings'), color: '#FFC800', onPress: () => navigation.navigate('League') },
        { icon: 'cart-outline', title: t('store'), color: '#58CC02', onPress: () => navigation.navigate('Store') },
        { icon: 'stats-chart-outline', title: t('progress_report'), color: '#3498db', onPress: () => navigation.navigate('ProgressReport') },
        { icon: 'scale-outline', title: t('smart_scale'), color: '#FF9600', onPress: () => navigation.navigate('SmartScale') },
        { icon: 'people-outline', title: t('find_pt_dietitian'), color: '#1CB0F6', onPress: () => navigation.navigate('ProfessionalSearch') },
        { icon: 'shield-checkmark-outline', title: t('data_privacy'), color: '#CE82FF', onPress: () => navigation.navigate('DataPrivacy') },
    ]), [isProfessional, isTurkish, navigation]);
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <AlertComponent />

      {/* Top Header Row with Back + Settings */}
      <react_native_1.View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme_1.SPACING.lg, paddingTop: theme_1.SPACING.sm }}>
        <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, isProfessional ? 'ProfessionalMain' : 'Main')} style={{ padding: 8 }}>
          <vector_icons_1.Ionicons name="chevron-back" size={26} color={colors.text}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8 }}>
          <vector_icons_1.Ionicons name="settings-outline" size={26} color={colors.text}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={[styles.scroll]} showsVerticalScrollIndicator={false}>
        <react_native_1.Animated.View style={{ opacity: fadeAnim }}>

          <react_native_1.View style={styles.avatarSection}>
            <react_native_1.View style={styles.avatar}>
              {(profile === null || profile === void 0 ? void 0 : profile.avatar_url) ? (<react_native_1.Image source={{ uri: profile.avatar_url }} style={{ width: 74, height: 74, borderRadius: 37 }}/>) : (<vector_icons_1.Ionicons name="person" size={36} color="#58CC02"/>)}
            </react_native_1.View>
            <react_native_1.Text style={styles.name}>{name}</react_native_1.Text>
            <react_native_1.Text style={styles.handle}>@{(profile === null || profile === void 0 ? void 0 : profile.username) || 'user'} • Joined {(profile === null || profile === void 0 ? void 0 : profile.created_at) ? new Date(profile.created_at).toLocaleString('en-US', { month: 'short', year: 'numeric' }) : 'Feb 2026'}</react_native_1.Text>

            {/* Edit Profile Button */}
            <react_native_1.View style={{ alignItems: 'center', marginTop: theme_1.SPACING.md }}>
              <react_native_1.TouchableOpacity onPress={() => navigation.navigate('EditProfile', { profile })} style={{ paddingHorizontal: theme_1.SPACING.xl, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: colors.border }}>
                <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { color: colors.text, fontSize: 13 })}>{t('edit_profile')}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>

          {/* ─── BIO INFO (height, weight, gender, age) ─── */}
          <react_native_1.View style={styles.bioGrid}>
            <react_native_1.View style={styles.bioCard}>
              <vector_icons_1.Ionicons name="resize" size={18} color="#1CB0F6"/>
              <react_native_1.Text style={styles.bioValue}>{(profile === null || profile === void 0 ? void 0 : profile.height) ? `${profile.height} cm` : '--'}</react_native_1.Text>
              <react_native_1.Text style={styles.bioLabel}>{t('height')}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.bioCard}>
              <vector_icons_1.Ionicons name="barbell" size={18} color="#FF9600"/>
              <react_native_1.Text style={styles.bioValue}>{(profile === null || profile === void 0 ? void 0 : profile.weight) ? `${profile.weight} kg` : '--'}</react_native_1.Text>
              <react_native_1.Text style={styles.bioLabel}>{t('weight')}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.bioCard}>
              <vector_icons_1.Ionicons name={(profile === null || profile === void 0 ? void 0 : profile.gender) === 'female' ? 'female' : 'male'} size={18} color="#CE82FF"/>
              <react_native_1.Text style={styles.bioValue}>{(profile === null || profile === void 0 ? void 0 : profile.gender) === 'female' ? t('gender_female') : (profile === null || profile === void 0 ? void 0 : profile.gender) === 'male' ? t('gender_male') : '--'}</react_native_1.Text>
              <react_native_1.Text style={styles.bioLabel}>{t('gender')}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.bioCard}>
              <vector_icons_1.Ionicons name="calendar" size={18} color="#FF4B4B"/>
              <react_native_1.Text style={styles.bioValue}>{age !== null && age !== void 0 ? age : '--'}</react_native_1.Text>
              <react_native_1.Text style={styles.bioLabel}>{t('age') || (isTurkish ? 'Yaş' : 'Age')}</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>

          {/* ─── HEALTH CALCULATIONS (BMI, BMR, TDEE) ─── */}
          {healthStats ? (<react_native_1.View style={{ marginBottom: 16 }}>
                <react_native_1.Text style={styles.sectionTitle}>{t('body_analysis')}</react_native_1.Text>
                <react_native_1.View style={styles.bioGrid}>
                  <react_native_1.View style={[styles.bioCard, { borderWidth: 1.5, borderColor: healthStats.bmiColor + '30' }]}>
                    <vector_icons_1.Ionicons name="analytics" size={18} color={healthStats.bmiColor}/>
                    <react_native_1.Text style={[styles.bioValue, { color: healthStats.bmiColor }]}>{healthStats.bmi.toFixed(1)}</react_native_1.Text>
                    <react_native_1.Text style={styles.bioLabel}>BMI • {healthStats.bmiCategory}</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={styles.bioCard}>
                    <vector_icons_1.Ionicons name="flame" size={18} color="#FF6B6B"/>
                    <react_native_1.Text style={styles.bioValue}>{Math.round(healthStats.bmr)}</react_native_1.Text>
                    <react_native_1.Text style={styles.bioLabel}>BMR (kcal)</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={styles.bioCard}>
                    <vector_icons_1.Ionicons name="trending-up" size={18} color="#58CC02"/>
                    <react_native_1.Text style={styles.bioValue}>{healthStats.tdee}</react_native_1.Text>
                    <react_native_1.Text style={styles.bioLabel}>TDEE (kcal)</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={styles.bioCard}>
                    <vector_icons_1.Ionicons name="restaurant" size={18} color="#FF9600"/>
                    <react_native_1.Text style={styles.bioValue}>{healthStats.proteinNeed}g</react_native_1.Text>
                    <react_native_1.Text style={styles.bioLabel}>{isTurkish ? 'Protein İht.' : 'Protein Need'}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
              </react_native_1.View>) : null}

          {/* ─── STATISTICS (2x2 colored cards like Duolingo) ─── */}
          <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'İstatistikler' : 'Statistics'}</react_native_1.Text>
          <react_native_1.View style={styles.statsGrid}>
            <react_native_1.View style={[styles.statCard, { backgroundColor: '#FFF5F0', width: STAT_W }]}>
              <react_native_1.View style={[styles.statIcon, { backgroundColor: '#FFDED0' }]}>
                <vector_icons_1.Ionicons name="flame" size={22} color="#FF6B6B"/>
              </react_native_1.View>
              <react_native_1.View>
                <react_native_1.Text style={styles.statValue}>{streak}</react_native_1.Text>
                <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Gün Serisi' : 'Day Streak'}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
            <react_native_1.View style={[styles.statCard, { backgroundColor: '#FFFBEB', width: STAT_W }]}>
              <react_native_1.View style={[styles.statIcon, { backgroundColor: '#FFF0C1' }]}>
                <vector_icons_1.Ionicons name="flash" size={22} color="#FFC800"/>
              </react_native_1.View>
              <react_native_1.View>
                <react_native_1.Text style={styles.statValue}>{totalXP}</react_native_1.Text>
                <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Toplam XP' : 'Total XP'}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
            <react_native_1.TouchableOpacity style={[styles.statCard, { backgroundColor: '#F5F0FF', width: STAT_W }]} onPress={() => navigation.navigate('League')}>
              <react_native_1.View style={[styles.statIcon, { backgroundColor: '#E8DEFF' }]}>
                <LeagueTierIcon_1.default tier={tierInfo.tier} size={24}/>
              </react_native_1.View>
              <react_native_1.View>
                <react_native_1.Text style={styles.statValue}>{isTurkish ? tierInfo.nameTr : tierInfo.name}</react_native_1.Text>
                <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Lig' : 'League'}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.TouchableOpacity>
            <react_native_1.View style={[styles.statCard, { backgroundColor: '#EBF5FF', width: STAT_W }]}>
              <react_native_1.View style={[styles.statIcon, { backgroundColor: '#D0E8FF' }]}>
                <vector_icons_1.Ionicons name="fitness" size={22} color="#1CB0F6"/>
              </react_native_1.View>
              <react_native_1.View>
                <react_native_1.Text style={styles.statValue}>{workoutCount}</react_native_1.Text>
                <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Antrenman' : 'Workouts'}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>

          {/* ─── ACHIEVEMENTS (horizontal scroll like Duolingo) ─── */}
          <react_native_1.View style={styles.sectionRow}>
            <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Başarımlar' : 'Achievements'}</react_native_1.Text>
            <react_native_1.TouchableOpacity><react_native_1.Text style={styles.viewAll}>{isTurkish ? 'TÜMÜ' : 'VIEW ALL'}</react_native_1.Text></react_native_1.TouchableOpacity>
          </react_native_1.View>
          <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achieveScroll}>
            {achievements.map((a, i) => (<react_native_1.View key={i} style={[styles.achieveCard, !a.unlocked && styles.achieveLocked, { backgroundColor: a.unlocked ? a.bg : colors.surface }]}>
                <react_native_1.View style={[styles.achieveIconWrap, { backgroundColor: a.unlocked ? a.iconColor + '20' : '#F0F0F0' }]}>
                  <vector_icons_1.Ionicons name={a.icon} size={22} color={a.unlocked ? a.iconColor : colors.textTertiary}/>
                </react_native_1.View>
                <react_native_1.Text style={[styles.achieveLabel, !a.unlocked && { color: colors.textTertiary }]}>{a.label}</react_native_1.Text>
              </react_native_1.View>))}
          </react_native_1.ScrollView>

          {/* ─── PROGRESS CHART ─── */}
          {LineChart && (<>
              <react_native_1.View style={styles.chartCard}>
                <react_native_1.Text style={styles.chartTitle}>{isTurkish ? 'Aylık Takipler' : 'Monthly Tracking'}</react_native_1.Text>
                <react_native_1.View style={styles.legendWrap}>
                  {trackingLegend.map((legendItem) => (<react_native_1.View key={legendItem.label} style={styles.legendItem}>
                      <react_native_1.View style={[styles.legendDot, { backgroundColor: legendItem.color }]}/>
                      <react_native_1.Text style={styles.legendText}>{legendItem.label}</react_native_1.Text>
                    </react_native_1.View>))}
                </react_native_1.View>
                <LineChart data={trackingChartData} width={width - 40 - 32} height={180} chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(88, 204, 2, ${opacity})`,
                labelColor: () => colors.textTertiary,
                propsForDots: { r: '3', strokeWidth: '1' },
                propsForBackgroundLines: { stroke: '#F0F0F0', strokeDasharray: '' }
            }} bezier style={{ borderRadius: 12, marginLeft: -8 }} withShadow={false}/>
              </react_native_1.View>

              <react_native_1.View style={styles.chartCard}>
                <react_native_1.Text style={styles.chartTitle}>{isTurkish ? 'Program Bazlı Spor Takibi' : 'Program Workout Tracking'}</react_native_1.Text>
                <react_native_1.View style={styles.programSummaryRow}>
                  <react_native_1.View style={[styles.programSummaryChip, { backgroundColor: '#E8FFE0' }]}>
                    <react_native_1.Text style={[styles.programSummaryText, { color: '#2E7D32' }]}>{isTurkish ? 'Artır' : 'Increase'}: {programAdjustments.increase}</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={[styles.programSummaryChip, { backgroundColor: '#E0F4FF' }]}>
                    <react_native_1.Text style={[styles.programSummaryText, { color: '#1CB0F6' }]}>{isTurkish ? 'Sabit' : 'Stable'}: {programAdjustments.stable}</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={[styles.programSummaryChip, { backgroundColor: '#FFF5EB' }]}>
                    <react_native_1.Text style={[styles.programSummaryText, { color: '#FF9600' }]}>{isTurkish ? 'Azalt' : 'Decrease'}: {programAdjustments.decrease}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
                <LineChart data={programProgressData} width={width - 40 - 32} height={150} chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(88, 204, 2, ${opacity})`,
                labelColor: () => colors.textTertiary,
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#58CC02' },
                propsForBackgroundLines: { stroke: '#F0F0F0', strokeDasharray: '' }
            }} bezier style={{ borderRadius: 12, marginLeft: -8 }} withShadow={false}/>
              </react_native_1.View>
            </>)}



          {/* ─── MENU ITEMS ─── */}
          <react_native_1.View style={styles.menuCard}>
            {menuItems.map((item, i) => (<react_native_1.TouchableOpacity key={i} style={[styles.menuItem, i < menuItems.length - 1 && styles.menuBorder]} onPress={item.onPress} activeOpacity={0.6}>
                <react_native_1.View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <vector_icons_1.Ionicons name={item.icon} size={20} color={item.color}/>
                </react_native_1.View>
                <react_native_1.Text style={styles.menuTitle}>{item.title}</react_native_1.Text>
                <vector_icons_1.Ionicons name="chevron-forward" size={18} color="#D1D5DB"/>
              </react_native_1.TouchableOpacity>))}
          </react_native_1.View>

          {/* ─── SIGN OUT ─── */}
          <react_native_1.TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <react_native_1.Text style={styles.logoutText}>{isTurkish ? 'Çıkış Yap' : 'Sign Out'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>

          <react_native_1.View style={{ height: 100 }}/>
        </react_native_1.Animated.View>
      </react_native_1.ScrollView>
    </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    scroll: { paddingHorizontal: 20 },
    // Avatar
    avatarSection: { alignItems: 'center', marginBottom: 28 },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#58CC02', marginBottom: 14,
    },
    name: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 2 },
    handle: { fontSize: 13, color: colors.textTertiary, marginBottom: 18 },
    // Bio info
    bioGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, gap: 10, paddingHorizontal: 4 },
    bioCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F0F0F0' },
    bioValue: { fontSize: 15, fontWeight: '700', color: colors.text },
    bioLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary },
    // Section
    sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    viewAll: { fontSize: 13, fontWeight: '700', color: '#58CC02' },
    // Stats Grid (2x2 like Duolingo)
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
    statCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 18, paddingHorizontal: 16, borderRadius: 18,
    },
    statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
    // Achievements
    achieveScroll: { gap: 12, paddingBottom: 4, marginBottom: 28 },
    achieveCard: {
        alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18,
        backgroundColor: colors.surface, borderRadius: 18, minWidth: 80,
        borderWidth: 1, borderColor: '#F0F0F0',
    },
    achieveLocked: { opacity: 0.5, borderStyle: 'dashed' },
    achieveIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    achieveLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 8, textAlign: 'center', maxWidth: 70 },
    // Chart
    chartCard: {
        backgroundColor: colors.surface, borderRadius: 20, padding: 18,
        marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0',
    },
    chartTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
    legendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.background },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
    programSummaryRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    programSummaryChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    programSummaryText: { fontSize: 11, fontWeight: '700' },
    // Menu
    menuCard: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    menuIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuTitle: { fontSize: 14, fontWeight: '500', color: colors.text, flex: 1 },
    // Logout
    logoutBtn: {
        alignItems: 'center', paddingVertical: 16,
        borderRadius: 16, borderWidth: 1.5, borderColor: '#FF4B4B',
    },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#FF4B4B' },
});
exports.default = ProfileScreen;
