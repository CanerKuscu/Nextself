import { SupabaseService } from './supabase';

export interface Vitamin {
  id: string;
  name: string;
  chemicalName: string;
  type: 'fat_soluble' | 'water_soluble';
  form: 'tablet' | 'capsule' | 'powder' | 'liquid' | 'injectable' | 'gummy';
  dosage: {
    adults: {
      recommended: string;
      maximum: string;
    };
    children: {
      recommended: string;
      maximum: string;
    };
  };
  benefits: string[];
  foodSources: string[];
  deficiencySymptoms: string[];
  excessSymptoms: string[];
  interactions: string[];
  absorption: {
    withFood: string[];
    withoutFood: string[];
    timing: string[];
  };
  storage: string;
  stability: string;
  safetyConsiderations: string[];
  dailyValue: number;
  unit: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  availability: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VitaminIntake {
  id: string;
  userId: string;
  vitaminId: string;
  quantity: number;
  unit: string;
  takenAt: string;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
}

export interface VitaminPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  vitamins: {
    vitaminId: string;
    quantity: number;
    unit: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'with_meal';
  }[];
  duration: number; // in days
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Maps camelCase TypeScript keys to snake_case PostgreSQL column names
function mapVitaminToDb(obj: Record<string, any>): Record<string, any> {
  const keyMap: Record<string, string> = {
    chemicalName: 'chemical_name',
    foodSources: 'food_sources',
    deficiencySymptoms: 'deficiency_symptoms',
    excessSymptoms: 'excess_symptoms',
    safetyConsiderations: 'safety_considerations',
    dailyValue: 'daily_value',
    isVerified: 'is_verified',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[keyMap[key] ?? key] = value;
  }
  return result;
}

function mapVitaminIntakeToDb(obj: Record<string, any>): Record<string, any> {
  const keyMap: Record<string, string> = {
    userId: 'user_id',
    vitaminId: 'vitamin_id',
    takenAt: 'taken_at',
    scheduledTime: 'scheduled_time',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[keyMap[key] ?? key] = value;
  }
  return result;
}

function mapVitaminPlanToDb(obj: Record<string, any>): Record<string, any> {
  const keyMap: Record<string, string> = {
    userId: 'user_id',
    isActive: 'is_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[keyMap[key] ?? key] = value;
  }
  return result;
}

export class VitaminService {
  private static instance: VitaminService;
  private supabaseService: SupabaseService;

  private constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  public static getInstance(): VitaminService {
    if (!VitaminService.instance) {
      VitaminService.instance = new VitaminService();
    }
    return VitaminService.instance;
  }

  // Get all vitamins
  public async getVitamins(
    type?: string,
    search?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Vitamin[]; count: number }> {
    try {
      let query = this.supabaseService.getClient()
        .from('vitamins')
        .select('*')
        .eq('is_verified', true);

      if (type) {
        query = query.eq('type', type);
      }

      if (search) {
        const safe = search.replace(/[,.*()%_\\]/g, '');
        query = query.or(`name.ilike.%${safe}%,chemical_name.ilike.%${safe}%`);
      }

      query = query
        .order('name', { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      const { data, count, error } = await query;

      if (error) {
        throw new Error(`Failed to get vitamins: ${error.message}`);
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error getting vitamins:', error);
      throw error;
    }
  }

  // Get vitamin by ID
  public async getVitaminById(vitaminId: string): Promise<Vitamin> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('vitamins')
        .select('*')
        .eq('id', vitaminId)
        .single();

      if (error) {
        throw new Error(`Failed to get vitamin: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting vitamin by ID:', error);
      throw error;
    }
  }

  // Create vitamin (admin only)
  public async createVitamin(vitamin: Omit<Vitamin, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vitamin> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('vitamins')
        .insert({
          ...mapVitaminToDb(vitamin),
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create vitamin: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating vitamin:', error);
      throw error;
    }
  }

  // Update vitamin (admin only)
  public async updateVitamin(
    vitaminId: string,
    updates: Partial<Vitamin>
  ): Promise<Vitamin> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('vitamins')
        .update({
          ...mapVitaminToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', vitaminId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update vitamin: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating vitamin:', error);
      throw error;
    }
  }

  // Delete vitamin (admin only)
  public async deleteVitamin(vitaminId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('vitamins')
        .delete()
        .eq('id', vitaminId);

      if (error) {
        throw new Error(`Failed to delete vitamin: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting vitamin:', error);
      throw error;
    }
  }

  // Get vitamin intake logs for a user
  public async getVitaminIntakeLogs(
    userId: string,
    date?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: VitaminIntake[]; count: number }> {
    try {
      let query = this.supabaseService.getClient()
        .from('vitamin_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      }

      query = query
        .range((page - 1) * limit, page * limit - 1);

      const { data, count, error } = await query;

      if (error) {
        throw new Error(`Failed to get vitamin intake logs: ${error.message}`);
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error getting vitamin intake logs:', error);
      throw error;
    }
  }

  // Add vitamin intake log
  public async addVitaminIntake(log: Omit<VitaminIntake, 'id' | 'createdAt'>): Promise<VitaminIntake> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('vitamin_logs')
        .insert({
          ...mapVitaminIntakeToDb(log),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add vitamin intake log: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error adding vitamin intake log:', error);
      throw error;
    }
  }

  // Update vitamin intake log
  public async updateVitaminIntake(
    logId: string,
    updates: Partial<VitaminIntake>
  ): Promise<VitaminIntake> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('vitamin_logs')
        .update({
          ...mapVitaminIntakeToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', logId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update vitamin intake log: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating vitamin intake log:', error);
      throw error;
    }
  }

  // Delete vitamin intake log
  public async deleteVitaminIntake(logId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('vitamin_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        throw new Error(`Failed to delete vitamin intake log: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting vitamin intake log:', error);
      throw error;
    }
  }

  // Get vitamin plans for a user
  public async getVitaminPlans(
    userId: string,
    isActive: boolean = true
  ): Promise<VitaminPlan[]> {
    try {
      let query = this.supabaseService.getClient()
        .from('vitamin_plans')
        .select('*')
        .eq('user_id', userId);

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get vitamin plans: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting vitamin plans:', error);
      throw error;
    }
  }

  // Create vitamin plan
  public async createVitaminPlan(
    plan: Omit<VitaminPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VitaminPlan> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('vitamin_plans')
        .insert({
          ...mapVitaminPlanToDb(plan),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create vitamin plan: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating vitamin plan:', error);
      throw error;
    }
  }

  // Update vitamin plan
  public async updateVitaminPlan(
    planId: string,
    updates: Partial<VitaminPlan>
  ): Promise<VitaminPlan> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('vitamin_plans')
        .update({
          ...mapVitaminPlanToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update vitamin plan: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating vitamin plan:', error);
      throw error;
    }
  }

  // Delete vitamin plan
  public async deleteVitaminPlan(planId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('vitamin_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        throw new Error(`Failed to delete vitamin plan: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting vitamin plan:', error);
      throw error;
    }
  }

  // Get vitamin recommendations based on user profile
  public async getVitaminRecommendations(
    userId: string,
    age: number,
    gender: 'male' | 'female' | 'other',
    healthGoals: string[],
    healthProfile: any
  ): Promise<{ vitamin: Vitamin; dosage: string; timing: string }[]> {
    try {
      // This would integrate with AI to provide personalized recommendations
      // For now, return basic recommendations based on age and gender
      const recommendations: { vitamin: Vitamin; dosage: string; timing: string }[] = [];

      // Valid vitamin IDs to prevent errors
      const validVitaminIds = ['vitamin_d', 'vitamin_c', 'vitamin_b12', 'vitamin_k', 'folic_acid'];

      if (age < 18) {
        // Children/teens
        if (validVitaminIds.includes('vitamin_d')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_d'),
            dosage: '600 IU daily',
            timing: 'breakfast',
          });
        }
        if (validVitaminIds.includes('vitamin_c')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_c'),
            dosage: '45mg daily',
            timing: 'morning',
          });
        }
      }

      if (age >= 18 && age < 30) {
        // Young adults
        if (validVitaminIds.includes('vitamin_d')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_d'),
            dosage: '800 IU daily',
            timing: 'breakfast',
          });
        }
        if (validVitaminIds.includes('vitamin_c')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_c'),
            dosage: '90mg daily',
            timing: 'morning',
          });
        }
      }

      if (age >= 30 && age < 50) {
        // Adults
        if (validVitaminIds.includes('vitamin_d')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_d'),
            dosage: '800 IU daily',
            timing: 'breakfast',
          });
        }
        if (validVitaminIds.includes('vitamin_b12')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_b12'),
            dosage: '2.4mcg daily',
            timing: 'morning',
          });
        }
      }

      if (age >= 50) {
        // Older adults
        if (validVitaminIds.includes('vitamin_d')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_d'),
            dosage: '1000 IU daily',
            timing: 'breakfast',
          });
        }
        if (validVitaminIds.includes('vitamin_b12')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_b12'),
            dosage: '2.4mcg daily',
            timing: 'morning',
          });
        }
        if (validVitaminIds.includes('vitamin_c')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_c'),
            dosage: '90mg daily',
            timing: 'morning',
          });
        }
      }

      if (gender === 'female') {
        if (validVitaminIds.includes('folic_acid')) {
          recommendations.push({
            vitamin: await this.getVitaminById('folic_acid'),
            dosage: '400mcg daily',
            timing: 'with_meal',
          });
        }
        // Note: Iron is a mineral, not a vitamin - removed from here
        // Use mineralService.getMineralById('iron') instead
      }

      if (healthGoals.includes('immune_support')) {
        if (validVitaminIds.includes('vitamin_c')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_c'),
            dosage: '1000mg daily',
            timing: 'morning',
          });
        }
        if (validVitaminIds.includes('vitamin_d')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_d'),
            dosage: '1000 IU daily',
            timing: 'breakfast',
          });
        }
      }

      if (healthGoals.includes('bone_health')) {
        if (validVitaminIds.includes('vitamin_d')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_d'),
            dosage: '1000 IU daily',
            timing: 'breakfast',
          });
        }
        if (validVitaminIds.includes('vitamin_k')) {
          recommendations.push({
            vitamin: await this.getVitaminById('vitamin_k'),
            dosage: '90mcg daily',
            timing: 'with_meal',
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting vitamin recommendations:', error);
      return [];
    }
  }

  // Get vitamins by deficiency symptoms
  public async getVitaminsByDeficiencySymptoms(
    symptoms: string[]
  ): Promise<Vitamin[]> {
    try {
      const { data: allVitamins } = await this.getVitamins();

      const relevantVitamins = allVitamins.filter(vitamin =>
        vitamin.deficiencySymptoms.some(symptom =>
          symptoms.some(userSymptom =>
            userSymptom.toLowerCase().includes(symptom.toLowerCase())
          )
        )
      );

      return relevantVitamins;
    } catch (error) {
      console.error('Error getting vitamins by deficiency symptoms:', error);
      return [];
    }
  }

  // Check for vitamin interactions
  public async checkVitaminInteractions(
    vitaminIds: string[]
  ): Promise<{ vitaminId: string; interactions: string[] }[]> {
    try {
      const interactions: { vitaminId: string; interactions: string[] }[] = [];

      for (const vitaminId of vitaminIds) {
        const vitamin = await this.getVitaminById(vitaminId);

        const { data: relatedVitamins } = await this.getVitamins();
        const currentIngredients = [vitamin.chemicalName];

        const foundInteractions = relatedVitamins
          .filter(v =>
            v.id !== vitaminId &&
            v.chemicalName &&
            currentIngredients.some(ingredient =>
              v.chemicalName.toLowerCase().includes(ingredient.toLowerCase())
            )
          )
          .map(v => v.chemicalName);

        interactions.push({
          vitaminId,
          interactions: foundInteractions,
        });
      }

      return interactions;
    } catch (error) {
      console.error('Error checking vitamin interactions:', error);
      return [];
    }
  }

  // Get daily value for vitamins
  public async getDailyVitaminRequirements(
    age: number,
    gender: 'male' | 'female' | 'other'
  ): Promise<Record<string, { recommended: number; maximum: number; unit: string }>> {
    try {
      const requirements: Record<string, { recommended: number; maximum: number; unit: string }> = {};

      // Based on Recommended Dietary Allowances (RDAs)
      if (age < 4) {
        requirements['Vitamin A'] = { recommended: 300, maximum: 900, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 15, maximum: 400, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 400, maximum: 1000, unit: 'IU' };
        requirements['Vitamin E'] = { recommended: 6, maximum: 300, unit: 'IU' };
        requirements['Vitamin K'] = { recommended: 30, maximum: 75, unit: 'mcg' };
      } else if (age < 9) {
        requirements['Vitamin A'] = { recommended: 400, maximum: 900, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 25, maximum: 400, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 600, maximum: 1000, unit: 'IU' };
        requirements['Vitamin E'] = { recommended: 7, maximum: 300, unit: 'IU' };
        requirements['Vitamin K'] = { recommended: 55, maximum: 75, unit: 'mcg' };
      } else if (age < 13) {
        requirements['Vitamin A'] = { recommended: 600, maximum: 900, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 25, maximum: 600, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 600, maximum: 1000, unit: 'IU' };
        requirements['Vitamin E'] = { recommended: 11, maximum: 600, unit: 'IU' };
        requirements['Vitamin K'] = { recommended: 60, maximum: 75, unit: 'mcg' };
      } else if (age < 18) {
        requirements['Vitamin A'] = { recommended: 900, maximum: 3000, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 45, maximum: 2000, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 600, maximum: 2000, unit: 'IU' };
        requirements['Vitamin E'] = { recommended: 15, maximum: 600, unit: 'IU' };
        requirements['Vitamin K'] = { recommended: 75, maximum: 75, unit: 'mcg' };
      } else if (age < 51) {
        requirements['Vitamin A'] = { recommended: 900, maximum: 3000, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 90, maximum: 2000, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 800, maximum: 4000, unit: 'IU' };
        requirements['Vitamin E'] = { recommended: 15, maximum: 1000, unit: 'IU' };
        requirements['Vitamin K'] = { recommended: 90, maximum: 75, unit: 'mcg' };
        requirements['Vitamin B1'] = { recommended: 1.2, maximum: 100, unit: 'mg' };
        requirements['Vitamin B2'] = { recommended: 1.3, maximum: 200, unit: 'mg' };
        requirements['Vitamin B3'] = { recommended: 16, maximum: 35, unit: 'mg' };
        requirements['Vitamin B5'] = { recommended: 5, maximum: 1000, unit: 'mg' };
        requirements['Vitamin B6'] = { recommended: 1.3, maximum: 100, unit: 'mg' };
        requirements['Vitamin B7'] = { recommended: 30, maximum: 100, unit: 'mcg' };
        requirements['Vitamin B9'] = { recommended: 400, maximum: 1000, unit: 'mcg' };
        requirements['Vitamin B12'] = { recommended: 2.4, maximum: 1000, unit: 'mcg' };
      } else {
        requirements['Vitamin A'] = { recommended: 900, maximum: 3000, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 90, maximum: 2000, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 800, maximum: 4000, unit: 'IU' };
        requirements['Vitamin E'] = { recommended: 15, maximum: 1000, unit: 'IU' };
        requirements['Vitamin K'] = { recommended: 90, maximum: 75, unit: 'mcg' };
        requirements['Vitamin B1'] = { recommended: 1.2, maximum: 100, unit: 'mg' };
        requirements['Vitamin B2'] = { recommended: 1.3, maximum: 200, unit: 'mg' };
        requirements['Vitamin B3'] = { recommended: 16, maximum: 35, unit: 'mg' };
        requirements['Vitamin B5'] = { recommended: 5, maximum: 1000, unit: 'mg' };
        requirements['Vitamin B6'] = { recommended: 1.7, maximum: 100, unit: 'mg' };
        requirements['Vitamin B7'] = { recommended: 30, maximum: 100, unit: 'mcg' };
        requirements['Vitamin B9'] = { recommended: 400, maximum: 1000, unit: 'mcg' };
        requirements['Vitamin B12'] = { recommended: 2.4, maximum: 1000, unit: 'mcg' };
      }

      if (gender === 'female') {
        requirements['Folic Acid'] = { recommended: 400, maximum: 1000, unit: 'mcg' };
        requirements['Iron'] = { recommended: 18, maximum: 27, unit: 'mg' };
      }

      return requirements;
    } catch (error) {
      console.error('Error getting daily vitamin requirements:', error);
      return {};
    }
  }

  // Get popular vitamins
  public async getPopularVitamins(limit: number = 10): Promise<Vitamin[]> {
    try {
      const { data } = await this.supabaseService.getClient()
        .from('vitamins')
        .select('*')
        .eq('is_verified', true)
        .order('name', { ascending: true })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting popular vitamins:', error);
      return [];
    }
  }

  // Get vitamins by type
  public async getVitaminsByType(type: 'fat_soluble' | 'water_soluble'): Promise<Vitamin[]> {
    try {
      const { data } = await this.supabaseService.getClient()
        .from('vitamins')
        .select('*')
        .eq('type', type)
        .eq('is_verified', true)
        .order('name', { ascending: true });

      return data || [];
    } catch (error) {
      console.error('Error getting vitamins by type:', error);
      return [];
    }
  }
}
