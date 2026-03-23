import { SupabaseService } from '@nextself/shared';
import { DeepSeekService, PrivacyUtils } from './deepseek';
import { AIValidationUtils } from '@nextself/shared';
import { HealthValidator } from '../utils/HealthValidator';
import { Platform } from 'react-native';
import { MemoryManager } from '../utils/MemoryManager';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { LogManager } from '../utils/LogManager';

export interface AIScanResult {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    confidence: number;
    healthScore: number;
    ingredients?: string[];
    fiber?: number;
    sugar?: number;
    sodium?: number;
    vitamins?: string[];
}

export interface AIRecipe {
    title: string;
    prepTime: number;
    cookTime: number;
    calories: number;
    macros: { p: number, c: number, f: number };
    ingredients: string[];
    instructions: string[];
    difficulty: 'easy' | 'medium' | 'hard';
}

export class AIService {
    private static instance: AIService;
    private supabase = SupabaseService.getInstance();
    private deepseek = DeepSeekService.getInstance();
    private memoryManager = new MemoryManager(10);

    static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * Besin Tarama AI - Analyzes food from an image URL or Base64
     * Uses Edge Function for real AI analysis
     */
    async scanFood(imageUri: string, language: 'tr' | 'en' = 'en'): Promise<AIScanResult> {
        try {
            const imageBase64 = await readAsStringAsync(imageUri, { encoding: EncodingType.Base64 });
            const description = language === 'tr'
                ? 'Görüntüdeki yiyeceği tespit et ve sadece geçerli JSON döndür: {"name":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0,"ingredients":[],"vitamins":[],"health_score":0}.'
                : 'Identify the food in the image and return only valid JSON: {"name":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0,"ingredients":[],"vitamins":[],"health_score":0}.';
            const rawResponse = await this.deepseek.generateContent('food_scan', { description, language }, imageBase64);

            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            const payload = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
            const toNumber = (value: any) => {
                const numeric = Number(value);
                return Number.isFinite(numeric) ? numeric : 0;
            };

            return {
                name: payload.name || (language === 'tr' ? 'Bilinmeyen Yemek' : 'Unknown Food'),
                calories: toNumber(payload.calories),
                protein: toNumber(payload.protein_g ?? payload.protein),
                carbs: toNumber(payload.carbs_g ?? payload.carbs),
                fats: toNumber(payload.fat_g ?? payload.fats ?? payload.fat),
                confidence: Math.max(50, Math.min(95, toNumber(payload.confidence) || 78)),
                healthScore: Math.max(1, Math.min(10, toNumber(payload.health_score ?? payload.healthScore) || 6)),
                ingredients: Array.isArray(payload.ingredients) ? payload.ingredients : [],
                fiber: toNumber(payload.fiber_g ?? payload.fiber),
                sugar: toNumber(payload.sugar_g ?? payload.sugar),
                sodium: toNumber(payload.sodium_mg ?? payload.sodium),
                vitamins: Array.isArray(payload.vitamins) ? payload.vitamins : [],
            };
        } catch (error) {
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
    }

    /**
     * Şef AI - Generates a recipe based on ingredients or dietary preferences
     * Uses DeepSeek Edge Function
     */
    async generateRecipe(ingredients: string[], dietPreference?: string, userProfile?: any): Promise<AIRecipe> {
        const logManager = LogManager.getInstance();
        const startTime = Date.now();

        try {
            // Validate and sanitize inputs
            const sanitizedIngredients = AIValidationUtils.validateAndSanitizeArray(ingredients, 50);
            const sanitizedDietPreference = dietPreference
                ? AIValidationUtils.sanitizeInput(dietPreference)
                : undefined;

            // Add interaction to memory
            this.memoryManager.addInteraction(`Ingredients: ${ingredients.join(', ')}, Diet: ${dietPreference || 'None'}`);

            // Context from user profile
            const profileContext = userProfile ? `User Profile: ${JSON.stringify(PrivacyUtils.anonymizeProfile(userProfile))}` : '';

            // Structured Request to Edge Function
            const requestData = {
                ingredients: sanitizedIngredients,
                dietPreference: sanitizedDietPreference,
                context: profileContext
            };

            const response = await this.retryWithBackoff(() => this.deepseek.generateContent('chef', requestData));

            try {
                // Try to extract JSON from response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);

                    // Validate nutritional data
                    if (!HealthValidator.validateNutritionalData(parsed)) {
                        throw new Error('Generated recipe contains unrealistic nutritional values.');
                    }

                    logManager.logSuccess();
                    return parsed;
                } else {
                    throw new Error('Invalid JSON response from AI.');
                }
            } catch (parseError) {
                console.error('JSON Parsing Error:', parseError);
                throw new Error('Failed to parse AI response.');
            }
        } catch (error) {
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
        } finally {
            const endTime = Date.now();
            logManager.logResponseTime(endTime - startTime);
        }
    }

    /**
     * Diyetisyen AI - Ask general nutrition questions
     * Uses DeepSeek Edge Function
     */
    async askDietitian(query: string, userStats?: any, healthData?: any, supplements?: any[]): Promise<string> {
        const logManager = LogManager.getInstance();
        const startTime = Date.now();

        try {
            // Sanitize and validate input
            const sanitizedQuery = AIValidationUtils.sanitizeInput(query);
            if (!AIValidationUtils.validateLength(sanitizedQuery, 200)) {
                throw new Error('Query exceeds maximum allowed length of 200 characters.');
            }

            // Add interaction to memory
            this.memoryManager.addInteraction(`Query: ${query}`);

            const anonymizedStats = userStats ? PrivacyUtils.anonymizeProfile(userStats) : {};
            
            const context = {
                profile: anonymizedStats,
                health: healthData || {},
                supplements: supplements || []
            };

            const response = await this.retryWithBackoff(() => this.deepseek.generateContent('dietitian', {
                query: sanitizedQuery,
                context: context
            }));

            // Estimate token usage (approximation)
            const tokenUsage = sanitizedQuery.length / 4 + response.length / 4; 
            logManager.logTokenUsage(tokenUsage);
            
            logManager.logSuccess();
            return response;
        } catch (error) {
            console.error('Dietitian AI Error:', error);
            logManager.logFailure();
            return 'I\'m having trouble calculating this right now, but generally, staying hydrated is key.';
        } finally {
            const endTime = Date.now();
            logManager.logResponseTime(endTime - startTime);
        }
    }

    /**
     * PT AI - Ask training/workout questions
     * Uses DeepSeek Edge Function
     */
    async askPT(query: string, userStats?: any, healthData?: any, workoutHistory?: any[]): Promise<string> {
        try {
            // Sanitize and validate input
            const sanitizedQuery = AIValidationUtils.sanitizeInput(query);
            if (!AIValidationUtils.validateLength(sanitizedQuery, 200)) {
                throw new Error('Query exceeds maximum allowed length of 200 characters.');
            }

            const anonymizedStats = userStats ? PrivacyUtils.anonymizeProfile(userStats) : {};
            
            const context = {
                profile: anonymizedStats,
                health: healthData || {},
                history: workoutHistory || []
            };

            const response = await this.retryWithBackoff(() => this.deepseek.generateContent('coach', {
                query: sanitizedQuery,
                context: context
            }));

            return response;
        } catch (error) {
            console.error('PT AI Error:', error);
            return 'The AI generated an unrealistic value, please try again.';
        }
    }

    // Retry logic with exponential backoff
    private async retryWithBackoff<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
        let attempt = 0;
        while (attempt < retries) {
            try {
                return await fn();
            } catch (error) {
                attempt++;
                if (attempt === retries) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
            }
        }
        throw new Error('Max retries reached');
    }

    /**
     * Professional Program Generator AI
     * Uses DeepSeek Edge Function. Can analyze an image if provided.
     */
    async generateProfessionalProgram(
        type: 'workout' | 'nutrition',
        clientProfile: any,
        language: string,
        imageBase64?: string
    ): Promise<any> {
        const logManager = LogManager.getInstance();
        const startTime = Date.now();

        try {
            const anonymizedProfile = PrivacyUtils.anonymizeProfile(clientProfile);
            
            const requestData = {
                type,
                clientProfile: anonymizedProfile,
                language,
                hasImage: !!imageBase64
            };

            const response = await this.retryWithBackoff(() => 
                this.deepseek.generateContent('professional_program_generator', requestData, imageBase64)
            );

            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    logManager.logSuccess();
                    return parsed;
                } else {
                    throw new Error('Invalid JSON response from AI.');
                }
            } catch (parseError) {
                console.error('JSON Parsing Error:', parseError);
                throw new Error('Failed to parse AI response.');
            }
        } catch (error) {
            console.error('Professional Program Generator AI Error:', error);
            logManager.logFailure();
            return null;
        } finally {
            const endTime = Date.now();
            logManager.logResponseTime(endTime - startTime);
        }
    }
}
