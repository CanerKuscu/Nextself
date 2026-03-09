import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, useWindowDimensions, InteractionManager } from 'react-native';
import { Image } from 'expo-image'; // Use expo-image for better caching and performance
import PlatformStorage from '../utils/platformStorage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { SupabaseService } from '../services/supabase';
import { StreakService, StreakData } from '../services/streakService';
import { HealthService, HealthInsight } from '../services/healthService';
import { getLocalDateString } from '../utils/dateUtils';
import { LeagueService, LEAGUE_TIERS, UserLeagueData } from '../services/leagueService';
import { StoreService, UserCurrency } from '../services/storeService';
import { MissionService, DailyMission } from '../services/missionService';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, COMMON_STYLES } from '../config/theme';
import PremiumFeaturesModal from '../components/PremiumFeaturesModal';
import { useTheme } from '../contexts/ThemeContext';

// Import new components
import HealthInsightCard from '../components/HomeScreen/HealthInsightCard';
import StreakCard from '../components/HomeScreen/StreakCard';
import TodayWorkoutsCard from '../components/HomeScreen/TodayWorkoutsCard';
import DailyMissionsCard from '../components/HomeScreen/DailyMissionsCard';

const PREMIUM_POPUP_SHOWN_KEY = 'biosync_premium_popup_shown';

const ActivityRing = memo(({ size, strokeWidth, progress, color, iconName, value, label }: any) => {
  const { colors, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(colors), [colors]);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));
  return (
    <View style={{ alignItems: 'center', width: size + 8 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color + '20'} strokeWidth={strokeWidth} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset}
            strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </Svg>
        <Ionicons name={iconName} size={20} color={color} />
      </View>
      <Text style={s.ringVal}>{value}</Text>
      <Text style={s.ringLbl}>{label}</Text>
    </View>
  );
});

const HomeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(colors), [colors]);

  const { width } = useWindowDimensions();
  const CARD_W = (width - 40 - 14) / 2;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [todaysWorkouts, setTodaysWorkouts] = useState<any[]>([]);
  const [leagueData, setLeagueData] = useState<UserLeagueData | null>(null);
  const [currency, setCurrency] = useState<UserCurrency | null>(null);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { t, isTurkish } = useTranslation();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supa = SupabaseService.getInstance();
      const { user } = await supa.getCurrentUser();
      if (user) {
        let profileData: any = null;
        try {
          const { data } = await supa.getUserProfile(user.id);
          profileData = data;
          setProfile(data);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Set default profile data to prevent UI crashes
          setProfile({
            id: user.id,
            email: user.email,
            full_name: 'User',
            username: `user_${user.id.slice(0, 8)}`
          });
        }

        const today = getLocalDateString();

        // Run all independent data fetches concurrently to massively boost loading speed
        await Promise.allSettled([
          (async () => {
            try {
              const streak = await StreakService.getInstance().getStreak();
              setStreakData(streak);
            } catch (error) {
              console.error('Failed to load streak data:', error);
              setStreakData({
                currentStreak: 0,
                longestStreak: 0,
                lastWorkoutDate: null,
                lastRestDate: null,
                isRestDay: false
              });
            }
          })(),
          (async () => {
            try {
              const hs = HealthService.getInstance();
              await hs.initialize();
              const hData = await hs.getTodayHealthData();
              setHealthInsights(hs.generateHealthInsights(hData, profileData?.gender || null));
            } catch (error) {
              console.error('Failed to load health insights:', error);
              setHealthInsights([]);
            }
          })(),
          (async () => {
            try {
              const { data: wk } = await supa.getClient().from('workouts').select('*').eq('user_id', user.id).gte('created_at', today + 'T00:00:00').order('created_at', { ascending: false }).limit(5);
              if (wk) setTodaysWorkouts(wk);
            } catch (error) {
              console.error('Failed to load today\'s workouts:', error);
              setTodaysWorkouts([]);
            }
          })(),
          (async () => {
            try {
              const ld = await LeagueService.getInstance().getUserLeague();
              setLeagueData(ld);
            } catch (error) {
              console.error('Failed to load league data:', error);
              setLeagueData(null);
            }
          })(),
          (async () => {
            try {
              const cur = await StoreService.getInstance().getUserCurrency();
              setCurrency(cur);
            } catch (error) {
              console.error('Failed to load user currency:', error);
              setCurrency(null);
            }
          })(),
          (async () => {
            try {
              const dm = await MissionService.getInstance().getDailyMissions();
              setDailyMissions(dm);
            } catch (error) {
              console.error('Failed to load daily missions:', error);
              setDailyMissions([]);
            }
          })()
        ]);
      }
    } catch (error) {
      console.error('Failed to load home screen data:', error);
      // Set default values to prevent UI crashes
      setProfile(null);
      setStreakData({ currentStreak: 0, longestStreak: 0, lastWorkoutDate: null, lastRestDate: null, isRestDay: false });
      setHealthInsights([]);
      setTodaysWorkouts([]);
      setLeagueData(null);
      setCurrency(null);
      setDailyMissions([]);
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  useEffect(() => {
    // Defer loading slightly so navigation animation feels snappy
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      loadData();
    });
    return () => interactionPromise.cancel();
  }, [loadData]);

  // Show premium popup on first launch
  useEffect(() => {
    const checkPremiumPopup = async (): Promise<NodeJS.Timeout | null | undefined> => {
      try {
        const shown = await PlatformStorage.getItem(PREMIUM_POPUP_SHOWN_KEY);
        if (!shown) {
          const timeoutId = setTimeout(() => setShowPremiumModal(true), 1500);
          await PlatformStorage.setItem(PREMIUM_POPUP_SHOWN_KEY, 'true');
          return timeoutId;
        }
        return null;
      } catch {
        return null;
      }
    };
    let timeoutId: NodeJS.Timeout | null = null;
    checkPremiumPopup().then(id => { if (id) timeoutId = id; });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleClosePremiumModal = () => setShowPremiumModal(false);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  if (loading) {
    return (<View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center]}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  const name = profile?.full_name || profile?.first_name || profile?.username || (isTurkish ? 'Sporcu' : 'Athlete');
  const streak = streakData?.currentStreak || 0;
  const tierInfo = leagueData ? LEAGUE_TIERS.find(l => l.tier === leagueData.current_tier) || LEAGUE_TIERS[0] : LEAGUE_TIERS[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ─── HEADER ─── */}
          <View style={s.header}>
            <View>
              <Text style={s.greeting}>{isTurkish ? 'Merhaba,' : 'Hello,'}</Text>
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

          {/* ─── STREAK CARD ─── */}
          <StreakCard streakData={streakData} />

          {/* ─── GAMIFICATION BAR (League + XP) ─── */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('League')} style={s.gamifBar}>
            <View style={s.gamifLeft}>
              <Text style={{ fontSize: 22 }}>{tierInfo.icon}</Text>
              <View style={{ marginLeft: 10 }}>
                <Text style={s.gamifLeague}>{isTurkish ? tierInfo.nameTr : tierInfo.name}</Text>
                <Text style={s.gamifRank}>{isTurkish ? 'Lig' : 'League'}</Text>
              </View>
            </View>
            <View style={s.gamifRight}>
              <View style={s.xpBarOuter}>
                <View style={[s.xpBarInner, { width: `${Math.min((leagueData?.weekly_xp || 0) / 500 * 100, 100)}%` }]} />
              </View>
              <Text style={s.xpText}>{leagueData?.weekly_xp || 0} XP</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* ─── DAILY MISSIONS ─── */}
          <DailyMissionsCard
            missions={dailyMissions}
            onMissionPress={(mission) => navigation.navigate('Missions', { missionId: mission.id })}
          />

          {/* ─── TODAY'S WORKOUT ─── */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Workout')}>
            <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
              <View style={s.heroTag}>
                <Text style={s.heroTagText}>{isTurkish ? 'ANTRENMANA BAŞLA' : 'START WORKOUT'}</Text>
              </View>
              <Text style={s.heroTitle}>{isTurkish ? 'Antrenman' : 'Workout'}</Text>
              <Text style={s.heroMeta}>{isTurkish ? 'Kas gruplarını seç ve başla' : 'Select muscle groups and begin'}</Text>
              <View style={s.heroBottom}>
                <View style={s.heroBtn}>
                  <Ionicons name="play" size={16} color={colors.background} />
                  <Text style={s.heroBtnText}>{isTurkish ? 'Başla' : 'Start'}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ─── HEALTH INSIGHTS ─── */}
          <HealthInsightCard
            insights={healthInsights}
            refreshing={refreshing}
            onRefresh={loadData}
          />

          {/* ─── TODAY'S WORKOUT PROGRAMS ─── */}
          <TodayWorkoutsCard
            workouts={todaysWorkouts}
            onWorkoutPress={(workout) => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}
          />

          {/* ─── QUICK ACTIONS ─── */}
          <Text style={s.sectionTitle}>{isTurkish ? 'Hızlı Erişim' : 'Quick Actions'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickScroll}>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('ProgramCreator')} activeOpacity={0.7}>
              <LinearGradient colors={['#58CC02', '#38a800']} style={s.quickIconWrap}><Ionicons name="sparkles" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{isTurkish ? 'Program' : 'Program'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('FoodScanner')} activeOpacity={0.7}>
              <LinearGradient colors={['#FF9600', '#FF6B6B']} style={s.quickIconWrap}><Ionicons name="scan" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{isTurkish ? 'Yemek Tara' : 'Scan Food'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Nutrition')} activeOpacity={0.7}>
              <LinearGradient colors={['#89f7fe', '#66a6ff']} style={s.quickIconWrap}><Ionicons name="restaurant" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{isTurkish ? 'Beslenme' : 'Nutrition'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('ProfessionalSearch')} activeOpacity={0.7}>
              <LinearGradient colors={['#38ef7d', '#11998e']} style={s.quickIconWrap}><Ionicons name="people" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{isTurkish ? 'PT Bul' : 'Find PT'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Health')} activeOpacity={0.7}>
              <LinearGradient colors={['#f093fb', '#f5576c']} style={s.quickIconWrap}><Ionicons name="heart" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{isTurkish ? 'Sağlık' : 'Health'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Supplements')} activeOpacity={0.7}>
              <LinearGradient colors={['#CE82FF', '#764ba2']} style={s.quickIconWrap}><Ionicons name="medkit" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{isTurkish ? 'Supplement' : 'Supplements'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('WaterTracking')} activeOpacity={0.7}>
              <LinearGradient colors={['#1CB0F6', '#0077CC']} style={s.quickIconWrap}><Ionicons name="water" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{isTurkish ? 'Su Takibi' : 'Water'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Assignments')} activeOpacity={0.7}>
              <LinearGradient colors={['#FFC800', '#FF9600']} style={s.quickIconWrap}><Ionicons name="clipboard" size={22} color={colors.background} /></LinearGradient>
              <Text style={s.quickLabel}>{isTurkish ? 'Ödevler' : 'Tasks'}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ─── EXPLORE CARDS ─── */}
          <Text style={s.sectionTitle}>{isTurkish ? 'Keşfet' : 'Explore'}</Text>
          <View style={s.catGrid}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Workout')}>
              <LinearGradient colors={['#a18cd1', '#fbc2eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <View style={s.catIconBg}><Ionicons name="barbell" size={26} color={colors.background} /></View>
                <Text style={s.catTitle}>{isTurkish ? 'Antrenman' : 'Workout'}</Text>
                <Text style={s.catSub}>{isTurkish ? 'Egzersiz programları' : 'Exercise programs'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Nutrition')}>
              <LinearGradient colors={['#89f7fe', '#66a6ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <View style={s.catIconBg}><Ionicons name="restaurant" size={26} color={colors.background} /></View>
                <Text style={s.catTitle}>{isTurkish ? 'Beslenme' : 'Nutrition'}</Text>
                <Text style={s.catSub}>{isTurkish ? 'Besin takibi' : 'Track food'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('AITools')}>
              <LinearGradient colors={['#f093fb', '#f5576c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <View style={s.catIconBg}><Ionicons name="sparkles" size={26} color={colors.background} /></View>
                <Text style={s.catTitle}>{isTurkish ? 'AI Araçları' : 'AI Tools'}</Text>
                <Text style={s.catSub}>{isTurkish ? 'Koç, diyet, şef' : 'Coach, diet, chef'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ProfessionalSearch')}>
              <LinearGradient colors={['#38ef7d', '#11998e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                <View style={s.catIconBg}><Ionicons name="people" size={26} color={colors.background} /></View>
                <Text style={s.catTitle}>{isTurkish ? 'PT / Diyet' : 'PT / Diet'}</Text>
                <Text style={s.catSub}>{isTurkish ? 'Uzman bul' : 'Find pros'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      <PremiumFeaturesModal
        visible={showPremiumModal}
        onClose={handleClosePremiumModal}
      />
    </View>
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
  missionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  missionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  missionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center' },
  missionTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  missionProgressOuter: { height: 5, backgroundColor: '#E5E5E5', borderRadius: 3, width: '90%' },
  missionProgressInner: { height: 5, backgroundColor: '#58CC02', borderRadius: 3 },
  missionReward: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  missionXp: { fontSize: 12, fontWeight: '700', color: '#FFC800' },
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
