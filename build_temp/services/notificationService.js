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
exports.NotificationService = void 0;
const Notifications = __importStar(require("expo-notifications"));
const Device = __importStar(require("expo-device"));
const react_native_1 = require("react-native");
const LogManager_1 = require("../utils/LogManager");
const navigation_1 = require("../utils/navigation");
const i18n_1 = require("../locales/i18n");
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const waterTrackingService_1 = require("./waterTrackingService");
// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: () => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        });
    }),
});
const REMINDERS_STORAGE_KEY = 'nextself_scheduled_reminders';
class NotificationService {
    constructor() {
        this.responseListener = null;
        this.scheduledReminders = [];
        this.setupListeners();
        this.loadScheduledReminders();
    }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    loadScheduledReminders() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stored = yield platformStorage_1.default.getItem(REMINDERS_STORAGE_KEY);
                if (stored) {
                    this.scheduledReminders = JSON.parse(stored);
                }
            }
            catch (e) {
                console.error('Failed to load reminders', e);
            }
        });
    }
    saveScheduledReminders() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield platformStorage_1.default.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(this.scheduledReminders));
            }
            catch (e) {
                console.error('Failed to save reminders', e);
            }
        });
    }
    setupListeners() {
        // Clean up existing listener if any
        if (this.responseListener) {
            this.responseListener.remove();
        }
        // Handle user tapping on notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => __awaiter(this, void 0, void 0, function* () {
            if (response.actionIdentifier === 'drank_water') {
                const contentData = response.notification.request.content.data;
                if ((contentData === null || contentData === void 0 ? void 0 : contentData.type) === 'water') {
                    const amount = Number((contentData === null || contentData === void 0 ? void 0 : contentData.mlAmount) || 0);
                    yield waterTrackingService_1.WaterTrackingService.getInstance().drinkWater(amount > 0 ? amount : undefined);
                    return;
                }
            }
            const data = response.notification.request.content.data;
            if (data === null || data === void 0 ? void 0 : data.screen) {
                (0, navigation_1.navigate)(data.screen, data);
            }
        }));
    }
    // Request permissions for notifications
    requestPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Device.isDevice) {
                // LogManager.getInstance().info('Must use physical device for Push Notifications');
                // Allow simulator testing for now
                // return false; 
            }
            const { status: existingStatus } = yield Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = yield Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                LogManager_1.LogManager.getInstance().warn('Failed to get push token for push notification!');
                return false;
            }
            if (react_native_1.Platform.OS === 'android') {
                yield Notifications.setNotificationChannelAsync('default', {
                    name: 'Default',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
                yield Notifications.setNotificationChannelAsync('workout', {
                    name: 'Workouts',
                    importance: Notifications.AndroidImportance.HIGH,
                    sound: 'default',
                    vibrationPattern: [0, 500, 200, 500],
                });
                yield Notifications.setNotificationChannelAsync('nutrition', {
                    name: 'Nutrition',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    sound: 'default',
                });
                yield Notifications.setNotificationChannelAsync('supplement', {
                    name: 'Supplements',
                    importance: Notifications.AndroidImportance.HIGH,
                    sound: 'default',
                });
                yield Notifications.setNotificationChannelAsync('health', {
                    name: 'Health Alerts',
                    importance: Notifications.AndroidImportance.HIGH,
                    sound: 'default',
                });
                yield Notifications.setNotificationChannelAsync('water', {
                    name: 'Water Tracking',
                    importance: Notifications.AndroidImportance.HIGH,
                    sound: 'default',
                });
            }
            const savedLanguage = (yield platformStorage_1.default.getItem('nextself_language'));
            yield this.setupWaterActions(savedLanguage || 'en');
            return true;
        });
    }
    // Schedule a daily reminder with localization support
    scheduleSmartReminder(type_1, hour_1, minute_1, identifier_1, screen_1, params_1) {
        return __awaiter(this, arguments, void 0, function* (type, hour, minute, identifier, screen, params, language = 'en', translationParams, weekday) {
            // Validate time
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                console.warn(`Invalid time for reminder: ${hour}:${minute}`);
                return '';
            }
            if (weekday !== undefined && (weekday < 1 || weekday > 7)) {
                console.warn(`Invalid weekday for reminder: ${weekday}`);
                return '';
            }
            const channelId = type === 'water' ? 'water' : type;
            // Get translated title and body based on type
            let title = '';
            let body = '';
            const t = i18n_1.translations[language];
            switch (type) {
                case 'workout':
                    title = t.workout_time_title;
                    body = t.workout_time_body;
                    break;
                case 'nutrition':
                    title = t.meal_time_title;
                    body = t.meal_time_body;
                    break;
                case 'supplement':
                    title = t.supplement_time_title;
                    body = t.supplement_time_body;
                    // Allow overriding body for specific supplements
                    if (translationParams && translationParams.name) {
                        body = t.time_to_take.replace('{name}', translationParams.name);
                    }
                    break;
                case 'water':
                    title = t.hydration_title;
                    body = t.hydration_body;
                    break;
                default:
                    title = 'NextSelf Reminder';
                    body = 'Time to check your progress!';
            }
            // Apply generic interpolation if needed (though specific logic above is better for now)
            if (translationParams) {
                Object.entries(translationParams).forEach(([key, value]) => {
                    title = title.replace(`{${key}}`, value);
                    body = body.replace(`{${key}}`, value);
                });
            }
            // Cancel existing if any with same identifier
            yield this.cancelNotification(identifier);
            // Update internal state
            const existingIndex = this.scheduledReminders.findIndex(r => r.identifier === identifier);
            const reminder = { type, hour, minute, weekday, identifier, screen, params, channelId, translationParams };
            if (existingIndex >= 0) {
                this.scheduledReminders[existingIndex] = reminder;
            }
            else {
                this.scheduledReminders.push(reminder);
            }
            yield this.saveScheduledReminders();
            let notificationParams = params;
            if (type === 'water') {
                const waterConfig = yield waterTrackingService_1.WaterTrackingService.getInstance().getConfig();
                const mlAmount = waterConfig.mlPerSip || 250;
                yield this.setupWaterActions(language, mlAmount);
                notificationParams = Object.assign(Object.assign({}, params), { type: 'water', mlAmount });
            }
            const trigger = weekday === undefined
                ? {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute,
                }
                : {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday,
                    hour,
                    minute,
                };
            const id = yield Notifications.scheduleNotificationAsync({
                content: Object.assign(Object.assign({ title,
                    body, data: Object.assign({ identifier, screen: screen || identifier }, notificationParams), sound: true }, (type === 'water' ? { categoryIdentifier: 'water_reminder' } : {})), (react_native_1.Platform.OS === 'android' ? { channelId } : {})),
                trigger,
                identifier,
            });
            return id;
        });
    }
    // Reschedule all reminders with new language
    rescheduleAll(language) {
        return __awaiter(this, void 0, void 0, function* () {
            const reminders = [...this.scheduledReminders];
            // We don't clear the list because scheduleSmartReminder will update it
            // But we need to make sure we don't duplicate logic.
            // scheduleSmartReminder updates the list, so iterating over a copy is safe.
            for (const reminder of reminders) {
                yield this.scheduleSmartReminder(reminder.type, reminder.hour, reminder.minute, reminder.identifier, reminder.screen, reminder.params, language, reminder.translationParams, reminder.weekday);
            }
        });
    }
    // Check health data and trigger smart reminders if needed
    checkSmartReminders(healthData_1) {
        return __awaiter(this, arguments, void 0, function* (healthData, language = 'en') {
            const t = i18n_1.translations[language];
            const now = new Date();
            const hour = now.getHours();
            // 1. Hydration Check (e.g. at 2 PM)
            // Goal: 2000ml by end of day. By 2 PM should be around 1000ml?
            if (hour >= 14 && hour < 15) {
                if (healthData.water < 1000) {
                    yield this.triggerLocalNotification(t.hydration_title, t.hydration_body || "You haven't reached your hydration goal for 2 PM, drink water!", 'water_alert');
                }
            }
            // 2. Activity Check (Evening)
            if (hour >= 18 && hour < 20) {
                if (healthData.steps < 5000) {
                    yield this.triggerLocalNotification(t.getActivity, t.lowActivity.replace('{steps}', healthData.steps.toString()), 'activity_alert');
                }
            }
            // 3. Sleep Check (Morning)
            if (hour >= 8 && hour < 10) {
                if (healthData.sleepHours > 0 && healthData.sleepHours < 6) {
                    yield this.triggerLocalNotification(t.sleepAlert, t.lowSleep.replace('{hours}', healthData.sleepHours.toFixed(1)), 'sleep_alert');
                    yield this.triggerLocalNotification(t.hormonalAlert, t.hormonalImpact, 'hormonal_alert');
                    if (healthData.heartRate >= 85) {
                        yield this.triggerLocalNotification(t.stressHigh, t.stressElevated, 'stress_alert');
                    }
                }
                else if (healthData.sleepHours >= 7.5) {
                    yield this.triggerLocalNotification(t.sleepAlert, t.greatSleep.replace('{hours}', healthData.sleepHours.toFixed(1)), 'great_sleep_alert');
                }
            }
        });
    }
    triggerLocalNotification(title, body, identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent duplicate notifications for the same day
            const id = `${identifier}_${new Date().toDateString()}`;
            // Check if already scheduled/sent (not easy with expo without storage, but we can try-catch or just overwrite)
            // For simplicity, we just send. The daily check logic in caller should prevent spam.
            yield Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                },
                trigger: null, // Immediate
                identifier: id
            });
        });
    }
    setupWaterActions() {
        return __awaiter(this, arguments, void 0, function* (language = 'en', mlAmount = 250) {
            const isTurkish = language === 'tr';
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
    // Auto-Sync: Cancel old and schedule new based on program
    syncRemindersWithProgram(program, language) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Cancel old reminders by type
            if (program.workouts)
                yield this.cancelRemindersByType('workout');
            if (program.meals)
                yield this.cancelRemindersByType('nutrition');
            if (program.supplements)
                yield this.cancelRemindersByType('supplement');
            // 2. Schedule new ones
            if (program.workouts) {
                for (const w of program.workouts) {
                    // Parse time (HH:MM)
                    const [h, m] = w.time.split(':').map(Number);
                    // For now, schedule daily at this time if day matches today? 
                    // Or just schedule daily.
                    // Given "Auto-Sync", we assume these are recurring.
                    yield this.scheduleSmartReminder('workout', h, m, `workout_${w.id}`, 'Workout', { id: w.id }, language);
                }
            }
            if (program.meals) {
                for (const m of program.meals) {
                    const [h, min] = m.time.split(':').map(Number);
                    yield this.scheduleSmartReminder('nutrition', h, min, `meal_${m.id}`, 'Nutrition', { id: m.id }, language);
                }
            }
            if (program.supplements) {
                for (const s of program.supplements) {
                    const [h, min] = s.time.split(':').map(Number);
                    yield this.scheduleSmartReminder('supplement', h, min, `supp_${s.id}`, 'Supplement', { id: s.id, name: s.name }, language, { name: s.name });
                }
            }
        });
    }
    // Cancel a specific notification
    cancelNotification(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Notifications.cancelScheduledNotificationAsync(identifier);
            this.scheduledReminders = this.scheduledReminders.filter(r => r.identifier !== identifier);
            yield this.saveScheduledReminders();
        });
    }
    // Cancel all notifications
    cancelAllNotifications() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Notifications.cancelAllScheduledNotificationsAsync();
            this.scheduledReminders = [];
            yield this.saveScheduledReminders();
        });
    }
    // Cancel reminders by type
    cancelRemindersByType(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const toCancel = this.scheduledReminders.filter(r => r.type === type);
            for (const r of toCancel) {
                yield Notifications.cancelScheduledNotificationAsync(r.identifier);
            }
            this.scheduledReminders = this.scheduledReminders.filter(r => r.type !== type);
            yield this.saveScheduledReminders();
        });
    }
    // Get all scheduled notifications (useful for debugging/UI)
    getAllScheduledNotifications() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Notifications.getAllScheduledNotificationsAsync();
        });
    }
}
exports.NotificationService = NotificationService;
