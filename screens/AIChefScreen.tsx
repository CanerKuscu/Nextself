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
import { SupabaseService } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

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
    checkPremium();
    const welcome: Message = {
      id: '0', role: 'ai',
      content: isTurkish
        ? 'Merhaba! Ben BioSync AI Şefiniz. Kalori ve protein hedeflerinize uygun yemek tarifleri önerebilirim. Ne pişirmek istersiniz?'
        : 'Hi! I\'m your BioSync AI Chef. I can suggest recipes to match your calorie and protein goals. What would you like to cook?',
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

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const deepseek = DeepSeekService.getInstance();
      const prompt = `You are BioSync AI Chef. CRITICAL: Detect the language of the user's message and ALWAYS respond in that SAME language. If user writes in Turkish, respond in Turkish. If user writes in German, respond in German. If user writes in Arabic, respond in Arabic. Always match the user's language exactly. Suggest healthy recipes with calorie and macro info.\n\nUser: ${userMsg.content}`;
      const response = await deepseek.generateContent(prompt, 'chef');
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: isTurkish ? 'Hata oluştu.' : 'Error occurred.', timestamp: new Date() }]);
    } finally { setLoading(false); }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const quickPrompts = isTurkish
    ? ['500 kalorinin altında tarif', 'Yüksek proteinli akşam yemeği', 'Hızlı kahvaltı önerisi', 'Atıştırmalık tarifi']
    : ['Under 500 calorie recipe', 'High protein dinner', 'Quick breakfast ideas', 'Healthy snack recipe'];

  return (
    <View style={COMMON_STYLES.screenContainer}>
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
          {messages.length <= 1 && (
            <View style={styles.quickPrompts}>
              {quickPrompts.map((p, i) => (
                <TouchableOpacity key={i} style={styles.quickChip} onPress={() => setInput(p)} activeOpacity={0.7}>
                  <Text style={styles.quickText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.role === 'ai' && <View style={styles.aiAvatar}><Ionicons name="flame" size={14} color={colors.accent} /></View>}
              <View style={[styles.messageContent, msg.role === 'user' ? styles.userContent : styles.aiContent]}>
                <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.aiText]}>{msg.content}</Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.aiAvatar}><Ionicons name="flame" size={14} color={colors.accent} /></View>
              <View style={[styles.messageContent, styles.aiContent]}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            </View>
          )}
        </ScrollView>
        <View style={[styles.inputArea, { paddingBottom: insets.bottom || SPACING.md }]}>
          <TextInput style={styles.textInput} placeholder={isTurkish ? 'Mesajınızı yazın...' : 'Type your message...'} placeholderTextColor={colors.textTertiary} value={input} onChangeText={setInput} multiline maxLength={1000} />
          <TouchableOpacity style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} onPress={sendMessage} disabled={!input.trim() || loading}>
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
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: colors.text },
  headerSub: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
  chatContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  quickChip: { backgroundColor: colors.accentSoft, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.pill, borderWidth: 1, borderColor: colors.accent + '30' },
  quickText: { ...TYPOGRAPHY.caption, color: colors.accentDark },
  messageBubble: { flexDirection: 'row', marginBottom: SPACING.md, gap: SPACING.sm },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  messageContent: { maxWidth: '75%', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  userContent: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  aiContent: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.borderLight },
  messageText: { ...TYPOGRAPHY.body, lineHeight: 22 },
  userText: { color: colors.textInverse },
  aiText: { color: colors.text },
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.surface, gap: SPACING.sm },
  textInput: { flex: 1, ...TYPOGRAPHY.body, color: colors.text, backgroundColor: colors.surfaceSecondary, borderRadius: BORDER_RADIUS.xl, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendButtonDisabled: { opacity: 0.4 },
});

export default AIChefScreen;
