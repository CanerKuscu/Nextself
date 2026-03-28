import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../components/CustomAlert';
import { safeGoBack } from '../utils/navigation';
import { SupabaseService } from '@nextself/shared';
import { LeagueService, LEAGUE_TIERS, UserLeagueData } from '../services/leagueService';
import { StreakService, StreakData } from '../services/streakService';
import { StoreService, UserCurrency } from '../services/storeService';
import { useTranslation } from '../hooks/useTranslation';
import { TYPOGRAPHY, SPACING } from '../config/theme';
import LeagueTierIcon from '../components/LeagueTierIcon';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStoreSecure';

let LineChart: any;
try { LineChart = require('react-native-chart-kit').LineChart; } catch { }

const ProfileScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const { width } = useWindowDimensions();

  const STAT_W = (width - 40 - 12) / 2;
  const [profile, setProfile] = useState<any>(null);
  const [leagueData, setLeagueData] = useState<UserLeagueData | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [currency, setCurrency] = useState<UserCurrency | null>(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [monthlyTracking, setMonthlyTracking] = useState<{ labels: string[]; datasets: { label: string; data: number[]; color: string }[] }>({ labels: [], datasets: [] });
  const [monthlyProgramProgress, setMonthlyProgramProgress] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [programAdjustments, setProgramAdjustments] = useState({ increase: 0, stable: 0, decrease: 0 });
  const { t, isTurkish, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isProfessional, setIsProfessional] = useState(false);
  const contextUser = useAuthStore((state) => state.user);
  const proxiedFetch = useAuthStore((state) => state.proxiedFetch);

  const buildMonthlyTracking = useCallback((
    workoutRows: Array<{ created_at?: string }> | null | undefined,
    nutritionRows: Array<{ logged_at?: string }> | null | undefined,
    waterRows: Array<{ date?: string; created_at?: string }> | null | undefined,
    vitaminRows: Array<{ logged_at?: string }> | null | undefined,
    mineralRows: Array<{ created_at?: string }> | null | undefined,
    assignedWorkoutRows: Array<{ completed_at?: string; is_completed?: boolean; client_feedback?: string }> | null | undefined,
  ) => {
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

    const buildSeries = <T,>(rows: T[] | null | undefined, getDate: (row: T) => string | undefined) => {
      const counts = new Map(monthBuckets.map((bucket) => [bucket.key, 0]));
      for (const row of rows || []) {
        const rawDate = getDate(row);
        if (!rawDate) continue;
        const dt = new Date(rawDate);
        if (Number.isNaN(dt.getTime())) continue;
        const key = `${dt.getFullYear()}-${dt.getMonth()}`;
        if (!counts.has(key)) continue;
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
    const assignedSeries = buildSeries(
      (assignedWorkoutRows || []).filter((row) => !!row?.is_completed),
      (row) => row.completed_at,
    );

    setMonthlyTracking({
      labels,
      datasets: [
        { label: isTurkish ? 'Spor' : 'Workout', data: workoutSeries, color: colors.accent },
        { label: isTurkish ? 'Beslenme' : 'Nutrition', data: nutritionSeries, color: colors.warning },
        { label: isTurkish ? 'Su' : 'Water', data: waterSeries, color: colors.info },
        { label: isTurkish ? 'Vitamin' : 'Vitamin', data: vitaminSeries, color: colors.secondary },
        { label: isTurkish ? 'Mineral' : 'Mineral', data: mineralSeries, color: colors.success },
      ],
    });

    setMonthlyProgramProgress({
      labels,
      data: assignedSeries,
    });

    const summary = { increase: 0, stable: 0, decrease: 0 };
    for (const row of assignedWorkoutRows || []) {
      const payloadRaw = row?.client_feedback;
      if (!payloadRaw) continue;
      try {
        const parsed = JSON.parse(payloadRaw);
        const action = parsed?.weeklyAction as 'increase' | 'decrease' | 'stable' | undefined;
        if (action === 'increase' || action === 'decrease' || action === 'stable') {
          summary[action] += 1;
        }
      } catch { }
    }
    setProgramAdjustments(summary);
  }, [isTurkish, language]);

  const loadProfile = useCallback(async () => {
    try {
      const supabase = SupabaseService.getInstance();
      let currentUser: any = contextUser ?? null;
      if (!currentUser) {
        const cur = await supabase.getCurrentUser();
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
        if (Platform.OS === 'web' && proxiedFetch) {
          const select = 'id,full_name,first_name,last_name,username,avatar_url,created_at,height,weight,gender,dob';
          const profRes: any = await proxiedFetch('GET', 'profiles', { query: `id=eq.${currentUser.id}&select=${select}` });
          if (profRes && profRes.ok) {
            const payload = Array.isArray(profRes.data) ? profRes.data[0] : profRes.data;
            setProfile(payload);
          } else {
            // fallback to client
            const { data } = await supabase.getUserProfile(currentUser.id);
            setProfile(data);
          }

          // Load gamification data in parallel (keep existing service calls)
          const [leagueResult, streakResult, currencyResult, workoutResult, nutritionResult, waterResult, vitaminResult, mineralResult, assignedResult] = await Promise.allSettled([
            LeagueService.getInstance().getUserLeague(),
            StreakService.getInstance().getStreak(),
            StoreService.getInstance().getUserCurrency(),
            // Use proxiedFetch to get workouts list and count on web
            proxiedFetch('GET', 'workouts', { query: `user_id=eq.${currentUser.id}&select=id,created_at&created_at=gte.${sixMonthsAgoIso}` }),
            supabase.getClient().from('nutrition_logs').select('logged_at').eq('user_id', currentUser.id).gte('logged_at', sixMonthsAgoIso),
            supabase.getClient().from('water_logs').select('date,created_at').eq('user_id', currentUser.id).gte('date', sixMonthsAgoDateOnly),
            supabase.getClient().from('vitamin_logs').select('logged_at').eq('user_id', currentUser.id).gte('logged_at', sixMonthsAgoIso),
            supabase.getClient().from('mineral_logs').select('created_at').eq('user_id', currentUser.id).gte('created_at', sixMonthsAgoIso),
            supabase.getClient().from('assigned_workouts').select('completed_at,is_completed,client_feedback').eq('client_id', currentUser.id).gte('scheduled_date', sixMonthsAgoDateOnly),
          ]);
          if (leagueResult.status === 'fulfilled') setLeagueData(leagueResult.value);
          if (streakResult.status === 'fulfilled') setStreakData(streakResult.value);
          if (currencyResult.status === 'fulfilled') setCurrency(currencyResult.value);
          if (workoutResult.status === 'fulfilled') {
            const v: any = workoutResult.value;
            if (v && v.ok && Array.isArray(v.data)) {
              setWorkoutCount(v.data.length || 0);
              buildMonthlyTracking(
                v.data,
                nutritionResult.status === 'fulfilled' ? (nutritionResult.value as any)?.data || [] : [],
                waterResult.status === 'fulfilled' ? (waterResult.value as any)?.data || [] : [],
                vitaminResult.status === 'fulfilled' ? (vitaminResult.value as any)?.data || [] : [],
                mineralResult.status === 'fulfilled' ? (mineralResult.value as any)?.data || [] : [],
                assignedResult.status === 'fulfilled' ? (assignedResult.value as any)?.data || [] : [],
              );
            }
            else if (v && typeof v.data === 'object' && 'count' in v.data) setWorkoutCount(v.data.count || 0);
          }

          // Professional check — keep using client for reliability
          try {
            const { data: profData } = await supabase.getClient()
              .from('professional_profiles')
              .select('professional_type')
              .eq('user_id', currentUser.id)
              .eq('is_active', true)
              .maybeSingle();
            setIsProfessional(!!profData);
          } catch (_) { }
        } else {
          // Native / fallback: original flow
          const { data } = await supabase.getUserProfile(currentUser.id);
          setProfile(data);
          // Load gamification data in parallel
          const [leagueResult, streakResult, currencyResult, workoutCountResult, workoutProgressResult, nutritionResult, waterResult, vitaminResult, mineralResult, assignedResult] = await Promise.allSettled([
            LeagueService.getInstance().getUserLeague(),
            StreakService.getInstance().getStreak(),
            StoreService.getInstance().getUserCurrency(),
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
          if (leagueResult.status === 'fulfilled') setLeagueData(leagueResult.value);
          if (streakResult.status === 'fulfilled') setStreakData(streakResult.value);
          if (currencyResult.status === 'fulfilled') setCurrency(currencyResult.value);
          if (workoutCountResult.status === 'fulfilled') setWorkoutCount(workoutCountResult.value.count || 0);
          if (workoutProgressResult.status === 'fulfilled') {
            const workoutRows = workoutProgressResult.value.data || [];
            buildMonthlyTracking(
              workoutRows,
              nutritionResult.status === 'fulfilled' ? (nutritionResult.value as any)?.data || [] : [],
              waterResult.status === 'fulfilled' ? (waterResult.value as any)?.data || [] : [],
              vitaminResult.status === 'fulfilled' ? (vitaminResult.value as any)?.data || [] : [],
              mineralResult.status === 'fulfilled' ? (mineralResult.value as any)?.data || [] : [],
              assignedResult.status === 'fulfilled' ? (assignedResult.value as any)?.data || [] : [],
            );
          }

          const { data: profData } = await supabase.getClient()
            .from('professional_profiles')
            .select('professional_type')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .maybeSingle();
          setIsProfessional(!!profData);
        }
      }
    } catch (err) { console.error(err); }
    finally { Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }
  }, [contextUser, proxiedFetch, buildMonthlyTracking]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const parseBirthDate = (value?: string) => {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.trim();
    const direct = new Date(normalized);
    if (!Number.isNaN(direct.getTime())) return direct;
    const parts = normalized.split(/[./-]/).map((p) => Number(p));
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p3 > 1900 && p3 < 3000) {
        const dayFirst = new Date(p3, p2 - 1, p1);
        if (!Number.isNaN(dayFirst.getTime())) return dayFirst;
      }
    }
    return null;
  };

  const calculateAge = (dob: string) => {
    const bd = parseBirthDate(dob);
    if (!bd) return null;
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
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
          onPress: async () => { const s = SupabaseService.getInstance(); await s.signOut(); navigation.replace('Auth'); }
        },
      ],
    });
  };

  const birthDate = profile?.dob || profile?.birth_date || profile?.date_of_birth || null;
  const age = birthDate ? calculateAge(birthDate) : null;
  const name = profile?.full_name || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile?.username) || t('user_default');

  const streak = streakData?.currentStreak || 0;
  const totalXP = leagueData?.totalXp || 0;
  const tierInfo = leagueData ? LEAGUE_TIERS.find(l => l.tier === leagueData.currentTier) || LEAGUE_TIERS[0] : LEAGUE_TIERS[0];

  // Memoized health calculations to prevent re-renders
  const healthStats = React.useMemo(() => {
    if (!profile?.height || !profile?.weight) return null;

    const h = profile.height / 100; // meters
    const w = profile.weight;
    const bmi = w / (h * h);
    const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
    const bmiColor = bmi < 18.5 ? colors.accent : bmi < 25 ? colors.primary : bmi < 30 ? colors.warning : colors.error;

    // BMR (Mifflin-St Jeor)
    let bmr = 10 * w + 6.25 * profile.height - 5 * (age || 25);
    bmr = profile?.gender === 'female' ? bmr - 161 : bmr + 5;
    const tdee = Math.round(bmr * 1.55); // moderate activity
    const proteinNeed = Math.round(w * 1.8);

    return { bmi, bmiCategory, bmiColor, bmr, tdee, proteinNeed };
  }, [profile?.height, profile?.weight, profile?.gender, age, isTurkish]);

  const trackingChartData = React.useMemo(() => ({
    labels: monthlyTracking.labels.length > 0 ? monthlyTracking.labels : [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun')],
    datasets: (monthlyTracking.datasets.length > 0 ? monthlyTracking.datasets : [
      { label: isTurkish ? 'Spor' : 'Workout', data: [0, 0, 0, 0, 0, 0], color: colors.accent },
      { label: isTurkish ? 'Beslenme' : 'Nutrition', data: [0, 0, 0, 0, 0, 0], color: colors.warning },
      { label: isTurkish ? 'Su' : 'Water', data: [0, 0, 0, 0, 0, 0], color: colors.info },
      { label: isTurkish ? 'Vitamin' : 'Vitamin', data: [0, 0, 0, 0, 0, 0], color: colors.secondary },
      { label: isTurkish ? 'Mineral' : 'Mineral', data: [0, 0, 0, 0, 0, 0], color: colors.success },
    ]).map((dataset) => ({
      data: dataset.data,
      color: () => dataset.color,
      strokeWidth: 2,
    })),
  }), [monthlyTracking, t, isTurkish]);

  const trackingLegend = React.useMemo(() => (
    monthlyTracking.datasets.length > 0 ? monthlyTracking.datasets : [
      { label: isTurkish ? 'Spor' : 'Workout', data: [], color: colors.accent },
      { label: isTurkish ? 'Beslenme' : 'Nutrition', data: [], color: colors.warning },
      { label: isTurkish ? 'Su' : 'Water', data: [], color: colors.info },
      { label: isTurkish ? 'Vitamin' : 'Vitamin', data: [], color: colors.secondary },
      { label: isTurkish ? 'Mineral' : 'Mineral', data: [], color: colors.success },
    ]
  ), [monthlyTracking.datasets, isTurkish]);

  const programProgressData = React.useMemo(() => ({
    labels: monthlyProgramProgress.labels.length > 0 ? monthlyProgramProgress.labels : [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun')],
    datasets: [{ data: monthlyProgramProgress.data.length > 0 ? monthlyProgramProgress.data : [0, 0, 0, 0, 0, 0] }],
  }), [monthlyProgramProgress, t]);

  const achievements = React.useMemo(() => ([
    { icon: 'flame' as const, iconColor: '#FF6B6B', bg: colors.surfaceElevated, label: t('week_streak'), unlocked: streak >= 7 },
    { icon: 'flash' as const, iconColor: '#FFC800', bg: colors.surfaceElevated, label: '100 XP', unlocked: totalXP >= 100 },
    { icon: 'trophy' as const, iconColor: '#FF9600', bg: colors.surfaceElevated, label: t('top_10'), unlocked: (leagueData?.rankInGroup || 0) > 0 && (leagueData?.rankInGroup || 99) <= 10 },
    { icon: 'barbell' as const, iconColor: '#1CB0F6', bg: colors.surfaceElevated, label: t('workouts_10'), unlocked: workoutCount >= 10 },
    { icon: 'fitness' as const, iconColor: '#58CC02', bg: colors.surfaceElevated, label: t('strong'), unlocked: workoutCount >= 50 },
    { icon: 'rocket' as const, iconColor: '#CE82FF', bg: colors.surfaceElevated, label: t('day_one'), unlocked: true },
    { icon: 'star' as const, iconColor: '#FFD700', bg: colors.surfaceElevated, label: '500 XP', unlocked: totalXP >= 500 },
    { icon: 'medal' as const, iconColor: '#CD7F32', bg: colors.surfaceElevated, label: t('streak_30_day'), unlocked: streak >= 30 },
    { icon: 'shield-checkmark' as const, iconColor: '#0F52BA', bg: colors.surfaceElevated, label: t('top_3'), unlocked: (leagueData?.rankInGroup || 0) > 0 && (leagueData?.rankInGroup || 99) <= 3 },
    { icon: 'restaurant' as const, iconColor: '#FF9600', bg: colors.surfaceElevated, label: t('meals_50'), unlocked: false },
    { icon: 'water' as const, iconColor: '#1CB0F6', bg: colors.surfaceElevated, label: t('hydrated'), unlocked: false },
    { icon: 'ribbon' as const, iconColor: '#E0115F', bg: colors.surfaceElevated, label: t('promoted'), unlocked: (leagueData?.promotionCount || 0) > 0 },
    { icon: 'sparkles' as const, iconColor: '#B9F2FF', bg: colors.surfaceElevated, label: '1000 XP', unlocked: totalXP >= 1000 },
    { icon: 'body' as const, iconColor: '#58CC02', bg: colors.surfaceElevated, label: t('workouts_100'), unlocked: workoutCount >= 100 },
    { icon: 'heart' as const, iconColor: '#FF4B4B', bg: colors.surfaceElevated, label: t('healthy'), unlocked: false },
    { icon: 'people' as const, iconColor: '#CE82FF', bg: colors.surfaceElevated, label: t('social'), unlocked: false },
    { icon: 'trending-up' as const, iconColor: '#58CC02', bg: colors.surfaceElevated, label: t('goal_5kg'), unlocked: false },
    { icon: 'time' as const, iconColor: '#FF9600', bg: colors.surfaceElevated, label: t('streak_90_day'), unlocked: streak >= 90 },
    { icon: 'diamond' as const, iconColor: '#0F52BA', bg: colors.surfaceElevated, label: '5000 XP', unlocked: totalXP >= 5000 },
    { icon: 'globe' as const, iconColor: '#1CB0F6', bg: colors.surfaceElevated, label: t('world_league'), unlocked: (leagueData?.currentTier || 1) >= 10 },
  ]), [isTurkish, streak, totalXP, leagueData, workoutCount]);

  const menuItems = React.useMemo(() => ([
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <AlertComponent />

      {/* Top Header Row with Back + Settings */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm }}>
        <TouchableOpacity onPress={() => safeGoBack(navigation, isProfessional ? 'ProfessionalMain' : 'Main')} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8 }}>
          <Ionicons name="settings-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 74, height: 74, borderRadius: 37 }} />
              ) : (
                <Ionicons name="person" size={36} color={colors.primary} />
              )}
            </View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.handle}>@{profile?.username || 'user'} • Joined {profile?.created_at ? new Date(profile.created_at).toLocaleString('en-US', { month: 'short', year: 'numeric' }) : 'Feb 2026'}</Text>

            {/* Edit Profile Button */}
            <View style={{ alignItems: 'center', marginTop: SPACING.md }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile', { profile })}
                style={{ paddingHorizontal: SPACING.xl, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ ...TYPOGRAPHY.button, color: colors.text, fontSize: 13 }}>{t('edit_profile')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── BIO INFO (height, weight, gender, age) ─── */}
          <View style={styles.bioGrid}>
            <View style={styles.bioCard}>
              <Ionicons name="resize" size={18} color="#1CB0F6" />
              <Text style={styles.bioValue}>{profile?.height ? `${profile.height} cm` : '--'}</Text>
              <Text style={styles.bioLabel}>{t('height')}</Text>
            </View>
            <View style={styles.bioCard}>
              <Ionicons name="barbell" size={18} color="#FF9600" />
              <Text style={styles.bioValue}>{profile?.weight ? `${profile.weight} kg` : '--'}</Text>
              <Text style={styles.bioLabel}>{t('weight')}</Text>
            </View>
            <View style={styles.bioCard}>
              <Ionicons name={profile?.gender === 'female' ? 'female' : 'male'} size={18} color="#CE82FF" />
              <Text style={styles.bioValue}>{profile?.gender === 'female' ? t('gender_female') : profile?.gender === 'male' ? t('gender_male') : '--'}</Text>
              <Text style={styles.bioLabel}>{t('gender')}</Text>
            </View>
            <View style={styles.bioCard}>
              <Ionicons name="calendar" size={18} color="#FF4B4B" />
              <Text style={styles.bioValue}>{age ?? '--'}</Text>
              <Text style={styles.bioLabel}>{t('age') || (isTurkish ? 'Yaş' : 'Age')}</Text>
            </View>
          </View >

          {/* ─── HEALTH CALCULATIONS (BMI, BMR, TDEE) ─── */}
          {
            healthStats ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>{t('body_analysis')}</Text>
                <View style={styles.bioGrid}>
                  <View style={[styles.bioCard, { borderWidth: 1.5, borderColor: healthStats.bmiColor + '30' }]}>
                    <Ionicons name="analytics" size={18} color={healthStats.bmiColor} />
                    <Text style={[styles.bioValue, { color: healthStats.bmiColor }]}>{healthStats.bmi.toFixed(1)}</Text>
                    <Text style={styles.bioLabel}>BMI • {healthStats.bmiCategory}</Text>
                  </View>
                  <View style={styles.bioCard}>
                    <Ionicons name="flame" size={18} color="#FF6B6B" />
                    <Text style={styles.bioValue}>{Math.round(healthStats.bmr)}</Text>
                    <Text style={styles.bioLabel}>BMR (kcal)</Text>
                  </View>
                  <View style={styles.bioCard}>
                    <Ionicons name="trending-up" size={18} color="#58CC02" />
                    <Text style={styles.bioValue}>{healthStats.tdee}</Text>
                    <Text style={styles.bioLabel}>TDEE (kcal)</Text>
                  </View>
                  <View style={styles.bioCard}>
                    <Ionicons name="restaurant" size={18} color="#FF9600" />
                    <Text style={styles.bioValue}>{healthStats.proteinNeed}g</Text>
                    <Text style={styles.bioLabel}>{isTurkish ? 'Protein İht.' : 'Protein Need'}</Text>
                  </View>
                </View>
              </View>
            ) : null
          }

          {/* ─── STATISTICS (2x2 colored cards like Duolingo) ─── */}
          <Text style={styles.sectionTitle}>{isTurkish ? 'İstatistikler' : 'Statistics'}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, width: STAT_W }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.borderLight }]}>
                <Ionicons name="flame" size={22} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>{isTurkish ? 'Gün Serisi' : 'Day Streak'}</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, width: STAT_W }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.borderLight }]}>
                <Ionicons name="flash" size={22} color="#FFC800" />
              </View>
              <View>
                <Text style={styles.statValue}>{totalXP}</Text>
                <Text style={styles.statLabel}>{isTurkish ? 'Toplam XP' : 'Total XP'}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.surfaceElevated, width: STAT_W }]} onPress={() => navigation.navigate('League')}>
              <View style={[styles.statIcon, { backgroundColor: colors.borderLight }]}>
                <LeagueTierIcon tier={tierInfo.tier} size={24} />
              </View>
              <View>
                <Text style={styles.statValue}>{isTurkish ? tierInfo.nameTr : tierInfo.name}</Text>
                <Text style={styles.statLabel}>{isTurkish ? 'Lig' : 'League'}</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, width: STAT_W }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.borderLight }]}>
                <Ionicons name="fitness" size={22} color="#1CB0F6" />
              </View>
              <View>
                <Text style={styles.statValue}>{workoutCount}</Text>
                <Text style={styles.statLabel}>{isTurkish ? 'Antrenman' : 'Workouts'}</Text>
              </View>
            </View>
          </View>

          {/* ─── ACHIEVEMENTS (horizontal scroll like Duolingo) ─── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{isTurkish ? 'Başarımlar' : 'Achievements'}</Text>
            <TouchableOpacity><Text style={styles.viewAll}>{isTurkish ? 'TÜMÜ' : 'VIEW ALL'}</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achieveScroll}>
            {achievements.map((a, i) => (
              <View key={i} style={[styles.achieveCard, !a.unlocked && styles.achieveLocked, { backgroundColor: a.unlocked ? a.bg : colors.surface }]}>
                <View style={[styles.achieveIconWrap, { backgroundColor: a.unlocked ? a.iconColor + '20' : colors.borderLight }]}>
                  <Ionicons name={a.icon} size={22} color={a.unlocked ? a.iconColor : colors.textTertiary} />
                </View>
                <Text style={[styles.achieveLabel, !a.unlocked && { color: colors.textTertiary }]}>{a.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* ─── PROGRESS CHART ─── */}
          {LineChart && (
            <>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{isTurkish ? 'Aylık Takipler' : 'Monthly Tracking'}</Text>
                <View style={styles.legendWrap}>
                  {trackingLegend.map((legendItem) => (
                    <View key={legendItem.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: legendItem.color }]} />
                      <Text style={styles.legendText}>{legendItem.label}</Text>
                    </View>
                  ))}
                </View>
                <LineChart
                  data={trackingChartData}
                  width={width - 40 - 32}
                  height={180}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(88, 204, 2, ${opacity})`,
                    labelColor: () => colors.textTertiary,
                    propsForDots: { r: '3', strokeWidth: '1' },
                    propsForBackgroundLines: { stroke: colors.borderLight, strokeDasharray: '' }
                  }}
                  bezier
                  style={{ borderRadius: 12, marginLeft: -8 }}
                  withShadow={false}
                />
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{isTurkish ? 'Program Bazlı Spor Takibi' : 'Program Workout Tracking'}</Text>
                <View style={styles.programSummaryRow}>
                  <View style={[styles.programSummaryChip, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.programSummaryText, { color: colors.success }]}>{isTurkish ? 'Artır' : 'Increase'}: {programAdjustments.increase}</Text>
                  </View>
                  <View style={[styles.programSummaryChip, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.programSummaryText, { color: colors.info }]}>{isTurkish ? 'Sabit' : 'Stable'}: {programAdjustments.stable}</Text>
                  </View>
                  <View style={[styles.programSummaryChip, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.programSummaryText, { color: colors.warning }]}>{isTurkish ? 'Azalt' : 'Decrease'}: {programAdjustments.decrease}</Text>
                  </View>
                </View>
                <LineChart
                  data={programProgressData}
                  width={width - 40 - 32}
                  height={150}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(88, 204, 2, ${opacity})`,
                    labelColor: () => colors.textTertiary,
                    propsForDots: { r: '4', strokeWidth: '2', stroke: '#58CC02' },
                    propsForBackgroundLines: { stroke: colors.borderLight, strokeDasharray: '' }
                  }}
                  bezier
                  style={{ borderRadius: 12, marginLeft: -8 }}
                  withShadow={false}
                />
              </View>
            </>
          )}



          {/* ─── MENU ITEMS ─── */}
          <View style={styles.menuCard}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i < menuItems.length - 1 && styles.menuBorder]}
                onPress={item.onPress}
                activeOpacity={0.6}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── SIGN OUT ─── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>{isTurkish ? 'Çıkış Yap' : 'Sign Out'}</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </Animated.View >
      </ScrollView >
    </View >
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  scroll: { paddingHorizontal: 20 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: colors.primary, marginBottom: 14,
  },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 2 },
  handle: { fontSize: 13, color: colors.textTertiary, marginBottom: 18 },

  // Bio info
  bioGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, gap: 10, paddingHorizontal: 4 },
  bioCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.borderLight },
  bioValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  bioLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary },

  // Section
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  viewAll: { fontSize: 13, fontWeight: '700', color: colors.primary },

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
    borderWidth: 1, borderColor: colors.borderLight,
  },
  achieveLocked: { opacity: 0.5, borderStyle: 'dashed' },
  achieveIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  achieveLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, marginTop: 8, textAlign: 'center', maxWidth: 70 },

  // Chart
  chartCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight,
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
  menuCard: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTitle: { fontSize: 14, fontWeight: '500', color: colors.text, flex: 1 },

  // Logout
  logoutBtn: {
    alignItems: 'center', paddingVertical: 16,
    borderRadius: 16, borderWidth: 1.5, borderColor: colors.error,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.error },
});

export default ProfileScreen;
