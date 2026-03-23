"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_2 = require("react-native");
const datetimepicker_1 = __importDefault(require("@react-native-community/datetimepicker"));
const dateUtils_1 = require("../utils/dateUtils");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const GradientButton_1 = __importDefault(require("../components/GradientButton"));
const CustomAlert_1 = require("../components/CustomAlert");
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const security_1 = require("../utils/security");
const contentModerationService_1 = require("../services/contentModerationService");
const ImagePicker = __importStar(require("expo-image-picker"));
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const EditProfileScreen = ({ navigation, route }) => {
    var _a, _b, _c;
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const existingProfile = ((_a = route === null || route === void 0 ? void 0 : route.params) === null || _a === void 0 ? void 0 : _a.profile) || {};
    // Split existing full_name into first/last
    const nameParts = (existingProfile.full_name || '').trim().split(/\s+/);
    const [firstName, setFirstName] = (0, react_1.useState)(existingProfile.first_name || nameParts[0] || '');
    const [lastName, setLastName] = (0, react_1.useState)(existingProfile.last_name || nameParts.slice(1).join(' ') || '');
    const [username, setUsername] = (0, react_1.useState)(existingProfile.username || '');
    const [dob, setDob] = (0, react_1.useState)(existingProfile.dob || existingProfile.date_of_birth || '');
    const [height, setHeight] = (0, react_1.useState)(((_b = existingProfile.height) === null || _b === void 0 ? void 0 : _b.toString()) || '');
    const [weight, setWeight] = (0, react_1.useState)(((_c = existingProfile.weight) === null || _c === void 0 ? void 0 : _c.toString()) || '');
    const [gender, setGender] = (0, react_1.useState)(existingProfile.gender || '');
    const [showDatePicker, setShowDatePicker] = (0, react_1.useState)(false);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [usernameAvailable, setUsernameAvailable] = (0, react_1.useState)(null);
    const [usernameError, setUsernameError] = (0, react_1.useState)('');
    const [currentUserId, setCurrentUserId] = (0, react_1.useState)(null);
    const usernameTimerRef = (0, react_1.useRef)(null);
    const [checkingUsername, setCheckingUsername] = (0, react_1.useState)(false);
    const [avatarUrl, setAvatarUrl] = (0, react_1.useState)(existingProfile.avatar_url || null);
    const [uploadingAvatar, setUploadingAvatar] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        (() => __awaiter(void 0, void 0, void 0, function* () {
            const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
            if (user)
                setCurrentUserId(user.id);
        }))();
    }, []);
    const checkUsername = (0, react_1.useCallback)((uname) => __awaiter(void 0, void 0, void 0, function* () {
        // Clear previous timer (debounce)
        if (usernameTimerRef.current)
            clearTimeout(usernameTimerRef.current);
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
        usernameTimerRef.current = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance();
                const available = yield supabase.checkUsernameAvailability(cleaned, currentUserId || undefined);
                setUsernameAvailable(available);
                if (!available) {
                    setUsernameError(isTurkish ? 'Bu kullanıcı adı alınmış' : 'This username is taken');
                }
                else {
                    setUsernameError('');
                }
            }
            catch (_a) {
                setUsernameAvailable(null);
            }
            finally {
                setCheckingUsername(false);
            }
        }), 500);
    }), [existingProfile.username, currentUserId, isTurkish]);
    const handleUsernameChange = (v) => {
        const cleaned = v.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(cleaned);
        checkUsername(cleaned);
    };
    const handleSave = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
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
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                const safeFirstName = security_1.SecurityUtils.sanitizeInput(firstName.trim());
                const safeLastName = security_1.SecurityUtils.sanitizeInput(lastName.trim());
                const fullName = `${safeFirstName} ${safeLastName}`;
                const updateData = {
                    full_name: fullName,
                    first_name: safeFirstName,
                    last_name: safeLastName,
                    username: username.toLowerCase().trim() || null,
                    dob: dob ? dob.replace(/[^0-9\-\/\.]/g, '') : null,
                    height: height ? parseInt(height) : null,
                    weight: weight ? parseFloat(weight) : null,
                    gender: gender ? security_1.SecurityUtils.sanitizeInput(gender) : null,
                };
                const { error } = yield supabase.updateUserProfile(user.id, updateData);
                if (error) {
                    // Handle unique constraint violation
                    if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('unique')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('duplicate')) || error.code === '23505') {
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
        }
        catch (err) {
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: err.message || (isTurkish ? 'Bir hata oluştu' : 'An error occurred'), buttons: [{ text: 'OK' }] });
        }
        finally {
            setSaving(false);
        }
    });
    const inputStyle = (val) => [styles.input, val.length > 0 && styles.inputFilled];
    return (<react_native_1.View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <AlertComponent />

            <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Profile')} style={styles.backBtn}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color="#fff"/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Profil Düzenle' : 'Edit Profile'}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </expo_linear_gradient_1.LinearGradient>

            <react_native_1.ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>

                {/* Profile Photo */}
                <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Profil Fotoğrafı' : 'Profile Photo'}</react_native_1.Text>
                <GlassCard_1.default style={[styles.card, { alignItems: 'center', paddingVertical: theme_1.SPACING.xl }]}>
                    <react_native_1.TouchableOpacity onPress={() => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            if (uploadingAvatar || !currentUserId)
                return;
            const result = yield ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (result.canceled || !((_b = (_a = result.assets) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri))
                return;
            const uri = result.assets[0].uri;
            setUploadingAvatar(true);
            try {
                // NSFW / +18 moderation check
                const moderation = yield contentModerationService_1.ContentModerationService.getInstance().moderateProfileImage(uri);
                if (!moderation.isApproved) {
                    // Record violation
                    const violation = yield contentModerationService_1.ContentModerationService.getInstance().recordViolation(currentUserId, 'nsfw_profile_photo', moderation.reason);
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
                const supabase = supabase_1.SupabaseService.getInstance();
                const { url, error: uploadErr } = yield supabase.uploadAvatar(currentUserId, uri);
                if (uploadErr)
                    throw uploadErr;
                if (url)
                    setAvatarUrl(url);
                showAlert({
                    type: 'success',
                    title: isTurkish ? 'Fotoğraf Güncellendi' : 'Photo Updated',
                    message: isTurkish ? 'Profil fotoğrafınız başarıyla güncellendi.' : 'Your profile photo has been updated.',
                    buttons: [{ text: 'OK' }],
                });
            }
            catch (err) {
                showAlert({
                    type: 'error',
                    title: isTurkish ? 'Hata' : 'Error',
                    message: err.message || (isTurkish ? 'Fotoğraf yüklenirken hata oluştu' : 'Error uploading photo'),
                    buttons: [{ text: 'OK' }],
                });
            }
            finally {
                setUploadingAvatar(false);
            }
        })} style={styles.avatarContainer} activeOpacity={0.7}>
                        {avatarUrl ? (<react_native_1.Image source={{ uri: avatarUrl }} style={styles.avatarImage}/>) : (<react_native_1.View style={styles.avatarPlaceholder}>
                                <vector_icons_1.Ionicons name="person" size={40} color={colors.primary}/>
                            </react_native_1.View>)}
                        {uploadingAvatar ? (<react_native_1.View style={styles.avatarOverlay}>
                                <react_native_1.ActivityIndicator color="#fff" size="small"/>
                            </react_native_1.View>) : (<react_native_1.View style={styles.avatarBadge}>
                                <vector_icons_1.Ionicons name="camera" size={14} color="#fff"/>
                            </react_native_1.View>)}
                    </react_native_1.TouchableOpacity>
                    <react_native_1.Text style={styles.hintText}>
                        {isTurkish ? 'Fotoğraf değiştirmek için dokunun' : 'Tap to change photo'}
                    </react_native_1.Text>
                </GlassCard_1.default>

                {/* First Name / Last Name */}
                <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Kişisel Bilgiler' : 'Personal Info'}</react_native_1.Text>
                <GlassCard_1.default style={styles.card}>
                    <react_native_1.View style={styles.row}>
                        <react_native_1.View style={{ flex: 1 }}>
                            <react_native_1.Text style={styles.label}>{isTurkish ? 'İsim' : 'First Name'} *</react_native_1.Text>
                            <react_native_1.TextInput style={inputStyle(firstName)} value={firstName} onChangeText={setFirstName} placeholder={isTurkish ? 'Adınız' : 'First name'} placeholderTextColor={colors.textTertiary}/>
                        </react_native_1.View>
                        <react_native_1.View style={{ width: theme_1.SPACING.md }}/>
                        <react_native_1.View style={{ flex: 1 }}>
                            <react_native_1.Text style={styles.label}>{isTurkish ? 'Soyisim' : 'Last Name'} *</react_native_1.Text>
                            <react_native_1.TextInput style={inputStyle(lastName)} value={lastName} onChangeText={setLastName} placeholder={isTurkish ? 'Soyadınız' : 'Last name'} placeholderTextColor={colors.textTertiary}/>
                        </react_native_1.View>
                    </react_native_1.View>
                </GlassCard_1.default>

                {/* Username */}
                <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Kullanıcı Adı' : 'Username'}</react_native_1.Text>
                <GlassCard_1.default style={styles.card}>
                    <react_native_1.Text style={styles.label}>{isTurkish ? 'Kullanıcı Adı (benzersiz)' : 'Username (unique)'}</react_native_1.Text>
                    <react_native_1.View style={styles.usernameRow}>
                        <react_native_1.Text style={styles.atSign}>@</react_native_1.Text>
                        <react_native_1.TextInput style={[styles.input, styles.usernameInput, usernameAvailable === false && styles.inputError, usernameAvailable === true && styles.inputSuccess]} value={username} onChangeText={handleUsernameChange} placeholder="username" placeholderTextColor={colors.textTertiary} autoCapitalize="none" autoCorrect={false} maxLength={20}/>
                        {checkingUsername && <vector_icons_1.Ionicons name="hourglass-outline" size={20} color={colors.textTertiary}/>}
                        {!checkingUsername && usernameAvailable === true && <vector_icons_1.Ionicons name="checkmark-circle" size={22} color={colors.success}/>}
                        {!checkingUsername && usernameAvailable === false && <vector_icons_1.Ionicons name="close-circle" size={22} color={colors.error}/>}
                    </react_native_1.View>
                    {usernameError ? (<react_native_1.Text style={styles.errorText}>{usernameError}</react_native_1.Text>) : username.length > 0 && usernameAvailable === true ? (<react_native_1.Text style={styles.successText}>{isTurkish ? 'Bu kullanıcı adı uygun!' : 'This username is available!'}</react_native_1.Text>) : null}
                    <react_native_1.Text style={styles.hintText}>{isTurkish ? 'Sadece küçük harf, rakam ve _ kullanılabilir' : 'Only lowercase letters, numbers and _ allowed'}</react_native_1.Text>
                </GlassCard_1.default>

                {/* Body Measurements */}
                <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Vücut Ölçüleri' : 'Body Measurements'}</react_native_1.Text>
                <GlassCard_1.default style={styles.card}>
                    <react_native_1.Text style={styles.label}>{isTurkish ? 'Doğum Tarihi (YYYY-MM-DD)' : 'Date of Birth (YYYY-MM-DD)'}</react_native_1.Text>
                    <react_native_1.TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.9}>
                        <react_native_1.View pointerEvents="none">
                            <react_native_1.TextInput style={inputStyle(dob)} value={dob} onChangeText={setDob} placeholder="1995-06-15" placeholderTextColor={colors.textTertiary} keyboardType="numeric" editable={false}/>
                        </react_native_1.View>
                    </react_native_1.TouchableOpacity>
                    {showDatePicker && (<datetimepicker_1.default value={dob ? new Date(dob) : new Date(2000, 0, 1)} mode="date" display="default" maximumDate={new Date()} onChange={(event, selectedDate) => {
                setShowDatePicker(react_native_2.Platform.OS === 'ios');
                if (selectedDate) {
                    setDob((0, dateUtils_1.getLocalDateString)(selectedDate));
                }
            }}/>)}

                    <react_native_1.View style={styles.row}>
                        <react_native_1.View style={{ flex: 1 }}>
                            <react_native_1.Text style={[styles.label, { marginTop: theme_1.SPACING.md }]}>{isTurkish ? 'Boy (cm)' : 'Height (cm)'}</react_native_1.Text>
                            <react_native_1.TextInput style={inputStyle(height)} value={height} onChangeText={setHeight} placeholder="175" placeholderTextColor={colors.textTertiary} keyboardType="numeric"/>
                        </react_native_1.View>
                        <react_native_1.View style={{ width: theme_1.SPACING.md }}/>
                        <react_native_1.View style={{ flex: 1 }}>
                            <react_native_1.Text style={[styles.label, { marginTop: theme_1.SPACING.md }]}>{isTurkish ? 'Kilo (kg)' : 'Weight (kg)'}</react_native_1.Text>
                            <react_native_1.TextInput style={inputStyle(weight)} value={weight} onChangeText={setWeight} placeholder="70" placeholderTextColor={colors.textTertiary} keyboardType="numeric"/>
                        </react_native_1.View>
                    </react_native_1.View>
                </GlassCard_1.default>

                {/* Gender */}
                <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Cinsiyet' : 'Gender'}</react_native_1.Text>
                <GlassCard_1.default style={styles.card}>
                    <react_native_1.View style={styles.genderRow}>
                        {[
            { val: 'male', labelTr: 'Erkek', labelEn: 'Male' },
            { val: 'female', labelTr: 'Kadın', labelEn: 'Female' },
            { val: 'other', labelTr: 'Diğer', labelEn: 'Other' },
        ].map(g => (<react_native_1.TouchableOpacity key={g.val} style={[styles.genderBtn, gender === g.val && styles.genderBtnActive]} onPress={() => setGender(g.val)} activeOpacity={0.7}>
                                <react_native_1.Text style={[styles.genderText, gender === g.val && styles.genderTextActive]}>
                                    {isTurkish ? g.labelTr : g.labelEn}
                                </react_native_1.Text>
                            </react_native_1.TouchableOpacity>))}
                    </react_native_1.View>
                </GlassCard_1.default>

                <GradientButton_1.default title={saving ? (isTurkish ? 'Kaydediliyor...' : 'Saving...') : (isTurkish ? 'Değişiklikleri Kaydet' : 'Save Changes')} onPress={handleSave} size="lg" style={{ marginTop: theme_1.SPACING.xxl }}/>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: theme_1.SPACING.xl, paddingHorizontal: theme_1.SPACING.lg },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: '#fff', flex: 1, textAlign: 'center' }),
    content: { paddingHorizontal: theme_1.SPACING.lg },
    sectionTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, marginTop: theme_1.SPACING.xl, marginBottom: theme_1.SPACING.md }),
    card: { gap: theme_1.SPACING.xs },
    label: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.textSecondary, marginBottom: 6 }),
    input: Object.assign(Object.assign({ backgroundColor: colors.surfaceSecondary, borderRadius: theme_1.BORDER_RADIUS.md, paddingHorizontal: theme_1.SPACING.md, paddingVertical: theme_1.SPACING.sm + 2 }, theme_1.TYPOGRAPHY.body), { color: colors.text, borderWidth: 1.5, borderColor: 'transparent', textAlignVertical: 'center' }),
    inputFilled: { borderColor: colors.primary + '40' },
    inputError: { borderColor: colors.error },
    inputSuccess: { borderColor: colors.success },
    usernameRow: { flexDirection: 'row', alignItems: 'center', gap: theme_1.SPACING.sm },
    atSign: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.textSecondary }),
    usernameInput: { flex: 1 },
    errorText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.error, marginTop: 4 }),
    successText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.success, marginTop: 4 }),
    hintText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginTop: 4 }),
    row: { flexDirection: 'row' },
    genderRow: { flexDirection: 'row', gap: theme_1.SPACING.sm },
    genderBtn: { flex: 1, paddingVertical: theme_1.SPACING.sm, borderRadius: theme_1.BORDER_RADIUS.md, backgroundColor: colors.surfaceSecondary, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    genderBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    genderText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.textSecondary }),
    genderTextActive: { color: colors.primary },
    avatarContainer: { position: 'relative', marginBottom: theme_1.SPACING.sm },
    avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.primary },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primarySoft || '#E8FFE0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.primary },
    avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 45, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
});
exports.default = EditProfileScreen;
