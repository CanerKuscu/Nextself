import { useState, useEffect, useCallback } from 'react';
import { SupabaseService } from '@nextself/shared';

export type Period = 'weekly' | 'monthly' | 'yearly';

export interface BodyMetric {
    weight: number;
    bodyFat?: number;
    muscleMass?: number;
    waterPercentage?: number;
    boneMass?: number;
    bmi?: number;
    recordedAt: string;
}

export interface WorkoutSummary {
    totalWorkouts: number;
    totalDuration: number;
    avgDuration: number;
    streak: number;
    caloriesBurned: number;
}

export interface NutritionSummary {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    adherenceRate: number;
}

export interface HydrationSummary {
    totalLiters: number;
    avgLitersPerDay: number;
    totalVitamins: number;
    totalMinerals: number;
}

export function useProgressReport(period: Period, isTurkish: boolean, targetUserId?: string) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
    const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
    const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
    const [hydrationSummary, setHydrationSummary] = useState<HydrationSummary | null>(null);
    const [goalProgress, setGoalProgress] = useState<{ label: string; current: number; target: number; unit: string; icon: string; color: string }[]>([]);

    const supabase = SupabaseService.getInstance();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { user: currentUser } = await supabase.getCurrentUser();
            const userId = targetUserId || currentUser?.id;
            
            if (!userId) return;

            const now = new Date();
            let startDate: Date;
            if (period === 'weekly') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            else if (period === 'monthly') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            else startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

            const startIso = startDate.toISOString();
            const startDateOnly = startIso.split('T')[0];

            const [{ data: healthData }, { data: workoutData, error: wErr }, { data: nutData, error: nErr }, { data: waterData }, { data: vitData }, { data: minData }, { data: healthGoals }] = await Promise.all([
                supabase.getClient()
                    .from('health_data')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('timestamp', startIso)
                    .not('weight', 'is', null)
                    .order('timestamp', { ascending: true }),
                supabase.getClient()
                    .rpc('get_workout_summary', { p_user_id: userId, p_start_date: startIso }),
                supabase.getClient()
                    .rpc('get_nutrition_summary', { p_user_id: userId, p_start_date: startDateOnly }),
                supabase.getClient()
                    .from('water_logs')
                    .select('amount_ml')
                    .eq('user_id', userId)
                    .gte('date', startDateOnly),
                supabase.getClient()
                    .from('vitamin_logs')
                    .select('id')
                    .eq('user_id', userId)
                    .gte('logged_at', startIso),
                supabase.getClient()
                    .from('mineral_logs')
                    .select('id')
                    .eq('user_id', userId)
                    .gte('created_at', startIso),
                supabase.getClient()
                    .from('health_goals')
                    .select('goal_type, target_value, is_active')
                    .eq('user_id', userId)
                    .eq('is_active', true),
            ]);

            const metrics: BodyMetric[] = (healthData || []).map((r: any) => ({
                weight: r.weight,
                bodyFat: r.body_fat_percentage,
                muscleMass: r.muscle_mass_percentage,
                waterPercentage: r.water_percentage,
                boneMass: r.bone_mass_kg,
                bmi: r.bmi,
                recordedAt: r.timestamp,
            }));
            setBodyMetrics(metrics);

            if (workoutData && workoutData.length > 0) {
                const w = workoutData[0];
                const totalWorkouts = Number(w.total_workouts) || 0;
                setWorkoutSummary({
                    totalWorkouts,
                    totalDuration: Number(w.total_duration) || 0,
                    avgDuration: totalWorkouts > 0 ? Math.round(Number(w.total_duration) / totalWorkouts) : 0,
                    streak: 0, // Implement streak separately if needed
                    caloriesBurned: Number(w.calories_burned) || 0,
                });
            } else if (wErr) {
                console.warn('RPC get_workout_summary error:', wErr);
            }

            if (nutData && nutData.length > 0) {
                const n = nutData[0];
                const daysLogged = Number(n.days_logged) || 0;
                const expectedDays = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365;

                if (daysLogged > 0) {
                    setNutritionSummary({
                        avgCalories: Number(n.avg_calories) || 0,
                        avgProtein: Number(n.avg_protein) || 0,
                        avgCarbs: Number(n.avg_carbs) || 0,
                        avgFat: Number(n.avg_fat) || 0,
                        adherenceRate: Math.min(100, Math.round((daysLogged / expectedDays) * 100)),
                    });
                } else {
                    setNutritionSummary(null);
                }
            } else if (nErr) {
                console.warn('RPC get_nutrition_summary error:', nErr);
            }

            const totalWaterMl = (waterData || []).reduce((acc: number, curr: any) => acc + (curr.amount_ml || 0), 0);
            const totalLiters = totalWaterMl / 1000;
            const logDays = (waterData || []).length;
            setHydrationSummary({
                totalLiters: Math.round(totalLiters * 10) / 10,
                avgLitersPerDay: logDays > 0 ? Math.round((totalLiters / logDays) * 10) / 10 : 0,
                totalVitamins: vitData?.length || 0,
                totalMinerals: minData?.length || 0,
            });

            // Goal Progress calculation
            const goals: typeof goalProgress = [];
            const goalRows = healthGoals || [];
            const findGoalTarget = (goalTypes: string[], fallback: number): number => {
                const row = goalRows.find((goal: any) =>
                    goalTypes.includes(String(goal?.goal_type || '').toLowerCase())
                );
                const value = Number(row?.target_value);
                return Number.isFinite(value) && value > 0 ? value : fallback;
            };

            if (metrics.length > 0) {
                const latestWeight = metrics[metrics.length - 1].weight;
                goals.push({
                    label: isTurkish ? 'Kilo' : 'Weight',
                    current: latestWeight,
                    target: findGoalTarget(['weight', 'body_weight', 'weight_kg', 'goal_weight'], latestWeight),
                    unit: 'kg',
                    icon: 'scale-outline',
                    color: '#3498db',
                });
                if (metrics[metrics.length - 1].bodyFat) {
                    const latestBodyFat = metrics[metrics.length - 1].bodyFat!;
                    goals.push({
                        label: isTurkish ? 'Vücut Yağı' : 'Body Fat',
                        current: latestBodyFat,
                        target: findGoalTarget(['body_fat', 'body_fat_percentage', 'fat'], latestBodyFat),
                        unit: '%',
                        icon: 'flame-outline',
                        color: '#e74c3c',
                    });
                }
                if (metrics[metrics.length - 1].muscleMass) {
                    const latestMuscleMass = metrics[metrics.length - 1].muscleMass!;
                    goals.push({
                        label: isTurkish ? 'Kas' : 'Muscle',
                        current: latestMuscleMass,
                        target: findGoalTarget(['muscle', 'muscle_mass', 'muscle_percentage'], latestMuscleMass),
                        unit: '%',
                        icon: 'fitness-outline',
                        color: '#2ecc71',
                    });
                }
            }
            if (workoutData && workoutData.length > 0) {
                const workoutCurrent = Number(workoutData[0].total_workouts) || 0;
                goals.push({
                    label: isTurkish ? 'Antrenman' : 'Workouts',
                    current: workoutCurrent,
                    target: findGoalTarget(
                        ['workout', 'workouts', 'training', 'training_sessions'],
                        period === 'weekly' ? 5 : period === 'monthly' ? 20 : 240
                    ),
                    unit: '',
                    icon: 'barbell-outline',
                    color: '#9b59b6',
                });
            }
            setGoalProgress(goals);

        } catch (err) {
            console.error('useProgressReport error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period, targetUserId, isTurkish]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    return {
        loading,
        refreshing,
        bodyMetrics,
        workoutSummary,
        nutritionSummary,
        hydrationSummary,
        goalProgress,
        onRefresh,
    };
}
