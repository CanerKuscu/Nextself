import React from 'react';
import { BannerAd, BannerAdSize, TestIds } from '../utils/ads';
import { StyleProp, ViewStyle } from 'react-native';

interface AdBannerProps {
    unitId?: string;
    size?: keyof typeof BannerAdSize | string;
    requestOptions?: any;
}

export const AdBanner = ({ unitId = TestIds.BANNER, size = BannerAdSize.BANNER, requestOptions }: AdBannerProps) => {
    return <BannerAd unitId={unitId} size={size as string} requestOptions={requestOptions} />;
};

export { BannerAdSize, TestIds };
