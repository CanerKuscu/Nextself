import { Platform, Linking } from 'react-native';

// Platform-aware secure storage helper
const PlatformStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch { /* ignore */ }
      return;
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
      return;
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.deleteItemAsync(key);
  },
};

const HEALTH_CACHE_KEY = 'biosync_health_cache';
const HEALTH_CONNECTED_KEY = 'biosync_health_connected';
const OFFLINE_QUEUE_KEY = 'biosync_offline_queue';
const HEALTH_CONNECT_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

export interface HealthData {
  steps: number;
  sleepHours: number;
  heartRate: number;
  calories: number;
  activeMinutes: number;
  date: string;
  source: 'apple_health' | 'google_health' | 'manual' | 'mock';
}

export interface HealthInsight {
  type: 'sleep' | 'steps' | 'heart_rate' | 'hormonal' | 'cortisol';
  severity: 'good' | 'warning' | 'critical';
  title_tr: string;
  title_en: string;
  message_tr: string;
  message_en: string;
  icon: string;
}

export class HealthService {
  private static instance: HealthService;
  private isAppleConnected = false;
  private isGoogleConnected = false;

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  async initialize(): Promise<void> {
    const stored = await PlatformStorage.getItem(HEALTH_CONNECTED_KEY);
    if (stored) {
      const conn = JSON.parse(stored);
      this.isAppleConnected = conn.apple ?? false;
      this.isGoogleConnected = conn.google ?? false;
    }
  }

  // Apple HealthKit Integration
  async connectAppleHealth(): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Health is only available on iOS' };
    }

    try {
      const AppleHealthKit = require('react-native-health').default;
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Weight,
          ],
          write: [],
        },
      } as any;

      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(permissions, async (error: string) => {
          if (error) {
            resolve({ success: false, error });
            return;
          }
          this.isAppleConnected = true;
          await PlatformStorage.setItem(HEALTH_CONNECTED_KEY, JSON.stringify({
            apple: true,
            google: this.isGoogleConnected,
            connectedAt: new Date().toISOString(),
          }));
          resolve({ success: true });
        });
      });
    } catch (err: any) {
      console.error('Apple Health connection error:', err);
      return { success: false, error: err.message };
    }
  }

  // Google Health Connect Integration
  async connectGoogleHealth(): Promise<{ success: boolean; error?: string; needsInstall?: boolean }> {
    if (Platform.OS !== 'android') {
      return { success: false, error: 'Google Health is only available on Android' };
    }

    try {
      const { initialize, requestPermission, getSdkStatus, SdkAvailabilityStatus } = require('react-native-health-connect');

      // Check if Health Connect is available on device
      const sdkStatus = await getSdkStatus();
      if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        return {
          success: false,
          error: 'Health Connect is not available on this device.',
          needsInstall: true,
        };
      }
      if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        return {
          success: false,
          error: 'Health Connect needs to be updated.',
          needsInstall: true,
        };
      }

      await initialize();

      const permissions = [
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'Weight' }
      ] as any;

      await requestPermission(permissions);

      this.isGoogleConnected = true;
      await PlatformStorage.setItem(HEALTH_CONNECTED_KEY, JSON.stringify({
        apple: this.isAppleConnected,
        google: true,
        connectedAt: new Date().toISOString(),
      }));

      return { success: true };
    } catch (err: any) {
      console.error('Google Health connection error:', err);
      const errorMsg = err.message || '';
      // If error looks like Health Connect not installed
      if (errorMsg.includes('not installed') || errorMsg.includes('not found') || errorMsg.includes('SDK')) {
        return { success: false, error: err.message, needsInstall: true };
      }
      return { success: false, error: err.message };
    }
  }

  // Open Health Connect install page on Play Store
  async openHealthConnectInstall(): Promise<void> {
    try {
      await Linking.openURL(HEALTH_CONNECT_PLAY_STORE_URL);
    } catch {
      // Fallback to market intent
      try {
        await Linking.openURL('market://details?id=com.google.android.apps.healthdata');
      } catch {
        console.warn('Could not open Play Store');
      }
    }
  }

  async getConnectionStatus(): Promise<{ apple: boolean; google: boolean }> {
    const stored = await PlatformStorage.getItem(HEALTH_CONNECTED_KEY);
    if (stored) {
      const conn = JSON.parse(stored);
      return { apple: conn.apple ?? false, google: conn.google ?? false };
    }
    return { apple: false, google: false };
  }

  async getTodayHealthData(): Promise<HealthData> {
    const today = new Date().toDateString();

    try {
      // Refresh always if connected to avoid stale cached data
      const { apple, google } = await this.getConnectionStatus();
      if (apple || google) {
        const fresh = await this.fetchFromHealthPlatform();
        if (fresh) {
          await this.cacheHealthData(fresh);
          return fresh;
        }
      }

      // Try cache
      const cached = await PlatformStorage.getItem(HEALTH_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as HealthData;
        if (data.date === today) {
          return data;
        }
      }

      return this.getEmptyHealthData(today);
    } catch (err) {
      console.error('Health data error:', err);
      return this.getEmptyHealthData(today);
    }
  }

  private async fetchFromHealthPlatform(): Promise<HealthData | null> {
    const { apple, google } = await this.getConnectionStatus();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Platform.OS === 'ios' && apple) {
      try {
        const AppleHealthKit = require('react-native-health').default;

        const getSteps = () => new Promise<number>((resolve) => {
          AppleHealthKit.getStepCount({ date: today.toISOString() }, (err: any, results: any) => {
            if (err) resolve(0); else resolve(results.value || 0);
          });
        });

        // Other readings similarly... (stubbed here for brevity, typically uses similarly nested callbacks)
        const steps = await getSteps();

        return {
          steps,
          sleepHours: 0, // mock reading
          heartRate: 0,
          calories: 0,
          activeMinutes: 0,
          date: new Date().toDateString(),
          source: 'apple_health'
        };
      } catch (err) {
        console.warn(err);
      }
    }

    if (Platform.OS === 'android' && google) {
      try {
        const { readRecords } = require('react-native-health-connect');

        const end = new Date();
        const start = new Date(today); // midnight

        // Example reading steps
        const stepRecords = await readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: start.toISOString(),
            endTime: end.toISOString()
          }
        });

        const totalSteps = stepRecords.records.reduce((acc: number, cur: any) => acc + (cur.count || 0), 0);

        return {
          steps: totalSteps,
          sleepHours: 0,
          heartRate: 0,
          calories: 0,
          activeMinutes: 0,
          date: new Date().toDateString(),
          source: 'google_health'
        };
      } catch (err) {
        console.warn(err);
      }
    }

    return null;
  }

  /**
   * Fetch the user's latest recorded weight from Apple Health / Google Health Connect.
   * Scans the past 30 days to find the most recent valid log.
   */
  async fetchLatestWeight(): Promise<{ weight: number, date: string, source: 'apple_health' | 'google_health' } | null> {
    const { apple, google } = await this.getConnectionStatus();
    if (!apple && !google) return null;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Look back 30 days

    if (Platform.OS === 'ios' && apple) {
      try {
        const AppleHealthKit = require('react-native-health').default;

        return new Promise((resolve) => {
          AppleHealthKit.getLatestWeight({ startDate: startDate.toISOString() }, (err: any, results: any) => {
            if (err || !results || typeof results.value !== 'number') {
              resolve(null);
            } else {
              resolve({
                weight: results.value, // Note: may need Kg conversion if not returned in Kg
                date: new Date(results.startDate || Date.now()).toISOString(),
                source: 'apple_health'
              });
            }
          });
        });
      } catch (err) {
        console.warn('Apple Health fetch weight error:', err);
      }
    }

    if (Platform.OS === 'android' && google) {
      try {
        const { readRecords } = require('react-native-health-connect');

        const weightRecords = await readRecords('Weight', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString()
          }
        });

        if (weightRecords && weightRecords.records && weightRecords.records.length > 0) {
          // Find the most recent record
          const latest = weightRecords.records.reduce((prev: any, current: any) => {
            return (new Date(prev.time) > new Date(current.time)) ? prev : current;
          });

          return {
            weight: latest.weight.inKilograms,
            date: latest.time,
            source: 'google_health'
          };
        }
      } catch (err) {
        console.warn('Google Connect fetch weight error:', err);
      }
    }

    return null;
  }

  private async cacheHealthData(data: HealthData): Promise<void> {
    await PlatformStorage.setItem(HEALTH_CACHE_KEY, JSON.stringify(data));

    // Add to offline queue for sync
    await this.addToOfflineQueue(data);
  }

  async addToOfflineQueue(data: any): Promise<void> {
    const stored = await PlatformStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = stored ? JSON.parse(stored) : [];
    queue.push({ data, timestamp: new Date().toISOString(), synced: false });
    // Keep only last 100 entries
    if (queue.length > 100) queue.splice(0, queue.length - 100);
    await PlatformStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  // Last-write-wins conflict resolution
  async syncOfflineQueue(supabaseClient: any, userId: string): Promise<void> {
    const stored = await PlatformStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!stored) return;

    const queue = JSON.parse(stored);
    const unsynced = queue.filter((item: any) => !item.synced);

    for (const item of unsynced) {
      try {
        const { error } = await supabaseClient
          .from('health_records')
          .upsert({
            user_id: userId,
            ...item.data,
            recorded_at: item.timestamp,
          }, { onConflict: 'user_id,date' }); // Last write wins

        if (!error) item.synced = true;
      } catch (err) {
        console.warn('Sync failed for item:', err);
      }
    }

    await PlatformStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  getEmptyHealthData(date: string): HealthData {
    return {
      steps: 0,
      sleepHours: 0,
      heartRate: 0,
      calories: 0,
      activeMinutes: 0,
      date,
      source: 'manual',
    };
  }

  generateHealthInsights(data: HealthData, gender: 'male' | 'female' | null): HealthInsight[] {
    const insights: HealthInsight[] = [];

    // Sleep insights
    if (data.sleepHours > 0) {
      if (data.sleepHours < 6) {
        const maleMsg_tr = 'Az uyku testosteron seviyenizi %10-15 düşürür ve kortizolunuzu yükseltir. Bugün iyileşmeye odaklanın.';
        const femaleMsg_tr = 'Az uyku östrojen dengesini bozabilir ve kortizol seviyelerini artırabilir. Bugün dinlenin.';
        const neutralMsg_tr = 'Az uyku hormon dengenizi ve bağışıklık sisteminizi olumsuz etkiler.';

        insights.push({
          type: 'sleep',
          severity: 'warning',
          title_tr: 'Uyku Uyarısı',
          title_en: 'Sleep Warning',
          message_tr: gender === 'male' ? maleMsg_tr : gender === 'female' ? femaleMsg_tr : neutralMsg_tr,
          message_en: gender === 'male'
            ? 'Poor sleep reduces testosterone by 10-15% and raises cortisol. Focus on recovery today.'
            : gender === 'female'
              ? 'Poor sleep can disrupt estrogen balance and increase cortisol. Rest today.'
              : 'Poor sleep negatively affects hormonal balance and immune system.',
          icon: 'bed',
        });
      } else if (data.sleepHours >= 7 && data.sleepHours <= 9) {
        insights.push({
          type: 'sleep',
          severity: 'good',
          title_tr: 'Harika Uyku',
          title_en: 'Great Sleep',
          message_tr: `${data.sleepHours.toFixed(1)} saat uyudunuz. Testosteron ve büyüme hormonu optimal seviyede!`,
          message_en: `You slept ${data.sleepHours.toFixed(1)} hours. Testosterone and growth hormone are at optimal levels!`,
          icon: 'star',
        });
      }
    }

    // Steps insights
    if (data.steps > 0 && data.steps < 5000) {
      insights.push({
        type: 'steps',
        severity: 'warning',
        title_tr: 'Hareket Uyarısı',
        title_en: 'Activity Warning',
        message_tr: `Bugün ${data.steps.toLocaleString()} adım attınız. Hedef: 10.000 adım. Kısa bir yürüyüş yapabilirsiniz!`,
        message_en: `You've taken ${data.steps.toLocaleString()} steps today. Goal: 10,000. How about a short walk!`,
        icon: 'footsteps',
      });
    }

    // Heart rate insights
    if (data.heartRate > 100) {
      insights.push({
        type: 'heart_rate',
        severity: 'warning',
        title_tr: 'Yüksek Nabız',
        title_en: 'Elevated Heart Rate',
        message_tr: `Dinlenme nabzınız ${data.heartRate} bpm. Stres yönetimi ve derin nefes egzersizleri yapın.`,
        message_en: `Resting HR is ${data.heartRate} bpm. Practice stress management and deep breathing.`,
        icon: 'pulse',
      });
    }

    return insights;
  }

  async updateManualData(field: keyof Pick<HealthData, 'steps' | 'sleepHours' | 'heartRate' | 'calories'>, value: number): Promise<HealthData> {
    const data = await this.getTodayHealthData();
    const updated = { ...data, [field]: value, source: 'manual' as const };
    await this.cacheHealthData(updated);
    return updated;
  }
}
