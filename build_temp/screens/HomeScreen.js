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
const expo_image_1 = require("expo-image");
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const supabase_1 = require("../services/supabase");
const leagueService_1 = require("../services/leagueService");
const paymentService_1 = require("../services/paymentService");
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const PremiumFeaturesModal_1 = __importDefault(require("../components/PremiumFeaturesModal"));
const ThemeContext_1 = require("../contexts/ThemeContext");
const ScreenContainer_1 = __importDefault(require("../components/ScreenContainer"));
const useHomeData_1 = require("../hooks/useHomeData");
const CustomAlert_1 = require("../components/CustomAlert");
const healthService_1 = require("../services/healthService");
// Import new components
const HealthInsightCard_1 = __importDefault(require("../components/HomeScreen/HealthInsightCard"));
const DailyMissionsCard_1 = __importDefault(require("../components/HomeScreen/DailyMissionsCard"));
const DailyProgramChecklist_1 = __importDefault(require("../components/HomeScreen/DailyProgramChecklist"));
let hasShownPremiumPopupSession = false;
const HEALTH_CONNECT_STARTUP_PROMPT_KEY = 'NextSelf_health_connect_startup_prompt_v1';
const HomeScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const s = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { t, isTurkish, language } = (0, useTranslation_1.useTranslation)();
    // Use custom hook for data fetching
    const { profile, streakData, healthInsights, todaysWorkouts, leagueData, currency, dailyMissions, dailyProgram, loading, refreshing, loadData, isOfflineData } = (0, useHomeData_1.useHomeData)(language);
    const { width } = (0, react_native_1.useWindowDimensions)();
    const CARD_W = (width - 40 - 14) / 2;
    const [showPremiumModal, setShowPremiumModal] = (0, react_1.useState)(false);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    // Initial load
    (0, react_1.useEffect)(() => {
        loadData();
        checkForPendingSessions();
    }, [loadData]);
    const checkForPendingSessions = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance().getClient();
            const { data: { user } } = yield supabase.auth.getUser();
            if (!user)
                return;
            // 1. Get active relationships
            const { data: relationships } = yield supabase
                .from('client_relationships')
                .select(`
          id, 
          professional_profiles:professional_id(first_name, last_name),
          trainer_profiles:trainer_id(first_name, last_name),
          dietitian_profiles:dietitian_id(first_name, last_name)
        `)
                .eq('client_id', user.id)
                .eq('status', 'active');
            if (!relationships || relationships.length === 0)
                return;
            const relIds = relationships.map((r) => r.id);
            // 2. Check for pending session requests
            const { data: sessions } = yield supabase
                .from('session_checkins')
                .select('*')
                .in('client_relationship_id', relIds)
                .eq('is_verified', false)
                .ilike('qr_token', 'REQ-%') // Case insensitive like
                .order('created_at', { ascending: false })
                .limit(1);
            if (sessions && sessions.length > 0) {
                const session = sessions[0];
                const rel = relationships.find((r) => r.id === session.client_relationship_id);
                // Extract name from any possible relation
                // @ts-ignore
                const profArray = (rel === null || rel === void 0 ? void 0 : rel.professional_profiles) || (rel === null || rel === void 0 ? void 0 : rel.trainer_profiles) || (rel === null || rel === void 0 ? void 0 : rel.dietitian_profiles);
                const prof = Array.isArray(profArray) ? profArray[0] : profArray;
                const profName = prof ? `${prof.first_name} ${prof.last_name || ''}` : (isTurkish ? 'Eğitmeniniz' : 'Your Trainer');
                showAlert({
                    title: isTurkish ? 'Oturum İsteği' : 'Session Request',
                    message: isTurkish
                        ? `${profName} bir oturum başlatmak istiyor. Onaylıyor musunuz?`
                        : `${profName} wants to start a session. Do you approve?`,
                    type: 'confirm',
                    icon: 'timer-outline',
                    buttons: [
                        {
                            text: isTurkish ? 'Reddet' : 'Deny',
                            style: 'destructive',
                            onPress: () => handleDenySession(session.id)
                        },
                        {
                            text: isTurkish ? 'Onayla' : 'Approve',
                            onPress: () => handleApproveSession(session.id)
                        }
                    ]
                });
            }
        }
        catch (err) {
            console.error('Check pending sessions error:', err);
        }
    });
    const handleApproveSession = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { error } = yield supabase_1.SupabaseService.getInstance().getClient()
                .from('session_checkins')
                .update({
                is_verified: true,
                checkin_time: new Date().toISOString()
            })
                .eq('id', sessionId);
            if (error)
                throw error;
            showAlert({
                title: isTurkish ? 'Başarılı' : 'Success',
                message: isTurkish ? 'Oturum başarıyla onaylandı!' : 'Session approved successfully!',
                type: 'success'
            });
        }
        catch (err) {
            console.error(err);
            showAlert({ title: isTurkish ? 'Hata' : 'Error', message: 'Failed to approve session', type: 'error' });
        }
    });
    const handleDenySession = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { error } = yield supabase_1.SupabaseService.getInstance().getClient()
                .from('session_checkins')
                .delete()
                .eq('id', sessionId);
            if (error)
                throw error;
        }
        catch (err) {
            console.error(err);
        }
    });
    const showHealthConnectPrompt = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const healthService = healthService_1.HealthService.getInstance();
            yield healthService.initialize();
            const status = yield healthService.getConnectionStatus();
            if (status.apple || status.google)
                return;
            const promptShown = yield platformStorage_1.default.getItem(HEALTH_CONNECT_STARTUP_PROMPT_KEY);
            if (promptShown === '1')
                return;
            if (react_native_1.Platform.OS === 'ios') {
                const autoAppleResult = yield healthService.connectAppleHealth();
                if (autoAppleResult.success) {
                    yield platformStorage_1.default.setItem(HEALTH_CONNECT_STARTUP_PROMPT_KEY, '1');
                    showAlert({
                        type: 'success',
                        title: isTurkish ? 'Apple Health Bağlandı' : 'Apple Health Connected',
                        message: isTurkish ? 'Apple Health bağlantısı otomatik olarak kuruldu.' : 'Apple Health was connected automatically.',
                        buttons: [{ text: 'OK' }]
                    });
                    loadData(true);
                    return;
                }
            }
            else if (react_native_1.Platform.OS === 'android') {
                const autoGoogleResult = yield healthService.connectGoogleHealth();
                if (autoGoogleResult.success) {
                    yield platformStorage_1.default.setItem(HEALTH_CONNECT_STARTUP_PROMPT_KEY, '1');
                    showAlert({
                        type: 'success',
                        title: isTurkish ? 'Health Connect Bağlandı' : 'Health Connect Connected',
                        message: isTurkish ? 'Google Health Connect bağlantısı otomatik olarak kuruldu.' : 'Google Health Connect was connected automatically.',
                        buttons: [{ text: 'OK' }]
                    });
                    loadData(true);
                    return;
                }
            }
            yield platformStorage_1.default.setItem(HEALTH_CONNECT_STARTUP_PROMPT_KEY, '1');
            const isIOS = react_native_1.Platform.OS === 'ios';
            const connectIOS = () => __awaiter(void 0, void 0, void 0, function* () {
                const appleResult = yield healthService.connectAppleHealth();
                if (appleResult.success) {
                    showAlert({
                        type: 'success',
                        title: isTurkish ? 'Apple Health Bağlandı' : 'Apple Health Connected',
                        message: isTurkish ? 'Sağlık bağlantısı kuruldu.' : 'Health connection established.',
                        buttons: [{ text: 'OK' }]
                    });
                    loadData(true);
                }
                else {
                    showAlert({
                        type: 'error',
                        title: isTurkish ? 'Bağlantı Hatası' : 'Connection Error',
                        message: appleResult.error || (isTurkish ? 'Bağlantı kurulamadı.' : 'Connection failed.'),
                        buttons: [{ text: 'OK' }]
                    });
                }
            });
            const connectAndroid = () => __awaiter(void 0, void 0, void 0, function* () {
                const googleResult = yield healthService.connectGoogleHealth();
                if (googleResult.success) {
                    showAlert({
                        type: 'success',
                        title: isTurkish ? 'Health Connect Bağlandı' : 'Health Connect Connected',
                        message: isTurkish ? 'Sağlık bağlantısı kuruldu.' : 'Health connection established.',
                        buttons: [{ text: 'OK' }]
                    });
                    loadData(true);
                    return;
                }
                if (googleResult.needsInstall) {
                    showAlert({
                        type: 'warning',
                        title: isTurkish ? 'Health Connect Gerekli' : 'Health Connect Required',
                        message: isTurkish
                            ? 'Google Health Connect uygulaması yüklü değil. Play Store üzerinden yükleyebilirsiniz.'
                            : 'Google Health Connect is not installed. You can install it from the Play Store.',
                        buttons: [
                            { text: isTurkish ? 'Yükle' : 'Install', onPress: () => healthService.openHealthConnectInstall() },
                            { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
                        ],
                    });
                    return;
                }
                if (googleResult.needsPermission) {
                    showAlert({
                        type: 'confirm',
                        title: isTurkish ? 'İzin Gerekli' : 'Permission Required',
                        message: isTurkish
                            ? 'Health Connect izinlerini açmanız gerekiyor.'
                            : 'You need to enable Health Connect permissions.',
                        buttons: [
                            { text: isTurkish ? 'Ayarları Aç' : 'Open Settings', onPress: () => healthService.openHealthConnectSettings() },
                            { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
                        ],
                    });
                    return;
                }
                showAlert({
                    type: 'error',
                    title: isTurkish ? 'Bağlantı Hatası' : 'Connection Error',
                    message: googleResult.error || (isTurkish ? 'Bağlantı kurulamadı.' : 'Connection failed.'),
                    buttons: [{ text: 'OK' }]
                });
            });
            showAlert({
                title: isIOS
                    ? (isTurkish ? 'Apple Health Bağlantısı' : 'Apple Health Connection')
                    : (isTurkish ? 'Health Connect Bağlantısı' : 'Health Connect Connection'),
                message: isTurkish
                    ? (isIOS
                        ? 'Apple Health verilerini otomatik senkronize etmek için şimdi bağlanmak ister misin?'
                        : 'Google Health Connect verilerini otomatik senkronize etmek için şimdi bağlanmak ister misin?')
                    : (isIOS
                        ? 'Would you like to connect Apple Health now to sync your data automatically?'
                        : 'Would you like to connect Google Health Connect now to sync your data automatically?'),
                type: 'confirm',
                buttons: [
                    { text: isTurkish ? 'Sonra' : 'Later', style: 'cancel' },
                    {
                        text: isIOS
                            ? (isTurkish ? 'Apple Health’e Bağlan' : 'Connect Apple Health')
                            : (isTurkish ? 'Health Connect’e Bağlan' : 'Connect Health Connect'),
                        onPress: () => __awaiter(void 0, void 0, void 0, function* () {
                            if (isIOS) {
                                yield connectIOS();
                            }
                            else {
                                yield connectAndroid();
                            }
                        }),
                    },
                ],
            });
        }
        catch (err) {
            console.warn('Health startup prompt error:', err);
        }
    }), [isTurkish, showAlert, loadData]);
    // Check premium status and show popup on first app launch only (per session)
    (0, react_1.useEffect)(() => {
        const checkFirstLaunchPremium = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    // Use session variable instead of persistent storage
                    if (!hasShownPremiumPopupSession) {
                        const isPremium = yield paymentService_1.PaymentService.getInstance().hasPremiumFeatures(user.id);
                        if (!isPremium) {
                            setShowPremiumModal(true);
                            hasShownPremiumPopupSession = true;
                        }
                    }
                }
            }
            catch (err) {
                console.warn('First launch premium check error:', err);
            }
        });
        if (!loading && profile) {
            checkFirstLaunchPremium();
            showHealthConnectPrompt();
        }
    }, [loading, profile, showHealthConnectPrompt]);
    const onRefresh = (0, react_1.useCallback)(() => {
        loadData(true);
    }, [loadData]);
    (0, react_1.useEffect)(() => {
        if (!loading) {
            react_native_1.Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [loading, fadeAnim]);
    const handleClosePremiumModal = () => setShowPremiumModal(false);
    const handleToggleItem = (id, type, currentStatus) => {
        if (currentStatus)
            return;
        if (type === 'workout') {
            navigation.navigate('ActiveWorkout', { workoutId: id, assignmentId: id });
        }
        else if (type === 'meal') {
            navigation.navigate('Nutrition', { planId: id });
        }
        else if (type === 'supplement') {
            navigation.navigate('Supplement', { supplementId: id });
        }
    };
    if (loading && !isOfflineData) {
        return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, theme_1.COMMON_STYLES.center]}><react_native_1.ActivityIndicator size="large" color={colors.primary}/></react_native_1.View>);
    }
    const name = (profile === null || profile === void 0 ? void 0 : profile.full_name) || (profile === null || profile === void 0 ? void 0 : profile.first_name) || (profile === null || profile === void 0 ? void 0 : profile.username) || t('athlete');
    const streak = (streakData === null || streakData === void 0 ? void 0 : streakData.currentStreak) || 0;
    const tierInfo = leagueData ? leagueService_1.LEAGUE_TIERS.find(l => l.tier === leagueData.currentTier) || leagueService_1.LEAGUE_TIERS[0] : leagueService_1.LEAGUE_TIERS[0];
    return (<ScreenContainer_1.default edges={['top', 'left', 'right']}>
      <AlertComponent />
      <react_native_1.ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 100 }]} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary}/>} showsVerticalScrollIndicator={false}>
        <react_native_1.Animated.View style={{ opacity: fadeAnim }}>

          {/* ─── HEADER ─── */}
          <react_native_1.View style={[s.header, { marginTop: 12 }]}>
            <react_native_1.View>
              <react_native_1.Text style={s.greeting}>{t('hello')}</react_native_1.Text>
              <react_native_1.Text style={s.name}>{name}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={s.headerRight}>
              {/* Coins */}
              <react_native_1.TouchableOpacity style={s.coinBadge} onPress={() => navigation.navigate('Store')}>
                <vector_icons_1.Ionicons name="cash-outline" size={16} color="#FFB800"/>
                <react_native_1.Text style={s.coinNum}>{(currency === null || currency === void 0 ? void 0 : currency.points) || 0}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.View style={s.streakBadge}>
                <vector_icons_1.Ionicons name="flame" size={18} color="#FF9600"/>
                <react_native_1.Text style={s.streakNum}>{streak}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.TouchableOpacity style={s.avatarBtn} onPress={() => navigation.navigate('Profile')}>
                {(profile === null || profile === void 0 ? void 0 : profile.avatar_url) ? (<expo_image_1.Image source={{ uri: profile.avatar_url }} style={s.avatarImg} contentFit="cover" cachePolicy="memory-disk" transition={500}/>) : (<vector_icons_1.Ionicons name="person" size={20} color="#58CC02"/>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>

          {/* ─── GAMIFICATION BAR (League + XP) ─── */}
          <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('League')} style={s.gamifBar}>
            <react_native_1.View style={s.gamifLeft}>
              <react_native_1.Text style={{ fontSize: 22 }}>{tierInfo.icon}</react_native_1.Text>
              <react_native_1.View style={{ marginLeft: 10 }}>
                <react_native_1.Text style={s.gamifLeague}>{t(`tier_${tierInfo.name.toLowerCase()}`)}</react_native_1.Text>
                <react_native_1.Text style={s.gamifRank}>{t('league')}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
            <react_native_1.View style={s.gamifRight}>
              <react_native_1.View style={s.xpBarOuter}>
                <react_native_1.View style={[s.xpBarInner, { width: `${Math.min(((leagueData === null || leagueData === void 0 ? void 0 : leagueData.weeklyXp) || 0) / 500 * 100, 100)}%` }]}/>
              </react_native_1.View>
              <react_native_1.Text style={s.xpText}>{(leagueData === null || leagueData === void 0 ? void 0 : leagueData.weeklyXp) || 0} XP</react_native_1.Text>
            </react_native_1.View>
            <vector_icons_1.Ionicons name="chevron-forward" size={18} color={colors.textTertiary}/>
          </react_native_1.TouchableOpacity>

          {/* ─── DAILY PROGRAM CHECKLIST ─── */}
          <DailyProgramChecklist_1.default items={dailyProgram} onToggle={(id, type, status) => handleToggleItem(id, type, status)}/>

          {/* ─── DAILY MISSIONS ─── */}
          <DailyMissionsCard_1.default missions={dailyMissions} onMissionPress={(mission) => navigation.navigate('Missions', { missionId: mission.id })}/>

          {/* ─── TODAY'S WORKOUT ─── */}
          {todaysWorkouts && todaysWorkouts.length > 0 ? (<react_native_1.TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('ActiveWorkout', { workoutId: todaysWorkouts[0].id })}>
              <expo_linear_gradient_1.LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
                <react_native_1.View style={s.heroTag}>
                  <react_native_1.Text style={s.heroTagText}>{t('todays_workout_caps')}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.Text style={s.heroTitle}>{todaysWorkouts[0].name || t('workout')}</react_native_1.Text>
                <react_native_1.Text style={s.heroMeta}>{t('todays_workout_subtitle')}</react_native_1.Text>
                <react_native_1.View style={s.heroBottom}>
                  <react_native_1.View style={s.heroBtn}>
                    <vector_icons_1.Ionicons name="play" size={16} color={colors.background}/>
                    <react_native_1.Text style={s.heroBtnText}>{t('start')}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
              </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>) : null}

          {/* ─── HEALTH INSIGHTS ─── */}
          <HealthInsightCard_1.default insights={healthInsights} refreshing={refreshing} onRefresh={loadData}/>

          {/* ─── TODAY'S WORKOUT PROGRAMS ─── */}
          {/* Duplicate section removed as per user request
        <TodayWorkoutsCard
          workouts={todaysWorkouts}
          onWorkoutPress={(workout) => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}
        />
        */}

          {/* ─── QUICK ACTIONS ─── */}
          <react_native_1.Text style={s.sectionTitle}>{t('quick_actions')}</react_native_1.Text>
          <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickScroll}>
            <react_native_1.TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Sports')} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={['#58CC02', '#38a800']} style={s.quickIconWrap}><vector_icons_1.Ionicons name="sparkles" size={22} color={colors.background}/></expo_linear_gradient_1.LinearGradient>
              <react_native_1.Text style={s.quickLabel}>{t('workout')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('FoodScanner')} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={['#FF9600', '#FF6B6B']} style={s.quickIconWrap}><vector_icons_1.Ionicons name="scan" size={22} color={colors.background}/></expo_linear_gradient_1.LinearGradient>
              <react_native_1.Text style={s.quickLabel}>{t('scan_food')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Nutrition')} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={['#89f7fe', '#66a6ff']} style={s.quickIconWrap}><vector_icons_1.Ionicons name="restaurant" size={22} color={colors.background}/></expo_linear_gradient_1.LinearGradient>
              <react_native_1.Text style={s.quickLabel}>{t('nutrition')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('ProfessionalSearch')} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={['#38ef7d', '#11998e']} style={s.quickIconWrap}><vector_icons_1.Ionicons name="people" size={22} color={colors.background}/></expo_linear_gradient_1.LinearGradient>
              <react_native_1.Text style={s.quickLabel}>{t('find_pt')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Health')} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={['#f093fb', '#f5576c']} style={s.quickIconWrap}><vector_icons_1.Ionicons name="heart" size={22} color={colors.background}/></expo_linear_gradient_1.LinearGradient>
              <react_native_1.Text style={s.quickLabel}>{t('health')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Supplements')} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={['#CE82FF', '#764ba2']} style={s.quickIconWrap}><vector_icons_1.Ionicons name="medkit" size={22} color={colors.background}/></expo_linear_gradient_1.LinearGradient>
              <react_native_1.Text style={s.quickLabel}>{t('supplements')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('WaterTracking')} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={['#1CB0F6', '#0077CC']} style={s.quickIconWrap}><vector_icons_1.Ionicons name="water" size={22} color={colors.background}/></expo_linear_gradient_1.LinearGradient>
              <react_native_1.Text style={s.quickLabel}>{t('water_tracking')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Assignments')} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={['#FFC800', '#FF9600']} style={s.quickIconWrap}><vector_icons_1.Ionicons name="clipboard" size={22} color={colors.background}/></expo_linear_gradient_1.LinearGradient>
              <react_native_1.Text style={s.quickLabel}>{t('tasks')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.ScrollView>

          {/* ─── EXPLORE CARDS ─── */}
          <react_native_1.Text style={s.sectionTitle}>{t('explore')}</react_native_1.Text>
          <react_native_1.View style={s.catGrid}>
            <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Sports')}>
              <expo_linear_gradient_1.LinearGradient colors={['#a18cd1', '#fbc2eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <react_native_1.View style={s.catIconBg}><vector_icons_1.Ionicons name="barbell" size={26} color={colors.background}/></react_native_1.View>
                <react_native_1.Text style={s.catTitle}>{t('workout')}</react_native_1.Text>
                <react_native_1.Text style={s.catSub}>{t('exercise_programs')}</react_native_1.Text>
              </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Nutrition')}>
              <expo_linear_gradient_1.LinearGradient colors={['#89f7fe', '#66a6ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <react_native_1.View style={s.catIconBg}><vector_icons_1.Ionicons name="restaurant" size={26} color={colors.background}/></react_native_1.View>
                <react_native_1.Text style={s.catTitle}>{t('nutrition')}</react_native_1.Text>
                <react_native_1.Text style={s.catSub}>{t('track_food')}</react_native_1.Text>
              </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('AIToolsStack')}>
              <expo_linear_gradient_1.LinearGradient colors={['#f093fb', '#f5576c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <react_native_1.View style={s.catIconBg}><vector_icons_1.Ionicons name="sparkles" size={26} color={colors.background}/></react_native_1.View>
                <react_native_1.Text style={s.catTitle}>{t('ai_tools')}</react_native_1.Text>
                <react_native_1.Text style={s.catSub}>{t('coach_diet_chef')}</react_native_1.Text>
              </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ProfessionalSearch')}>
              <expo_linear_gradient_1.LinearGradient colors={['#38ef7d', '#11998e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <react_native_1.View style={s.catIconBg}><vector_icons_1.Ionicons name="people" size={26} color={colors.background}/></react_native_1.View>
                <react_native_1.Text style={s.catTitle}>{t('pt_diet')}</react_native_1.Text>
                <react_native_1.Text style={s.catSub}>{t('find_pros')}</react_native_1.Text>
              </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          <react_native_1.View style={{ height: 100 }}/>
        </react_native_1.Animated.View>
      </react_native_1.ScrollView>

      <PremiumFeaturesModal_1.default visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} onUpgrade={() => {
            setShowPremiumModal(false);
            navigation.navigate('Store');
        }}/>
    </ScreenContainer_1.default>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    greeting: { fontSize: 14, color: colors.textTertiary },
    name: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF5F0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#FFE0CC' },
    streakNum: { fontSize: 15, fontWeight: '800', color: '#FF9600' },
    coinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#FFF0C1' },
    coinNum: { fontSize: 14, fontWeight: '800', color: '#FFC800' },
    avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#58CC02', overflow: 'hidden' },
    avatarImg: { width: 40, height: 40, borderRadius: 20 },
    // Gamification bar
    gamifBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0' },
    gamifLeft: { flexDirection: 'row', alignItems: 'center' },
    gamifLeague: { fontSize: 14, fontWeight: '800', color: colors.text },
    gamifRank: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
    gamifRight: { flex: 1, marginHorizontal: 14, alignItems: 'flex-end' },
    xpBarOuter: { width: '100%', height: 8, backgroundColor: '#E5E5E5', borderRadius: 4, marginBottom: 3 },
    xpBarInner: { height: 8, backgroundColor: '#FFC800', borderRadius: 4 },
    xpText: { fontSize: 11, fontWeight: '700', color: '#FFC800' },
    // Daily missions
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
    ringVal: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 6 },
    ringLbl: { fontSize: 10, fontWeight: '500', color: colors.textTertiary, marginTop: 1 },
    heroCard: { borderRadius: 24, padding: 22, marginBottom: 28, minHeight: 160, justifyContent: 'space-between' },
    heroTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
    heroTagText: { fontSize: 10, fontWeight: '800', color: colors.background, letterSpacing: 1.5 },
    heroTitle: { fontSize: 22, fontWeight: '800', color: colors.background, marginBottom: 4 },
    heroMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
    heroBottom: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
    heroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, gap: 6 },
    heroBtnText: { fontSize: 15, fontWeight: '700', color: colors.background },
    quickScroll: { gap: 16, paddingRight: 20, marginBottom: 28 },
    quickItem: { alignItems: 'center', width: 72 },
    quickIconWrap: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    quickLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
    catCard: { borderRadius: 22, padding: 18, minHeight: 150, justifyContent: 'flex-end' },
    catIconBg: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    catTitle: { fontSize: 16, fontWeight: '700', color: colors.background, marginBottom: 2 },
    catSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
    // Health insight cards
    insightCard: { flexDirection: 'row', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1 },
    insightWarn: { backgroundColor: '#FFF8F0', borderColor: '#FFE0CC' },
    insightGood: { backgroundColor: '#F0FFF4', borderColor: '#D0F0D0' },
    insightTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
    insightMsg: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
    // Today's workout cards
    todayWorkoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0' },
    todayWorkoutName: { fontSize: 14, fontWeight: '700', color: colors.text },
    todayWorkoutMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
});
exports.default = HomeScreen;
