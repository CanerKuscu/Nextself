import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../config/theme';
import { SecurityUtils } from '../utils/security';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

export default function ChatScreen() {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { chatId, userName } = route.params || {};
    const { isTurkish } = useTranslation();
    const flatListRef = useRef<FlatList>(null);
    const scrollTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

    const scheduleScrollToEnd = useCallback((animated: boolean) => {
        const timeoutId = setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated });
            scrollTimeoutsRef.current = scrollTimeoutsRef.current.filter((id) => id !== timeoutId);
        }, 100);
        scrollTimeoutsRef.current.push(timeoutId);
    }, []);

    const loadMessages = useCallback(async () => {
        try {
            setLoading(true);
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();

            if (user) {
                setCurrentUserId(user.id);
                const { data, error } = await supabase.getMessages(chatId);
                if (error) throw error;
                if (data) {
                    setMessages(data);
                    scheduleScrollToEnd(false);
                }
            }
        } catch (err) {
            console.error('List messages error:', err);
        } finally {
            setLoading(false);
        }
    }, [chatId, scheduleScrollToEnd]);

    useEffect(() => {
        if (!chatId) return;

        loadMessages();
        const supabase = SupabaseService.getInstance();

        const channel = supabase.subscribeToMessages(chatId, (payload) => {
            setMessages(prev => {
                // Deduplicate: avoid adding a message that already exists
                if (prev.some((m: any) => m.id === payload.new?.id)) return prev;
                return [...prev, payload.new];
            });
            scheduleScrollToEnd(true);
        });

        return () => {
            scrollTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
            scrollTimeoutsRef.current = [];
            if (channel) {
                supabase.getClient().removeChannel(channel);
            }
        };
    }, [chatId, loadMessages, scheduleScrollToEnd]);

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUserId || !chatId) return;

        try {
            const supabase = SupabaseService.getInstance();
            const sanitized = SecurityUtils.sanitizeInput(newMessage.trim());
            const { error } = await supabase.sendMessage(chatId, currentUserId, sanitized);
            if (error) throw error;
            setNewMessage('');
        } catch (err) {
            console.error('Send message error:', err);
            console.warn(isTurkish ? 'Mesaj gönderilemedi.' : 'Failed to send message.');
        }
    };

    const renderMessage = useCallback(({ item }: { item: any }) => {
        const isMe = item.sender_id === currentUserId;

        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
                {!isMe && (
                    <Text style={styles.senderName}>
                        {item.sender?.first_name || 'User'}
                    </Text>
                )}
                <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                    {item.content}
                </Text>
                <Text style={[styles.timeText, isMe && styles.myTimeText]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    }, [currentUserId, styles]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient colors={GRADIENTS.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => safeGoBack(navigation, 'ChatList')}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={isTurkish ? 'Sohbet listesine geri dön' : 'Go back to chat list'}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{userName || (isTurkish ? 'Sohbet' : 'Chat')}</Text>
            </LinearGradient>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={isTurkish ? 'Mesaj yaz...' : 'Type a message...'}
                    placeholderTextColor={colors.textTertiary}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={2000}
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSend}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={isTurkish ? 'Mesajı gönder' : 'Send message'}
                >
                    <Ionicons name="send" size={20} color={colors.textInverse} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: SPACING.md, paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center' },
    backButton: { padding: SPACING.xs, marginRight: SPACING.sm },
    headerTitle: { ...TYPOGRAPHY.h2, color: colors.textInverse },
    listContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
    messageBubble: { maxWidth: '80%', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
    myMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 0 },
    otherMessage: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 0 },
    senderName: { ...TYPOGRAPHY.captionBold, color: colors.primary, marginBottom: 2 },
    messageText: { ...TYPOGRAPHY.body, color: colors.text },
    myMessageText: { color: colors.textInverse },
    timeText: { ...TYPOGRAPHY.small, color: colors.textTertiary, alignSelf: 'flex-end', marginTop: 4, fontSize: 10 },
    myTimeText: { color: colors.textSecondary },
    inputContainer: { flexDirection: 'row', padding: SPACING.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight, alignItems: 'center' },
    input: { flex: 1, backgroundColor: colors.background, borderRadius: BORDER_RADIUS.pill, paddingHorizontal: SPACING.md, paddingTop: Platform.OS === 'ios' ? 12 : 8, paddingBottom: Platform.OS === 'ios' ? 12 : 8, minHeight: 40, maxHeight: 100, ...TYPOGRAPHY.body, color: colors.text, marginRight: SPACING.sm },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },

});
