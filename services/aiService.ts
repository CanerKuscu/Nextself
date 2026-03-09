import { SupabaseService } from './supabase';
import { DeepSeekService, PrivacyUtils } from './deepseek';
import { ValidationUtils } from '../utils/validation';

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
    async scanFood(imageUrl: string): Promise<AIScanResult> {
        try {
            console.log('Scanning food image via Edge Function...');

            // Try Edge Function first
            const client = this.supabase.getClient();
            const { data, error } = await client.functions.invoke('ai-food-scan', {
                body: { image: imageUrl },
            });

            if (!error && data) {
                return {
                    name: data.name || 'Unknown Food',
                    calories: data.calories || 0,
                    protein: data.protein || data.protein_g || 0,
                    carbs: data.carbs || data.carbs_g || 0,
                    fats: data.fats || data.fat_g || 0,
                    confidence: data.confidence || 80,
                    healthScore: data.healthScore || data.health_score || 7,
                    ingredients: data.ingredients || [],
                    fiber: data.fiber || data.fiber_g || 0,
                    sugar: data.sugar || data.sugar_g || 0,
                    sodium: data.sodium || data.sodium_mg || 0,
                    vitamins: data.vitamins || [],
                };
            }

            // Fallback: use DeepSeek text-based analysis
            console.warn('Edge function failed for food scan, using DeepSeek fallback');
            const fallbackResult = await this.deepseek.analyzeFoodScan(
                'Analyze the food in this image and provide nutritional information.'
            );

            // Try to parse JSON response
            try {
                const parsed = JSON.parse(fallbackResult);
                return {
                    name: parsed.name || 'Analyzed Food',
                    calories: parsed.calories || 0,
                    protein: parsed.protein_g || parsed.protein || 0,
                    carbs: parsed.carbs_g || parsed.carbs || 0,
                    fats: parsed.fat_g || parsed.fats || parsed.fat || 0,
                    confidence: 70,
                    healthScore: 7,
                    ingredients: [],
                };
            } catch {
                // If DeepSeek doesn't return parseable JSON, return a basic result
                return {
                    name: 'Food Item',
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    confidence: 50,
                    healthScore: 5,
                    ingredients: [],
                };
            }
        } catch (error) {
            console.error('AI Scan Error:', error);
            throw error;
        }
    }

    /**
     * Şef AI - Generates a recipe based on ingredients or dietary preferences
     * Uses DeepSeek Edge Function
     */
    async generateRecipe(ingredients: string[], dietPreference?: string): Promise<AIRecipe> {
        try {
            // Validate inputs for SQL injection
            ingredients.forEach(ingredient => {
                const validation = ValidationUtils.validateSQLInjection(ingredient);
                if (!validation.isValid) {
                    throw new Error(`Invalid ingredient: ${validation.errors.join(', ')}`);
                }
            });
            if (dietPreference) {
                const validation = ValidationUtils.validateSQLInjection(dietPreference);
                if (!validation.isValid) {
                    throw new Error(`Invalid diet preference: ${validation.errors.join(', ')}`);
                }
            }

            const prompt = `Generate a healthy recipe using these ingredients: ${ingredients.join(', ')}. ${dietPreference ? `Dietary preference: ${dietPreference}.` : ''} Return ONLY valid JSON with this exact structure: {"title":"...","prepTime":10,"cookTime":15,"calories":450,"macros":{"p":45,"c":20,"f":15},"ingredients":["..."],"instructions":["..."],"difficulty":"easy|medium|hard"}`;

            const response = await this.deepseek.generateContent(prompt, 'chef');

            try {
                // Try to extract JSON from response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        title: parsed.title || 'AI Generated Recipe',
                        prepTime: parsed.prepTime || 10,
                        cookTime: parsed.cookTime || 15,
                        calories: parsed.calories || 400,
                        macros: parsed.macros || { p: 30, c: 30, f: 15 },
                        ingredients: parsed.ingredients || ingredients,
                        instructions: parsed.instructions || ['Follow the recipe'],
                        difficulty: parsed.difficulty || 'medium',
                    };
                }
            } catch {
                // Parse failed, return structured fallback from text
            }

            return {
                title: 'AI Generated Recipe',
                prepTime: 10,
                cookTime: 15,
                calories: 400,
                macros: { p: 30, c: 30, f: 15 },
                ingredients: ingredients,
                instructions: [response],
                difficulty: 'medium',
            };
        } catch (error) {
            console.error('Chef AI Error:', error);
            throw error;
        }
    }

    /**
     * Diyetisyen AI - Ask general nutrition questions
     * Uses DeepSeek Edge Function
     */
    async askDietitian(query: string, userStats?: any): Promise<string> {
        try {
            // Validate input for SQL injection
            const validation = ValidationUtils.validateSQLInjection(query);
            if (!validation.isValid) {
                throw new Error(`Invalid query: ${validation.errors.join(', ')}`);
            }

            const anonymizedStats = userStats ? PrivacyUtils.anonymizeProfile(userStats) : null;
            const prompt = anonymizedStats
                ? `As a professional dietitian, answer this nutrition question. User stats: ${JSON.stringify(anonymizedStats)}. Question: ${query}`
                : `As a professional dietitian, answer this nutrition question: ${query}`;

            return await this.deepseek.generateContent(prompt, 'dietitian');
        } catch (error) {
            console.error('Dietitian AI Error:', error);
            throw error;
        }
    }

    /**
     * PT AI - Ask training/workout questions
     * Uses DeepSeek Edge Function
     */
    async askPT(query: string, userStats?: any): Promise<string> {
        try {
            // Validate input for SQL injection
            const validation = ValidationUtils.validateSQLInjection(query);
            if (!validation.isValid) {
                throw new Error(`Invalid query: ${validation.errors.join(', ')}`);
            }

            const anonymizedStats = userStats ? PrivacyUtils.anonymizeProfile(userStats) : null;
            const prompt = anonymizedStats
                ? `As an expert personal trainer, answer this training question. User stats: ${JSON.stringify(anonymizedStats)}. Question: ${query}`
                : `As an expert personal trainer, answer this training question: ${query}`;

            return await this.deepseek.generateContent(prompt, 'coach');
        } catch (error) {
            console.error('PT AI Error:', error);
            throw error;
        }
    }
}
