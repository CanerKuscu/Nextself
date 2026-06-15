import { InterstitialAd, AdEventType, TestIds } from '../utils/ads';
import { SubscriptionService } from './SubscriptionService';

// Fallback to Test ID if real ID is not provided.
const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyyyy';

export class AdService {
    private static instance: AdService;
    private interstitial: InterstitialAd | null = null;
    private isAdLoaded: boolean = false;

    private constructor() {
        this.loadInterstitial();
    }

    public static getInstance(): AdService {
        if (!AdService.instance) {
            AdService.instance = new AdService();
        }
        return AdService.instance;
    }

    private loadInterstitial() {
        this.interstitial = InterstitialAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
            this.isAdLoaded = true;
        });

        this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            this.isAdLoaded = false;
            this.loadInterstitial(); // Reload for next time
        });

        this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
            console.warn('Interstitial ad failed to load:', error);
            this.isAdLoaded = false;
            // Retry after delay
            setTimeout(() => this.loadInterstitial(), 30000);
        });

        this.interstitial.load();
    }

    public async showInterstitialIfAvailable(): Promise<boolean> {
        try {
            const isPro = await SubscriptionService.getInstance().checkUserStatus();
            if (isPro) return false;

            if (this.isAdLoaded && this.interstitial) {
                this.interstitial.show();
                return true;
            }
        } catch (error) {
            console.warn('Failed to show interstitial:', error);
        }
        return false;
    }
}
