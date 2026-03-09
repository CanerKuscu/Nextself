import { useState, useEffect, useCallback } from 'react';
import { SupabaseService } from '../services/supabase';

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

export function useProgressReport(period: Period, isTurkish: boolean) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
    const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
    const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
    const [goalProgress, setGoalProgress] = useState<{ label: string; current: number; target: number; unit: string; icon: string; color: string }[]>([]);

    const supabase = SupabaseService.getInstance();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { user } = await supabase.getCurrentUser();
            if (!user) return;

            const now = new Date();
            let startDate: Date;
            if (period === 'weekly') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            else if (period === 'monthly') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            else startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

            const startIso = startDate.toISOString();
            const startDateOnly = startIso.split('T')[0];

            // 1. Fetch Body Metrics
            const { data: healthData } = await supabase.getClient()
                .from('health_data')
                .select('*')
                .eq('user_id', user.id)
                .gte('timestamp', startIso)
                .not('weight', 'is', null)
                .order('timestamp', { ascending: true });

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

            // 2. Fetch Workout Summary via RPC
            const { data: workoutData, error: wErr } = await supabase.getClient()
                .rpc('get_workout_summary', { p_user_id: user.id, p_start_date: startIso });

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

            // 3. Fetch Nutrition Summary via RPC
            const { data: nutData, error: nErr } = await supabase.getClient()
                .rpc('get_nutrition_summary', { p_user_id: user.id, p_start_date: startDateOnly });

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

            // Goal Progress calculation
            const goals: typeof goalProgress = [];
            const isTurkish = false; // Note: You might want to pass translations into this hook

            if (metrics.length > 0) {
                const latestWeight = metrics[metrics.length - 1].weight;
                goals.push({
                    label: 'Weight',
                    current: latestWeight,
                    target: 75,
                    unit: 'kg',
                    icon: 'scale-outline',
                    color: '#3498db',
                });
                if (metrics[metrics.length - 1].bodyFat) {
                    goals.push({
                        label: 'Body Fat',
                        current: metrics[metrics.length - 1].bodyFat!,
                        target: 15,
                        unit: '%',
                        icon: 'flame-outline',
                        color: '#e74c3c',
                    });
                }
                if (metrics[metrics.length - 1].muscleMass) {
                    goals.push({
                        label: 'Muscle',
                        current: metrics[metrics.length - 1].muscleMass!,
                        target: 45,
                        unit: '%',
                        icon: 'fitness-outline',
                        color: '#2ecc71',
                    });
                }
            }
            // Simplified goal adding
            if (workoutData && workoutData.length > 0) {
                goals.push({
                    label: 'Weekly Workouts',
                    current: Number(workoutData[0].total_workouts) || 0,
                    target: period === 'weekly' ? 5 : period === 'monthly' ? 20 : 240,
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
    }, [period]);

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
        goalProgress,
        onRefresh,
    };
}
