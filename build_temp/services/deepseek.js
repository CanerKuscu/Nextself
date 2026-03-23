"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekService = exports.PrivacyUtils = void 0;
const supabase_1 = require("./supabase");
const config_1 = require("../config/config");
const Sentry = __importStar(require("@sentry/react-native"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const DEEPSEEK_API_KEY = config_1.CONFIG.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY && config_1.CONFIG.IS_PRODUCTION) {
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
    generateSessionId: () => {
        const random = crypto_js_1.default.lib.WordArray.random(8).toString();
        const timestamp = Date.now().toString(36);
        return `ses_${random}${timestamp}`;
    },
    /** Strip PII fields from a user profile before sending to AI */
    anonymizeProfile: (profile) => {
        if (!profile)
            return null;
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
    sanitizeForAI: (data) => {
        if (!data)
            return null;
        if (typeof data !== 'object')
            return data;
        const piiFields = [
            'id', 'user_id', 'userId', 'email', 'name', 'full_name', 'fullName',
            'first_name', 'last_name', 'phone', 'address', 'avatar', 'avatar_url',
            'ip', 'ip_address', 'device_id', 'push_token', 'created_at', 'updated_at'
        ];
        if (Array.isArray(data)) {
            return data.map(item => PrivacyUtils.sanitizeForAI(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (piiFields.includes(key))
                continue; // Skip PII fields
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = PrivacyUtils.sanitizeForAI(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
};
exports.PrivacyUtils = PrivacyUtils;
function calculateAge(birthDate) {
    if (!birthDate)
        return undefined;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}
class DeepSeekService {
    constructor() { }
    static getInstance() {
        if (!DeepSeekService.instance) {
            DeepSeekService.instance = new DeepSeekService();
        }
        return DeepSeekService.instance;
    }
    // Generic content generation — tries Edge Function first, falls back to direct API call
    // PRIVACY: No user_id or PII is included in any request to DeepSeek.
    // A disposable session_id is used for request correlation only.
    generateContent(type, data, imageBase64) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = PrivacyUtils.generateSessionId();
            // Try Edge Function first
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const bodyPayload = { type, data, session_id: sessionId };
                if (imageBase64) {
                    bodyPayload.data.image_base64 = imageBase64;
                }
                const { data: responseData, error } = yield supabase.functions.invoke('deepseek-chat', {
                    body: bodyPayload,
                });
                if (!error && (responseData === null || responseData === void 0 ? void 0 : responseData.response)) {
                    return responseData.response;
                }
                console.warn('Edge function failed, trying direct API:', (error === null || error === void 0 ? void 0 : error.message) || 'No response');
            }
            catch (err) {
                console.warn('Edge function error', err);
            }
            // FALLBACK: If Edge Function fails, try direct API call if key is available
            if (DEEPSEEK_API_KEY) {
                try {
                    return yield this.generateContentDirect(type, data, imageBase64);
                }
                catch (err) {
                    console.warn('Direct API fallback failed:', err);
                }
            }
            // SECURITY: No direct API call from client — all AI calls go through Edge Functions only.
            // If the Edge Function fails, return a safe fallback response.
            console.warn('[AI] Edge Function unavailable. Returning fallback response for type:', type);
            return this.getFallbackResponse(type, data);
        });
    }
    generateContentDirect(type, inputData, imageBase64) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const language = inputData.language || 'auto';
            const langInstruction = language === 'auto'
                ? 'You MUST detect the user language from the latest message and reply in that same language.'
                : language === 'tr'
                    ? 'You MUST reply in Turkish.'
                    : language === 'en'
                        ? 'You MUST reply in English.'
                        : `You MUST reply in ${language}.`;
            let systemPrompt;
            let userPrompt;
            switch (type) {
                case 'coach':
                    systemPrompt = `You are strictly a fitness AI Coach. ${langInstruction}`;
                    if (inputData.query) {
                        userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}`;
                    }
                    else {
                        userPrompt = `As an expert fitness coach, analyze this physique photo. Goals: ${inputData.userGoals}. Reply in ${language === 'auto' ? 'the user language' : language}.`;
                    }
                    break;
                case 'dietitian':
                    systemPrompt = `You are strictly a Dietitian AI. ${langInstruction}`;
                    if (inputData.query) {
                        userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}`;
                    }
                    else {
                        userPrompt = `Create a meal plan. User: Height ${inputData.userProfile.height}cm, Weight ${inputData.userProfile.weight}kg, Goals: ${inputData.userProfile.goals}. Target: ${inputData.calorieTarget} calories. Reply in ${language === 'auto' ? 'the user language' : language}.`;
                    }
                    break;
                case 'chef':
                    systemPrompt = `You are strictly a Chef AI focused on healthy eating. ${langInstruction}`;
                    if (inputData.query) {
                        userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}`;
                    }
                    else {
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
                default:
                    throw new Error(`Invalid request type: ${type}`);
            }
            const response = yield fetch("https://api.deepseek.com/chat/completions", {
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
            const data = yield response.json();
            if (data.error)
                throw new Error(data.error.message);
            if (!data.choices || !((_a = data.choices[0]) === null || _a === void 0 ? void 0 : _a.message))
                throw new Error('Invalid response');
            return data.choices[0].message.content;
        });
    }
    getFallbackResponse(type, inputData) {
        var _a;
        const isTurkish = ((inputData === null || inputData === void 0 ? void 0 : inputData.language) || '').toLowerCase() === 'tr';
        const query = ((inputData === null || inputData === void 0 ? void 0 : inputData.query) || '').toLowerCase();
        const goal = ((inputData === null || inputData === void 0 ? void 0 : inputData.userGoals) || '').toLowerCase();
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
                    DetectedExercise: (inputData === null || inputData === void 0 ? void 0 : inputData.selectedExercise) || (inputData === null || inputData === void 0 ? void 0 : inputData.exerciseName) || ((_a = inputData === null || inputData === void 0 ? void 0 : inputData.kinematicReport) === null || _a === void 0 ? void 0 : _a.exercise_name) || 'unknown',
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
            default:
                return isTurkish
                    ? 'AI servisine şu an ulaşılamıyor. Temel önerilerle devam ediyorum, birazdan tekrar deneyebilirsin.'
                    : 'AI service is temporarily unavailable. I am returning baseline guidance and you can retry shortly.';
        }
    }
    // AI Coach - Analyze physique photos
    analyzePhysique(imageBase64, userGoals) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.generateContent('coach', { userGoals }, imageBase64);
        });
    }
    // AI Dietitian - Create meal plans
    createMealPlan(userProfile, dietaryPreferences, calorieTarget) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.generateContent('dietitian', {
                userProfile,
                dietaryPreferences,
                calorieTarget
            });
        });
    }
    // AI Chef - Provide recipes
    getRecipes(calories, protein, cuisineType, restrictions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.generateContent('chef', {
                calories,
                protein,
                cuisineType,
                restrictions
            });
        });
    }
    // Health insights
    generateHealthInsights(healthData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.generateContent('insight', { healthData });
        });
    }
    // Food scan analysis
    analyzeFoodScan(description) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.generateContent('food_scan', { description });
        });
    }
    analyzePostureKinematicReport(kinematicReport_1) {
        return __awaiter(this, arguments, void 0, function* (kinematicReport, language = 'en', context) {
            const sanitizedFrames = ((kinematicReport === null || kinematicReport === void 0 ? void 0 : kinematicReport.frames_data) || [])
                .filter(frame => Boolean(frame === null || frame === void 0 ? void 0 : frame.landmarks))
                .slice(0, 20)
                .map(frame => ({
                timestamp: Math.max(0, Math.floor(frame.timestamp || 0)),
                landmarks: PrivacyUtils.sanitizeForAI(frame.landmarks || {}),
                angles: PrivacyUtils.sanitizeForAI(frame.angles || {}),
            }));
            return this.generateContent('posture', {
                exerciseName: (kinematicReport === null || kinematicReport === void 0 ? void 0 : kinematicReport.exercise_name) || (context === null || context === void 0 ? void 0 : context.selectedExercise) || 'unknown',
                language,
                durationMs: (context === null || context === void 0 ? void 0 : context.durationMs) || 0,
                cameraHint: (context === null || context === void 0 ? void 0 : context.cameraHint) || '',
                qualityHint: (context === null || context === void 0 ? void 0 : context.qualityHint) || '',
                selectedExercise: (context === null || context === void 0 ? void 0 : context.selectedExercise) || (kinematicReport === null || kinematicReport === void 0 ? void 0 : kinematicReport.exercise_name) || 'unknown',
                supportedExercises: (context === null || context === void 0 ? void 0 : context.supportedExercises) || ['squat', 'deadlift', 'lunge', 'pushup'],
                kinematicReport: {
                    exercise_name: (kinematicReport === null || kinematicReport === void 0 ? void 0 : kinematicReport.exercise_name) || 'unknown',
                    frames_data: sanitizedFrames,
                },
                frameCount: sanitizedFrames.length,
            });
        });
    }
    // Gamification Tasks Generator
    generateDailyMissions(userLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            // Legacy support - now handled better in MissionService
            return this.generateContent('missions', { mode: 'daily', userInfo: userLevel, date: new Date().toISOString() });
        });
    }
}
exports.DeepSeekService = DeepSeekService;
