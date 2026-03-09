import { SupabaseService } from './supabase';
import { PrivacyUtils } from './deepseek';
import { getLocalDateString } from '../utils/dateUtils';
import { NutritionalProfile, HealthMetrics } from '../types';

const supabase = SupabaseService.getInstance().getClient();

export interface PersonalizedWorkoutPlan {
    id: string;
    user_id: string;
    plan_name: string;
    goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'general_fitness';
    level: 'beginner' | 'intermediate' | 'advanced';
    duration_weeks: number;
    workouts_per_week: number;
    exercises: WorkoutExercise[];
    created_at: string;
    updated_at: string;
}

export interface WorkoutExercise {
    id: string;
    exercise_id: string;
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    rest_seconds: number;
    notes?: string;
}

export interface NutritionPlan {
    id: string;
    user_id: string;
    plan_name: string;
    goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'performance';
    daily_calories: number;
    protein_grams: number;
    carbs_grams: number;
    fat_grams: number;
    meals_per_day: number;
    dietary_restrictions: string[];
    created_at: string;
    updated_at: string;
}

export interface MealPlan {
    id: string;
    nutrition_plan_id: string;
    day_of_week: number; // 0-6 (Sunday-Saturday)
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    foods: MealFood[];
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
}

export interface MealFood {
    food_id: string;
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

// AI input/output types
export interface WorkoutAIInput {
    goal: string;
    level: string;
}

export interface WorkoutAIResponse {
    plan_name: string;
    duration_weeks: number;
    workouts_per_week: number;
    exercises: WorkoutExercise[];
}

export interface NutritionAIInput {
    goal: string;
}

export interface NutritionAIResponse {
    plan_name: string;
    meals_per_day: number;
    meal_plans: MealPlan[];
}

export interface AIAnalysis {
    id: string;
    user_id: string;
    analysis_type: 'workout' | 'nutrition' | 'progress' | 'recovery';
    data: unknown; // Replaced 'any' with 'unknown' for type safety
    insights: string[];
    recommendations: string[];
    confidence_score: number;
    created_at: string;
}

export class AIEnhancementsService {
    /**
     * Generate personalized workout plan
     */
    static async generateWorkoutPlan(
        userId: string,
        goal: string,
        level: string,
        availableTime: number,
        equipment: string[] = []
    ): Promise<PersonalizedWorkoutPlan | null> {
        try {
            // Get user profile and preferences
            const userProfile = await this.getUserProfile(userId);
            const workoutHistory = await this.getWorkoutHistory(userId, 30); // Last 30 days
            const fitnessLevel = await this.assessFitnessLevel(userId);

            // Prepare data for AI — ANONYMIZED (PII stripped before sending to DeepSeek)
            const aiInput = {
                user_profile: PrivacyUtils.anonymizeProfile(userProfile),
                goal,
                level,
                available_time_minutes: availableTime,
                equipment_available: equipment,
                workout_history: PrivacyUtils.sanitizeForAI(workoutHistory),
                fitness_level: fitnessLevel,
                preferences: PrivacyUtils.sanitizeForAI(await this.getUserPreferences(userId))
            };

            // Call AI service (placeholder - in real implementation, call actual AI API)
            const aiResponse = await this.callWorkoutAI(aiInput);

            if (!aiResponse) {
                return null;
            }

            // Save the generated plan
            const plan: Omit<PersonalizedWorkoutPlan, 'id' | 'created_at' | 'updated_at'> = {
                user_id: userId,
                plan_name: aiResponse.plan_name || `${goal} ${level} Plan`,
                goal: goal as any,
                level: level as any,
                duration_weeks: aiResponse.duration_weeks || 4,
                workouts_per_week: aiResponse.workouts_per_week || 3,
                exercises: aiResponse.exercises || []
            };

            const { data, error } = await supabase
                .from('workout_plans')
                .insert(plan)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error generating workout plan:', error);
            return null;
        }
    }

    /**
     * Generate personalized nutrition plan
     */
    static async generateNutritionPlan(
        userId: string,
        goal: string,
        dietaryRestrictions: string[] = []
    ): Promise<NutritionPlan | null> {
        try {
            // Get user data
            const userProfile = await this.getUserProfile(userId);
            const healthData = await this.getRecentHealthData(userId, 7); // Last 7 days
            const foodPreferences = await this.getFoodPreferences(userId);

            // Calculate nutritional needs
            const nutritionalNeeds = this.calculateNutritionalNeeds(userProfile, goal, healthData);

            // Prepare AI input — ANONYMIZED (PII stripped before sending to DeepSeek)
            const aiInput = {
                user_profile: PrivacyUtils.anonymizeProfile(userProfile),
                goal,
                dietary_restrictions: dietaryRestrictions,
                nutritional_needs: nutritionalNeeds,
                food_preferences: PrivacyUtils.sanitizeForAI(foodPreferences),
                health_data: PrivacyUtils.sanitizeForAI(healthData)
            };

            // Call AI service
            const aiResponse = await this.callNutritionAI(aiInput);

            if (!aiResponse) {
                return null;
            }

            // Save nutrition plan
            const plan: Omit<NutritionPlan, 'id' | 'created_at' | 'updated_at'> = {
                user_id: userId,
                plan_name: aiResponse.plan_name || `${goal} Nutrition Plan`,
                goal: goal as any,
                daily_calories: nutritionalNeeds.calories,
                protein_grams: nutritionalNeeds.protein,
                carbs_grams: nutritionalNeeds.carbs,
                fat_grams: nutritionalNeeds.fat,
                meals_per_day: aiResponse.meals_per_day || 3,
                dietary_restrictions: dietaryRestrictions
            };

            const { data, error } = await supabase
                .from('nutrition_plans')
                .insert(plan)
                .select()
                .single();

            if (error) throw error;

            // Generate meal plans if provided by AI
            if (aiResponse.meal_plans) {
                await this.generateMealPlans(data.id, aiResponse.meal_plans);
            }

            return data;
        } catch (error) {
            console.error('Error generating nutrition plan:', error);
            return null;
        }
    }

    /**
     * Analyze workout performance
     */
    static async analyzeWorkoutPerformance(
        userId: string,
        workoutSessionId: string
    ): Promise<AIAnalysis | null> {
        try {
            // Get workout session data
            const { data: session, error: sessionError } = await supabase
                .from('workout_sessions')
                .select('*, exercises:workout_exercises(*)')
                .eq('id', workoutSessionId)
                .single();

            if (sessionError) throw sessionError;

            // Get previous sessions for comparison
            const previousSessions = await this.getWorkoutHistory(userId, 30);

            // Prepare AI input — ANONYMIZED (PII stripped before sending to DeepSeek)
            const rawProfile = await this.getUserProfile(userId);
            const aiInput = {
                current_session: PrivacyUtils.sanitizeForAI(session),
                previous_sessions: PrivacyUtils.sanitizeForAI(previousSessions),
                user_profile: PrivacyUtils.anonymizeProfile(rawProfile),
                fitness_goals: PrivacyUtils.sanitizeForAI(await this.getUserFitnessGoals(userId))
            };

            // Call AI service
            const aiResponse = await this.callPerformanceAI(aiInput);

            if (!aiResponse) {
                return null;
            }

            // Save analysis
            const analysis: Omit<AIAnalysis, 'id' | 'created_at'> = {
                user_id: userId,
                analysis_type: 'workout',
                data: aiInput,
                insights: aiResponse.insights || [],
                recommendations: aiResponse.recommendations || [],
                confidence_score: aiResponse.confidence_score || 0.8
            };

            const { data, error } = await supabase
                .from('ai_analyses')
                .insert(analysis)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error analyzing workout performance:', error);
            return null;
        }
    }

    /**
     * Analyze nutrition intake
     */
    static async analyzeNutritionIntake(
        userId: string,
        date: string
    ): Promise<AIAnalysis | null> {
        try {
            // Get nutrition data for the day
            const nutritionData = await this.getDailyNutrition(userId, date);
            const nutritionPlan = await this.getCurrentNutritionPlan(userId);
            const healthData = await this.getDailyHealthData(userId, date);

            // Prepare AI input — ANONYMIZED (PII stripped before sending to DeepSeek)
            const rawProfile = await this.getUserProfile(userId);
            const aiInput = {
                nutrition_data: PrivacyUtils.sanitizeForAI(nutritionData),
                nutrition_plan: PrivacyUtils.sanitizeForAI(nutritionPlan),
                health_data: PrivacyUtils.sanitizeForAI(healthData),
                user_profile: PrivacyUtils.anonymizeProfile(rawProfile),
                goals: PrivacyUtils.sanitizeForAI(await this.getUserFitnessGoals(userId))
            };

            // Call AI service
            const aiResponse = await this.callNutritionAnalysisAI(aiInput);

            if (!aiResponse) {
                return null;
            }

            // Save analysis
            const analysis: Omit<AIAnalysis, 'id' | 'created_at'> = {
                user_id: userId,
                analysis_type: 'nutrition',
                data: aiInput,
                insights: aiResponse.insights || [],
                recommendations: aiResponse.recommendations || [],
                confidence_score: aiResponse.confidence_score || 0.8
            };

            const { data, error } = await supabase
                .from('ai_analyses')
                .insert(analysis)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error analyzing nutrition intake:', error);
            return null;
        }
    }

    /**
     * Predict recovery time
     */
    static async predictRecoveryTime(
        userId: string,
        workoutIntensity: number,
        muscleGroups: string[]
    ): Promise<number> {
        try {
            const recentWorkouts = await this.getWorkoutHistory(userId, 7);
            const sleepData = await this.getRecentSleepData(userId, 7);
            const nutritionData = await this.getRecentNutritionData(userId, 3);
            const stressLevel = await this.getStressLevel(userId);

            // ANONYMIZED (PII stripped before sending to DeepSeek)
            const rawProfile = await this.getUserProfile(userId);
            const aiInput = {
                workout_intensity: workoutIntensity,
                muscle_groups: muscleGroups,
                recent_workouts: PrivacyUtils.sanitizeForAI(recentWorkouts),
                sleep_data: PrivacyUtils.sanitizeForAI(sleepData),
                nutrition_data: PrivacyUtils.sanitizeForAI(nutritionData),
                stress_level: stressLevel,
                user_profile: PrivacyUtils.anonymizeProfile(rawProfile)
            };

            const aiResponse = await this.callRecoveryAI(aiInput);
            return aiResponse?.recovery_hours || 48; // Default 48 hours
        } catch (error) {
            console.error('Error predicting recovery time:', error);
            return 48; // Default fallback
        }
    }

    /**
     * Suggest workout modifications
     */
    static async suggestWorkoutModifications(
        userId: string,
        currentPlanId: string,
        reason: 'plateau' | 'injury' | 'boredom' | 'time_constraint'
    ): Promise<PersonalizedWorkoutPlan | null> {
        try {
            const currentPlan = await this.getWorkoutPlan(currentPlanId);
            const progressData = await this.getProgressData(userId, 30);
            const userFeedback = await this.getUserFeedback(userId);

            // ANONYMIZED (PII stripped before sending to DeepSeek)
            const rawProfile = await this.getUserProfile(userId);
            const aiInput = {
                current_plan: PrivacyUtils.sanitizeForAI(currentPlan),
                reason_for_change: reason,
                progress_data: PrivacyUtils.sanitizeForAI(progressData),
                user_feedback: PrivacyUtils.sanitizeForAI(userFeedback),
                user_profile: PrivacyUtils.anonymizeProfile(rawProfile)
            };

            const aiResponse = await this.callModificationAI(aiInput);

            if (!aiResponse) {
                return null;
            }

            // Create modified plan
            const modifiedPlan: Omit<PersonalizedWorkoutPlan, 'id' | 'created_at' | 'updated_at'> = {
                user_id: userId,
                plan_name: `${currentPlan?.plan_name} (Modified)`,
                goal: currentPlan?.goal || 'general_fitness',
                level: currentPlan?.level || 'intermediate',
                duration_weeks: aiResponse.duration_weeks || currentPlan?.duration_weeks || 4,
                workouts_per_week: aiResponse.workouts_per_week || currentPlan?.workouts_per_week || 3,
                exercises: aiResponse.exercises || currentPlan?.exercises || []
            };

            const { data, error } = await supabase
                .from('workout_plans')
                .insert(modifiedPlan)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error suggesting workout modifications:', error);
            return null;
        }
    }

    // ==================== HELPER METHODS ====================

    private static async getUserProfile(userId: string): Promise<any> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
        return data;
    }

    private static async getWorkoutHistory(userId: string, days: number): Promise<any[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('workout_sessions')
            .select('*, exercises:workout_exercises(*)')
            .eq('user_id', userId)
            .gte('start_time', startDate.toISOString())
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Error getting workout history:', error);
            return [];
        }
        return data || [];
    }

    private static async assessFitnessLevel(userId: string): Promise<string> {
        // Simple assessment based on workout frequency and intensity
        const workouts = await this.getWorkoutHistory(userId, 30);

        if (workouts.length === 0) return 'beginner';
        if (workouts.length < 8) return 'beginner';
        if (workouts.length < 15) return 'intermediate';
        return 'advanced';
    }

    private static async getUserPreferences(userId: string): Promise<any> {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error getting user preferences:', error);
            return {};
        }
        return data || {};
    }

    private static async getRecentHealthData(userId: string, days: number): Promise<any[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('health_data')
            .select('*')
            .eq('user_id', userId)
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error getting health data:', error);
            return [];
        }
        return data || [];
    }

    private static async getFoodPreferences(userId: string): Promise<any> {
        const { data, error } = await supabase
            .from('food_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error getting food preferences:', error);
            return {};
        }
        return data || {};
    }

    private static calculateNutritionalNeeds(
        userProfile: NutritionalProfile,
        goal: string,
        healthData: HealthMetrics[]
    ): { calories: number; protein: number; carbs: number; fat: number } {
        // Simplified calculation - in real app, use proper formulas
        const weight = userProfile?.weight || 70;
        const height = userProfile?.height || 170;
        const age = userProfile?.age || 30;
        const activityLevel = userProfile?.activity_level || 'moderate';

        // BMR calculation (Mifflin-St Jeor Equation)
        let bmr = 10 * weight + 6.25 * height - 5 * age;
        if (userProfile?.gender === 'male') {
            bmr += 5;
        } else {
            bmr -= 161;
        }

        // Activity multiplier
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9
        };

        const tdee = bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55);

        // Adjust for goal
        let targetCalories = tdee;
        switch (goal) {
            case 'weight_loss':
                targetCalories = tdee * 0.8; // 20% deficit
                break;
            case 'muscle_gain':
                targetCalories = tdee * 1.1; // 10% surplus
                break;
            case 'performance':
                targetCalories = tdee * 1.15; // 15% surplus
                break;
        }

        // Macronutrient distribution
        const proteinPerKg = goal === 'muscle_gain' ? 2.2 : 1.6;
        const protein = weight * proteinPerKg;
        const fat = (targetCalories * 0.25) / 9; // 25% from fat
        const carbs = (targetCalories - (protein * 4 + fat * 9)) / 4;

        return {
            calories: Math.round(targetCalories),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat)
        };
    }

    private static async generateMealPlans(
        nutritionPlanId: string,
        mealPlans: any[]
    ): Promise<void> {
        for (const mealPlan of mealPlans) {
            await supabase
                .from('meal_plans')
                .insert({
                    nutrition_plan_id: nutritionPlanId,
                    ...mealPlan
                });
        }
    }

    // Placeholder AI methods - these would call actual AI APIs in production
    private static async callWorkoutAI(input: WorkoutAIInput): Promise<WorkoutAIResponse> {
        // In production, this would call an actual AI API
        console.log('Calling workout AI');
        return {
            plan_name: `${input.goal} ${input.level} Workout Plan`,
            duration_weeks: 4,
            workouts_per_week: 3,
            exercises: []
        };
    }

    private static async callNutritionAI(input: NutritionAIInput): Promise<NutritionAIResponse> {
        // In production, this would call an actual AI API
        console.log('Calling nutrition AI');
        return {
            plan_name: `${input.goal} Nutrition Plan`,
            meals_per_day: 3,
            meal_plans: []
        };
    }

    private static async callPerformanceAI(input: unknown): Promise<{
        insights: string[];
        recommendations: string[];
        confidence_score: number;
    }> {
        // In production, this would call an actual AI API
        console.log('Calling performance AI');
        return {
            insights: ['Good progress on strength exercises'],
            recommendations: ['Increase weight by 5% for compound lifts'],
            confidence_score: 0.85
        };
    }

    private static async callNutritionAnalysisAI(input: any): Promise<any> {
        // In production, this would call an actual AI API
        console.log('Calling nutrition analysis AI');
        return {
            insights: ['Meeting protein goals consistently'],
            recommendations: ['Increase fiber intake'],
            confidence_score: 0.8
        };
    }

    private static async callRecoveryAI(input: any): Promise<any> {
        // In production, this would call an actual AI API
        console.log('Calling recovery AI');
        return {
            recovery_hours: 48
        };
    }

    private static async callModificationAI(input: any): Promise<any> {
        // In production, this would call an actual AI API
        console.log('Calling modification AI');
        return {
            duration_weeks: 4,
            workouts_per_week: 3,
            exercises: []
        };
    }

    // Additional helper methods that are referenced but not implemented
    private static async getUserFitnessGoals(userId: string): Promise<any> {
        const { data, error } = await supabase
            .from('user_goals')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error getting user fitness goals:', error);
            return {};
        }
        return data || {};
    }

    private static async getDailyNutrition(userId: string, date: string): Promise<any> {
        const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date);

        if (error) {
            console.error('Error getting daily nutrition:', error);
            return [];
        }
        return data || [];
    }

    private static async getCurrentNutritionPlan(userId: string): Promise<any> {
        const { data, error } = await supabase
            .from('nutrition_plans')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error getting current nutrition plan:', error);
            return null;
        }
        return data;
    }

    private static async getDailyHealthData(userId: string, date: string): Promise<any> {
        const { data, error } = await supabase
            .from('health_data')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date);

        if (error) {
            console.error('Error getting daily health data:', error);
            return [];
        }
        return data || [];
    }

    private static async getRecentSleepData(userId: string, days: number): Promise<any[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('sleep_data')
            .select('*')
            .eq('user_id', userId)
            .gte('date', getLocalDateString(startDate))
            .order('date', { ascending: false });

        if (error) {
            console.error('Error getting recent sleep data:', error);
            return [];
        }
        return data || [];
    }

    private static async getRecentNutritionData(userId: string, days: number): Promise<any[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('date', getLocalDateString(startDate))
            .order('date', { ascending: false });

        if (error) {
            console.error('Error getting recent nutrition data:', error);
            return [];
        }
        return data || [];
    }

    private static async getStressLevel(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('stress_logs')
            .select('level')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error getting stress level:', error);
            return 3; // Default medium stress
        }
        return data?.level || 3;
    }

    private static async getWorkoutPlan(planId: string): Promise<PersonalizedWorkoutPlan | null> {
        const { data, error } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (error) {
            console.error('Error getting workout plan:', error);
            return null;
        }
        return data;
    }

    private static async getProgressData(userId: string, days: number): Promise<any[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('progress_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('date', getLocalDateString(startDate))
            .order('date', { ascending: false });

        if (error) {
            console.error('Error getting progress data:', error);
            return [];
        }
        return data || [];
    }

    private static async getUserFeedback(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('user_feedback')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error getting user feedback:', error);
            return [];
        }
        return data || [];
    }
}
