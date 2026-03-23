import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import GlassCard from '../components/GlassCard';
import { GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

export default function ChatListScreen() {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);
    const insets = useSafeAreaInsets();

    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const navigation = useNavigation<any>();
    const { isTurkish } = useTranslation();

    const getProfessionalLabel = (professionalType?: string) => {
        if (!professionalType) return '';
        const normalized = professionalType.toLowerCase();
        const isPT = normalized === 'trainer' || normalized === 'pt';
        if (isTurkish) {
            return isPT ? 'Antrenör' : 'Diyetisyen';
        }
        return isPT ? 'Trainer' : 'Dietitian';
    };

    useEffect(() => {
        loadChats();
    }, []);

    const loadChats = async () => {
        try {
            setLoading(true);
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();

            if (user) {
                setCurrentUserId(user.id);
                const { data, error } = await supabase.getChats(user.id);
                if (error) throw error;

                if (data) {
                    // Flatten structure
                    const formattedChats = data.map((item: any) => {
                        const chatObj = item.chats;
                        // Find the *other* participant
                        const otherParticipant = chatObj.chat_participants.find(
                            (p: any) => p.user_id !== user.id
                        )?.users;

                        return {
                            id: item.chat_id,
                            updatedAt: chatObj.updated_at,
                            lastMessageAt: chatObj.last_message_at,
                            otherUser: otherParticipant || { first_name: 'Unknown', last_name: 'User' }
                        };
                    });
                    setChats(formattedChats);
                }
            }
        } catch (err) {
            console.error('List chats error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderChatItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => navigation.navigate('Chat', { chatId: item.id, userName: `${item.otherUser.first_name} ${item.otherUser.last_name}` })}>
            <GlassCard style={styles.chatCard}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>
                        {item.otherUser.first_name} {item.otherUser.last_name}
                    </Text>
                    {item.otherUser.professional_type && (
                        <Text style={styles.chatType}>
                            {getProfessionalLabel(item.otherUser.professional_type)}
                        </Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </GlassCard>
        </TouchableOpacity>
    ), [navigation, styles]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient colors={GRADIENTS.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => safeGoBack(navigation, 'Main')}>
                    <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Mesajlar' : 'Messages'}</Text>
            </LinearGradient>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderChatItem}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    // Optimize FlatList performance with windowing and batching
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    updateCellsBatchingPeriod={50}
                    getItemLayout={(data, index) => ({
                        length: 80, // Estimated chat card height
                        offset: 80 * index,
                        index,
                    })}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: SPACING.xxl }}>
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
                            <Text style={{ ...TYPOGRAPHY.body, color: colors.textTertiary, marginTop: SPACING.md }}>
                                {isTurkish ? 'Henüz mesajınız yok.' : 'No messages yet.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: SPACING.lg, paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backButton: { padding: SPACING.xs, marginRight: SPACING.sm },
    headerTitle: { ...TYPOGRAPHY.h2, color: colors.textInverse },
    listContent: { padding: SPACING.md },
    chatCard: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, padding: SPACING.md },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    chatInfo: { flex: 1, marginLeft: SPACING.md },
    chatName: { ...TYPOGRAPHY.bodyBold, color: colors.text },
    chatType: { ...TYPOGRAPHY.small, color: colors.primary, marginTop: 2 },
});
