import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image'; // Use expo-image for better caching and performance
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import PremiumBadge from '../components/PremiumBadge';
import PremiumFeaturesModal from '../components/PremiumFeaturesModal';
import { useAlert } from '../components/CustomAlert';
import { DeepSeekService } from '../services/deepseek';
import { PaymentService } from '../services/paymentService';
import { SupabaseService } from '@nextself/shared';
import { LeagueService } from '../services/leagueService';
import PlatformStorage from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
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
  if (/[çğıöşüİı]/i.test(q) || /\b(merhaba|selam|nasılsın|beslenme|diyet|kalori|makro)\b/i.test(q)) return 'tr';
  if (/\b(hola|gracias|nutrición|dieta|salud)\b/i.test(q)) return 'es';
  if (/\b(bonjour|merci|nutrition|régime|santé)\b/i.test(q)) return 'fr';
  if (/\b(hallo|danke|ernährung|diät|gesundheit)\b/i.test(q)) return 'de';
  if (/\b(ciao|grazie|nutrizione|dieta|salute)\b/i.test(q)) return 'it';
  if (/\b(olá|obrigado|nutrição|dieta|saúde)\b/i.test(q)) return 'pt';
  return fallback;
};

const DIETITIAN_POPUP_SHOWN_KEY = 'nextself_dietitian_popup_shown';

const AIDietitianScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isTurkish } = useTranslation();
  const { showAlert, AlertComponent } = useAlert();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const welcome: Message = {
      id: '0', role: 'ai',
      content: isTurkish
        ? 'Merhaba, ben AI Diyetisyen. Beslenme ve diyet programını hedefinize göre oluştururum.'
        : 'Hi, I am AI Dietitian. I create nutrition and diet programs for your goals.',
      timestamp: new Date(),
    };
    setMessages([welcome]);
  }, [isTurkish]);

  const checkPremiumStatus = async () => {
    try {
      const { user } = await SupabaseService.getInstance().getCurrentUser();
      if (user) {
        const isPremium = await PaymentService.getInstance().hasPremiumFeatures(user.id);
        return isPremium;
      }
    } catch (err) {
      console.warn('Premium check error:', err);
    }
    return false;
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      setShowPhotoOptions(false);
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { showAlert({ title: isTurkish ? 'İzin Gerekli' : 'Permission Required', message: isTurkish ? 'Kamera erişimi gereklidir.' : 'Camera access is required.', type: 'warning' }); return; }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });
        if (!result.canceled && result.assets[0]) {
          setSelectedImage(result.assets[0].uri);
          setSelectedImageBase64(result.assets[0].base64 || null);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { showAlert({ title: isTurkish ? 'İzin Gerekli' : 'Permission Required', message: isTurkish ? 'Galeri erişimi gereklidir.' : 'Gallery access is required.', type: 'warning' }); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });
        if (!result.canceled && result.assets[0]) {
          setSelectedImage(result.assets[0].uri);
          setSelectedImageBase64(result.assets[0].base64 || null);
        }
      }
    } catch (err) { console.warn('Image pick error:', err); }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;
    const rawInput = input.trim();
    const detectedLanguage = rawInput ? detectMessageLanguage(rawInput, 'auto') : (isTurkish ? 'tr' : 'en');
    const userMsg: Message = {
      id: Date.now().toString(), role: 'user',
      content: rawInput || (isTurkish ? 'Fotoğraf yüklendi - Beslenme programı oluştur' : 'Photo uploaded - Create nutrition plan'),
      timestamp: new Date(),
      imageUri: selectedImage || undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    const userInput = rawInput;
    const imageBase64 = selectedImageBase64;

    setInput('');
    setSelectedImage(null);
    setSelectedImageBase64(null);
    setLoading(true);

    try {
      const deepseek = DeepSeekService.getInstance();

      // Fetch User Profile for better context
      let contextData: any = {};
      try {
        const { user } = await SupabaseService.getInstance().getCurrentUser();
        if (user) {
          const { data: profile } = await SupabaseService.getInstance().getClient()
            .from('profiles')
            .select('height, weight, gender, fitness_goal, activity_level, dietary_preferences')
            .eq('id', user.id)
            .single();

          if (profile) {
            contextData = {
              height: profile.height,
              weight: profile.weight,
              gender: profile.gender,
              goal: profile.fitness_goal,
              activity_level: profile.activity_level,
              dietary_preferences: profile.dietary_preferences
            };
          }
        }
      } catch (e) {
        console.warn('Failed to fetch user context for AI Dietitian:', e);
      }

      // Send to AI
      const response = await deepseek.generateContent('dietitian', {
        query: userInput
          ? `${userInput}\n\n${isTurkish ? 'Kullanıcı isterse haftalık/aylık beslenme programı oluştur ve adım adım uygulanışını yaz.' : 'If requested, create a weekly/monthly nutrition program and include practical step-by-step implementation.'}`
          : (imageBase64 ? (isTurkish ? 'Fotoğrafıma göre bana özel beslenme planı oluştur.' : 'Based on my photo, create a personalized nutrition/diet plan for me.') : ''),
        context: contextData,
        language: detectedLanguage
      }, imageBase64 || undefined);

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: new Date() }]);

      try { await LeagueService.getInstance().addXP(10, 'ai_chat', 'AI Dietitian interaction'); } catch { }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: isTurkish ? 'Hata oluştu.' : 'Error occurred.', timestamp: new Date() }]);
    } finally { setLoading(false); }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
      <AlertComponent />
      <PremiumFeaturesModal
        visible={showPremiumModal}
        onClose={() => {
          setShowPremiumModal(false);
          safeGoBack(navigation, 'AIToolsStack');
        }}
        onUpgrade={() => {
          setShowPremiumModal(false);
          navigation.navigate('Store');
        }}
      />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => safeGoBack(navigation, 'AIToolsStack')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="restaurant" size={24} color={colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>AI {isTurkish ? 'Diyetisyen' : 'Dietitian'}</Text>
            <Text style={styles.headerSub}>{isTurkish ? 'Kişisel beslenme asistanı' : 'Personal nutrition assistant'}</Text>
          </View>
          <PremiumBadge locked={false} size="md" />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={10}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.role === 'ai' && <View style={styles.aiAvatar}><Ionicons name="restaurant" size={14} color={colors.secondary} /></View>}
              <View style={[styles.messageContent, msg.role === 'user' ? styles.userContent : styles.aiContent]}>
                {msg.imageUri && <Image source={{ uri: msg.imageUri }} style={styles.messageImage} contentFit="cover" cachePolicy="memory-disk" transition={500} />}
                <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.aiText]}>{msg.content}</Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.secondary} />
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
            {loading ? <ActivityIndicator size="small" color={isDark ? colors.text : colors.textInverse} /> : <Ionicons name="send" size={20} color={isDark ? colors.text : colors.textInverse} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    backgroundColor: colors.secondary + '20',
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
  userText: { color: isDark ? colors.text : colors.textInverse },
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
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.disabled },
  imagePreview: {
    position: 'absolute', bottom: 80, left: SPACING.md, width: 100, height: 100,
    borderRadius: BORDER_RADIUS.md, overflow: 'hidden', borderWidth: 2, borderColor: colors.primary,
  },
  previewImage: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 2, right: 2 },
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

export default AIDietitianScreen;
