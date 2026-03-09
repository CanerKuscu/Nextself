import { SupabaseService } from './supabase';

export interface Supplement {
  id: string;
  name: string;
  brand?: string;
  category: 'vitamin' | 'mineral' | 'protein' | 'pre_workout' | 'post_workout' | 'other';
  type: 'tablet' | 'capsule' | 'powder' | 'liquid' | 'gummy';
  dosage: string;
  unit: string; // mg, g, ml, mcg, IU, etc.
  servingSize: string;
  ingredients: string[];
  benefits: string[];
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  contraindications: string[];
  recommendedIntake: {
    min: number;
    max: number;
    unit: string;
    frequency: string;
  };
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

export interface SupplementLog {
  id: string;
  userId: string;
  supplementId: string;
  quantity: number;
  unit: string;
  takenAt: string;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
}

export interface SupplementPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  supplements: {
    supplementId: string;
    quantity: number;
    unit: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'with_meal' | 'pre_workout' | 'post_workout';
  }[];
  duration: number; // in days
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Maps camelCase TypeScript keys to snake_case PostgreSQL column names
function mapSupplementToDb(obj: Record<string, any>): Record<string, any> {
  const keyMap: Record<string, string> = {
    servingSize: 'serving_size',
    sideEffects: 'side_effects',
    recommendedIntake: 'recommended_intake',
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

function mapSupplementLogToDb(obj: Record<string, any>): Record<string, any> {
  const keyMap: Record<string, string> = {
    userId: 'user_id',
    supplementId: 'supplement_id',
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

function mapSupplementPlanToDb(obj: Record<string, any>): Record<string, any> {
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

export class SupplementService {
  private static instance: SupplementService;
  private supabaseService: SupabaseService;

  private constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  public static getInstance(): SupplementService {
    if (!SupplementService.instance) {
      SupplementService.instance = new SupplementService();
    }
    return SupplementService.instance;
  }

  // Get all supplements
  public async getSupplements(
    category?: string,
    search?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Supplement[]; count: number }> {
    try {
      let query = this.supabaseService.getClient()
        .from('supplements')
        .select('*')
        .eq('is_verified', true);

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        const safe = search.replace(/[,.*()%_\\]/g, '');
        query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,ingredients.ilike.%${safe}%`);
      }

      query = query
        .order('name', { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      const { data, count, error } = await query;

      if (error) {
        throw new Error(`Failed to get supplements: ${error.message}`);
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error getting supplements:', error);
      throw error;
    }
  }

  // Get supplement by ID
  public async getSupplementById(supplementId: string): Promise<Supplement> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('supplements')
        .select('*')
        .eq('id', supplementId)
        .single();

      if (error) {
        throw new Error(`Failed to get supplement: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting supplement by ID:', error);
      throw error;
    }
  }

  // Create supplement (admin only)
  public async createSupplement(supplement: Omit<Supplement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplement> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('supplements')
        .insert({
          ...mapSupplementToDb(supplement),
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create supplement: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating supplement:', error);
      throw error;
    }
  }

  // Update supplement (admin only)
  public async updateSupplement(
    supplementId: string,
    updates: Partial<Supplement>
  ): Promise<Supplement> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('supplements')
        .update({
          ...mapSupplementToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplementId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update supplement: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating supplement:', error);
      throw error;
    }
  }

  // Delete supplement (admin only)
  public async deleteSupplement(supplementId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('supplements')
        .delete()
        .eq('id', supplementId);

      if (error) {
        throw new Error(`Failed to delete supplement: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting supplement:', error);
      throw error;
    }
  }

  // Get supplement logs for a user
  public async getSupplementLogs(
    userId: string,
    date?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: SupplementLog[]; count: number }> {
    try {
      let query = this.supabaseService.getClient()
        .from('supplement_logs')
        .select('*')
        .eq('user_id', userId)
        .order('taken_at', { ascending: false });

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
        throw new Error(`Failed to get supplement logs: ${error.message}`);
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error getting supplement logs:', error);
      throw error;
    }
  }

  // Add supplement log
  public async addSupplementLog(log: Omit<SupplementLog, 'id' | 'createdAt'>): Promise<SupplementLog> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('supplement_logs')
        .insert({
          ...mapSupplementLogToDb(log),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add supplement log: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error adding supplement log:', error);
      throw error;
    }
  }

  // Update supplement log
  public async updateSupplementLog(
    logId: string,
    updates: Partial<SupplementLog>
  ): Promise<SupplementLog> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('supplement_logs')
        .update({
          ...mapSupplementLogToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', logId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update supplement log: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating supplement log:', error);
      throw error;
    }
  }

  // Delete supplement log
  public async deleteSupplementLog(logId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('supplement_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        throw new Error(`Failed to delete supplement log: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting supplement log:', error);
      throw error;
    }
  }

  // Get supplement plans for a user
  public async getSupplementPlans(
    userId: string,
    isActive: boolean = true
  ): Promise<SupplementPlan[]> {
    try {
      let query = this.supabaseService.getClient()
        .from('supplement_plans')
        .select('*')
        .eq('user_id', userId);

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get supplement plans: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting supplement plans:', error);
      throw error;
    }
  }

  // Create supplement plan
  public async createSupplementPlan(
    plan: Omit<SupplementPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SupplementPlan> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('supplement_plans')
        .insert({
          ...mapSupplementPlanToDb(plan),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create supplement plan: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating supplement plan:', error);
      throw error;
    }
  }

  // Update supplement plan
  public async updateSupplementPlan(
    planId: string,
    updates: Partial<SupplementPlan>
  ): Promise<SupplementPlan> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('supplement_plans')
        .update({
          ...mapSupplementPlanToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update supplement plan: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating supplement plan:', error);
      throw error;
    }
  }

  // Delete supplement plan
  public async deleteSupplementPlan(planId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('supplement_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        throw new Error(`Failed to delete supplement plan: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting supplement plan:', error);
      throw error;
    }
  }

  // Get supplement recommendations based on user goals
  public async getSupplementRecommendations(
    userId: string,
    goals: string[],
    healthProfile: any
  ): Promise<Supplement[]> {
    try {
      // This would integrate with AI to provide personalized recommendations
      // For now, return popular supplements based on goals
      const recommendations: Supplement[] = [];

      if (goals.includes('muscle_gain')) {
        const protein = await this.getSupplementByCategory('protein');
        const preWorkout = await this.getSupplementByCategory('pre_workout');
        const postWorkout = await this.getSupplementByCategory('post_workout');
        recommendations.push(...protein, ...preWorkout, ...postWorkout);
      }

      if (goals.includes('general_health')) {
        const vitamins = await this.getSupplementByCategory('vitamin');
        const minerals = await this.getSupplementByCategory('mineral');
        recommendations.push(...vitamins, ...minerals);
      }

      if (goals.includes('energy')) {
        const others = await this.getSupplementByCategory('other');
        recommendations.push(...others);
      }

      // Remove duplicates
      const uniqueRecommendations = recommendations.filter(
        (supplement, index, self) =>
          recommendations.findIndex((s) => s.id === supplement.id) === index
      );

      return uniqueRecommendations.slice(0, 10);
    } catch (error) {
      console.error('Error getting supplement recommendations:', error);
      throw error;
    }
  }

  // Get supplements by category
  private async getSupplementByCategory(category: string): Promise<Supplement[]> {
    try {
      const { data } = await this.supabaseService.getClient()
        .from('supplements')
        .select('*')
        .eq('category', category)
        .eq('is_verified', true)
        .order('name', { ascending: true })
        .limit(20);

      return data || [];
    } catch (error) {
      console.error('Error getting supplements by category:', error);
      return [];
    }
  }

  // Search supplements by name
  public async searchSupplements(query: string): Promise<Supplement[]> {
    try {
      const { data } = await this.supabaseService.getClient()
        .from('supplements')
        .select('*')
        .or(`name.ilike.%${query.replace(/[,.*()%_\\]/g, '')}%,brand.ilike.%${query.replace(/[,.*()%_\\]/g, '')}%,ingredients.ilike.%${query.replace(/[,.*()%_\\]/g, '')}%`)
        .eq('is_verified', true)
        .order('name', { ascending: true })
        .limit(20);

      return data || [];
    } catch (error) {
      console.error('Error searching supplements:', error);
      return [];
    }
  }

  // Check for supplement interactions
  public async checkSupplementInteractions(
    supplementIds: string[]
  ): Promise<{ supplementId: string; interactions: string[] }[]> {
    try {
      const interactions: { supplementId: string; interactions: string[] }[] = [];

      for (const supplementId of supplementIds) {
        const supplement = await this.getSupplementById(supplementId);

        const { data: relatedSupplements } = await this.getSupplements();
        const currentIngredients = supplement.ingredients || [];

        const foundInteractions = relatedSupplements
          .filter(s =>
            s.ingredients.some(ingredient =>
              currentIngredients.includes(ingredient)
            )
          )
          .map(s => s.id);

        interactions.push({
          supplementId,
          interactions: foundInteractions,
        });
      }

      return interactions;
    } catch (error) {
      console.error('Error checking supplement interactions:', error);
      return [];
    }
  }

  // Get supplement intake recommendations (fetches from Supabase)
  public async getSupplementIntakeRecommendations(
    userId: string,
    age: number,
    gender: 'male' | 'female' | 'other',
    healthGoals: string[]
  ): Promise<{ supplement: Supplement; dosage: string; timing: string }[]> {
    try {
      const recommendations: { supplement: Supplement; dosage: string; timing: string }[] = [];

      // Fetch supplements from Supabase instead of using hardcoded data
      const supplementNames = ['Multivitamin', 'Vitamin D', 'Omega-3', 'Calcium', 'Vitamin B12', 'Vitamin C', 'Zinc'];
      const supplementMap: Record<string, Supplement> = {};

      for (const name of supplementNames) {
        try {
          const { data } = await this.supabaseService.getClient()
            .from('supplements')
            .select('*')
            .ilike('name', `%${name}%`)
            .eq('is_verified', true)
            .limit(1)
            .single();

          if (data) {
            supplementMap[name.toLowerCase().replace(/[-\s]/g, '_')] = data;
          }
        } catch (e) {
          // Supplement not found in database, skip
          console.warn(`Supplement not found: ${name}`);
        }
      }

      if (age < 18 && supplementMap.multivitamin) {
        recommendations.push({
          supplement: supplementMap.multivitamin,
          dosage: '1 tablet daily',
          timing: 'morning',
        });
      }

      if (age >= 18 && age < 30 && supplementMap.vitamin_d) {
        recommendations.push({
          supplement: supplementMap.vitamin_d,
          dosage: '1 tablet daily',
          timing: 'with_meal',
        });
      }

      if (age >= 30 && age < 50 && supplementMap.omega_3) {
        recommendations.push({
          supplement: supplementMap.omega_3,
          dosage: '1000mg daily',
          timing: 'with_meal',
        });
      }

      if (age >= 50) {
        if (supplementMap.vitamin_d) {
          recommendations.push({
            supplement: supplementMap.vitamin_d,
            dosage: '1 tablet daily',
            timing: 'morning',
          });
        }
        if (supplementMap.calcium) {
          recommendations.push({
            supplement: supplementMap.calcium,
            dosage: '500mg twice daily',
            timing: 'with_meal',
          });
        }
        if (supplementMap.vitamin_b12) {
          recommendations.push({
            supplement: supplementMap.vitamin_b12,
            dosage: '1000mcg daily',
            timing: 'morning',
          });
        }
      }

      if (healthGoals.includes('bone_health')) {
        if (supplementMap.calcium) {
          recommendations.push({
            supplement: supplementMap.calcium,
            dosage: '500mg twice daily',
            timing: 'with_meal',
          });
        }
        if (supplementMap.vitamin_d) {
          recommendations.push({
            supplement: supplementMap.vitamin_d,
            dosage: '1 tablet daily',
            timing: 'morning',
          });
        }
      }

      if (healthGoals.includes('immune_support')) {
        if (supplementMap.vitamin_c) {
          recommendations.push({
            supplement: supplementMap.vitamin_c,
            dosage: '1000mg daily',
            timing: 'morning',
          });
        }
        if (supplementMap.zinc) {
          recommendations.push({
            supplement: supplementMap.zinc,
            dosage: '15mg daily',
            timing: 'with_meal',
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting supplement intake recommendations:', error);
      return [];
    }
  }
}
