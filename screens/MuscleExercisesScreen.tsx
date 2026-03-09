import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, TextInput, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import { SupabaseService } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const getDifficultyColor = (d: string) => {
    if (d === 'beginner') return '#58CC02';
    if (d === 'intermediate') return '#FF9600';
    if (d === 'advanced') return '#FF4B4B';
    return '#AFAFBF';
};
const getDifficultyLabel = (d: string, tr: boolean) => {
    if (!tr) return d;
    if (d === 'beginner') return 'Başlangıç';
    if (d === 'intermediate') return 'Orta';
    if (d === 'advanced') return 'İleri';
    return d;
};

const MuscleExercisesScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useTheme();
    const st = React.useMemo(() => getStyles(colors), [colors]);

    const { muscleGroup, category, muscleName, workoutType } = route.params;
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { t, isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        setLoading(true);
        try {
            const { data } = await SupabaseService.getInstance().getExercises(
                isTurkish ? 'tr' : 'en',
                category,
                muscleGroup,
                workoutType
            );
            if (data) setExercises(data);
        } catch { }
        finally {
            setLoading(false);
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
    };

    const filteredExercises = exercises.filter(ex => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (ex.name || '').toLowerCase().includes(q) || (ex.name_tr || '').toLowerCase().includes(q);
    });

    const getExerciseName = (ex: any) => isTurkish && ex.name_tr ? ex.name_tr : ex.name;
    const getExerciseMuscle = (ex: any) => isTurkish && ex.muscle_group_tr ? ex.muscle_group_tr : ex.muscle_group || '';

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={[st.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={st.headerTitle}>{muscleName}</Text>
                    <Text style={st.headerSub}>{filteredExercises.length} {isTurkish ? 'egzersiz' : 'exercises'}</Text>
                </View>
            </View>

            {/* Search */}
            <View style={st.searchBar}>
                <Ionicons name="search" size={18} color={colors.textTertiary} />
                <TextInput
                    style={st.searchInput}
                    placeholder={isTurkish ? 'Egzersiz ara...' : 'Search exercises...'}
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Exercise list */}
            <ScrollView contentContainerStyle={st.listContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={st.loader}><ActivityIndicator size="large" color="#58CC02" /></View>
                ) : filteredExercises.length === 0 ? (
                    <View style={st.emptyState}>
                        <Ionicons name="barbell-outline" size={56} color="#E5E5E5" />
                        <Text style={st.emptyText}>{isTurkish ? 'Egzersiz bulunamadı' : 'No exercises found'}</Text>
                        <Text style={st.emptyHint}>{isTurkish ? 'Farklı bir kas grubu deneyin' : 'Try a different muscle group'}</Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim, gap: 10 }}>
                        {filteredExercises.map(item => {
                            const dc = getDifficultyColor(item.difficulty);
                            return (
                                <TouchableOpacity key={item.id} activeOpacity={0.7} style={st.exerciseCard}
                                    onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}>
                                    <View style={[st.exerciseAccent, { backgroundColor: dc }]} />
                                    {item.image_url ? (
                                        <Image source={{ uri: item.image_url }} style={st.exerciseImg} />
                                    ) : (
                                        <View style={[st.exerciseImgPH, { backgroundColor: dc + '15' }]}>
                                            <Ionicons name="fitness" size={24} color={dc} />
                                        </View>
                                    )}
                                    <View style={st.exerciseInfo}>
                                        <Text style={st.exerciseName} numberOfLines={1}>{getExerciseName(item)}</Text>
                                        <Text style={st.exerciseMuscle}>{getExerciseMuscle(item)}</Text>
                                        <View style={st.exerciseMeta}>
                                            <View style={[st.diffDot, { backgroundColor: dc }]} />
                                            <Text style={[st.diffLabel, { color: dc }]}>{getDifficultyLabel(item.difficulty, isTurkish)}</Text>
                                            {item.calories_per_minute ? (
                                                <Text style={st.calLabel}><Ionicons name="flame" size={10} color="#FF6B6B" /> {item.calories_per_minute} cal/dk</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                                </TouchableOpacity>
                            );
                        })}
                    </Animated.View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F5F5',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
        borderRadius: 16, paddingHorizontal: 14, height: 44, marginHorizontal: 20,
        marginTop: 14, marginBottom: 8, gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.text },
    listContent: { paddingHorizontal: 20, paddingTop: 8 },
    loader: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '700', color: colors.textTertiary, marginTop: 16 },
    emptyHint: { fontSize: 13, color: '#D1D5DB', marginTop: 4 },
    exerciseCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background,
        borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', paddingRight: 14,
    },
    exerciseAccent: { width: 4, height: '100%' },
    exerciseImg: { width: 54, height: 54, borderRadius: 14, marginLeft: 12, marginVertical: 12 },
    exerciseImgPH: {
        width: 54, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
        marginLeft: 12, marginVertical: 12,
    },
    exerciseInfo: { flex: 1, marginLeft: 12, paddingVertical: 14 },
    exerciseName: { fontSize: 14, fontWeight: '700', color: colors.text },
    exerciseMuscle: { fontSize: 12, color: colors.textTertiary, marginTop: 2, textTransform: 'capitalize' },
    exerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    diffDot: { width: 6, height: 6, borderRadius: 3 },
    diffLabel: { fontSize: 11, fontWeight: '600' },
    calLabel: { fontSize: 11, color: colors.textTertiary },
});

export default MuscleExercisesScreen;
