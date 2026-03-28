import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import PlatformStorage from '@nextself/shared';
import { SupabaseService } from '@nextself/shared';
import { getLocalDateString } from '../utils/dateUtils';

const WATER_KEY = 'nextself_water_tracking';
const WATER_NOTIF_KEY = 'nextself_water_notif_ids';
const LANGUAGE_KEY = 'nextself_language';

export interface WaterConfig {
    dailyGoalLiters: number;
    mlPerSip: number;
    startHour: number;
    endHour: number;
    currentIntakeMl: number;
    date: string;
    drinkCount: number;
}

export interface WaterStats {
    currentIntakeMl: number;
    dailyGoalMl: number;
    percentage: number;
    remainingMl: number;
    notificationCount: number;
    nextNotifTime: string | null;
    drinkCount: number;
}

const getDefaultConfig = (): WaterConfig => ({
    dailyGoalLiters: 2.5,
    mlPerSip: 250,
    startHour: 8,
    endHour: 22,
    currentIntakeMl: 0,
    date: getLocalDateString(),
    drinkCount: 0,
});

export class WaterTrackingService {
    private static instance: WaterTrackingService;
    private responseSubscription: Notifications.Subscription | null = null;

    private constructor() {
        this.initializeInteractiveNotifications();
        this.setupActionListener();
    }

    private async initializeInteractiveNotifications() {
        try {
            const config = await this.getConfig();
            const language = await PlatformStorage.getItem(LANGUAGE_KEY);
            await this.setupInteractiveNotifications(config.mlPerSip, language === 'tr');
        } catch {
            await this.setupInteractiveNotifications();
        }
    }

    static getInstance(): WaterTrackingService {
        if (!WaterTrackingService.instance) {
            WaterTrackingService.instance = new WaterTrackingService();
        }
        return WaterTrackingService.instance;
    }

    private setupActionListener() {
        if (this.responseSubscription) {
            this.responseSubscription.remove();
            this.responseSubscription = null;
        }

        this.responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const action = response.actionIdentifier;
            const contentData = response.notification.request.content.data as { type?: string; mlAmount?: number } | undefined;
            if (contentData?.type !== 'water') return;

            if (action === 'drank_water') {
                const amount = Number(contentData?.mlAmount || 0);
                await this.drinkWater(amount > 0 ? amount : undefined);
            }
        });
    }

    async getConfig(): Promise<WaterConfig> {
        try {
            const stored = await PlatformStorage.getItem(WATER_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with default config to ensure all fields exist
                const config: WaterConfig = {
                    ...getDefaultConfig(),
                    ...parsed,
                };

                const today = getLocalDateString();
                
                // Also check if stored date format is old (Date().toDateString()) vs new (YYYY-MM-DD)
                // If it doesn't match `today` in either format, we reset it.
                
                if (config.date !== today && config.date !== new Date().toDateString()) {
                    // New day — reset intake
                    const newConfig = { ...config, currentIntakeMl: 0, drinkCount: 0, date: today };
                    await this.saveConfig(newConfig);
                    return newConfig;
                }
                
                // If it matches the old format but is today, just upgrade the format
                if (config.date === new Date().toDateString() && config.date !== today) {
                    const newConfig = { ...config, date: today };
                    await this.saveConfig(newConfig);
                    return newConfig;
                }

                return config;
            }
            return getDefaultConfig();
        } catch {
            return getDefaultConfig();
        }
    }

    async saveConfig(config: WaterConfig): Promise<void> {
        await PlatformStorage.setItem(WATER_KEY, JSON.stringify(config));
    }

    async drinkWater(mlAmount?: number): Promise<WaterConfig> {
        const config = await this.getConfig();
        const ml = mlAmount ?? config.mlPerSip;
        const updated = {
            ...config,
            currentIntakeMl: config.currentIntakeMl + ml,
            drinkCount: (config.drinkCount || 0) + 1,
        };
        await this.saveConfig(updated);
        this.syncToSupabase(updated);
        return updated;
    }

    async undoLastDrink(mlAmount?: number): Promise<WaterConfig> {
        const config = await this.getConfig();
        const ml = mlAmount ?? config.mlPerSip;
        const updated = {
            ...config,
            currentIntakeMl: Math.max(0, config.currentIntakeMl - ml),
            drinkCount: Math.max(0, (config.drinkCount || 0) - 1),
        };
        await this.saveConfig(updated);
        this.syncToSupabase(updated);
        return updated;
    }

    private async syncToSupabase(config: WaterConfig) {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Convert to YYYY-MM-DD for DB
            // config.date is "Mon Mar 15 2026" usually.
            // But we should use getLocalDateString() to be safe and consistent with DB format.
            const dateStr = getLocalDateString(new Date()); 
            
            await supabase.from('water_logs').upsert({
                user_id: user.id,
                date: dateStr,
                amount_ml: config.currentIntakeMl,
                goal_ml: config.dailyGoalLiters * 1000,
                drink_count: config.drinkCount,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,date' });
        } catch (err) { console.warn('Water sync error:', err); }
    }

    getStats(config: WaterConfig): WaterStats {
        const dailyGoalMl = config.dailyGoalLiters * 1000;
        const totalIntervals = Math.ceil(dailyGoalMl / config.mlPerSip);
        const wakeHours = config.endHour - config.startHour;
        const intervalMinutes = Math.floor((wakeHours * 60) / totalIntervals);

        const now = new Date();
        const currentMinutes = (now.getHours() - config.startHour) * 60 + now.getMinutes();
        const nextIntervalMinutes = Math.ceil(currentMinutes / intervalMinutes) * intervalMinutes;
        const nextHour = config.startHour + Math.floor(nextIntervalMinutes / 60);
        const nextMinute = nextIntervalMinutes % 60;

        let nextNotifTime: string | null = null;
        if (nextHour < config.endHour) {
            nextNotifTime = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
        }

        return {
            currentIntakeMl: config.currentIntakeMl,
            dailyGoalMl,
            percentage: (config.currentIntakeMl / dailyGoalMl) * 100,
            remainingMl: Math.max(0, dailyGoalMl - config.currentIntakeMl),
            notificationCount: totalIntervals,
            nextNotifTime,
            drinkCount: config.drinkCount || 0,
        };
    }

    async scheduleWaterNotifications(config: WaterConfig, gender: 'male' | 'female' | null, isTurkish: boolean): Promise<void> {
        try {
            await this.setupInteractiveNotifications(config.mlPerSip, isTurkish);
            // Cancel existing water notifications
            const storedIds = await PlatformStorage.getItem(WATER_NOTIF_KEY);
            if (storedIds) {
                const ids = JSON.parse(storedIds) as string[];
                for (const id of ids) {
                    await Notifications.cancelScheduledNotificationAsync(id);
                }
            }

            await Notifications.requestPermissionsAsync();

            const goalMl = config.dailyGoalLiters * 1000;
            const totalNotifs = Math.ceil(goalMl / config.mlPerSip);
            const wakeHours = config.endHour - config.startHour;
            const intervalMinutes = Math.floor((wakeHours * 60) / totalNotifs);

            const scheduledIds: string[] = [];

            for (let i = 0; i < totalNotifs; i++) {
                const minuteOffset = i * intervalMinutes;
                const hour = config.startHour + Math.floor(minuteOffset / 60);
                const minute = minuteOffset % 60;

                if (hour >= config.endHour) break;

                const messages = isTurkish
                    ? [
                        `Su içme zamanı! ${config.mlPerSip}ml iç — günlük hedefe doğru ilerle`,
                        `Vücudun su istiyor! Şimdi ${config.mlPerSip}ml iç`,
                        `Hidrasyon hatırlatıcısı: ${config.mlPerSip}ml su iç`,
                    ]
                    : [
                        `Time to drink water! Have ${config.mlPerSip}ml to reach your daily goal`,
                        `Your body needs water! Drink ${config.mlPerSip}ml now`,
                        `Hydration reminder: drink ${config.mlPerSip}ml of water`,
                    ];

                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: isTurkish ? 'Su İçme Zamanı' : 'Time to Drink Water',
                        body: messages[i % messages.length],
                        data: { type: 'water', mlAmount: config.mlPerSip },
                        categoryIdentifier: 'water_reminder',
                        ...(Platform.OS === 'android' ? { channelId: 'water' } : {}),
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DAILY,
                        hour,
                        minute,
                    },
                });
                scheduledIds.push(id);
            }

            await PlatformStorage.setItem(WATER_NOTIF_KEY, JSON.stringify(scheduledIds));
        } catch (err) {
            console.warn('Water notification scheduling failed:', err);
        }
    }

    async setupInteractiveNotifications(mlAmount: number = 250, isTurkish: boolean = true): Promise<void> {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('water', {
                name: isTurkish ? 'Su Takibi' : 'Water Tracking',
                importance: Notifications.AndroidImportance.HIGH,
                sound: 'default',
                vibrationPattern: [0, 250, 250, 250],
            });
        }

        const drinkLabel = isTurkish ? `Su İçtim (+${mlAmount}ml)` : `I Drank Water (+${mlAmount}ml)`;
        const skipLabel = isTurkish ? 'Atla' : 'Skip';

        await Notifications.setNotificationCategoryAsync('water_reminder', [
            {
                identifier: 'drank_water',
                buttonTitle: drinkLabel,
                options: { opensAppToForeground: false },
            },
            {
                identifier: 'skip_water',
                buttonTitle: skipLabel,
                options: { opensAppToForeground: false },
            },
        ]);
    }
}
