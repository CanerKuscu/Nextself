import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import GlassCard from '../components/GlassCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const getDifficultyColor = (d: string) => {
    if (d === 'beginner') return '#58CC02';
    if (d === 'intermediate') return '#FF9600';
    if (d === 'advanced') return '#FF4B4B';
    return '#AFAFBF';
};

const ExerciseDetailScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { exercise } = route.params;
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const [showAllInstructions, setShowAllInstructions] = useState(false);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
    }, []);

    const dc = getDifficultyColor(exercise.difficulty);
    const name = isTurkish && exercise.name_tr ? exercise.name_tr : exercise.name;
    const description = isTurkish && exercise.description_tr ? exercise.description_tr : exercise.description;
    const muscleGroup = isTurkish && exercise.muscle_group_tr ? exercise.muscle_group_tr : exercise.muscle_group;
    const instructions = isTurkish && exercise.instructions_tr ? exercise.instructions_tr : exercise.instructions;
    const tips = isTurkish && exercise.tips_tr ? exercise.tips_tr : exercise.tips;
    const equipment = exercise.equipment || (isTurkish ? 'Ekipman yok' : 'No equipment');

    const difficultyLabel = exercise.difficulty === 'beginner'
        ? (isTurkish ? 'Başlangıç' : 'Beginner')
        : exercise.difficulty === 'intermediate'
            ? (isTurkish ? 'Orta' : 'Intermediate')
            : exercise.difficulty === 'advanced'
                ? (isTurkish ? 'İleri' : 'Advanced')
                : exercise.difficulty;

    const instructionList = Array.isArray(instructions) ? instructions : (instructions || '').split('\n').filter(Boolean);
    const tipList = Array.isArray(tips) ? tips : (tips || '').split('\n').filter(Boolean);
    const visibleInstructions = showAllInstructions ? instructionList : instructionList.slice(0, 4);

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
            {/* Hero Header */}
            <View style={styles.heroWrap}>
                {exercise.image_url ? (
                    <Image source={{ uri: exercise.image_url }} style={styles.heroImage} resizeMode="cover" />
                ) : (
                    <LinearGradient colors={[dc + '30', dc + '10']} style={styles.heroPlaceholder}>
                        <Ionicons name="fitness" size={80} color={dc} />
                    </LinearGradient>
                )}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.heroOverlay}>
                    <View style={[styles.headerBtns, { paddingTop: insets.top + 8 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color={colors.background} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>{name}</Text>
                        <View style={styles.heroMeta}>
                            <View style={[styles.badge, { backgroundColor: dc + '30' }]}>
                                <View style={[styles.badgeDot, { backgroundColor: dc }]} />
                                <Text style={[styles.badgeText, { color: dc }]}>{difficultyLabel}</Text>
                            </View>
                            <View style={styles.badge}>
                                <Ionicons name="body-outline" size={12} color={colors.background} />
                                <Text style={styles.badgeText}>{muscleGroup}</Text>
                            </View>
                            {exercise.calories_per_minute ? (
                                <View style={styles.badge}>
                                    <Ionicons name="flame" size={12} color="#FF6B6B" />
                                    <Text style={styles.badgeText}>{exercise.calories_per_minute} cal/min</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* Description */}
                    {description ? (
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>{isTurkish ? 'Açıklama' : 'Description'}</Text>
                            <Text style={styles.descText}>{description}</Text>
                        </GlassCard>
                    ) : null}

                    {/* Quick Stats */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: '#FFF5F0' }]}>
                            <Ionicons name="barbell-outline" size={20} color="#FF9600" />
                            <Text style={styles.statValue}>{equipment}</Text>
                            <Text style={styles.statLabel}>{isTurkish ? 'Ekipman' : 'Equipment'}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#F0FFF4' }]}>
                            <Ionicons name="body-outline" size={20} color="#58CC02" />
                            <Text style={styles.statValue}>{muscleGroup}</Text>
                            <Text style={styles.statLabel}>{isTurkish ? 'Kas Grubu' : 'Muscle'}</Text>
                        </View>
                        {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
                            <View style={[styles.statCard, { backgroundColor: '#F0F0FF' }]}>
                                <Ionicons name="git-branch-outline" size={20} color="#CE82FF" />
                                <Text style={styles.statValue} numberOfLines={1}>
                                    {Array.isArray(exercise.secondary_muscles) ? exercise.secondary_muscles.join(', ') : exercise.secondary_muscles}
                                </Text>
                                <Text style={styles.statLabel}>{isTurkish ? 'İkincil' : 'Secondary'}</Text>
                            </View>
                        )}
                    </View>

                    {/* Instructions */}
                    {instructionList.length > 0 && (
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>{isTurkish ? 'Nasıl Yapılır' : 'How to Perform'}</Text>
                            {visibleInstructions.map((step: string, idx: number) => (
                                <View key={idx} style={styles.stepRow}>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumText}>{idx + 1}</Text>
                                    </View>
                                    <Text style={styles.stepText}>{step}</Text>
                                </View>
                            ))}
                            {instructionList.length > 4 && (
                                <TouchableOpacity onPress={() => setShowAllInstructions(!showAllInstructions)} style={styles.showMore}>
                                    <Text style={styles.showMoreText}>
                                        {showAllInstructions
                                            ? (isTurkish ? 'Daha az göster' : 'Show less')
                                            : (isTurkish ? `Tümünü göster (${instructionList.length})` : `Show all (${instructionList.length})`)}
                                    </Text>
                                    <Ionicons name={showAllInstructions ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </GlassCard>
                    )}

                    {/* Tips */}
                    {tipList.length > 0 && (
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>{isTurkish ? 'İpuçları' : 'Pro Tips'}</Text>
                            {tipList.map((tip: string, idx: number) => (
                                <View key={idx} style={styles.tipRow}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                                    <Text style={styles.tipText}>{tip}</Text>
                                </View>
                            ))}
                        </GlassCard>
                    )}

                    {/* Sets & Reps Recommendation */}
                    <GlassCard style={styles.card}>
                        <Text style={styles.cardTitle}>{isTurkish ? 'Önerilen Tekrar Aralığı' : 'Recommended Sets & Reps'}</Text>
                        <View style={styles.recGrid}>
                            <View style={styles.recCard}>
                                <Text style={styles.recValue}>
                                    {exercise.difficulty === 'beginner' ? '3' : exercise.difficulty === 'intermediate' ? '4' : '4-5'}
                                </Text>
                                <Text style={styles.recLabel}>{isTurkish ? 'Set' : 'Sets'}</Text>
                            </View>
                            <View style={styles.recCard}>
                                <Text style={styles.recValue}>
                                    {exercise.difficulty === 'beginner' ? '12-15' : exercise.difficulty === 'intermediate' ? '8-12' : '6-8'}
                                </Text>
                                <Text style={styles.recLabel}>{isTurkish ? 'Tekrar' : 'Reps'}</Text>
                            </View>
                            <View style={styles.recCard}>
                                <Text style={styles.recValue}>
                                    {exercise.difficulty === 'beginner' ? '60s' : exercise.difficulty === 'intermediate' ? '90s' : '120s'}
                                </Text>
                                <Text style={styles.recLabel}>{isTurkish ? 'Dinlenme' : 'Rest'}</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Start Workout Button */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('ActiveWorkout', { workoutName: name })}
                    >
                        <LinearGradient colors={[dc, dc + 'CC']} style={styles.startBtn}>
                            <Ionicons name="play" size={20} color={colors.background} />
                            <Text style={styles.startBtnText}>{isTurkish ? 'Antrenmana Başla' : 'Start Exercise'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    heroWrap: { height: 280, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
    headerBtns: { flexDirection: 'row', paddingHorizontal: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    heroContent: { paddingHorizontal: 20, paddingBottom: 20 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: colors.background, marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
    heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontSize: 11, fontWeight: '600', color: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    card: { padding: SPACING.lg, marginBottom: SPACING.md },
    cardTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginBottom: SPACING.md },
    descText: { ...TYPOGRAPHY.body, color: colors.textSecondary, lineHeight: 22 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
    statCard: { flex: 1, borderRadius: BORDER_RADIUS.lg, padding: 14, alignItems: 'center', gap: 6 },
    statValue: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
    statLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    stepNumText: { fontSize: 13, fontWeight: '700', color: colors.primary },
    stepText: { flex: 1, ...TYPOGRAPHY.body, color: colors.text, lineHeight: 22 },
    showMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 8 },
    showMoreText: { ...TYPOGRAPHY.captionBold, color: colors.primary },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    tipText: { flex: 1, ...TYPOGRAPHY.body, color: colors.textSecondary, lineHeight: 20 },
    recGrid: { flexDirection: 'row', gap: 12 },
    recCard: { flex: 1, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, padding: 14, alignItems: 'center' },
    recValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
    recLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
    startBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderRadius: 18, paddingVertical: 16, marginTop: SPACING.md,
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    startBtnText: { fontSize: 16, fontWeight: '800', color: colors.background },
});

export default ExerciseDetailScreen;
