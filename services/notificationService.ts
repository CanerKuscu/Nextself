import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { LogManager } from '../utils/LogManager';
import { navigate } from '../utils/navigation';
import { translations, Language } from '../locales/i18n';
import PlatformStorage from '@nextself/shared';
import { HealthData } from './healthService';
import { WaterTrackingService } from './waterTrackingService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type ReminderType = 'workout' | 'nutrition' | 'supplement' | 'water' | 'health';

interface ScheduledReminder {
   type: ReminderType;
   hour: number;
   minute: number;
   weekday?: number;
   identifier: string;
   screen?: string;
   params?: any;
   channelId: string;
   translationParams?: Record<string, string>;
 }

const REMINDERS_STORAGE_KEY = 'nextself_scheduled_reminders';

export class NotificationService {
  private static instance: NotificationService;
  private responseListener: Notifications.Subscription | null = null;
  private scheduledReminders: ScheduledReminder[] = [];

  private constructor() {
    this.setupListeners();
    this.loadScheduledReminders();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async loadScheduledReminders() {
    try {
      const stored = await PlatformStorage.getItem(REMINDERS_STORAGE_KEY);
      if (stored) {
        this.scheduledReminders = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load reminders', e);
    }
  }

  private async saveScheduledReminders() {
    try {
      await PlatformStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(this.scheduledReminders));
    } catch (e) {
      console.error('Failed to save reminders', e);
    }
  }

  private setupListeners() {
    // Clean up existing listener if any
    if (this.responseListener) {
      this.responseListener.remove();
    }

    // Handle user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(async response => {
      if (response.actionIdentifier === 'drank_water') {
        const contentData = response.notification.request.content.data as { type?: string; mlAmount?: number } | undefined;
        if (contentData?.type === 'water') {
          const amount = Number(contentData?.mlAmount || 0);
          await WaterTrackingService.getInstance().drinkWater(amount > 0 ? amount : undefined);
          return;
        }
      }

      const data = response.notification.request.content.data;
      if (data?.screen) {
        navigate(data.screen as string, data);
      }
    });
  }

  // Request permissions for notifications
  public async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      // LogManager.getInstance().info('Must use physical device for Push Notifications');
      // Allow simulator testing for now
      // return false; 
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      LogManager.getInstance().warn('Failed to get push token for push notification!');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      await Notifications.setNotificationChannelAsync('workout', {
        name: 'Workouts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 500, 200, 500],
      });
      await Notifications.setNotificationChannelAsync('nutrition', {
        name: 'Nutrition',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('supplement', {
        name: 'Supplements',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('health', {
        name: 'Health Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('water', {
        name: 'Water Tracking',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    const savedLanguage = (await PlatformStorage.getItem('nextself_language')) as Language | null;
    await this.setupWaterActions(savedLanguage || 'en');

    return true;
  }

  // Schedule a daily reminder with localization support
   public async scheduleSmartReminder(
     type: ReminderType,
     hour: number, 
     minute: number, 
     identifier: string, 
     screen?: string, 
     params?: any,
     language: Language = 'en',
     translationParams?: Record<string, string>,
     weekday?: number
   ): Promise<string> {
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
     
     const t = translations[language];
 
     switch(type) {
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
     await this.cancelNotification(identifier);
 
     // Update internal state
     const existingIndex = this.scheduledReminders.findIndex(r => r.identifier === identifier);
     const reminder: ScheduledReminder = { type, hour, minute, weekday, identifier, screen, params, channelId, translationParams };
     
     if (existingIndex >= 0) {
       this.scheduledReminders[existingIndex] = reminder;
     } else {
       this.scheduledReminders.push(reminder);
     }
     await this.saveScheduledReminders();
 
    let notificationParams = params;
    if (type === 'water') {
      const waterConfig = await WaterTrackingService.getInstance().getConfig();
      const mlAmount = waterConfig.mlPerSip || 250;
      await this.setupWaterActions(language, mlAmount);
      notificationParams = { ...params, type: 'water', mlAmount };
    }

    const trigger: Notifications.NotificationTriggerInput = weekday === undefined
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY as Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY as Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        };

     const id = await Notifications.scheduleNotificationAsync({
       content: {
         title,
         body,
         data: { identifier, screen: screen || identifier, ...notificationParams },
         sound: true,
         ...(type === 'water' ? { categoryIdentifier: 'water_reminder' } : {}),
         ...(Platform.OS === 'android' ? { channelId } : {}),
       },
       trigger,
       identifier,
     });
 
     return id;
   }

  // Reschedule all reminders with new language
   public async rescheduleAll(language: Language): Promise<void> {
     const reminders = [...this.scheduledReminders];
     // We don't clear the list because scheduleSmartReminder will update it
     // But we need to make sure we don't duplicate logic.
     // scheduleSmartReminder updates the list, so iterating over a copy is safe.
     
     for (const reminder of reminders) {
       await this.scheduleSmartReminder(
         reminder.type,
         reminder.hour,
         reminder.minute,
         reminder.identifier,
         reminder.screen,
         reminder.params,
         language,
        reminder.translationParams,
        reminder.weekday
       );
     }
   }

  // Check health data and trigger smart reminders if needed
  public async checkSmartReminders(healthData: HealthData, language: Language = 'en'): Promise<void> {
    const t = translations[language];
    const now = new Date();
    const hour = now.getHours();

    // 1. Hydration Check (e.g. at 2 PM)
    // Goal: 2000ml by end of day. By 2 PM should be around 1000ml?
    if (hour >= 14 && hour < 15) {
      if (healthData.water < 1000) {
        await this.triggerLocalNotification(
            t.hydration_title, 
            t.hydration_body || "You haven't reached your hydration goal for 2 PM, drink water!", 
            'water_alert'
        );
      }
    }

    // 2. Activity Check (Evening)
    if (hour >= 18 && hour < 20) {
      if (healthData.steps < 5000) {
        await this.triggerLocalNotification(
            t.getActivity, 
            t.lowActivity.replace('{steps}', healthData.steps.toString()), 
            'activity_alert'
        );
      }
    }

    // 3. Sleep Check (Morning)
    if (hour >= 8 && hour < 10) {
        if (healthData.sleepHours > 0 && healthData.sleepHours < 6) {
             await this.triggerLocalNotification(
                t.sleepAlert,
                t.lowSleep.replace('{hours}', healthData.sleepHours.toFixed(1)),
                'sleep_alert'
             );
             await this.triggerLocalNotification(
                t.hormonalAlert,
                t.hormonalImpact,
                'hormonal_alert'
             );
             if (healthData.heartRate >= 85) {
                await this.triggerLocalNotification(
                  t.stressHigh,
                  t.stressElevated,
                  'stress_alert'
                );
             }
        } else if (healthData.sleepHours >= 7.5) {
             await this.triggerLocalNotification(
                t.sleepAlert,
                t.greatSleep.replace('{hours}', healthData.sleepHours.toFixed(1)),
                'great_sleep_alert'
             );
        }
    }
  }

  private async triggerLocalNotification(title: string, body: string, identifier: string) {
      // Prevent duplicate notifications for the same day
      const id = `${identifier}_${new Date().toDateString()}`;
      
      // Check if already scheduled/sent (not easy with expo without storage, but we can try-catch or just overwrite)
      // For simplicity, we just send. The daily check logic in caller should prevent spam.
      
      await Notifications.scheduleNotificationAsync({
          content: {
              title,
              body,
              sound: true,
          },
          trigger: null, // Immediate
          identifier: id
      });
  }

  private async setupWaterActions(language: Language = 'en', mlAmount: number = 250): Promise<void> {
    const isTurkish = language === 'tr';
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

  // Auto-Sync: Cancel old and schedule new based on program
  public async syncRemindersWithProgram(
    program: {
      workouts?: { day: string, time: string, id: string }[],
      meals?: { time: string, id: string, name: string }[],
      supplements?: { time: string, id: string, name: string }[]
    },
    language: Language
  ) {
    // 1. Cancel old reminders by type
    if (program.workouts) await this.cancelRemindersByType('workout');
    if (program.meals) await this.cancelRemindersByType('nutrition');
    if (program.supplements) await this.cancelRemindersByType('supplement');

    // 2. Schedule new ones
    if (program.workouts) {
      for (const w of program.workouts) {
         // Parse time (HH:MM)
         const [h, m] = w.time.split(':').map(Number);
         // For now, schedule daily at this time if day matches today? 
         // Or just schedule daily.
         // Given "Auto-Sync", we assume these are recurring.
         await this.scheduleSmartReminder('workout', h, m, `workout_${w.id}`, 'Workout', { id: w.id }, language);
      }
    }
    
    if (program.meals) {
        for (const m of program.meals) {
            const [h, min] = m.time.split(':').map(Number);
            await this.scheduleSmartReminder('nutrition', h, min, `meal_${m.id}`, 'Nutrition', { id: m.id }, language);
        }
    }

    if (program.supplements) {
        for (const s of program.supplements) {
            const [h, min] = s.time.split(':').map(Number);
            await this.scheduleSmartReminder('supplement', h, min, `supp_${s.id}`, 'Supplement', { id: s.id, name: s.name }, language, { name: s.name });
        }
    }
  }

  // Cancel a specific notification
  public async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    this.scheduledReminders = this.scheduledReminders.filter(r => r.identifier !== identifier);
    await this.saveScheduledReminders();
  }

  // Cancel all notifications
  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledReminders = [];
    await this.saveScheduledReminders();
  }

  // Cancel reminders by type
  public async cancelRemindersByType(type: ReminderType): Promise<void> {
    const toCancel = this.scheduledReminders.filter(r => r.type === type);
    for (const r of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(r.identifier);
    }
    this.scheduledReminders = this.scheduledReminders.filter(r => r.type !== type);
    await this.saveScheduledReminders();
  }

  // Get all scheduled notifications (useful for debugging/UI)
  public async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}
