import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import PlatformStorage from '../utils/platformStorage';

const WATER_KEY = 'biosync_water_tracking';
const WATER_NOTIF_KEY = 'biosync_water_notif_ids';

export interface WaterConfig {
    dailyGoalLiters: number;
    mlPerSip: number;
    startHour: number;
    endHour: number;
    currentIntakeMl: number;
    date: string;
}

export interface WaterStats {
    currentIntakeMl: number;
    dailyGoalMl: number;
    percentage: number;
    remainingMl: number;
    notificationCount: number;
    nextNotifTime: string | null;
}

const DEFAULT_CONFIG: WaterConfig = {
    dailyGoalLiters: 2.5,
    mlPerSip: 250,
    startHour: 8,
    endHour: 22,
    currentIntakeMl: 0,
    date: new Date().toDateString(),
};

export class WaterTrackingService {
    private static instance: WaterTrackingService;

    static getInstance(): WaterTrackingService {
        if (!WaterTrackingService.instance) {
            WaterTrackingService.instance = new WaterTrackingService();
        }
        return WaterTrackingService.instance;
    }

    async getConfig(): Promise<WaterConfig> {
        try {
            const stored = await PlatformStorage.getItem(WATER_KEY);
            if (stored) {
                const config = JSON.parse(stored) as WaterConfig;
                const today = new Date().toDateString();
                if (config.date !== today) {
                    // New day — reset intake
                    const newConfig = { ...config, currentIntakeMl: 0, date: today };
                    await this.saveConfig(newConfig);
                    return newConfig;
                }
                return config;
            }
            return DEFAULT_CONFIG;
        } catch {
            return DEFAULT_CONFIG;
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
        };
        await this.saveConfig(updated);
        return updated;
    }

    async undoLastDrink(mlAmount?: number): Promise<WaterConfig> {
        const config = await this.getConfig();
        const ml = mlAmount ?? config.mlPerSip;
        const updated = {
            ...config,
            currentIntakeMl: Math.max(0, config.currentIntakeMl - ml),
        };
        await this.saveConfig(updated);
        return updated;
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
        };
    }

    async scheduleWaterNotifications(config: WaterConfig, gender: 'male' | 'female' | null, isTurkish: boolean): Promise<void> {
        try {
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

    async setupInteractiveNotifications(): Promise<void> {
        await Notifications.setNotificationCategoryAsync('water_reminder', [
            {
                identifier: 'drank_water',
                buttonTitle: 'İçtim',
                options: { opensAppToForeground: false },
            },
            {
                identifier: 'skip_water',
                buttonTitle: 'Atla',
                options: { opensAppToForeground: false },
            },
        ]);
    }
}
