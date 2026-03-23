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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const Calendar = __importStar(require("expo-calendar"));
const react_native_1 = require("react-native");
class CalendarService {
    constructor() {
        this.defaultCalendarId = null;
    }
    static getInstance() {
        if (!CalendarService.instance) {
            CalendarService.instance = new CalendarService();
        }
        return CalendarService.instance;
    }
    requestPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            const { status } = yield Calendar.requestCalendarPermissionsAsync();
            return status === 'granted';
        });
    }
    getDefaultCalendarId() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.defaultCalendarId)
                return this.defaultCalendarId;
            try {
                const calendars = yield Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
                if (react_native_1.Platform.OS === 'ios') {
                    const defaultCalendar = calendars.find(c => c.isPrimary);
                    if (defaultCalendar) {
                        this.defaultCalendarId = defaultCalendar.id;
                        return defaultCalendar.id;
                    }
                }
                else {
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
                if (react_native_1.Platform.OS === 'android') {
                    const newCalendarId = yield this.createNextSelfCalendar();
                    this.defaultCalendarId = newCalendarId;
                    return newCalendarId;
                }
                return null;
            }
            catch (error) {
                console.error('Error getting default calendar:', error);
                return null;
            }
        });
    }
    createNextSelfCalendar() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newCalendarID = yield Calendar.createCalendarAsync({
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
            }
            catch (error) {
                console.error('Failed to create NextSelf calendar', error);
                return null;
            }
        });
    }
    syncEventToCalendar(title, startDate, endDate, notes) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasPermission = yield this.requestPermissions();
            if (!hasPermission)
                return null;
            const calendarId = yield this.getDefaultCalendarId();
            if (!calendarId)
                return null;
            try {
                const eventId = yield Calendar.createEventAsync(calendarId, {
                    title,
                    startDate,
                    endDate,
                    notes: notes || 'Scheduled via NextSelf App',
                    timeZone: 'GMT',
                    alarms: [{ relativeOffset: -15, method: Calendar.AlarmMethod.ALERT }],
                });
                return eventId;
            }
            catch (error) {
                console.error('Failed to create calendar event:', error);
                return null;
            }
        });
    }
    removeEvent(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Calendar.deleteEventAsync(eventId);
            }
            catch (error) {
                console.error('Failed to remove event:', error);
            }
        });
    }
}
exports.CalendarService = CalendarService;
