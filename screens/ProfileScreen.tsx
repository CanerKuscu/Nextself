import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, Animated, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '../services/supabase';
import { LeagueService, LEAGUE_TIERS, UserLeagueData } from '../services/leagueService';
import { StreakService, StreakData } from '../services/streakService';
import { StoreService, UserCurrency } from '../services/storeService';
import { useTranslation } from '../hooks/useTranslation';
import { useSupabaseAuth } from '../contexts/SupabaseContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import LeagueTierIcon from '../components/LeagueTierIcon';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

let LineChart: any;
try { LineChart = require('react-native-chart-kit').LineChart; } catch { }

const ProfileScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const { width } = useWindowDimensions();

  const STAT_W = (width - 40 - 12) / 2;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leagueData, setLeagueData] = useState<UserLeagueData | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [currency, setCurrency] = useState<UserCurrency | null>(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const { t, isTurkish, language, setLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isProfessional, setIsProfessional] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const supabase = SupabaseService.getInstance();
      const { user: contextUser, proxiedFetch } = useSupabaseAuth();
      let currentUser: any = contextUser ?? null;
      if (!currentUser) {
        const cur = await supabase.getCurrentUser();
        currentUser = cur.user;
      }

      if (currentUser) {
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
          const [leagueResult, streakResult, currencyResult, workoutResult] = await Promise.allSettled([
            LeagueService.getInstance().getUserLeague(),
            StreakService.getInstance().getStreak(),
            StoreService.getInstance().getUserCurrency(),
            // Use proxiedFetch to get workouts list and count on web
            proxiedFetch('GET', 'workouts', { query: `user_id=eq.${currentUser.id}&select=id` }),
          ]);
          if (leagueResult.status === 'fulfilled') setLeagueData(leagueResult.value);
          if (streakResult.status === 'fulfilled') setStreakData(streakResult.value);
          if (currencyResult.status === 'fulfilled') setCurrency(currencyResult.value);
          if (workoutResult.status === 'fulfilled') {
            const v: any = workoutResult.value;
            if (v && v.ok && Array.isArray(v.data)) setWorkoutCount(v.data.length || 0);
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
          const [leagueResult, streakResult, currencyResult, workoutResult] = await Promise.allSettled([
            LeagueService.getInstance().getUserLeague(),
            StreakService.getInstance().getStreak(),
            StoreService.getInstance().getUserCurrency(),
            supabase.getClient().from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
          ]);
          if (leagueResult.status === 'fulfilled') setLeagueData(leagueResult.value);
          if (streakResult.status === 'fulfilled') setStreakData(streakResult.value);
          if (currencyResult.status === 'fulfilled') setCurrency(currencyResult.value);
          if (workoutResult.status === 'fulfilled') setWorkoutCount(workoutResult.value.count || 0);

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
    finally { setLoading(false); Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const bd = new Date(dob); const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  };

  const handleLogout = () => {
    showAlert({
      type: 'confirm',
      title: isTurkish ? 'Çıkış Yap' : 'Sign Out',
      message: isTurkish ? 'Çıkış yapmak istediğinize emin misiniz?' : 'Are you sure you want to sign out?',
      buttons: [
        { text: isTurkish ? 'İptal' : 'Cancel', style: 'cancel' },
        {
          text: isTurkish ? 'Çıkış Yap' : 'Sign Out', style: 'destructive',
          onPress: async () => { const s = SupabaseService.getInstance(); await s.signOut(); navigation.replace('Auth'); }
        },
      ],
    });
  };

  const age = profile?.dob ? calculateAge(profile.dob) : null;
  const name = profile?.full_name || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile?.username) || (isTurkish ? 'Kullanıcı' : 'User');

  const streak = streakData?.currentStreak || 0;
  const totalXP = leagueData?.total_xp || 0;
  const tierInfo = leagueData ? LEAGUE_TIERS.find(l => l.tier === leagueData.current_tier) || LEAGUE_TIERS[0] : LEAGUE_TIERS[0];

  const progressData = {
    labels: isTurkish ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: [0, 2, 5, 8, 12, 15] }],
  };

  const achievements = [
    { icon: 'flame' as const, iconColor: '#FF6B6B', bg: '#FFF0F0', label: isTurkish ? 'Hafta Serisi' : 'Week Streak', unlocked: streak >= 7 },
    { icon: 'flash' as const, iconColor: '#FFC800', bg: '#FFFBEB', label: '100 XP', unlocked: totalXP >= 100 },
    { icon: 'trophy' as const, iconColor: '#FF9600', bg: '#FFF5EB', label: isTurkish ? 'İlk 10' : 'Top 10', unlocked: (leagueData?.rank_in_group || 0) > 0 && (leagueData?.rank_in_group || 99) <= 10 },
    { icon: 'barbell' as const, iconColor: '#1CB0F6', bg: '#E0F4FF', label: isTurkish ? '10 Antrenman' : '10 Workouts', unlocked: workoutCount >= 10 },
    { icon: 'fitness' as const, iconColor: '#58CC02', bg: '#E8FFE0', label: isTurkish ? 'Güçlü' : 'Strong', unlocked: workoutCount >= 50 },
    { icon: 'rocket' as const, iconColor: '#CE82FF', bg: '#F5F0FF', label: isTurkish ? 'İlk Gün' : 'Day One', unlocked: true },
    { icon: 'star' as const, iconColor: '#FFD700', bg: '#FFFBEB', label: '500 XP', unlocked: totalXP >= 500 },
    { icon: 'medal' as const, iconColor: '#CD7F32', bg: '#FFF5EB', label: isTurkish ? '30 Gün Serisi' : '30 Day Streak', unlocked: streak >= 30 },
    { icon: 'shield-checkmark' as const, iconColor: '#0F52BA', bg: '#E0F4FF', label: isTurkish ? 'İlk 3' : 'Top 3', unlocked: (leagueData?.rank_in_group || 0) > 0 && (leagueData?.rank_in_group || 99) <= 3 },
    { icon: 'restaurant' as const, iconColor: '#FF9600', bg: '#FFF5EB', label: isTurkish ? '50 Öğün' : '50 Meals', unlocked: false },
    { icon: 'water' as const, iconColor: '#1CB0F6', bg: '#E0F4FF', label: isTurkish ? 'Su İçici' : 'Hydrated', unlocked: false },
    { icon: 'ribbon' as const, iconColor: '#E0115F', bg: '#FFF0F5', label: isTurkish ? 'Terfi' : 'Promoted', unlocked: (leagueData?.promotion_count || 0) > 0 },
    { icon: 'sparkles' as const, iconColor: '#B9F2FF', bg: '#F0FAFF', label: '1000 XP', unlocked: totalXP >= 1000 },
    { icon: 'body' as const, iconColor: '#58CC02', bg: '#E8FFE0', label: isTurkish ? '100 Antrenman' : '100 Workouts', unlocked: workoutCount >= 100 },
    { icon: 'heart' as const, iconColor: '#FF4B4B', bg: '#FFF0F0', label: isTurkish ? 'Sağlıklı' : 'Healthy', unlocked: false },
    { icon: 'people' as const, iconColor: '#CE82FF', bg: '#F5F0FF', label: isTurkish ? 'Sosyal' : 'Social', unlocked: false },
    { icon: 'trending-up' as const, iconColor: '#58CC02', bg: '#E8FFE0', label: isTurkish ? '5kg Hedef' : '5kg Goal', unlocked: false },
    { icon: 'time' as const, iconColor: '#FF9600', bg: '#FFF5EB', label: isTurkish ? '90 Gün Serisi' : '90 Day Streak', unlocked: streak >= 90 },
    { icon: 'diamond' as const, iconColor: '#0F52BA', bg: '#E0F4FF', label: '5000 XP', unlocked: totalXP >= 5000 },
    { icon: 'globe' as const, iconColor: '#1CB0F6', bg: '#E0F4FF', label: isTurkish ? 'Dünya Ligi' : 'World League', unlocked: (leagueData?.current_tier || 1) >= 10 },
  ];

  const menuItems = [
    ...(isProfessional ? [
      { icon: 'briefcase-outline', title: isTurkish ? 'Profesyonel Panel' : 'Professional Panel', color: '#8B5CF6', onPress: () => navigation.navigate('ProfessionalHome') },
      { icon: 'people-circle-outline', title: isTurkish ? 'Danışanlarım' : 'My Clients', color: '#06B6D4', onPress: () => navigation.navigate('ClientsList') },
    ] : []),
    { icon: 'trophy-outline', title: isTurkish ? 'Lig Sıralaması' : 'League Rankings', color: '#FFC800', onPress: () => navigation.navigate('League') },
    { icon: 'cart-outline', title: isTurkish ? 'Mağaza' : 'Store', color: '#58CC02', onPress: () => navigation.navigate('Store') },
    { icon: 'stats-chart-outline', title: isTurkish ? 'İlerleme Raporu' : 'Progress Report', color: '#3498db', onPress: () => navigation.navigate('ProgressReport') },
    { icon: 'scale-outline', title: isTurkish ? 'Akıllı Tartı' : 'Smart Scale', color: '#FF9600', onPress: () => navigation.navigate('SmartScale') },
    { icon: 'people-outline', title: isTurkish ? 'PT / Diyetisyen Bul' : 'Find PT / Dietitian', color: '#1CB0F6', onPress: () => navigation.navigate('ProfessionalSearch') },
    { icon: 'shield-checkmark-outline', title: isTurkish ? 'Veri Gizliliği' : 'Data Privacy', color: '#CE82FF', onPress: () => navigation.navigate('DataPrivacy') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <AlertComponent />

      {/* Top Header Row with Settings Icon */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm }}>
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
                <Ionicons name="person" size={36} color="#58CC02" />
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
                <Text style={{ ...TYPOGRAPHY.button, color: colors.text, fontSize: 13 }}>{isTurkish ? 'Profili Düzenle' : 'Edit Profile'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── BIO INFO (height, weight, gender, age) ─── */}
          <View style={styles.bioGrid}>
            <View style={styles.bioCard}>
              <Ionicons name="resize" size={18} color="#1CB0F6" />
              <Text style={styles.bioValue}>{profile?.height ? `${profile.height} cm` : '--'}</Text>
              <Text style={styles.bioLabel}>{isTurkish ? 'Boy' : 'Height'}</Text>
            </View>
            <View style={styles.bioCard}>
              <Ionicons name="barbell" size={18} color="#FF9600" />
              <Text style={styles.bioValue}>{profile?.weight ? `${profile.weight} kg` : '--'}</Text>
              <Text style={styles.bioLabel}>{isTurkish ? 'Kilo' : 'Weight'}</Text>
            </View>
            <View style={styles.bioCard}>
              <Ionicons name={profile?.gender === 'female' ? 'female' : 'male'} size={18} color="#CE82FF" />
              <Text style={styles.bioValue}>{profile?.gender === 'female' ? (isTurkish ? 'Kadın' : 'Female') : profile?.gender === 'male' ? (isTurkish ? 'Erkek' : 'Male') : '--'}</Text>
              <Text style={styles.bioLabel}>{isTurkish ? 'Cinsiyet' : 'Gender'}</Text>
            </View>
            <View style={styles.bioCard}>
              <Ionicons name="calendar" size={18} color="#FF4B4B" />
              <Text style={styles.bioValue}>{age ?? '--'}</Text>
              <Text style={styles.bioLabel}>{isTurkish ? 'Yaş' : 'Age'}</Text>
            </View>
          </View >

          {/* ─── HEALTH CALCULATIONS (BMI, BMR, TDEE) ─── */}
          {
            profile?.height && profile?.weight ? (() => {
              const h = profile.height / 100; // meters
              const w = profile.weight;
              const bmi = w / (h * h);
              const bmiCategory = bmi < 18.5 ? (isTurkish ? 'Zayıf' : 'Underweight')
                : bmi < 25 ? (isTurkish ? 'Normal' : 'Normal')
                  : bmi < 30 ? (isTurkish ? 'Fazla Kilolu' : 'Overweight')
                    : (isTurkish ? 'Obez' : 'Obese');
              const bmiColor = bmi < 18.5 ? '#1CB0F6' : bmi < 25 ? '#58CC02' : bmi < 30 ? '#FF9600' : '#FF4B4B';

              // BMR (Mifflin-St Jeor)
              let bmr = 10 * w + 6.25 * profile.height - 5 * (age || 25);
              bmr = profile?.gender === 'female' ? bmr - 161 : bmr + 5;
              const tdee = Math.round(bmr * 1.55); // moderate activity

              return (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.sectionTitle}>{isTurkish ? 'Vücut Analizi' : 'Body Analysis'}</Text>
                  <View style={styles.bioGrid}>
                    <View style={[styles.bioCard, { borderWidth: 1.5, borderColor: bmiColor + '30' }]}>
                      <Ionicons name="analytics" size={18} color={bmiColor} />
                      <Text style={[styles.bioValue, { color: bmiColor }]}>{bmi.toFixed(1)}</Text>
                      <Text style={styles.bioLabel}>BMI • {bmiCategory}</Text>
                    </View>
                    <View style={styles.bioCard}>
                      <Ionicons name="flame" size={18} color="#FF6B6B" />
                      <Text style={styles.bioValue}>{Math.round(bmr)}</Text>
                      <Text style={styles.bioLabel}>BMR (kcal)</Text>
                    </View>
                    <View style={styles.bioCard}>
                      <Ionicons name="trending-up" size={18} color="#58CC02" />
                      <Text style={styles.bioValue}>{tdee}</Text>
                      <Text style={styles.bioLabel}>TDEE (kcal)</Text>
                    </View>
                    <View style={styles.bioCard}>
                      <Ionicons name="restaurant" size={18} color="#FF9600" />
                      <Text style={styles.bioValue}>{Math.round(w * 1.8)}g</Text>
                      <Text style={styles.bioLabel}>{isTurkish ? 'Protein İht.' : 'Protein Need'}</Text>
                    </View>
                  </View>
                </View>
              );
            })() : null
          }

          {/* ─── STATISTICS (2x2 colored cards like Duolingo) ─── */}
          <Text style={styles.sectionTitle}>{isTurkish ? 'İstatistikler' : 'Statistics'}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#FFF5F0', width: STAT_W }]}>
              <View style={[styles.statIcon, { backgroundColor: '#FFDED0' }]}>
                <Ionicons name="flame" size={22} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>{isTurkish ? 'Gün Serisi' : 'Day Streak'}</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFFBEB', width: STAT_W }]}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF0C1' }]}>
                <Ionicons name="flash" size={22} color="#FFC800" />
              </View>
              <View>
                <Text style={styles.statValue}>{totalXP}</Text>
                <Text style={styles.statLabel}>{isTurkish ? 'Toplam XP' : 'Total XP'}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.statCard, { backgroundColor: '#F5F0FF', width: STAT_W }]} onPress={() => navigation.navigate('League')}>
              <View style={[styles.statIcon, { backgroundColor: '#E8DEFF' }]}>
                <LeagueTierIcon tier={tierInfo.tier} size={24} />
              </View>
              <View>
                <Text style={styles.statValue}>{isTurkish ? tierInfo.nameTr : tierInfo.name}</Text>
                <Text style={styles.statLabel}>{isTurkish ? 'Lig' : 'League'}</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.statCard, { backgroundColor: '#EBF5FF', width: STAT_W }]}>
              <View style={[styles.statIcon, { backgroundColor: '#D0E8FF' }]}>
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
                <View style={[styles.achieveIconWrap, { backgroundColor: a.unlocked ? a.iconColor + '20' : '#F0F0F0' }]}>
                  <Ionicons name={a.icon} size={22} color={a.unlocked ? a.iconColor : colors.textTertiary} />
                </View>
                <Text style={[styles.achieveLabel, !a.unlocked && { color: colors.textTertiary }]}>{a.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* ─── PROGRESS CHART ─── */}
          {
            LineChart && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{isTurkish ? 'Aylık İlerleme' : 'Monthly Progress'}</Text>
                <LineChart
                  data={progressData}
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
                    propsForBackgroundLines: { stroke: '#F0F0F0', strokeDasharray: '' }
                  }}
                  bezier
                  style={{ borderRadius: 12, marginLeft: -8 }}
                  withShadow={false}
                />
              </View>
            )
          }



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
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
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
  topRow: { alignItems: 'flex-end', marginBottom: 8 },
  gearBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#58CC02', marginBottom: 14,
  },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 2 },
  handle: { fontSize: 13, color: colors.textTertiary, marginBottom: 18 },
  username: { fontSize: 13, color: colors.textTertiary, marginBottom: 18 },

  // Follow counts
  followRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 18 },
  followItem: { alignItems: 'center' },
  followValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  followLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  followDivider: { width: 1, height: 28, backgroundColor: '#F0F0F0' },

  // Add Friends
  addFriendsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: '#58CC02',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16,
  },
  addFriendsBtnText: { fontSize: 14, fontWeight: '800', color: '#58CC02', letterSpacing: 0.5 },

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

export default ProfileScreen;
