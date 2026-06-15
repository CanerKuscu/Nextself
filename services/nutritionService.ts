import { DeepSeekService } from './deepseek';

export interface NutritionalInfo {
    barcode: string;
    foodName: string;
    brand: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    imageUrl: string | null;
}

export class NutritionService {
    private static instance: NutritionService;

    public static getInstance(): NutritionService {
        if (!NutritionService.instance) {
            NutritionService.instance = new NutritionService();
        }
        return NutritionService.instance;
    }

    /**
     * Fetches product details from OpenFoodFacts API using the given barcode.
     */
    async getProductByBarcode(barcode: string, language: 'tr' | 'en' = 'en'): Promise<NutritionalInfo | null> {
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
            if (!response.ok) return null;

            const payload = await response.json();
            const product = payload?.product;
            if (!product) return null;

            const nutriments = product.nutriments || {};
            // OpenFoodFacts has various field names for energy depending on locale and version
            const calories = Number(nutriments['energy-kcal_100g'] || nutriments.energy_kcal_100g || nutriments.energy_100g || 0);
            const protein = Number(nutriments.proteins_100g || 0);
            const carbs = Number(nutriments.carbohydrates_100g || 0);
            const fat = Number(nutriments.fat_100g || 0);

            const isTurkish = language === 'tr';
            const foodName = (isTurkish ? (product.product_name_tr || product.product_name) : (product.product_name || product.product_name_tr)) || (isTurkish ? 'Bilinmeyen Ürün' : 'Unknown Product');
            const brand = product.brands || null;
            const imageUrl = product.image_front_url || product.image_url || null;

            return {
                barcode,
                foodName,
                brand,
                calories,
                protein,
                carbs,
                fat,
                imageUrl
            };
        } catch (error) {
            console.error('OpenFoodFacts fetch error:', error);
            return null;
        }
    }

    /**
     * Optional: Uses DeepSeek to analyze if the scanned product is a good fit for the user's daily goals.
     */
    async getAIProductInsight(foodName: string, calories: number, protein: number, language: 'tr' | 'en'): Promise<string | null> {
        try {
            const prompt = language === 'tr'
                ? `Kullanıcı ${foodName} isimli bir ürün taradı (100g'da ${calories} kcal, ${protein}g protein). Bu ürün beslenme rutini açısından genel olarak nasıl? Sadece 1 kısa motive edici/bilgilendirici cümleyle cevap ver.`
                : `User scanned ${foodName} (${calories} kcal, ${protein}g protein per 100g). Provide 1 short sentence analyzing if it's a good choice for fitness/nutrition.`;

            const response = await DeepSeekService.getInstance().generateContent('custom', { prompt, language });
            return response;
        } catch (error) {
            console.error('DeepSeek product insight error:', error);
            return null;
        }
    }
}
