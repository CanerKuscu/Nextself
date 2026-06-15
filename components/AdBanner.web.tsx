import React from 'react';
import { View, Text } from 'react-native';

export const AdBanner = () => {
    // Web doesn't support react-native-google-mobile-ads
    return null;
};

export const BannerAdSize = {
    BANNER: 'BANNER',
    LARGE_BANNER: 'LARGE_BANNER',
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
    FULL_BANNER: 'FULL_BANNER',
    LEADERBOARD: 'LEADERBOARD',
    ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
};

export const TestIds = {
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
};
