import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_API_KEY'; // Placeholder
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_API_KEY'; // Placeholder

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
            if (Platform.OS === 'ios') {
                Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS, appUserID: userId });
            } else if (Platform.OS === 'android') {
                Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID, appUserID: userId });
            }
            // Purchases.setLogLevel(LOG_LEVEL.DEBUG);
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
