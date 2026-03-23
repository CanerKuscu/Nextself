import { SupabaseService } from '@nextself/shared';

export interface Supplement {
  id: string;
  name: string; // Dynamic based on language (name_en or name_tr)
  nameEn?: string;
  nameTr?: string;
  description?: string; // Dynamic
  descriptionEn?: string;
  descriptionTr?: string;
  category: 'vitamin' | 'mineral' | 'protein' | 'amino_acid' | 'herbal' | 'other';
  form: 'tablet' | 'capsule' | 'powder' | 'liquid' | 'gummy' | 'softgel' | 'drops';
  dosageAmount: string;
  dosageUnit: string;
  servingSize: string;
  benefits: string[]; // Dynamic
  benefitsEn?: string[];
  benefitsTr?: string[];
  sideEffects: string[]; // Dynamic
  sideEffectsEn?: string[];
  sideEffectsTr?: string[];
  usageInstructions: string; // Dynamic
  usageInstructionsEn?: string;
  usageInstructionsTr?: string;
  imageUrl?: string;
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
  notes?: string;
  createdAt: string;
  // Expanded fields for UI
  supplementName?: string;
  supplementCategory?: string;
}

export class SupplementService {
  private static instance: SupplementService;
  private supabase: any;

  private constructor() {
    this.supabase = SupabaseService.getInstance().getClient();
  }

  public static getInstance(): SupplementService {
    if (!SupplementService.instance) {
      SupplementService.instance = new SupplementService();
    }
    return SupplementService.instance;
  }

  // Get all supplements with language support
  public async getSupplements(
    language: 'en' | 'tr' = 'en',
    category?: string,
    search?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Supplement[]; count: number }> {
    try {
      let query = this.supabase
        .from('supplements')
        .select('*', { count: 'exact' })
        .eq('is_verified', true);

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        const safe = search.replace(/[,.*()%_\\]/g, '');
        if (language === 'tr') {
          query = query.or(`name_tr.ilike.%${safe}%`);
        } else {
          query = query.or(`name_en.ilike.%${safe}%`);
        }
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, count, error } = await query
        .order(language === 'tr' ? 'name_tr' : 'name_en', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => this.mapDbToSupplement(item, language));

      return { data: formattedData, count: count || 0 };
    } catch (error) {
      console.error('Error getting supplements:', error);
      return { data: [], count: 0 };
    }
  }

  // Get supplement by ID
  public async getSupplementById(supplementId: string, language: 'en' | 'tr' = 'en'): Promise<Supplement | null> {
    try {
      const { data, error } = await this.supabase
        .from('supplements')
        .select('*')
        .eq('id', supplementId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapDbToSupplement(data, language);
    } catch (error) {
      console.error('Error getting supplement by ID:', error);
      return null;
    }
  }

  // Helper to map DB row to Supplement interface
  private mapDbToSupplement(item: any, language: 'en' | 'tr'): Supplement {
    return {
      id: item.id,
      name: language === 'tr' ? item.name_tr : item.name_en,
      nameEn: item.name_en,
      nameTr: item.name_tr,
      description: language === 'tr' ? item.description_tr : item.description_en,
      descriptionEn: item.description_en,
      descriptionTr: item.description_tr,
      category: item.category,
      form: item.form,
      dosageAmount: item.dosage_amount,
      dosageUnit: item.dosage_unit,
      servingSize: item.serving_size,
      benefits: language === 'tr' ? (item.benefits_tr || []) : (item.benefits_en || []),
      benefitsEn: item.benefits_en,
      benefitsTr: item.benefits_tr,
      sideEffects: language === 'tr' ? (item.side_effects_tr || []) : (item.side_effects_en || []),
      sideEffectsEn: item.side_effects_en,
      sideEffectsTr: item.side_effects_tr,
      usageInstructions: language === 'tr' ? item.usage_instructions_tr : item.usage_instructions_en,
      usageInstructionsEn: item.usage_instructions_en,
      usageInstructionsTr: item.usage_instructions_tr,
      imageUrl: item.image_url,
      isVerified: item.is_verified,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  // Get supplement logs for a user
  public async getSupplementLogs(
    userId: string,
    language: 'en' | 'tr' = 'en',
    date?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: SupplementLog[]; count: number }> {
    try {
      let query = this.supabase
        .from('user_supplement_logs')
        .select(`
          *,
          supplement:supplements(name_en, name_tr, category)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('taken_at', { ascending: false });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('taken_at', startOfDay.toISOString())
          .lte('taken_at', endOfDay.toISOString());
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        supplementId: item.supplement_id,
        quantity: item.quantity,
        unit: item.unit,
        takenAt: item.taken_at,
        notes: item.notes,
        createdAt: item.created_at,
        supplementName: language === 'tr' ? item.supplement?.name_tr : item.supplement?.name_en,
        supplementCategory: item.supplement?.category,
      }));

      return { data: formattedData, count: count || 0 };
    } catch (error) {
      console.error('Error getting supplement logs:', error);
      return { data: [], count: 0 };
    }
  }

  // Add supplement log
  public async addSupplementLog(log: Omit<SupplementLog, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await this.supabase
        .from('user_supplement_logs')
        .insert({
          user_id: log.userId,
          supplement_id: log.supplementId,
          quantity: log.quantity,
          unit: log.unit,
          taken_at: log.takenAt,
          notes: log.notes
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error adding supplement log:', error);
      return { success: false, error };
    }
  }

  // Delete supplement log
  public async deleteSupplementLog(logId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await this.supabase
        .from('user_supplement_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting supplement log:', error);
      return { success: false, error };
    }
  }

  // Get user's supplement routine
  public async getUserRoutine(userId: string): Promise<{ data: any[]; error?: any }> {
    try {
      const { data, error } = await this.supabase
        .from('user_supplement_routines')
        .select('*, supplement:supplements(name_en, name_tr, category, dosage_amount, dosage_unit)')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error getting user routine:', error);
      return { data: [], error };
    }
  }

  // Add supplement to routine
  public async addToRoutine(userId: string, supplementId: string, reminderTime?: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await this.supabase
        .from('user_supplement_routines')
        .upsert({
          user_id: userId,
          supplement_id: supplementId,
          reminder_time: reminderTime,
          is_active: true,
          updated_at: new Date()
        }, { onConflict: 'user_id,supplement_id' });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error adding to routine:', error);
      return { success: false, error };
    }
  }

  // Remove supplement from routine (set is_active to false)
  public async removeFromRoutine(userId: string, supplementId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await this.supabase
        .from('user_supplement_routines')
        .update({ is_active: false, updated_at: new Date() })
        .eq('user_id', userId)
        .eq('supplement_id', supplementId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing from routine:', error);
      return { success: false, error };
    }
  }
}
