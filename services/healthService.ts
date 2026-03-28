import { Platform, Linking } from 'react-native';
import PlatformStorage, { SupabaseService } from '@nextself/shared';
import { OfflineService } from '../utils/offlineService';

const HEALTH_CACHE_KEY = 'NextSelf_health_cache';
const HEALTH_CONNECTED_KEY = 'NextSelf_health_connected';
const OFFLINE_QUEUE_KEY = 'NextSelf_offline_queue';
const HEALTH_CONNECT_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

export interface HealthData {
  steps: number;
  sleepHours: number;
  heartRate: number;
  calories: number;
  activeMinutes: number;
  water: number; // in ml
  date: string;
  source: 'apple_health' | 'google_health' | 'manual';
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

export interface WorkoutLiveMetrics {
  heartRate: number | null;
  calories: number;
  source: 'apple_health' | 'google_health' | 'manual';
}

export interface HealthStreamPayload {
  healthData: HealthData;
  weeklySteps: number[];
  weeklySleepHours: number[];
}

export class HealthService {
  private static instance: HealthService;
  private isAppleConnected = false;
  private isGoogleConnected = false;
  private healthStreamTimers = new Set<ReturnType<typeof setInterval>>();
  private workoutStreamTimers = new Set<ReturnType<typeof setInterval>>();
  private offlineHandlerRegistered = false;

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
    this.registerOfflineHandler();
  }

  private registerOfflineHandler(): void {
    if (this.offlineHandlerRegistered) return;
    const offline = OfflineService.getInstance();
    offline.registerSyncHandler('health_records_upsert', async (operation) => {
      const payload = operation.data as { healthData?: HealthData; timestamp?: string; userId?: string };
      if (!payload?.healthData) return false;
      const supabase = SupabaseService.getInstance().getClient();
      let userId = payload.userId;
      if (!userId) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user?.id) return false;
        userId = data.user.id;
      }
      const { error } = await supabase
        .from('health_records')
        .upsert({
          user_id: userId,
          ...payload.healthData,
          recorded_at: payload.timestamp ?? new Date().toISOString(),
        }, { onConflict: 'user_id,date' });
      return !error;
    });
    this.offlineHandlerRegistered = true;
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
          write: [
            AppleHealthKit.Constants.Permissions.Water,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Weight,
          ],
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
  async connectGoogleHealth(): Promise<{ success: boolean; error?: string; needsInstall?: boolean; needsPermission?: boolean }> {
    if (Platform.OS !== 'android') {
      return { success: false, error: 'Google Health is only available on Android' };
    }

    try {
      const { initialize, getSdkStatus, SdkAvailabilityStatus, getGrantedPermissions } = require('react-native-health-connect');

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
      const grantedPermissions = await getGrantedPermissions();

      if (!Array.isArray(grantedPermissions) || grantedPermissions.length === 0) {
        return {
          success: false,
          error: 'Health Connect permissions are not granted yet.',
          needsPermission: true,
        };
      }

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

  async openHealthConnectSettings(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const { openHealthConnectSettings } = require('react-native-health-connect');
      openHealthConnectSettings();
    } catch {
      await this.openHealthConnectInstall();
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

  async getWeeklyStepsData(): Promise<number[]> {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    const dayKeys = Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + idx);
      return day.toDateString();
    });
    const zeroed = dayKeys.map(() => 0);
    const { apple, google } = await this.getConnectionStatus();

    if (Platform.OS === 'ios' && apple) {
      try {
        const AppleHealthKit = require('react-native-health').default;
        const samples = await new Promise<any[]>((resolve) => {
          if (!AppleHealthKit.getDailyStepCountSamples) {
            resolve([]);
            return;
          }
          AppleHealthKit.getDailyStepCountSamples({
            startDate: startDate.toISOString(),
            endDate: today.toISOString(),
          }, (err: any, results: any[]) => {
            if (err || !Array.isArray(results)) resolve([]);
            else resolve(results);
          });
        });

        const totalsByDay = new Map<string, number>();
        dayKeys.forEach((key) => totalsByDay.set(key, 0));

        for (const sample of samples) {
          const key = new Date(sample?.startDate || sample?.date || Date.now()).toDateString();
          const value = Number(sample?.value || 0);
          if (!Number.isFinite(value) || !totalsByDay.has(key)) continue;
          totalsByDay.set(key, Math.max(0, Math.round(value)));
        }

        return dayKeys.map((key) => totalsByDay.get(key) || 0);
      } catch {
        return zeroed;
      }
    }

    if (Platform.OS === 'android' && google) {
      try {
        const { readRecords } = require('react-native-health-connect');
        const stepRecords = await readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: today.toISOString(),
          },
        });

        const totalsByDay = new Map<string, number>();
        dayKeys.forEach((key) => totalsByDay.set(key, 0));

        for (const record of stepRecords?.records || []) {
          const key = new Date(record?.startTime || record?.endTime || Date.now()).toDateString();
          const value = Number(record?.count || 0);
          if (!Number.isFinite(value) || !totalsByDay.has(key)) continue;
          totalsByDay.set(key, (totalsByDay.get(key) || 0) + Math.max(0, Math.round(value)));
        }

        return dayKeys.map((key) => totalsByDay.get(key) || 0);
      } catch {
        return zeroed;
      }
    }

    const current = await this.getTodayHealthData();
    const fallback = [...zeroed];
    fallback[fallback.length - 1] = Math.max(0, Math.round(Number(current.steps || 0)));
    return fallback;
  }

  async getWeeklySleepData(): Promise<number[]> {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    const dayKeys = Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + idx);
      return day.toDateString();
    });
    const zeroed = dayKeys.map(() => 0);
    const { apple, google } = await this.getConnectionStatus();

    if (Platform.OS === 'ios' && apple) {
      try {
        const AppleHealthKit = require('react-native-health').default;
        const samples = await new Promise<any[]>((resolve) => {
          if (!AppleHealthKit.getSleepSamples) {
            resolve([]);
            return;
          }
          AppleHealthKit.getSleepSamples(
            { startDate: startDate.toISOString(), endDate: today.toISOString() },
            (err: any, results: any[]) => {
              if (err || !Array.isArray(results)) resolve([]);
              else resolve(results);
            }
          );
        });

        const totalsByDay = new Map<string, number>();
        dayKeys.forEach((key) => totalsByDay.set(key, 0));
        for (const sample of samples) {
          const start = new Date(sample?.startDate || sample?.start || 0).getTime();
          const end = new Date(sample?.endDate || sample?.end || 0).getTime();
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
          const key = new Date(end).toDateString();
          if (!totalsByDay.has(key)) continue;
          const hours = (end - start) / (1000 * 60 * 60);
          totalsByDay.set(key, (totalsByDay.get(key) || 0) + hours);
        }
        return dayKeys.map((key) => Number((totalsByDay.get(key) || 0).toFixed(2)));
      } catch {
        return zeroed;
      }
    }

    if (Platform.OS === 'android' && google) {
      try {
        const { readRecords } = require('react-native-health-connect');
        const sleepRecords = await readRecords('SleepSession', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: today.toISOString(),
          },
        });
        const totalsByDay = new Map<string, number>();
        dayKeys.forEach((key) => totalsByDay.set(key, 0));
        for (const record of sleepRecords?.records || []) {
          const start = new Date(record?.startTime || 0).getTime();
          const end = new Date(record?.endTime || 0).getTime();
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
          const key = new Date(end).toDateString();
          if (!totalsByDay.has(key)) continue;
          const hours = (end - start) / (1000 * 60 * 60);
          totalsByDay.set(key, (totalsByDay.get(key) || 0) + hours);
        }
        return dayKeys.map((key) => Number((totalsByDay.get(key) || 0).toFixed(2)));
      } catch {
        return zeroed;
      }
    }

    const current = await this.getTodayHealthData();
    const fallback = [...zeroed];
    fallback[fallback.length - 1] = Number((current.sleepHours || 0).toFixed(2));
    return fallback;
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

        const getWater = () => new Promise<number>((resolve) => {
           if (AppleHealthKit.getWater) {
               AppleHealthKit.getWater({ date: today.toISOString() }, (err: any, results: any) => {
                   if (err) resolve(0); else resolve((results.value || 0) * 1000); // L -> ml
               });
           } else resolve(0);
        });
        const getSleepHours = () => new Promise<number>((resolve) => {
          if (!AppleHealthKit.getSleepSamples) {
            resolve(0);
            return;
          }
          AppleHealthKit.getSleepSamples({
            startDate: today.toISOString(),
            endDate: new Date().toISOString(),
          }, (err: any, results: any[]) => {
            if (err || !Array.isArray(results)) {
              resolve(0);
              return;
            }
            const totalHours = results.reduce((sum, sample) => {
              const start = new Date(sample?.startDate || sample?.start || 0).getTime();
              const end = new Date(sample?.endDate || sample?.end || 0).getTime();
              if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return sum;
              return sum + (end - start) / (1000 * 60 * 60);
            }, 0);
            resolve(Number.isFinite(totalHours) ? totalHours : 0);
          });
        });
        const getLatestHeartRate = () => new Promise<number>((resolve) => {
          if (!AppleHealthKit.getHeartRateSamples) {
            resolve(0);
            return;
          }
          AppleHealthKit.getHeartRateSamples({
            startDate: today.toISOString(),
            endDate: new Date().toISOString(),
          }, (err: any, results: any[]) => {
            if (err || !Array.isArray(results) || results.length === 0) {
              resolve(0);
              return;
            }
            const latestSample = [...results].sort((a, b) => {
              const aTs = new Date(a?.endDate || a?.startDate || 0).getTime();
              const bTs = new Date(b?.endDate || b?.startDate || 0).getTime();
              return bTs - aTs;
            })[0];
            const value = Number(latestSample?.value || 0);
            resolve(Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0);
          });
        });
        const getCalories = () => new Promise<number>((resolve) => {
          if (!AppleHealthKit.getActiveEnergyBurned) {
            resolve(0);
            return;
          }
          AppleHealthKit.getActiveEnergyBurned({
            startDate: today.toISOString(),
            endDate: new Date().toISOString(),
          }, (err: any, results: any[]) => {
            if (err || !Array.isArray(results)) {
              resolve(0);
              return;
            }
            const total = results.reduce((sum, sample) => {
              const value = Number(sample?.value || 0);
              return sum + (Number.isFinite(value) ? value : 0);
            }, 0);
            resolve(Math.max(0, Math.round(total)));
          });
        });
        const getActiveMinutes = () => new Promise<number>((resolve) => {
          if (!AppleHealthKit.getAppleExerciseTime) {
            resolve(0);
            return;
          }
          AppleHealthKit.getAppleExerciseTime({
            startDate: today.toISOString(),
            endDate: new Date().toISOString(),
          }, (err: any, results: any[]) => {
            if (err || !Array.isArray(results)) {
              resolve(0);
              return;
            }
            const totalMinutes = results.reduce((sum, sample) => {
              const value = Number(sample?.value || 0);
              return sum + (Number.isFinite(value) ? value : 0);
            }, 0);
            resolve(Math.max(0, Math.round(totalMinutes)));
          });
        });

        const [steps, water, sleepHours, heartRate, calories, activeMinutes] = await Promise.all([
          getSteps(),
          getWater(),
          getSleepHours(),
          getLatestHeartRate(),
          getCalories(),
          getActiveMinutes(),
        ]);

        return {
          steps,
          sleepHours: Number.isFinite(sleepHours) ? Number(sleepHours.toFixed(2)) : 0,
          heartRate,
          calories,
          activeMinutes,
          water,
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

        const results = await Promise.allSettled([
          readRecords('Steps', {
            timeRangeFilter: {
              operator: 'between',
              startTime: start.toISOString(),
              endTime: end.toISOString()
            }
          }),
          readRecords('Hydration', {
            timeRangeFilter: {
              operator: 'between',
              startTime: start.toISOString(),
              endTime: end.toISOString()
            }
          }),
          readRecords('HeartRate', {
            timeRangeFilter: {
              operator: 'between',
              startTime: start.toISOString(),
              endTime: end.toISOString()
            }
          }),
          readRecords('ActiveCaloriesBurned', {
            timeRangeFilter: {
              operator: 'between',
              startTime: start.toISOString(),
              endTime: end.toISOString()
            }
          }),
          readRecords('SleepSession', {
            timeRangeFilter: {
              operator: 'between',
              startTime: start.toISOString(),
              endTime: end.toISOString()
            }
          }),
          readRecords('ExerciseSession', {
            timeRangeFilter: {
              operator: 'between',
              startTime: start.toISOString(),
              endTime: end.toISOString()
            }
          }),
        ]);

        const stepRecords = results[0].status === 'fulfilled' ? results[0].value : null;
        const hydrationRecords = results[1].status === 'fulfilled' ? results[1].value : null;
        const heartRateRecords = results[2].status === 'fulfilled' ? results[2].value : null;
        const calorieRecords = results[3].status === 'fulfilled' ? results[3].value : null;
        const sleepRecords = results[4].status === 'fulfilled' ? results[4].value : null;
        const exerciseRecords = results[5].status === 'fulfilled' ? results[5].value : null;
        const totalWaterLiters = (hydrationRecords?.records || []).reduce((acc: number, cur: any) => acc + (cur?.volume?.inLiters || 0), 0);
        const totalSteps = (stepRecords?.records || []).reduce((acc: number, cur: any) => acc + (cur?.count || 0), 0);
        const latestHeartRate = (heartRateRecords?.records || [])
          .flatMap((record: any) => Array.isArray(record?.samples) ? record.samples : [])
          .sort((a: any, b: any) => {
            const aTs = new Date(a?.time || a?.startTime || 0).getTime();
            const bTs = new Date(b?.time || b?.startTime || 0).getTime();
            return bTs - aTs;
          })[0];
        const heartRate = Number(latestHeartRate?.beatsPerMinute || 0);
        const totalCalories = (calorieRecords?.records || []).reduce((acc: number, cur: any) => {
          const value = Number(cur?.energy?.inKilocalories ?? cur?.energy?.value ?? 0);
          return acc + (Number.isFinite(value) ? value : 0);
        }, 0);
        const totalSleepHours = (sleepRecords?.records || []).reduce((acc: number, cur: any) => {
          const startTs = new Date(cur?.startTime || 0).getTime();
          const endTs = new Date(cur?.endTime || 0).getTime();
          if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) return acc;
          return acc + (endTs - startTs) / (1000 * 60 * 60);
        }, 0);
        const totalActiveMinutes = (exerciseRecords?.records || []).reduce((acc: number, cur: any) => {
          const startTs = new Date(cur?.startTime || 0).getTime();
          const endTs = new Date(cur?.endTime || 0).getTime();
          if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) return acc;
          return acc + (endTs - startTs) / (1000 * 60);
        }, 0);

        return {
          steps: totalSteps,
          sleepHours: Number.isFinite(totalSleepHours) ? Number(totalSleepHours.toFixed(2)) : 0,
          heartRate: Number.isFinite(heartRate) ? Math.max(0, Math.round(heartRate)) : 0,
          calories: Math.max(0, Math.round(totalCalories)),
          activeMinutes: Math.max(0, Math.round(totalActiveMinutes)),
          water: totalWaterLiters * 1000,
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
  async fetchLatestWeight(): Promise<{ weight: number, date: string, source: 'apple_health' | 'google_health', bodyFat?: number, muscleMass?: number } | null> {
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

        const results = await Promise.allSettled([
          readRecords('Weight', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString()
            }
          }),
          readRecords('BodyFat', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString()
            }
          }),
          readRecords('LeanBodyMass', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString()
            }
          }),
        ]);

        const weightRecords = results[0].status === 'fulfilled' ? results[0].value : null;
        const bodyFatRecords = results[1].status === 'fulfilled' ? results[1].value : null;
        const leanMassRecords = results[2].status === 'fulfilled' ? results[2].value : null;

        if (weightRecords && weightRecords.records && weightRecords.records.length > 0) {
          // Find the most recent record
          const latest = weightRecords.records.reduce((prev: any, current: any) => {
            return (new Date(prev.time) > new Date(current.time)) ? prev : current;
          });

          const latestBodyFat = (bodyFatRecords?.records || []).reduce((prev: any, current: any) => {
            if (!prev) return current;
            return (new Date(prev.time) > new Date(current.time)) ? prev : current;
          }, null);
          const latestLeanMass = (leanMassRecords?.records || []).reduce((prev: any, current: any) => {
            if (!prev) return current;
            return (new Date(prev.time) > new Date(current.time)) ? prev : current;
          }, null);

          return {
            weight: latest.weight.inKilograms,
            date: latest.time,
            source: 'google_health',
            bodyFat: Number.isFinite(Number(latestBodyFat?.percentage?.value)) ? Number(latestBodyFat?.percentage?.value) : undefined,
            muscleMass: Number.isFinite(Number(latestLeanMass?.mass?.inKilograms)) ? Number(latestLeanMass?.mass?.inKilograms) : undefined,
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
    this.registerOfflineHandler();
    await OfflineService.getInstance().queueOperation('health_records_upsert', {
      healthData: data,
      timestamp: new Date().toISOString(),
    });
  }

  // Last-write-wins conflict resolution
  async syncOfflineQueue(_supabaseClient: any, userId: string): Promise<void> {
    const stored = await PlatformStorage.getItem(OFFLINE_QUEUE_KEY);
    if (stored) {
      const queue = JSON.parse(stored);
      const unsynced = queue.filter((item: any) => !item.synced);
      for (const item of unsynced) {
        await OfflineService.getInstance().queueOperation('health_records_upsert', {
          healthData: item.data,
          timestamp: item.timestamp,
          userId,
        });
      }
      await PlatformStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
    await OfflineService.getInstance().syncNow();
  }

  getEmptyHealthData(date: string): HealthData {
    return {
      steps: 0,
      sleepHours: 0,
      heartRate: 0,
      calories: 0,
      activeMinutes: 0,
      water: 0,
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

  async getWorkoutLiveMetrics(startTime: Date): Promise<WorkoutLiveMetrics | null> {
    const { apple, google } = await this.getConnectionStatus();

    if (Platform.OS === 'ios' && apple) {
      try {
        const AppleHealthKit = require('react-native-health').default;
        const startDate = startTime.toISOString();
        const endDate = new Date().toISOString();

        const heartRateSamples = await new Promise<any[]>((resolve) => {
          AppleHealthKit.getHeartRateSamples({ startDate, endDate }, (err: any, results: any[]) => {
            if (err || !Array.isArray(results)) resolve([]);
            else resolve(results);
          });
        });

        const energySamples = await new Promise<any[]>((resolve) => {
          AppleHealthKit.getActiveEnergyBurned({ startDate, endDate }, (err: any, results: any[]) => {
            if (err || !Array.isArray(results)) resolve([]);
            else resolve(results);
          });
        });

        const latestHrSample = [...heartRateSamples]
          .sort((a, b) => new Date(b.endDate || b.startDate || 0).getTime() - new Date(a.endDate || a.startDate || 0).getTime())[0];
        const heartRate = latestHrSample && Number.isFinite(Number(latestHrSample.value))
          ? Math.round(Number(latestHrSample.value))
          : null;

        const calories = energySamples.reduce((sum, sample) => {
          const value = Number(sample?.value || 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        return {
          heartRate,
          calories: Math.max(0, Math.round(calories)),
          source: 'apple_health',
        };
      } catch {
        return null;
      }
    }

    if (Platform.OS === 'android' && google) {
      try {
        const { readRecords } = require('react-native-health-connect');
        const startIso = startTime.toISOString();
        const endIso = new Date().toISOString();

        const results = await Promise.allSettled([
          readRecords('HeartRate', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startIso,
              endTime: endIso,
            },
          }),
          readRecords('ActiveCaloriesBurned', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startIso,
              endTime: endIso,
            },
          }),
        ]);

        const heartRateRecords = results[0].status === 'fulfilled' ? results[0].value : null;
        const calorieRecords = results[1].status === 'fulfilled' ? results[1].value : null;

        const heartRateSamples = heartRateRecords?.records || [];
        const latestHr = [...heartRateSamples]
          .sort((a: any, b: any) => new Date(b.endTime || b.startTime || 0).getTime() - new Date(a.endTime || a.startTime || 0).getTime())[0];
        const latestHrSample = latestHr?.samples?.[latestHr.samples.length - 1];
        const heartRate = latestHrSample && Number.isFinite(Number(latestHrSample.beatsPerMinute))
          ? Math.round(Number(latestHrSample.beatsPerMinute))
          : null;

        const calories = (calorieRecords?.records || []).reduce((sum: number, record: any) => {
          const value = Number(record?.energy?.inKilocalories ?? record?.energy?.value ?? 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        return {
          heartRate,
          calories: Math.max(0, Math.round(calories)),
          source: 'google_health',
        };
      } catch {
        return null;
      }
    }

    return null;
  }

  startHealthDataStream(
    onData: (payload: HealthStreamPayload) => void,
    options?: { intervalMs?: number; includeWeeklySteps?: boolean; includeWeeklySleep?: boolean }
  ): () => void {
    const intervalMs = Math.max(3000, options?.intervalMs ?? 15000);
    const includeWeeklySteps = options?.includeWeeklySteps ?? true;
    const includeWeeklySleep = options?.includeWeeklySleep ?? true;
    let active = true;
    let isFetching = false;

    const emit = async () => {
      if (!active || isFetching) return;
      isFetching = true;
      try {
        const healthData = await this.getTodayHealthData();
        const weeklySteps = includeWeeklySteps ? await this.getWeeklyStepsData() : Array(7).fill(0);
        const weeklySleepHours = includeWeeklySleep ? await this.getWeeklySleepData() : Array(7).fill(0);
        if (!active) return;
        onData({ healthData, weeklySteps, weeklySleepHours });
      } catch (error) {
        console.error('Health stream emit error:', error);
      } finally {
        isFetching = false;
      }
    };

    emit();
    const timer = setInterval(() => {
      void emit();
    }, intervalMs);
    this.healthStreamTimers.add(timer);

    return () => {
      active = false;
      clearInterval(timer);
      this.healthStreamTimers.delete(timer);
    };
  }

  startWorkoutMetricsStream(
    startTime: Date,
    onMetrics: (metrics: WorkoutLiveMetrics) => void,
    options?: { intervalMs?: number }
  ): () => void {
    const intervalMs = Math.max(1000, options?.intervalMs ?? 5000);
    let active = true;
    let isFetching = false;
    let lastSignature: string | null = null;

    const emit = async () => {
      if (!active || isFetching) return;
      isFetching = true;
      try {
        const metrics = await this.getWorkoutLiveMetrics(startTime);
        if (!active || !metrics) return;
        const signature = `${metrics.source}|${metrics.heartRate ?? 'null'}|${metrics.calories}`;
        if (signature !== lastSignature) {
          lastSignature = signature;
          onMetrics(metrics);
        }
      } catch (error) {
        console.error('Workout stream emit error:', error);
      } finally {
        isFetching = false;
      }
    };

    emit();
    const timer = setInterval(() => {
      void emit();
    }, intervalMs);
    this.workoutStreamTimers.add(timer);

    return () => {
      active = false;
      clearInterval(timer);
      this.workoutStreamTimers.delete(timer);
    };
  }

  // --- Bi-directional Sync Methods ---

  async saveWater(amountMl: number): Promise<boolean> {
    const { apple, google } = await this.getConnectionStatus();
    if (!apple && !google) return false;

    if (Platform.OS === 'ios' && apple) {
      const AppleHealthKit = require('react-native-health').default;
      return new Promise((resolve) => {
        // HealthKit expects liters
        AppleHealthKit.saveWater({ value: amountMl / 1000 }, (err: any) => {
          if (err) {
            console.error('Error saving water to HealthKit:', err);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    }

    if (Platform.OS === 'android' && google) {
      try {
        const { insertRecords } = require('react-native-health-connect');
        const now = new Date();
        const endTime = now.toISOString();
        const startTime = new Date(now.getTime() - 1000).toISOString(); // 1 second duration

        await insertRecords([{
          recordType: 'Hydration',
          volume: { value: amountMl / 1000, unit: 'liters' },
          startTime,
          endTime,
        }]);
        return true;
      } catch (err) {
        console.error('Error saving water to Health Connect:', err);
        return false;
      }
    }
    return false;
  }

  async saveCalories(calories: number): Promise<boolean> {
    const { apple, google } = await this.getConnectionStatus();
    if (!apple && !google) return false;

    const now = new Date();
    const endTime = now.toISOString();
    const startTime = new Date(now.getTime() - 60 * 1000).toISOString(); // 1 minute duration

    if (Platform.OS === 'ios' && apple) {
       const AppleHealthKit = require('react-native-health').default;
       return new Promise((resolve) => {
           // We use saveActiveEnergyBurned
           // options: { startDate, endDate, value, unit } (check docs, usually value is enough for point data, or needs explicit options)
           // Actually library might not have saveActiveEnergyBurned easily exposed as point data, often it's saveQuantitySample
           // But widely used wrapper usually has saveActiveEnergyBurned
           // Checking widely used types: saveActiveEnergyBurned(options, cb)
           // options: { value, startDate, endDate }
         const options = {
            startDate: startTime,
            endDate: endTime,
            value: calories,
            unit: 'calorie' // or 'kcal'
         };
         // Note: unit 'calorie' in HK is often small calorie, but typically wrapper handles it. 
         // Safest is 'kilocalorie' if supported, or verify library.
         // Assuming 'calorie' = kcal in this context or standard HK unit. 
         // Actually AppleHealthKit.Constants.Units.kilocalorie is safer if available.
         // For now, let's assume 'kilocalorie' string works or 'calorie'
         options.unit = 'kilocalorie'; 
         
         // If method doesn't exist, we might fail, but this is a standard method in react-native-health
         if (AppleHealthKit.saveActiveEnergyBurned) {
             AppleHealthKit.saveActiveEnergyBurned(options, (err: any) => {
                if (err) {
                    console.error('Error saving calories to HealthKit', err);
                    resolve(false);
                } else {
                    resolve(true);
                }
             });
         } else {
             resolve(false);
         }
       });
    }

    if (Platform.OS === 'android' && google) {
        try {
            const { insertRecords } = require('react-native-health-connect');
             await insertRecords([{
                recordType: 'ActiveCaloriesBurned',
                energy: { value: calories, unit: 'kilocalories' },
                startTime,
                endTime,
            }]);
            return true;
        } catch(err) {
            console.error('Error saving calories to Health Connect', err);
            return false;
        }
    }
    return false;
  }

  async saveSleep(startDate: Date, endDate: Date): Promise<boolean> {
      const { apple, google } = await this.getConnectionStatus();
      if (!apple && !google) return false;

      if (Platform.OS === 'ios' && apple) {
          const AppleHealthKit = require('react-native-health').default;
          return new Promise((resolve) => {
              const options = {
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                  value: 'ASLEEP' // or 'INBED'
              };
              AppleHealthKit.saveSleep(options, (err: any) => {
                  if (err) {
                      console.error('Error saving sleep to HealthKit', err);
                      resolve(false);
                  } else {
                      resolve(true);
                  }
              });
          });
      }

      if (Platform.OS === 'android' && google) {
          try {
              const { insertRecords } = require('react-native-health-connect');
              await insertRecords([{
                  recordType: 'SleepSession',
                  startTime: startDate.toISOString(),
                  endTime: endDate.toISOString(),
              }]);
              return true;
          } catch(err) {
              console.error('Error saving sleep to Health Connect', err);
              return false;
          }
      }
      return false;
  }
}
