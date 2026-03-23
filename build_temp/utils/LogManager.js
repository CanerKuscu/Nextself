"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogManager = void 0;
class LogManager {
    constructor() {
        this.responseTimes = [];
        this.successCount = 0;
        this.failureCount = 0;
        this.tokenUsage = 0;
    }
    static getInstance() {
        if (!LogManager.instance) {
            LogManager.instance = new LogManager();
        }
        return LogManager.instance;
    }
    info(message, data) {
        if (__DEV__) {
            console.log(`[INFO] ${message}`, data || '');
        }
        // In production, we could send this to a logging service
    }
    warn(message, data) {
        if (__DEV__) {
            console.warn(`[WARN] ${message}`, data || '');
        }
        this.logFailure(); // Count as a failure/issue
    }
    error(message, error) {
        if (__DEV__) {
            console.error(`[ERROR] ${message}`, error || '');
        }
        this.logFailure();
        // In production, send to Sentry/Bugsnag
    }
    logResponseTime(time) {
        this.responseTimes.push(time);
        if (this.responseTimes.length > 100) {
            this.responseTimes.shift(); // Keep the last 100 response times
        }
    }
    logSuccess() {
        this.successCount++;
    }
    logFailure() {
        this.failureCount++;
    }
    logTokenUsage(tokens) {
        this.tokenUsage += tokens;
    }
    getAverageResponseTime() {
        const total = this.responseTimes.reduce((sum, time) => sum + time, 0);
        return this.responseTimes.length ? total / this.responseTimes.length : 0;
    }
    getSuccessRate() {
        const total = this.successCount + this.failureCount;
        return total ? (this.successCount / total) * 100 : 0;
    }
    getFailureRate() {
        const total = this.successCount + this.failureCount;
        return total ? (this.failureCount / total) * 100 : 0;
    }
    getTotalTokenUsage() {
        return this.tokenUsage;
    }
}
exports.LogManager = LogManager;
