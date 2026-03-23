import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  useWindowDimensions, Animated, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SpotifyPlayer from '../components/SpotifyPlayer';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../components/CustomAlert';

let BodyHighlighter: any = null;
try { BodyHighlighter = require('react-native-body-highlighter').default; } catch { BodyHighlighter = null; }

const MUSCLE_TO_BODY: Record<string, string[]> = {
  chest: ['chest'], lats: ['upper-back'], shoulders: ['deltoids'],
  biceps: ['biceps'], triceps: ['triceps'], forearms: ['forearm'],
  abdominals: ['abs'], quadriceps: ['quadriceps'], hamstrings: ['hamstring'],
  glutes: ['gluteal'], calves: ['calves'], traps: ['trapezius'],
  'middle back': ['upper-back'], 'lower back': ['lower-back'],
};

// Workout type categories (STRENGTH / CALISTHENICS / CARDIO)
const WORKOUT_TYPES = [
  { id: 'strength', txKey: 'weightTraining', icon: 'barbell' as const, gradient: ['#FF6B6B', '#FF9600'] as const },
  { id: 'calisthenics', txKey: 'calisthenics', icon: 'body' as const, gradient: ['#667eea', '#764ba2'] as const },
  { id: 'cardio', txKey: 'cardio', icon: 'heart' as const, gradient: ['#38ef7d', '#11998e'] as const },
] as const;

// DB muscle_group values
const MUSCLE_GROUPS = [
  { id: 'chest', icon: 'fitness' as const, txKey: 'chest', color: '#FF6B6B' },
  { id: 'lats', icon: 'expand' as const, txKey: 'lats', color: '#1CB0F6' },
  { id: 'shoulders', icon: 'barbell' as const, txKey: 'shoulders', color: '#FF9600' },
  { id: 'biceps', icon: 'hand-left' as const, txKey: 'biceps', color: '#CE82FF' },
  { id: 'triceps', icon: 'hand-right' as const, txKey: 'triceps', color: '#f093fb' },
  { id: 'forearms', icon: 'hand-left' as const, txKey: 'forearms', color: '#89f7fe' },
  { id: 'abdominals', icon: 'disc' as const, txKey: 'abs', color: '#38ef7d' },
  { id: 'quadriceps', icon: 'walk' as const, txKey: 'quads', color: '#667eea' },
  { id: 'hamstrings', icon: 'walk' as const, txKey: 'hamstrings', color: '#FFC800' },
  { id: 'glutes', icon: 'fitness' as const, txKey: 'glutes', color: '#FF4B4B' },
  { id: 'calves', icon: 'footsteps' as const, txKey: 'calves', color: '#58CC02' },
  { id: 'traps', icon: 'triangle' as const, txKey: 'traps', color: '#764ba2' },
  { id: 'middle back', icon: 'body' as const, txKey: 'middle_back', color: '#11998e' },
  { id: 'lower back', icon: 'body' as const, txKey: 'lower_back', color: '#f5576c' },
] as const;

const WorkoutScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const st = React.useMemo(() => getStyles(colors), [colors]);

  const { width } = useWindowDimensions();
  const [selectedType, setSelectedType] = useState('strength');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showFront, setShowFront] = useState(true);
  const [bodyGender, setBodyGender] = useState<'male' | 'female'>('male');
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { AlertComponent } = useAlert();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    return () => fadeAnim.stopAnimation();
  }, []);

  const getHighlightedMuscles = () => {
    if (!selectedMuscle) return [];
    return (MUSCLE_TO_BODY[selectedMuscle] || []).map(slug => ({ slug, intensity: 2 }));
  };

  const onMusclePress = (muscle: typeof MUSCLE_GROUPS[0]) => {
    setSelectedMuscle(selectedMuscle === muscle.id ? null : muscle.id);
  };

  const confirmAndNavigate = () => {
    if (!selectedMuscle) return;
    const muscle = MUSCLE_GROUPS.find(m => m.id === selectedMuscle);
    if (!muscle) return;
    navigation.navigate('MuscleExercises', {
      muscleGroup: muscle.id,
      workoutType: selectedType,
      muscleName: t(muscle.txKey as any),
    });
  };

  const selectedMuscleInfo = MUSCLE_GROUPS.find(m => m.id === selectedMuscle);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} />
      <AlertComponent />
      <ScrollView
        contentContainerStyle={[st.scroll]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={st.headerRow}>
            <Text style={st.headerTitle}>{t('workout')}</Text>
          </View>

          {/* Spotify */}
          <View style={{ marginBottom: 16 }}><SpotifyPlayer /></View>

          {/* WORKOUT TYPE: Strength / Calisthenics / Cardio */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.typeScroll}>
            {WORKOUT_TYPES.map(type => {
              const active = selectedType === type.id;
              return (
                <TouchableOpacity key={type.id} activeOpacity={0.85} onPress={() => setSelectedType(type.id)}>
                  <LinearGradient
                    colors={active ? [...type.gradient] : ['#F5F5F5', '#F5F5F5']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[st.typeCard, active && st.typeCardActive]}
                  >
                    <Ionicons name={type.icon} size={22} color={active ? colors.background : '#6B7280'} />
                    <Text style={[st.typeLabel, active && st.typeLabelActive]}>{t(type.txKey as any)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* MAIN CONTENT AREA */}
          {selectedType === 'cardio' ? (
            <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
              <View style={{ width: 100, height: 100, borderRadius: 30, backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Ionicons name="heart" size={50} color="#58CC02" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
                {t('cardio_workouts')}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginBottom: 32 }}>
                {t('cardio_desc')}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={{ width: '100%' }}
                onPress={() => navigation.navigate('MuscleExercises', {
                  muscleGroup: '',
                  category: 'all', // Don't filter by category 'cardio' which might not exist in DB columns
                  workoutType: 'cardio', // This triggers the smart search in SupabaseService
                  muscleName: t('cardio')
                })}
              >
                <LinearGradient colors={['#38ef7d', '#11998e']} style={st.confirmBtn}>
                  <Ionicons name="flame" size={20} color={colors.background} />
                  <Text style={st.confirmText}>
                    {t('start_cardio')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Gender/Front-Back Toggle */}
              <View style={st.toggleRow}>
                <Text style={st.sectionTitle}>{t('selectMuscleGroup')}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => setBodyGender(g => g === 'male' ? 'female' : 'male')} style={st.toggleBtn}>
                    <Ionicons name={bodyGender === 'male' ? 'male' : 'female'} size={14} color="#58CC02" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowFront(!showFront)} style={st.toggleBtn}>
                    <Ionicons name="sync" size={14} color="#58CC02" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* BODY + MUSCLES SIDE-BY-SIDE */}
              <View style={st.bodyRow}>
                <View style={[st.bodyCol, { width: width * 0.42 }]}>
                  {BodyHighlighter ? (
                    <BodyHighlighter
                      data={getHighlightedMuscles()}
                      gender={bodyGender}
                      side={showFront ? 'front' : 'back'}
                      scale={0.85}
                      colors={['#58CC02', '#FF4B4B']}
                    />
                  ) : (
                    <View style={st.bodyPlaceholder}>
                      <Ionicons name="body" size={80} color="#58CC02" />
                    </View>
                  )}
                </View>

                <View style={st.muscleCol}>
                  <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {MUSCLE_GROUPS.map(m => {
                      const isSelected = selectedMuscle === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[st.muscleBtn, isSelected && { backgroundColor: m.color + '15', borderColor: m.color }]}
                          onPress={() => onMusclePress(m as any)}
                          activeOpacity={0.7}
                        >
                          <View style={[st.muscleDot, { backgroundColor: m.color }]} />
                          <Text style={[st.muscleBtnText, isSelected && { color: m.color, fontWeight: '700' }]}>{t(m.txKey as any)}</Text>
                          {isSelected ? (
                            <Ionicons name="checkmark-circle" size={18} color={m.color} />
                          ) : (
                            <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {selectedMuscle && selectedMuscleInfo && (
                <TouchableOpacity activeOpacity={0.85} onPress={confirmAndNavigate} style={{ marginTop: 16 }}>
                  <LinearGradient colors={[selectedMuscleInfo.color, selectedMuscleInfo.color + 'CC']} style={st.confirmBtn}>
                    <Ionicons name="arrow-forward" size={20} color={colors.background} />
                    <Text style={st.confirmText}>
                      {t('view_exercises', { muscle: t(selectedMuscleInfo.txKey as any) })}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  headerTitle: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },

  typeScroll: { gap: 10, marginBottom: 20, paddingRight: 12 },
  typeCard: { paddingHorizontal: 18, height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  typeCardActive: { borderColor: 'transparent', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  typeLabel: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  typeLabelActive: { color: colors.background },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  toggleBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center' },

  bodyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  bodyCol: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  bodyPlaceholder: { alignItems: 'center', justifyContent: 'center', height: 280 },
  muscleCol: { flex: 1, maxHeight: 380 },

  muscleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 6, borderWidth: 1.5, borderColor: '#F0F0F0',
  },
  muscleDot: { width: 8, height: 8, borderRadius: 4 },
  muscleBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 18, paddingVertical: 16,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  confirmText: { fontSize: 16, fontWeight: '800', color: colors.background },
});

export default WorkoutScreen;
