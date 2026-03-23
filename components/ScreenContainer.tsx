import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../config/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle; // For inner content if needed
  backgroundColor?: string;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  statusBarStyle?: 'light' | 'dark' | 'auto';
}

/**
 * A wrapper component that enforces safe area boundaries.
 * Use this as the root component for all screens to ensure content
 * doesn't overlap with system UI (notch, home indicator, status bar).
 */
const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  backgroundColor,
  edges = ['top', 'left', 'right'], // Default edges to protect
  statusBarStyle = 'auto',
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: backgroundColor || colors.background,
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  // Determine status bar style
  const barStyle = statusBarStyle === 'auto' 
    ? (isDark ? 'light-content' : 'dark-content') 
    : (statusBarStyle === 'light' ? 'light-content' : 'dark-content');

  return (
    <View style={[styles.container, containerStyle, style]}>
      <StatusBar 
        barStyle={barStyle} 
        backgroundColor="transparent" 
        translucent 
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenContainer;
