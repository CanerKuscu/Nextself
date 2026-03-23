export class LogManager {
    private static instance: LogManager;
    private responseTimes: number[] = [];
    private successCount: number = 0;
    private failureCount: number = 0;
    private tokenUsage: number = 0;

    private constructor() { }

    static getInstance(): LogManager {
        if (!LogManager.instance) {
            LogManager.instance = new LogManager();
        }
        return LogManager.instance;
    }

    info(message: string, data?: any): void {
        if (__DEV__) {
            console.log(`[INFO] ${message}`, data || '');
        }
        // In production, we could send this to a logging service
    }

    warn(message: string, data?: any): void {
        if (__DEV__) {
            console.warn(`[WARN] ${message}`, data || '');
        }
        this.logFailure(); // Count as a failure/issue
    }

    error(message: string, error?: any): void {
        if (__DEV__) {
            console.error(`[ERROR] ${message}`, error || '');
        }
        this.logFailure();
        // In production, send to Sentry/Bugsnag
    }

    logResponseTime(time: number): void {
        this.responseTimes.push(time);
        if (this.responseTimes.length > 100) {
            this.responseTimes.shift(); // Keep the last 100 response times
        }
    }

    logSuccess(): void {
        this.successCount++;
    }

    logFailure(): void {
        this.failureCount++;
    }

    logTokenUsage(tokens: number): void {
        this.tokenUsage += tokens;
    }

    getAverageResponseTime(): number {
        const total = this.responseTimes.reduce((sum, time) => sum + time, 0);
        return this.responseTimes.length ? total / this.responseTimes.length : 0;
    }

    getSuccessRate(): number {
        const total = this.successCount + this.failureCount;
        return total ? (this.successCount / total) * 100 : 0;
    }

    getFailureRate(): number {
        const total = this.successCount + this.failureCount;
        return total ? (this.failureCount / total) * 100 : 0;
    }

    getTotalTokenUsage(): number {
        return this.tokenUsage;
    }
}