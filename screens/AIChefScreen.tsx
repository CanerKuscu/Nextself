import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumBadge from '../components/PremiumBadge';
import PremiumFeaturesModal from '../components/PremiumFeaturesModal';
import { DeepSeekService } from '../services/deepseek';
import { PaymentService } from '../services/paymentService';
import { SupabaseService } from '@nextself/shared';
import { SupplementService } from '../services/supplementService';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
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
  if (/[çğıöşüİı]/i.test(q) || /\b(merhaba|selam|tarif|yemek|mutfak|malzeme)\b/i.test(q)) return 'tr';
  if (/\b(hola|gracias|receta|comida|cocina)\b/i.test(q)) return 'es';
  if (/\b(bonjour|merci|recette|cuisine|alimentation)\b/i.test(q)) return 'fr';
  if (/\b(hallo|danke|rezept|küche|ernährung)\b/i.test(q)) return 'de';
  if (/\b(ciao|grazie|ricetta|cucina|cibo)\b/i.test(q)) return 'it';
  if (/\b(olá|obrigado|receita|cozinha|alimentação)\b/i.test(q)) return 'pt';
  return fallback;
};

const AIChefScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isTurkish } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const welcome: Message = {
      id: '0', role: 'ai',
      content: isTurkish
        ? 'Merhaba, ben AI Şef. Hedefine uygun besin önerisi, tarif ve yapılış adımları veririm.'
        : 'Hi, I am AI Chef. I provide goal-based food suggestions, recipes, and step-by-step cooking guides.',
      timestamp: new Date(),
    };
    setMessages([welcome]);
  }, [isTurkish]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userInput = input.trim();
    const detectedLanguage = userInput ? detectMessageLanguage(userInput, 'auto') : (isTurkish ? 'tr' : 'en');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
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
                  .select('fitness_goal, dietary_preferences, allergies')
                  .eq('id', user.id)
                  .single();
              
              // Fetch supplements
              const { data: routines } = await SupplementService.getInstance().getUserRoutine(user.id);
              let activeSupplements: string[] = [];
              if (routines && routines.length > 0) {
                  activeSupplements = routines.map((r: any) => 
                      `${r.supplement.name_en || r.supplement.name_tr} (${r.supplement.dosage_amount || ''}${r.supplement.dosage_unit || ''})`
                  );
              }
              
              if (profile) {
                  contextData = {
                      goal: profile.fitness_goal,
                      dietary_preferences: profile.dietary_preferences,
                      allergies: profile.allergies,
                      supplements: activeSupplements
                  };
              }
          }
      } catch (e) {
          console.warn('Failed to fetch user context for AI Chef:', e);
      }

      // Send structured data to Edge Function
      const response = await deepseek.generateContent('chef', {
          query: `${userMsg.content}\n\n${isTurkish
            ? 'Cevap formatı: 1) Hedefe göre besin önerisi 2) Tarifi adım adım nasıl yapacağım 3) İlgili en az 2 YouTube videosu için tam bağlantı (youtube.com arama linki olabilir).'
            : 'Response format: 1) Goal-based food suggestion 2) Step-by-step preparation 3) At least 2 full YouTube links (youtube.com search links are acceptable).'
          }`,
          context: contextData,
          language: detectedLanguage
      });

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: isTurkish ? 'Hata oluştu.' : 'Error occurred.', timestamp: new Date() }]);
    } finally { setLoading(false); }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={COMMON_STYLES.screenContainer}>
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
            <Ionicons name="flame" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>AI {isTurkish ? 'Şef' : 'Chef'}</Text>
            <Text style={styles.headerSub}>{isTurkish ? 'Sağlıklı tarif asistanı' : 'Healthy recipe assistant'}</Text>
          </View>
          <PremiumBadge locked={false} size="md" />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={10}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.role === 'ai' && <View style={styles.aiAvatar}><Ionicons name="flame" size={14} color={colors.accent} /></View>}
              <View style={[styles.messageContent, msg.role === 'user' ? styles.userContent : styles.aiContent]}>
                <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.aiText]}>{msg.content}</Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>{isTurkish ? 'Tarif hazırlanıyor...' : 'Cooking up recipe...'}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { marginBottom: Platform.OS === 'ios' ? insets.bottom : 20 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={isTurkish ? 'Bir şeyler sorun...' : 'Ask something...'}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim() || loading}>
            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.accent + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm
  },
  headerTitle: { ...TYPOGRAPHY.h3, color: colors.text },
  headerSub: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
  chatContent: { padding: SPACING.md, paddingBottom: 100 },
  messageBubble: {
    maxWidth: '85%', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md, flexDirection: 'row',
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 2 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.border },
  aiAvatar: { marginRight: SPACING.xs, marginTop: 2 },
  messageContent: { flex: 1 },
  userContent: { flex: 1 },
  aiContent: { flex: 1 },
  messageText: { ...TYPOGRAPHY.body },
  userText: { color: '#FFF' },
  aiText: { color: colors.text },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: SPACING.md, marginBottom: SPACING.md },
  loadingText: { marginLeft: SPACING.xs, color: colors.textSecondary, ...TYPOGRAPHY.caption },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    color: colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.disabled || '#ccc' },
});

export default AIChefScreen;
