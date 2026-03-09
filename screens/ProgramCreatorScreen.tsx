import React, { useState, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Animated, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '../services/supabase';
import { DeepSeekService } from '../services/deepseek';
import { LeagueService } from '../services/leagueService';
import { NotificationService } from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import AnimatedButton from '../components/AnimatedButton';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

type ProgramType = 'workout' | 'nutrition' | 'supplement' | 'water';

interface ProgramOption {
    id: ProgramType;
    icon: string;
    gradient: string[];
    en: string;
    tr: string;
    descEn: string;
    descTr: string;
}

const PROGRAM_TYPES: ProgramOption[] = [
    { id: 'workout', icon: 'barbell', gradient: ['#667eea', '#764ba2'], en: 'Workout Program', tr: 'Antrenman Programı', descEn: 'Personalized exercise plan', descTr: 'Kişiselleştirilmiş egzersiz planı' },
    { id: 'nutrition', icon: 'restaurant', gradient: ['#f093fb', '#f5576c'], en: 'Nutrition Plan', tr: 'Beslenme Planı', descEn: 'Meal plan based on your goals', descTr: 'Hedeflerinize göre öğün planı' },
    { id: 'supplement', icon: 'medkit', gradient: ['#CE82FF', '#764ba2'], en: 'Supplement Plan', tr: 'Supplement Planı', descEn: 'Vitamin & supplement schedule', descTr: 'Vitamin & takviye programı' },
    { id: 'water', icon: 'water', gradient: ['#1CB0F6', '#0077CC'], en: 'Water Schedule', tr: 'Su Programı', descEn: 'Hydration reminders', descTr: 'Hidrasyon hatırlatıcıları' },
];

const GOALS = [
    { id: 'muscle_gain', en: 'Muscle Gain', tr: 'Kas Kazanımı', icon: 'barbell' },
    { id: 'fat_loss', en: 'Fat Loss', tr: 'Yağ Yakımı', icon: 'flame' },
    { id: 'maintain', en: 'Maintain', tr: 'Koruma', icon: 'scale-outline' },
    { id: 'endurance', en: 'Endurance', tr: 'Dayanıklılık', icon: 'walk' },
    { id: 'flexibility', en: 'Flexibility', tr: 'Esneklik', icon: 'body' },
    { id: 'general', en: 'General Health', tr: 'Genel Sağlık', icon: 'leaf' },
];

const EXPERIENCE = [
    { id: 'beginner', en: 'Beginner', tr: 'Başlangıç', icon: 'leaf' },
    { id: 'intermediate', en: 'Intermediate', tr: 'Orta', icon: 'flash' },
    { id: 'advanced', en: 'Advanced', tr: 'İleri', icon: 'trophy' },
];

const DAYS_PER_WEEK = [3, 4, 5, 6];

const ProgramCreatorScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const s = React.useMemo(() => getStyles(colors), [colors]);

    const { width } = useWindowDimensions();
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ProgramType | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
    const [selectedExp, setSelectedExp] = useState<string | null>(null);
    const [selectedDays, setSelectedDays] = useState(4);
    const [generating, setGenerating] = useState(false);
    const [generatedProgram, setGeneratedProgram] = useState<string | null>(null);
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const { showAlert, AlertComponent } = useAlert();
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateTransition = (nextStep: number) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setStep(nextStep);
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
        });
    };

    const handleGenerate = async () => {
        if (!selectedType || !selectedGoal || !selectedExp) return;
        setGenerating(true);
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            let profile: any = null;
            if (user) {
                const { data } = await supabase.getUserProfile(user.id);
                profile = data;
            }

            const lang = isTurkish ? 'Turkish' : 'English';
            const typeLabel = PROGRAM_TYPES.find(p => p.id === selectedType)?.en || selectedType;
            const goalLabel = GOALS.find(g => g.id === selectedGoal)?.en || selectedGoal;
            const expLabel = EXPERIENCE.find(e => e.id === selectedExp)?.en || selectedExp;

            const age = profile?.dob ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / 31557600000) : null;

            const programData = {
                programType: typeLabel,
                goal: goalLabel,
                experience: expLabel,
                days: selectedDays,
                profile: {
                    height: profile?.height,
                    weight: profile?.weight,
                    gender: profile?.gender,
                    age: age
                },
                language: lang
            };

            const result = await DeepSeekService.getInstance().generateContent('', 'program', undefined, programData);
            setGeneratedProgram(result);

            // Save to Supabase
            if (user) {
                try {
                    await supabase.getClient().from('ai_generated_programs').insert({
                        user_id: user.id,
                        program_type: selectedType,
                        goal: selectedGoal,
                        experience_level: selectedExp,
                        days_per_week: selectedDays,
                        content: result,
                    });
                } catch { }
                // Award XP for creating a program
                try { await LeagueService.getInstance().addXP(15, 'program_create', `Created ${typeLabel}`); } catch { }

                // Schedule daily reminders based on program type
                try {
                    const notifService = NotificationService.getInstance();
                    await notifService.requestPermissions();
                    const reminderConfig: Record<string, { title: string; body: string; hour: number; id: string }> = {
                        workout: {
                            title: isTurkish ? 'Antrenman Zamanı! 💪' : 'Workout Time! 💪',
                            body: isTurkish ? 'AI programınızdaki bugünkü antrenmanı tamamlayın' : 'Complete today\'s workout from your AI program',
                            hour: 10, id: 'program_workout',
                        },
                        nutrition: {
                            title: isTurkish ? 'Beslenme Planı 🍽️' : 'Nutrition Plan 🍽️',
                            body: isTurkish ? 'Bugünkü öğünlerinizi takip edin' : 'Follow your meal plan for today',
                            hour: 8, id: 'program_nutrition',
                        },
                        supplement: {
                            title: isTurkish ? 'Supplement Zamanı 💊' : 'Supplement Time 💊',
                            body: isTurkish ? 'Günlük supplementlerinizi almayı unutmayın' : 'Don\'t forget your daily supplements',
                            hour: 9, id: 'program_supplement',
                        },
                        water: {
                            title: isTurkish ? 'Su İçme Zamanı 💧' : 'Hydration Time 💧',
                            body: isTurkish ? 'Su programınıza uyun' : 'Follow your hydration schedule',
                            hour: 8, id: 'program_water',
                        },
                    };
                    const cfg = reminderConfig[selectedType];
                    if (cfg) {
                        await notifService.scheduleDailyReminder(cfg.title, cfg.body, cfg.hour, 0, cfg.id, selectedType === 'water' ? 'Health' : undefined);
                    }
                } catch { }
            }

            animateTransition(5);
        } catch (err: any) {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: err.message || (isTurkish ? 'Program oluşturulamadı' : 'Failed to generate program'),
                buttons: [{ text: 'OK' }],
            });
        } finally {
            setGenerating(false);
        }
    };

    const renderStep1 = () => (
        <View>
            <Text style={s.stepTitle}>{isTurkish ? 'Program Türü Seçin' : 'Choose Program Type'}</Text>
            <Text style={s.stepSub}>{isTurkish ? 'AI sizin için kişiselleştirilmiş plan oluşturacak' : 'AI will create a personalized plan for you'}</Text>
            <View style={s.typeGrid}>
                {PROGRAM_TYPES.map(prog => (
                    <TouchableOpacity
                        key={prog.id}
                        activeOpacity={0.85}
                        onPress={() => { setSelectedType(prog.id); animateTransition(2); }}
                    >
                        <LinearGradient colors={prog.gradient as any} style={[s.typeCard, selectedType === prog.id && s.typeCardActive]}>
                            <View style={s.typeIconBg}>
                                <Ionicons name={prog.icon as any} size={28} color={colors.background} />
                            </View>
                            <Text style={s.typeTitle}>{isTurkish ? prog.tr : prog.en}</Text>
                            <Text style={s.typeDesc}>{isTurkish ? prog.descTr : prog.descEn}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View>
            <Text style={s.stepTitle}>{isTurkish ? 'Hedefiniz Nedir?' : 'What\'s Your Goal?'}</Text>
            <View style={s.optionGrid}>
                {GOALS.map(goal => (
                    <TouchableOpacity
                        key={goal.id}
                        style={[s.optionCard, { width: (width - 40 - 12) / 2 }, selectedGoal === goal.id && s.optionCardActive]}
                        onPress={() => setSelectedGoal(goal.id)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={goal.icon as any} size={32} color={colors.primary} />
                        <Text style={[s.optionLabel, selectedGoal === goal.id && s.optionLabelActive]}>
                            {isTurkish ? goal.tr : goal.en}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {selectedGoal && (
                <AnimatedButton
                    title={isTurkish ? 'Devam Et' : 'Continue'}
                    onPress={() => animateTransition(3)}
                    style={s.nextBtn}
                />
            )}
        </View>
    );

    const renderStep3 = () => (
        <View>
            <Text style={s.stepTitle}>{isTurkish ? 'Deneyim Seviyeniz' : 'Experience Level'}</Text>
            <View style={s.expGrid}>
                {EXPERIENCE.map(exp => (
                    <TouchableOpacity
                        key={exp.id}
                        style={[s.expCard, selectedExp === exp.id && s.expCardActive]}
                        onPress={() => setSelectedExp(exp.id)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={exp.icon as any} size={28} color={colors.primary} />
                        <Text style={[s.expLabel, selectedExp === exp.id && { color: colors.primary }]}>
                            {isTurkish ? exp.tr : exp.en}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {selectedExp && (
                <AnimatedButton
                    title={isTurkish ? 'Devam Et' : 'Continue'}
                    onPress={() => animateTransition(4)}
                    style={s.nextBtn}
                />
            )}
        </View>
    );

    const renderStep4 = () => (
        <View>
            <Text style={s.stepTitle}>{isTurkish ? 'Haftada Kaç Gün?' : 'Days Per Week?'}</Text>
            <View style={s.daysRow}>
                {DAYS_PER_WEEK.map(d => (
                    <TouchableOpacity
                        key={d}
                        style={[s.dayBtn, selectedDays === d && s.dayBtnActive]}
                        onPress={() => setSelectedDays(d)}
                    >
                        <Text style={[s.dayNum, selectedDays === d && s.dayNumActive]}>{d}</Text>
                        <Text style={[s.dayLabel, selectedDays === d && { color: '#fff' }]}>
                            {isTurkish ? 'gün' : 'days'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Summary */}
            <View style={s.summaryCard}>
                <Text style={s.summaryTitle}>{isTurkish ? 'Özet' : 'Summary'}</Text>
                <View style={s.summaryRow}>
                    <Ionicons name="document-text" size={16} color={colors.primary} />
                    <Text style={s.summaryText}>{PROGRAM_TYPES.find(p => p.id === selectedType)?.[isTurkish ? 'tr' : 'en']}</Text>
                </View>
                <View style={s.summaryRow}>
                    <Ionicons name="flag" size={16} color="#FF9600" />
                    <Text style={s.summaryText}>{GOALS.find(g => g.id === selectedGoal)?.[isTurkish ? 'tr' : 'en']}</Text>
                </View>
                <View style={s.summaryRow}>
                    <Ionicons name="trending-up" size={16} color="#CE82FF" />
                    <Text style={s.summaryText}>{EXPERIENCE.find(e => e.id === selectedExp)?.[isTurkish ? 'tr' : 'en']}</Text>
                </View>
                <View style={s.summaryRow}>
                    <Ionicons name="calendar" size={16} color="#1CB0F6" />
                    <Text style={s.summaryText}>{selectedDays} {isTurkish ? 'gün/hafta' : 'days/week'}</Text>
                </View>
            </View>

            <AnimatedButton
                title={generating ? (isTurkish ? 'AI Oluşturuyor...' : 'AI Generating...') : (isTurkish ? 'AI ile Program Oluştur' : 'Generate with AI')}
                onPress={handleGenerate}
                style={[s.generateBtn, generating ? { opacity: 0.7 } : undefined] as any}
                disabled={generating}
            />
            {generating && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}
        </View>
    );

    const renderStep5 = () => (
        <View>
            <View style={s.resultHeader}>
                <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                <Text style={s.resultTitle}>{isTurkish ? 'Programınız Hazır!' : 'Your Program is Ready!'}</Text>
            </View>
            <ScrollView style={s.resultScroll} nestedScrollEnabled>
                <View style={s.resultCard}>
                    <Text style={s.resultContent}>{generatedProgram}</Text>
                </View>
            </ScrollView>
            <AnimatedButton
                title={isTurkish ? 'Ana Sayfaya Dön' : 'Back to Home'}
                onPress={() => navigation.goBack()}
                style={s.nextBtn}
            />
        </View>
    );

    return (
        <View style={[COMMON_STYLES.screenContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <AlertComponent />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => step > 1 ? animateTransition(step - 1) : navigation.goBack()} style={s.backBtn}>
                    <Ionicons name={step > 1 ? 'arrow-back' : 'close'} size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</Text>
                <View style={s.stepIndicator}>
                    {[1, 2, 3, 4].map(i => (
                        <View key={i} style={[s.stepDot, step >= i && s.stepDotActive]} />
                    ))}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    {step === 5 && renderStep5()}
                </Animated.View>
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3, color: colors.text, flex: 1 },
    stepIndicator: { flexDirection: 'row', gap: 6 },
    stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E5E5' },
    stepDotActive: { backgroundColor: colors.primary, width: 20 },
    scroll: { paddingHorizontal: SPACING.lg },

    stepTitle: { ...TYPOGRAPHY.h2, color: colors.text, marginBottom: 8, marginTop: 12 },
    stepSub: { ...TYPOGRAPHY.body, color: colors.textSecondary, marginBottom: 24 },

    // Type selection
    typeGrid: { gap: 14 },
    typeCard: { borderRadius: 22, padding: 22, minHeight: 110, justifyContent: 'flex-end' },
    typeCardActive: { borderWidth: 3, borderColor: colors.background },
    typeIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    typeTitle: { fontSize: 18, fontWeight: '700', color: colors.background, marginBottom: 4 },
    typeDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

    // Goal selection
    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    optionCard: {
        backgroundColor: colors.surface, borderRadius: 18,
        padding: 18, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    },
    optionCardActive: { borderColor: colors.primary, backgroundColor: '#E8FFE0' },
    optionEmoji: { fontSize: 32, marginBottom: 8 },
    optionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
    optionLabelActive: { color: colors.primary },

    // Experience
    expGrid: { flexDirection: 'row', gap: 12 },
    expCard: {
        flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 20,
        alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    },
    expCardActive: { borderColor: colors.primary, backgroundColor: '#E8FFE0' },
    expLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 8 },

    // Days
    daysRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    dayBtn: {
        flex: 1, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 20,
        alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    },
    dayBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    dayNum: { fontSize: 28, fontWeight: '800', color: colors.text },
    dayNumActive: { color: colors.background },
    dayLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    // Summary
    summaryCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0' },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    summaryText: { fontSize: 14, color: colors.text, fontWeight: '500' },

    // Buttons
    nextBtn: { marginTop: 20 },
    generateBtn: { marginTop: 8 },

    // Result
    resultHeader: { alignItems: 'center', marginBottom: 20, marginTop: 12 },
    resultTitle: { ...TYPOGRAPHY.h2, color: colors.text, marginTop: 12, textAlign: 'center' },
    resultScroll: { maxHeight: 400 },
    resultCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#F0F0F0' },
    resultContent: { fontSize: 14, color: colors.text, lineHeight: 22 },
});

export default ProgramCreatorScreen;
