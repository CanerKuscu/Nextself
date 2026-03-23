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
import { useHomeData } from '../hooks/useHomeData';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { HealthService } from '../services/healthService';

// Import new components
import HealthInsightCard from '../components/HomeScreen/HealthInsightCard';
import TodayWorkoutsCard from '../components/HomeScreen/TodayWorkoutsCard';
import DailyMissionsCard from '../components/HomeScreen/DailyMissionsCard';
import DailyProgramChecklist, { DailyItem } from '../components/HomeScreen/DailyProgramChecklist';

let hasShownPremiumPopupSession = false;
const HEALTH_CONNECT_STARTUP_PROMPT_KEY = 'NextSelf_health_connect_startup_prompt_v1';

const HomeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(colors), [colors]);
  const { t, isTurkish, language } = useTranslation();
  
  // Use custom hook for data fetching
  const { 
    profile, 
    streakData, 
    healthInsights, 
    todaysWorkouts, 
    leagueData, 
    currency, 
    dailyMissions, 
    dailyProgram, 
    loading, 
    refreshing, 
    loadData,
    isOfflineData
  } = useHomeData(language);

  const { width } = useWindowDimensions();
  const CARD_W = (width - 40 - 14) / 2;
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { showAlert, AlertComponent } = useAlert();

  // Initial load
  useEffect(() => {
    loadData();
    checkForPendingSessions();
  }, [loadData]);

  const checkForPendingSessions = async () => {
    try {
      const supabase = SupabaseService.getInstance().getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get active relationships
      const { data: relationships } = await supabase
        .from('client_relationships')
        .select(`
          id, 
          professional_profiles:professional_id(first_name, last_name),
          trainer_profiles:trainer_id(first_name, last_name),
          dietitian_profiles:dietitian_id(first_name, last_name)
        `)
        .eq('client_id', user.id)
        .eq('status', 'active');

      if (!relationships || relationships.length === 0) return;

      const relIds = relationships.map((r: any) => r.id);

      // 2. Check for pending session requests
      const { data: sessions } = await supabase
        .from('session_checkins')
        .select('*')
        .in('client_relationship_id', relIds)
        .eq('is_verified', false)
        .ilike('qr_token', 'REQ-%') // Case insensitive like
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const rel = relationships.find((r: any) => r.id === session.client_relationship_id);
        
        // Extract name from any possible relation
        // @ts-ignore
        const profArray = rel?.professional_profiles || rel?.trainer_profiles || rel?.dietitian_profiles;
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
    } catch (err) {
      console.error('Check pending sessions error:', err);
    }
  };

  const handleApproveSession = async (sessionId: string) => {
    try {
      const { error } = await SupabaseService.getInstance().getClient()
        .from('session_checkins')
        .update({
          is_verified: true,
          checkin_time: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      showAlert({
        title: isTurkish ? 'Başarılı' : 'Success',
        message: isTurkish ? 'Oturum başarıyla onaylandı!' : 'Session approved successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showAlert({ title: isTurkish ? 'Hata' : 'Error', message: 'Failed to approve session', type: 'error' });
    }
  };

  const handleDenySession = async (sessionId: string) => {
    try {
      const { error } = await SupabaseService.getInstance().getClient()
        .from('session_checkins')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
  };

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
          loadData(true);
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
          loadData(true);
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
          loadData(true);
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
  }, [isTurkish, showAlert, loadData]);

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
    loadData(true);
  }, [loadData]);

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
    return (<View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center]}><ActivityIndicator size="large" color={colors.primary} /></View>);
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
              <TouchableOpacity style={s.coinBadge} onPress={() => navigation.navigate('Store')}>
                <Ionicons name="cash-outline" size={16} color="#FFB800" />
                <Text style={s.coinNum}>{currency?.points || 0}</Text>
              </TouchableOpacity>
              <View style={s.streakBadge}>
                <Ionicons name="flame" size={18} color="#FF9600" />
                <Text style={s.streakNum}>{streak}</Text>
              </View>
              <TouchableOpacity style={s.avatarBtn} onPress={() => navigation.navigate('Profile')}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} contentFit="cover" cachePolicy="memory-disk" transition={500} />
                ) : (
                  <Ionicons name="person" size={20} color="#58CC02" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── GAMIFICATION BAR (League + XP) ─── */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('League')} style={s.gamifBar}>
            <View style={s.gamifLeft}>
              <Text style={{ fontSize: 22 }}>{tierInfo.icon}</Text>
              <View style={{ marginLeft: 10 }}>
                <Text style={s.gamifLeague}>{t(`tier_${tierInfo.name.toLowerCase()}` as any)}</Text>
                <Text style={s.gamifRank}>{t('league')}</Text>
              </View>
            </View>
            <View style={s.gamifRight}>
              <View style={s.xpBarOuter}>
                <View style={[s.xpBarInner, { width: `${Math.min((leagueData?.weeklyXp || 0) / 500 * 100, 100)}%` }]} />
              </View>
              <Text style={s.xpText}>{leagueData?.weeklyXp || 0} XP</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

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
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('ActiveWorkout', { workoutId: todaysWorkouts[0].id })}>
              <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
                <View style={s.heroTag}>
                  <Text style={s.heroTagText}>{t('todays_workout_caps')}</Text>
                </View>
                <Text style={s.heroTitle}>{todaysWorkouts[0].name || t('workout')}</Text>
                <Text style={s.heroMeta}>{t('todays_workout_subtitle')}</Text>
                <View style={s.heroBottom}>
                  <View style={s.heroBtn}>
                    <Ionicons name="play" size={16} color={colors.background} />
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
            onRefresh={loadData}
          />

          {/* ─── TODAY'S WORKOUT PROGRAMS ─── */}
          {/* Duplicate section removed as per user request
          <TodayWorkoutsCard
            workouts={todaysWorkouts}
            onWorkoutPress={(workout) => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}
          />
          */}

          {/* ─── QUICK ACTIONS ─── */}
          <Text style={s.sectionTitle}>{t('quick_actions')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickScroll}>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Sports')} activeOpacity={0.7}>
              <LinearGradient colors={['#58CC02', '#38a800']} style={s.quickIconWrap}><Ionicons name="sparkles" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{t('workout')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('FoodScanner')} activeOpacity={0.7}>
              <LinearGradient colors={['#FF9600', '#FF6B6B']} style={s.quickIconWrap}><Ionicons name="scan" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{t('scan_food')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Nutrition')} activeOpacity={0.7}>
              <LinearGradient colors={['#89f7fe', '#66a6ff']} style={s.quickIconWrap}><Ionicons name="restaurant" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{t('nutrition')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('ProfessionalSearch')} activeOpacity={0.7}>
              <LinearGradient colors={['#38ef7d', '#11998e']} style={s.quickIconWrap}><Ionicons name="people" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{t('find_pt')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Health')} activeOpacity={0.7}>
              <LinearGradient colors={['#f093fb', '#f5576c']} style={s.quickIconWrap}><Ionicons name="heart" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{t('health')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Supplements')} activeOpacity={0.7}>
              <LinearGradient colors={['#CE82FF', '#764ba2']} style={s.quickIconWrap}><Ionicons name="medkit" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{t('supplements')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('WaterTracking')} activeOpacity={0.7}>
              <LinearGradient colors={['#1CB0F6', '#0077CC']} style={s.quickIconWrap}><Ionicons name="water" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{t('water_tracking')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Assignments')} activeOpacity={0.7}>
              <LinearGradient colors={['#FFC800', '#FF9600']} style={s.quickIconWrap}><Ionicons name="clipboard" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{t('tasks')}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ─── EXPLORE CARDS ─── */}
          <Text style={s.sectionTitle}>{t('explore')}</Text>
          <View style={s.catGrid}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Sports')}>
              <LinearGradient colors={['#a18cd1', '#fbc2eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <View style={s.catIconBg}><Ionicons name="barbell" size={26} color={colors.background} /></View>
                <Text style={s.catTitle}>{t('workout')}</Text>
                <Text style={s.catSub}>{t('exercise_programs')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Nutrition')}>
              <LinearGradient colors={['#89f7fe', '#66a6ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <View style={s.catIconBg}><Ionicons name="restaurant" size={26} color={colors.background} /></View>
                <Text style={s.catTitle}>{t('nutrition')}</Text>
                <Text style={s.catSub}>{t('track_food')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('AIToolsStack')}>
              <LinearGradient colors={['#f093fb', '#f5576c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <View style={s.catIconBg}><Ionicons name="sparkles" size={26} color={colors.background} /></View>
                <Text style={s.catTitle}>{t('ai_tools')}</Text>
                <Text style={s.catSub}>{t('coach_diet_chef')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ProfessionalSearch')}>
              <LinearGradient colors={['#38ef7d', '#11998e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <View style={s.catIconBg}><Ionicons name="people" size={26} color={colors.background} /></View>
                <Text style={s.catTitle}>{t('pt_diet')}</Text>
                <Text style={s.catSub}>{t('find_pros')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

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

export default HomeScreen;
