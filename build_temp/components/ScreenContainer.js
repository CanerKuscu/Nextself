"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const ThemeContext_1 = require("../contexts/ThemeContext");
/**
 * A wrapper component that enforces safe area boundaries.
 * Use this as the root component for all screens to ensure content
 * doesn't overlap with system UI (notch, home indicator, status bar).
 */
const ScreenContainer = ({ children, style, backgroundColor, edges = ['top', 'left', 'right'], // Default edges to protect
statusBarStyle = 'auto', }) => {
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const containerStyle = {
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
    return (<react_native_1.View style={[styles.container, containerStyle, style]}>
      <react_native_1.StatusBar barStyle={barStyle} backgroundColor="transparent" translucent/>
      {children}
    </react_native_1.View>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
});
exports.default = ScreenContainer;
