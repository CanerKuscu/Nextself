import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export class CalendarService {
  private static instance: CalendarService;
  private defaultCalendarId: string | null = null;

  private constructor() {}

  public static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  public async requestPermissions(): Promise<boolean> {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  }

  private async getDefaultCalendarId(): Promise<string | null> {
    if (this.defaultCalendarId) return this.defaultCalendarId;

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      if (Platform.OS === 'ios') {
        const defaultCalendar = calendars.find(c => c.isPrimary);
        if (defaultCalendar) {
          this.defaultCalendarId = defaultCalendar.id;
          return defaultCalendar.id;
        }
      } else {
        const defaultCalendar = calendars.find(c => c.isPrimary && c.allowsModifications);
        if (defaultCalendar) {
          this.defaultCalendarId = defaultCalendar.id;
          return defaultCalendar.id;
        }
      }

      // If no default found, use the first one that allows modifications
      const writableCalendar = calendars.find(c => c.allowsModifications);
      if (writableCalendar) {
        this.defaultCalendarId = writableCalendar.id;
        return writableCalendar.id;
      }

      // If absolutely no calendar found, we might need to create one (mostly Android)
      if (Platform.OS === 'android') {
        const newCalendarId = await this.createNextSelfCalendar();
        this.defaultCalendarId = newCalendarId;
        return newCalendarId;
      }

      return null;
    } catch (error) {
      console.error('Error getting default calendar:', error);
      return null;
    }
  }

  private async createNextSelfCalendar(): Promise<string | null> {
    try {
      const newCalendarID = await Calendar.createCalendarAsync({
        title: 'NextSelf Tracker',
        color: '#3b82f6',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: 'default',
        source: {
          isLocalAccount: true,
          name: 'NextSelf',
          type: 'LOCAL',
        },
        name: 'NextSelfTracker',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
      return newCalendarID;
    } catch (error) {
      console.error('Failed to create NextSelf calendar', error);
      return null;
    }
  }

  public async syncEventToCalendar(title: string, startDate: Date, endDate: Date, notes?: string): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const calendarId = await this.getDefaultCalendarId();
    if (!calendarId) return null;

    try {
      const eventId = await Calendar.createEventAsync(calendarId, {
        title,
        startDate,
        endDate,
        notes: notes || 'Scheduled via NextSelf App',
        timeZone: 'GMT',
        alarms: [{ relativeOffset: -15, method: Calendar.AlarmMethod.ALERT }],
      });
      return eventId;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return null;
    }
  }

  public async removeEvent(eventId: string): Promise<void> {
    try {
      await Calendar.deleteEventAsync(eventId);
    } catch (error) {
      console.error('Failed to remove event:', error);
    }
  }
}
