import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, useWindowDimensions, InteractionManager, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { SupabaseService } from '@nextself/shared';
import { LeagueService, LEAGUE_TIERS } from '../services/leagueService';
import { PaymentService } from '../services/paymentService';
import PlatformStorage from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, COMMON_STYLES } from '../config/theme';
import PremiumFeaturesModal from '../components/PremiumFeaturesModal';
import { useTheme } from '../contexts/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import SkeletonCard from '../components/SkeletonCard';
import { useHomeData } from '../hooks/useHomeData';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { HealthService } from '../services/healthService';

// Import new components
import HealthInsightCard from '../components/HomeScreen/HealthInsightCard';
import TodayWorkoutsCard from '../components/HomeScreen/TodayWorkoutsCard';
import DailyMissionsCard from '../components/HomeScreen/DailyMissionsCard';
import DailyProgramChecklist, { DailyItem } from '../components/HomeScreen/DailyProgramChecklist';
import ExploreCards from '../components/HomeScreen/ExploreCards';
import QuickActions from '../components/HomeScreen/QuickActions';
import GamificationBar from '../components/HomeScreen/GamificationBar';
import { usePendingSessions } from '../hooks/usePendingSessions';
import { aiAutopilotService, AdaptivePlanResponse } from '../services/aiAutopilotService';
import { useAuthStore } from '../store/authStoreSecure';

let hasShownPremiumPopupSession = false;

/**
 * Resets the premium popup flag so it shows again for a new user session.
 * Should be called on sign-out to prevent state leakage between users.
 */
export const resetPremiumPopupFlag = () => {
  hasShownPremiumPopupSession = false;
};

const HEALTH_CONNECT_STARTUP_PROMPT_KEY = 'NextSelf_health_connect_startup_prompt_v1';

const HomeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(colors), [colors]);
  const { t, isTurkish, language } = useTranslation();
  const authUserId = useAuthStore((state) => state.user?.id ?? null);

  // Use custom hook for data fetching
  const {
    data: {
      profile,
      streakData,
      healthInsights,
      todaysWorkouts,
      leagueData,
      currency,
      dailyMissions,
      dailyProgram
    },
    loading,
    refreshing,
    refresh,
    isOfflineData
  } = useHomeData(language);

  const { width } = useWindowDimensions();
  const CARD_W = (width - 40 - 14) / 2;
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [autopilotPlan, setAutopilotPlan] = useState<AdaptivePlanResponse | null>(null);
  const [autopilotError, setAutopilotError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { showAlert, AlertComponent } = useAlert();

  usePendingSessions(showAlert, isTurkish);

  useEffect(() => {
    if (!authUserId) {
      resetPremiumPopupFlag();
    }
  }, [authUserId]);

  const showHealthConnectPrompt = useCallback(async () => {
    try {
      const healthService = HealthService.getInstance();
      await healthService.initialize();
      const status = await healthService.getConnectionStatus();
      if (status.apple || status.google) return;

      const promptShown = await PlatformStorage.getItem(HEALTH_CONNECT_STARTUP_PROMPT_KEY);
      if (promptShown === '1') return;

      if (Platform.OS === 'ios') {
        const autoAppleResult = await healthService.connectAppleHealth();
        if (autoAppleResult.success) {
          await PlatformStorage.setItem(HEALTH_CONNECT_STARTUP_PROMPT_KEY, '1');
          showAlert({
            type: 'success',
            title: isTurkish ? 'Apple Health Bağlandı' : 'Apple Health Connected',
            message: isTurkish ? 'Apple Health bağlantısı otomatik olarak kuruldu.' : 'Apple Health was connected automatically.',
            buttons: [{ text: 'OK' }]
          });
          refresh();
          return;
        }
      } else if (Platform.OS === 'android') {
        const autoGoogleResult = await healthService.connectGoogleHealth();
        if (autoGoogleResult.success) {
          await PlatformStorage.setItem(HEALTH_CONNECT_STARTUP_PROMPT_KEY, '1');
          showAlert({
            type: 'success',
            title: isTurkish ? 'Health Connect Bağlandı' : 'Health Connect Connected',
            message: isTurkish ? 'Google Health Connect bağlantısı otomatik olarak kuruldu.' : 'Google Health Connect was connected automatically.',
            buttons: [{ text: 'OK' }]
          });
          refresh();
          return;
        }
      }

      await PlatformStorage.setItem(HEALTH_CONNECT_STARTUP_PROMPT_KEY, '1');
      const isIOS = Platform.OS === 'ios';

      const connectIOS = async () => {
        const appleResult = await healthService.connectAppleHealth();
        if (appleResult.success) {
          showAlert({
            type: 'success',
            title: isTurkish ? 'Apple Health Bağlandı' : 'Apple Health Connected',
            message: isTurkish ? 'Sağlık bağlantısı kuruldu.' : 'Health connection established.',
            buttons: [{ text: 'OK' }]
          });
          refresh();
        } else {
          showAlert({
            type: 'error',
            title: isTurkish ? 'Bağlantı Hatası' : 'Connection Error',
            message: appleResult.error || (isTurkish ? 'Bağlantı kurulamadı.' : 'Connection failed.'),
            buttons: [{ text: 'OK' }]
          });
        }
      };

      const connectAndroid = async () => {
        const googleResult = await healthService.connectGoogleHealth();
        if (googleResult.success) {
          showAlert({
            type: 'success',
            title: isTurkish ? 'Health Connect Bağlandı' : 'Health Connect Connected',
            message: isTurkish ? 'Sağlık bağlantısı kuruldu.' : 'Health connection established.',
            buttons: [{ text: 'OK' }]
          });
          refresh();
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
      };

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
            onPress: async () => {
              if (isIOS) {
                await connectIOS();
              } else {
                await connectAndroid();
              }
            },
          },
        ],
      });
    } catch (err) {
      console.warn('Health startup prompt error:', err);
    }
  }, [isTurkish, showAlert]);

  // Check premium status and show popup on first app launch only (per session)
  useEffect(() => {
    const checkFirstLaunchPremium = async () => {
      try {
        const { user } = await SupabaseService.getInstance().getCurrentUser();
        if (user) {
          // Use session variable instead of persistent storage
          if (!hasShownPremiumPopupSession) {
            const isPremium = await PaymentService.getInstance().hasPremiumFeatures(user.id);
            if (!isPremium) {
              setShowPremiumModal(true);
              hasShownPremiumPopupSession = true;
            }
          }
        }
      } catch (err) {
        console.warn('First launch premium check error:', err);
      }
    };

    if (!loading && profile) {
      checkFirstLaunchPremium();
      showHealthConnectPrompt();
    }
  }, [loading, profile, showHealthConnectPrompt]);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  const handleClosePremiumModal = () => setShowPremiumModal(false);

  const handleGenerateAutopilotPlan = useCallback(async () => {
    const userId = profile?.id;
    if (!userId) {
      setAutopilotError(isTurkish ? 'Kullanıcı bilgisi bulunamadı.' : 'User information is unavailable.');
      return;
    }
    setAutopilotLoading(true);
    setAutopilotError(null);
    try {
      const plan = await aiAutopilotService.generateAdaptivePlan(String(userId));
      setAutopilotPlan(plan);
    } catch (error) {
      setAutopilotError(isTurkish ? 'Plan oluşturulamadı. Lütfen tekrar deneyin.' : 'Failed to generate plan. Please try again.');
      showAlert({
        type: 'error',
        title: isTurkish ? 'AI Plan Hatası' : 'AI Plan Error',
        message: isTurkish ? 'AI haftalık planı şu anda üretilemedi.' : 'Unable to generate the AI weekly plan right now.',
        buttons: [{ text: 'OK' }],
      });
    } finally {
      setAutopilotLoading(false);
    }
  }, [profile?.id, isTurkish, showAlert]);

  const handleToggleItem = (id: string, type: 'workout' | 'meal' | 'supplement', currentStatus: boolean) => {
    if (currentStatus) return;

    if (type === 'workout') {
      navigation.navigate('ActiveWorkout', { workoutId: id, assignmentId: id });
    } else if (type === 'meal') {
      navigation.navigate('Nutrition', { planId: id });
    } else if (type === 'supplement') {
      navigation.navigate('Supplement', { supplementId: id });
    }
  };

  if (loading && !isOfflineData) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <View style={[s.scroll, { marginTop: 12, paddingTop: 20 }]}>
          <View style={[s.header, { marginBottom: 30 }]}>
            <View>
              <SkeletonCard style={{ width: 100, height: 16, marginBottom: 8 }} />
              <SkeletonCard style={{ width: 160, height: 28 }} />
            </View>
            <View style={s.headerRight}>
              <SkeletonCard style={{ width: 44, height: 44, borderRadius: 22 }} />
            </View>
          </View>
          <SkeletonCard style={{ height: 80, borderRadius: 18, marginBottom: 20 }} />
          <SkeletonCard style={{ height: 120, borderRadius: 18, marginBottom: 20 }} />
          <SkeletonCard style={{ height: 180, borderRadius: 24, marginBottom: 28 }} />
          <SkeletonCard style={{ width: 150, height: 24, marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <SkeletonCard style={{ width: 72, height: 90, borderRadius: 18 }} />
            <SkeletonCard style={{ width: 72, height: 90, borderRadius: 18 }} />
            <SkeletonCard style={{ width: 72, height: 90, borderRadius: 18 }} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const name = profile?.full_name || profile?.first_name || profile?.username || t('athlete');
  const streak = streakData?.currentStreak || 0;
  const tierInfo = leagueData ? LEAGUE_TIERS.find(l => l.tier === leagueData.currentTier) || LEAGUE_TIERS[0] : LEAGUE_TIERS[0];

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <AlertComponent />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ─── HEADER ─── */}
          <View style={[s.header, { marginTop: 12 }]}>
            <View>
              <Text style={s.greeting}>{t('hello')}</Text>
              <Text style={s.name}>{name}</Text>
            </View>
            <View style={s.headerRight}>
              {/* Coins */}
              <TouchableOpacity
                style={s.coinBadge}
                onPress={() => navigation.navigate('Store')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={isTurkish ? `Mağazayı aç. ${currency?.points || 0} puanın var.` : `Open store. You have ${currency?.points || 0} points.`}
              >
                <Ionicons name="cash-outline" size={16} color={colors.warning} />
                <Text style={s.coinNum}>{currency?.points || 0}</Text>
              </TouchableOpacity>
              <View style={s.streakBadge}>
                <Ionicons name="flame" size={18} color={colors.warning} />
                <Text style={s.streakNum}>{streak}</Text>
              </View>
              <TouchableOpacity
                style={s.avatarBtn}
                onPress={() => navigation.navigate('Profile')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={isTurkish ? 'Profil ekranını aç' : 'Open profile screen'}
              >
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} contentFit="cover" cachePolicy="memory-disk" transition={500} />
                ) : (
                  <Ionicons name="person" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── GAMIFICATION BAR (League + XP) ─── */}
          <GamificationBar colors={colors} t={t} navigation={navigation} tierInfo={tierInfo} leagueData={leagueData} />

          {/* ─── DAILY PROGRAM CHECKLIST ─── */}
          <DailyProgramChecklist
            items={dailyProgram}
            onToggle={(id, type, status) => handleToggleItem(id, type, status)}
          />

          {/* ─── DAILY MISSIONS ─── */}
          <DailyMissionsCard
            missions={dailyMissions}
            onMissionPress={(mission) => navigation.navigate('Missions', { missionId: mission.id })}
          />

          {/* ─── TODAY'S WORKOUT ─── */}
          {todaysWorkouts && todaysWorkouts.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ActiveWorkout', { workoutId: todaysWorkouts[0].id })}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isTurkish ? `Bugünün antrenmanını başlat: ${todaysWorkouts[0].name || t('workout')}` : `Start today's workout: ${todaysWorkouts[0].name || t('workout')}`}
            >
              <LinearGradient colors={[colors.accent, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
                <View style={s.heroTag}>
                  <Text style={s.heroTagText}>{t('todays_workout_caps')}</Text>
                </View>
                <Text style={s.heroTitle}>{todaysWorkouts[0].name || t('workout')}</Text>
                <Text style={s.heroMeta}>{t('todays_workout_subtitle')}</Text>
                <View style={s.heroBottom}>
                  <View style={s.heroBtn}>
                    <Ionicons name="play" size={16} color={colors.surface} />
                    <Text style={s.heroBtnText}>{t('start')}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {/* ─── HEALTH INSIGHTS ─── */}
          <HealthInsightCard
            insights={healthInsights}
            refreshing={refreshing}
            onRefresh={refresh}
          />

          <View style={s.autopilotCard}>
            <View style={s.autopilotHeader}>
              <View>
                <Text style={s.autopilotTitle}>AI Weekly Autopilot</Text>
                <Text style={s.autopilotSubtitle}>
                  {isTurkish ? 'Haftalık planını performansına göre optimize et.' : 'Optimize your next week based on your latest progress.'}
                </Text>
              </View>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>

            <TouchableOpacity
              style={[s.autopilotButton, autopilotLoading && s.autopilotButtonDisabled]}
              onPress={handleGenerateAutopilotPlan}
              disabled={autopilotLoading}
              activeOpacity={0.9}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isTurkish ? 'AI haftalık plan oluştur' : 'Generate AI weekly plan'}
            >
              {autopilotLoading ? (
                <View style={s.autopilotButtonLoading}>
                  <ActivityIndicator size="small" color={colors.surface} />
                  <Text style={s.autopilotButtonText}>
                    {isTurkish ? 'Plan Oluşturuluyor...' : 'Generating Plan...'}
                  </Text>
                </View>
              ) : (
                <Text style={s.autopilotButtonText}>
                  {isTurkish ? 'Gelecek Haftanın Planını Oluştur' : "Generate Next Week's Plan"}
                </Text>
              )}
            </TouchableOpacity>

            {autopilotError ? <Text style={s.autopilotError}>{autopilotError}</Text> : null}

            {autopilotPlan ? (
              <View style={s.autopilotResult}>
                <Text style={s.autopilotResultLabel}>{isTurkish ? 'Koç Mesajı' : 'Coach Message'}</Text>
                <Text style={s.autopilotMessage}>{autopilotPlan.coachMessage}</Text>

                <Text style={s.autopilotResultLabel}>{isTurkish ? 'Antrenman Ayarı' : 'Workout Adjustment'}</Text>
                <Text style={s.autopilotAdjustment}>{autopilotPlan.workoutAdjustments}</Text>

                <Text style={s.autopilotResultLabel}>{isTurkish ? 'Kalori Hedefi' : 'Calorie Target'}</Text>
                <Text style={s.autopilotCalories}>
                  {autopilotPlan.adjustedCalorieTarget !== null
                    ? `${autopilotPlan.adjustedCalorieTarget} kcal`
                    : (isTurkish ? 'Değişiklik önerilmedi' : 'No change recommended')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ─── TODAY'S WORKOUT PROGRAMS ─── */}
          {/* Duplicate section removed as per user request
          <TodayWorkoutsCard
            workouts={todaysWorkouts}
            onWorkoutPress={(workout) => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}
          />
          */}

          {/* ─── QUICK ACTIONS ─── */}
          <Text style={s.sectionTitle}>{t('quick_actions')}</Text>
          <QuickActions colors={colors} t={t} navigation={navigation} />

          {/* ─── EXPLORE CARDS ─── */}
          <Text style={s.sectionTitle}>{t('explore')}</Text>
          <ExploreCards colors={colors} t={t} navigation={navigation} />

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      <PremiumFeaturesModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {
          setShowPremiumModal(false);
          navigation.navigate('Store');
        }}
      />
    </ScreenContainer>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: colors.textTertiary },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceElevated, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.borderLight },
  streakNum: { fontSize: 15, fontWeight: '800', color: colors.streak },
  coinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceElevated, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.borderLight },
  coinNum: { fontSize: 14, fontWeight: '800', color: colors.warning },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary, overflow: 'hidden' },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  // Gamification bar
  gamifBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
  gamifLeft: { flexDirection: 'row', alignItems: 'center' },
  gamifLeague: { fontSize: 14, fontWeight: '800', color: colors.text },
  gamifRank: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
  gamifRight: { flex: 1, marginHorizontal: 14, alignItems: 'flex-end' },
  xpBarOuter: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 3 },
  xpBarInner: { height: 8, backgroundColor: colors.warning, borderRadius: 4 },
  xpText: { fontSize: 11, fontWeight: '700', color: colors.warning },
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
  quickLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
  catCard: { borderRadius: 22, padding: 18, minHeight: 150, justifyContent: 'flex-end' },
  catIconBg: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  catTitle: { fontSize: 16, fontWeight: '700', color: colors.background, marginBottom: 2 },
  catSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  // Health insight cards
  insightCard: { flexDirection: 'row', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1 },
  insightWarn: { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
  insightGood: { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
  insightTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  insightMsg: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  // Today's workout cards
  todayWorkoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight },
  todayWorkoutName: { fontSize: 14, fontWeight: '700', color: colors.text },
  todayWorkoutMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  autopilotCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.borderLight, marginBottom: 22 },
  autopilotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  autopilotTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  autopilotSubtitle: { marginTop: 4, fontSize: 12, lineHeight: 18, color: colors.textTertiary, maxWidth: '90%' },
  autopilotButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  autopilotButtonDisabled: { opacity: 0.8 },
  autopilotButtonLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autopilotButtonText: { fontSize: 13, fontWeight: '700', color: colors.background },
  autopilotError: { color: '#EF4444', fontSize: 12, marginTop: 10, fontWeight: '600' },
  autopilotResult: { marginTop: 14, backgroundColor: colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.borderLight },
  autopilotResultLabel: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 4 },
  autopilotMessage: { fontSize: 13, lineHeight: 19, color: colors.text, marginBottom: 10 },
  autopilotAdjustment: { fontSize: 13, lineHeight: 19, color: colors.text, marginBottom: 10, fontWeight: '600' },
  autopilotCalories: { fontSize: 13, color: colors.primary, fontWeight: '800' },
});

export default HomeScreen;
