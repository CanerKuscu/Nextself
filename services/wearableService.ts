import { Platform } from 'react-native';
import { SupabaseService } from './supabase';

const supabase = SupabaseService.getInstance().getClient();

export interface HealthData {
    steps: number;
    calories: number;
    distance: number;
    heartRate: number;
    sleepHours: number;
    waterIntake: number;
    weight: number;
    bloodPressure?: {
        systolic: number;
        diastolic: number;
    };
    bloodGlucose?: number;
    oxygenSaturation?: number;
    timestamp: string;
}

export interface WearableDevice {
    id: string;
    name: string;
    type: 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'samsung_health' | 'huawei_health';
    connected: boolean;
    lastSync: string;
    permissions: string[];
}

export class WearableService {
    private static instance: WearableService;
    private healthKitAvailable: boolean = false;
    private googleFitAvailable: boolean = false;
    private fitbitAvailable: boolean = false;

    private constructor() {
        this.init();
    }

    public static getInstance(): WearableService {
        if (!WearableService.instance) {
            WearableService.instance = new WearableService();
        }
        return WearableService.instance;
    }

    private async init() {
        // Check platform and available services
        await this.checkAvailableServices();
    }

    private async checkAvailableServices() {
        try {
            // Check for Apple HealthKit (iOS)
            if (Platform.OS === 'ios') {
                const { isAvailable } = require('react-native-health').default;
                this.healthKitAvailable = await isAvailable();
            }

            // Check for Google Fit (Android)
            if (Platform.OS === 'android') {
                // Google Fit availability check would go here
                this.googleFitAvailable = true; // Placeholder
            }

            // Check for Fitbit
            this.fitbitAvailable = false; // Would require OAuth setup
        } catch (error) {
            console.error('Error checking wearable services:', error);
        }
    }

    /**
     * Get available wearable devices for the platform
     */
    public getAvailableDevices(): WearableDevice[] {
        const devices: WearableDevice[] = [];

        if (Platform.OS === 'ios' && this.healthKitAvailable) {
            devices.push({
                id: 'apple_health',
                name: 'Apple Health',
                type: 'apple_health',
                connected: false,
                lastSync: '',
                permissions: ['steps', 'calories', 'heartRate', 'sleep', 'weight']
            });
        }

        if (Platform.OS === 'android' && this.googleFitAvailable) {
            devices.push({
                id: 'google_fit',
                name: 'Google Fit',
                type: 'google_fit',
                connected: false,
                lastSync: '',
                permissions: ['steps', 'calories', 'distance', 'heartRate', 'weight']
            });
        }

        // Always available (manual entry)
        devices.push({
            id: 'manual',
            name: 'Manual Entry',
            type: 'apple_health', // Placeholder
            connected: true,
            lastSync: new Date().toISOString(),
            permissions: ['steps', 'calories', 'distance', 'heartRate', 'sleep', 'water', 'weight']
        });

        return devices;
    }

    /**
     * Connect to a wearable device
     */
    public async connectDevice(deviceId: string): Promise<boolean> {
        try {
            switch (deviceId) {
                case 'apple_health':
                    return await this.connectAppleHealth();
                case 'google_fit':
                    return await this.connectGoogleFit();
                case 'fitbit':
                    return await this.connectFitbit();
                default:
                    return true; // Manual entry is always connected
            }
        } catch (error) {
            console.error(`Error connecting to device ${deviceId}:`, error);
            return false;
        }
    }

    /**
     * Connect to Apple HealthKit
     */
    private async connectAppleHealth(): Promise<boolean> {
        if (Platform.OS !== 'ios' || !this.healthKitAvailable) {
            return false;
        }

        try {
            const HealthKit = require('react-native-health').default;

            // Request permissions
            const permissions = {
                permissions: {
                    read: [
                        'Steps',
                        'ActiveEnergyBurned',
                        'DistanceWalkingRunning',
                        'HeartRate',
                        'SleepAnalysis',
                        'BodyMass',
                        'BloodPressureSystolic',
                        'BloodPressureDiastolic',
                        'BloodGlucose',
                        'OxygenSaturation'
                    ],
                    write: [
                        'Steps',
                        'ActiveEnergyBurned',
                        'DistanceWalkingRunning',
                        'HeartRate',
                        'SleepAnalysis',
                        'BodyMass'
                    ]
                }
            };

            const authStatus = await HealthKit.initHealthKit(permissions);
            return authStatus !== 'Error';
        } catch (error) {
            console.error('Error connecting to Apple Health:', error);
            return false;
        }
    }

    /**
     * Connect to Google Fit
     */
    private async connectGoogleFit(): Promise<boolean> {
        if (Platform.OS !== 'android') {
            return false;
        }

        try {
            // Google Fit connection logic would go here
            // This is a placeholder implementation
            return true;
        } catch (error) {
            console.error('Error connecting to Google Fit:', error);
            return false;
        }
    }

    /**
     * Connect to Fitbit
     */
    private async connectFitbit(): Promise<boolean> {
        try {
            // Fitbit OAuth connection would go here
            return false; // Not implemented yet
        } catch (error) {
            console.error('Error connecting to Fitbit:', error);
            return false;
        }
    }

    /**
     * Sync health data from connected devices
     */
    public async syncHealthData(userId: string, startDate: Date, endDate: Date): Promise<HealthData[]> {
        const healthData: HealthData[] = [];

        try {
            // Sync from Apple Health
            if (this.healthKitAvailable) {
                const appleHealthData = await this.syncAppleHealthData(startDate, endDate);
                healthData.push(...appleHealthData);
            }

            // Sync from Google Fit
            if (this.googleFitAvailable) {
                const googleFitData = await this.syncGoogleFitData(startDate, endDate);
                healthData.push(...googleFitData);
            }

            // Save to database
            if (healthData.length > 0) {
                await this.saveHealthDataToDB(userId, healthData);
            }

            return healthData;
        } catch (error) {
            console.error('Error syncing health data:', error);
            return healthData;
        }
    }

    /**
     * Sync data from Apple HealthKit
     */
    private async syncAppleHealthData(startDate: Date, endDate: Date): Promise<HealthData[]> {
        if (Platform.OS !== 'ios' || !this.healthKitAvailable) {
            return [];
        }

        try {
            const HealthKit = require('react-native-health').default;
            const healthData: HealthData[] = [];

            // Get steps
            const steps = await HealthKit.getDailyStepCountSamples({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            // Get calories
            const calories = await HealthKit.getActiveEnergyBurned({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            // Get distance
            const distance = await HealthKit.getDistanceWalkingRunning({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            // Get heart rate
            const heartRate = await HealthKit.getHeartRateSamples({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            // Get sleep
            const sleep = await HealthKit.getSleepSamples({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            // Get weight
            const weight = await HealthKit.getBodyMassSamples({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            // Process and combine data
            // This is a simplified example - real implementation would need to align timestamps
            if (steps.length > 0) {
                healthData.push({
                    steps: steps[0].value || 0,
                    calories: calories[0]?.value || 0,
                    distance: distance[0]?.value || 0,
                    heartRate: heartRate[0]?.value || 0,
                    sleepHours: sleep[0]?.value || 0,
                    waterIntake: 0, // Apple Health doesn't track water by default
                    weight: weight[0]?.value || 0,
                    timestamp: new Date().toISOString()
                });
            }

            return healthData;
        } catch (error) {
            console.error('Error syncing Apple Health data:', error);
            return [];
        }
    }

    /**
     * Sync data from Google Fit
     */
    private async syncGoogleFitData(startDate: Date, endDate: Date): Promise<HealthData[]> {
        if (Platform.OS !== 'android') {
            return [];
        }

        try {
            // Google Fit data retrieval would go here
            // This is a placeholder implementation
            return [{
                steps: 0,
                calories: 0,
                distance: 0,
                heartRate: 0,
                sleepHours: 0,
                waterIntake: 0,
                weight: 0,
                timestamp: new Date().toISOString()
            }];
        } catch (error) {
            console.error('Error syncing Google Fit data:', error);
            return [];
        }
    }

    /**
     * Save health data to database
     */
    private async saveHealthDataToDB(userId: string, healthData: HealthData[]): Promise<void> {
        try {
            for (const data of healthData) {
                const { error } = await supabase
                    .from('health_data')
                    .insert({
                        user_id: userId,
                        ...data,
                        source: 'wearable',
                        synced_at: new Date().toISOString()
                    });

                if (error) {
                    console.error('Error saving health data:', error);
                }
            }
        } catch (error) {
            console.error('Error saving health data to DB:', error);
        }
    }

    /**
     * Get user's health data from database
     */
    public async getHealthData(userId: string, startDate: Date, endDate: Date): Promise<HealthData[]> {
        try {
            const { data, error } = await supabase
                .from('health_data')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting health data:', error);
            return [];
        }
    }

    /**
     * Get daily summary
     */
    public async getDailySummary(userId: string, date: Date): Promise<HealthData | null> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('health_data')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', startOfDay.toISOString())
                .lte('timestamp', endOfDay.toISOString())
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting daily summary:', error);
            return null;
        }
    }

    /**
     * Get weekly summary
     */
    public async getWeeklySummary(userId: string): Promise<HealthData[]> {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            const { data, error } = await supabase
                .from('health_data')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting weekly summary:', error);
            return [];
        }
    }

    /**
     * Get monthly summary
     */
    public async getMonthlySummary(userId: string): Promise<HealthData[]> {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);

            const { data, error } = await supabase
                .from('health_data')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting monthly summary:', error);
            return [];
        }
    }

    /**
     * Set daily goal
     */
    public async setDailyGoal(userId: string, goalType: string, targetValue: number): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('health_goals')
                .upsert({
                    user_id: userId,
                    goal_type: goalType,
                    target_value: targetValue,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,goal_type'
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error setting daily goal:', error);
            return false;
        }
    }

    /**
     * Get daily goals
     */
    public async getDailyGoals(userId: string): Promise<Record<string, number>> {
        try {
            const { data, error } = await supabase
                .from('health_goals')
                .select('goal_type, target_value')
                .eq('user_id', userId);

            if (error) throw error;

            const goals: Record<string, number> = {};
            (data || []).forEach(goal => {
                goals[goal.goal_type] = goal.target_value;
            });

            return goals;
        } catch (error) {
            console.error('Error getting daily goals:', error);
            return {};
        }
    }

    /**
     * Check goal progress
     */
    public async checkGoalProgress(userId: string, date: Date): Promise<Record<string, { current: number; target: number; progress: number }>> {
        try {
            const goals = await this.getDailyGoals(userId);
            const summary = await this.getDailySummary(userId, date);

            const progress: Record<string, { current: number; target: number; progress: number }> = {};

            if (summary) {
                Object.entries(goals).forEach(([goalType, target]) => {
                    const current = this.getMetricValue(summary, goalType);
                    progress[goalType] = {
                        current,
                        target,
                        progress: target > 0 ? Math.min((current / target) * 100, 100) : 0
                    };
                });
            }

            return progress;
        } catch (error) {
            console.error('Error checking goal progress:', error);
            return {};
        }
    }

    /**
     * Get metric value from health data
     */
    private getMetricValue(healthData: HealthData, metric: string): number {
        switch (metric) {
            case 'steps':
                return healthData.steps;
            case 'calories':
                return healthData.calories;
            case 'distance':
                return healthData.distance;
            case 'heartRate':
                return healthData.heartRate;
            case 'sleep':
                return healthData.sleepHours;
            case 'water':
                return healthData.waterIntake;
            case 'weight':
                return healthData.weight;
            default:
                return 0;
        }
    }

    /**
     * Send health data to AI for analysis
     */
    public async analyzeHealthData(userId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<string> {
        try {
            let healthData: HealthData[] = [];

            switch (period) {
                case 'day':
                    const today = new Date();
                    const summary = await this.getDailySummary(userId, today);
                    if (summary) healthData = [summary];
                    break;
                case 'week':
                    healthData = await this.getWeeklySummary(userId);
                    break;
                case 'month':
                    healthData = await this.getMonthlySummary(userId);
                    break;
            }

            if (healthData.length === 0) {
                return 'No health data available for analysis.';
            }

            // Prepare data for AI analysis
            const analysisData = {
                period,
                dataPoints: healthData.length,
                averages: this.calculateAverages(healthData),
                trends: this.identifyTrends(healthData),
                recommendations: this.generateRecommendations(healthData)
            };

            // In a real implementation, this would call an AI service
            return this.generateAnalysisReport(analysisData);
        } catch (error) {
            console.error('Error analyzing health data:', error);
            return 'Unable to analyze health data at this time.';
        }
    }

    /**
     * Calculate averages from health data
     */
    private calculateAverages(healthData: HealthData[]): Record<string, number> {
        const sums: Record<string, number> = {
            steps: 0,
            calories: 0,
            distance: 0,
            heartRate: 0,
            sleepHours: 0,
            waterIntake: 0,
            weight: 0
        };

        healthData.forEach(data => {
            sums.steps += data.steps;
            sums.calories += data.calories;
            sums.distance += data.distance;
            sums.heartRate += data.heartRate;
            sums.sleepHours += data.sleepHours;
            sums.waterIntake += data.waterIntake;
            sums.weight += data.weight;
        });

        const count = healthData.length;
        const averages: Record<string, number> = {};

        Object.keys(sums).forEach(key => {
            averages[key] = count > 0 ? sums[key as keyof typeof sums] / count : 0;
        });

        return averages;
    }

    /**
     * Identify trends in health data
     */
    private identifyTrends(healthData: HealthData[]): Record<string, string> {
        if (healthData.length < 2) {
            return {
                steps: 'insufficient_data',
                calories: 'insufficient_data',
                distance: 'insufficient_data',
                heartRate: 'insufficient_data',
                sleepHours: 'insufficient_data',
                waterIntake: 'insufficient_data',
                weight: 'insufficient_data'
            };
        }

        const trends: Record<string, string> = {};
        const first = healthData[0];
        const last = healthData[healthData.length - 1];

        // Steps trend
        trends.steps = last.steps > first.steps ? 'increasing' :
            last.steps < first.steps ? 'decreasing' : 'stable';

        // Calories trend
        trends.calories = last.calories > first.calories ? 'increasing' :
            last.calories < first.calories ? 'decreasing' : 'stable';

        // Distance trend
        trends.distance = last.distance > first.distance ? 'increasing' :
            last.distance < first.distance ? 'decreasing' : 'stable';

        // Heart rate trend
        trends.heartRate = last.heartRate > first.heartRate ? 'increasing' :
            last.heartRate < first.heartRate ? 'decreasing' : 'stable';

        // Sleep trend
        trends.sleepHours = last.sleepHours > first.sleepHours ? 'increasing' :
            last.sleepHours < first.sleepHours ? 'decreasing' : 'stable';

        // Water intake trend
        trends.waterIntake = last.waterIntake > first.waterIntake ? 'increasing' :
            last.waterIntake < first.waterIntake ? 'decreasing' : 'stable';

        // Weight trend
        trends.weight = last.weight > first.weight ? 'increasing' :
            last.weight < first.weight ? 'decreasing' : 'stable';

        return trends;
    }

    /**
     * Generate recommendations based on health data
     */
    private generateRecommendations(healthData: HealthData[]): string[] {
        const recommendations: string[] = [];
        const averages = this.calculateAverages(healthData);
        const trends = this.identifyTrends(healthData);

        // Steps recommendations
        if (averages.steps < 5000) {
            recommendations.push('Try to increase your daily steps to at least 5,000 for better cardiovascular health.');
        } else if (averages.steps < 10000) {
            recommendations.push('Great job on your step count! Aim for 10,000 steps daily for optimal health benefits.');
        }

        // Sleep recommendations
        if (averages.sleepHours < 7) {
            recommendations.push('Consider getting at least 7-8 hours of sleep per night for better recovery and mental clarity.');
        } else if (averages.sleepHours > 9) {
            recommendations.push('You\'re getting plenty of sleep. Make sure it\'s quality sleep by maintaining a consistent sleep schedule.');
        }

        // Water intake recommendations
        if (averages.waterIntake < 2000) {
            recommendations.push('Try to drink at least 2 liters of water daily to stay properly hydrated.');
        }

        // Heart rate recommendations
        if (averages.heartRate > 100) {
            recommendations.push('Your average heart rate is elevated. Consider incorporating more relaxation techniques into your routine.');
        }

        // Weight trend recommendations
        if (trends.weight === 'increasing') {
            recommendations.push('Your weight is trending upward. Consider reviewing your diet and exercise routine.');
        } else if (trends.weight === 'decreasing') {
            recommendations.push('Your weight is trending downward. Make sure you\'re maintaining a healthy calorie intake.');
        }

        // Activity level recommendations
        if (averages.calories < 200) {
            recommendations.push('Try to incorporate more physical activity into your day to burn more calories.');
        }

        return recommendations;
    }

    /**
     * Generate analysis report
     */
    private generateAnalysisReport(analysisData: any): string {
        const { period, dataPoints, averages, trends, recommendations } = analysisData;

        let report = `Health Analysis Report (${period}ly)\n`;
        report += `Based on ${dataPoints} data points\n\n`;

        report += 'AVERAGES:\n';
        report += `• Steps: ${Math.round(averages.steps)} per day\n`;
        report += `• Calories burned: ${Math.round(averages.calories)} per day\n`;
        report += `• Distance: ${averages.distance.toFixed(2)} km per day\n`;
        report += `• Heart rate: ${Math.round(averages.heartRate)} bpm\n`;
        report += `• Sleep: ${averages.sleepHours.toFixed(1)} hours per night\n`;
        report += `• Water intake: ${Math.round(averages.waterIntake)} ml per day\n`;
        report += `• Weight: ${averages.weight.toFixed(1)} kg\n\n`;

        report += 'TRENDS:\n';
        Object.entries(trends).forEach(([metric, trend]) => {
            if (trend !== 'insufficient_data') {
                const arrow = trend === 'increasing' ? '[UP]' : trend === 'decreasing' ? '[DOWN]' : '[STABLE]';
                const metricName = metric.charAt(0).toUpperCase() + metric.slice(1);
                report += `• ${metricName}: ${arrow} ${trend}\n`;
            }
        });
        report += '\n';

        if (recommendations.length > 0) {
            report += 'RECOMMENDATIONS:\n';
            recommendations.forEach((rec: string, index: number) => {
                report += `${index + 1}. ${rec}\n`;
            });
        } else {
            report += 'Your health metrics are looking great! Keep up the good work.\n';
        }

        return report;
    }

    /**
     * Get connected devices
     */
    public async getConnectedDevices(userId: string): Promise<WearableDevice[]> {
        try {
            const { data, error } = await supabase
                .from('wearable_devices')
                .select('*')
                .eq('user_id', userId)
                .eq('connected', true);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting connected devices:', error);
            return [];
        }
    }

    /**
     * Disconnect device
     */
    public async disconnectDevice(userId: string, deviceId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('wearable_devices')
                .update({ connected: false })
                .eq('user_id', userId)
                .eq('device_id', deviceId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error disconnecting device:', error);
            return false;
        }
    }

    /**
     * Update device sync status
     */
    public async updateDeviceSyncStatus(userId: string, deviceId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('wearable_devices')
                .update({
                    lastSync: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('device_id', deviceId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating device sync status:', error);
            return false;
        }
    }

    /**
     * Get health insights
     */
    public async getHealthInsights(userId: string): Promise<string[]> {
        try {
            const weeklyData = await this.getWeeklySummary(userId);
            if (weeklyData.length === 0) {
                return ['No health data available for insights.'];
            }

            const insights: string[] = [];
            const averages = this.calculateAverages(weeklyData);

            // Activity insights
            if (averages.steps > 10000) {
                insights.push('You\'re very active! Your step count is above the recommended 10,000 steps per day.');
            } else if (averages.steps > 5000) {
                insights.push('You\'re moderately active. Consider increasing your daily steps for better health.');
            } else {
                insights.push('Try to be more active. Aim for at least 5,000 steps per day.');
            }

            // Sleep insights
            if (averages.sleepHours >= 7 && averages.sleepHours <= 9) {
                insights.push('Your sleep duration is within the recommended range. Great job!');
            } else if (averages.sleepHours < 7) {
                insights.push('You might not be getting enough sleep. Aim for 7-9 hours per night.');
            } else {
                insights.push('You\'re getting plenty of sleep. Make sure it\'s restful and consistent.');
            }

            // Heart rate insights
            if (averages.heartRate >= 60 && averages.heartRate <= 100) {
                insights.push('Your heart rate is within the normal resting range.');
            } else if (averages.heartRate < 60) {
                insights.push('Your heart rate is lower than average, which could indicate good cardiovascular fitness.');
            } else {
                insights.push('Your heart rate is elevated. Consider stress management techniques.');
            }

            return insights;
        } catch (error) {
            console.error('Error getting health insights:', error);
            return ['Unable to generate health insights at this time.'];
        }
    }

    /**
     * Export health data
     */
    public async exportHealthData(userId: string, format: 'csv' | 'json' = 'json'): Promise<string> {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 3); // Last 3 months

            const healthData = await this.getHealthData(userId, startDate, endDate);

            if (format === 'csv') {
                return this.convertToCSV(healthData);
            } else {
                return JSON.stringify(healthData, null, 2);
            }
        } catch (error) {
            console.error('Error exporting health data:', error);
            return '';
        }
    }

    /**
     * Convert health data to CSV
     */
    private convertToCSV(healthData: HealthData[]): string {
        if (healthData.length === 0) return '';

        const headers = ['Date', 'Steps', 'Calories', 'Distance (km)', 'Heart Rate (bpm)', 'Sleep (hours)', 'Water (ml)', 'Weight (kg)'];
        const rows = healthData.map(data => [
            new Date(data.timestamp).toLocaleDateString(),
            data.steps.toString(),
            data.calories.toString(),
            data.distance.toString(),
            data.heartRate.toString(),
            data.sleepHours.toString(),
            data.waterIntake.toString(),
            data.weight.toString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        // Cleanup any resources if needed
    }
}
