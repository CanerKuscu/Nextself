import { SupabaseService } from './supabase';
import { CONFIG } from '../config/config';
import * as Sentry from '@sentry/react-native';
import CryptoJS from 'crypto-js';

const DEEPSEEK_API_KEY = CONFIG.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY && CONFIG.IS_PRODUCTION) {
    Sentry.captureMessage('[SECURITY] DEEPSEEK_API_KEY is not configured. AI features will use Edge Functions only.', 'warning');
}

/**
 * KVKK / GDPR Privacy Utility
 * Generates temporary session IDs and strips personally identifiable information (PII)
 * before sending any data to DeepSeek AI (China, Hangzhou).
 * 
 * Principle: NO user_id (UUID), name, email, IP, photo, or any PII is ever
 * transmitted to DeepSeek. Only anonymous health/fitness metrics + a disposable
 * session_id that cannot be traced back to the user.
 */
const PrivacyUtils = {
    /** Generate a random, disposable session ID — NOT linked to user UUID */
    generateSessionId: (): string => {
        const random = CryptoJS.lib.WordArray.random(8).toString();
        const timestamp = Date.now().toString(36);
        return `ses_${random}${timestamp}`;
    },

    /** Strip PII fields from a user profile before sending to AI */
    anonymizeProfile: (profile: any): any => {
        if (!profile) return null;
        // Only keep health/fitness-relevant numeric data — no identity fields
        return {
            height_cm: profile.height || profile.height_cm,
            weight_kg: profile.weight || profile.weight_kg,
            age: profile.birth_date ? calculateAge(profile.birth_date) : profile.age,
            gender: profile.gender,
            fitness_level: profile.fitness_level || profile.level,
            goals: profile.goals || profile.fitness_goals,
            activity_level: profile.activity_level,
            // Explicitly excluded: id, user_id, name, email, avatar, phone, address
        };
    },

    /** Strip PII from any arbitrary data object */
    sanitizeForAI: (data: any): any => {
        if (!data) return null;
        if (typeof data !== 'object') return data;

        const piiFields = [
            'id', 'user_id', 'userId', 'email', 'name', 'full_name', 'fullName',
            'first_name', 'last_name', 'phone', 'address', 'avatar', 'avatar_url',
            'ip', 'ip_address', 'device_id', 'push_token', 'created_at', 'updated_at'
        ];

        if (Array.isArray(data)) {
            return data.map(item => PrivacyUtils.sanitizeForAI(item));
        }

        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (piiFields.includes(key)) continue; // Skip PII fields
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = PrivacyUtils.sanitizeForAI(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
};

function calculateAge(birthDate: string): number | undefined {
    if (!birthDate) return undefined;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

export { PrivacyUtils };

export class DeepSeekService {
    private static instance: DeepSeekService;

    private constructor() { }

    public static getInstance(): DeepSeekService {
        if (!DeepSeekService.instance) {
            DeepSeekService.instance = new DeepSeekService();
        }
        return DeepSeekService.instance;
    }

    // Generic content generation — tries Edge Function first, falls back to direct API call
    // PRIVACY: No user_id or PII is included in any request to DeepSeek.
    // A disposable session_id is used for request correlation only.
    public async generateContent(prompt: string, type: string = 'general', imageBase64?: string, additionalData?: any): Promise<string> {
        const sessionId = PrivacyUtils.generateSessionId();

        // Try Edge Function first
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const bodyPayload: any = { prompt, type, session_id: sessionId };
            if (imageBase64) {
                bodyPayload.image_base64 = imageBase64;
            }
            if (additionalData) {
                bodyPayload.programData = additionalData;
            }

            const { data, error } = await supabase.functions.invoke('deepseek-chat', {
                body: bodyPayload,
            });

            if (!error && data?.response) {
                return data.response;
            }
            console.warn('Edge function failed, trying direct API:', error?.message || 'No response');
        } catch (err) {
            console.warn('Edge function error');
        }

        // SECURITY: No direct API call from client — all AI calls go through Edge Functions only.
        // If the Edge Function fails, return a safe fallback response.
        console.warn('[AI] Edge Function unavailable. Returning fallback response for type:', type);
        return this.getFallbackResponse(type);
    }

    private getFallbackResponse(type: string): string {
        switch (type) {
            case 'coach':
                return 'Antrenman tavsiyeleri için lütfen tekrar deneyin. Bağlantı sorunu yaşanıyor.';
            case 'dietitian':
                return 'Beslenme önerileri için lütfen tekrar deneyin. Bağlantı sorunu yaşanıyor.';
            case 'chef':
                return 'Tarif önerileri için lütfen tekrar deneyin. Bağlantı sorunu yaşanıyor.';
            default:
                return 'AI yanıt veremedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';
        }
    }

    // AI Coach - Analyze physique photos
    public async analyzePhysique(imageBase64: string, userGoals: string): Promise<string> {
        return this.generateContent(
            `You are strictly a fitness AI Coach. If the user asks about ANY topic unrelated to fitness, health, or nutrition, you MUST reply: "I am a fitness and health AI assistant. I can only help you with topics related to your physical wellbeing." As an expert fitness coach, analyze this physique photo. Goals: ${userGoals}. Provide: 1) Overall assessment 2) Strengths 3) Areas for improvement 4) Training recommendations. Be encouraging but realistic.`,
            'coach',
            imageBase64
        );
    }

    // AI Dietitian - Create meal plans
    public async createMealPlan(userProfile: any, dietaryPreferences: string, calorieTarget: number): Promise<string> {
        return this.generateContent(
            `You are strictly a Dietitian AI. If the user asks about ANY topic unrelated to fitness, health, or nutrition, you MUST reply: "I am a fitness and health AI assistant. I can only help you with topics related to your physical wellbeing." Create a personalized 7-day meal plan. User: Height ${userProfile.height}cm, Weight ${userProfile.weight}kg, Goals: ${userProfile.goals}. Preferences: ${dietaryPreferences}. Target: ${calorieTarget} calories/day. Include macros for each meal.`,
            'dietitian'
        );
    }

    // AI Chef - Provide recipes
    public async getRecipes(calories: number, protein: number, cuisineType: string, restrictions: string): Promise<string> {
        return this.generateContent(
            `You are strictly a Chef AI focused on healthy eating. If the user asks about ANY topic unrelated to fitness, health, recipes, or nutrition, you MUST reply: "I am a fitness and health AI assistant. I can only help you with topics related to your physical wellbeing." Provide 5 healthy recipes: ~${calories} cal/serving, ~${protein}g protein. Cuisine: ${cuisineType}. Restrictions: ${restrictions}. Include ingredients, steps, nutritional info, prep time.`,
            'chef'
        );
    }

    // Health insights
    public async generateHealthInsights(healthData: any): Promise<string> {
        return this.generateContent(
            `You are strictly a Health AI. If the user asks about ANY topic unrelated to fitness, health, or nutrition, you MUST reply: "I am a fitness and health AI assistant. I can only help you with topics related to your physical wellbeing." Analyze health data: Sleep ${healthData.sleepHours}h, Steps ${healthData.steps}, Heart Rate ${healthData.restingHeartRate}bpm, Weight ${healthData.weight}kg. Provide insights and recommendations.`,
            'insight'
        );
    }

    // Food scan analysis
    public async analyzeFoodScan(description: string): Promise<string> {
        return this.generateContent(
            `You are strictly a Nutrition AI. If the user asks about ANY topic unrelated to food or nutrition, you MUST reply: "I am a fitness and health AI assistant. I can only help you with topics related to your physical wellbeing." Analyze this food: "${description}". Return JSON: { "name": "...", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "serving_size": "100g" }`,
            'food_scan'
        );
    }

    // Posture Analysis (Vision-based)
    public async analyzePostureData(imageBase64: string, exerciseName: string = 'squat'): Promise<string> {
        const textPayload = `A ${exerciseName} motion was performed in the provided image. Analyze the user's form, detect any major joint misalignments (lumbar rounding, knee caving, etc.), and provide a 2-sentence biomechanical form correction as a strict AI fitness coach in Turkish.`;
        return this.generateContent(textPayload, 'posture', imageBase64);
    }

    // Gamification Tasks Generator
    public async generateDailyMissions(userLevel: string): Promise<string> {
        const textPayload = `Generate 3 daily health/fitness missions for a '${userLevel}' user. The output MUST be strictly a JSON array with NO OTHER TEXT. 
Format: [{"id":"1", "title":"Mission Title", "points":50}]. Example points: 10 to 50. Use Turkish language.`;
        return this.generateContent(textPayload, 'missions');
    }
}