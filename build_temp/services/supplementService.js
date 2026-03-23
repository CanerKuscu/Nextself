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
exports.SupplementService = void 0;
const supabase_1 = require("./supabase");
class SupplementService {
    constructor() {
        this.supabase = supabase_1.SupabaseService.getInstance().getClient();
    }
    static getInstance() {
        if (!SupplementService.instance) {
            SupplementService.instance = new SupplementService();
        }
        return SupplementService.instance;
    }
    // Get all supplements with language support
    getSupplements() {
        return __awaiter(this, arguments, void 0, function* (language = 'en', category, search, page = 1, limit = 50) {
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
                    }
                    else {
                        query = query.or(`name_en.ilike.%${safe}%`);
                    }
                }
                const from = (page - 1) * limit;
                const to = from + limit - 1;
                const { data, count, error } = yield query
                    .order(language === 'tr' ? 'name_tr' : 'name_en', { ascending: true })
                    .range(from, to);
                if (error)
                    throw error;
                const formattedData = (data || []).map((item) => this.mapDbToSupplement(item, language));
                return { data: formattedData, count: count || 0 };
            }
            catch (error) {
                console.error('Error getting supplements:', error);
                return { data: [], count: 0 };
            }
        });
    }
    // Get supplement by ID
    getSupplementById(supplementId_1) {
        return __awaiter(this, arguments, void 0, function* (supplementId, language = 'en') {
            try {
                const { data, error } = yield this.supabase
                    .from('supplements')
                    .select('*')
                    .eq('id', supplementId)
                    .single();
                if (error)
                    throw error;
                if (!data)
                    return null;
                return this.mapDbToSupplement(data, language);
            }
            catch (error) {
                console.error('Error getting supplement by ID:', error);
                return null;
            }
        });
    }
    // Helper to map DB row to Supplement interface
    mapDbToSupplement(item, language) {
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
    getSupplementLogs(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, language = 'en', date, page = 1, limit = 50) {
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
                const { data, count, error } = yield query.range(from, to);
                if (error)
                    throw error;
                const formattedData = (data || []).map((item) => {
                    var _a, _b, _c;
                    return ({
                        id: item.id,
                        userId: item.user_id,
                        supplementId: item.supplement_id,
                        quantity: item.quantity,
                        unit: item.unit,
                        takenAt: item.taken_at,
                        notes: item.notes,
                        createdAt: item.created_at,
                        supplementName: language === 'tr' ? (_a = item.supplement) === null || _a === void 0 ? void 0 : _a.name_tr : (_b = item.supplement) === null || _b === void 0 ? void 0 : _b.name_en,
                        supplementCategory: (_c = item.supplement) === null || _c === void 0 ? void 0 : _c.category,
                    });
                });
                return { data: formattedData, count: count || 0 };
            }
            catch (error) {
                console.error('Error getting supplement logs:', error);
                return { data: [], count: 0 };
            }
        });
    }
    // Add supplement log
    addSupplementLog(log) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield this.supabase
                    .from('user_supplement_logs')
                    .insert({
                    user_id: log.userId,
                    supplement_id: log.supplementId,
                    quantity: log.quantity,
                    unit: log.unit,
                    taken_at: log.takenAt,
                    notes: log.notes
                });
                if (error)
                    throw error;
                return { success: true };
            }
            catch (error) {
                console.error('Error adding supplement log:', error);
                return { success: false, error };
            }
        });
    }
    // Delete supplement log
    deleteSupplementLog(logId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield this.supabase
                    .from('user_supplement_logs')
                    .delete()
                    .eq('id', logId);
                if (error)
                    throw error;
                return { success: true };
            }
            catch (error) {
                console.error('Error deleting supplement log:', error);
                return { success: false, error };
            }
        });
    }
    // Get user's supplement routine
    getUserRoutine(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield this.supabase
                    .from('user_supplement_routines')
                    .select('*, supplement:supplements(name_en, name_tr, category, dosage_amount, dosage_unit)')
                    .eq('user_id', userId)
                    .eq('is_active', true);
                if (error)
                    throw error;
                return { data };
            }
            catch (error) {
                console.error('Error getting user routine:', error);
                return { data: [], error };
            }
        });
    }
    // Add supplement to routine
    addToRoutine(userId, supplementId, reminderTime) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield this.supabase
                    .from('user_supplement_routines')
                    .upsert({
                    user_id: userId,
                    supplement_id: supplementId,
                    reminder_time: reminderTime,
                    is_active: true,
                    updated_at: new Date()
                }, { onConflict: 'user_id,supplement_id' });
                if (error)
                    throw error;
                return { success: true };
            }
            catch (error) {
                console.error('Error adding to routine:', error);
                return { success: false, error };
            }
        });
    }
    // Remove supplement from routine (set is_active to false)
    removeFromRoutine(userId, supplementId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield this.supabase
                    .from('user_supplement_routines')
                    .update({ is_active: false, updated_at: new Date() })
                    .eq('user_id', userId)
                    .eq('supplement_id', supplementId);
                if (error)
                    throw error;
                return { success: true };
            }
            catch (error) {
                console.error('Error removing from routine:', error);
                return { success: false, error };
            }
        });
    }
}
exports.SupplementService = SupplementService;
