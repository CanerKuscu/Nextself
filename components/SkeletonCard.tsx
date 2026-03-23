import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonCardProps {
  style?: ViewStyle;
  height?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ style, height = 200 }) => {
  const { isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          height,
          backgroundColor,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    width: '100%',
  },
});

export default SkeletonCard;
