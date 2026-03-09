import { SupabaseService } from './supabase';

export interface StoreItem {
    id: string;
    name: string;
    name_tr: string;
    description: string;
    description_tr: string;
    category: 'booster' | 'cosmetic' | 'utility' | 'equipment' | 'nutrition' | 'recovery' | 'seasonal' | 'premium';
    icon: string;
    price_points: number;
    price_real?: number;
    effect_type: string;
    effect_duration_minutes?: number;
    max_stack: number;
    is_consumable: boolean;
    is_active: boolean;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    badge_text?: string;
    badge_color?: string;
}

export interface UserInventoryItem {
    id: string;
    item_id: string;
    quantity: number;
    is_active: boolean;
    activated_at?: string;
    expires_at?: string;
    item: StoreItem;
}

export interface UserCurrency {
    points: number;
    gems: number;
    total_earned_points: number;
    total_spent_points: number;
}

export class StoreService {
    private static instance: StoreService;

    private constructor() { }

    public static getInstance(): StoreService {
        if (!StoreService.instance) {
            StoreService.instance = new StoreService();
        }
        return StoreService.instance;
    }

    // Get all available store items
    public async getStoreItems(): Promise<StoreItem[]> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data, error } = await supabase
                .from('store_items')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('Store items fetch error:', err);
            // Return default items as fallback
            return this.getDefaultItems();
        }
    }

    // Get user's currency balance
    public async getUserCurrency(): Promise<UserCurrency> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_currency')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !data) {
                // Initialize currency
                const { data: newCurrency } = await supabase
                    .from('user_currency')
                    .upsert({
                        user_id: user.id,
                        points: 100, // Starting bonus
                        gems: 0,
                        total_earned_points: 100,
                        total_spent_points: 0,
                    }, { onConflict: 'user_id' })
                    .select()
                    .single();

                return newCurrency || { points: 100, gems: 0, total_earned_points: 100, total_spent_points: 0 };
            }

            return data;
        } catch (err) {
            console.warn('Currency fetch error:', err);
            return { points: 0, gems: 0, total_earned_points: 0, total_spent_points: 0 };
        }
    }

    // Get user's inventory
    public async getUserInventory(): Promise<UserInventoryItem[]> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_inventory')
                .select('*, store_items:item_id(*)')
                .eq('user_id', user.id)
                .gt('quantity', 0);

            if (error) throw error;

            return (data || []).map((item: any) => ({
                id: item.id,
                item_id: item.item_id,
                quantity: item.quantity,
                is_active: item.is_active,
                activated_at: item.activated_at,
                expires_at: item.expires_at,
                item: item.store_items,
            }));
        } catch (err) {
            console.warn('Inventory fetch error:', err);
            return [];
        }
    }

    // Purchase an item
    // Uses optimistic concurrency control to prevent double-spend race conditions.
    // The currency deduction includes the current balance in the WHERE clause so
    // concurrent purchases can't both succeed with stale balance data.
    public async purchaseItem(itemId: string): Promise<{ success: boolean; message: string }> {
        const MAX_RETRIES = 3;
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            // Get item details
            const { data: item } = await supabase
                .from('store_items')
                .select('*')
                .eq('id', itemId)
                .single();

            if (!item) return { success: false, message: 'Item not found' };

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                // Read fresh currency each attempt
                const currency = await this.getUserCurrency();
                if (currency.points < item.price_points) {
                    return { success: false, message: 'insufficient_points' };
                }

                // Check max stack
                const { data: existingInventory } = await supabase
                    .from('user_inventory')
                    .select('quantity')
                    .eq('user_id', user.id)
                    .eq('item_id', itemId)
                    .single();

                if (existingInventory && existingInventory.quantity >= item.max_stack) {
                    return { success: false, message: 'max_stack_reached' };
                }

                // Deduct points with optimistic lock:
                // Only succeeds if points haven't changed since we read them.
                // This prevents double-spend from concurrent purchase requests.
                const { data: deductResult } = await supabase
                    .from('user_currency')
                    .update({
                        points: currency.points - item.price_points,
                        total_spent_points: currency.total_spent_points + item.price_points,
                    })
                    .eq('user_id', user.id)
                    .eq('points', currency.points)
                    .select();

                if (!deductResult || deductResult.length === 0) {
                    // Conflict: balance changed between read and write (concurrent purchase).
                    console.warn(`Purchase currency deduction conflict (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
                    continue;
                }

                // Currency deducted successfully — proceed with inventory + logging.
                // Add to inventory
                if (existingInventory) {
                    await supabase
                        .from('user_inventory')
                        .update({ quantity: existingInventory.quantity + 1 })
                        .eq('user_id', user.id)
                        .eq('item_id', itemId);
                } else {
                    await supabase
                        .from('user_inventory')
                        .insert({
                            user_id: user.id,
                            item_id: itemId,
                            quantity: 1,
                            is_active: false,
                        });
                }

                // Log purchase
                await supabase
                    .from('purchase_history')
                    .insert({
                        user_id: user.id,
                        item_id: itemId,
                        quantity: 1,
                        price_paid: item.price_points,
                    });

                return { success: true, message: 'purchase_success' };
            }

            // All retries exhausted — likely heavy contention
            console.warn('Purchase failed after max retries due to concurrent modifications');
            return { success: false, message: 'purchase_failed' };
        } catch (err) {
            console.warn('Purchase error:', err);
            return { success: false, message: 'purchase_failed' };
        }
    }

    // Activate a booster item
    public async activateItem(itemId: string): Promise<{ success: boolean; message: string }> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            // Get inventory item
            const { data: invItem } = await supabase
                .from('user_inventory')
                .select('*, store_items:item_id(*)')
                .eq('user_id', user.id)
                .eq('item_id', itemId)
                .gt('quantity', 0)
                .single();

            if (!invItem) return { success: false, message: 'Item not in inventory' };

            const storeItem = invItem.store_items as any;

            if (storeItem.is_consumable) {
                // Calculate expiry
                const now = new Date();
                const expiresAt = storeItem.effect_duration_minutes
                    ? new Date(now.getTime() + storeItem.effect_duration_minutes * 60 * 1000)
                    : null;

                await supabase
                    .from('user_inventory')
                    .update({
                        quantity: invItem.quantity - 1,
                        is_active: true,
                        activated_at: now.toISOString(),
                        expires_at: expiresAt?.toISOString() || null,
                    })
                    .eq('id', invItem.id);
            } else {
                // Non-consumable (cosmetic) - just toggle active
                await supabase
                    .from('user_inventory')
                    .update({ is_active: !invItem.is_active })
                    .eq('id', invItem.id);
            }

            return { success: true, message: 'activated' };
        } catch (err) {
            console.warn('Activate error:', err);
            return { success: false, message: 'activation_failed' };
        }
    }

    // Use streak freeze
    public async useStreakFreeze(): Promise<boolean> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data: freezeItem } = await supabase
                .from('user_inventory')
                .select('*, store_items:item_id!inner(*)')
                .eq('user_id', user.id)
                .eq('store_items.effect_type', 'streak_freeze')
                .gt('quantity', 0)
                .single();

            if (!freezeItem) return false;

            await supabase
                .from('user_inventory')
                .update({ quantity: freezeItem.quantity - 1 })
                .eq('id', freezeItem.id);

            return true;
        } catch (err) {
            console.warn('Streak freeze error:', err);
            return false;
        }
    }

    // Default items fallback
    private getDefaultItems(): StoreItem[] {
        return [
            // ── Utility ──
            { id: 'streak-freeze', name: 'Streak Freeze', name_tr: 'Seri Dondurucu', description: 'Protects your streak for 1 missed day', description_tr: '1 gün kaçırırsan serin bozulmaz', category: 'utility', icon: 'snow', price_points: 200, effect_type: 'streak_freeze', max_stack: 3, is_consumable: true, is_active: true, rarity: 'common' },
            { id: 'extra-life', name: 'Extra Life', name_tr: 'Ekstra Can', description: 'Get an extra life for your daily challenge', description_tr: 'Günlük görev için ekstra can', category: 'utility', icon: 'heart', price_points: 100, effect_type: 'extra_life', max_stack: 5, is_consumable: true, is_active: true, rarity: 'common' },
            { id: 'mystery-box', name: 'Mystery Box', name_tr: 'Gizemli Kutu', description: 'Contains a random rare item or huge point boost', description_tr: 'Rastgele nadir eşya veya yüksek puan içerir', category: 'utility', icon: 'gift', price_points: 500, effect_type: 'mystery_reward', max_stack: 10, is_consumable: true, is_active: true, rarity: 'rare', badge_text: 'HOT', badge_color: '#FF4500' },

            // ── Boosters ──
            { id: 'double-xp', name: 'Double XP Potion', name_tr: '2x XP İksiri', description: 'Earn double XP for 15 minutes', description_tr: '15 dakika boyunca çifte XP kazan', category: 'booster', icon: 'flash', price_points: 150, effect_type: 'double_xp', effect_duration_minutes: 15, max_stack: 5, is_consumable: true, is_active: true, rarity: 'common' },
            { id: 'xp-shield', name: 'XP Shield', name_tr: 'XP Kalkanı', description: 'Prevent XP loss for 24 hours', description_tr: '24 saat XP kaybını önle', category: 'booster', icon: 'shield', price_points: 250, effect_type: 'xp_shield', effect_duration_minutes: 1440, max_stack: 3, is_consumable: true, is_active: true, rarity: 'uncommon' },
            { id: 'workout-boost', name: 'Workout Boost', name_tr: 'Antrenman Güçlendirici', description: 'Get 50% more XP from workouts for 1 hour', description_tr: '1 saat boyunca antrenmanlardan %50 fazla XP', category: 'booster', icon: 'barbell', price_points: 175, effect_type: 'workout_boost', effect_duration_minutes: 60, max_stack: 3, is_consumable: true, is_active: true, rarity: 'common' },
            { id: 'nutrition-boost', name: 'Nutrition Multiplier', name_tr: 'Beslenme Çarpanı', description: 'Get 50% more XP from nutrition logs for 1 hour', description_tr: '1 saat beslenme kayıtlarından %50 fazla XP', category: 'booster', icon: 'nutrition', price_points: 175, effect_type: 'nutrition_boost', effect_duration_minutes: 60, max_stack: 3, is_consumable: true, is_active: true, rarity: 'common' },
            { id: 'triple-xp-weekend', name: 'Triple XP Weekend', name_tr: '3x XP Hafta Sonu', description: 'Earn triple XP for the entire weekend', description_tr: 'Tüm hafta sonu 3 kat XP kazan', category: 'booster', icon: 'rocket', price_points: 400, effect_type: 'triple_xp', effect_duration_minutes: 4320, max_stack: 2, is_consumable: true, is_active: true, rarity: 'rare', badge_text: 'HOT', badge_color: '#FF4500' },
            { id: 'social-boost', name: 'Social Boost', name_tr: 'Sosyal Güçlendirici', description: 'Double XP from social activities for 24 hours', description_tr: '24 saat sosyal aktivitelerden çift XP', category: 'booster', icon: 'people', price_points: 200, effect_type: 'social_boost', effect_duration_minutes: 1440, max_stack: 3, is_consumable: true, is_active: true, rarity: 'uncommon' },
            { id: 'mission-multiplier', name: 'Mission Multiplier', name_tr: 'Görev Çarpanı', description: 'Double rewards from daily & weekly missions', description_tr: 'Günlük ve haftalık görevlerden çift ödül', category: 'booster', icon: 'compass', price_points: 300, effect_type: 'mission_multiply', effect_duration_minutes: 1440, max_stack: 3, is_consumable: true, is_active: true, rarity: 'uncommon' },
            { id: 'focus-mode', name: 'Focus Mode Activator', name_tr: 'Odak Modu', description: 'Block distractions + bonus XP for focused sessions', description_tr: 'Dikkat dağıtıcıları engelle + odak bonusu', category: 'booster', icon: 'eye', price_points: 150, effect_type: 'focus_boost', effect_duration_minutes: 60, max_stack: 5, is_consumable: true, is_active: true, rarity: 'common' },
            { id: 'lucky-charm', name: 'Lucky Charm', name_tr: 'Şans Tılsımı', description: 'Chance to earn 2-5x XP on any activity', description_tr: 'Her aktivitede 2-5x XP kazanma şansı', category: 'booster', icon: 'dice', price_points: 250, effect_type: 'lucky_multiplier', effect_duration_minutes: 120, max_stack: 3, is_consumable: true, is_active: true, rarity: 'rare' },

            // ── Cosmetics ──
            { id: 'premium-frame', name: 'Premium Avatar Frame', name_tr: 'Premium Çerçeve', description: 'An exclusive frame for your profile picture', description_tr: 'Profil fotoğrafın için özel çerçeve', category: 'cosmetic', icon: 'ribbon', price_points: 500, effect_type: 'avatar_frame', max_stack: 1, is_consumable: false, is_active: true, rarity: 'rare' },
            { id: 'gold-badge', name: 'Gold Badge', name_tr: 'Altın Rozet', description: 'Show off your dedication with a gold profile badge', description_tr: 'Profilinde altın rozet ile adanmışlığını göster', category: 'cosmetic', icon: 'medal', price_points: 300, effect_type: 'profile_badge', max_stack: 1, is_consumable: false, is_active: true, rarity: 'uncommon' },
            { id: 'premium-diet-theme', name: 'Premium Diet Theme', name_tr: 'Premium Diyet Teması', description: 'Unlock an elegant dark theme for your diet plans', description_tr: 'Diyet programların için şık karanlık temayı aç', category: 'cosmetic', icon: 'color-palette', price_points: 800, effect_type: 'app_theme', max_stack: 1, is_consumable: false, is_active: true, rarity: 'epic' },
            { id: 'neon-avatar-effect', name: 'Neon Avatar Effect', name_tr: 'Neon Profil Efekti', description: 'Make your avatar glow in the leaderboards', description_tr: 'Liderlik tablosunda profilin parlasın', category: 'cosmetic', icon: 'sparkles', price_points: 1200, effect_type: 'avatar_effect', max_stack: 1, is_consumable: false, is_active: true, rarity: 'epic' },
            { id: 'diamond-badge', name: 'Diamond Badge', name_tr: 'Elmas Rozet', description: 'Ultra-rare diamond profile badge', description_tr: 'Çok nadir elmas profil rozeti', category: 'cosmetic', icon: 'diamond', price_points: 1500, effect_type: 'profile_badge', max_stack: 1, is_consumable: false, is_active: true, rarity: 'legendary', badge_text: 'RARE', badge_color: '#B9F2FF' },
            { id: 'animated-avatar', name: 'Animated Avatar Border', name_tr: 'Animasyonlu Avatar Çerçevesi', description: 'Animated glowing border around your avatar', description_tr: 'Avatarın etrafında animasyonlu parlayan çerçeve', category: 'cosmetic', icon: 'aperture', price_points: 800, effect_type: 'avatar_animation', max_stack: 1, is_consumable: false, is_active: true, rarity: 'epic' },
            { id: 'custom-theme-pack', name: 'Custom Theme Pack', name_tr: 'Özel Tema Paketi', description: 'Unlock 5 exclusive app color themes', description_tr: '5 özel uygulama renk temasını aç', category: 'cosmetic', icon: 'color-palette', price_points: 600, effect_type: 'app_themes', max_stack: 1, is_consumable: false, is_active: true, rarity: 'rare' },
            { id: 'emoji-pack', name: 'Premium Emoji Pack', name_tr: 'Premium Emoji Paketi', description: 'Unlock 50+ fitness-themed emojis for chat', description_tr: 'Sohbet için 50+ fitness temalı emoji aç', category: 'cosmetic', icon: 'happy', price_points: 400, effect_type: 'chat_emojis', max_stack: 1, is_consumable: false, is_active: true, rarity: 'uncommon' },
            { id: 'progress-flames', name: 'Progress Flames Effect', name_tr: 'İlerleme Alev Efekti', description: 'Fire animation on your progress charts', description_tr: 'İlerleme grafiklerinde ateş animasyonu', category: 'cosmetic', icon: 'flame', price_points: 700, effect_type: 'chart_effect', max_stack: 1, is_consumable: false, is_active: true, rarity: 'rare' },

            // ── Equipment ──
            { id: 'resistance-band-set', name: 'Resistance Band Set', name_tr: 'Direnç Bandı Seti', description: 'Unlock 20 new resistance band exercises', description_tr: '20 yeni direnç bandı egzersizi aç', category: 'equipment', icon: 'fitness', price_points: 350, effect_type: 'unlock_exercises', max_stack: 1, is_consumable: false, is_active: true, rarity: 'uncommon' },
            { id: 'yoga-mat-pro', name: 'Yoga Mat Pro', name_tr: 'Pro Yoga Matı', description: 'Access premium yoga and stretching routines', description_tr: 'Premium yoga ve esneme rutinlerine eriş', category: 'equipment', icon: 'body', price_points: 400, effect_type: 'unlock_routines', max_stack: 1, is_consumable: false, is_active: true, rarity: 'uncommon' },
            { id: 'jump-rope-master', name: 'Jump Rope Master', name_tr: 'İp Atlama Ustası', description: 'Unlock jump rope HIIT workouts with tracking', description_tr: 'İp atlama HIIT antrenmanlarını aç', category: 'equipment', icon: 'pulse', price_points: 300, effect_type: 'unlock_workouts', max_stack: 1, is_consumable: false, is_active: true, rarity: 'common' },
            { id: 'foam-roller-pack', name: 'Foam Roller Recovery Pack', name_tr: 'Foam Roller İyileşme Paketi', description: 'Access guided foam rolling recovery sessions', description_tr: 'Rehberli foam roller iyileşme seanslarına eriş', category: 'equipment', icon: 'medical', price_points: 250, effect_type: 'unlock_recovery', max_stack: 1, is_consumable: false, is_active: true, rarity: 'common' },
            { id: 'kettlebell-mastery', name: 'Kettlebell Mastery', name_tr: 'Kettlebell Ustalığı', description: 'Unlock advanced kettlebell training programs', description_tr: 'İleri düzey kettlebell programlarını aç', category: 'equipment', icon: 'barbell', price_points: 450, effect_type: 'unlock_exercises', max_stack: 1, is_consumable: false, is_active: true, rarity: 'rare', badge_text: 'NEW', badge_color: '#FF6B35' },

            // ── Nutrition ──
            { id: 'protein-shake-pack', name: 'Protein Shake Recipe Pack', name_tr: 'Protein Shake Tarif Paketi', description: 'Unlock 50 protein shake recipes with macro info', description_tr: '50 protein shake tarifi ve makro bilgisi aç', category: 'nutrition', icon: 'nutrition', price_points: 200, effect_type: 'unlock_recipes', max_stack: 1, is_consumable: false, is_active: true, rarity: 'common' },
            { id: 'meal-prep-guide', name: 'Meal Prep Pro Guide', name_tr: 'Meal Prep Pro Rehberi', description: '7-day meal prep plans auto-generated weekly', description_tr: 'Haftalık otomatik 7 günlük meal prep planları', category: 'nutrition', icon: 'restaurant', price_points: 350, effect_type: 'meal_prep_unlock', max_stack: 1, is_consumable: false, is_active: true, rarity: 'uncommon' },
            { id: 'calorie-counter-pro', name: 'Calorie Counter Pro', name_tr: 'Kalori Sayacı Pro', description: 'Unlimited food scans + detailed micro nutrients', description_tr: 'Sınırsız besin tarama + detaylı mikro besinler', category: 'nutrition', icon: 'calculator', price_points: 600, effect_type: 'unlimited_scans', max_stack: 1, is_consumable: false, is_active: true, rarity: 'rare', badge_text: 'POPULAR', badge_color: '#4ECDC4' },
            { id: 'superfood-guide', name: 'Superfood Encyclopedia', name_tr: 'Süper Gıda Ansiklopedisi', description: 'Access 200+ superfoods with health benefits', description_tr: '200+ süper gıda ve sağlık faydalarına eriş', category: 'nutrition', icon: 'leaf', price_points: 275, effect_type: 'unlock_guide', max_stack: 1, is_consumable: false, is_active: true, rarity: 'uncommon' },
            { id: 'hydration-tracker-pro', name: 'Hydration Tracker Pro', name_tr: 'Hidrasyon Takibi Pro', description: 'Smart water reminders based on activity level', description_tr: 'Aktivite seviyesine göre akıllı su hatırlatıcı', category: 'nutrition', icon: 'water', price_points: 180, effect_type: 'smart_hydration', max_stack: 1, is_consumable: false, is_active: true, rarity: 'common' },

            // ── Recovery ──
            { id: 'ice-bath-timer', name: 'Ice Bath Timer & Guide', name_tr: 'Buz Banyosu Zamanlayıcı', description: 'Guided cold therapy sessions with timer', description_tr: 'Zamanlayıcılı soğuk terapi seansları', category: 'recovery', icon: 'snow', price_points: 200, effect_type: 'unlock_therapy', max_stack: 1, is_consumable: false, is_active: true, rarity: 'common' },
            { id: 'sleep-optimizer', name: 'Sleep Optimizer', name_tr: 'Uyku Optimizörü', description: 'AI-powered sleep analysis and improvement tips', description_tr: 'AI destekli uyku analizi ve iyileştirme önerileri', category: 'recovery', icon: 'moon', price_points: 400, effect_type: 'sleep_analysis', max_stack: 1, is_consumable: false, is_active: true, rarity: 'rare' },
            { id: 'meditation-sessions', name: 'Meditation Session Pack', name_tr: 'Meditasyon Seans Paketi', description: 'Access 30 guided meditation sessions', description_tr: '30 rehberli meditasyon seansına eriş', category: 'recovery', icon: 'flower', price_points: 300, effect_type: 'unlock_meditation', max_stack: 1, is_consumable: false, is_active: true, rarity: 'uncommon' },
            { id: 'stretching-pro', name: 'Dynamic Stretching Pro', name_tr: 'Dinamik Esneme Pro', description: 'Pre and post workout stretching programs', description_tr: 'Antrenman öncesi ve sonrası esneme programları', category: 'recovery', icon: 'body', price_points: 275, effect_type: 'unlock_stretching', max_stack: 1, is_consumable: false, is_active: true, rarity: 'uncommon' },

            // ── Seasonal ──
            { id: 'summer-challenge', name: 'Summer Shred Pack', name_tr: 'Yaz Formu Paketi', description: 'Exclusive 8-week summer body transformation plan', description_tr: 'Özel 8 haftalık yaz vücudu dönüşüm planı', category: 'seasonal', icon: 'sunny', price_points: 750, effect_type: 'seasonal_plan', max_stack: 1, is_consumable: false, is_active: true, rarity: 'epic', badge_text: 'LIMITED', badge_color: '#FF4757' },
            { id: 'new-year-starter', name: 'New Year Starter Kit', name_tr: 'Yeni Yıl Başlangıç Kiti', description: 'Complete fitness reset with 30-day challenge', description_tr: '30 günlük meydan okuma ile fitness sıfırlama', category: 'seasonal', icon: 'sparkles', price_points: 500, effect_type: 'seasonal_challenge', max_stack: 1, is_consumable: false, is_active: true, rarity: 'rare', badge_text: 'SEASONAL', badge_color: '#FFA502' },
            { id: 'ramadan-fitness', name: 'Ramadan Fitness Guide', name_tr: 'Ramazan Fitness Rehberi', description: 'Workout and nutrition plans optimized for fasting', description_tr: 'Oruç için optimize edilmiş antrenman ve beslenme', category: 'seasonal', icon: 'moon', price_points: 400, effect_type: 'seasonal_plan', max_stack: 1, is_consumable: false, is_active: true, rarity: 'rare', badge_text: 'SEASONAL', badge_color: '#7B68EE' },

            // ── Premium ──
            { id: 'ai-coach-unlimited', name: 'AI Coach Unlimited', name_tr: 'AI Koç Sınırsız', description: 'Unlimited AI coaching sessions for 30 days', description_tr: '30 gün sınırsız AI koçluk seansları', category: 'premium', icon: 'brain', price_points: 1500, effect_type: 'premium_ai', effect_duration_minutes: 43200, max_stack: 1, is_consumable: true, is_active: true, rarity: 'legendary', badge_text: 'BEST', badge_color: '#FFD700' },
            { id: 'body-scan-pro', name: 'Body Scan Pro', name_tr: 'Vücut Tarama Pro', description: 'Advanced AI body composition analysis from photos', description_tr: 'Fotoğraflardan gelişmiş AI vücut analizi', category: 'premium', icon: 'scan', price_points: 1000, effect_type: 'premium_scan', max_stack: 1, is_consumable: false, is_active: true, rarity: 'epic' },
            { id: 'personal-plan-gen', name: 'Personal Plan Generator', name_tr: 'Kişisel Plan Üretici', description: 'Custom AI-generated workout + diet plan combo', description_tr: 'Özel AI üretimi antrenman + diyet planı', category: 'premium', icon: 'create', price_points: 1200, effect_type: 'premium_plan', max_stack: 1, is_consumable: false, is_active: true, rarity: 'epic', badge_text: 'HOT', badge_color: '#FF4500' },
            { id: 'vip-badge', name: 'VIP Status Badge', name_tr: 'VIP Statü Rozeti', description: 'Exclusive VIP badge with priority support', description_tr: 'Öncelikli destek ile özel VIP rozeti', category: 'premium', icon: 'star', price_points: 2000, effect_type: 'vip_status', max_stack: 1, is_consumable: false, is_active: true, rarity: 'legendary', badge_text: 'VIP', badge_color: '#FFD700' },
        ];
    }
}
