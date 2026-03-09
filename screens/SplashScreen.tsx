import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineSlide = useRef(new Animated.Value(20)).current;
    const iconRotate = useRef(new Animated.Value(0)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    const barWidth = useRef(new Animated.Value(0)).current;
    const barOpacity = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Phase 1: Icon appears with rotation (0-500ms)
        Animated.parallel([
            Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(iconRotate, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
        ]).start();

        // Phase 2: Logo scales in (300-900ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(glowOpacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
            ]).start();
        }, 300);

        // Phase 3: Tagline slides in (800-1200ms)
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(taglineSlide, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            ]).start();
        }, 800);

        // Phase 4: Loading bar (1000-2200ms)
        setTimeout(() => {
            Animated.timing(barOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();
            Animated.timing(barWidth, { toValue: width * 0.5, duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }).start();
        }, 1000);

        // Continuous pulse on glow
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            ])
        ).start();

        const timer = setTimeout(() => onFinish(), 2500);
        return () => clearTimeout(timer);
    }, []);

    const spin = iconRotate.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] });

    return (
        <LinearGradient colors={['#0F0C29', '#302B63', '#24243E']} style={styles.container}>
            {/* Decorative circles */}
            <Animated.View style={[styles.bgCircle1, { opacity: glowOpacity }]} />
            <Animated.View style={[styles.bgCircle2, { opacity: glowOpacity }]} />

            {/* Icon */}
            <Animated.View style={[styles.iconWrap, { opacity: iconOpacity, transform: [{ rotate: spin }] }]}>
                <LinearGradient colors={['#58CC02', '#38A802']} style={styles.iconGradient}>
                    <Ionicons name="pulse" size={32} color="#FFFFFF" />
                </LinearGradient>
            </Animated.View>

            {/* Logo */}
            <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }] }]}>
                <Text style={styles.logoBio}>Bio</Text>
                <Text style={styles.logoSync}>Sync</Text>
                <Text style={styles.logoDot}>.</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineSlide }] }}>
                <Text style={styles.tagline}>INTELLIGENT PERFORMANCE</Text>
            </Animated.View>

            {/* Loading bar */}
            <Animated.View style={[styles.barContainer, { opacity: barOpacity }]}>
                <Animated.View style={[styles.barFill, { width: barWidth }]}>
                    <LinearGradient colors={['#58CC02', '#38ef7d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.barGradient} />
                </Animated.View>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgCircle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#58CC02',
        opacity: 0.05,
        top: height * 0.15,
        left: -80,
    },
    bgCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#764ba2',
        opacity: 0.08,
        bottom: height * 0.2,
        right: -60,
    },
    iconWrap: {
        marginBottom: 24,
    },
    iconGradient: {
        width: 72,
        height: 72,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#58CC02',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
    },
    logoWrap: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 10,
    },
    logoBio: {
        fontSize: width * 0.12,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    logoSync: {
        fontSize: width * 0.12,
        fontWeight: '800',
        color: '#58CC02',
        letterSpacing: -1,
    },
    logoDot: {
        fontSize: width * 0.12,
        fontWeight: '800',
        color: '#58CC02',
    },
    tagline: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: 4,
    },
    barContainer: {
        position: 'absolute',
        bottom: height * 0.12,
        width: width * 0.5,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
    },
    barGradient: {
        flex: 1,
    },
});

export default SplashScreen;
