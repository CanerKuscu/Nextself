import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const resolveRevenueCatKey = (platform: 'ios' | 'android'): string => {
    const extra = Constants.expoConfig?.extra?.revenueCat as
        | { iosApiKey?: string; androidApiKey?: string }
        | undefined;
    if (platform === 'ios') {
        return (extra?.iosApiKey || process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '').trim();
    }
    return (extra?.androidApiKey || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '').trim();
};

export class SubscriptionService {
    private static instance: SubscriptionService;
    private isInitialized = false;

    private constructor() {}

    public static getInstance(): SubscriptionService {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }

    public async initialize(userId?: string): Promise<void> {
        if (this.isInitialized) return;

        try {
            const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null;
            if (!platform) {
                // Web / unsupported platforms: skip silently.
                this.isInitialized = true;
                return;
            }
            const apiKey = resolveRevenueCatKey(platform);
            if (!apiKey) {
                console.warn(
                    `RevenueCat ${platform} API key is not configured. Set EXPO_PUBLIC_REVENUECAT_${platform.toUpperCase()}_API_KEY or expo extra.revenueCat.`,
                );
                return;
            }
            Purchases.configure({ apiKey, appUserID: userId });
            this.isInitialized = true;
        } catch (error) {
            console.warn('Failed to initialize RevenueCat:', error);
        }
    }

    public async getOfferings(): Promise<PurchasesPackage[]> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current && offerings.current.availablePackages.length !== 0) {
                return offerings.current.availablePackages;
            }
        } catch (error) {
            console.warn('Failed to get offerings:', error);
        }
        return [];
    }

    public async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            return this.checkIsPro(customerInfo);
        } catch (error: any) {
            if (!error.userCancelled) {
                console.warn('Purchase failed:', error);
            }
            return false;
        }
    }

    public async restorePurchases(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return this.checkIsPro(customerInfo);
        } catch (error) {
            console.warn('Failed to restore purchases:', error);
            return false;
        }
    }

    public async checkUserStatus(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return this.checkIsPro(customerInfo);
        } catch (error) {
            console.warn('Failed to check user status:', error);
            return false;
        }
    }

    private checkIsPro(customerInfo: CustomerInfo): boolean {
        // "pro" is the Entitlement ID configured in RevenueCat dashboard
        return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    }
}
