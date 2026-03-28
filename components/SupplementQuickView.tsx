import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTranslation } from '../hooks/useTranslation';
import GlassCard from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SupplementQuickViewProps {
  visible: boolean;
  item: any;
  onClose: () => void;
  onToggleReminder?: (item: any) => void;
  isScheduled?: boolean;
}

const SupplementQuickView: React.FC<SupplementQuickViewProps> = ({
  visible,
  item,
  onClose,
  onToggleReminder,
  isScheduled = false,
}) => {
  const { t, isTurkish } = useTranslation();
  const { colors, isDark } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      slideAnim.setValue(100);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  if (!visible || !item) return null;

  const getCategoryToken = (category: string) => {
    switch (category) {
      case 'protein': return { color: colors.error, soft: colors.errorSoft };
      case 'pre_workout': return { color: colors.warning, soft: colors.warningSoft };
      case 'post_workout': return { color: colors.primary, soft: colors.primarySoft };
      case 'vitamin': return { color: colors.orange, soft: colors.warningSoft };
      case 'mineral': return { color: colors.accent, soft: colors.infoSoft };
      default: return { color: colors.secondary, soft: colors.secondarySoft };
    }
  };

  const categoryToken = getCategoryToken(item.category || item.type);
  const categoryColor = categoryToken.color;
  const categorySoft = categoryToken.soft;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <GlassCard
            variant="premium"
            noPadding
            style={[styles.card, { borderColor: categorySoft || colors.border }]}
            gradientColors={isDark
              ? [colors.surface, colors.surfaceSecondary]
              : [colors.cardGlass, colors.surfaceSecondary]}
          >
            {/* Header with Icon */}
            <LinearGradient
              colors={[categorySoft || categoryColor, 'transparent']}
              style={styles.headerGradient}
            >
              <View style={[styles.iconContainer, { backgroundColor: categorySoft || categoryColor }]}>
                <Ionicons name="flask" size={32} color={categoryColor} />
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView
              style={styles.contentScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.brand, { color: categoryColor }]}>
                {item.brand || item.type || 'Generic'} • {item.dosage} {item.unit}
              </Text>

              {/* Benefits Tags */}
              {item.benefits && item.benefits.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {t('benefits')}
                  </Text>
                  <View style={styles.tagsContainer}>
                    {item.benefits.map((benefit: string, index: number) => (
                      <View
                        key={index}
                        style={[styles.tag, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}
                      >
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginRight: 4 }} />
                        <Text style={[styles.tagText, { color: colors.success }]}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Description/Details */}
              {item.description && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {isTurkish ? 'Detaylar' : 'Details'}
                  </Text>
                  <Text style={[styles.description, { color: colors.text }]}>
                    {item.description}
                  </Text>
                </View>
              )}

              {/* Side Effects & Warnings */}
              {(item.side_effects?.length > 0 || item.warnings?.length > 0) && (
                <View style={styles.section}>
                  <View style={[styles.warningBox, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
                    <Ionicons name="warning" size={20} color={colors.warning} style={{ marginBottom: 8 }} />
                    {item.side_effects?.length > 0 && (
                      <Text style={[styles.warningText, { color: colors.warning }]}>
                        <Text style={{ fontWeight: 'bold' }}>{t('sideEffects')}: </Text>
                        {item.side_effects.join(', ')}
                      </Text>
                    )}
                    {item.warnings?.length > 0 && (
                      <Text style={[styles.warningText, { color: colors.warning, marginTop: 4 }]}>
                        <Text style={{ fontWeight: 'bold' }}>Warning: </Text>
                        {item.warnings.join(' • ')}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer Action */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: isScheduled ? colors.surfaceElevated : categoryColor }
                ]}
                onPress={() => onToggleReminder?.(item)}
              >
                <Ionicons
                  name={isScheduled ? "notifications-off" : "notifications"}
                  size={20}
                  color={isScheduled ? colors.textSecondary : (isDark ? colors.text : colors.textInverse)}
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: isScheduled ? colors.textSecondary : (isDark ? colors.text : colors.textInverse) }
                ]}>
                  {isScheduled
                    ? (isTurkish ? 'Hatırlatıcıyı Kaldır' : 'Remove Reminder')
                    : (isTurkish ? 'Hatırlatıcı Ekle' : 'Add Reminder')}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    height: '100%',
  },
  headerGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.circle,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  brand: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  description: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
  warningBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  warningText: {
    ...TYPOGRAPHY.caption,
    lineHeight: 18,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
  },
  actionButtonText: {
    ...TYPOGRAPHY.button,
    fontWeight: '700',
  },
});

export default SupplementQuickView;
