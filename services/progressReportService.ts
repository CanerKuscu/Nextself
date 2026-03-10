import { SupabaseService } from './supabase';

const supabase = SupabaseService.getInstance().getClient();

export interface ProgressReport {
    id: string;
    user_id: string;
    report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
    period_start: string;
    period_end: string;
    title: string;
    summary: string;
    metrics: ProgressMetric[];
    achievements: Achievement[];
    recommendations: Recommendation[];
    insights: string[];
    generated_at: string;
    created_at: string;
}

export interface ProgressMetric {
    name: string;
    value: number;
    unit: string;
    change_percentage: number;
    trend: 'up' | 'down' | 'stable';
    target_value?: number;
    target_unit?: string;
    progress_percentage?: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked_at: string;
    xp_reward: number;
}

export interface Recommendation {
    id: string;
    title: string;
    description: string;
    category: 'workout' | 'nutrition' | 'recovery' | 'lifestyle';
    priority: 'low' | 'medium' | 'high';
    action_items: string[];
}

export interface GoalProgress {
    goal_id: string;
    goal_name: string;
    target_value: number;
    current_value: number;
    progress_percentage: number;
    remaining_days: number;
    status: 'on_track' | 'behind' | 'ahead' | 'completed';
}

export class ProgressReportService {
    /**
     * Generate daily progress report
     */
    static async generateDailyReport(userId: string, date: string): Promise<ProgressReport | null> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Collect data from various sources
            const healthData = await this.getHealthData(userId, startOfDay, endOfDay);
            const workoutData = await this.getWorkoutData(userId, startOfDay, endOfDay);
            const nutritionData = await this.getNutritionData(userId, startOfDay, endOfDay);
            const sleepData = await this.getSleepData(userId, startOfDay, endOfDay);
            const goals = await this.getGoals(userId);

            // Calculate metrics
            const metrics = this.calculateDailyMetrics(healthData, workoutData, nutritionData, sleepData);

            // Check achievements
            const achievements = await this.checkDailyAchievements(userId, date, metrics);

            // Generate recommendations
            const recommendations = this.generateDailyRecommendations(metrics, goals);

            // Generate insights
            const insights = this.generateDailyInsights(metrics);

            const report: Omit<ProgressReport, 'id' | 'created_at'> = {
                user_id: userId,
                report_type: 'daily',
                period_start: startOfDay.toISOString(),
                period_end: endOfDay.toISOString(),
                title: `Daily Progress Report - ${new Date(date).toLocaleDateString()}`,
                summary: this.generateDailySummary(metrics, achievements),
                metrics,
                achievements,
                recommendations,
                insights,
                generated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('progress_reports')
                .insert(report)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error generating daily report:', error);
            return null;
        }
    }

    /**
     * Generate weekly progress report
     */
    static async generateWeeklyReport(userId: string, weekStartDate: string): Promise<ProgressReport | null> {
        try {
            const startDate = new Date(weekStartDate);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            // Collect weekly data
            const dailyReports = await this.getDailyReports(userId, startDate, endDate);
            const weeklyHealthData = await this.getHealthData(userId, startDate, endDate);
            const weeklyWorkoutData = await this.getWorkoutData(userId, startDate, endDate);
            const weeklyNutritionData = await this.getNutritionData(userId, startDate, endDate);
            const goals = await this.getGoals(userId);

            // Calculate weekly metrics
            const metrics = this.calculateWeeklyMetrics(dailyReports, weeklyHealthData, weeklyWorkoutData, weeklyNutritionData);

            // Check weekly achievements
            const achievements = await this.checkWeeklyAchievements(userId, startDate, endDate, metrics);

            // Generate recommendations
            const recommendations = this.generateWeeklyRecommendations(metrics, goals);

            // Generate insights
            const insights = this.generateWeeklyInsights(metrics, dailyReports);

            const report: Omit<ProgressReport, 'id' | 'created_at'> = {
                user_id: userId,
                report_type: 'weekly',
                period_start: startDate.toISOString(),
                period_end: endDate.toISOString(),
                title: `Weekly Progress Report - Week of ${startDate.toLocaleDateString()}`,
                summary: this.generateWeeklySummary(metrics, achievements),
                metrics,
                achievements,
                recommendations,
                insights,
                generated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('progress_reports')
                .insert(report)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error generating weekly report:', error);
            return null;
        }
    }

    /**
     * Generate monthly progress report
     */
    static async generateMonthlyReport(userId: string, month: number, year: number): Promise<ProgressReport | null> {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            endDate.setHours(23, 59, 59, 999);

            // Collect monthly data
            const weeklyReports = await this.getWeeklyReports(userId, startDate, endDate);
            const monthlyHealthData = await this.getHealthData(userId, startDate, endDate);
            const monthlyWorkoutData = await this.getWorkoutData(userId, startDate, endDate);
            const monthlyNutritionData = await this.getNutritionData(userId, startDate, endDate);
            const goals = await this.getGoals(userId);

            // Calculate monthly metrics
            const metrics = this.calculateMonthlyMetrics(weeklyReports, monthlyHealthData, monthlyWorkoutData, monthlyNutritionData);

            // Check monthly achievements
            const achievements = await this.checkMonthlyAchievements(userId, startDate, endDate, metrics);

            // Generate recommendations
            const recommendations = this.generateMonthlyRecommendations(metrics, goals);

            // Generate insights
            const insights = this.generateMonthlyInsights(metrics, weeklyReports);

            const report: Omit<ProgressReport, 'id' | 'created_at'> = {
                user_id: userId,
                report_type: 'monthly',
                period_start: startDate.toISOString(),
                period_end: endDate.toISOString(),
                title: `Monthly Progress Report - ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                summary: this.generateMonthlySummary(metrics, achievements),
                metrics,
                achievements,
                recommendations,
                insights,
                generated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('progress_reports')
                .insert(report)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error generating monthly report:', error);
            return null;
        }
    }

    /**
     * Get user's progress reports
     */
    static async getProgressReports(
        userId: string,
        reportType?: 'daily' | 'weekly' | 'monthly' | 'custom',
        limit: number = 20,
        offset: number = 0
    ): Promise<ProgressReport[]> {
        try {
            let query = supabase
                .from('progress_reports')
                .select('*')
                .eq('user_id', userId)
                .order('period_end', { ascending: false });

            if (reportType) {
                query = query.eq('report_type', reportType);
            }

            const { data, error } = await query
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting progress reports:', error);
            return [];
        }
    }

    /**
     * Get goal progress
     */
    static async getGoalProgress(userId: string): Promise<GoalProgress[]> {
        try {
            const goals = await this.getGoals(userId);
            const progress: GoalProgress[] = [];

            for (const goal of goals) {
                const currentValue = await this.getGoalCurrentValue(userId, goal);
                const progressPercentage = goal.target_value > 0 ? (currentValue / goal.target_value) * 100 : 0;

                const remainingDays = this.calculateRemainingDays(goal.end_date);

                let status: 'on_track' | 'behind' | 'ahead' | 'completed' = 'on_track';
                if (progressPercentage >= 100) {
                    status = 'completed';
                } else {
                    const expectedProgress = this.calculateExpectedProgress(goal.start_date, goal.end_date);
                    if (progressPercentage < expectedProgress - 10) {
                        status = 'behind';
                    } else if (progressPercentage > expectedProgress + 10) {
                        status = 'ahead';
                    }
                }

                progress.push({
                    goal_id: goal.id,
                    goal_name: goal.name,
                    target_value: goal.target_value,
                    current_value: currentValue,
                    progress_percentage: progressPercentage,
                    remaining_days: remainingDays,
                    status
                });
            }

            return progress;
        } catch (error) {
            console.error('Error getting goal progress:', error);
            return [];
        }
    }

    /**
     * Get progress trends
     */
    static async getProgressTrends(
        userId: string,
        metric: string,
        period: 'week' | 'month' | 'quarter' = 'month'
    ): Promise<{ date: string; value: number }[]> {
        try {
            const startDate = new Date();
            switch (period) {
                case 'week':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(startDate.getMonth() - 3);
                    break;
            }

            const reports = await this.getProgressReports(userId, 'daily', 100, 0);
            const filteredReports = reports.filter(report =>
                new Date(report.period_end) >= startDate
            );

            const trends = filteredReports.map(report => {
                const metricData = report.metrics.find(m => m.name === metric);
                return {
                    date: report.period_end,
                    value: metricData?.value || 0
                };
            });

            return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } catch (error) {
            console.error('Error getting progress trends:', error);
            return [];
        }
    }

    /**
     * Compare with previous period
     */
    static async compareWithPreviousPeriod(
        userId: string,
        currentReportId: string
    ): Promise<{ metric: string; current: number; previous: number; change: number }[]> {
        try {
            const currentReport = await this.getReportById(currentReportId);
            if (!currentReport) return [];

            let previousReport: ProgressReport | null = null;
            const previousReports = await this.getProgressReports(
                userId,
                currentReport.report_type,
                1,
                1
            );

            if (previousReports.length > 0) {
                previousReport = previousReports[0];
            }

            const comparisons = currentReport.metrics.map(metric => {
                const previousMetric = previousReport?.metrics.find(m => m.name === metric.name);
                const previousValue = previousMetric?.value || 0;
                const change = previousValue > 0 ? ((metric.value - previousValue) / previousValue) * 100 : 0;

                return {
                    metric: metric.name,
                    current: metric.value,
                    previous: previousValue,
                    change
                };
            });

            return comparisons;
        } catch (error) {
            console.error('Error comparing with previous period:', error);
            return [];
        }
    }

    /**
     * Share progress report
     */
    static async shareReport(
        userId: string,
        reportId: string,
        shareWith: string[],
        message?: string
    ): Promise<boolean> {
        try {
            const report = await this.getReportById(reportId);
            if (!report) return false;

            const { error } = await supabase
                .from('shared_reports')
                .insert({
                    report_id: reportId,
                    shared_by: userId,
                    shared_with: shareWith,
                    message,
                    shared_at: new Date().toISOString()
                });

            if (error) throw error;

            // Send notifications to shared users
            await this.notifySharedUsers(shareWith, userId, report.title);

            return true;
        } catch (error) {
            console.error('Error sharing report:', error);
            return false;
        }
    }

    /**
     * Get shared reports
     */
    static async getSharedReports(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('shared_reports')
                .select(`
          *,
          report:progress_reports(*),
          sharer:profiles!shared_reports_shared_by_fkey(username, avatar_url)
        `)
                .contains('shared_with', [userId])
                .order('shared_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting shared reports:', error);
            return [];
        }
    }

    // ==================== HELPER METHODS ====================

    private static async getHealthData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
        const { data, error } = await supabase
            .from('health_data')
            .select('*')
            .eq('user_id', userId)
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error getting health data:', error);
            return [];
        }
        return data || [];
    }

    private static async getWorkoutData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
        const { data, error } = await supabase
            .from('workout_sessions')
            .select('*, exercises:workout_exercises(*)')
            .eq('user_id', userId)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString())
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error getting workout data:', error);
            return [];
        }
        return data || [];
    }

    private static async getNutritionData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
        const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString())
            .order('date', { ascending: true });

        if (error) {
            console.error('Error getting nutrition data:', error);
            return [];
        }
        return data || [];
    }

    private static async getSleepData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
        const { data, error } = await supabase
            .from('sleep_data')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString())
            .order('date', { ascending: true });

        if (error) {
            console.error('Error getting sleep data:', error);
            return [];
        }
        return data || [];
    }

    private static async getGoals(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('end_date', { ascending: true });

        if (error) {
            console.error('Error getting goals:', error);
            return [];
        }
        return data || [];
    }

    private static async getDailyReports(userId: string, startDate: Date, endDate: Date): Promise<ProgressReport[]> {
        const { data, error } = await supabase
            .from('progress_reports')
            .select('*')
            .eq('user_id', userId)
            .eq('report_type', 'daily')
            .gte('period_end', startDate.toISOString())
            .lte('period_end', endDate.toISOString())
            .order('period_end', { ascending: true });

        if (error) {
            console.error('Error getting daily reports:', error);
            return [];
        }
        return data || [];
    }

    private static async getWeeklyReports(userId: string, startDate: Date, endDate: Date): Promise<ProgressReport[]> {
        const { data, error } = await supabase
            .from('progress_reports')
            .select('*')
            .eq('user_id', userId)
            .eq('report_type', 'weekly')
            .gte('period_end', startDate.toISOString())
            .lte('period_end', endDate.toISOString())
            .order('period_end', { ascending: true });

        if (error) {
            console.error('Error getting weekly reports:', error);
            return [];
        }
        return data || [];
    }

    private static async getReportById(reportId: string): Promise<ProgressReport | null> {
        const { data, error } = await supabase
            .from('progress_reports')
            .select('*')
            .eq('id', reportId)
            .single();

        if (error) {
            console.error('Error getting report by ID:', error);
            return null;
        }
        return data;
    }

    private static async getGoalCurrentValue(userId: string, goal: any): Promise<number> {
        // This is a simplified implementation
        // In a real app, you would calculate the current value based on the goal type
        switch (goal.type) {
            case 'weight_loss':
                const { data: weightData } = await supabase
                    .from('health_data')
                    .select('value')
                    .eq('user_id', userId)
                    .eq('metric', 'weight')
                    .order('timestamp', { ascending: false })
                    .limit(1)
                    .single();
                return weightData?.value || 0;
            case 'workout_frequency':
                const { count: workoutCount } = await supabase
                    .from('workout_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .gte('start_time', goal.start_date)
                    .lte('start_time', goal.end_date);
                return workoutCount || 0;
            case 'nutrition_target':
                const { data: nutritionData } = await supabase
                    .from('nutrition_logs')
                    .select('calories, protein, carbs, fat')
                    .eq('user_id', userId)
                    .gte('date', goal.start_date)
                    .lte('date', goal.end_date);

                if (!nutritionData) return 0;

                let total = 0;
                for (const log of nutritionData) {
                    switch (goal.metric) {
                        case 'calories': total += log.calories; break;
                        case 'protein': total += log.protein; break;
                        case 'carbs': total += log.carbs; break;
                        case 'fat': total += log.fat; break;
                    }
                }
                return total;
            default:
                return 0;
        }
    }

    private static calculateRemainingDays(endDate: string): number {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    private static calculateExpectedProgress(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        return totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;
    }

    private static async notifySharedUsers(shareWith: string[], sharedBy: string, reportTitle: string): Promise<void> {
        try {
            for (const userId of shareWith) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: userId,
                        type: 'shared_report',
                        title: 'Progress Report Shared',
                        message: `A progress report "${reportTitle}" has been shared with you`,
                        data: {
                            shared_by: sharedBy,
                            report_title: reportTitle
                        },
                        is_read: false
                    });
            }
        } catch (error) {
            console.error('Error notifying shared users:', error);
        }
    }

    private static calculateDailyMetrics(
        healthData: any[],
        workoutData: any[],
        nutritionData: any[],
        sleepData: any[]
    ): ProgressMetric[] {
        // Simplified implementation
        const metrics: ProgressMetric[] = [];

        // Calculate steps
        const totalSteps = healthData
            .filter(d => d.metric === 'steps')
            .reduce((sum, d) => sum + d.value, 0);
        metrics.push({
            name: 'Steps',
            value: totalSteps,
            unit: 'steps',
            change_percentage: 0,
            trend: totalSteps > 10000 ? 'up' : totalSteps < 5000 ? 'down' : 'stable',
            target_value: 10000,
            progress_percentage: Math.min(100, (totalSteps / 10000) * 100)
        });

        // Calculate workout minutes
        const workoutMinutes = workoutData.reduce((sum, session) => {
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            return sum + Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        }, 0);
        metrics.push({
            name: 'Workout Time',
            value: workoutMinutes,
            unit: 'minutes',
            change_percentage: 0,
            trend: workoutMinutes > 30 ? 'up' : 'down',
            target_value: 30,
            progress_percentage: Math.min(100, (workoutMinutes / 30) * 100)
        });

        // Calculate calories
        const totalCalories = nutritionData.reduce((sum, log) => sum + log.calories, 0);
        metrics.push({
            name: 'Calories',
            value: totalCalories,
            unit: 'kcal',
            change_percentage: 0,
            trend: 'stable',
            target_value: 2000,
            progress_percentage: Math.min(100, (totalCalories / 2000) * 100)
        });

        // Calculate sleep hours
        const sleepHours = sleepData.reduce((sum, sleep) => {
            const duration = sleep.duration_minutes || 0;
            return sum + duration / 60;
        }, 0);
        metrics.push({
            name: 'Sleep',
            value: sleepHours,
            unit: 'hours',
            change_percentage: 0,
            trend: sleepHours >= 7 ? 'up' : sleepHours < 6 ? 'down' : 'stable',
            target_value: 7,
            progress_percentage: Math.min(100, (sleepHours / 7) * 100)
        });

        return metrics;
    }

    private static calculateWeeklyMetrics(
        dailyReports: ProgressReport[],
        healthData: any[],
        workoutData: any[],
        nutritionData: any[]
    ): ProgressMetric[] {
        // Simplified implementation - average of daily metrics
        if (dailyReports.length === 0) {
            return this.calculateDailyMetrics(healthData, workoutData, nutritionData, []);
        }

        const weeklyMetrics: ProgressMetric[] = [];
        const metricNames = ['Steps', 'Workout Time', 'Calories', 'Sleep'];

        for (const metricName of metricNames) {
            const dailyValues = dailyReports.map(report => {
                const metric = report.metrics.find(m => m.name === metricName);
                return metric?.value || 0;
            });

            const avgValue = dailyValues.reduce((sum, val) => sum + val, 0) / dailyValues.length;
            const lastWeekValue = avgValue * 0.9; // Simulated previous week data
            const changePercentage = lastWeekValue > 0 ? ((avgValue - lastWeekValue) / lastWeekValue) * 100 : 0;

            weeklyMetrics.push({
                name: metricName,
                value: Math.round(avgValue),
                unit: metricName === 'Sleep' ? 'hours' : metricName === 'Calories' ? 'kcal' : metricName === 'Workout Time' ? 'minutes' : 'steps',
                change_percentage: Math.round(changePercentage * 100) / 100,
                trend: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
                target_value: metricName === 'Steps' ? 70000 : metricName === 'Workout Time' ? 210 : metricName === 'Calories' ? 14000 : 49,
                progress_percentage: 0 // Would need target values
            });
        }

        return weeklyMetrics;
    }

    private static calculateMonthlyMetrics(
        weeklyReports: ProgressReport[],
        healthData: any[],
        workoutData: any[],
        nutritionData: any[]
    ): ProgressMetric[] {
        // Simplified implementation - sum of weekly metrics
        if (weeklyReports.length === 0) {
            return this.calculateWeeklyMetrics([], healthData, workoutData, nutritionData);
        }

        const monthlyMetrics: ProgressMetric[] = [];
        const metricNames = ['Steps', 'Workout Time', 'Calories', 'Sleep'];

        for (const metricName of metricNames) {
            const weeklyValues = weeklyReports.map(report => {
                const metric = report.metrics.find(m => m.name === metricName);
                return metric?.value || 0;
            });

            const totalValue = weeklyValues.reduce((sum, val) => sum + val, 0);
            const lastMonthValue = totalValue * 0.85; // Simulated previous month data
            const changePercentage = lastMonthValue > 0 ? ((totalValue - lastMonthValue) / lastMonthValue) * 100 : 0;

            monthlyMetrics.push({
                name: metricName,
                value: Math.round(totalValue),
                unit: metricName === 'Sleep' ? 'hours' : metricName === 'Calories' ? 'kcal' : metricName === 'Workout Time' ? 'minutes' : 'steps',
                change_percentage: Math.round(changePercentage * 100) / 100,
                trend: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
                target_value: metricName === 'Steps' ? 300000 : metricName === 'Workout Time' ? 900 : metricName === 'Calories' ? 60000 : 210,
                progress_percentage: 0 // Would need target values
            });
        }

        return monthlyMetrics;
    }

    private static async checkDailyAchievements(userId: string, date: string, metrics: ProgressMetric[]): Promise<Achievement[]> {
        const achievements: Achievement[] = [];

        // Check for 10k steps achievement
        const stepsMetric = metrics.find(m => m.name === 'Steps');
        if (stepsMetric && stepsMetric.value >= 10000) {
            achievements.push({
                id: `steps_${date}`,
                title: '10K Steps Master',
                description: 'Reached 10,000 steps in a single day',
                icon: 'walk',
                unlocked_at: new Date().toISOString(),
                xp_reward: 50
            });
        }

        // Check for workout achievement
        const workoutMetric = metrics.find(m => m.name === 'Workout Time');
        if (workoutMetric && workoutMetric.value >= 30) {
            achievements.push({
                id: `workout_${date}`,
                title: 'Daily Workout Warrior',
                description: 'Completed a 30+ minute workout',
                icon: 'dumbbell',
                unlocked_at: new Date().toISOString(),
                xp_reward: 75
            });
        }

        // Check for sleep achievement
        const sleepMetric = metrics.find(m => m.name === 'Sleep');
        if (sleepMetric && sleepMetric.value >= 7) {
            achievements.push({
                id: `sleep_${date}`,
                title: 'Sleep Champion',
                description: 'Got 7+ hours of sleep',
                icon: 'moon',
                unlocked_at: new Date().toISOString(),
                xp_reward: 40
            });
        }

        return achievements;
    }

    private static async checkWeeklyAchievements(
        userId: string,
        startDate: Date,
        endDate: Date,
        metrics: ProgressMetric[]
    ): Promise<Achievement[]> {
        const achievements: Achievement[] = [];

        // Check for consistent workout achievement
        const workoutMetric = metrics.find(m => m.name === 'Workout Time');
        if (workoutMetric && workoutMetric.value >= 210) { // 30 min/day * 7 days
            achievements.push({
                id: `weekly_workout_${startDate.toISOString()}`,
                title: 'Weekly Workout Champion',
                description: 'Worked out every day this week',
                icon: 'trophy',
                unlocked_at: new Date().toISOString(),
                xp_reward: 150
            });
        }

        // Check for step consistency
        const stepsMetric = metrics.find(m => m.name === 'Steps');
        if (stepsMetric && stepsMetric.value >= 70000) { // 10k steps/day * 7 days
            achievements.push({
                id: `weekly_steps_${startDate.toISOString()}`,
                title: 'Step Consistency Master',
                description: 'Averaged 10,000+ steps daily this week',
                icon: 'shoe-print',
                unlocked_at: new Date().toISOString(),
                xp_reward: 120
            });
        }

        return achievements;
    }

    private static async checkMonthlyAchievements(
        userId: string,
        startDate: Date,
        endDate: Date,
        metrics: ProgressMetric[]
    ): Promise<Achievement[]> {
        const achievements: Achievement[] = [];

        // Check for monthly consistency
        const workoutMetric = metrics.find(m => m.name === 'Workout Time');
        if (workoutMetric && workoutMetric.value >= 900) { // 30 min/day * 30 days
            achievements.push({
                id: `monthly_workout_${startDate.getMonth()}_${startDate.getFullYear()}`,
                title: 'Monthly Fitness Dedication',
                description: 'Maintained consistent workouts all month',
                icon: 'medal',
                unlocked_at: new Date().toISOString(),
                xp_reward: 300
            });
        }

        return achievements;
    }

    private static generateDailyRecommendations(metrics: ProgressMetric[], goals: any[]): Recommendation[] {
        const recommendations: Recommendation[] = [];

        const stepsMetric = metrics.find(m => m.name === 'Steps');
        if (stepsMetric && stepsMetric.value < 5000) {
            recommendations.push({
                id: 'rec_steps_low',
                title: 'Increase Daily Steps',
                description: 'Try to reach at least 5,000 steps today',
                category: 'lifestyle',
                priority: 'medium',
                action_items: [
                    'Take a 10-minute walk after each meal',
                    'Use stairs instead of elevator',
                    'Park farther from your destination'
                ]
            });
        }

        const workoutMetric = metrics.find(m => m.name === 'Workout Time');
        if (!workoutMetric || workoutMetric.value < 20) {
            recommendations.push({
                id: 'rec_workout_missing',
                title: 'Add Some Activity',
                description: 'Incorporate at least 20 minutes of exercise',
                category: 'workout',
                priority: 'high',
                action_items: [
                    'Try a 15-minute bodyweight workout',
                    'Go for a brisk walk or jog',
                    'Follow a yoga session on the app'
                ]
            });
        }

        const sleepMetric = metrics.find(m => m.name === 'Sleep');
        if (sleepMetric && sleepMetric.value < 6) {
            recommendations.push({
                id: 'rec_sleep_low',
                title: 'Improve Sleep Quality',
                description: 'Aim for 7-8 hours of quality sleep',
                category: 'recovery',
                priority: 'high',
                action_items: [
                    'Establish a consistent bedtime routine',
                    'Avoid screens 1 hour before bed',
                    'Keep your bedroom cool and dark'
                ]
            });
        }

        return recommendations;
    }

    private static generateWeeklyRecommendations(metrics: ProgressMetric[], goals: any[]): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // Check for consistency issues
        const workoutMetric = metrics.find(m => m.name === 'Workout Time');
        if (workoutMetric && workoutMetric.value < 150) { // Less than 30 min/day average
            recommendations.push({
                id: 'rec_weekly_workout',
                title: 'Increase Workout Frequency',
                description: 'Try to exercise at least 5 days this week',
                category: 'workout',
                priority: 'medium',
                action_items: [
                    'Schedule workouts in your calendar',
                    'Try different types of exercise to stay motivated',
                    'Find a workout buddy for accountability'
                ]
            });
        }

        return recommendations;
    }

    private static generateMonthlyRecommendations(metrics: ProgressMetric[], goals: any[]): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // Check for long-term trends
        const stepsMetric = metrics.find(m => m.name === 'Steps');
        if (stepsMetric && stepsMetric.trend === 'down') {
            recommendations.push({
                id: 'rec_monthly_steps_trend',
                title: 'Reverse Step Decline',
                description: 'Your step count has been decreasing over the month',
                category: 'lifestyle',
                priority: 'low',
                action_items: [
                    'Set a new step goal for next month',
                    'Try different walking routes to stay motivated',
                    'Track your progress weekly instead of daily'
                ]
            });
        }

        const workoutMetric = metrics.find(m => m.name === 'Workout Time');
        if (workoutMetric && workoutMetric.trend === 'down') {
            recommendations.push({
                id: 'rec_monthly_workout_trend',
                title: 'Boost Workout Consistency',
                description: 'Your workout frequency has decreased this month',
                category: 'workout',
                priority: 'medium',
                action_items: [
                    'Join a fitness challenge for motivation',
                    'Try a new workout type to prevent boredom',
                    'Schedule workouts as non-negotiable appointments'
                ]
            });
        }

        return recommendations;
    }

    private static generateDailySummary(metrics: ProgressMetric[], achievements: Achievement[]): string {
        const steps = metrics.find(m => m.name === 'Steps')?.value || 0;
        const workout = metrics.find(m => m.name === 'Workout Time')?.value || 0;
        const sleep = metrics.find(m => m.name === 'Sleep')?.value || 0;

        let summary = `Today you took ${steps.toLocaleString()} steps`;

        if (workout > 0) {
            summary += `, completed ${workout} minutes of exercise`;
        }

        if (sleep > 0) {
            summary += `, and slept ${sleep.toFixed(1)} hours`;
        }

        if (achievements.length > 0) {
            summary += `. You unlocked ${achievements.length} achievement${achievements.length > 1 ? 's' : ''}!`;
        } else {
            summary += '.';
        }

        return summary;
    }

    private static generateWeeklySummary(metrics: ProgressMetric[], achievements: Achievement[]): string {
        const steps = metrics.find(m => m.name === 'Steps')?.value || 0;
        const workout = metrics.find(m => m.name === 'Workout Time')?.value || 0;
        const avgSteps = Math.round(steps / 7);
        const avgWorkout = Math.round(workout / 7);

        let summary = `This week you averaged ${avgSteps.toLocaleString()} steps per day`;

        if (avgWorkout > 0) {
            summary += ` and ${avgWorkout} minutes of daily exercise`;
        }

        if (achievements.length > 0) {
            summary += `. You earned ${achievements.length} weekly achievement${achievements.length > 1 ? 's' : ''}!`;
        } else {
            summary += '.';
        }

        return summary;
    }

    private static generateMonthlySummary(metrics: ProgressMetric[], achievements: Achievement[]): string {
        const steps = metrics.find(m => m.name === 'Steps')?.value || 0;
        const workout = metrics.find(m => m.name === 'Workout Time')?.value || 0;
        const avgSteps = Math.round(steps / 30);
        const avgWorkout = Math.round(workout / 30);

        let summary = `This month you averaged ${avgSteps.toLocaleString()} steps per day`;

        if (avgWorkout > 0) {
            summary += ` and ${avgWorkout} minutes of daily exercise`;
        }

        const trends = metrics.filter(m => m.trend === 'up').length;
        if (trends > 0) {
            summary += `. ${trends} of your metrics showed positive trends!`;
        }

        if (achievements.length > 0) {
            summary += ` You earned ${achievements.length} monthly achievement${achievements.length > 1 ? 's' : ''}.`;
        }

        return summary;
    }

    private static generateDailyInsights(metrics: ProgressMetric[]): string[] {
        const insights: string[] = [];
        const steps = metrics.find(m => m.name === 'Steps')?.value || 0;
        const workout = metrics.find(m => m.name === 'Workout Time')?.value || 0;
        const sleep = metrics.find(m => m.name === 'Sleep')?.value || 0;

        if (steps >= 10000) {
            insights.push('Great job hitting your step goal! Consistent movement helps maintain energy levels throughout the day.');
        } else if (steps < 5000) {
            insights.push('Consider adding short walks throughout your day. Even 5-minute breaks can significantly increase your step count.');
        }

        if (workout >= 30) {
            insights.push('Excellent workout consistency! Regular exercise improves both physical and mental health.');
        } else if (workout > 0 && workout < 20) {
            insights.push('Every minute of exercise counts! Try to gradually increase your workout duration for better results.');
        }

        if (sleep >= 7) {
            insights.push('Quality sleep is essential for recovery. Your sleep duration supports optimal physical and cognitive function.');
        } else if (sleep < 6) {
            insights.push('Prioritizing sleep can improve your energy levels, mood, and workout performance.');
        }

        return insights;
    }

    private static generateWeeklyInsights(metrics: ProgressMetric[], dailyReports: ProgressReport[]): string[] {
        const insights: string[] = [];

        if (dailyReports.length >= 5) {
            insights.push('You tracked your progress consistently this week! Consistency is key to long-term success.');
        } else if (dailyReports.length < 3) {
            insights.push('Try to track your progress more consistently. Regular tracking helps identify patterns and make adjustments.');
        }

        const workoutMetric = metrics.find(m => m.name === 'Workout Time');
        if (workoutMetric && workoutMetric.value >= 210) {
            insights.push('Outstanding workout consistency! Exercising daily builds strong habits and accelerates progress.');
        }

        const stepsMetric = metrics.find(m => m.name === 'Steps');
        if (stepsMetric && stepsMetric.trend === 'up') {
            insights.push('Your step count is trending upward! This indicates improved daily activity levels.');
        }

        return insights;
    }

    private static generateMonthlyInsights(metrics: ProgressMetric[], weeklyReports: ProgressReport[]): string[] {
        const insights: string[] = [];

        if (weeklyReports.length >= 4) {
            insights.push('Excellent monthly consistency! You maintained regular progress tracking throughout the entire month.');
        }

        const improvingMetrics = metrics.filter(m => m.trend === 'up').length;
        if (improvingMetrics >= 2) {
            insights.push(`Great progress! ${improvingMetrics} of your key metrics showed improvement this month.`);
        }

        const workoutMetric = metrics.find(m => m.name === 'Workout Time');
        if (workoutMetric && workoutMetric.value >= 900) {
            insights.push('Remarkable dedication to fitness! Consistent monthly exercise builds lasting health benefits.');
        }

        // Check for balance
        const hasWorkout = workoutMetric && workoutMetric.value > 0;
        const stepsMetric = metrics.find(m => m.name === 'Steps');
        const hasSteps = stepsMetric && stepsMetric.value > 0;
        const sleepMetric = metrics.find(m => m.name === 'Sleep');
        const hasSleep = sleepMetric && sleepMetric.value > 0;

        if (hasWorkout && hasSteps && hasSleep) {
            insights.push('You maintained a well-rounded approach to health this month, balancing activity, movement, and recovery.');
        }

        return insights;
    }
}
