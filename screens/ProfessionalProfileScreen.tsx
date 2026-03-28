import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

type SuccessStory = {
    id: string;
    client_alias: string;
    duration_weeks: number;
    before_weight_kg: number | null;
    after_weight_kg: number | null;
    before_image_url: string | null;
    after_image_url: string | null;
    summary: string;
    consent_approved: boolean;
    is_public: boolean;
};

const ProfessionalProfileScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { isTurkish, language } = useTranslation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [role, setRole] = useState<'pt' | 'dietitian'>('pt');
    const [professionalId, setProfessionalId] = useState('');
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [stats, setStats] = useState({ clients: 0, pending: 0, rating: 0 });
    const [isAvailable, setIsAvailable] = useState(true);
    const [stories, setStories] = useState<SuccessStory[]>([]);
    const [savingStory, setSavingStory] = useState(false);

    const [clientAlias, setClientAlias] = useState('');
    const [durationWeeks, setDurationWeeks] = useState('');
    const [beforeWeight, setBeforeWeight] = useState('');
    const [afterWeight, setAfterWeight] = useState('');
    const [beforeImageUrl, setBeforeImageUrl] = useState('');
    const [afterImageUrl, setAfterImageUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [consentApproved, setConsentApproved] = useState(false);
    const [isPublicStory, setIsPublicStory] = useState(true);

    const isRussian = language === 'ru';
    const tx = useMemo(() => ({
        profileTitlePt: isTurkish ? 'PT Profili' : isRussian ? 'Профиль тренера' : 'PT Profile',
        profileTitleDiet: isTurkish ? 'Diyetisyen Profili' : isRussian ? 'Профиль диетолога' : 'Dietitian Profile',
        activeMembers: isTurkish ? 'Aktif Üye' : isRussian ? 'Активные клиенты' : 'Active Members',
        pendingRequests: isTurkish ? 'Bekleyen Talep' : isRussian ? 'Ожидают' : 'Pending Requests',
        rating: isTurkish ? 'Puan' : isRussian ? 'Рейтинг' : 'Rating',
        accepting: isTurkish ? 'Danışan kabulü açık' : isRussian ? 'Принимает новых клиентов' : 'Accepting new members',
        specialties: isTurkish ? 'Uzmanlık Alanları' : isRussian ? 'Специализации' : 'Specialties',
        noSpecialties: isTurkish ? 'Henüz uzmanlık eklenmemiş.' : isRussian ? 'Специализации не добавлены.' : 'No specialties added yet.',
        storiesTitle: isTurkish ? 'Before/After Başarı Hikayeleri' : isRussian ? 'Истории before/after' : 'Before/After Success Stories',
        alias: isTurkish ? 'Danışan Takma Adı' : isRussian ? 'Псевдоним клиента' : 'Client Alias',
        duration: isTurkish ? 'Süre (Hafta)' : isRussian ? 'Длительность (нед.)' : 'Duration (Weeks)',
        beforeWeight: isTurkish ? 'Önce Kilo (kg)' : isRussian ? 'Вес до (кг)' : 'Before Weight (kg)',
        afterWeight: isTurkish ? 'Sonra Kilo (kg)' : isRussian ? 'Вес после (кг)' : 'After Weight (kg)',
        beforeImage: isTurkish ? 'Before Görsel URL' : isRussian ? 'URL фото До' : 'Before Image URL',
        afterImage: isTurkish ? 'After Görsel URL' : isRussian ? 'URL фото После' : 'After Image URL',
        summary: isTurkish ? 'Süreç Özeti' : isRussian ? 'Краткое описание' : 'Outcome Summary',
        consent: isTurkish ? 'Danışan açık rızasını onayladı' : isRussian ? 'Есть согласие клиента' : 'Client explicit consent approved',
        publicStory: isTurkish ? 'Profilde herkese açık göster' : isRussian ? 'Показывать публично в профиле' : 'Show publicly on profile',
        saveStory: isTurkish ? 'Hikaye Kaydet' : isRussian ? 'Сохранить историю' : 'Save Story',
        noStories: isTurkish ? 'Henüz hikaye eklenmedi.' : isRussian ? 'Историй пока нет.' : 'No stories added yet.',
        delete: isTurkish ? 'Sil' : isRussian ? 'Удалить' : 'Delete',
        progress: isTurkish ? 'Değişim' : isRussian ? 'Изменение' : 'Change',
        membersMenu: isTurkish ? 'Üye Takibi' : isRussian ? 'Участники' : 'Member Tracking',
        designerMenu: isTurkish ? 'Plan Tasarım Ekranı' : isRussian ? 'Конструктор планов' : 'Plan Designer',
        billingMenu: isTurkish ? 'Gelir ve Fatura' : isRussian ? 'Доход и биллинг' : 'Revenue & Billing',
        settingsMenu: isTurkish ? 'Ayarlar' : isRussian ? 'Настройки' : 'Settings',
    }), [isRussian, isTurkish]);

    const resetStoryForm = useCallback(() => {
        setClientAlias('');
        setDurationWeeks('');
        setBeforeWeight('');
        setAfterWeight('');
        setBeforeImageUrl('');
        setAfterImageUrl('');
        setSummary('');
        setConsentApproved(false);
        setIsPublicStory(true);
    }, []);

    const loadStories = useCallback(async (proId: string) => {
        try {
            const { data } = await SupabaseService.getInstance().getClient()
                .from('professional_success_stories')
                .select('*')
                .eq('professional_id', proId)
                .order('created_at', { ascending: false });
            setStories((data || []) as SuccessStory[]);
        } catch {
            setStories([]);
        }
    }, []);

    const loadProfile = useCallback(async () => {
        try {
            const service = SupabaseService.getInstance();
            const { user } = await service.getCurrentUser();
            if (!user) return;

            const { data: profile } = await service.getClient()
                .from('profiles')
                .select('first_name,last_name')
                .eq('id', user.id)
                .single();
            const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
            setName(fullName || (isTurkish ? 'Uzman' : isRussian ? 'Специалист' : 'Professional'));

            const { data: pro } = await service.getClient()
                .from('professional_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!pro?.id) {
                setRole('pt');
                setSpecialties([]);
                setStats({ clients: 0, pending: 0, rating: 0 });
                setProfessionalId('');
                setStories([]);
                return;
            }

            setProfessionalId(pro.id);
            setRole(pro.professional_type === 'dietitian' ? 'dietitian' : 'pt');
            setSpecialties(Array.isArray(pro.specialties) ? pro.specialties : []);

            const { data: relationships } = await service.getClient()
                .from('client_relationships')
                .select('status')
                .or(`professional_id.eq.${pro.id},trainer_id.eq.${pro.id},dietitian_id.eq.${pro.id}`);
            const relRows = relationships || [];
            const clients = relRows.filter((item: any) => item.status === 'active').length;
            const pending = relRows.filter((item: any) => item.status === 'pending').length;

            const { data: ratings } = await service.getClient()
                .from('ratings')
                .select('rating')
                .eq('professional_id', pro.id);
            const ratingRows = ratings || [];
            const rating = ratingRows.length > 0
                ? ratingRows.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) / ratingRows.length
                : 0;

            setStats({
                clients,
                pending,
                rating: Number(rating.toFixed(1)),
            });

            await loadStories(pro.id);
        } catch {
            setStats({ clients: 0, pending: 0, rating: 0 });
            setSpecialties([]);
            setStories([]);
        } finally {
            setLoading(false);
        }
    }, [isRussian, isTurkish, loadStories]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const saveStory = useCallback(async () => {
        if (!professionalId || !clientAlias.trim() || !durationWeeks.trim() || !summary.trim() || !consentApproved) return;
        try {
            setSavingStory(true);
            await SupabaseService.getInstance().getClient()
                .from('professional_success_stories')
                .insert({
                    professional_id: professionalId,
                    client_alias: clientAlias.trim(),
                    duration_weeks: Number(durationWeeks),
                    before_weight_kg: beforeWeight ? Number(beforeWeight) : null,
                    after_weight_kg: afterWeight ? Number(afterWeight) : null,
                    before_image_url: beforeImageUrl.trim() || null,
                    after_image_url: afterImageUrl.trim() || null,
                    summary: summary.trim(),
                    consent_approved: consentApproved,
                    is_public: isPublicStory,
                });
            resetStoryForm();
            await loadStories(professionalId);
        } finally {
            setSavingStory(false);
        }
    }, [afterImageUrl, afterWeight, beforeImageUrl, beforeWeight, clientAlias, consentApproved, durationWeeks, isPublicStory, loadStories, professionalId, resetStoryForm, summary]);

    const removeStory = useCallback(async (id: string) => {
        if (!professionalId) return;
        await SupabaseService.getInstance().getClient()
            .from('professional_success_stories')
            .delete()
            .eq('id', id)
            .eq('professional_id', professionalId);
        await loadStories(professionalId);
    }, [loadStories, professionalId]);

    const palette = useMemo(() => {
        return role === 'dietitian'
            ? { gradient: ['#22C55E', '#166534'] as const, title: tx.profileTitleDiet }
            : { gradient: ['#F97316', '#9A3412'] as const, title: tx.profileTitlePt };
    }, [role, tx.profileTitleDiet, tx.profileTitlePt]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient colors={palette.gradient} style={[styles.hero, { paddingTop: insets.top + SPACING.sm }]}>
                <Text style={styles.heroTitle}>{name}</Text>
                <Text style={styles.heroSub}>{palette.title}</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <View style={styles.statRow}>
                        <View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{stats.clients}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{tx.activeMembers}</Text>
                        </View>
                        <View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{tx.pendingRequests}</Text>
                        </View>
                        <View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{stats.rating}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{tx.rating}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <View style={styles.switchRow}>
                        <Text style={[styles.menuText, { color: colors.text }]}>{tx.accepting}</Text>
                        <Switch value={isAvailable} onValueChange={setIsAvailable} />
                    </View>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{tx.specialties}</Text>
                    {specialties.length === 0 ? (
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{tx.noSpecialties}</Text>
                    ) : (
                        <View style={styles.tags}>
                            {specialties.map((item) => (
                                <View key={item} style={[styles.tag, { backgroundColor: `${colors.primary}20` }]}>
                                    <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{tx.storiesTitle}</Text>
                    <TextInput
                        value={clientAlias}
                        onChangeText={setClientAlias}
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder={tx.alias}
                        placeholderTextColor={colors.textTertiary}
                    />
                    <TextInput
                        value={durationWeeks}
                        onChangeText={setDurationWeeks}
                        keyboardType="numeric"
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder={tx.duration}
                        placeholderTextColor={colors.textTertiary}
                    />
                    <View style={styles.row}>
                        <TextInput
                            value={beforeWeight}
                            onChangeText={setBeforeWeight}
                            keyboardType="numeric"
                            style={[styles.input, styles.halfInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                            placeholder={tx.beforeWeight}
                            placeholderTextColor={colors.textTertiary}
                        />
                        <TextInput
                            value={afterWeight}
                            onChangeText={setAfterWeight}
                            keyboardType="numeric"
                            style={[styles.input, styles.halfInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                            placeholder={tx.afterWeight}
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                    <TextInput
                        value={beforeImageUrl}
                        onChangeText={setBeforeImageUrl}
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder={tx.beforeImage}
                        placeholderTextColor={colors.textTertiary}
                    />
                    <TextInput
                        value={afterImageUrl}
                        onChangeText={setAfterImageUrl}
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder={tx.afterImage}
                        placeholderTextColor={colors.textTertiary}
                    />
                    <TextInput
                        value={summary}
                        onChangeText={setSummary}
                        multiline
                        style={[styles.input, styles.multiInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder={tx.summary}
                        placeholderTextColor={colors.textTertiary}
                    />
                    <View style={styles.switchRow}>
                        <Text style={[styles.menuText, { color: colors.text }]}>{tx.consent}</Text>
                        <Switch value={consentApproved} onValueChange={setConsentApproved} />
                    </View>
                    <View style={styles.switchRow}>
                        <Text style={[styles.menuText, { color: colors.text }]}>{tx.publicStory}</Text>
                        <Switch value={isPublicStory} onValueChange={setIsPublicStory} />
                    </View>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={saveStory}
                        disabled={savingStory || !consentApproved || !clientAlias.trim() || !durationWeeks.trim() || !summary.trim()}
                    >
                        {savingStory ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{tx.saveStory}</Text>}
                    </TouchableOpacity>

                    {stories.length === 0 ? (
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{tx.noStories}</Text>
                    ) : (
                        stories.map((story) => {
                            const before = Number(story.before_weight_kg || 0);
                            const after = Number(story.after_weight_kg || 0);
                            const delta = before && after ? (after - before).toFixed(1) : null;
                            return (
                                <View key={story.id} style={[styles.storyRow, { borderBottomColor: colors.borderLight }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.storyAlias, { color: colors.text }]}>{story.client_alias}</Text>
                                        <Text style={[styles.storyMeta, { color: colors.textSecondary }]}>
                                            {story.duration_weeks} {isTurkish ? 'hafta' : isRussian ? 'нед.' : 'weeks'} • {tx.progress}: {delta ? `${delta} kg` : '-'}
                                        </Text>
                                        <Text style={[styles.storyMeta, { color: colors.textSecondary }]} numberOfLines={2}>{story.summary}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removeStory(story.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                                        <Text style={styles.deleteText}>{tx.delete}</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('ClientsList')}>
                        <Ionicons name="people-outline" size={20} color={colors.primary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{tx.membersMenu}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('ProfessionalProgramCreator')}>
                        <Ionicons name={role === 'dietitian' ? 'nutrition-outline' : 'barbell-outline'} size={20} color={colors.primary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{tx.designerMenu}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('ProfessionalBilling')}>
                        <Ionicons name="card-outline" size={20} color={colors.primary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{tx.billingMenu}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-outline" size={20} color={colors.primary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{tx.settingsMenu}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    hero: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
        borderBottomLeftRadius: BORDER_RADIUS.xxl,
        borderBottomRightRadius: BORDER_RADIUS.xxl,
    },
    heroTitle: { ...TYPOGRAPHY.h1, color: '#fff' },
    heroSub: { ...TYPOGRAPHY.caption, color: '#FFFFFFDD' },
    content: { padding: SPACING.lg, gap: SPACING.sm, paddingBottom: SPACING.section },
    card: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm, gap: SPACING.sm },
    statRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statValue: { ...TYPOGRAPHY.h2, textAlign: 'center' },
    statLabel: { ...TYPOGRAPHY.caption, textAlign: 'center' },
    sectionTitle: { ...TYPOGRAPHY.bodyBold },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
    menuText: { ...TYPOGRAPHY.body, flex: 1, paddingRight: SPACING.sm },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
    tag: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.pill },
    tagText: { ...TYPOGRAPHY.caption },
    input: {
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.sm,
        ...TYPOGRAPHY.body,
    },
    row: { flexDirection: 'row', gap: SPACING.sm },
    halfInput: { flex: 1 },
    multiInput: { minHeight: 90, textAlignVertical: 'top' },
    saveBtn: { borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.sm, alignItems: 'center' },
    saveBtnText: { ...TYPOGRAPHY.bodyBold, color: '#fff' },
    storyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingVertical: SPACING.xs,
        gap: SPACING.sm,
    },
    storyAlias: { ...TYPOGRAPHY.bodyBold },
    storyMeta: { ...TYPOGRAPHY.caption },
    deleteBtn: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
    deleteText: { ...TYPOGRAPHY.small, color: '#DC2626' },
});

export default ProfessionalProfileScreen;
