import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import PremiumBadge from '../components/PremiumBadge';
import BiometricConsentModal from '../components/BiometricConsentModal';
import { useAlert } from '../components/CustomAlert';
import { DeepSeekService } from '../services/deepseek';
import { SupabaseService } from '@nextself/shared';
import { AgreementService } from '../services/agreementService';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    imageUri?: string;
}

const detectMessageLanguage = (text: string, fallback: string): string => {
    const q = (text || '').trim();
    if (!q) return fallback;
    if (/[а-яё]/i.test(q)) return 'ru';
    if (/[ء-ي]/i.test(q)) return 'ar';
    if (/[一-龯]/.test(q)) return 'zh';
    if (/[ぁ-ゖァ-ヺ]/.test(q)) return 'ja';
    if (/[가-힣]/.test(q)) return 'ko';
    if (/[ऀ-ॿ]/.test(q)) return 'hi';
    if (/[ก-๙]/.test(q)) return 'th';
    if (/[א-ת]/.test(q)) return 'he';
    if (/[çğıöşüİı]/i.test(q) || /\b(merhaba|selam|nasılsın|antrenman|beslenme|yağ|kas|uyku)\b/i.test(q)) return 'tr';
    if (/\b(hola|gracias|entrenamiento|dieta|salud)\b/i.test(q)) return 'es';
    if (/\b(bonjour|merci|entraînement|santé)\b/i.test(q)) return 'fr';
    if (/\b(hallo|danke|training|gesundheit)\b/i.test(q)) return 'de';
    if (/\b(ciao|grazie|allenamento|salute)\b/i.test(q)) return 'it';
    if (/\b(olá|obrigado|treino|nutrição|saúde)\b/i.test(q)) return 'pt';
    return fallback;
};

const AICoachScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const { isTurkish } = useTranslation();
    const { showAlert, AlertComponent } = useAlert();
    const scrollRef = useRef<ScrollView>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const welcome: Message = {
            id: '0',
            role: 'ai',
            content: isTurkish
                ? 'Merhaba, ben AI PT. Antrenman ve fitness programını hazırlarım.'
                : 'Hi, I am AI PT. I build your workout and fitness program.',
            timestamp: new Date(),
        };
        setMessages([welcome]);
    }, [isTurkish]);

    const pickImage = async (useCamera: boolean) => {
        setShowPhotoOptions(false);
        const permission = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            showAlert({
                title: isTurkish ? 'İzin Gerekli' : 'Permission Required',
                message: isTurkish ? 'Fotoğraf erişimi için izin gerekiyor.' : 'Photo access permission is required.',
                type: 'error'
            });
            return;
        }
        const result = useCamera
            ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8, base64: true })
            : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8, base64: true });
        if (!result.canceled && result.assets.length > 0) {
            setSelectedImage(result.assets[0].uri);
            setSelectedImageBase64(result.assets[0].base64 || null);
            try {
                const { user } = await SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const hasConsent = await AgreementService.getInstance().hasBiometricConsent(user.id, 'body_analysis');
                    if (!hasConsent) {
                        setShowConsentModal(true);
                        return;
                    }
                }
                showAlert({
                    title: isTurkish ? 'Fotoğraf Yüklendi' : 'Photo Uploaded',
                    message: isTurkish ? 'Vücut analizi için hazır. Mesajınızı gönderebilirsiniz.' : 'Ready for body analysis. You can send your message.',
                    type: 'success'
                });
            } catch {
                setShowConsentModal(true);
            }
        }
    };

    const handleBodyConsentAccepted = () => {
        setShowConsentModal(false);
        showAlert({
            title: isTurkish ? 'Fotoğraf Yüklendi' : 'Photo Uploaded',
            message: isTurkish ? 'Vücut analizi için hazır. Mesajınızı gönderebilirsiniz.' : 'Ready for body analysis. You can send your message.',
            type: 'success'
        });
    };

    const handleBodyConsentDeclined = () => {
        setShowConsentModal(false);
        setSelectedImage(null);
        setSelectedImageBase64(null);
        showAlert({
            title: isTurkish ? 'Analiz İptal Edildi' : 'Analysis Cancelled',
            message: isTurkish ? 'Fotoğraf analizi onaylanmadı.' : 'Photo analysis was not approved.',
            type: 'info'
        });
    };

    const sendMessage = async () => {
        if (!input.trim() && !selectedImage) return;
        const rawInput = input.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: rawInput || (isTurkish ? 'Vücut analizi için fotoğraf gönderildi' : 'Photo sent for body analysis'),
            timestamp: new Date(),
            imageUri: selectedImage || undefined
        };
        const detectedLanguage = rawInput ? detectMessageLanguage(rawInput, 'auto') : (isTurkish ? 'tr' : 'en');
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        const imageBase64 = selectedImageBase64;
        setSelectedImage(null);
        setSelectedImageBase64(null);
        
        try {
            let contextData: any = {};
            try {
                const { user } = await SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const { data: profile } = await SupabaseService.getInstance().getClient()
                        .from('profiles')
                        .select('height, weight, gender, fitness_goal, activity_level')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile) {
                        contextData = {
                            height: profile.height,
                            weight: profile.weight,
                            gender: profile.gender,
                            goal: profile.fitness_goal,
                            activity_level: profile.activity_level
                        };
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch user context for AI Coach:', e);
            }

            const response = await DeepSeekService.getInstance().generateContent('coach', {
                query: userMsg.content,
                context: contextData,
                language: detectedLanguage
            }, imageBase64 || undefined);
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: response,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
            scrollRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
            console.warn('AI response error:', error);
            showAlert({
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Yanıt alınırken hata oluştu. Lütfen tekrar deneyin.' : 'Error getting response. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AlertComponent />
            <BiometricConsentModal
                visible={showConsentModal}
                consentType="body_analysis"
                onAccept={handleBodyConsentAccepted}
                onDecline={handleBodyConsentDeclined}
            />

            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'AIToolsStack')} style={styles.backBtn} activeOpacity={0.7}>
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
                    {messages.map((msg) => (
                        <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                            {msg.role === 'ai' && <View style={styles.aiAvatar}><Ionicons name="barbell" size={14} color={colors.primary} /></View>}
                            <View style={[styles.messageContent, msg.role === 'user' ? styles.userContent : styles.aiContent]}>
                                {msg.imageUri && <Image source={{ uri: msg.imageUri }} style={styles.messageImage} />}
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

                {showPhotoOptions && (
                    <View style={styles.photoOptionsOverlay}>
                        <View style={styles.photoOptionsContainer}>
                            <TouchableOpacity style={styles.photoOption} onPress={() => pickImage(true)}>
                                <Ionicons name="camera" size={24} color={colors.primary} />
                                <Text style={styles.photoOptionText}>{isTurkish ? 'Kamera' : 'Camera'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoOption} onPress={() => pickImage(false)}>
                                <Ionicons name="images" size={24} color={colors.primary} />
                                <Text style={styles.photoOptionText}>{isTurkish ? 'Galeri' : 'Gallery'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoCancel} onPress={() => setShowPhotoOptions(false)}>
                                <Text style={styles.photoCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={[styles.inputContainer, { marginBottom: Platform.OS === 'ios' ? insets.bottom : 20 }]}>
                    <TouchableOpacity style={styles.attachBtn} onPress={() => setShowPhotoOptions(true)}>
                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder={isTurkish ? 'Bir şeyler sorun...' : 'Ask something...'}
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity style={[styles.sendBtn, (!input.trim() && !selectedImage) && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim() && !selectedImage || loading}>
                        {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { marginRight: SPACING.sm },
    headerRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    headerIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primary + '20',
        alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm
    },
    headerTitle: { ...TYPOGRAPHY.h3, color: colors.text },
    headerSub: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    chatContent: { padding: SPACING.md, paddingBottom: 100 },
    messageBubble: {
        maxWidth: '85%', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.md, flexDirection: 'row',
    },
    userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 2 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.border },
    aiAvatar: { marginRight: SPACING.xs, marginTop: 2 },
    messageContent: { flex: 1 },
    userContent: { flex: 1 },
    aiContent: { flex: 1 },
    messageText: { ...TYPOGRAPHY.body },
    userText: { color: '#FFF' },
    aiText: { color: colors.text },
    messageImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: SPACING.md, marginBottom: SPACING.md },
    loadingText: { marginLeft: SPACING.xs, color: colors.textSecondary, ...TYPOGRAPHY.caption },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', padding: SPACING.sm,
        backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    },
    attachBtn: { padding: SPACING.xs, marginRight: SPACING.xs },
    input: {
        flex: 1, backgroundColor: colors.background, borderRadius: BORDER_RADIUS.pill,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        color: colors.text, maxHeight: 100,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.sm,
    },
    sendBtnDisabled: { backgroundColor: colors.disabled || '#ccc' },
    photoOptionsOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    },
    photoOptionsContainer: {
        backgroundColor: colors.surface, padding: SPACING.xl, borderRadius: BORDER_RADIUS.xl, width: '80%',
    },
    photoOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    photoOptionText: { marginLeft: SPACING.md, ...TYPOGRAPHY.h3, color: colors.text },
    photoCancel: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm },
    photoCancelText: { ...TYPOGRAPHY.button, color: colors.error },
});

export default AICoachScreen;
