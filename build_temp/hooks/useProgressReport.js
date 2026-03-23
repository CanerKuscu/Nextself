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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProgressReport = useProgressReport;
const react_1 = require("react");
const supabase_1 = require("../services/supabase");
function useProgressReport(period, isTurkish, targetUserId) {
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [bodyMetrics, setBodyMetrics] = (0, react_1.useState)([]);
    const [workoutSummary, setWorkoutSummary] = (0, react_1.useState)(null);
    const [nutritionSummary, setNutritionSummary] = (0, react_1.useState)(null);
    const [goalProgress, setGoalProgress] = (0, react_1.useState)([]);
    const supabase = supabase_1.SupabaseService.getInstance();
    const loadData = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        try {
            const { user: currentUser } = yield supabase.getCurrentUser();
            const userId = targetUserId || (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id);
            if (!userId)
                return;
            const now = new Date();
            let startDate;
            if (period === 'weekly')
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            else if (period === 'monthly')
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            else
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            const startIso = startDate.toISOString();
            const startDateOnly = startIso.split('T')[0];
            const [{ data: healthData }, { data: workoutData, error: wErr }, { data: nutData, error: nErr }] = yield Promise.all([
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
            ]);
            const metrics = (healthData || []).map((r) => ({
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
            }
            else if (wErr) {
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
                }
                else {
                    setNutritionSummary(null);
                }
            }
            else if (nErr) {
                console.warn('RPC get_nutrition_summary error:', nErr);
            }
            // Goal Progress calculation
            const goals = [];
            if (metrics.length > 0) {
                const latestWeight = metrics[metrics.length - 1].weight;
                goals.push({
                    label: isTurkish ? 'Kilo' : 'Weight',
                    current: latestWeight,
                    target: 75,
                    unit: 'kg',
                    icon: 'scale-outline',
                    color: '#3498db',
                });
                if (metrics[metrics.length - 1].bodyFat) {
                    goals.push({
                        label: isTurkish ? 'Vücut Yağı' : 'Body Fat',
                        current: metrics[metrics.length - 1].bodyFat,
                        target: 15,
                        unit: '%',
                        icon: 'flame-outline',
                        color: '#e74c3c',
                    });
                }
                if (metrics[metrics.length - 1].muscleMass) {
                    goals.push({
                        label: isTurkish ? 'Kas' : 'Muscle',
                        current: metrics[metrics.length - 1].muscleMass,
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
                    label: isTurkish ? 'Antrenman' : 'Workouts',
                    current: Number(workoutData[0].total_workouts) || 0,
                    target: period === 'weekly' ? 5 : period === 'monthly' ? 20 : 240,
                    unit: '',
                    icon: 'barbell-outline',
                    color: '#9b59b6',
                });
            }
            setGoalProgress(goals);
        }
        catch (err) {
            console.error('useProgressReport error:', err);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }), [period, targetUserId, isTurkish]);
    (0, react_1.useEffect)(() => {
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
