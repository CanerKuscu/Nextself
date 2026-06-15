export const RewardedAdEventType = {
  LOADED: 'LOADED',
  EARNED_REWARD: 'EARNED_REWARD',
};

export const AdEventType = {
  LOADED: 'LOADED',
  CLOSED: 'CLOSED',
  ERROR: 'ERROR',
};

export const TestIds = {
  REWARDED: 'test_rewarded',
  INTERSTITIAL: 'test_interstitial',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
};

function createMockAd() {
  let listeners: Record<string, Function[]> = {};
  return {
    addAdEventListener: (eventType: string, callback: Function) => {
      if (!listeners[eventType]) listeners[eventType] = [];
      listeners[eventType].push(callback);
      return () => {
        listeners[eventType] = (listeners[eventType] || []).filter(cb => cb !== callback);
      };
    },
    load: () => {
      console.log('[Web Mock] Ad load called — no-op on web');
    },
    show: () => {
      console.log('[Web Mock] Ad show called — no-op on web');
    },
  };
}

export const RewardedAd = {
  createForAdRequest: (_adUnitId: string, _options?: any) => createMockAd(),
};

export const InterstitialAd = {
  createForAdRequest: (_adUnitId: string, _options?: any) => createMockAd(),
};

export const BannerAdSize = {
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
};

// No-op BannerAd component for web
export const BannerAd = (_props: any) => null;
