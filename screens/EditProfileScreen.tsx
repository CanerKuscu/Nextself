import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getLocalDateString } from '../utils/dateUtils';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { SecurityUtils } from '../utils/security';
import { ContentModerationService } from '../services/contentModerationService';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

const EditProfileScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const { showAlert, AlertComponent } = useAlert();
    const existingProfile = route?.params?.profile || {};

    // Split existing full_name into first/last
    const nameParts = (existingProfile.full_name || '').trim().split(/\s+/);
    const [firstName, setFirstName] = useState(existingProfile.first_name || nameParts[0] || '');
    const [lastName, setLastName] = useState(existingProfile.last_name || nameParts.slice(1).join(' ') || '');
    const [username, setUsername] = useState(existingProfile.username || '');
    const [dob, setDob] = useState(existingProfile.dob || '');
    const [height, setHeight] = useState(existingProfile.height?.toString() || '');
    const [weight, setWeight] = useState(existingProfile.weight?.toString() || '');
    const [gender, setGender] = useState(existingProfile.gender || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameError, setUsernameError] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const usernameTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(existingProfile.avatar_url || null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        (async () => {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (user) setCurrentUserId(user.id);
        })();
    }, []);

    const checkUsername = useCallback(async (uname: string) => {
        // Clear previous timer (debounce)
        if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

        const cleaned = uname.toLowerCase().replace(/[^a-z0-9_]/g, '');

        if (cleaned === existingProfile.username) {
            setUsernameAvailable(true);
            setUsernameError('');
            setCheckingUsername(false);
            return;
        }
        if (cleaned.length < 3) {
            setUsernameAvailable(null);
            setUsernameError(cleaned.length > 0 ? (isTurkish ? 'En az 3 karakter' : 'At least 3 characters') : '');
            setCheckingUsername(false);
            return;
        }
        if (!USERNAME_REGEX.test(cleaned)) {
            setUsernameAvailable(false);
            setUsernameError(isTurkish ? 'Sadece harf, rakam ve _ kullanılabilir' : 'Only letters, numbers and _ allowed');
            setCheckingUsername(false);
            return;
        }

        setCheckingUsername(true);
        setUsernameError('');

        usernameTimerRef.current = setTimeout(async () => {
            try {
                const supabase = SupabaseService.getInstance();
                const available = await supabase.checkUsernameAvailability(cleaned, currentUserId || undefined);
                setUsernameAvailable(available);
                if (!available) {
                    setUsernameError(isTurkish ? 'Bu kullanıcı adı alınmış' : 'This username is taken');
                } else {
                    setUsernameError('');
                }
            } catch {
                setUsernameAvailable(null);
            } finally {
                setCheckingUsername(false);
            }
        }, 500);
    }, [existingProfile.username, currentUserId, isTurkish]);

    const handleUsernameChange = (v: string) => {
        const cleaned = v.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(cleaned);
        checkUsername(cleaned);
    };

    const handleSave = async () => {
        if (!firstName.trim()) {
            showAlert({ type: 'warning', title: isTurkish ? 'İsim Gerekli' : 'First Name Required', message: isTurkish ? 'Lütfen adınızı girin.' : 'Please enter your first name.', buttons: [{ text: 'OK' }] });
            return;
        }
        if (!lastName.trim()) {
            showAlert({ type: 'warning', title: isTurkish ? 'Soyisim Gerekli' : 'Last Name Required', message: isTurkish ? 'Lütfen soyadınızı girin.' : 'Please enter your last name.', buttons: [{ text: 'OK' }] });
            return;
        }
        if (username.length > 0 && !USERNAME_REGEX.test(username)) {
            showAlert({ type: 'warning', title: isTurkish ? 'Geçersiz Kullanıcı Adı' : 'Invalid Username', message: isTurkish ? 'Kullanıcı adı 3-20 karakter, harf/rakam/_ olmalı.' : 'Username must be 3-20 chars: letters, numbers, _', buttons: [{ text: 'OK' }] });
            return;
        }
        if (usernameAvailable === false) {
            showAlert({ type: 'error', title: isTurkish ? 'Kullanıcı Adı Alınmış' : 'Username Taken', message: isTurkish ? 'Lütfen farklı bir kullanıcı adı deneyin.' : 'Please try a different username.', buttons: [{ text: 'OK' }] });
            return;
        }

        setSaving(true);
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (user) {
                const fullName = `${SecurityUtils.sanitizeInput(firstName.trim())} ${SecurityUtils.sanitizeInput(lastName.trim())}`;
                const updateData: any = {
                    full_name: fullName,
                    username: username.toLowerCase().trim() || null,
                    dob: dob ? dob.replace(/[^0-9\-\/\.]/g, '') : null,
                    height: height ? parseInt(height) : null,
                    weight: weight ? parseFloat(weight) : null,
                    gender: gender ? SecurityUtils.sanitizeInput(gender) : null,
                };
                const { error } = await supabase.updateUserProfile(user.id, updateData);
                if (error) {
                    // Handle unique constraint violation
                    if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === '23505') {
                        showAlert({ type: 'error', title: isTurkish ? 'Kullanıcı Adı Alınmış' : 'Username Taken', message: isTurkish ? 'Bu kullanıcı adı başka biri tarafından kullanılıyor.' : 'This username is already taken by someone else.', buttons: [{ text: 'OK' }] });
                        setSaving(false);
                        return;
                    }
                    throw error;
                }

                showAlert({
                    type: 'success',
                    title: isTurkish ? 'Kaydedildi!' : 'Saved!',
                    message: isTurkish ? 'Profil bilgileriniz güncellendi.' : 'Your profile has been updated.',
                    buttons: [{
                        text: isTurkish ? 'Tamam' : 'OK',
                        onPress: () => navigation.goBack(),
                    }],
                });
            }
        } catch (err: any) {
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: err.message || (isTurkish ? 'Bir hata oluştu' : 'An error occurred'), buttons: [{ text: 'OK' }] });
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = (val: string) => [styles.input, val.length > 0 && styles.inputFilled];

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <AlertComponent />

            <LinearGradient colors={GRADIENTS.primary as any} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Profil Düzenle' : 'Edit Profile'}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>

                {/* Profile Photo */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Profil Fotoğrafı' : 'Profile Photo'}</Text>
                <GlassCard style={[styles.card, { alignItems: 'center', paddingVertical: SPACING.xl }]}>
                    <TouchableOpacity
                        onPress={async () => {
                            if (uploadingAvatar || !currentUserId) return;
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: true,
                                aspect: [1, 1],
                                quality: 0.8,
                            });
                            if (result.canceled || !result.assets?.[0]?.uri) return;
                            const uri = result.assets[0].uri;

                            setUploadingAvatar(true);
                            try {
                                // NSFW / +18 moderation check
                                const moderation = await ContentModerationService.getInstance().moderateProfileImage(uri);
                                if (!moderation.isApproved) {
                                    // Record violation
                                    const violation = await ContentModerationService.getInstance().recordViolation(
                                        currentUserId,
                                        'nsfw_profile_photo',
                                        moderation.reason,
                                    );
                                    showAlert({
                                        type: 'error',
                                        title: isTurkish ? 'Uygunsuz İçerik' : 'Inappropriate Content',
                                        message: isTurkish
                                            ? `Bu fotoğraf uygunsuz içerik içerdiği için yüklenemez. ${violation.banned ? 'Hesabınız askıya alındı.' : 'Lütfen uygun bir fotoğraf seçin.'}`
                                            : `This photo cannot be uploaded because it contains inappropriate content. ${violation.banned ? 'Your account has been suspended.' : 'Please choose an appropriate photo.'}`,
                                        buttons: [{ text: 'OK' }],
                                    });
                                    return;
                                }

                                // Upload to Supabase Storage
                                const supabase = SupabaseService.getInstance();
                                const { url, error: uploadErr } = await supabase.uploadAvatar(currentUserId, uri);
                                if (uploadErr) throw uploadErr;
                                if (url) setAvatarUrl(url);
                                showAlert({
                                    type: 'success',
                                    title: isTurkish ? 'Fotoğraf Güncellendi' : 'Photo Updated',
                                    message: isTurkish ? 'Profil fotoğrafınız başarıyla güncellendi.' : 'Your profile photo has been updated.',
                                    buttons: [{ text: 'OK' }],
                                });
                            } catch (err: any) {
                                showAlert({
                                    type: 'error',
                                    title: isTurkish ? 'Hata' : 'Error',
                                    message: err.message || (isTurkish ? 'Fotoğraf yüklenirken hata oluştu' : 'Error uploading photo'),
                                    buttons: [{ text: 'OK' }],
                                });
                            } finally {
                                setUploadingAvatar(false);
                            }
                        }}
                        style={styles.avatarContainer}
                        activeOpacity={0.7}
                    >
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={40} color={colors.primary} />
                            </View>
                        )}
                        {uploadingAvatar ? (
                            <View style={styles.avatarOverlay}>
                                <ActivityIndicator color="#fff" size="small" />
                            </View>
                        ) : (
                            <View style={styles.avatarBadge}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.hintText}>
                        {isTurkish ? 'Fotoğraf değiştirmek için dokunun' : 'Tap to change photo'}
                    </Text>
                </GlassCard>

                {/* First Name / Last Name */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Kişisel Bilgiler' : 'Personal Info'}</Text>
                <GlassCard style={styles.card}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>{isTurkish ? 'İsim' : 'First Name'} *</Text>
                            <TextInput style={inputStyle(firstName)} value={firstName} onChangeText={setFirstName}
                                placeholder={isTurkish ? 'Adınız' : 'First name'} placeholderTextColor={colors.textTertiary} />
                        </View>
                        <View style={{ width: SPACING.md }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>{isTurkish ? 'Soyisim' : 'Last Name'} *</Text>
                            <TextInput style={inputStyle(lastName)} value={lastName} onChangeText={setLastName}
                                placeholder={isTurkish ? 'Soyadınız' : 'Last name'} placeholderTextColor={colors.textTertiary} />
                        </View>
                    </View>
                </GlassCard>

                {/* Username */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Kullanıcı Adı' : 'Username'}</Text>
                <GlassCard style={styles.card}>
                    <Text style={styles.label}>{isTurkish ? 'Kullanıcı Adı (benzersiz)' : 'Username (unique)'}</Text>
                    <View style={styles.usernameRow}>
                        <Text style={styles.atSign}>@</Text>
                        <TextInput
                            style={[styles.input, styles.usernameInput, usernameAvailable === false && styles.inputError, usernameAvailable === true && styles.inputSuccess]}
                            value={username}
                            onChangeText={handleUsernameChange}
                            placeholder="username"
                            placeholderTextColor={colors.textTertiary}
                            autoCapitalize="none"
                            autoCorrect={false}
                            maxLength={20}
                        />
                        {checkingUsername && <Ionicons name="hourglass-outline" size={20} color={colors.textTertiary} />}
                        {!checkingUsername && usernameAvailable === true && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
                        {!checkingUsername && usernameAvailable === false && <Ionicons name="close-circle" size={22} color={colors.error} />}
                    </View>
                    {usernameError ? (
                        <Text style={styles.errorText}>{usernameError}</Text>
                    ) : username.length > 0 && usernameAvailable === true ? (
                        <Text style={styles.successText}>{isTurkish ? 'Bu kullanıcı adı uygun!' : 'This username is available!'}</Text>
                    ) : null}
                    <Text style={styles.hintText}>{isTurkish ? 'Sadece küçük harf, rakam ve _ kullanılabilir' : 'Only lowercase letters, numbers and _ allowed'}</Text>
                </GlassCard>

                {/* Body Measurements */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Vücut Ölçüleri' : 'Body Measurements'}</Text>
                <GlassCard style={styles.card}>
                    <Text style={styles.label}>{isTurkish ? 'Doğum Tarihi (YYYY-MM-DD)' : 'Date of Birth (YYYY-MM-DD)'}</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.9}>
                        <View pointerEvents="none">
                            <TextInput style={inputStyle(dob)} value={dob} onChangeText={setDob}
                                placeholder="1995-06-15" placeholderTextColor={colors.textTertiary} keyboardType="numeric" editable={false} />
                        </View>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(Platform.OS === 'ios');
                                if (selectedDate) {
                                    setDob(getLocalDateString(selectedDate));
                                }
                            }}
                        />
                    )}

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { marginTop: SPACING.md }]}>{isTurkish ? 'Boy (cm)' : 'Height (cm)'}</Text>
                            <TextInput style={inputStyle(height)} value={height} onChangeText={setHeight}
                                placeholder="175" placeholderTextColor={colors.textTertiary} keyboardType="numeric" />
                        </View>
                        <View style={{ width: SPACING.md }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { marginTop: SPACING.md }]}>{isTurkish ? 'Kilo (kg)' : 'Weight (kg)'}</Text>
                            <TextInput style={inputStyle(weight)} value={weight} onChangeText={setWeight}
                                placeholder="70" placeholderTextColor={colors.textTertiary} keyboardType="numeric" />
                        </View>
                    </View>
                </GlassCard>

                {/* Gender */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Cinsiyet' : 'Gender'}</Text>
                <GlassCard style={styles.card}>
                    <View style={styles.genderRow}>
                        {[
                            { val: 'male', labelTr: 'Erkek', labelEn: 'Male' },
                            { val: 'female', labelTr: 'Kadın', labelEn: 'Female' },
                            { val: 'other', labelTr: 'Diğer', labelEn: 'Other' },
                        ].map(g => (
                            <TouchableOpacity
                                key={g.val}
                                style={[styles.genderBtn, gender === g.val && styles.genderBtnActive]}
                                onPress={() => setGender(g.val)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.genderText, gender === g.val && styles.genderTextActive]}>
                                    {isTurkish ? g.labelTr : g.labelEn}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </GlassCard>

                <GradientButton
                    title={saving ? (isTurkish ? 'Kaydediliyor...' : 'Saving...') : (isTurkish ? 'Değişiklikleri Kaydet' : 'Save Changes')}
                    onPress={handleSave}
                    size="lg"
                    style={{ marginTop: SPACING.xxl }}
                />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { ...TYPOGRAPHY.h2, color: '#fff', flex: 1, textAlign: 'center' },
    content: { paddingHorizontal: SPACING.lg },
    sectionTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginTop: SPACING.xxl, marginBottom: SPACING.md },
    card: { gap: SPACING.xs },
    label: { ...TYPOGRAPHY.captionBold, color: colors.textSecondary, marginBottom: 6 },
    input: { backgroundColor: colors.surfaceSecondary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, ...TYPOGRAPHY.body, color: colors.text, borderWidth: 1.5, borderColor: 'transparent' },
    inputFilled: { borderColor: colors.primary + '40' },
    inputError: { borderColor: colors.error },
    inputSuccess: { borderColor: colors.success },
    usernameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    atSign: { ...TYPOGRAPHY.h3, color: colors.textSecondary },
    usernameInput: { flex: 1 },
    errorText: { ...TYPOGRAPHY.small, color: colors.error, marginTop: 4 },
    successText: { ...TYPOGRAPHY.small, color: colors.success, marginTop: 4 },
    hintText: { ...TYPOGRAPHY.small, color: colors.textTertiary, marginTop: 4 },
    row: { flexDirection: 'row' },
    genderRow: { flexDirection: 'row', gap: SPACING.sm },
    genderBtn: { flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.surfaceSecondary, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    genderBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    genderText: { ...TYPOGRAPHY.captionBold, color: colors.textSecondary },
    genderTextActive: { color: colors.primary },
    avatarContainer: { position: 'relative', marginBottom: SPACING.sm },
    avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.primary },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primarySoft || '#E8FFE0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.primary },
    avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 45, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
});

export default EditProfileScreen;
