"use strict";
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
exports.HealthService = void 0;
const react_native_1 = require("react-native");
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const HEALTH_CACHE_KEY = 'NextSelf_health_cache';
const HEALTH_CONNECTED_KEY = 'NextSelf_health_connected';
const OFFLINE_QUEUE_KEY = 'NextSelf_offline_queue';
const HEALTH_CONNECT_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';
class HealthService {
    constructor() {
        this.isAppleConnected = false;
        this.isGoogleConnected = false;
        this.healthStreamTimers = new Set();
        this.workoutStreamTimers = new Set();
    }
    static getInstance() {
        if (!HealthService.instance) {
            HealthService.instance = new HealthService();
        }
        return HealthService.instance;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const stored = yield platformStorage_1.default.getItem(HEALTH_CONNECTED_KEY);
            if (stored) {
                const conn = JSON.parse(stored);
                this.isAppleConnected = (_a = conn.apple) !== null && _a !== void 0 ? _a : false;
                this.isGoogleConnected = (_b = conn.google) !== null && _b !== void 0 ? _b : false;
            }
        });
    }
    // Apple HealthKit Integration
    connectAppleHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            if (react_native_1.Platform.OS !== 'ios') {
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
                };
                return new Promise((resolve) => {
                    AppleHealthKit.initHealthKit(permissions, (error) => __awaiter(this, void 0, void 0, function* () {
                        if (error) {
                            resolve({ success: false, error });
                            return;
                        }
                        this.isAppleConnected = true;
                        yield platformStorage_1.default.setItem(HEALTH_CONNECTED_KEY, JSON.stringify({
                            apple: true,
                            google: this.isGoogleConnected,
                            connectedAt: new Date().toISOString(),
                        }));
                        resolve({ success: true });
                    }));
                });
            }
            catch (err) {
                console.error('Apple Health connection error:', err);
                return { success: false, error: err.message };
            }
        });
    }
    // Google Health Connect Integration
    connectGoogleHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            if (react_native_1.Platform.OS !== 'android') {
                return { success: false, error: 'Google Health is only available on Android' };
            }
            try {
                const { initialize, getSdkStatus, SdkAvailabilityStatus, getGrantedPermissions } = require('react-native-health-connect');
                // Check if Health Connect is available on device
                const sdkStatus = yield getSdkStatus();
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
                yield initialize();
                const grantedPermissions = yield getGrantedPermissions();
                if (!Array.isArray(grantedPermissions) || grantedPermissions.length === 0) {
                    return {
                        success: false,
                        error: 'Health Connect permissions are not granted yet.',
                        needsPermission: true,
                    };
                }
                this.isGoogleConnected = true;
                yield platformStorage_1.default.setItem(HEALTH_CONNECTED_KEY, JSON.stringify({
                    apple: this.isAppleConnected,
                    google: true,
                    connectedAt: new Date().toISOString(),
                }));
                return { success: true };
            }
            catch (err) {
                console.error('Google Health connection error:', err);
                const errorMsg = err.message || '';
                // If error looks like Health Connect not installed
                if (errorMsg.includes('not installed') || errorMsg.includes('not found') || errorMsg.includes('SDK')) {
                    return { success: false, error: err.message, needsInstall: true };
                }
                return { success: false, error: err.message };
            }
        });
    }
    openHealthConnectSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            if (react_native_1.Platform.OS !== 'android')
                return;
            try {
                const { openHealthConnectSettings } = require('react-native-health-connect');
                openHealthConnectSettings();
            }
            catch (_a) {
                yield this.openHealthConnectInstall();
            }
        });
    }
    // Open Health Connect install page on Play Store
    openHealthConnectInstall() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield react_native_1.Linking.openURL(HEALTH_CONNECT_PLAY_STORE_URL);
            }
            catch (_a) {
                // Fallback to market intent
                try {
                    yield react_native_1.Linking.openURL('market://details?id=com.google.android.apps.healthdata');
                }
                catch (_b) {
                    console.warn('Could not open Play Store');
                }
            }
        });
    }
    getConnectionStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const stored = yield platformStorage_1.default.getItem(HEALTH_CONNECTED_KEY);
            if (stored) {
                const conn = JSON.parse(stored);
                return { apple: (_a = conn.apple) !== null && _a !== void 0 ? _a : false, google: (_b = conn.google) !== null && _b !== void 0 ? _b : false };
            }
            return { apple: false, google: false };
        });
    }
    getTodayHealthData() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date().toDateString();
            try {
                // Refresh always if connected to avoid stale cached data
                const { apple, google } = yield this.getConnectionStatus();
                if (apple || google) {
                    const fresh = yield this.fetchFromHealthPlatform();
                    if (fresh) {
                        yield this.cacheHealthData(fresh);
                        return fresh;
                    }
                }
                // Try cache
                const cached = yield platformStorage_1.default.getItem(HEALTH_CACHE_KEY);
                if (cached) {
                    const data = JSON.parse(cached);
                    if (data.date === today) {
                        return data;
                    }
                }
                return this.getEmptyHealthData(today);
            }
            catch (err) {
                console.error('Health data error:', err);
                return this.getEmptyHealthData(today);
            }
        });
    }
    getWeeklyStepsData() {
        return __awaiter(this, void 0, void 0, function* () {
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
            const { apple, google } = yield this.getConnectionStatus();
            if (react_native_1.Platform.OS === 'ios' && apple) {
                try {
                    const AppleHealthKit = require('react-native-health').default;
                    const samples = yield new Promise((resolve) => {
                        if (!AppleHealthKit.getDailyStepCountSamples) {
                            resolve([]);
                            return;
                        }
                        AppleHealthKit.getDailyStepCountSamples({
                            startDate: startDate.toISOString(),
                            endDate: today.toISOString(),
                        }, (err, results) => {
                            if (err || !Array.isArray(results))
                                resolve([]);
                            else
                                resolve(results);
                        });
                    });
                    const totalsByDay = new Map();
                    dayKeys.forEach((key) => totalsByDay.set(key, 0));
                    for (const sample of samples) {
                        const key = new Date((sample === null || sample === void 0 ? void 0 : sample.startDate) || (sample === null || sample === void 0 ? void 0 : sample.date) || Date.now()).toDateString();
                        const value = Number((sample === null || sample === void 0 ? void 0 : sample.value) || 0);
                        if (!Number.isFinite(value) || !totalsByDay.has(key))
                            continue;
                        totalsByDay.set(key, Math.max(0, Math.round(value)));
                    }
                    return dayKeys.map((key) => totalsByDay.get(key) || 0);
                }
                catch (_a) {
                    return zeroed;
                }
            }
            if (react_native_1.Platform.OS === 'android' && google) {
                try {
                    const { readRecords } = require('react-native-health-connect');
                    const stepRecords = yield readRecords('Steps', {
                        timeRangeFilter: {
                            operator: 'between',
                            startTime: startDate.toISOString(),
                            endTime: today.toISOString(),
                        },
                    });
                    const totalsByDay = new Map();
                    dayKeys.forEach((key) => totalsByDay.set(key, 0));
                    for (const record of (stepRecords === null || stepRecords === void 0 ? void 0 : stepRecords.records) || []) {
                        const key = new Date((record === null || record === void 0 ? void 0 : record.startTime) || (record === null || record === void 0 ? void 0 : record.endTime) || Date.now()).toDateString();
                        const value = Number((record === null || record === void 0 ? void 0 : record.count) || 0);
                        if (!Number.isFinite(value) || !totalsByDay.has(key))
                            continue;
                        totalsByDay.set(key, (totalsByDay.get(key) || 0) + Math.max(0, Math.round(value)));
                    }
                    return dayKeys.map((key) => totalsByDay.get(key) || 0);
                }
                catch (_b) {
                    return zeroed;
                }
            }
            const current = yield this.getTodayHealthData();
            const fallback = [...zeroed];
            fallback[fallback.length - 1] = Math.max(0, Math.round(Number(current.steps || 0)));
            return fallback;
        });
    }
    getWeeklySleepData() {
        return __awaiter(this, void 0, void 0, function* () {
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
            const { apple, google } = yield this.getConnectionStatus();
            if (react_native_1.Platform.OS === 'ios' && apple) {
                try {
                    const AppleHealthKit = require('react-native-health').default;
                    const samples = yield new Promise((resolve) => {
                        if (!AppleHealthKit.getSleepSamples) {
                            resolve([]);
                            return;
                        }
                        AppleHealthKit.getSleepSamples({ startDate: startDate.toISOString(), endDate: today.toISOString() }, (err, results) => {
                            if (err || !Array.isArray(results))
                                resolve([]);
                            else
                                resolve(results);
                        });
                    });
                    const totalsByDay = new Map();
                    dayKeys.forEach((key) => totalsByDay.set(key, 0));
                    for (const sample of samples) {
                        const start = new Date((sample === null || sample === void 0 ? void 0 : sample.startDate) || (sample === null || sample === void 0 ? void 0 : sample.start) || 0).getTime();
                        const end = new Date((sample === null || sample === void 0 ? void 0 : sample.endDate) || (sample === null || sample === void 0 ? void 0 : sample.end) || 0).getTime();
                        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
                            continue;
                        const key = new Date(end).toDateString();
                        if (!totalsByDay.has(key))
                            continue;
                        const hours = (end - start) / (1000 * 60 * 60);
                        totalsByDay.set(key, (totalsByDay.get(key) || 0) + hours);
                    }
                    return dayKeys.map((key) => Number((totalsByDay.get(key) || 0).toFixed(2)));
                }
                catch (_a) {
                    return zeroed;
                }
            }
            if (react_native_1.Platform.OS === 'android' && google) {
                try {
                    const { readRecords } = require('react-native-health-connect');
                    const sleepRecords = yield readRecords('SleepSession', {
                        timeRangeFilter: {
                            operator: 'between',
                            startTime: startDate.toISOString(),
                            endTime: today.toISOString(),
                        },
                    });
                    const totalsByDay = new Map();
                    dayKeys.forEach((key) => totalsByDay.set(key, 0));
                    for (const record of (sleepRecords === null || sleepRecords === void 0 ? void 0 : sleepRecords.records) || []) {
                        const start = new Date((record === null || record === void 0 ? void 0 : record.startTime) || 0).getTime();
                        const end = new Date((record === null || record === void 0 ? void 0 : record.endTime) || 0).getTime();
                        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
                            continue;
                        const key = new Date(end).toDateString();
                        if (!totalsByDay.has(key))
                            continue;
                        const hours = (end - start) / (1000 * 60 * 60);
                        totalsByDay.set(key, (totalsByDay.get(key) || 0) + hours);
                    }
                    return dayKeys.map((key) => Number((totalsByDay.get(key) || 0).toFixed(2)));
                }
                catch (_b) {
                    return zeroed;
                }
            }
            const current = yield this.getTodayHealthData();
            const fallback = [...zeroed];
            fallback[fallback.length - 1] = Number((current.sleepHours || 0).toFixed(2));
            return fallback;
        });
    }
    fetchFromHealthPlatform() {
        return __awaiter(this, void 0, void 0, function* () {
            const { apple, google } = yield this.getConnectionStatus();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (react_native_1.Platform.OS === 'ios' && apple) {
                try {
                    const AppleHealthKit = require('react-native-health').default;
                    const getSteps = () => new Promise((resolve) => {
                        AppleHealthKit.getStepCount({ date: today.toISOString() }, (err, results) => {
                            if (err)
                                resolve(0);
                            else
                                resolve(results.value || 0);
                        });
                    });
                    const getWater = () => new Promise((resolve) => {
                        if (AppleHealthKit.getWater) {
                            AppleHealthKit.getWater({ date: today.toISOString() }, (err, results) => {
                                if (err)
                                    resolve(0);
                                else
                                    resolve((results.value || 0) * 1000); // L -> ml
                            });
                        }
                        else
                            resolve(0);
                    });
                    const getSleepHours = () => new Promise((resolve) => {
                        if (!AppleHealthKit.getSleepSamples) {
                            resolve(0);
                            return;
                        }
                        AppleHealthKit.getSleepSamples({
                            startDate: today.toISOString(),
                            endDate: new Date().toISOString(),
                        }, (err, results) => {
                            if (err || !Array.isArray(results)) {
                                resolve(0);
                                return;
                            }
                            const totalHours = results.reduce((sum, sample) => {
                                const start = new Date((sample === null || sample === void 0 ? void 0 : sample.startDate) || (sample === null || sample === void 0 ? void 0 : sample.start) || 0).getTime();
                                const end = new Date((sample === null || sample === void 0 ? void 0 : sample.endDate) || (sample === null || sample === void 0 ? void 0 : sample.end) || 0).getTime();
                                if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
                                    return sum;
                                return sum + (end - start) / (1000 * 60 * 60);
                            }, 0);
                            resolve(Number.isFinite(totalHours) ? totalHours : 0);
                        });
                    });
                    const getLatestHeartRate = () => new Promise((resolve) => {
                        if (!AppleHealthKit.getHeartRateSamples) {
                            resolve(0);
                            return;
                        }
                        AppleHealthKit.getHeartRateSamples({
                            startDate: today.toISOString(),
                            endDate: new Date().toISOString(),
                        }, (err, results) => {
                            if (err || !Array.isArray(results) || results.length === 0) {
                                resolve(0);
                                return;
                            }
                            const latestSample = [...results].sort((a, b) => {
                                const aTs = new Date((a === null || a === void 0 ? void 0 : a.endDate) || (a === null || a === void 0 ? void 0 : a.startDate) || 0).getTime();
                                const bTs = new Date((b === null || b === void 0 ? void 0 : b.endDate) || (b === null || b === void 0 ? void 0 : b.startDate) || 0).getTime();
                                return bTs - aTs;
                            })[0];
                            const value = Number((latestSample === null || latestSample === void 0 ? void 0 : latestSample.value) || 0);
                            resolve(Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0);
                        });
                    });
                    const getCalories = () => new Promise((resolve) => {
                        if (!AppleHealthKit.getActiveEnergyBurned) {
                            resolve(0);
                            return;
                        }
                        AppleHealthKit.getActiveEnergyBurned({
                            startDate: today.toISOString(),
                            endDate: new Date().toISOString(),
                        }, (err, results) => {
                            if (err || !Array.isArray(results)) {
                                resolve(0);
                                return;
                            }
                            const total = results.reduce((sum, sample) => {
                                const value = Number((sample === null || sample === void 0 ? void 0 : sample.value) || 0);
                                return sum + (Number.isFinite(value) ? value : 0);
                            }, 0);
                            resolve(Math.max(0, Math.round(total)));
                        });
                    });
                    const getActiveMinutes = () => new Promise((resolve) => {
                        if (!AppleHealthKit.getAppleExerciseTime) {
                            resolve(0);
                            return;
                        }
                        AppleHealthKit.getAppleExerciseTime({
                            startDate: today.toISOString(),
                            endDate: new Date().toISOString(),
                        }, (err, results) => {
                            if (err || !Array.isArray(results)) {
                                resolve(0);
                                return;
                            }
                            const totalMinutes = results.reduce((sum, sample) => {
                                const value = Number((sample === null || sample === void 0 ? void 0 : sample.value) || 0);
                                return sum + (Number.isFinite(value) ? value : 0);
                            }, 0);
                            resolve(Math.max(0, Math.round(totalMinutes)));
                        });
                    });
                    const [steps, water, sleepHours, heartRate, calories, activeMinutes] = yield Promise.all([
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
                }
                catch (err) {
                    console.warn(err);
                }
            }
            if (react_native_1.Platform.OS === 'android' && google) {
                try {
                    const { readRecords } = require('react-native-health-connect');
                    const end = new Date();
                    const start = new Date(today); // midnight
                    const [stepRecords, hydrationRecords, heartRateRecords, calorieRecords, sleepRecords, exerciseRecords] = yield Promise.all([
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
                    const totalWaterLiters = ((hydrationRecords === null || hydrationRecords === void 0 ? void 0 : hydrationRecords.records) || []).reduce((acc, cur) => { var _a; return acc + (((_a = cur === null || cur === void 0 ? void 0 : cur.volume) === null || _a === void 0 ? void 0 : _a.inLiters) || 0); }, 0);
                    const totalSteps = ((stepRecords === null || stepRecords === void 0 ? void 0 : stepRecords.records) || []).reduce((acc, cur) => acc + ((cur === null || cur === void 0 ? void 0 : cur.count) || 0), 0);
                    const latestHeartRate = ((heartRateRecords === null || heartRateRecords === void 0 ? void 0 : heartRateRecords.records) || [])
                        .flatMap((record) => Array.isArray(record === null || record === void 0 ? void 0 : record.samples) ? record.samples : [])
                        .sort((a, b) => {
                        const aTs = new Date((a === null || a === void 0 ? void 0 : a.time) || (a === null || a === void 0 ? void 0 : a.startTime) || 0).getTime();
                        const bTs = new Date((b === null || b === void 0 ? void 0 : b.time) || (b === null || b === void 0 ? void 0 : b.startTime) || 0).getTime();
                        return bTs - aTs;
                    })[0];
                    const heartRate = Number((latestHeartRate === null || latestHeartRate === void 0 ? void 0 : latestHeartRate.beatsPerMinute) || 0);
                    const totalCalories = ((calorieRecords === null || calorieRecords === void 0 ? void 0 : calorieRecords.records) || []).reduce((acc, cur) => {
                        var _a, _b, _c, _d;
                        const value = Number((_d = (_b = (_a = cur === null || cur === void 0 ? void 0 : cur.energy) === null || _a === void 0 ? void 0 : _a.inKilocalories) !== null && _b !== void 0 ? _b : (_c = cur === null || cur === void 0 ? void 0 : cur.energy) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0);
                        return acc + (Number.isFinite(value) ? value : 0);
                    }, 0);
                    const totalSleepHours = ((sleepRecords === null || sleepRecords === void 0 ? void 0 : sleepRecords.records) || []).reduce((acc, cur) => {
                        const startTs = new Date((cur === null || cur === void 0 ? void 0 : cur.startTime) || 0).getTime();
                        const endTs = new Date((cur === null || cur === void 0 ? void 0 : cur.endTime) || 0).getTime();
                        if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs)
                            return acc;
                        return acc + (endTs - startTs) / (1000 * 60 * 60);
                    }, 0);
                    const totalActiveMinutes = ((exerciseRecords === null || exerciseRecords === void 0 ? void 0 : exerciseRecords.records) || []).reduce((acc, cur) => {
                        const startTs = new Date((cur === null || cur === void 0 ? void 0 : cur.startTime) || 0).getTime();
                        const endTs = new Date((cur === null || cur === void 0 ? void 0 : cur.endTime) || 0).getTime();
                        if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs)
                            return acc;
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
                }
                catch (err) {
                    console.warn(err);
                }
            }
            return null;
        });
    }
    /**
     * Fetch the user's latest recorded weight from Apple Health / Google Health Connect.
     * Scans the past 30 days to find the most recent valid log.
     */
    fetchLatestWeight() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const { apple, google } = yield this.getConnectionStatus();
            if (!apple && !google)
                return null;
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30); // Look back 30 days
            if (react_native_1.Platform.OS === 'ios' && apple) {
                try {
                    const AppleHealthKit = require('react-native-health').default;
                    return new Promise((resolve) => {
                        AppleHealthKit.getLatestWeight({ startDate: startDate.toISOString() }, (err, results) => {
                            if (err || !results || typeof results.value !== 'number') {
                                resolve(null);
                            }
                            else {
                                resolve({
                                    weight: results.value, // Note: may need Kg conversion if not returned in Kg
                                    date: new Date(results.startDate || Date.now()).toISOString(),
                                    source: 'apple_health'
                                });
                            }
                        });
                    });
                }
                catch (err) {
                    console.warn('Apple Health fetch weight error:', err);
                }
            }
            if (react_native_1.Platform.OS === 'android' && google) {
                try {
                    const { readRecords } = require('react-native-health-connect');
                    const [weightRecords, bodyFatRecords, leanMassRecords] = yield Promise.all([
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
                    if (weightRecords && weightRecords.records && weightRecords.records.length > 0) {
                        // Find the most recent record
                        const latest = weightRecords.records.reduce((prev, current) => {
                            return (new Date(prev.time) > new Date(current.time)) ? prev : current;
                        });
                        const latestBodyFat = ((bodyFatRecords === null || bodyFatRecords === void 0 ? void 0 : bodyFatRecords.records) || []).reduce((prev, current) => {
                            if (!prev)
                                return current;
                            return (new Date(prev.time) > new Date(current.time)) ? prev : current;
                        }, null);
                        const latestLeanMass = ((leanMassRecords === null || leanMassRecords === void 0 ? void 0 : leanMassRecords.records) || []).reduce((prev, current) => {
                            if (!prev)
                                return current;
                            return (new Date(prev.time) > new Date(current.time)) ? prev : current;
                        }, null);
                        return {
                            weight: latest.weight.inKilograms,
                            date: latest.time,
                            source: 'google_health',
                            bodyFat: Number.isFinite(Number((_a = latestBodyFat === null || latestBodyFat === void 0 ? void 0 : latestBodyFat.percentage) === null || _a === void 0 ? void 0 : _a.value)) ? Number((_b = latestBodyFat === null || latestBodyFat === void 0 ? void 0 : latestBodyFat.percentage) === null || _b === void 0 ? void 0 : _b.value) : undefined,
                            muscleMass: Number.isFinite(Number((_c = latestLeanMass === null || latestLeanMass === void 0 ? void 0 : latestLeanMass.mass) === null || _c === void 0 ? void 0 : _c.inKilograms)) ? Number((_d = latestLeanMass === null || latestLeanMass === void 0 ? void 0 : latestLeanMass.mass) === null || _d === void 0 ? void 0 : _d.inKilograms) : undefined,
                        };
                    }
                }
                catch (err) {
                    console.warn('Google Connect fetch weight error:', err);
                }
            }
            return null;
        });
    }
    cacheHealthData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield platformStorage_1.default.setItem(HEALTH_CACHE_KEY, JSON.stringify(data));
            // Add to offline queue for sync
            yield this.addToOfflineQueue(data);
        });
    }
    addToOfflineQueue(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const stored = yield platformStorage_1.default.getItem(OFFLINE_QUEUE_KEY);
            const queue = stored ? JSON.parse(stored) : [];
            queue.push({ data, timestamp: new Date().toISOString(), synced: false });
            // Keep only last 100 entries
            if (queue.length > 100)
                queue.splice(0, queue.length - 100);
            yield platformStorage_1.default.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        });
    }
    // Last-write-wins conflict resolution
    syncOfflineQueue(supabaseClient, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const stored = yield platformStorage_1.default.getItem(OFFLINE_QUEUE_KEY);
            if (!stored)
                return;
            const queue = JSON.parse(stored);
            const unsynced = queue.filter((item) => !item.synced);
            for (const item of unsynced) {
                try {
                    const { error } = yield supabaseClient
                        .from('health_records')
                        .upsert(Object.assign(Object.assign({ user_id: userId }, item.data), { recorded_at: item.timestamp }), { onConflict: 'user_id,date' }); // Last write wins
                    if (!error)
                        item.synced = true;
                }
                catch (err) {
                    console.warn('Sync failed for item:', err);
                }
            }
            yield platformStorage_1.default.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        });
    }
    getEmptyHealthData(date) {
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
    generateHealthInsights(data, gender) {
        const insights = [];
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
            }
            else if (data.sleepHours >= 7 && data.sleepHours <= 9) {
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
    updateManualData(field, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getTodayHealthData();
            const updated = Object.assign(Object.assign({}, data), { [field]: value, source: 'manual' });
            yield this.cacheHealthData(updated);
            return updated;
        });
    }
    getWorkoutLiveMetrics(startTime) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { apple, google } = yield this.getConnectionStatus();
            if (react_native_1.Platform.OS === 'ios' && apple) {
                try {
                    const AppleHealthKit = require('react-native-health').default;
                    const startDate = startTime.toISOString();
                    const endDate = new Date().toISOString();
                    const heartRateSamples = yield new Promise((resolve) => {
                        AppleHealthKit.getHeartRateSamples({ startDate, endDate }, (err, results) => {
                            if (err || !Array.isArray(results))
                                resolve([]);
                            else
                                resolve(results);
                        });
                    });
                    const energySamples = yield new Promise((resolve) => {
                        AppleHealthKit.getActiveEnergyBurned({ startDate, endDate }, (err, results) => {
                            if (err || !Array.isArray(results))
                                resolve([]);
                            else
                                resolve(results);
                        });
                    });
                    const latestHrSample = [...heartRateSamples]
                        .sort((a, b) => new Date(b.endDate || b.startDate || 0).getTime() - new Date(a.endDate || a.startDate || 0).getTime())[0];
                    const heartRate = latestHrSample && Number.isFinite(Number(latestHrSample.value))
                        ? Math.round(Number(latestHrSample.value))
                        : null;
                    const calories = energySamples.reduce((sum, sample) => {
                        const value = Number((sample === null || sample === void 0 ? void 0 : sample.value) || 0);
                        return sum + (Number.isFinite(value) ? value : 0);
                    }, 0);
                    return {
                        heartRate,
                        calories: Math.max(0, Math.round(calories)),
                        source: 'apple_health',
                    };
                }
                catch (_b) {
                    return null;
                }
            }
            if (react_native_1.Platform.OS === 'android' && google) {
                try {
                    const { readRecords } = require('react-native-health-connect');
                    const startIso = startTime.toISOString();
                    const endIso = new Date().toISOString();
                    const [heartRateRecords, calorieRecords] = yield Promise.all([
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
                    const heartRateSamples = (heartRateRecords === null || heartRateRecords === void 0 ? void 0 : heartRateRecords.records) || [];
                    const latestHr = [...heartRateSamples]
                        .sort((a, b) => new Date(b.endTime || b.startTime || 0).getTime() - new Date(a.endTime || a.startTime || 0).getTime())[0];
                    const latestHrSample = (_a = latestHr === null || latestHr === void 0 ? void 0 : latestHr.samples) === null || _a === void 0 ? void 0 : _a[latestHr.samples.length - 1];
                    const heartRate = latestHrSample && Number.isFinite(Number(latestHrSample.beatsPerMinute))
                        ? Math.round(Number(latestHrSample.beatsPerMinute))
                        : null;
                    const calories = ((calorieRecords === null || calorieRecords === void 0 ? void 0 : calorieRecords.records) || []).reduce((sum, record) => {
                        var _a, _b, _c, _d;
                        const value = Number((_d = (_b = (_a = record === null || record === void 0 ? void 0 : record.energy) === null || _a === void 0 ? void 0 : _a.inKilocalories) !== null && _b !== void 0 ? _b : (_c = record === null || record === void 0 ? void 0 : record.energy) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0);
                        return sum + (Number.isFinite(value) ? value : 0);
                    }, 0);
                    return {
                        heartRate,
                        calories: Math.max(0, Math.round(calories)),
                        source: 'google_health',
                    };
                }
                catch (_c) {
                    return null;
                }
            }
            return null;
        });
    }
    startHealthDataStream(onData, options) {
        var _a, _b, _c;
        const intervalMs = Math.max(3000, (_a = options === null || options === void 0 ? void 0 : options.intervalMs) !== null && _a !== void 0 ? _a : 15000);
        const includeWeeklySteps = (_b = options === null || options === void 0 ? void 0 : options.includeWeeklySteps) !== null && _b !== void 0 ? _b : true;
        const includeWeeklySleep = (_c = options === null || options === void 0 ? void 0 : options.includeWeeklySleep) !== null && _c !== void 0 ? _c : true;
        let active = true;
        let isFetching = false;
        const emit = () => __awaiter(this, void 0, void 0, function* () {
            if (!active || isFetching)
                return;
            isFetching = true;
            try {
                const healthData = yield this.getTodayHealthData();
                const weeklySteps = includeWeeklySteps ? yield this.getWeeklyStepsData() : Array(7).fill(0);
                const weeklySleepHours = includeWeeklySleep ? yield this.getWeeklySleepData() : Array(7).fill(0);
                if (!active)
                    return;
                onData({ healthData, weeklySteps, weeklySleepHours });
            }
            catch (error) {
                console.error('Health stream emit error:', error);
            }
            finally {
                isFetching = false;
            }
        });
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
    startWorkoutMetricsStream(startTime, onMetrics, options) {
        var _a;
        const intervalMs = Math.max(1000, (_a = options === null || options === void 0 ? void 0 : options.intervalMs) !== null && _a !== void 0 ? _a : 5000);
        let active = true;
        let isFetching = false;
        let lastSignature = null;
        const emit = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!active || isFetching)
                return;
            isFetching = true;
            try {
                const metrics = yield this.getWorkoutLiveMetrics(startTime);
                if (!active || !metrics)
                    return;
                const signature = `${metrics.source}|${(_a = metrics.heartRate) !== null && _a !== void 0 ? _a : 'null'}|${metrics.calories}`;
                if (signature !== lastSignature) {
                    lastSignature = signature;
                    onMetrics(metrics);
                }
            }
            catch (error) {
                console.error('Workout stream emit error:', error);
            }
            finally {
                isFetching = false;
            }
        });
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
    saveWater(amountMl) {
        return __awaiter(this, void 0, void 0, function* () {
            const { apple, google } = yield this.getConnectionStatus();
            if (!apple && !google)
                return false;
            if (react_native_1.Platform.OS === 'ios' && apple) {
                const AppleHealthKit = require('react-native-health').default;
                return new Promise((resolve) => {
                    // HealthKit expects liters
                    AppleHealthKit.saveWater({ value: amountMl / 1000 }, (err) => {
                        if (err) {
                            console.error('Error saving water to HealthKit:', err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                });
            }
            if (react_native_1.Platform.OS === 'android' && google) {
                try {
                    const { insertRecords } = require('react-native-health-connect');
                    const now = new Date();
                    const endTime = now.toISOString();
                    const startTime = new Date(now.getTime() - 1000).toISOString(); // 1 second duration
                    yield insertRecords([{
                            recordType: 'Hydration',
                            volume: { value: amountMl / 1000, unit: 'liters' },
                            startTime,
                            endTime,
                        }]);
                    return true;
                }
                catch (err) {
                    console.error('Error saving water to Health Connect:', err);
                    return false;
                }
            }
            return false;
        });
    }
    saveCalories(calories) {
        return __awaiter(this, void 0, void 0, function* () {
            const { apple, google } = yield this.getConnectionStatus();
            if (!apple && !google)
                return false;
            const now = new Date();
            const endTime = now.toISOString();
            const startTime = new Date(now.getTime() - 60 * 1000).toISOString(); // 1 minute duration
            if (react_native_1.Platform.OS === 'ios' && apple) {
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
                        AppleHealthKit.saveActiveEnergyBurned(options, (err) => {
                            if (err) {
                                console.error('Error saving calories to HealthKit', err);
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }
                    else {
                        resolve(false);
                    }
                });
            }
            if (react_native_1.Platform.OS === 'android' && google) {
                try {
                    const { insertRecords } = require('react-native-health-connect');
                    yield insertRecords([{
                            recordType: 'ActiveCaloriesBurned',
                            energy: { value: calories, unit: 'kilocalories' },
                            startTime,
                            endTime,
                        }]);
                    return true;
                }
                catch (err) {
                    console.error('Error saving calories to Health Connect', err);
                    return false;
                }
            }
            return false;
        });
    }
    saveSleep(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const { apple, google } = yield this.getConnectionStatus();
            if (!apple && !google)
                return false;
            if (react_native_1.Platform.OS === 'ios' && apple) {
                const AppleHealthKit = require('react-native-health').default;
                return new Promise((resolve) => {
                    const options = {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        value: 'ASLEEP' // or 'INBED'
                    };
                    AppleHealthKit.saveSleep(options, (err) => {
                        if (err) {
                            console.error('Error saving sleep to HealthKit', err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                });
            }
            if (react_native_1.Platform.OS === 'android' && google) {
                try {
                    const { insertRecords } = require('react-native-health-connect');
                    yield insertRecords([{
                            recordType: 'SleepSession',
                            startTime: startDate.toISOString(),
                            endTime: endDate.toISOString(),
                        }]);
                    return true;
                }
                catch (err) {
                    console.error('Error saving sleep to Health Connect', err);
                    return false;
                }
            }
            return false;
        });
    }
}
exports.HealthService = HealthService;
