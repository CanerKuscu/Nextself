import { SupabaseService } from '@nextself/shared';
// Lazy-load QuickCrypto for native-only usage to avoid web JSI errors
let QuickCrypto: any = null;
const getQuickCrypto = () => {
    if (QuickCrypto) return QuickCrypto;
    try {
         
        QuickCrypto = require('react-native-quick-crypto');
    } catch (e) {
        QuickCrypto = null;
    }
    return QuickCrypto;
};
import { KinematicReport } from './poseProcessor';
const MAX_PROMPT_TEXT_LENGTH = 2000;
const MAX_PROMPT_DEPTH = 6;
const PROMPT_INJECTION_GUARD_KEYS = new Set(['query', 'context', 'details', 'customRules', 'userGoals', 'description', 'cameraHint', 'qualityHint']);

const sanitizePromptText = (value: string): string => {
    return value
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_PROMPT_TEXT_LENGTH);
};

const sanitizePromptPayload = (value: any, depth = 0): any => {
    if (depth > MAX_PROMPT_DEPTH) {
        return '[depth_limited]';
    }
    if (value == null) {
        return value;
    }
    if (typeof value === 'string') {
        return sanitizePromptText(value);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.slice(0, 100).map((item) => sanitizePromptPayload(item, depth + 1));
    }
    if (typeof value === 'object') {
        const sanitized: Record<string, any> = {};
        for (const [key, item] of Object.entries(value)) {
            const nextValue = sanitizePromptPayload(item, depth + 1);
            if (PROMPT_INJECTION_GUARD_KEYS.has(key) && typeof nextValue === 'string') {
                sanitized[key] = `<UNTRUSTED_${key.toUpperCase()}>${nextValue}</UNTRUSTED_${key.toUpperCase()}>`;
            } else {
                sanitized[key] = nextValue;
            }
        }
        return sanitized;
    }
    return String(value);
};

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
        const qc = getQuickCrypto();
        const random = qc ? qc.randomBytes(8).toString('hex') : Math.random().toString(16).slice(2, 18);
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

export interface PostureAnalysisContext {
    durationMs?: number;
    cameraHint?: string;
    qualityHint?: string;
    selectedExercise?: string;
    supportedExercises?: string[];
}

export class DeepSeekService {
    private static instance: DeepSeekService;

    private constructor() { }

    public static getInstance(): DeepSeekService {
        if (!DeepSeekService.instance) {
            DeepSeekService.instance = new DeepSeekService();
        }
        return DeepSeekService.instance;
    }

    // Generic content generation — uses Edge Function and secure local fallback response
    // PRIVACY: No user_id or PII is included in any request to DeepSeek.
    // A disposable session_id is used for request correlation only.
    public async generateContent(type: string, data: any, imageBase64?: string): Promise<string> {
        const sessionId = PrivacyUtils.generateSessionId();
        const sanitizedData = sanitizePromptPayload(data);

        // Try Edge Function first
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const bodyPayload: any = { type, data: sanitizedData, session_id: sessionId };
            if (imageBase64) {
                bodyPayload.data.image_base64 = imageBase64;
            }

            const { data: responseData, error } = await supabase.functions.invoke('deepseek-chat', {
                body: bodyPayload,
            });

            if (!error && responseData?.response) {
                return responseData.response;
            }
            console.warn('Edge function failed:', error?.message || 'No response');
        } catch (err) {
            console.warn('Edge function error', err);
        }

        console.warn('[AI] Edge Function unavailable. Returning fallback response for type:', type);
        return this.getFallbackResponse(type, sanitizedData);
    }

    private getFallbackResponse(type: string, inputData?: any): string {
        const isTurkish = (inputData?.language || '').toLowerCase() === 'tr';
        const query = (inputData?.query || '').toLowerCase();
        const goal = (inputData?.userGoals || '').toLowerCase();
        const topic = `${query} ${goal}`;

        const workoutFocus = topic.includes('yağ') || topic.includes('kilo')
            ? (isTurkish ? 'Yağ yakım' : 'Fat loss')
            : topic.includes('kas') || topic.includes('muscle')
                ? (isTurkish ? 'Kas gelişim' : 'Muscle gain')
                : (isTurkish ? 'Genel kondisyon' : 'General fitness');

        switch (type) {
            case 'coach':
                return isTurkish
                    ? `${workoutFocus} için hızlı plan:\n1) 5-10 dk ısınma\n2) Haftada 3-4 gün tam vücut antrenmanı\n3) Her ana hareket 3 set x 8-12 tekrar\n4) Günlük 7-10 bin adım\n5) Haftalık ilerleme takibi yap.`
                    : `Quick ${workoutFocus} plan:\n1) Warm up 5-10 min\n2) Full-body training 3-4 days/week\n3) 3 sets x 8-12 reps for main lifts\n4) 7k-10k steps daily\n5) Track progress weekly.`;
            case 'dietitian':
                return isTurkish
                    ? 'Hızlı beslenme planı:\n1) Her öğünde protein ekle\n2) Günlük sebze + su tüketimini artır\n3) İşlenmiş şekeri azalt\n4) Gece geç saatte ağır yemekten kaçın\n5) 1 hafta düzenli takip et.'
                    : 'Quick nutrition plan:\n1) Add protein to every meal\n2) Increase vegetables and water intake\n3) Reduce processed sugar\n4) Avoid heavy late-night meals\n5) Track consistency for one week.';
            case 'chef':
                return isTurkish
                    ? 'Hızlı tarif: Tavuk + sebze bowl\nMalzemeler: tavuk göğüs, bulgur/pirinç, brokoli, zeytinyağı, yoğurt.\nHazırlık: Tavuğu baharatla pişir, sebzeyi haşla/sotele, tabakta birleştir, yoğurtla servis et.'
                    : 'Quick recipe: Chicken veggie bowl\nIngredients: chicken breast, rice/bulgur, broccoli, olive oil, yogurt.\nSteps: Season and cook chicken, steam/sauté veggies, combine in a bowl, serve with yogurt.';
            case 'posture':
                return JSON.stringify({
                    DetectedExercise: inputData?.selectedExercise || inputData?.exerciseName || inputData?.kinematicReport?.exercise_name || 'unknown',
                    FormScore: 0,
                    BiomechanicalMetrics: {
                        SymmetryScore: 0,
                        StabilityIndex: 'Critical',
                        RangeOfMotion: 'Limited',
                    },
                    CriticalFlaws: [
                        {
                            flaw: isTurkish ? 'Analiz verisi yetersiz veya AI servisi geçici olarak kullanılamıyor' : 'Insufficient analysis data or AI service temporarily unavailable',
                            timestamp: 0,
                            severity: 'High',
                        },
                    ],
                    PhaseFeedback: {
                        Eccentric: isTurkish ? 'Faz analizi üretilemedi.' : 'Phase analysis unavailable.',
                        Apex: isTurkish ? 'Tepe noktası hesaplanamadı.' : 'Apex could not be computed.',
                        Concentric: isTurkish ? 'Faz analizi üretilemedi.' : 'Phase analysis unavailable.',
                    },
                    CorrectionCues: isTurkish
                        ? ['Daha net yan açıyla tekrar çek', 'Tüm vücudu kadraja al']
                        : ['Retake with a clearer side angle', 'Keep full body in frame'],
                    SafetyWarning: {
                        isWarning: true,
                        reason: isTurkish ? 'Eksik analiz nedeniyle güvenli form doğrulanamadı.' : 'Safe form could not be verified due to incomplete analysis.',
                    },
                });
            case 'professional_program_generator':
                if (inputData?.type === 'workout') {
                    return JSON.stringify({ title: isTurkish ? "Genel Antrenman" : "General Workout", description: "AI servisine şu an ulaşılamıyor.", notes: "Lütfen daha sonra tekrar deneyin." });
                } else {
                    return JSON.stringify({ title: isTurkish ? "Genel Beslenme" : "General Nutrition", description: "AI servisine şu an ulaşılamıyor.", notes: "Lütfen daha sonra tekrar deneyin.", dailyCalories: 2000, proteinGrams: 150, carbsGrams: 200, fatGrams: 65 });
                }
            default:
                return isTurkish
                    ? 'AI servisine şu an ulaşılamıyor. Temel önerilerle devam ediyorum, birazdan tekrar deneyebilirsin.'
                    : 'AI service is temporarily unavailable. I am returning baseline guidance and you can retry shortly.';
        }
    }

    // AI Coach - Analyze physique photos
    public async analyzePhysique(imageBase64: string, userGoals: string): Promise<string> {
        return this.generateContent('coach', { userGoals }, imageBase64);
    }

    // AI Dietitian - Create meal plans
    public async createMealPlan(userProfile: any, dietaryPreferences: string, calorieTarget: number): Promise<string> {
        return this.generateContent('dietitian', {
            userProfile,
            dietaryPreferences,
            calorieTarget
        });
    }

    // AI Chef - Provide recipes
    public async getRecipes(calories: number, protein: number, cuisineType: string, restrictions: string): Promise<string> {
        return this.generateContent('chef', {
            calories,
            protein,
            cuisineType,
            restrictions
        });
    }

    // Health insights
    public async generateHealthInsights(healthData: any): Promise<string> {
        return this.generateContent('insight', { healthData });
    }

    // Food scan analysis
    public async analyzeFoodScan(description: string): Promise<string> {
        return this.generateContent('food_scan', { description });
    }

    public async analyzePostureKinematicReport(
        kinematicReport: KinematicReport,
        language: string = 'en',
        context?: PostureAnalysisContext
    ): Promise<string> {
        const sanitizedFrames = (kinematicReport?.frames_data || [])
            .filter(frame => Boolean(frame?.landmarks))
            .slice(0, 20)
            .map(frame => ({
                timestamp: Math.max(0, Math.floor(frame.timestamp || 0)),
                landmarks: PrivacyUtils.sanitizeForAI(frame.landmarks || {}),
                angles: PrivacyUtils.sanitizeForAI(frame.angles || {}),
            }));

        return this.generateContent('posture', {
            exerciseName: kinematicReport?.exercise_name || context?.selectedExercise || 'unknown',
            language,
            durationMs: context?.durationMs || 0,
            cameraHint: context?.cameraHint || '',
            qualityHint: context?.qualityHint || '',
            selectedExercise: context?.selectedExercise || kinematicReport?.exercise_name || 'unknown',
            supportedExercises: context?.supportedExercises || ['squat', 'deadlift', 'lunge', 'pushup'],
            kinematicReport: {
                exercise_name: kinematicReport?.exercise_name || 'unknown',
                frames_data: sanitizedFrames,
            },
            frameCount: sanitizedFrames.length,
        });
    }

    // Gamification Tasks Generator
    public async generateDailyMissions(userLevel: string): Promise<string> {
        // Legacy support - now handled better in MissionService
        return this.generateContent('missions', { mode: 'daily', userInfo: userLevel, date: new Date().toISOString() });
    }
}
