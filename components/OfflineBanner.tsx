import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

export default function OfflineBanner() {
    const netInfo = useNetInfo();
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    
    // We only show banner if explicitly `isConnected === false`.
    const isOffline = netInfo.isConnected === false;
    
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (isOffline) {
            setVisible(true);
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setVisible(false));
        }
    }, [isOffline, translateY]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { 
            backgroundColor: '#EF4444', 
            paddingTop: Math.max(insets.top, 20),
            transform: [{ translateY }]
        }]}>
            <View style={styles.content}>
                <Ionicons name="cloud-offline" size={20} color="#FFFFFF" />
                <Text style={styles.text}>
                    {isTurkish ? 'İnternet bağlantısı yok.' : 'No internet connection.'}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        elevation: 10,
        paddingBottom: 10,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    }
});
