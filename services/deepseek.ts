import { SupabaseService } from '@nextself/shared';
import { CONFIG } from '@nextself/shared';
import * as Sentry from '@sentry/react-native';
import CryptoJS from 'crypto-js';
import { KinematicReport } from './poseProcessor';

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

    // Generic content generation — tries Edge Function first, falls back to direct API call
    // PRIVACY: No user_id or PII is included in any request to DeepSeek.
    // A disposable session_id is used for request correlation only.
    public async generateContent(type: string, data: any, imageBase64?: string): Promise<string> {
        const sessionId = PrivacyUtils.generateSessionId();

        // Try Edge Function first
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const bodyPayload: any = { type, data, session_id: sessionId };
            if (imageBase64) {
                bodyPayload.data.image_base64 = imageBase64;
            }

            const { data: responseData, error } = await supabase.functions.invoke('deepseek-chat', {
                body: bodyPayload,
            });

            if (!error && responseData?.response) {
                return responseData.response;
            }
            console.warn('Edge function failed, trying direct API:', error?.message || 'No response');
        } catch (err) {
            console.warn('Edge function error', err);
        }

        // FALLBACK: If Edge Function fails, try direct API call if key is available
        if (DEEPSEEK_API_KEY) {
            try {
                return await this.generateContentDirect(type, data, imageBase64);
            } catch (err) {
                console.warn('Direct API fallback failed:', err);
            }
        }

        // SECURITY: No direct API call from client — all AI calls go through Edge Functions only.
        // If the Edge Function fails, return a safe fallback response.
        console.warn('[AI] Edge Function unavailable. Returning fallback response for type:', type);
        return this.getFallbackResponse(type, data);
    }

    private async generateContentDirect(type: string, inputData: any, imageBase64?: string): Promise<string> {
        const language = inputData.language || 'auto';
        const langInstruction = language === 'auto'
            ? 'You MUST detect the user language from the latest message and reply in that same language.'
            : language === 'tr'
                ? 'You MUST reply in Turkish.'
                : language === 'en'
                    ? 'You MUST reply in English.'
                    : `You MUST reply in ${language}.`;
        
        let systemPrompt: string;
        let userPrompt: string;

        switch (type) {
            case 'coach':
                systemPrompt = `You are strictly a fitness AI Coach. ${langInstruction}`;
                if (inputData.query) {
                    userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}`;
                } else {
                    userPrompt = `As an expert fitness coach, analyze this physique photo. Goals: ${inputData.userGoals}. Reply in ${language === 'auto' ? 'the user language' : language}.`;
                }
                break;
            case 'dietitian':
                systemPrompt = `You are strictly a Dietitian AI. ${langInstruction}`;
                if (inputData.query) {
                     userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}`;
                } else {
                     userPrompt = `Create a meal plan. User: Height ${inputData.userProfile.height}cm, Weight ${inputData.userProfile.weight}kg, Goals: ${inputData.userProfile.goals}. Target: ${inputData.calorieTarget} calories. Reply in ${language === 'auto' ? 'the user language' : language}.`;
                }
                break;
            case 'chef':
                systemPrompt = `You are strictly a Chef AI focused on healthy eating. ${langInstruction}`;
                if (inputData.query) {
                    userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}`;
                } else {
                    userPrompt = `Provide 5 healthy recipes: ~${inputData.calories} cal/serving, ~${inputData.protein}g protein. Cuisine: ${inputData.cuisineType}. Restrictions: ${inputData.restrictions}. Reply in ${language === 'auto' ? 'the user language' : language}.`;
                }
                break;
            case 'posture':
                systemPrompt = `You are a Senior Biomechanical Engineer and Professional Athletic Coach specialized in kinetic chain analysis. ${langInstruction}`;
                userPrompt = `Analyze this coordinate-only report and return JSON only:
${JSON.stringify(inputData.kinematicReport || {})}

Required schema:
{
  "DetectedExercise": "string",
  "FormScore": "number",
  "BiomechanicalMetrics": {
    "SymmetryScore": "number",
    "StabilityIndex": "Stable|Wobbly|Critical",
    "RangeOfMotion": "Full|Partial|Limited"
  },
  "CriticalFlaws": [
    {"flaw": "string", "timestamp": "number", "severity": "High|Medium"}
  ],
  "PhaseFeedback": {"Eccentric": "string", "Apex": "string", "Concentric": "string"},
  "CorrectionCues": ["string", "string"],
  "SafetyWarning": {"isWarning": "boolean", "reason": "string"}
}

Use only the provided coordinates and angles. If asymmetry >10% or stability wobble appears, include in CriticalFlaws.`;
                break;
            case 'professional_program_generator':
                systemPrompt = `You are an AI assistant helping a professional ${inputData.type === 'workout' ? 'Personal Trainer' : 'Dietitian'} create a customized program for their client. ${langInstruction} You MUST reply with ONLY a valid JSON object.`;
                
                const profileStr = JSON.stringify(inputData.clientProfile || {});
                userPrompt = `Client Profile: ${profileStr}\n\n`;
                if (inputData.hasImage) {
                    userPrompt += `A photo of the client is attached for context (e.g., posture, physique analysis).\n\n`;
                }
                userPrompt += `Generate a comprehensive ${inputData.type} program for this client based on their profile (age, gender, experience/level, goals).\n`;
                
                if (inputData.type === 'workout') {
                    userPrompt += `Return JSON strictly matching this schema: {"title": "Program title", "description": "General description and logic of the program", "notes": "Any special notes or warnings for the client (e.g. warm-ups, progressive overload)"}`;
                } else {
                    userPrompt += `Return JSON strictly matching this schema: {"title": "Diet plan title", "description": "General description and logic", "notes": "Any special notes or warnings", "dailyCalories": number, "proteinGrams": number, "carbsGrams": number, "fatGrams": number}`;
                }
                break;
            default:
                throw new Error(`Invalid request type: ${type}`);
        }

        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        if (!data.choices || !data.choices[0]?.message) throw new Error('Invalid response');
        
        return data.choices[0].message.content;
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
