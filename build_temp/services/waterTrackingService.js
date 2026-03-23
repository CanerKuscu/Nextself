"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterTrackingService = void 0;
const Notifications = __importStar(require("expo-notifications"));
const react_native_1 = require("react-native");
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const supabase_1 = require("./supabase");
const dateUtils_1 = require("../utils/dateUtils");
const WATER_KEY = 'nextself_water_tracking';
const WATER_NOTIF_KEY = 'nextself_water_notif_ids';
const LANGUAGE_KEY = 'nextself_language';
const DEFAULT_CONFIG = {
    dailyGoalLiters: 2.5,
    mlPerSip: 250,
    startHour: 8,
    endHour: 22,
    currentIntakeMl: 0,
    date: new Date().toDateString(),
    drinkCount: 0,
};
class WaterTrackingService {
    constructor() {
        this.responseSubscription = null;
        this.initializeInteractiveNotifications();
        this.setupActionListener();
    }
    initializeInteractiveNotifications() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const config = yield this.getConfig();
                const language = yield platformStorage_1.default.getItem(LANGUAGE_KEY);
                yield this.setupInteractiveNotifications(config.mlPerSip, language === 'tr');
            }
            catch (_a) {
                yield this.setupInteractiveNotifications();
            }
        });
    }
    static getInstance() {
        if (!WaterTrackingService.instance) {
            WaterTrackingService.instance = new WaterTrackingService();
        }
        return WaterTrackingService.instance;
    }
    setupActionListener() {
        if (this.responseSubscription) {
            this.responseSubscription.remove();
            this.responseSubscription = null;
        }
        this.responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => __awaiter(this, void 0, void 0, function* () {
            const action = response.actionIdentifier;
            const contentData = response.notification.request.content.data;
            if ((contentData === null || contentData === void 0 ? void 0 : contentData.type) !== 'water')
                return;
            if (action === 'drank_water') {
                const amount = Number((contentData === null || contentData === void 0 ? void 0 : contentData.mlAmount) || 0);
                yield this.drinkWater(amount > 0 ? amount : undefined);
            }
        }));
    }
    getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stored = yield platformStorage_1.default.getItem(WATER_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Merge with default config to ensure all fields exist
                    const config = Object.assign(Object.assign({}, DEFAULT_CONFIG), parsed);
                    const today = new Date().toDateString();
                    // Also check if stored date format is old (Date().toDateString()) vs new (YYYY-MM-DD) if we change it.
                    // But let's stick to toDateString() for now to avoid breaking existing logic unless we migrate fully.
                    if (config.date !== today) {
                        // New day — reset intake
                        const newConfig = Object.assign(Object.assign({}, config), { currentIntakeMl: 0, drinkCount: 0, date: today });
                        yield this.saveConfig(newConfig);
                        return newConfig;
                    }
                    return config;
                }
                return DEFAULT_CONFIG;
            }
            catch (_a) {
                return DEFAULT_CONFIG;
            }
        });
    }
    saveConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            yield platformStorage_1.default.setItem(WATER_KEY, JSON.stringify(config));
        });
    }
    drinkWater(mlAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.getConfig();
            const ml = mlAmount !== null && mlAmount !== void 0 ? mlAmount : config.mlPerSip;
            const updated = Object.assign(Object.assign({}, config), { currentIntakeMl: config.currentIntakeMl + ml, drinkCount: (config.drinkCount || 0) + 1 });
            yield this.saveConfig(updated);
            this.syncToSupabase(updated);
            return updated;
        });
    }
    undoLastDrink(mlAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.getConfig();
            const ml = mlAmount !== null && mlAmount !== void 0 ? mlAmount : config.mlPerSip;
            const updated = Object.assign(Object.assign({}, config), { currentIntakeMl: Math.max(0, config.currentIntakeMl - ml), drinkCount: Math.max(0, (config.drinkCount || 0) - 1) });
            yield this.saveConfig(updated);
            this.syncToSupabase(updated);
            return updated;
        });
    }
    syncToSupabase(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const { data: { user } } = yield supabase.auth.getUser();
                if (!user)
                    return;
                // Convert to YYYY-MM-DD for DB
                // config.date is "Mon Mar 15 2026" usually.
                // But we should use getLocalDateString() to be safe and consistent with DB format.
                const dateStr = (0, dateUtils_1.getLocalDateString)(new Date());
                yield supabase.from('water_logs').upsert({
                    user_id: user.id,
                    date: dateStr,
                    amount_ml: config.currentIntakeMl,
                    goal_ml: config.dailyGoalLiters * 1000,
                    drink_count: config.drinkCount,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,date' });
            }
            catch (err) {
                console.warn('Water sync error:', err);
            }
        });
    }
    getStats(config) {
        const dailyGoalMl = config.dailyGoalLiters * 1000;
        const totalIntervals = Math.ceil(dailyGoalMl / config.mlPerSip);
        const wakeHours = config.endHour - config.startHour;
        const intervalMinutes = Math.floor((wakeHours * 60) / totalIntervals);
        const now = new Date();
        const currentMinutes = (now.getHours() - config.startHour) * 60 + now.getMinutes();
        const nextIntervalMinutes = Math.ceil(currentMinutes / intervalMinutes) * intervalMinutes;
        const nextHour = config.startHour + Math.floor(nextIntervalMinutes / 60);
        const nextMinute = nextIntervalMinutes % 60;
        let nextNotifTime = null;
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
    scheduleWaterNotifications(config, gender, isTurkish) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.setupInteractiveNotifications(config.mlPerSip, isTurkish);
                // Cancel existing water notifications
                const storedIds = yield platformStorage_1.default.getItem(WATER_NOTIF_KEY);
                if (storedIds) {
                    const ids = JSON.parse(storedIds);
                    for (const id of ids) {
                        yield Notifications.cancelScheduledNotificationAsync(id);
                    }
                }
                yield Notifications.requestPermissionsAsync();
                const goalMl = config.dailyGoalLiters * 1000;
                const totalNotifs = Math.ceil(goalMl / config.mlPerSip);
                const wakeHours = config.endHour - config.startHour;
                const intervalMinutes = Math.floor((wakeHours * 60) / totalNotifs);
                const scheduledIds = [];
                for (let i = 0; i < totalNotifs; i++) {
                    const minuteOffset = i * intervalMinutes;
                    const hour = config.startHour + Math.floor(minuteOffset / 60);
                    const minute = minuteOffset % 60;
                    if (hour >= config.endHour)
                        break;
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
                    const id = yield Notifications.scheduleNotificationAsync({
                        content: Object.assign({ title: isTurkish ? 'Su İçme Zamanı' : 'Time to Drink Water', body: messages[i % messages.length], data: { type: 'water', mlAmount: config.mlPerSip }, categoryIdentifier: 'water_reminder' }, (react_native_1.Platform.OS === 'android' ? { channelId: 'water' } : {})),
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DAILY,
                            hour,
                            minute,
                        },
                    });
                    scheduledIds.push(id);
                }
                yield platformStorage_1.default.setItem(WATER_NOTIF_KEY, JSON.stringify(scheduledIds));
            }
            catch (err) {
                console.warn('Water notification scheduling failed:', err);
            }
        });
    }
    setupInteractiveNotifications() {
        return __awaiter(this, arguments, void 0, function* (mlAmount = 250, isTurkish = true) {
            if (react_native_1.Platform.OS === 'android') {
                yield Notifications.setNotificationChannelAsync('water', {
                    name: isTurkish ? 'Su Takibi' : 'Water Tracking',
                    importance: Notifications.AndroidImportance.HIGH,
                    sound: 'default',
                    vibrationPattern: [0, 250, 250, 250],
                });
            }
            const drinkLabel = isTurkish ? `Su İçtim (+${mlAmount}ml)` : `I Drank Water (+${mlAmount}ml)`;
            const skipLabel = isTurkish ? 'Atla' : 'Skip';
            yield Notifications.setNotificationCategoryAsync('water_reminder', [
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
        });
    }
}
exports.WaterTrackingService = WaterTrackingService;
