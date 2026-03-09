import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image'; // Use expo-image for better caching and performance
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import PremiumBadge from '../components/PremiumBadge';
import BiometricConsentModal from '../components/BiometricConsentModal';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { DeepSeekService } from '../services/deepseek';
import { LeagueService } from '../services/leagueService';
import { AgreementService } from '../services/agreementService';
import { SupabaseService } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    imageUri?: string;
}

const TOPIC_GUARD_EN = `You are BioSync AI Fitness Coach. You ONLY answer questions about fitness, exercise, workout plans, body analysis, muscle building, weight loss, sports performance, physical health, and related topics.

If the user asks about ANY topic unrelated to fitness, health, exercise, or physical wellbeing (such as history, math, politics, coding, geography, entertainment, etc.), you MUST respond ONLY with:
"I can only help with fitness, exercise, and physical health topics. Please ask me about workouts, training plans, body analysis, or exercise advice!"

CRITICAL: Detect the language of the user's message and ALWAYS respond in that SAME language.`;

const TOPIC_GUARD_TR = `Sen BioSync AI Fitness Koçusun. SADECE fitness, egzersiz, antrenman planları, vücut analizi, kas yapımı, kilo verme, spor performansı, fiziksel sağlık ve ilgili konularda soruları yanıtlarsın.

Kullanıcı fitness, sağlık, egzersiz veya fiziksel sağlıkla ilgisi olmayan HERHANGİ bir konuda soru sorarsa (tarih, matematik, politika, kodlama, coğrafya, eğlence vb.), SADECE şu şekilde yanıt vermelisin:
"Sadece fitness, egzersiz ve fiziksel sağlık konularında yardımcı olabilirim. Lütfen bana antrenman, program, vücut analizi veya egzersiz tavsiyeleri hakkında sorun!"

KRİTİK: Kullanıcının mesajının dilini algıla ve HER ZAMAN aynı dilde yanıt ver.`;

const AICoachScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [pendingUseCamera, setPendingUseCamera] = useState<boolean | null>(null);
    const { isTurkish } = useTranslation();
    const { showAlert, AlertComponent } = useAlert();
    const scrollRef = useRef<ScrollView>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const welcomeMsg: Message = {
            id: '0',
            role: 'ai',
            content: isTurkish
                ? 'Merhaba! Ben BioSync AI Koçunuz.\n\nSize kişiselleştirilmiş antrenman planları oluşturabilirim\nFotoğrafınızı yükleyerek vücudunuzun güçlü ve zayıf yönlerini analiz edebilirim\nHedeflerinize özel program yazabilirim\n\nNasıl yardımcı olabilirim?'
                : 'Hi! I\'m your BioSync AI Coach.\n\nI can create personalized workout plans\nUpload your photo for body strength/weakness analysis\nI\'ll design custom programs for your goals\n\nHow can I help you?',
            timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
    }, []);

    const pickImage = async (useCamera: boolean) => {
        try {
            setShowPhotoOptions(false);

            // Check biometric consent (KVKK Md. 6) before accessing camera/gallery for body analysis
            try {
                const { user } = await SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const hasConsent = await AgreementService.getInstance().hasBiometricConsent(user.id, 'body_analysis');
                    if (!hasConsent) {
                        setPendingUseCamera(useCamera);
                        setShowConsentModal(true);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Consent check error:', err);
            }

            await proceedWithImagePick(useCamera);
        } catch (err) { console.warn('Image pick error:', err); }
    };

    const proceedWithImagePick = async (useCamera: boolean) => {
        try {
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    showAlert({ title: isTurkish ? 'İzin Gerekli' : 'Permission Required', message: isTurkish ? 'Kamera erişimi gereklidir.' : 'Camera access is required.', type: 'warning' });
                    return;
                }
                const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });
                if (!result.canceled && result.assets[0]) setSelectedImage(result.assets[0].uri);
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    showAlert({ title: isTurkish ? 'İzin Gerekli' : 'Permission Required', message: isTurkish ? 'Galeri erişimi gereklidir.' : 'Gallery access is required.', type: 'warning' });
                    return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });
                if (!result.canceled && result.assets[0]) setSelectedImage(result.assets[0].uri);
            }
        } catch (err) { console.warn('Image pick error:', err); }
    };

    const handleBodyConsentAccepted = () => {
        setShowConsentModal(false);
        if (pendingUseCamera !== null) {
            proceedWithImagePick(pendingUseCamera);
            setPendingUseCamera(null);
        }
    };

    const handleBodyConsentDeclined = () => {
        setShowConsentModal(false);
        setPendingUseCamera(null);
    };

    const sendMessage = async () => {
        if (!input.trim() && !selectedImage) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim() || (isTurkish ? 'Fotoğraf yüklendi - Analiz et' : 'Photo uploaded - Analyze'),
            timestamp: new Date(),
            imageUri: selectedImage || undefined,
        };

        setMessages(prev => [...prev, userMsg]);
        const userInput = input.trim();
        const hasImage = !!selectedImage;
        setInput('');
        setSelectedImage(null);
        setLoading(true);

        try {
            const deepseek = DeepSeekService.getInstance();
            const systemPrompt = isTurkish ? TOPIC_GUARD_TR : TOPIC_GUARD_EN;
            let prompt = '';

            if (hasImage) {
                prompt = `${systemPrompt}\n\nThe user has uploaded a body/physique photo for analysis. Provide a comprehensive analysis:\n\nUser message: ${userInput || 'Please analyze my physique photo and tell me my strengths and areas for improvement.'}\n\nProvide:\n1) Overall Body Assessment\n2) Strengths - Well-developed areas\n3) Areas for Improvement\n4) Personalized Training Recommendations\n5) Weekly Program Suggestion\n\nBe encouraging, specific, and actionable.`;
            } else {
                prompt = `${systemPrompt}\n\nUser: ${userInput}\n\nProvide helpful, specific fitness advice. If the user asks for a program, create a detailed weekly plan.`;
            }

            const response = await deepseek.generateContent(prompt, 'coach');
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: new Date() }]);

            // Award XP for using AI Coach
            try { await LeagueService.getInstance().addXP(10, 'ai_chat', 'AI Coach interaction'); } catch { }
        } catch (err: any) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: isTurkish ? 'Bir hata oluştu. Tekrar deneyin.' : 'An error occurred. Please try again.', timestamp: new Date() }]);
        } finally {
            setLoading(false);
        }
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const quickPrompts = isTurkish
        ? ['Bana özel antrenman programı yaz', 'Vücut analizi yap', 'Göğüs antrenmanı planı', 'Yağ yakmak için kardiyo', 'Evde antrenman programı', 'Bacak güçlendirme programı']
        : ['Create a custom workout plan', 'Analyze my physique', 'Chest workout plan', 'Cardio for fat loss', 'Home workout program', 'Leg strengthening program'];

    return (
        <View style={COMMON_STYLES.screenContainer}>
            <AlertComponent />
            <BiometricConsentModal
                visible={showConsentModal}
                consentType="body_analysis"
                onAccept={handleBodyConsentAccepted}
                onDecline={handleBodyConsentDeclined}
            />

            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerRow}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="barbell" size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>AI Coach</Text>
                        <Text style={styles.headerSub}>{isTurkish ? 'Kişisel antrenman asistanı' : 'Personal workout assistant'}</Text>
                    </View>
                    <PremiumBadge locked={false} size="md" />
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={10}>
                <ScrollView ref={scrollRef} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
                    {messages.length <= 1 && (
                        <View style={styles.quickPrompts}>
                            {quickPrompts.map((prompt, index) => (
                                <TouchableOpacity key={index} style={styles.quickChip} onPress={() => setInput(prompt)} activeOpacity={0.7}>
                                    <Text style={styles.quickText}>{prompt}</Text>
                                </TouchableOpacity>
                            ))}
                            {/* Photo Upload Card */}
                            <View style={styles.photoCard}>
                                <Ionicons name="camera" size={28} color={colors.primary} />
                                <Text style={styles.photoCardTitle}>{isTurkish ? 'Fotoğraf ile Vücut Analizi' : 'Body Analysis with Photo'}</Text>
                                <Text style={styles.photoCardDesc}>
                                    {isTurkish
                                        ? 'Fotoğrafınızı yükleyin, vücudunuzun güçlü ve zayıf noktalarını analiz edeyim ve size özel program yazayım'
                                        : 'Upload your photo, I\'ll analyze your body\'s strengths & weaknesses and create a custom program'}
                                </Text>
                                <View style={styles.photoButtonsRow}>
                                    <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
                                        <Ionicons name="camera-outline" size={20} color={colors.primary} />
                                        <Text style={styles.photoBtnText}>{isTurkish ? 'Çek' : 'Camera'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
                                        <Ionicons name="images-outline" size={20} color={colors.primary} />
                                        <Text style={styles.photoBtnText}>{isTurkish ? 'Galeri' : 'Gallery'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {messages.map((msg) => (
                        <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                            {msg.role === 'ai' && (
                                <View style={styles.aiAvatar}><Ionicons name="barbell" size={14} color={colors.primary} /></View>
                            )}
                            <View style={[styles.messageContent, msg.role === 'user' ? styles.userContent : styles.aiContent]}>
                                {msg.imageUri && <Image source={{ uri: msg.imageUri }} style={styles.messageImage} contentFit="cover" cachePolicy="memory-disk" transition={500} />}
                                <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.aiText]}>{msg.content}</Text>
                            </View>
                        </View>
                    ))}

                    {loading && (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.loadingText}>{isTurkish ? 'Analiz ediliyor...' : 'Analyzing...'}</Text>
                        </View>
                    )}
                </ScrollView>

                {selectedImage && (
                    <View style={styles.imagePreview}>
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} contentFit="cover" cachePolicy="memory-disk" transition={500} />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                            <Ionicons name="close-circle" size={24} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                )}

                {showPhotoOptions && (
                    <View style={styles.photoOptionsOverlay}>
                        <View style={styles.photoOptionsCard}>
                            <Text style={styles.photoOptionsTitle}>{isTurkish ? 'Fotoğraf Yükle' : 'Upload Photo'}</Text>
                            <TouchableOpacity style={styles.photoOptionBtn} onPress={() => pickImage(true)}>
                                <Ionicons name="camera" size={24} color={colors.primary} />
                                <Text style={styles.photoOptionText}>{isTurkish ? 'Fotoğraf Çek' : 'Take Photo'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoOptionBtn} onPress={() => pickImage(false)}>
                                <Ionicons name="images" size={24} color={colors.primary} />
                                <Text style={styles.photoOptionText}>{isTurkish ? 'Galeriden Seç' : 'Choose from Gallery'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoOptionCancel} onPress={() => setShowPhotoOptions(false)}>
                                <Text style={styles.photoOptionCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={[styles.inputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
                    <TouchableOpacity style={styles.attachBtn} onPress={() => setShowPhotoOptions(true)} activeOpacity={0.7}>
                        <Ionicons name="camera" size={22} color={selectedImage ? colors.primary : colors.textTertiary} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder={isTurkish ? 'Mesajınızı yazın veya fotoğraf yükleyin...' : 'Type your message or upload a photo...'}
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!input.trim() && !selectedImage) && styles.sendBtnDisabled]}
                        onPress={sendMessage}
                        disabled={(!input.trim() && !selectedImage) || loading}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="send" size={20} color={(input.trim() || selectedImage) ? colors.background : colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    backBtn: { marginBottom: SPACING.sm },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3, color: colors.text },
    headerSub: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },
    chatContent: { padding: SPACING.lg, paddingBottom: 20 },
    quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
    quickChip: { backgroundColor: colors.primarySoft, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.pill, borderWidth: 1, borderColor: colors.primary + '30' },
    quickText: { ...TYPOGRAPHY.caption, color: colors.primary, fontWeight: '600' },
    photoCard: { width: '100%', backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 2, borderColor: colors.primary + '30', borderStyle: 'dashed', marginTop: SPACING.md, gap: SPACING.sm },
    photoCardTitle: { ...TYPOGRAPHY.bodyBold, color: colors.text, textAlign: 'center' },
    photoCardDesc: { ...TYPOGRAPHY.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    photoButtonsRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
    photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primarySoft, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.pill },
    photoBtnText: { ...TYPOGRAPHY.caption, color: colors.primary, fontWeight: '600' },
    messageBubble: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
    userBubble: { justifyContent: 'flex-end' },
    aiBubble: { justifyContent: 'flex-start' },
    aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
    messageContent: { maxWidth: '78%', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
    userContent: { backgroundColor: colors.primary, borderBottomRightRadius: 4, marginLeft: 'auto' },
    aiContent: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.borderLight },
    messageText: { ...TYPOGRAPHY.body, lineHeight: 22 },
    userText: { color: colors.background },
    aiText: { color: colors.text },
    messageImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
    loadingText: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    imagePreview: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
    previewImage: { width: 60, height: 60, borderRadius: BORDER_RADIUS.md },
    removeImageBtn: { marginLeft: SPACING.sm },
    photoOptionsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    photoOptionsCard: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, paddingBottom: 40 },
    photoOptionsTitle: { ...TYPOGRAPHY.h3, color: colors.text, textAlign: 'center', marginBottom: SPACING.lg },
    photoOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    photoOptionText: { ...TYPOGRAPHY.body, color: colors.text },
    photoOptionCancel: { paddingVertical: SPACING.md, marginTop: SPACING.sm, alignItems: 'center' },
    photoOptionCancelText: { ...TYPOGRAPHY.bodyBold, color: colors.error },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.background, gap: SPACING.sm },
    attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, ...TYPOGRAPHY.body, color: colors.text, maxHeight: 100, borderWidth: 1, borderColor: colors.borderLight },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { backgroundColor: colors.surface },
});

export default AICoachScreen;
