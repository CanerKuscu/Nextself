import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { safeGoBack } from '../utils/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

const QRInviteScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(false);
    const [price, setPrice] = useState('');
    const [months, setMonths] = useState('3');
    const [serviceType, setServiceType] = useState<'online' | 'face_to_face' | 'hybrid'>('online');
    const [qrValue, setQrValue] = useState('');

    const generate = async () => {
        if (!price || Number(price) <= 0) return;
        setLoading(true);
        try {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (!user) return;
            const payload = {
                type: 'professional_invite',
                professional_user_id: user.id,
                service_type: serviceType,
                agreed_price: Number(price),
                duration_months: Number(months || 1),
                issued_at: new Date().toISOString(),
            };
            setQrValue(JSON.stringify(payload));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + SPACING.xs }]}>
            <View style={styles.header}>
                <TouchableOpacity style={[styles.back, { backgroundColor: colors.surface }]} onPress={() => safeGoBack(navigation, 'ProfessionalHome')}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'QR ile Üye Davet' : 'Invite Member via QR'}</Text>
                <View style={styles.back} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Hizmet Tipi' : 'Service Type'}</Text>
                <View style={styles.row}>
                    {(['online', 'face_to_face', 'hybrid'] as const).map((item) => {
                        const active = serviceType === item;
                        return (
                            <TouchableOpacity
                                key={item}
                                style={[styles.chip, { backgroundColor: active ? colors.primary : colors.background }]}
                                onPress={() => setServiceType(item)}
                            >
                                <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                                    {item === 'online' ? (isTurkish ? 'Online' : 'Online') : item === 'face_to_face' ? (isTurkish ? 'Yüz yüze' : 'In person') : (isTurkish ? 'Hibrit' : 'Hybrid')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Paket Fiyatı (₺)' : 'Package Price (₺)'}</Text>
                <TextInput
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    style={[styles.input, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.background }]}
                    placeholder="6000"
                    placeholderTextColor={colors.textTertiary}
                />

                <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Süre (Ay)' : 'Duration (Months)'}</Text>
                <TextInput
                    value={months}
                    onChangeText={setMonths}
                    keyboardType="numeric"
                    style={[styles.input, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.background }]}
                    placeholder="3"
                    placeholderTextColor={colors.textTertiary}
                />

                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={generate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isTurkish ? 'QR Oluştur' : 'Generate QR'}</Text>}
                </TouchableOpacity>
            </View>

            {qrValue ? (
                <View style={[styles.qrCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.qrTitle, { color: colors.text }]}>{isTurkish ? 'Üyenin bu kodu okutması yeterli' : 'Let member scan this code'}</Text>
                    <View style={styles.qrBox}>
                        <QRCode value={qrValue} size={220} />
                    </View>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    back: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        flex: 1,
        textAlign: 'center',
        paddingHorizontal: SPACING.xs,
    },
    card: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: SPACING.xs,
        ...SHADOWS.sm,
    },
    label: {
        ...TYPOGRAPHY.captionBold,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    chip: {
        borderRadius: BORDER_RADIUS.pill,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    chipText: {
        ...TYPOGRAPHY.caption,
    },
    input: {
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.sm,
        ...TYPOGRAPHY.body,
    },
    button: {
        marginTop: SPACING.xs,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    buttonText: {
        ...TYPOGRAPHY.bodyBold,
        color: '#fff',
    },
    qrCard: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    qrTitle: {
        ...TYPOGRAPHY.bodyBold,
        marginBottom: SPACING.xs,
    },
    qrBox: {
        backgroundColor: '#fff',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
    },
});

export default QRInviteScreen;
