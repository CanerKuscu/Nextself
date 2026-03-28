import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAlert } from '../components/CustomAlert';
import { RatingService } from '../services/ratingService';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import { useAuthStore } from '../store/authStoreSecure';

const RatingScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { professionalId, professionalName, professionalType } = route?.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { isTurkish } = useTranslation();
  const { showAlert, AlertComponent } = useAlert();
  const user = useAuthStore((state) => state.user);

  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert({ type: 'warning', title: isTurkish ? 'Uyarı' : 'Warning', message: isTurkish ? 'Lütfen puan verin' : 'Please give a rating', buttons: [{ text: 'OK' }] });
      return;
    }
    setLoading(true);
    try {
      const userId = user?.id;
      if (!userId) {
        setLoading(false);
        showAlert({ type: 'warning', title: isTurkish ? 'Oturum açın' : 'Sign in', message: isTurkish ? 'Lütfen puan vermek için giriş yapın.' : 'Please sign in to submit a rating.', buttons: [{ text: 'OK' }] });
        return;
      }

      const ratingService = RatingService.getInstance();
      await ratingService.createRating({
        userId,
        professionalId,
        professionalType: professionalType || 'trainer',
        rating,
        review: comment,
        verified: false,
        helpfulCount: 0,
      });
      setLoading(false);
      showAlert({
        type: 'success',
        title: isTurkish ? 'Teşekkürler' : 'Thank You',
        message: isTurkish ? 'Değerlendirmeniz kaydedildi!' : 'Your review has been saved!',
        buttons: [{ text: 'OK', onPress: () => safeGoBack(navigation, 'Home') }],
      });
    } catch (err) {
      setLoading(false);
      showAlert({
        type: 'error',
        title: isTurkish ? 'Hata' : 'Error',
        message: isTurkish ? 'Değerlendirme gönderilemedi. Lütfen tekrar deneyin.' : 'Failed to submit rating. Please try again.',
        buttons: [{ text: 'OK' }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <AlertComponent />
      <LinearGradient colors={GRADIENTS.accent as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <Text style={styles.headerTitle}>{isTurkish ? 'Değerlendir' : 'Rate'}</Text>
        <Text style={styles.headerSub}>{professionalName || ''}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <GlassCard elevated style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>{isTurkish ? 'Puanınız' : 'Your Rating'}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.6}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color={star <= rating ? colors.accent : colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingValue}>{rating > 0 ? `${rating}/5` : ''}</Text>
        </GlassCard>

        <Text style={styles.label}>{isTurkish ? 'Yorum (opsiyonel)' : 'Comment (optional)'}</Text>
        <TextInput
          style={styles.commentInput}
          placeholder={isTurkish ? 'Deneyiminizi paylaşın...' : 'Share your experience...'}
          placeholderTextColor={colors.textTertiary}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <GradientButton
          title={isTurkish ? 'Gönder' : 'Submit'}
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          gradient={GRADIENTS.accent}
          style={{ marginTop: SPACING.xxl }}
        />
      </View>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingBottom: SPACING.xxl, paddingHorizontal: SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { ...TYPOGRAPHY.h1, color: colors.textInverse },
  headerSub: { ...TYPOGRAPHY.body, color: 'rgba(255,255,255,0.8)', marginTop: SPACING.xs },
  content: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.xxl },
  ratingCard: { alignItems: 'center', paddingVertical: SPACING.xxl },
  ratingLabel: { ...TYPOGRAPHY.h3, color: colors.text, marginBottom: SPACING.lg },
  starsRow: { flexDirection: 'row', gap: SPACING.sm },
  ratingValue: { ...TYPOGRAPHY.h2, color: colors.accent, marginTop: SPACING.md },
  label: { ...TYPOGRAPHY.bodyBold, color: colors.text, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  commentInput: {
    ...TYPOGRAPHY.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    minHeight: 100,
  },
});

export default RatingScreen;
