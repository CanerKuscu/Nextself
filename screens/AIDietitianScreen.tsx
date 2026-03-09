import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image'; // Use expo-image for better caching and performance
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import PremiumBadge from '../components/PremiumBadge';
import PremiumFeaturesModal from '../components/PremiumFeaturesModal';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { DeepSeekService } from '../services/deepseek';
import { PaymentService } from '../services/paymentService';
import { SupabaseService } from '../services/supabase';
import { LeagueService } from '../services/leagueService';
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

const TOPIC_GUARD_EN = `You are BioSync AI Dietitian/Nutritionist. You ONLY answer questions about nutrition, diet, meal planning, weight management, food science, supplements, macros, calories, and related health topics.

If the user asks about ANY topic unrelated to nutrition, diet, food, or health (such as history, math, politics, coding, geography, entertainment, etc.), you MUST respond ONLY with:
"I can only help with nutrition, diet, and food-related health topics. Please ask me about meal plans, dietary advice, or nutritional guidance!"

CRITICAL: Detect the language of the user's message and ALWAYS respond in that SAME language.`;

const TOPIC_GUARD_TR = `Sen BioSync AI Diyetisyenisin. SADECE beslenme, diyet, öğün planlama, kilo yönetimi, gıda bilimi, takviyeler, makrolar, kalori ve ilgili sağlık konularında soruları yanıtlarsın.

Kullanıcı beslenme, diyet, gıda veya sağlıkla ilgisi olmayan HERHANGİ bir konuda soru sorarsa (tarih, matematik, politika, kodlama, coğrafya, eğlence vb.), SADECE şu şekilde yanıt vermelisin:
"Sadece beslenme, diyet ve gıda ile ilgili sağlık konularında yardımcı olabilirim. Lütfen bana öğün planı, diyet tavsiyeleri veya beslenme rehberliği hakkında sorun!"

KRİTİK: Kullanıcının mesajının dilini algıla ve HER ZAMAN aynı dilde yanıt ver.`;

const AIDietitianScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isTurkish } = useTranslation();
  const { showAlert, AlertComponent } = useAlert();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkPremium();
    const welcome: Message = {
      id: '0', role: 'ai',
      content: isTurkish
        ? 'Merhaba! Ben BioSync AI Diyetisyeniniz.\n\nKişisel beslenme planları oluşturabilirim\nFotoğrafınıza göre beslenme programı hazırlayabilirim\nKilo hedeflerinize uygun diyet programı yazabilirim\n\nNasıl yardımcı olabilirim?'
        : 'Hi! I\'m your BioSync AI Dietitian.\n\nI can create personalized meal plans\nUpload your photo for customized nutrition programs\nI\'ll design diet plans for your weight goals\n\nHow can I help?',
      timestamp: new Date(),
    };
    setMessages([welcome]);
  }, []);

  const checkPremium = async () => {
    try {
      const { user } = await SupabaseService.getInstance().getCurrentUser();
      if (user) {
        const isPremium = await PaymentService.getInstance().hasPremiumFeatures(user.id);
        if (!isPremium) {
          setShowPremiumModal(true);
        }
      }
    } catch (err) {
      console.warn('Premium check error:', err);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      setShowPhotoOptions(false);
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { showAlert({ title: isTurkish ? 'İzin Gerekli' : 'Permission Required', message: isTurkish ? 'Kamera erişimi gereklidir.' : 'Camera access is required.', type: 'warning' }); return; }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });
        if (!result.canceled && result.assets[0]) setSelectedImage(result.assets[0].uri);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { showAlert({ title: isTurkish ? 'İzin Gerekli' : 'Permission Required', message: isTurkish ? 'Galeri erişimi gereklidir.' : 'Gallery access is required.', type: 'warning' }); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });
        if (!result.canceled && result.assets[0]) setSelectedImage(result.assets[0].uri);
      }
    } catch (err) { console.warn('Image pick error:', err); }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;
    const userMsg: Message = {
      id: Date.now().toString(), role: 'user',
      content: input.trim() || (isTurkish ? 'Fotoğraf yüklendi - Beslenme programı oluştur' : 'Photo uploaded - Create nutrition plan'),
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
        prompt = `${systemPrompt}\n\nThe user has uploaded a body photo for nutritional assessment. Provide a comprehensive nutrition plan based on their goals.\n\nUser message: ${userInput || 'Based on my photo, create a personalized nutrition/diet plan for me.'}\n\nProvide:\n1) Body Assessment - General body composition evaluation\n2) Estimated Daily Calorie Needs (BMR/TDEE)\n3) Recommended Macros (Protein, Carbs, Fat)\n4) 7-Day Meal Plan with specific meals\n5) Supplement Recommendations\n6) Hydration Guidelines\n\nBe detailed, practical, and encouraging.`;
      } else {
        prompt = `${systemPrompt}\n\nUser: ${userInput}\n\nProvide helpful, specific nutrition advice. If the user asks for a diet/meal plan, create a detailed weekly plan with macros.`;
      }

      const response = await deepseek.generateContent(prompt, 'dietitian');
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: new Date() }]);

      try { await LeagueService.getInstance().addXP(10, 'ai_chat', 'AI Dietitian interaction'); } catch { }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: isTurkish ? 'Hata oluştu.' : 'Error occurred.', timestamp: new Date() }]);
    } finally { setLoading(false); }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const quickPrompts = isTurkish
    ? ['Bana özel beslenme programı yaz', 'Fotoğrafıma göre diyet hazırla', 'Protein ağırlıklı diyet', 'Kilo vermek istiyorum', 'Vegan beslenme önerisi', 'Günlük öğün planı']
    : ['Create a custom meal plan for me', 'Diet plan based on my photo', 'High protein diet', 'Weight loss plan', 'Vegan nutrition tips', 'Daily meal plan'];

  return (
    <View style={COMMON_STYLES.screenContainer}>
      <AlertComponent />
      <PremiumFeaturesModal
        visible={showPremiumModal}
        onClose={() => {
          setShowPremiumModal(false);
          navigation.goBack();
        }}
        onUpgrade={() => {
          setShowPremiumModal(false);
          navigation.navigate('Store');
        }}
      />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
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
          {messages.length <= 1 && (
            <View style={styles.quickPrompts}>
              {quickPrompts.map((p, i) => (
                <TouchableOpacity key={i} style={styles.quickChip} onPress={() => setInput(p)} activeOpacity={0.7}>
                  <Text style={styles.quickText}>{p}</Text>
                </TouchableOpacity>
              ))}
              {/* Photo Upload Card */}
              <View style={styles.photoCard}>
                <Ionicons name="camera" size={28} color={colors.secondary} />
                <Text style={styles.photoCardTitle}>{isTurkish ? 'Fotoğraf ile Beslenme Analizi' : 'Nutrition Analysis with Photo'}</Text>
                <Text style={styles.photoCardDesc}>
                  {isTurkish
                    ? 'Fotoğrafınızı yükleyin, vücudunuza özel beslenme programı hazırlayayım'
                    : 'Upload your photo, I\'ll create a nutrition plan customized for your body'}
                </Text>
                <View style={styles.photoButtonsRow}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
                    <Ionicons name="camera-outline" size={20} color={colors.secondary} />
                    <Text style={styles.photoBtnText}>{isTurkish ? 'Çek' : 'Camera'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
                    <Ionicons name="images-outline" size={20} color={colors.secondary} />
                    <Text style={styles.photoBtnText}>{isTurkish ? 'Galeri' : 'Gallery'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

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
            <View style={styles.photoOptionsCard}>
              <Text style={styles.photoOptionsTitle}>{isTurkish ? 'Fotoğraf Yükle' : 'Upload Photo'}</Text>
              <TouchableOpacity style={styles.photoOptionBtn} onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={24} color={colors.secondary} />
                <Text style={styles.photoOptionText}>{isTurkish ? 'Fotoğraf Çek' : 'Take Photo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoOptionBtn} onPress={() => pickImage(false)}>
                <Ionicons name="images" size={24} color={colors.secondary} />
                <Text style={styles.photoOptionText}>{isTurkish ? 'Galeriden Seç' : 'Choose from Gallery'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoOptionCancel} onPress={() => setShowPhotoOptions(false)}>
                <Text style={styles.photoOptionCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.inputArea, { paddingBottom: insets.bottom || SPACING.md }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => setShowPhotoOptions(true)} activeOpacity={0.7}>
            <Ionicons name="camera" size={22} color={selectedImage ? colors.secondary : colors.textTertiary} />
          </TouchableOpacity>
          <TextInput style={styles.textInput} placeholder={isTurkish ? 'Mesajınızı yazın veya fotoğraf yükleyin...' : 'Type your message or upload a photo...'} placeholderTextColor={colors.textTertiary} value={input} onChangeText={setInput} multiline maxLength={1000} />
          <TouchableOpacity style={[styles.sendButton, (!input.trim() && !selectedImage) && styles.sendButtonDisabled]} onPress={sendMessage} disabled={(!input.trim() && !selectedImage) || loading}>
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: SPACING.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.secondarySoft, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: colors.text },
  headerSub: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
  chatContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  quickChip: { backgroundColor: colors.secondarySoft, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.pill, borderWidth: 1, borderColor: colors.secondary + '30' },
  quickText: { ...TYPOGRAPHY.caption, color: colors.secondary },
  photoCard: { width: '100%', backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 2, borderColor: colors.secondary + '30', borderStyle: 'dashed', marginTop: SPACING.md, gap: SPACING.sm },
  photoCardTitle: { ...TYPOGRAPHY.bodyBold, color: colors.text, textAlign: 'center' },
  photoCardDesc: { ...TYPOGRAPHY.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  photoButtonsRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.secondarySoft, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.pill },
  photoBtnText: { ...TYPOGRAPHY.caption, color: colors.secondary, fontWeight: '600' },
  messageBubble: { flexDirection: 'row', marginBottom: SPACING.md, gap: SPACING.sm },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.secondarySoft, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  messageContent: { maxWidth: '75%', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  userContent: { backgroundColor: colors.secondary, borderBottomRightRadius: 4 },
  aiContent: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.borderLight },
  messageText: { ...TYPOGRAPHY.body, lineHeight: 22 },
  userText: { color: colors.textInverse },
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
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.surface, gap: SPACING.sm },
  attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, ...TYPOGRAPHY.body, color: colors.text, backgroundColor: colors.surfaceSecondary, borderRadius: BORDER_RADIUS.xl, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendButtonDisabled: { opacity: 0.4 },
});

export default AIDietitianScreen;
