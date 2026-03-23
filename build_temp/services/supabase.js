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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
require("react-native-url-polyfill/auto");
const react_native_1 = require("react-native");
const supabase_js_1 = require("@supabase/supabase-js");
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const config_1 = require("../config/config");
const validation_1 = require("../utils/validation");
// Supabase auth storage adapter using AsyncStorage to avoid SecureStore 2KB limit crashes
const AsyncStorageAdapter = {
    getItem: (key) => async_storage_1.default.getItem(key),
    setItem: (key, value) => async_storage_1.default.setItem(key, value),
    removeItem: (key) => async_storage_1.default.removeItem(key),
};
class SupabaseService {
    /** Escape special PostgreSQL LIKE/ILIKE wildcard characters to prevent injection */
    escapeLike(value) {
        return value.replace(/[%_\\]/g, '\\$&');
    }
    /** Sanitize SQL input to prevent SQL injection (basic escaping) */
    sanitizeSQL(input) {
        return validation_1.ValidationUtils.sanitizeSQL(input);
    }
    /** Validate input for SQL injection risks */
    validateSQLInjection(input) {
        return validation_1.ValidationUtils.validateSQLInjection(input);
    }
    /** Ensure input is safe for SQL usage; throws error if dangerous */
    ensureSafeInput(input) {
        const validation = this.validateSQLInjection(input);
        if (!validation.isValid) {
            throw new Error(`Potential SQL injection detected: ${validation.errors.join(', ')}`);
        }
    }
    /** Normalize professional type aliases across mixed schemas (`pt` vs `trainer`) */
    professionalTypeCandidates(type) {
        if (!type)
            return [];
        const normalized = type.toLowerCase().trim();
        if (normalized === 'pt' || normalized === 'trainer')
            return ['pt', 'trainer'];
        if (normalized === 'dietitian')
            return ['dietitian'];
        return [normalized];
    }
    constructor() {
        var _a;
        // Single-flight refresh promise
        this.refreshPromise = null;
        // Optional handler to notify when refresh ultimately fails
        this.refreshFailureHandler = null;
        // Avoid persisting Supabase session into web `localStorage` by default.
        // Web clients should use cookie-based sessions (HttpOnly) via a server/proxy.
        const persistSession = react_native_1.Platform.OS !== 'web';
        const authOptions = {
            autoRefreshToken: true,
            detectSessionInUrl: false,
            persistSession: persistSession,
        };
        if (persistSession) {
            authOptions.storage = AsyncStorageAdapter;
        }
        this.client = (0, supabase_js_1.createClient)(config_1.CONFIG.SUPABASE_URL, config_1.CONFIG.SUPABASE_PUBLISHABLE_KEY, {
            auth: authOptions,
        });
        // Install a lightweight global fetch wrapper that intercepts 401 responses
        // for requests to the Supabase REST endpoint and attempts a single-flight
        // refresh. This minimizes duplicate refresh attempts when many requests
        // fail at the same time.
        try {
            const origFetch = (_a = globalThis.fetch) === null || _a === void 0 ? void 0 : _a.bind(globalThis);
            if (origFetch && !origFetch.__supabase_wrapped) {
                const wrapped = (input, init) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const url = typeof input === 'string' ? input : input.url;
                    let resp = yield origFetch(input, init);
                    // Only act on Supabase origin 401 responses
                    if (resp && resp.status === 401 && typeof url === 'string' && url.startsWith(config_1.CONFIG.SUPABASE_URL)) {
                        // Attempt single-flight refresh
                        const refreshed = yield this.performSingleFlightRefresh();
                        if (refreshed) {
                            // Retry original request once
                            try {
                                resp = yield origFetch(input, init);
                            }
                            catch (e) {
                                // ignore retry errors, return original resp if available
                            }
                        }
                        else {
                            // Notify failure handler so upper layers (context) can run deterministic logout
                            try {
                                (_a = this.refreshFailureHandler) === null || _a === void 0 ? void 0 : _a.call(this);
                            }
                            catch (_) { }
                        }
                    }
                    return resp;
                });
                wrapped.__supabase_wrapped = true;
                globalThis.fetch = wrapped;
            }
        }
        catch (e) {
            // best-effort only
        }
    }
    /**
     * Register a callback to be invoked when a refresh fails.
     */
    onRefreshFailure(handler) {
        this.refreshFailureHandler = handler;
    }
    /**
     * Perform a single-flight refresh. Returns true on success, false on failure.
     */
    performSingleFlightRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.refreshPromise)
                return this.refreshPromise;
            this.refreshPromise = (() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // Get current session to extract refresh token
                    const sessionRes = yield this.client.auth.getSession();
                    const session = (_a = sessionRes === null || sessionRes === void 0 ? void 0 : sessionRes.data) === null || _a === void 0 ? void 0 : _a.session;
                    if (!session || !session.refresh_token) {
                        return false;
                    }
                    // Call refreshSession with current refresh token
                    const refreshRes = yield this.client.auth.refreshSession({ refresh_token: session.refresh_token });
                    const ok = !(refreshRes === null || refreshRes === void 0 ? void 0 : refreshRes.error);
                    if (!ok) {
                        return false;
                    }
                    return true;
                }
                catch (err) {
                    return false;
                }
                finally {
                    // clear the promise so future refresh attempts can run
                    this.refreshPromise = null;
                }
            }))();
            return this.refreshPromise;
        });
    }
    static getInstance() {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }
    getClient() {
        return this.client;
    }
    // ==================== AUTH ====================
    sendOTP(email, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield this.client.auth.signInWithOtp({
                email,
                options: {
                    data: userData
                }
            });
            return { data, error };
        });
    }
    /** Resend verification email (signup or email change) without requiring password */
    resendVerification(email_1) {
        return __awaiter(this, arguments, void 0, function* (email, type = 'signup') {
            const { data, error } = yield this.client.auth.resend({
                type,
                email,
            });
            return { data, error };
        });
    }
    verifyOTP(email_1, token_1) {
        return __awaiter(this, arguments, void 0, function* (email, token, type = 'email') {
            const { data, error } = yield this.client.auth.verifyOtp({
                email,
                token,
                type: type,
            });
            return { data, error };
        });
    }
    updatePassword(newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield this.client.auth.updateUser({
                password: newPassword,
            });
            return { data, error };
        });
    }
    signUp(email, password, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield this.client.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });
            return { data, error };
        });
    }
    signInWithEmail(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield this.client.auth.signInWithPassword({
                email,
                password,
            });
            return { data, error };
        });
    }
    signOut() {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.client.auth.signOut();
            return { error };
        });
    }
    getCurrentUser() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: { user }, error } = yield this.client.auth.getUser();
            return { user, error };
        });
    }
    ensureUserRecordForRls(userId, authUser) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { data: existing } = yield this.client
                .from('users')
                .select('id')
                .eq('id', userId)
                .maybeSingle();
            if (existing === null || existing === void 0 ? void 0 : existing.id)
                return;
            const fallbackAuthUser = authUser || ((_a = (yield this.client.auth.getUser()).data) === null || _a === void 0 ? void 0 : _a.user);
            if (!fallbackAuthUser || fallbackAuthUser.id !== userId)
                return;
            const email = fallbackAuthUser.email || '';
            const metadata = fallbackAuthUser.user_metadata || {};
            const username = (typeof metadata.username === 'string' && metadata.username.trim()) ||
                (email.includes('@') ? email.split('@')[0] : `user_${userId.slice(0, 8)}`);
            const firstName = (typeof metadata.first_name === 'string' && metadata.first_name.trim()) ||
                (typeof metadata.given_name === 'string' && metadata.given_name.trim()) ||
                'User';
            const lastName = (typeof metadata.last_name === 'string' && metadata.last_name.trim()) ||
                (typeof metadata.family_name === 'string' && metadata.family_name.trim()) ||
                'Member';
            yield this.client
                .from('users')
                .upsert({
                id: userId,
                email,
                username,
                first_name: firstName,
                last_name: lastName,
                is_email_verified: !!fallbackAuthUser.email_confirmed_at,
            }, { onConflict: 'id' });
        });
    }
    createAiProgram(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: authData } = yield this.client.auth.getUser();
            yield this.ensureUserRecordForRls(input.userId, authData === null || authData === void 0 ? void 0 : authData.user);
            const candidateTypes = Array.from(new Set([input.type, 'workout', 'nutrition', 'supplement', 'water']));
            const basePayload = {
                user_id: input.userId,
                title: input.title,
                content: input.content,
                based_on_photo: input.basedOnPhoto || null,
            };
            let lastError = null;
            for (const currentType of candidateTypes) {
                const { data, error } = yield this.client
                    .from('ai_generated_programs')
                    .insert(Object.assign(Object.assign({}, basePayload), { type: currentType }))
                    .select('id,type,title,created_at')
                    .single();
                if (!error) {
                    return { data, error: null, usedType: currentType };
                }
                lastError = error;
            }
            return { data: null, error: lastError, usedType: null };
        });
    }
    // ==================== USERNAME & EMAIL ====================
    checkUsernameAvailability(username, currentUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const uname = username.toLowerCase().trim();
            if (uname.length < 3)
                return false;
            // Check profiles table (primary)
            let query = this.client
                .from('profiles')
                .select('id')
                .eq('username', uname);
            if (currentUserId) {
                query = query.neq('id', currentUserId);
            }
            const { data: profileData, error: profileError } = yield query.maybeSingle();
            if (profileError)
                return false;
            if (profileData)
                return false;
            // Also check users table (fallback)
            let query2 = this.client
                .from('users')
                .select('id')
                .eq('username', uname);
            if (currentUserId) {
                query2 = query2.neq('id', currentUserId);
            }
            const { data: userData, error: userError } = yield query2.maybeSingle();
            if (userError)
                return true; // users table may not exist, that's ok
            return !userData;
        });
    }
    checkEmailAvailability(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield this.client
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .maybeSingle();
            return !data && !error;
        });
    }
    // ==================== EXERCISES ====================
    getExercises() {
        return __awaiter(this, arguments, void 0, function* (language = 'en', category, muscleGroup, workoutType, page = 0, pageSize = 200) {
            // Select explicit columns to reduce payload and improve performance
            const columns = `id,name,name_tr,description,description_tr,muscle_group,muscle_group_tr,instructions,instructions_tr,tips,tips_tr,category,equipment,is_verified,image_url,video_url,difficulty,calories_per_minute`;
            let query = this.client
                .from('exercises')
                .select(columns)
                .eq('is_verified', true);
            if (category && category !== 'all') {
                // DB categories are: legs, arms, shoulders, back, core, chest
                query = query.eq('category', category);
            }
            // Apply muscle group filtering FIRST (before workout type filtering)
            if (muscleGroup && muscleGroup.trim() !== '') {
                // Sanitize muscle group input
                this.ensureSafeInput(muscleGroup);
                // Use ilike for case-insensitive partial matching on English muscle_group column
                query = query.ilike('muscle_group', `%${this.escapeLike(muscleGroup)}%`);
            }
            // Categorization by workout type - applied AFTER muscle group
            // Strength: exercises that use weights/equipment (bodyweight/none excluded)
            // Calisthenics: bodyweight exercises
            // Cardio: cardio movements
            if (workoutType === 'strength') {
                // Less restrictive: only exclude obvious bodyweight, keep others
                query = query.or('equipment.not.ilike.%bodyweight%,equipment.not.eq.none');
            }
            else if (workoutType === 'calisthenics') {
                query = query.or("equipment.ilike.%body%,equipment.eq.none,equipment.ilike.%bodyweight%");
            }
            else if (workoutType === 'cardio') {
                query = query.or("category.ilike.%cardio%,category.ilike.%kardiyo%,equipment.ilike.%treadmill%,equipment.ilike.%bike%,equipment.ilike.%rope%,equipment.ilike.%elliptical%,equipment.ilike.%rower%,name.ilike.%cardio%,name.ilike.%run%,name.ilike.%jog%,name.ilike.%jump%,name.ilike.%rope%,name.ilike.%cycling%,name.ilike.%bike%,name.ilike.%burpee%,name_tr.ilike.%kardiyo%,name_tr.ilike.%koş%,name_tr.ilike.%ip%,name_tr.ilike.%bisiklet%,name_tr.ilike.%zıpla%");
            }
            // Default pagination: prevent fetching excessively large resultsets
            const limit = Math.max(1, Math.min(1000, pageSize));
            const offset = Math.max(0, page) * limit;
            const { data, error } = yield query.order('name').range(offset, offset + limit - 1);
            const normalize = (rows) => rows.map((item) => (Object.assign(Object.assign({}, item), { name: language === 'tr' ? (item.name_tr || item.name) : item.name, description: language === 'tr' ? (item.description_tr || item.description) : item.description, muscle_group: language === 'tr' ? (item.muscle_group_tr || item.muscle_group) : item.muscle_group, instructions: language === 'tr' ? (item.instructions_tr || item.instructions) : item.instructions, tips: language === 'tr' ? (item.tips_tr || item.tips) : item.tips, image_url: item.image_url || null, muscleGroup: language === 'tr' ? (item.muscle_group_tr || item.muscle_group) : item.muscle_group, secondaryMuscles: item.secondary_muscles || [], isTimed: item.is_timed || false, isDeleted: false, createdAt: item.created_at || new Date().toISOString(), updatedAt: item.updated_at || new Date().toISOString() })));
            if (data && data.length > 0) {
                let rows = data;
                if (workoutType === 'cardio') {
                    const blocked = ['barbell', 'dumbbell', 'kettlebell', 'smith', 'machine', 'bench press', 'deadlift', 'squat rack'];
                    rows = data.filter((item) => {
                        const mixed = `${(item === null || item === void 0 ? void 0 : item.name) || ''} ${(item === null || item === void 0 ? void 0 : item.name_tr) || ''} ${(item === null || item === void 0 ? void 0 : item.equipment) || ''} ${(item === null || item === void 0 ? void 0 : item.category) || ''}`.toLowerCase();
                        return blocked.every((word) => !mixed.includes(word));
                    });
                }
                return { data: normalize(rows), error };
            }
            // If no results, try fallback queries
            if (muscleGroup && (!data || data.length === 0)) {
                try {
                    // 1) Try matching translated muscle_group_tr (for Turkish muscle names)
                    let altQuery = this.client
                        .from('exercises')
                        .select(columns)
                        .eq('is_verified', true);
                    if (category && category !== 'all')
                        altQuery = altQuery.eq('category', category);
                    this.ensureSafeInput(muscleGroup);
                    const { data: altData } = yield altQuery.ilike('muscle_group_tr', `%${this.escapeLike(muscleGroup)}%`).order('name').range(offset, offset + limit - 1);
                    if (altData && altData.length > 0)
                        return { data: normalize(altData), error: null };
                    // 2) Try any muscle group match (broader search)
                    let altQuery2 = this.client
                        .from('exercises')
                        .select(columns)
                        .eq('is_verified', true);
                    if (category && category !== 'all')
                        altQuery2 = altQuery2.eq('category', category);
                    // Search in both muscle_group and muscle_group_tr with broader match
                    const { data: altData2 } = yield altQuery2
                        .or(`muscle_group.ilike.%${this.escapeLike(muscleGroup)}%,muscle_group_tr.ilike.%${this.escapeLike(muscleGroup)}%`)
                        .order('name')
                        .range(offset, offset + limit - 1);
                    if (altData2 && altData2.length > 0)
                        return { data: normalize(altData2), error: null };
                    // 3) Last resort: get all exercises for this category without muscle filter
                    if (category && category !== 'all') {
                        let altQuery3 = this.client
                            .from('exercises')
                            .select(columns)
                            .eq('is_verified', true)
                            .eq('category', category);
                        const { data: altData3 } = yield altQuery3.order('name').range(offset, offset + limit - 1);
                        if (altData3 && altData3.length > 0)
                            return { data: normalize(altData3), error: null };
                    }
                }
                catch (e) {
                    console.warn('Muscle group filter fallback error:', e);
                }
            }
            return { data: [], error };
        });
    }
    searchExercises(searchTerm_1) {
        return __awaiter(this, arguments, void 0, function* (searchTerm, language = 'en', page = 0, pageSize = 50) {
            // Validate input for SQL injection
            this.ensureSafeInput(searchTerm);
            const columns = `id,name,name_tr,description,description_tr,muscle_group,muscle_group_tr,secondary_muscles,is_timed,created_at,updated_at,instructions,instructions_tr,tips,tips_tr,category,equipment,is_verified,image_url,video_url,difficulty`;
            const nameField = language === 'tr' ? 'name_tr' : 'name';
            const limit = Math.max(1, Math.min(500, pageSize));
            const offset = Math.max(0, page) * limit;
            const { data, error } = yield this.client
                .from('exercises')
                .select(columns)
                .eq('is_verified', true)
                .ilike(nameField, `%${this.escapeLike(searchTerm)}%`)
                .order('name')
                .range(offset, offset + limit - 1);
            if (data) {
                const mappedData = data.map(item => (Object.assign(Object.assign({}, item), { name: language === 'tr' ? (item.name_tr || item.name) : item.name, description: language === 'tr' ? (item.description_tr || item.description) : item.description, muscle_group: language === 'tr' ? (item.muscle_group_tr || item.muscle_group) : item.muscle_group, instructions: language === 'tr' ? (item.instructions_tr || item.instructions) : item.instructions, tips: language === 'tr' ? (item.tips_tr || item.tips) : item.tips, muscleGroup: language === 'tr' ? (item.muscle_group_tr || item.muscle_group) : item.muscle_group, secondaryMuscles: item.secondary_muscles || [], isTimed: item.is_timed || false, isDeleted: false, createdAt: item.created_at || new Date().toISOString(), updatedAt: item.updated_at || new Date().toISOString() })));
                return { data: mappedData, error };
            }
            return { data: [], error };
        });
    }
    // ==================== NUTRITION LOGGING ====================
    getTodayNutritionSummary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data, error } = yield this.client
                .from('nutrition_logs')
                .select('calories, protein, carbs, fat')
                .eq('user_id', userId)
                .gte('logged_at', today.toISOString());
            if (data && data.length > 0) {
                const summary = data.reduce((acc, item) => ({
                    calories: acc.calories + (Number(item.calories) || 0),
                    protein: acc.protein + (Number(item.protein) || 0),
                    carbs: acc.carbs + (Number(item.carbs) || 0),
                    fat: acc.fat + (Number(item.fat) || 0),
                }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
                return { data: summary, error: null };
            }
            return { data: { calories: 0, protein: 0, carbs: 0, fat: 0 }, error };
        });
    }
    logNutritionEntry(userId, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield this.client
                .from('nutrition_logs')
                .insert(Object.assign(Object.assign({ user_id: userId }, entry), { logged_at: new Date().toISOString() }))
                .select()
                .single();
            return { data, error };
        });
    }
    // ==================== FOOD ITEMS ====================
    getFoodItems() {
        return __awaiter(this, arguments, void 0, function* (language = 'en', category, search, page = 0, pageSize = 100) {
            // Validate inputs for SQL injection
            if (category) {
                this.ensureSafeInput(category);
            }
            if (search) {
                this.ensureSafeInput(search);
            }
            // Select explicit columns to reduce payload
            // NOTE: DB stores fiber as `fiber_g`, sugar as `sugar_g` and sodium as `sodium_mg` in some schemas
            const columns = `id,name,name_tr,brand,category,category_tr,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,image_url,serving_size,serving_unit,is_verified`;
            let query = this.client
                .from('food_items')
                .select(columns)
                .eq('is_verified', true);
            if (category) {
                if (language === 'tr') {
                    query = query.ilike('category_tr', `%${this.escapeLike(category)}%`);
                }
                else {
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
            let data;
            let error;
            try {
                const res = yield query.order('name').range(offset, offset + limit - 1);
                data = res.data;
                error = res.error;
            }
            catch (e) {
                console.error('getFoodItems query threw an exception:', e);
                // If DB reports missing column (e.g., serving_unit), return empty set but surface the error
                const msg = (e && (e.message || e.toString())) || '';
                if (msg.includes('serving_unit') || (e && (e.code === '42703' || e.code === 42703))) {
                    console.warn('getFoodItems: detected missing serving_unit column in DB schema. Returning empty data set.');
                    return { data: [], error: e };
                }
                return { data: [], error: e };
            }
            if (data) {
                // Normalize variant column names to common keys used by UI
                const normalized = data.map((item) => (Object.assign(Object.assign({}, item), { name: language === 'tr' ? (item.name_tr || item.name) : (item.name), category: language === 'tr' ? (item.category_tr || item.category) : (item.category), fiber: item.fiber !== undefined ? item.fiber : (item.fiber_g !== undefined ? item.fiber_g : null), sugar: item.sugar !== undefined ? item.sugar : (item.sugar_g !== undefined ? item.sugar_g : null), sodium: item.sodium !== undefined ? item.sodium : (item.sodium_mg !== undefined ? item.sodium_mg : null), 
                    // Add missing fields to match FoodItem interface
                    protein: item.protein_g, carbs: item.carbs_g, fat: item.fat_g, servingSize: item.serving_size, createdBy: 'system', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })));
                return { data: normalized, error };
            }
            return { data: [], error };
        });
    }
    searchFoodItems(searchTerm_1) {
        return __awaiter(this, arguments, void 0, function* (searchTerm, language = 'en', page = 0, pageSize = 50) {
            // Validate input for SQL injection
            this.ensureSafeInput(searchTerm);
            const columns = `id,name,name_tr,brand,category,category_tr,calories,protein_g,carbs_g,fat_g,fiber_g,image_url,serving_size,is_verified`;
            const nameField = language === 'tr' ? 'name_tr' : 'name';
            const limit = Math.max(1, Math.min(500, pageSize));
            const offset = Math.max(0, page) * limit;
            const { data, error } = yield this.client
                .from('food_items')
                .select(columns)
                .eq('is_verified', true)
                .ilike(nameField, `%${this.escapeLike(searchTerm)}%`)
                .order('name')
                .range(offset, offset + limit - 1);
            if (data) {
                const normalized = data.map((item) => (Object.assign(Object.assign({}, item), { name: language === 'tr' ? (item.name_tr || item.name) : (item.name), category: language === 'tr' ? (item.category_tr || item.category) : (item.category), fiber: item.fiber !== undefined ? item.fiber : (item.fiber_g !== undefined ? item.fiber_g : null), sugar: item.sugar !== undefined ? item.sugar : (item.sugar_g !== undefined ? item.sugar_g : null), sodium: item.sodium !== undefined ? item.sodium : (item.sodium_mg !== undefined ? item.sodium_mg : null), 
                    // Add missing fields
                    protein: item.protein_g, carbs: item.carbs_g, fat: item.fat_g, servingSize: item.serving_size, serving_unit: 'g', createdBy: 'system', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })));
                return { data: normalized, error };
            }
            return { data: [], error };
        });
    }
    getFoodCategories() {
        return __awaiter(this, arguments, void 0, function* (language = 'en', page = 0, pageSize = 500) {
            // Request only the category column and limit results; dedupe client-side
            const limit = Math.max(1, Math.min(1000, pageSize));
            const offset = Math.max(0, page) * limit;
            const { data, error } = yield this.client
                .from('food_items')
                .select(language === 'tr' ? 'category_tr, category' : 'category')
                .eq('is_verified', true)
                .not('category', 'is', null)
                .order('category')
                .range(offset, offset + limit - 1);
            if (data) {
                if (language === 'tr') {
                    const categories = [...new Set(data.map((item) => (item.category_tr || item.category)).filter(Boolean))];
                    return { data: categories, error: null };
                }
                const categories = [...new Set(data.map((item) => item.category).filter(Boolean))];
                return { data: categories, error: null };
            }
            return { data: [], error };
        });
    }
    // ==================== USER PROFILE ====================
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Try profiles table first (main schema), fall back to users table
            let { data, error } = yield this.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error || !data) {
                // Fallback to users table for older schemas
                const result = yield this.client
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();
                data = result.data;
                error = result.error;
            }
            return { data, error };
        });
    }
    updateUserProfile(userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const fullNameParts = (updates.full_name || '').trim().split(/\s+/).filter(Boolean);
            const normalizedFirstName = updates.first_name || (fullNameParts.length > 0 ? fullNameParts[0] : undefined);
            const normalizedLastName = updates.last_name || (fullNameParts.length > 1 ? fullNameParts.slice(1).join(' ') : undefined);
            const usersUpdates = {
                updated_at: now,
            };
            if (normalizedFirstName !== undefined)
                usersUpdates.first_name = normalizedFirstName;
            if (normalizedLastName !== undefined)
                usersUpdates.last_name = normalizedLastName;
            if (updates.username !== undefined)
                usersUpdates.username = updates.username;
            if (updates.height !== undefined)
                usersUpdates.height = updates.height;
            if (updates.weight !== undefined)
                usersUpdates.weight = updates.weight;
            if (updates.gender !== undefined)
                usersUpdates.gender = updates.gender;
            if (updates.dob !== undefined)
                usersUpdates.date_of_birth = updates.dob || null;
            try {
                const { data, error } = yield this.client
                    .from('users')
                    .update(usersUpdates)
                    .eq('id', userId)
                    .select()
                    .single();
                if (!error) {
                    return { data, error: null };
                }
            }
            catch (_a) {
            }
            const profileUpdates = Object.assign(Object.assign({}, usersUpdates), { dob: updates.dob, full_name: updates.full_name });
            const { data, error } = yield this.client
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId)
                .select()
                .single();
            return { data, error };
        });
    }
    // ==================== SOFT DELETE ====================
    softDeleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.client
                .from('users')
                .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
                .eq('id', userId);
            return { error };
        });
    }
    // ==================== PROFESSIONALS (CITY FILTER) ====================
    getProfessionalsByCity(city, district, type, country) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate inputs for SQL injection
            if (city)
                this.ensureSafeInput(city);
            if (district)
                this.ensureSafeInput(district);
            if (type)
                this.ensureSafeInput(type);
            if (country)
                this.ensureSafeInput(country);
            let query = this.client
                .from('professional_profiles')
                .select('*, users(*)')
                .eq('is_active', true);
            const typeCandidates = this.professionalTypeCandidates(type);
            if (typeCandidates.length === 1) {
                query = query.eq('professional_type', typeCandidates[0]);
            }
            else if (typeCandidates.length > 1) {
                query = query.in('professional_type', typeCandidates);
            }
            if (city)
                query = query.ilike('city', `%${this.escapeLike(city)}%`);
            if (district)
                query = query.ilike('district', `%${this.escapeLike(district)}%`);
            if (country)
                query = query.ilike('country', `%${this.escapeLike(country)}%`);
            const { data, error } = yield query.order('average_rating', { ascending: false });
            return { data, error };
        });
    }
    // ==================== SUPPLEMENTS ====================
    getSupplements(category) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = this.client
                .from('supplements')
                .select('*')
                .eq('is_verified', true);
            if (category) {
                query = query.eq('category', category);
            }
            const { data, error } = yield query.order('name');
            return { data, error };
        });
    }
    // ==================== VITAMINS ====================
    getVitamins(type) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = this.client
                .from('vitamins')
                .select('*')
                .eq('is_verified', true);
            if (type) {
                query = query.eq('type', type);
            }
            const { data, error } = yield query.order('name');
            return { data, error };
        });
    }
    // ==================== MINERALS ====================
    getMinerals(type) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = this.client
                .from('minerals')
                .select('*')
                .eq('is_verified', true);
            if (type) {
                query = query.eq('type', type);
            }
            const { data, error } = yield query.order('name');
            return { data, error };
        });
    }
    // ==================== PROFESSIONALS ====================
    getProfessionals(type) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate input for SQL injection
            if (type)
                this.ensureSafeInput(type);
            let query = this.client
                .from('professional_profiles')
                .select('*, users(*)')
                .eq('is_active', true);
            const typeCandidates = this.professionalTypeCandidates(type);
            if (typeCandidates.length === 1) {
                query = query.eq('professional_type', typeCandidates[0]);
            }
            else if (typeCandidates.length > 1) {
                query = query.in('professional_type', typeCandidates);
            }
            const { data, error } = yield query.order('average_rating', { ascending: false });
            return { data, error };
        });
    }
    // ==================== FOOD SCAN LOGGING ====================
    logFoodScan(userId, scanData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Whitelist allowed fields to prevent arbitrary column injection
            const allowed = ['barcode', 'food_name', 'brand', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'image_url', 'serving_size', 'serving_unit'];
            const safe = {};
            for (const key of allowed) {
                if (scanData[key] !== undefined)
                    safe[key] = scanData[key];
            }
            const { data, error } = yield this.client
                .from('food_scans')
                .insert(Object.assign(Object.assign({ user_id: userId }, safe), { scanned_at: new Date().toISOString() }))
                .select()
                .single();
            return { data, error };
        });
    }
    getTodaysScanCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count, error } = yield this.client
                .from('food_scans')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('scanned_at', today.toISOString());
            return count || 0;
        });
    }
    // ==================== CHAT & CONNECTIONS ====================
    connectWithProfessional(clientId, professionalUserId, professionalProfileId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate inputs
                if (!clientId || !professionalUserId) {
                    throw new Error('Client ID and Professional User ID are required');
                }
                // 1. Find direct chats where user A is a participant
                const { data: userChats, error: errA } = yield this.client
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
                    const { data: commonChats, error: errB } = yield this.client
                        .from('chat_participants')
                        .select('chat_id')
                        .in('chat_id', chatIds)
                        .eq('user_id', professionalUserId);
                    if (errB) {
                        console.error('Failed to check common chats:', errB);
                        throw new Error('Unable to verify chat existence');
                    }
                    if (commonChats && commonChats.length > 0) {
                        existingChatId = commonChats[0].chat_id;
                    }
                }
                // Also ensure client_relationship exists
                if (professionalProfileId) {
                    try {
                        // Check if relationship exists
                        const { data: relData } = yield this.client
                            .from('client_relationships')
                            .select('id')
                            .eq('client_id', clientId)
                            .eq('professional_id', professionalProfileId)
                            .single();
                        if (!relData) {
                            // Create new relationship
                            yield this.client
                                .from('client_relationships')
                                .insert({
                                client_id: clientId,
                                professional_id: professionalProfileId,
                                status: 'active', // Auto-activate for now as per user request flow
                                billing_status: 'free', // Default to free/inquiry
                                created_at: new Date().toISOString()
                            });
                        }
                    }
                    catch (relErr) {
                        console.error('Error managing client relationship:', relErr);
                        // Don't block chat creation if relationship fails
                    }
                }
                else {
                    // Try to find profile ID from user ID if not provided
                    try {
                        const { data: profData } = yield this.client
                            .from('professional_profiles')
                            .select('id')
                            .eq('user_id', professionalUserId)
                            .single();
                        if (profData) {
                            // Check if relationship exists
                            const { data: relData } = yield this.client
                                .from('client_relationships')
                                .select('id')
                                .or(`professional_id.eq.${profData.id},trainer_id.eq.${profData.id},dietitian_id.eq.${profData.id}`)
                                .eq('client_id', clientId)
                                .single();
                            if (!relData) {
                                yield this.client
                                    .from('client_relationships')
                                    .insert({
                                    client_id: clientId,
                                    professional_id: profData.id,
                                    status: 'active',
                                    billing_status: 'free',
                                    created_at: new Date().toISOString()
                                });
                            }
                        }
                    }
                    catch (e) {
                        console.error('Error finding professional profile for relationship:', e);
                    }
                }
                if (existingChatId) {
                    return { data: { chatId: existingChatId }, error: null };
                }
                // 3. Create new chat
                const { data: newChat, error: createError } = yield this.client
                    .from('chats')
                    .insert({ type: 'direct' })
                    .select()
                    .single();
                if (createError) {
                    console.error('Failed to create new chat:', createError);
                    throw new Error('Unable to create chat connection');
                }
                // 4. Add participants
                const { error: partError } = yield this.client
                    .from('chat_participants')
                    .insert([
                    { chat_id: newChat.id, user_id: clientId },
                    { chat_id: newChat.id, user_id: professionalUserId }
                ]);
                if (partError) {
                    console.error('Failed to add chat participants:', partError);
                    // Try to cleanup the created chat
                    yield this.client.from('chats').delete().eq('id', newChat.id);
                    throw new Error('Unable to add participants to chat');
                }
                return { data: { chatId: newChat.id }, error: null };
            }
            catch (error) {
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
        });
    }
    getChats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield this.client
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
                if (!error)
                    return { data, error };
                // If relational select fails (schema cache / missing FK), fall back to manual assembly
                console.warn('getChats: relational select failed, falling back to manual aggregation', error);
            }
            catch (e) {
                // proceed to fallback
            }
            try {
                // 1) get chat ids for this user
                const { data: myParts, error: myPartsErr } = yield this.client
                    .from('chat_participants')
                    .select('chat_id')
                    .eq('user_id', userId);
                if (myPartsErr || !myParts)
                    return { data: null, error: myPartsErr || new Error('No chat parts') };
                const chatIds = Array.from(new Set(myParts.map((p) => p.chat_id)));
                if (chatIds.length === 0)
                    return { data: [], error: null };
                // 2) fetch related participants for these chats
                const { data: participants, error: partsErr } = yield this.client
                    .from('chat_participants')
                    .select('chat_id,user_id')
                    .in('chat_id', chatIds);
                if (partsErr || !participants)
                    return { data: null, error: partsErr };
                // 3) fetch chat metadata
                const { data: chatsMeta, error: chatsErr } = yield this.client
                    .from('chats')
                    .select('id,updated_at,last_message_at')
                    .in('id', chatIds);
                if (chatsErr || !chatsMeta)
                    return { data: null, error: chatsErr };
                const chatMetaById = chatsMeta.reduce((acc, chat) => {
                    acc[chat.id] = chat;
                    return acc;
                }, {});
                // 4) determine other participant ids per chat
                const otherIdsPerChat = {};
                participants.forEach((p) => {
                    otherIdsPerChat[p.chat_id] = otherIdsPerChat[p.chat_id] || [];
                    otherIdsPerChat[p.chat_id].push(p.user_id);
                });
                // 5) for each chat pick other participant id(s) excluding current user
                const otherUserIds = new Set();
                const chatToOtherId = {};
                for (const cid of chatIds) {
                    const ids = (otherIdsPerChat[cid] || []).filter((id) => id !== userId);
                    const pick = ids.length > 0 ? ids[0] : null;
                    if (pick)
                        otherUserIds.add(pick);
                    chatToOtherId[cid] = pick;
                }
                // 6) batch fetch users
                const otherIdsArr = Array.from(otherUserIds);
                let usersById = {};
                if (otherIdsArr.length > 0) {
                    const { data: usersData } = yield this.client.from('users').select('id,first_name,last_name,avatar_url,professional_type').in('id', otherIdsArr);
                    if (usersData) {
                        usersById = usersData.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
                    }
                }
                // 7) assemble final structure similar to original shape
                const assembled = chatIds.map((cid) => {
                    const meta = chatMetaById[cid] || {};
                    const otherId = chatToOtherId[cid];
                    const otherUser = otherId ? usersById[otherId] : null;
                    return {
                        chat_id: cid,
                        chats: {
                            id: meta.id,
                            updated_at: meta.updated_at,
                            last_message_at: meta.last_message_at,
                            chat_participants: otherId ? [{ user_id: otherId, users: otherUser }] : [],
                        }
                    };
                });
                return { data: assembled, error: null };
            }
            catch (err) {
                console.error('getChats fallback error:', err);
                return { data: null, error: err };
            }
        });
    }
    getMessages(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield this.client
                .from('messages')
                .select('*, sender:sender_id(first_name, last_name, avatar_url, professional_type)')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });
            return { data, error };
        });
    }
    sendMessage(chatId, senderId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield this.client
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
                yield this.client
                    .from('chats')
                    .update({ last_message_at: new Date().toISOString() })
                    .eq('id', chatId);
            }
            return { data, error };
        });
    }
    subscribeToMessages(chatId, callback) {
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
            }
            catch (error) {
                console.error('Error in subscription callback:', error);
            }
        })
            .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Successfully subscribed to chat ${chatId}`);
            }
            else if (status === 'CHANNEL_ERROR') {
                console.error(`Failed to subscribe to chat ${chatId}`);
            }
        });
        return channel;
    }
    /**
     * Unsubscribe from a chat channel
     */
    unsubscribeFromMessages(channel) {
        if (channel && typeof channel.unsubscribe === 'function') {
            try {
                channel.unsubscribe();
                console.log('Successfully unsubscribed from chat channel');
            }
            catch (error) {
                console.error('Error unsubscribing from chat channel:', error);
            }
        }
    }
    // ==================== ASSIGNMENTS ====================
    getAssignedWorkouts(clientId_1) {
        return __awaiter(this, arguments, void 0, function* (clientId, limit = 30, offset = 0) {
            const { data, error } = yield this.client
                .from('assigned_workouts')
                .select('*, pt:pt_id(first_name, last_name, avatar_url)')
                .eq('client_id', clientId)
                .order('scheduled_date', { ascending: false }) // Show recent first
                .range(offset, offset + limit - 1);
            return { data, error };
        });
    }
    completeWorkout(assignmentId, feedback) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { data, error } = yield this.client
                .from('assigned_workouts')
                .update({
                is_completed: true,
                completed_at: new Date().toISOString(),
                client_feedback: feedback
            })
                .eq('id', assignmentId)
                .select('*, client:client_id(first_name, last_name, username)')
                .single();
            if (data && data.pt_id) {
                // Notify the PT that the client completed the workout
                try {
                    const clientName = ((_a = data.client) === null || _a === void 0 ? void 0 : _a.first_name)
                        ? `${data.client.first_name} ${data.client.last_name || ''}`.trim()
                        : (((_b = data.client) === null || _b === void 0 ? void 0 : _b.username) || 'Your client');
                    yield this.client.from('notifications').insert({
                        user_id: data.pt_id,
                        type: 'workout_completed',
                        title: 'Workout Completed',
                        message: `${clientName} has completed the assigned workout: ${data.title || 'Workout'}.`,
                        data: {
                            assignment_id: assignmentId,
                            client_id: data.client_id
                        },
                        is_read: false
                    });
                }
                catch (e) {
                    console.error('Failed to notify PT about completed workout', e);
                }
            }
            return { data, error };
        });
    }
    getAssignedNutritionPlans(clientId_1) {
        return __awaiter(this, arguments, void 0, function* (clientId, limit = 30, offset = 0) {
            const { data, error } = yield this.client
                .from('assigned_nutrition_plans')
                .select('*, dietitian:dietitian_id(first_name, last_name, avatar_url)')
                .eq('client_id', clientId)
                .eq('is_active', true)
                .order('start_date', { ascending: false })
                .range(offset, offset + limit - 1);
            return { data, error };
        });
    }
    getAssignedSupplements(clientId_1) {
        return __awaiter(this, arguments, void 0, function* (clientId, limit = 30, offset = 0) {
            const { data, error } = yield this.client
                .from('assigned_supplements')
                .select('*, dietitian:dietitian_id(first_name, last_name, avatar_url), pt:pt_id(first_name, last_name, avatar_url)')
                .eq('client_id', clientId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            return { data, error };
        });
    }
    // ==================== PRIVACY SETTINGS ====================
    getPrivacySettings(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield this.client
                    .from('user_privacy_settings')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();
                if (error) {
                    // Silently return defaults on error (table may not exist)
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
                if (!data) {
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
                return { data, error: null };
            }
            catch (err) {
                // Return defaults on any error
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
        });
    }
    updatePrivacySettings(userId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const safe = {};
            for (const key of allowed) {
                if (settings[key] !== undefined)
                    safe[key] = settings[key];
            }
            // Upsert logic
            const result = yield this.client
                .from('user_privacy_settings')
                .upsert(Object.assign(Object.assign({ user_id: userId }, safe), { updated_at: new Date().toISOString() }), { onConflict: 'user_id' });
            return result;
        });
    }
    // ==================== AVATAR / STORAGE ====================
    /**
     * Upload a profile avatar image to Supabase Storage.
     * Returns the public URL on success.
     */
    uploadAvatar(userId, imageUri) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield fetch(imageUri);
                const blob = yield response.blob();
                const ext = ((_a = imageUri.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'jpg';
                const filePath = `avatars/${userId}.${ext}`;
                const { error: uploadError } = yield this.client.storage
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
                const publicUrl = (urlData === null || urlData === void 0 ? void 0 : urlData.publicUrl)
                    ? `${urlData.publicUrl}?t=${Date.now()}`
                    : null;
                // Update profile with avatar_url
                if (publicUrl) {
                    yield this.client
                        .from('users')
                        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
                        .eq('id', userId);
                }
                return { url: publicUrl, error: null };
            }
            catch (err) {
                return { url: null, error: err };
            }
        });
    }
    /**
     * Get public URL for an avatar path.
     */
    getAvatarUrl(path) {
        if (!path)
            return null;
        if (path.startsWith('http'))
            return path;
        const { data } = this.client.storage.from('avatars').getPublicUrl(path);
        return (data === null || data === void 0 ? void 0 : data.publicUrl) || null;
    }
}
exports.SupabaseService = SupabaseService;
