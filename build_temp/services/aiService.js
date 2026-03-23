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
exports.AIService = void 0;
const supabase_1 = require("./supabase");
const deepseek_1 = require("./deepseek");
const ValidationUtils_1 = require("../utils/ValidationUtils");
const HealthValidator_1 = require("../utils/HealthValidator");
const MemoryManager_1 = require("../utils/MemoryManager");
const legacy_1 = require("expo-file-system/legacy");
const LogManager_1 = require("../utils/LogManager");
class AIService {
    constructor() {
        this.supabase = supabase_1.SupabaseService.getInstance();
        this.deepseek = deepseek_1.DeepSeekService.getInstance();
        this.memoryManager = new MemoryManager_1.MemoryManager(10);
    }
    static getInstance() {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }
    /**
     * Besin Tarama AI - Analyzes food from an image URL or Base64
     * Uses Edge Function for real AI analysis
     */
    scanFood(imageUri_1) {
        return __awaiter(this, arguments, void 0, function* (imageUri, language = 'en') {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                const imageBase64 = yield (0, legacy_1.readAsStringAsync)(imageUri, { encoding: legacy_1.EncodingType.Base64 });
                const description = language === 'tr'
                    ? 'Görüntüdeki yiyeceği tespit et ve sadece geçerli JSON döndür: {"name":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0,"ingredients":[],"vitamins":[],"health_score":0}.'
                    : 'Identify the food in the image and return only valid JSON: {"name":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0,"ingredients":[],"vitamins":[],"health_score":0}.';
                const rawResponse = yield this.deepseek.generateContent('food_scan', { description, language }, imageBase64);
                const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
                const payload = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
                const toNumber = (value) => {
                    const numeric = Number(value);
                    return Number.isFinite(numeric) ? numeric : 0;
                };
                return {
                    name: payload.name || (language === 'tr' ? 'Bilinmeyen Yemek' : 'Unknown Food'),
                    calories: toNumber(payload.calories),
                    protein: toNumber((_a = payload.protein_g) !== null && _a !== void 0 ? _a : payload.protein),
                    carbs: toNumber((_b = payload.carbs_g) !== null && _b !== void 0 ? _b : payload.carbs),
                    fats: toNumber((_d = (_c = payload.fat_g) !== null && _c !== void 0 ? _c : payload.fats) !== null && _d !== void 0 ? _d : payload.fat),
                    confidence: Math.max(50, Math.min(95, toNumber(payload.confidence) || 78)),
                    healthScore: Math.max(1, Math.min(10, toNumber((_e = payload.health_score) !== null && _e !== void 0 ? _e : payload.healthScore) || 6)),
                    ingredients: Array.isArray(payload.ingredients) ? payload.ingredients : [],
                    fiber: toNumber((_f = payload.fiber_g) !== null && _f !== void 0 ? _f : payload.fiber),
                    sugar: toNumber((_g = payload.sugar_g) !== null && _g !== void 0 ? _g : payload.sugar),
                    sodium: toNumber((_h = payload.sodium_mg) !== null && _h !== void 0 ? _h : payload.sodium),
                    vitamins: Array.isArray(payload.vitamins) ? payload.vitamins : [],
                };
            }
            catch (error) {
                console.error('AI Scan Error:', error);
                return {
                    name: language === 'tr' ? 'Yemek Öğesi' : 'Food Item',
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    confidence: 45,
                    healthScore: 5,
                    ingredients: [],
                };
            }
        });
    }
    /**
     * Şef AI - Generates a recipe based on ingredients or dietary preferences
     * Uses DeepSeek Edge Function
     */
    generateRecipe(ingredients, dietPreference, userProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            const logManager = LogManager_1.LogManager.getInstance();
            const startTime = Date.now();
            try {
                // Validate and sanitize inputs
                const sanitizedIngredients = ValidationUtils_1.ValidationUtils.validateAndSanitizeArray(ingredients, 50);
                const sanitizedDietPreference = dietPreference
                    ? ValidationUtils_1.ValidationUtils.sanitizeInput(dietPreference)
                    : undefined;
                // Add interaction to memory
                this.memoryManager.addInteraction(`Ingredients: ${ingredients.join(', ')}, Diet: ${dietPreference || 'None'}`);
                // Context from user profile
                const profileContext = userProfile ? `User Profile: ${JSON.stringify(deepseek_1.PrivacyUtils.anonymizeProfile(userProfile))}` : '';
                // Structured Request to Edge Function
                const requestData = {
                    ingredients: sanitizedIngredients,
                    dietPreference: sanitizedDietPreference,
                    context: profileContext
                };
                const response = yield this.retryWithBackoff(() => this.deepseek.generateContent('chef', requestData));
                try {
                    // Try to extract JSON from response
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        // Validate nutritional data
                        if (!HealthValidator_1.HealthValidator.validateNutritionalData(parsed)) {
                            throw new Error('Generated recipe contains unrealistic nutritional values.');
                        }
                        logManager.logSuccess();
                        return parsed;
                    }
                    else {
                        throw new Error('Invalid JSON response from AI.');
                    }
                }
                catch (parseError) {
                    console.error('JSON Parsing Error:', parseError);
                    throw new Error('Failed to parse AI response.');
                }
            }
            catch (error) {
                console.error('Chef AI Error:', error);
                logManager.logFailure();
                return {
                    title: 'Fallback Recipe',
                    prepTime: 10,
                    cookTime: 15,
                    calories: 200,
                    macros: { p: 10, c: 20, f: 5 },
                    ingredients: ['Fallback Ingredient'],
                    instructions: ['Fallback Instruction'],
                    difficulty: 'easy',
                };
            }
            finally {
                const endTime = Date.now();
                logManager.logResponseTime(endTime - startTime);
            }
        });
    }
    /**
     * Diyetisyen AI - Ask general nutrition questions
     * Uses DeepSeek Edge Function
     */
    askDietitian(query, userStats, healthData, supplements) {
        return __awaiter(this, void 0, void 0, function* () {
            const logManager = LogManager_1.LogManager.getInstance();
            const startTime = Date.now();
            try {
                // Sanitize and validate input
                const sanitizedQuery = ValidationUtils_1.ValidationUtils.sanitizeInput(query);
                if (!ValidationUtils_1.ValidationUtils.validateLength(sanitizedQuery, 200)) {
                    throw new Error('Query exceeds maximum allowed length of 200 characters.');
                }
                // Add interaction to memory
                this.memoryManager.addInteraction(`Query: ${query}`);
                const anonymizedStats = userStats ? deepseek_1.PrivacyUtils.anonymizeProfile(userStats) : {};
                const context = {
                    profile: anonymizedStats,
                    health: healthData || {},
                    supplements: supplements || []
                };
                const response = yield this.retryWithBackoff(() => this.deepseek.generateContent('dietitian', {
                    query: sanitizedQuery,
                    context: context
                }));
                // Estimate token usage (approximation)
                const tokenUsage = sanitizedQuery.length / 4 + response.length / 4;
                logManager.logTokenUsage(tokenUsage);
                logManager.logSuccess();
                return response;
            }
            catch (error) {
                console.error('Dietitian AI Error:', error);
                logManager.logFailure();
                return 'I\'m having trouble calculating this right now, but generally, staying hydrated is key.';
            }
            finally {
                const endTime = Date.now();
                logManager.logResponseTime(endTime - startTime);
            }
        });
    }
    /**
     * PT AI - Ask training/workout questions
     * Uses DeepSeek Edge Function
     */
    askPT(query, userStats, healthData, workoutHistory) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Sanitize and validate input
                const sanitizedQuery = ValidationUtils_1.ValidationUtils.sanitizeInput(query);
                if (!ValidationUtils_1.ValidationUtils.validateLength(sanitizedQuery, 200)) {
                    throw new Error('Query exceeds maximum allowed length of 200 characters.');
                }
                const anonymizedStats = userStats ? deepseek_1.PrivacyUtils.anonymizeProfile(userStats) : {};
                const context = {
                    profile: anonymizedStats,
                    health: healthData || {},
                    history: workoutHistory || []
                };
                const response = yield this.retryWithBackoff(() => this.deepseek.generateContent('coach', {
                    query: sanitizedQuery,
                    context: context
                }));
                return response;
            }
            catch (error) {
                console.error('PT AI Error:', error);
                return 'The AI generated an unrealistic value, please try again.';
            }
        });
    }
    // Retry logic with exponential backoff
    retryWithBackoff(fn_1) {
        return __awaiter(this, arguments, void 0, function* (fn, retries = 3, delay = 1000) {
            let attempt = 0;
            while (attempt < retries) {
                try {
                    return yield fn();
                }
                catch (error) {
                    attempt++;
                    if (attempt === retries)
                        throw error;
                    yield new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
                }
            }
            throw new Error('Max retries reached');
        });
    }
}
exports.AIService = AIService;
