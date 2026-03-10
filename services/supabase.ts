import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '../config/config';
import { ValidationUtils } from '../utils/validation';
import PlatformStorage from '../utils/platformStorage';

// Supabase auth storage adapter using shared PlatformStorage
const SecureStoreAdapter = {
  getItem: (key: string) => PlatformStorage.getItem(key),
  setItem: (key: string, value: string) => PlatformStorage.setItem(key, value),
  removeItem: (key: string) => PlatformStorage.removeItem(key),
};

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient;

  /** Escape special PostgreSQL LIKE/ILIKE wildcard characters to prevent injection */
  private escapeLike(value: string): string {
    return value.replace(/[%_\\]/g, '\\$&');
  }

  /** Sanitize SQL input to prevent SQL injection (basic escaping) */
  private sanitizeSQL(input: string): string {
    return ValidationUtils.sanitizeSQL(input);
  }

  /** Validate input for SQL injection risks */
  private validateSQLInjection(input: string): import('../utils/validation').ValidationResult {
    return ValidationUtils.validateSQLInjection(input);
  }

  /** Ensure input is safe for SQL usage; throws error if dangerous */
  private ensureSafeInput(input: string): void {
    const validation = this.validateSQLInjection(input);
    if (!validation.isValid) {
      throw new Error(`Potential SQL injection detected: ${validation.errors.join(', ')}`);
    }
  }

  /** Normalize professional type aliases across mixed schemas (`pt` vs `trainer`) */
  private professionalTypeCandidates(type?: string): string[] {
    if (!type) return [];
    const normalized = type.toLowerCase().trim();
    if (normalized === 'pt' || normalized === 'trainer') return ['pt', 'trainer'];
    if (normalized === 'dietitian') return ['dietitian'];
    return [normalized];
  }

  private constructor() {
    // Avoid persisting Supabase session into web `localStorage` by default.
    // Web clients should use cookie-based sessions (HttpOnly) via a server/proxy.
    const persistSession = Platform.OS !== 'web';
    const authOptions: any = {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: persistSession,
    };

    if (persistSession) {
      authOptions.storage = SecureStoreAdapter;
    }

    this.client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY, {
      auth: authOptions,
    });
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public getClient(): SupabaseClient {
    return this.client;
  }

  // ==================== AUTH ====================

  public async sendOTP(email: string, userData?: any) {
    const { data, error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        data: userData
      }
    });
    return { data, error };
  }

  /** Resend verification email (signup or email change) without requiring password */
  public async resendVerification(email: string, type: 'signup' | 'email_change' = 'signup') {
    const { data, error } = await this.client.auth.resend({
      type,
      email,
    });
    return { data, error };
  }

  public async verifyOTP(email: string, token: string, type: any = 'email') {
    const { data, error } = await this.client.auth.verifyOtp({
      email,
      token,
      type: type,
    });
    return { data, error };
  }

  public async updatePassword(newPassword: string) {
    const { data, error } = await this.client.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  }

  public async signUp(email: string, password: string, userData?: any) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  }

  public async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  public async signOut() {
    const { error } = await this.client.auth.signOut();
    return { error };
  }

  public async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    return { user, error };
  }

  // ==================== USERNAME & EMAIL ====================

  public async checkUsernameAvailability(username: string, currentUserId?: string): Promise<boolean> {
    const uname = username.toLowerCase().trim();
    if (uname.length < 3) return false;

    // Check profiles table (primary)
    let query = this.client
      .from('profiles')
      .select('id')
      .eq('username', uname);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data: profileData, error: profileError } = await query.maybeSingle();
    if (profileError) return false;
    if (profileData) return false;

    // Also check users table (fallback)
    let query2 = this.client
      .from('users')
      .select('id')
      .eq('username', uname);

    if (currentUserId) {
      query2 = query2.neq('id', currentUserId);
    }

    const { data: userData, error: userError } = await query2.maybeSingle();
    if (userError) return true; // users table may not exist, that's ok
    return !userData;
  }

  public async checkEmailAvailability(email: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    return !data && !error;
  }

  // ==================== EXERCISES ====================

  public async getExercises(language: string = 'en', category?: string, muscleGroup?: string, workoutType?: string, page: number = 0, pageSize: number = 200) {
    // Select explicit columns to reduce payload and improve performance
    const columns = `id,name,name_tr,description,description_tr,muscle_group,muscle_group_tr,instructions,instructions_tr,tips,tips_tr,category,equipment,is_verified,media_urls,video_url,difficulty`;
    let query = this.client
      .from('exercises')
      .select(columns);

    if (category && category !== 'all') {
      // DB categories are: legs, arms, shoulders, back, core, chest
      query = query.eq('category', category);
    }

    if (muscleGroup) {
      // Always query the English muscle_group column (DB stores English values)
      query = query.ilike('muscle_group', muscleGroup);
    }

    if (workoutType === 'calisthenics') {
      // Calisthenics exercises only use body weight
      query = query.ilike('equipment', '%body%');
    } else if (workoutType === 'cardio') {
      // Cardio exercises
      query = query.or('category.ilike.%cardio%,equipment.ilike.%cardio%,name.ilike.%cardio%,name_tr.ilike.%kardiyo%');
    }

    // Default pagination: prevent fetching excessively large resultsets
    const limit = Math.max(1, Math.min(1000, pageSize));
    const offset = Math.max(0, page) * limit;

    const { data, error } = await query.order('name').range(offset, offset + limit - 1);

    if (data && language === 'tr') {
      // Keep exercise names in English (Turkish translations often sound unnatural)
      // Only translate description, muscle_group, instructions, tips
      const mappedData = data.map(item => ({
        ...item,
        description: item.description_tr || item.description,
        muscle_group: item.muscle_group_tr || item.muscle_group,
        instructions: item.instructions_tr || item.instructions,
        tips: item.tips_tr || item.tips,
      }));
      return { data: mappedData, error };
    }

    return { data, error };
  }

  public async searchExercises(searchTerm: string, language: string = 'en', page: number = 0, pageSize: number = 50) {
    // Validate input for SQL injection
    this.ensureSafeInput(searchTerm);

    const columns = `id,name,name_tr,description,description_tr,muscle_group,muscle_group_tr,instructions,instructions_tr,tips,tips_tr,category,equipment,is_verified,media_urls,video_url,difficulty`;
    const nameField = language === 'tr' ? 'name_tr' : 'name';
    const limit = Math.max(1, Math.min(500, pageSize));
    const offset = Math.max(0, page) * limit;

    const { data, error } = await this.client
      .from('exercises')
      .select(columns)
      .eq('is_verified', true)
      .ilike(nameField, `%${this.escapeLike(searchTerm)}%`)
      .order('name')
      .range(offset, offset + limit - 1);

    if (data && language === 'tr') {
      const mappedData = data.map(item => ({
        ...item,
        description: item.description_tr || item.description,
        muscle_group: item.muscle_group_tr || item.muscle_group,
        instructions: item.instructions_tr || item.instructions,
        tips: item.tips_tr || item.tips,
      }));
      return { data: mappedData, error };
    }

    return { data, error };
  }

  // ==================== NUTRITION LOGGING ====================

  public async getTodayNutritionSummary(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await this.client
      .from('nutrition_logs')
      .select('calories, protein, carbs, fat')
      .eq('user_id', userId)
      .gte('logged_at', today.toISOString());

    if (data && data.length > 0) {
      const summary = data.reduce(
        (acc, item) => ({
          calories: acc.calories + (Number(item.calories) || 0),
          protein: acc.protein + (Number(item.protein) || 0),
          carbs: acc.carbs + (Number(item.carbs) || 0),
          fat: acc.fat + (Number(item.fat) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      return { data: summary, error: null };
    }
    return { data: { calories: 0, protein: 0, carbs: 0, fat: 0 }, error };
  }

  public async logNutritionEntry(userId: string, entry: {
    food_item_id?: string;
    meal_type?: string;
    food_name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    serving_size?: number;
    serving_unit?: string;
  }) {
    const { data, error } = await this.client
      .from('nutrition_logs')
      .insert({
        user_id: userId,
        ...entry,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  }

  // ==================== FOOD ITEMS ====================

  public async getFoodItems(language: string = 'en', category?: string, search?: string, page: number = 0, pageSize: number = 100) {
    // Validate inputs for SQL injection
    if (category) {
      this.ensureSafeInput(category);
    }
    if (search) {
      this.ensureSafeInput(search);
    }

    // Select explicit columns to reduce payload
    const columns = `id,name,name_tr,brand,category,category_tr,calories,protein,carbs,fat,fiber,sugar,sodium,image_url,serving_size,serving_unit,is_verified`;

    let query = this.client
      .from('food_items')
      .select(columns)
      .eq('is_verified', true);

    if (category) {
      if (language === 'tr') {
        query = query.ilike('category_tr', `%${this.escapeLike(category)}%`);
      } else {
        query = query.ilike('category', `%${this.escapeLike(category)}%`);
      }
    }

    if (search) {
      const nameField = language === 'tr' ? 'name_tr' : 'name';
      query = query.ilike(nameField, `%${this.escapeLike(search)}%`);
    }

    // Pagination
    const limit = Math.max(1, Math.min(1000, pageSize));
    const offset = Math.max(0, page) * limit;
    const { data, error } = await query.order('name').range(offset, offset + limit - 1);

    if (data && language === 'tr') {
      const mappedData = data.map(item => ({
        ...item,
        name: item.name_tr || item.name,
        category: item.category_tr || item.category,
      }));
      return { data: mappedData, error };
    }

    return { data, error };
  }

  public async searchFoodItems(searchTerm: string, language: string = 'en', page: number = 0, pageSize: number = 50) {
    // Validate input for SQL injection
    this.ensureSafeInput(searchTerm);
    const columns = `id,name,name_tr,brand,category,category_tr,calories,protein,carbs,fat,image_url,serving_size,serving_unit,is_verified`;
    const nameField = language === 'tr' ? 'name_tr' : 'name';
    const limit = Math.max(1, Math.min(500, pageSize));
    const offset = Math.max(0, page) * limit;

    const { data, error } = await this.client
      .from('food_items')
      .select(columns)
      .eq('is_verified', true)
      .ilike(nameField, `%${this.escapeLike(searchTerm)}%`)
      .order('name')
      .range(offset, offset + limit - 1);

    return { data, error };
  }

  public async getFoodCategories(page: number = 0, pageSize: number = 500) {
    // Request only the category column and limit results; dedupe client-side
    const limit = Math.max(1, Math.min(1000, pageSize));
    const offset = Math.max(0, page) * limit;
    const { data, error } = await this.client
      .from('food_items')
      .select('category')
      .eq('is_verified', true)
      .not('category', 'is', null)
      .order('category')
      .range(offset, offset + limit - 1);

    if (data) {
      const categories = [...new Set(
        data.map(item => item.category).filter(Boolean)
      )] as string[];
      return { data: categories, error: null };
    }
    return { data: [], error };
  }

  // ==================== USER PROFILE ====================

  public async getUserProfile(userId: string) {
    // Try profiles table first (main schema), fall back to users table
    let { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Fallback to users table for older schemas
      const result = await this.client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      data = result.data;
      error = result.error;
    }
    return { data, error };
  }

  public async updateUserProfile(userId: string, updates: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    height?: number;
    weight?: number;
    gender?: string;
    dob?: string;
  }) {
    const { data, error } = await this.client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  }

  // ==================== SOFT DELETE ====================

  public async softDeleteUser(userId: string) {
    const { error } = await this.client
      .from('users')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    return { error };
  }

  // ==================== PROFESSIONALS (CITY FILTER) ====================

  public async getProfessionalsByCity(city?: string, district?: string, type?: string) {
    // Validate inputs for SQL injection
    if (city) this.ensureSafeInput(city);
    if (district) this.ensureSafeInput(district);
    if (type) this.ensureSafeInput(type);

    let query = this.client
      .from('professional_profiles')
      .select('*, users(*)')
      .eq('is_active', true);

    const typeCandidates = this.professionalTypeCandidates(type);
    if (typeCandidates.length === 1) {
      query = query.eq('professional_type', typeCandidates[0]);
    } else if (typeCandidates.length > 1) {
      query = query.in('professional_type', typeCandidates);
    }
    if (city) query = query.ilike('city', `%${this.escapeLike(city)}%`);
    if (district) query = query.ilike('district', `%${this.escapeLike(district)}%`);

    const { data, error } = await query.order('average_rating', { ascending: false });
    return { data, error };
  }

  // ==================== SUPPLEMENTS ====================

  public async getSupplements(category?: string) {
    let query = this.client
      .from('supplements')
      .select('*')
      .eq('is_verified', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('name');
    return { data, error };
  }

  // ==================== VITAMINS ====================

  public async getVitamins(type?: string) {
    let query = this.client
      .from('vitamins')
      .select('*')
      .eq('is_verified', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('name');
    return { data, error };
  }

  // ==================== MINERALS ====================

  public async getMinerals(type?: string) {
    let query = this.client
      .from('minerals')
      .select('*')
      .eq('is_verified', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('name');
    return { data, error };
  }

  // ==================== PROFESSIONALS ====================

  public async getProfessionals(type?: string) {
    // Validate input for SQL injection
    if (type) this.ensureSafeInput(type);

    let query = this.client
      .from('professional_profiles')
      .select('*, users(*)')
      .eq('is_active', true);

    const typeCandidates = this.professionalTypeCandidates(type);
    if (typeCandidates.length === 1) {
      query = query.eq('professional_type', typeCandidates[0]);
    } else if (typeCandidates.length > 1) {
      query = query.in('professional_type', typeCandidates);
    }

    const { data, error } = await query.order('average_rating', { ascending: false });
    return { data, error };
  }

  // ==================== FOOD SCAN LOGGING ====================

  public async logFoodScan(userId: string, scanData: any) {
    // Whitelist allowed fields to prevent arbitrary column injection
    const allowed = ['barcode', 'food_name', 'brand', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'image_url', 'serving_size', 'serving_unit'];
    const safe: Record<string, any> = {};
    for (const key of allowed) {
      if (scanData[key] !== undefined) safe[key] = scanData[key];
    }
    const { data, error } = await this.client
      .from('food_scans')
      .insert({
        user_id: userId,
        ...safe,
        scanned_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  }

  public async getTodaysScanCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await this.client
      .from('food_scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('scanned_at', today.toISOString());

    return count || 0;
  }

  // ==================== CHAT & CONNECTIONS ====================

  public async connectWithProfessional(clientId: string, professionalId: string) {
    try {
      // Validate inputs
      if (!clientId || !professionalId) {
        throw new Error('Client ID and Professional ID are required');
      }

      // 1. Find direct chats where user A is a participant
      const { data: userChats, error: errA } = await this.client
        .from('chat_participants')
        .select('chat_id, chats!inner(type)')
        .eq('user_id', clientId)
        .eq('chats.type', 'direct');

      if (errA) {
        console.error('Failed to fetch user chats:', errA);
        throw new Error('Unable to fetch existing chats');
      }

      const chatIds = userChats.map(c => c.chat_id);
      let existingChatId = null;

      if (chatIds.length > 0) {
        // 2. Check if the professional is in any of these exact chats
        const { data: commonChats, error: errB } = await this.client
          .from('chat_participants')
          .select('chat_id')
          .in('chat_id', chatIds)
          .eq('user_id', professionalId);

        if (errB) {
          console.error('Failed to check common chats:', errB);
          throw new Error('Unable to verify chat existence');
        }

        if (commonChats && commonChats.length > 0) {
          existingChatId = commonChats[0].chat_id;
        }
      }

      if (existingChatId) {
        return { data: { chatId: existingChatId }, error: null };
      }

      // 3. Create new chat
      const { data: newChat, error: createError } = await this.client
        .from('chats')
        .insert({ type: 'direct' })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create new chat:', createError);
        throw new Error('Unable to create chat connection');
      }

      // 4. Add participants
      const { error: partError } = await this.client
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: clientId },
          { chat_id: newChat.id, user_id: professionalId }
        ]);

      if (partError) {
        console.error('Failed to add chat participants:', partError);
        // Try to cleanup the created chat
        await this.client.from('chats').delete().eq('id', newChat.id);
        throw new Error('Unable to add participants to chat');
      }

      return { data: { chatId: newChat.id }, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      console.error('Connection error:', error);
      return {
        data: null,
        error: {
          message: errorMessage,
          code: 'CONNECTION_FAILED',
          details: error
        }
      };
    }
  }

  public async getChats(userId: string) {
    const { data, error } = await this.client
      .from('chat_participants')
      .select(`
        chat_id,
        chats:chat_id (
          id,
          updated_at,
          last_message_at,
          chat_participants (
            user_id,
            users:user_id (
              id,
              first_name,
              last_name,
              avatar_url,
              professional_type
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false });

    return { data, error };
  }

  public async getMessages(chatId: string) {
    const { data, error } = await this.client
      .from('messages')
      .select('*, sender:sender_id(first_name, last_name, avatar_url, professional_type)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    return { data, error };
  }

  public async sendMessage(chatId: string, senderId: string, content: string) {
    const { data, error } = await this.client
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: content,
        message_type: 'text'
      })
      .select()
      .single();

    if (!error) {
      await this.client
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);
    }

    return { data, error };
  }

  public subscribeToMessages(chatId: string, callback: (payload: any) => void) {
    if (!chatId) {
      console.error('Chat ID is required for subscription');
      return null;
    }

    const channel = this.client
      .channel(`chat_${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to chat ${chatId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to chat ${chatId}`);
        }
      });

    return channel;
  }

  /**
   * Unsubscribe from a chat channel
   */
  public unsubscribeFromMessages(channel: any) {
    if (channel && typeof channel.unsubscribe === 'function') {
      try {
        channel.unsubscribe();
        console.log('Successfully unsubscribed from chat channel');
      } catch (error) {
        console.error('Error unsubscribing from chat channel:', error);
      }
    }
  }

  // ==================== ASSIGNMENTS ====================

  public async getAssignedWorkouts(clientId: string, limit: number = 30, offset: number = 0) {
    const { data, error } = await this.client
      .from('assigned_workouts')
      .select('*, pt:pt_id(first_name, last_name, avatar_url)')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false }) // Show recent first
      .range(offset, offset + limit - 1);
    return { data, error };
  }

  public async completeWorkout(assignmentId: string, feedback?: string) {
    const { data, error } = await this.client
      .from('assigned_workouts')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        client_feedback: feedback
      })
      .eq('id', assignmentId)
      .select();
    return { data, error };
  }

  public async getAssignedNutritionPlans(clientId: string, limit: number = 30, offset: number = 0) {
    const { data, error } = await this.client
      .from('assigned_nutrition_plans')
      .select('*, dietitian:dietitian_id(first_name, last_name, avatar_url)')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);
    return { data, error };
  }

  public async getAssignedSupplements(clientId: string, limit: number = 30, offset: number = 0) {
    const { data, error } = await this.client
      .from('assigned_supplements')
      .select('*, dietitian:dietitian_id(first_name, last_name, avatar_url), pt:pt_id(first_name, last_name, avatar_url)')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return { data, error };
  }

  // ==================== PRIVACY SETTINGS ====================

  public async getPrivacySettings(userId: string) {
    const { data, error } = await this.client
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data && !error) {
      // Return defaults if none exists
      return {
        data: {
          share_steps_with_pt: false,
          share_workouts_with_pt: true,
          share_weight_with_pt: true,
          share_calories_with_dietitian: true,
          share_macros_with_dietitian: true,
          share_water_with_dietitian: true,
          share_weight_with_dietitian: true
        },
        error: null
      };
    }

    return { data, error };
  }

  public async updatePrivacySettings(userId: string, settings: any) {
    // Whitelist allowed boolean privacy fields to prevent arbitrary column injection
    const allowed = [
      'share_steps_with_pt',
      'share_workouts_with_pt',
      'share_weight_with_pt',
      'share_calories_with_dietitian',
      'share_macros_with_dietitian',
      'share_water_with_dietitian',
      'share_weight_with_dietitian',
      'professional_permissions',
    ];
    const safe: Record<string, any> = {};
    for (const key of allowed) {
      if (settings[key] !== undefined) safe[key] = settings[key];
    }

    // Upsert logic
    const { data: existing } = await this.client
      .from('user_privacy_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let result;
    if (existing) {
      result = await this.client
        .from('user_privacy_settings')
        .update({ ...safe, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    } else {
      result = await this.client
        .from('user_privacy_settings')
        .insert({ user_id: userId, ...safe });
    }

    return result;
  }

  // ==================== AVATAR / STORAGE ====================

  /**
   * Upload a profile avatar image to Supabase Storage.
   * Returns the public URL on success.
   */
  public async uploadAvatar(userId: string, imageUri: string): Promise<{ url: string | null; error: any }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `avatars/${userId}.${ext}`;

      const { error: uploadError } = await this.client.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true,
        });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      const { data: urlData } = this.client.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl
        ? `${urlData.publicUrl}?t=${Date.now()}`
        : null;

      // Update profile with avatar_url
      if (publicUrl) {
        await this.client
          .from('profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }

      return { url: publicUrl, error: null };
    } catch (err) {
      return { url: null, error: err };
    }
  }

  /**
   * Get public URL for an avatar path.
   */
  public getAvatarUrl(path: string): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = this.client.storage.from('avatars').getPublicUrl(path);
    return data?.publicUrl || null;
  }
}
