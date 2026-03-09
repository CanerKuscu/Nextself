import { SupabaseService } from './supabase';

export interface Mineral {
  id: string;
  name: string;
  chemicalFormula: string;
  commonName: string;
  type: 'macro' | 'trace' | 'ultra_trace';
  form: 'tablet' | 'capsule' | 'powder' | 'liquid' | 'injectable';
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

export interface MineralIntake {
  id: string;
  userId: string;
  mineralId: string;
  quantity: number;
  unit: string;
  takenAt: string;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
}

export interface MineralPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  minerals: {
    mineralId: string;
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
function mapMineralToDb(obj: Record<string, any>): Record<string, any> {
  const keyMap: Record<string, string> = {
    chemicalFormula: 'chemical_formula',
    commonName: 'common_name',
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

function mapMineralIntakeToDb(obj: Record<string, any>): Record<string, any> {
  const keyMap: Record<string, string> = {
    userId: 'user_id',
    mineralId: 'mineral_id',
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

function mapMineralPlanToDb(obj: Record<string, any>): Record<string, any> {
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

export class MineralService {
  private static instance: MineralService;
  private supabaseService: SupabaseService;

  // Sanitize user input for PostgREST filter queries to prevent injection
  private sanitizePostgrestValue(value: string): string {
    return value.replace(/[,.*()%_\\]/g, '');
  }

  private constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  public static getInstance(): MineralService {
    if (!MineralService.instance) {
      MineralService.instance = new MineralService();
    }
    return MineralService.instance;
  }

  // Get all minerals (public for external use)
  public async getMinerals(
    type?: string,
    search?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Mineral[]; count: number }> {
    try {
      let query = this.supabaseService.getClient()
        .from('minerals')
        .select('*')
        .eq('is_verified', true);

      if (type) {
        query = query.eq('type', type);
      }

      if (search) {
        const safe = this.sanitizePostgrestValue(search);
        query = query.or(`name.ilike.%${safe}%,common_name.ilike.%${safe}%,chemical_formula.ilike.%${safe}%`);
      }

      query = query
        .order('name', { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      const { data, count, error } = await query;

      if (error) {
        throw new Error(`Failed to get minerals: ${error.message}`);
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error getting minerals:', error);
      throw error;
    }
  }

  // Get mineral by ID
  public async getMineralById(mineralId: string): Promise<Mineral> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('minerals')
        .select('*')
        .eq('id', mineralId)
        .single();

      if (error) {
        throw new Error(`Failed to get mineral: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting mineral by ID:', error);
      throw error;
    }
  }

  // Create mineral (admin only)
  public async createMineral(mineral: Omit<Mineral, 'id' | 'createdAt' | 'updatedAt'>): Promise<Mineral> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('minerals')
        .insert({
          ...mapMineralToDb(mineral),
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create mineral: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating mineral:', error);
      throw error;
    }
  }

  // Update mineral (admin only)
  public async updateMineral(
    mineralId: string,
    updates: Partial<Mineral>
  ): Promise<Mineral> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('minerals')
        .update({
          ...mapMineralToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', mineralId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update mineral: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating mineral:', error);
      throw error;
    }
  }

  // Delete mineral (admin only)
  public async deleteMineral(mineralId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('minerals')
        .delete()
        .eq('id', mineralId);

      if (error) {
        throw new Error(`Failed to delete mineral: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting mineral:', error);
      throw error;
    }
  }

  // Get mineral intake logs for a user
  public async getMineralIntakeLogs(
    userId: string,
    date?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: MineralIntake[]; count: number }> {
    try {
      let query = this.supabaseService.getClient()
        .from('mineral_logs')
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
        throw new Error(`Failed to get mineral intake logs: ${error.message}`);
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error getting mineral intake logs:', error);
      throw error;
    }
  }

  // Add mineral intake log
  public async addMineralIntake(log: Omit<MineralIntake, 'id' | 'createdAt'>): Promise<MineralIntake> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('mineral_logs')
        .insert({
          ...mapMineralIntakeToDb(log),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add mineral intake log: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error adding mineral intake log:', error);
      throw error;
    }
  }

  // Update mineral intake log
  public async updateMineralIntake(
    logId: string,
    updates: Partial<MineralIntake>
  ): Promise<MineralIntake> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('mineral_logs')
        .update({
          ...mapMineralIntakeToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', logId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update mineral intake log: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating mineral intake log:', error);
      throw error;
    }
  }

  // Delete mineral intake log
  public async deleteMineralIntake(logId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('mineral_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        throw new Error(`Failed to delete mineral intake log: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting mineral intake log:', error);
      throw error;
    }
  }

  // Get mineral plans for a user
  public async getMineralPlans(
    userId: string,
    isActive: boolean = true
  ): Promise<MineralPlan[]> {
    try {
      let query = this.supabaseService.getClient()
        .from('mineral_plans')
        .select('*')
        .eq('user_id', userId);

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get mineral plans: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting mineral plans:', error);
      throw error;
    }
  }

  // Create mineral plan
  public async createMineralPlan(
    plan: Omit<MineralPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MineralPlan> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('mineral_plans')
        .insert({
          ...mapMineralPlanToDb(plan),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create mineral plan: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating mineral plan:', error);
      throw error;
    }
  }

  // Update mineral plan
  public async updateMineralPlan(
    planId: string,
    updates: Partial<MineralPlan>
  ): Promise<MineralPlan> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('mineral_plans')
        .update({
          ...mapMineralPlanToDb(updates),
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update mineral plan: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating mineral plan:', error);
      throw error;
    }
  }

  // Delete mineral plan
  public async deleteMineralPlan(planId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('mineral_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        throw new Error(`Failed to delete mineral plan: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting mineral plan:', error);
      throw error;
    }
  }

  // Get mineral recommendations based on user profile
  public async getMineralRecommendations(
    userId: string,
    age: number,
    gender: 'male' | 'female' | 'other',
    healthGoals: string[],
    healthProfile: any
  ): Promise<{ mineral: Mineral; dosage: string; timing: string }[]> {
    try {
      // This would integrate with AI to provide personalized recommendations
      // For now, return basic recommendations based on age and gender
      const recommendations: { mineral: Mineral; dosage: string; timing: string }[] = [];

      // Skip invalid IDs that don't exist in minerals table
      const validMineralIds = ['iron', 'calcium', 'magnesium', 'zinc', 'selenium', 'copper', 'iodine', 'manganese', 'chromium', 'molybdenum', 'phosphorus'];

      if (age < 18) {
        // Children/teens
        if (validMineralIds.includes('iron')) {
          recommendations.push({
            mineral: await this.getMineralById('iron'),
            dosage: '10mg daily',
            timing: 'with_meal',
          });
        }
        if (validMineralIds.includes('calcium')) {
          recommendations.push({
            mineral: await this.getMineralById('calcium'),
            dosage: '200mg daily',
            timing: 'with_meal',
          });
        }
      }

      if (age >= 18 && age < 30) {
        // Young adults
        if (validMineralIds.includes('magnesium')) {
          recommendations.push({
            mineral: await this.getMineralById('magnesium'),
            dosage: '400mg daily',
            timing: 'evening',
          });
        }
        if (validMineralIds.includes('zinc')) {
          recommendations.push({
            mineral: await this.getMineralById('zinc'),
            dosage: '15mg daily',
            timing: 'with_meal',
          });
        }
      }

      if (age >= 30 && age < 50) {
        // Adults
        if (validMineralIds.includes('iron')) {
          recommendations.push({
            mineral: await this.getMineralById('iron'),
            dosage: '18mg daily',
            timing: 'with_meal',
          });
        }
        if (validMineralIds.includes('selenium')) {
          recommendations.push({
            mineral: await this.getMineralById('selenium'),
            dosage: '55mcg daily',
            timing: 'with_meal',
          });
        }
      }

      if (age >= 50) {
        // Older adults - only use valid mineral IDs
        if (validMineralIds.includes('calcium')) {
          recommendations.push({
            mineral: await this.getMineralById('calcium'),
            dosage: '1200mg daily',
            timing: 'with_meal',
          });
        }
        if (validMineralIds.includes('magnesium')) {
          recommendations.push({
            mineral: await this.getMineralById('magnesium'),
            dosage: '400mg daily',
            timing: 'evening',
          });
        }
      }

      if (gender === 'female') {
        if (validMineralIds.includes('iron')) {
          recommendations.push({
            mineral: await this.getMineralById('iron'),
            dosage: '18mg daily',
            timing: 'with_meal',
          });
        }
        // Note: folic_acid is a vitamin, not a mineral - skip or use correct ID
        if (validMineralIds.includes('calcium')) {
          recommendations.push({
            mineral: await this.getMineralById('calcium'),
            dosage: '1200mg daily',
            timing: 'with_meal',
          });
        }
      }

      if (healthGoals.includes('bone_health')) {
        if (validMineralIds.includes('calcium')) {
          recommendations.push({
            mineral: await this.getMineralById('calcium'),
            dosage: '1000mg daily',
            timing: 'with_meal',
          });
        }
      }

      if (healthGoals.includes('immune_support')) {
        if (validMineralIds.includes('zinc')) {
          recommendations.push({
            mineral: await this.getMineralById('zinc'),
            dosage: '30mg daily',
            timing: 'with_meal',
          });
        }
        if (validMineralIds.includes('selenium')) {
          recommendations.push({
            mineral: await this.getMineralById('selenium'),
            dosage: '55mcg daily',
            timing: 'with_meal',
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting mineral recommendations:', error);
      return [];
    }
  }

  // Get minerals by deficiency symptoms
  public async getMineralsByDeficiencySymptoms(
    symptoms: string[]
  ): Promise<Mineral[]> {
    try {
      const { data: allMinerals } = await this.getMinerals();

      const relevantMinerals = allMinerals.filter(mineral =>
        mineral.deficiencySymptoms.some(symptom =>
          symptoms.some(userSymptom =>
            userSymptom.toLowerCase().includes(symptom.toLowerCase())
          )
        )
      );

      return relevantMinerals;
    } catch (error) {
      console.error('Error getting minerals by deficiency symptoms:', error);
      return [];
    }
  }

  // Check for mineral interactions
  public async checkMineralInteractions(
    mineralIds: string[]
  ): Promise<{ mineralId: string; interactions: string[] }[]> {
    try {
      const interactions: { mineralId: string; interactions: string[] }[] = [];

      for (const mineralId of mineralIds) {
        const mineral = await this.getMineralById(mineralId);

        const { data: relatedMinerals } = await this.getMinerals();
        const currentIngredients = [mineral.chemicalFormula];

        const foundInteractions = relatedMinerals
          .filter(s =>
            s.id !== mineralId &&
            s.chemicalFormula &&
            currentIngredients.some(ingredient =>
              s.chemicalFormula.toLowerCase().includes(ingredient.toLowerCase())
            )
          )
          .map(s => s.chemicalFormula);

        interactions.push({
          mineralId,
          interactions: foundInteractions,
        });
      }

      return interactions;
    } catch (error) {
      console.error('Error checking mineral interactions:', error);
      return [];
    }
  }

  // Get daily value for minerals
  public async getDailyMineralRequirements(
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
      } else if (age < 9) {
        requirements['Vitamin A'] = { recommended: 400, maximum: 900, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 25, maximum: 400, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 600, maximum: 1000, unit: 'IU' };
        requirements['Iron'] = { recommended: 10, maximum: 40, unit: 'mg' };
      } else if (age < 13) {
        requirements['Vitamin A'] = { recommended: 600, maximum: 900, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 25, maximum: 600, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 600, maximum: 1000, unit: 'IU' };
        requirements['Iron'] = { recommended: 11, maximum: 40, unit: 'mg' };
        requirements['Magnesium'] = { recommended: 240, maximum: 400, unit: 'mg' };
      } else if (age < 18) {
        requirements['Vitamin A'] = { recommended: 900, maximum: 3000, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 45, maximum: 2000, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 600, maximum: 2000, unit: 'IU' };
        requirements['Iron'] = { recommended: 8, maximum: 45, unit: 'mg' };
        requirements['Magnesium'] = { recommended: 350, maximum: 700, unit: 'mg' };
        requirements['Phosphorus'] = { recommended: 500, maximum: 1000, unit: 'mg' };
      } else if (age < 51) {
        requirements['Vitamin A'] = { recommended: 900, maximum: 3000, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 90, maximum: 2000, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 800, maximum: 4000, unit: 'IU' };
        requirements['Iron'] = { recommended: 8, maximum: 45, unit: 'mg' };
        requirements['Magnesium'] = { recommended: 420, maximum: 1000, unit: 'mg' };
        requirements['Phosphorus'] = { recommended: 700, maximum: 4000, unit: 'mg' };
        requirements['Calcium'] = { recommended: 1000, maximum: 2500, unit: 'mg' };
        requirements['Zinc'] = { recommended: 11, maximum: 40, unit: 'mg' };
        requirements['Selenium'] = { recommended: 55, maximum: 200, unit: 'mcg' };
      } else {
        requirements['Vitamin A'] = { recommended: 900, maximum: 3000, unit: 'IU' };
        requirements['Vitamin C'] = { recommended: 90, maximum: 2000, unit: 'mg' };
        requirements['Vitamin D'] = { recommended: 800, maximum: 4000, unit: 'IU' };
        requirements['Iron'] = { recommended: 8, maximum: 45, unit: 'mg' };
        requirements['Magnesium'] = { recommended: 420, maximum: 1000, unit: 'mg' };
        requirements['Phosphorus'] = { recommended: 700, maximum: 4000, unit: 'mg' };
        requirements['Calcium'] = { recommended: 1200, maximum: 2500, unit: 'mg' };
        requirements['Zinc'] = { recommended: 11, maximum: 40, unit: 'mg' };
        requirements['Selenium'] = { recommended: 55, maximum: 200, unit: 'mcg' };
        requirements['Copper'] = { recommended: 0.9, maximum: 10, unit: 'mg' };
        requirements['Iodine'] = { recommended: 150, maximum: 1000, unit: 'mcg' };
        requirements['Manganese'] = { recommended: 2.3, maximum: 11, unit: 'mg' };
        requirements['Chromium'] = { recommended: 35, maximum: 200, unit: 'mcg' };
        requirements['Molybdenum'] = { recommended: 45, maximum: 2000, unit: 'mcg' };
      }

      if (gender === 'female') {
        requirements['Iron'] = { recommended: 18, maximum: 27, unit: 'mg' };
        requirements['Folic Acid'] = { recommended: 400, maximum: 1000, unit: 'mcg' };
        requirements['B12'] = { recommended: 2.4, maximum: 1000, unit: 'mcg' };
      }

      return requirements;
    } catch (error) {
      console.error('Error getting daily mineral requirements:', error);
      return {};
    }
  }

  // Get popular minerals
  public async getPopularMinerals(limit: number = 10): Promise<Mineral[]> {
    try {
      const { data } = await this.supabaseService.getClient()
        .from('minerals')
        .select('*')
        .eq('is_verified', true)
        .order('name', { ascending: true })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting popular minerals:', error);
      return [];
    }
  }
}
