import { SupabaseService } from '@nextself/shared';
import { LogManager } from '../utils/LogManager';

export interface StoreItem {
    id: string;
    name: string;
    nameTr: string;
    description: string;
    descriptionTr: string;
    category: 'booster' | 'cosmetic' | 'utility' | 'equipment' | 'nutrition' | 'recovery' | 'seasonal' | 'premium';
    icon: string;
    pricePoints: number;
    priceReal?: number;
    effectType: string;
    effectDurationMinutes?: number;
    maxStack: number;
    isConsumable: boolean;
    isActive: boolean;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    badgeText?: string;
    badgeColor?: string;
}

export interface UserInventoryItem {
    id: string;
    itemId: string;
    quantity: number;
    isActive: boolean;
    activatedAt?: string;
    expiresAt?: string;
    item: StoreItem;
}

export interface UserCurrency {
    points: number;
    gems: number;
    totalEarnedPoints: number;
    totalSpentPoints: number;
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

    private mapStoreItem(item: any): StoreItem {
        const fallbackName = item.name || item.name_tr || 'Store Item';
        const fallbackNameTr = item.name_tr || item.name || 'Mağaza Ürünü';
        const fallbackDesc = item.description || 'Useful store item for your fitness journey.';
        const fallbackDescTr = item.description_tr || 'Fitness yolculuğun için faydalı bir mağaza ürünü.';
        return {
            id: item.id,
            name: fallbackName,
            nameTr: fallbackNameTr,
            description: fallbackDesc,
            descriptionTr: fallbackDescTr,
            category: item.category,
            icon: item.icon,
            pricePoints: item.price_points,
            priceReal: item.price_real,
            effectType: item.effect_type,
            effectDurationMinutes: item.effect_duration_minutes,
            maxStack: item.max_stack,
            isConsumable: item.is_consumable,
            isActive: item.is_active,
            rarity: item.rarity,
            badgeText: item.badge_text,
            badgeColor: item.badge_color,
        };
    }

    // Get available store items with pagination
    public async getStoreItems(category: string = 'all', page: number = 0, pageSize: number = 20): Promise<StoreItem[]> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const safePageSize = Math.max(1, Math.min(pageSize, 100));
            const safePage = Math.max(0, page);
            const from = safePage * safePageSize;
            const to = from + safePageSize - 1;
            let query = supabase
                .from('store_items')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })
                .range(from, to);

            if (category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data || []).map(this.mapStoreItem);
        } catch (err) {
            LogManager.getInstance().warn('Store items fetch error:', err);
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

                return newCurrency ? {
                    points: newCurrency.points,
                    gems: newCurrency.gems,
                    totalEarnedPoints: newCurrency.total_earned_points,
                    totalSpentPoints: newCurrency.total_spent_points
                } : { points: 100, gems: 0, totalEarnedPoints: 100, totalSpentPoints: 0 };
            }

            return {
                points: data.points,
                gems: data.gems,
                totalEarnedPoints: data.total_earned_points,
                totalSpentPoints: data.total_spent_points
            };
        } catch (err) {
            LogManager.getInstance().warn('Currency fetch error:', err);
            return { points: 0, gems: 0, totalEarnedPoints: 0, totalSpentPoints: 0 };
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
                itemId: item.item_id,
                quantity: item.quantity,
                isActive: item.is_active,
                activatedAt: item.activated_at,
                expiresAt: item.expires_at,
                item: this.mapStoreItem(item.store_items),
            }));
        } catch (err) {
            LogManager.getInstance().warn('Inventory fetch error:', err);
            return [];
        }
    }

    // Purchase an item
    public async purchaseItem(itemId: string): Promise<{ success: boolean; message: string }> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, message: 'Not authenticated' };

            const { data, error } = await supabase.rpc('purchase_store_item', {
                p_user_id: user.id,
                p_item_id: itemId
            });

            if (error) {
                LogManager.getInstance().error('RPC purchase_store_item error:', error);
                return { success: false, message: 'purchase_failed' };
            }

            return data as { success: boolean; message: string };
        } catch (error) {
            LogManager.getInstance().error('Error in purchaseItem:', error);
            return { success: false, message: 'unknown_error' };
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
            LogManager.getInstance().warn('Activate error:', err);
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
            LogManager.getInstance().warn('Streak freeze error:', err);
            return false;
        }
    }

    // Default items fallback
    private getDefaultItems(): StoreItem[] {
        return [
            // ── Utility ──
            { id: 'streak-freeze', name: 'Time Freeze Protocol', nameTr: 'Zaman Dondurucu', description: 'Locks your streak in stasis for 24 hours.', descriptionTr: 'Serinizi 24 saatliğine kuantum stazında korur.', category: 'utility', icon: 'timer', pricePoints: 200, effectType: 'streak_freeze', maxStack: 3, isConsumable: true, isActive: true, rarity: 'common' },
            { id: 'extra-life', name: 'Phoenix Revival', nameTr: 'Anka Dirilişi', description: 'Instantly recover a lost daily challenge.', descriptionTr: 'Kaybedilen günlük görevi anında geri getirir.', category: 'utility', icon: 'bandage', pricePoints: 100, effectType: 'extra_life', maxStack: 5, isConsumable: true, isActive: true, rarity: 'common' },
            { id: 'mystery-box', name: 'Quantum Loot Box', nameTr: 'Kuantum Kutusu', description: 'Open to reveal cosmic tier rewards.', descriptionTr: 'Kozmik seviye ödülleri ortaya çıkarmak için açın.', category: 'utility', icon: 'cube', pricePoints: 500, effectType: 'mystery_reward', maxStack: 10, isConsumable: true, isActive: true, rarity: 'rare', badgeText: 'HOT', badgeColor: '#FF4500' },

            // ── Boosters ──
            { id: 'double-xp', name: 'Neural Overdrive (2x)', nameTr: 'Nöral Aşırı Yük (2x)', description: 'Boosts cognitive and physical XP gain by 2x.', descriptionTr: 'Zihinsel ve fiziksel XP kazanımını 2 katına çıkarır.', category: 'booster', icon: 'trending-up', pricePoints: 150, effectType: 'double_xp', effectDurationMinutes: 15, maxStack: 5, isConsumable: true, isActive: true, rarity: 'common' },
            { id: 'xp-shield', name: 'Aura Deflector', nameTr: 'Aura Kalkanı', description: 'Nullifies all XP penalties for 24 hours.', descriptionTr: '24 saat boyunca tüm XP cezalarını sıfırlar.', category: 'booster', icon: 'lock-closed', pricePoints: 250, effectType: 'xp_shield', effectDurationMinutes: 1440, maxStack: 3, isConsumable: true, isActive: true, rarity: 'uncommon' },
            { id: 'workout-boost', name: 'Adrenaline Surge', nameTr: 'Adrenalin Patlaması', description: 'Massive 50% XP boost during active workouts.', descriptionTr: 'Antrenmanlarda %50 ekstra XP patlaması sağlar.', category: 'booster', icon: 'bicycle', pricePoints: 175, effectType: 'workout_boost', effectDurationMinutes: 60, maxStack: 3, isConsumable: true, isActive: true, rarity: 'common' },
            { id: 'nutrition-boost', name: 'Metabolic Catalyst', nameTr: 'Metabolik Katalizör', description: 'Maximizes XP from perfect nutrition logs.', descriptionTr: 'Kusursuz beslenme kayıtlarından maksimum XP sağlar.', category: 'booster', icon: 'pizza', pricePoints: 175, effectType: 'nutrition_boost', effectDurationMinutes: 60, maxStack: 3, isConsumable: true, isActive: true, rarity: 'common' },
            { id: 'triple-xp-weekend', name: 'Hypernova Weekend', nameTr: 'Hipernova Hafta Sonu', description: '3x XP generation across all systems.', descriptionTr: 'Tüm sistemlerde 3 kat XP üretimi başlatır.', category: 'booster', icon: 'airplane', pricePoints: 400, effectType: 'triple_xp', effectDurationMinutes: 4320, maxStack: 2, isConsumable: true, isActive: true, rarity: 'rare', badgeText: 'HOT', badgeColor: '#FF4500' },
            { id: 'social-boost', name: 'Synergy Matrix', nameTr: 'Sinerji Matrisi', description: 'Amplifies group and social XP rewards.', descriptionTr: 'Grup ve sosyal etkinlik XP ödüllerini güçlendirir.', category: 'booster', icon: 'chatbubbles', pricePoints: 200, effectType: 'social_boost', effectDurationMinutes: 1440, maxStack: 3, isConsumable: true, isActive: true, rarity: 'uncommon' },
            { id: 'mission-multiplier', name: 'Objective Amplifier', nameTr: 'Görev Amplifikatörü', description: 'Doubles the payout of all core missions.', descriptionTr: 'Tüm temel görevlerin getirisini ikiye katlar.', category: 'booster', icon: 'map', pricePoints: 300, effectType: 'mission_multiply', effectDurationMinutes: 1440, maxStack: 3, isConsumable: true, isActive: true, rarity: 'uncommon' },
            { id: 'focus-mode', name: 'Zenith Focus', nameTr: 'Zenith Odaklanması', description: 'Eliminates distractions, boosting pure XP.', descriptionTr: 'Dikkat dağıtıcıları siler, saf XP kazanımını artırır.', category: 'booster', icon: 'headset', pricePoints: 150, effectType: 'focus_boost', effectDurationMinutes: 60, maxStack: 5, isConsumable: true, isActive: true, rarity: 'common' },
            { id: 'lucky-charm', name: 'Probability Manipulator', nameTr: 'Olasılık Manipülatörü', description: 'Bends reality for a chance at 5x XP.', descriptionTr: 'Gerçekliği bükerek 5x XP şansı yaratır.', category: 'booster', icon: 'game-controller', pricePoints: 250, effectType: 'lucky_multiplier', effectDurationMinutes: 120, maxStack: 3, isConsumable: true, isActive: true, rarity: 'rare' },

            // ── Cosmetics ──
            { id: 'premium-frame', name: 'Holo-Frame Elite', nameTr: 'Holo-Çerçeve Elite', description: 'Project a premium holographic border.', descriptionTr: 'Profilinize premium holografik bir sınır yansıtır.', category: 'cosmetic', icon: 'image', pricePoints: 500, effectType: 'avatar_frame', maxStack: 1, isConsumable: false, isActive: true, rarity: 'rare' },
            { id: 'gold-badge', name: 'Aureum Crest', nameTr: 'Aureum Arması', description: 'The mark of dedicated elite members.', descriptionTr: 'Adanmış elit üyelerin efsanevi altın işareti.', category: 'cosmetic', icon: 'award', pricePoints: 300, effectType: 'profile_badge', maxStack: 1, isConsumable: false, isActive: true, rarity: 'uncommon' },
            { id: 'premium-diet-theme', name: 'Obsidian Interface', nameTr: 'Obsidyen Arayüz', description: 'Sleek, dark matter theme for nutrition.', descriptionTr: 'Beslenme için şık, karanlık madde teması.', category: 'cosmetic', icon: 'contrast', pricePoints: 800, effectType: 'app_theme', maxStack: 1, isConsumable: false, isActive: true, rarity: 'epic' },
            { id: 'neon-avatar-effect', name: 'Cyber-Neon Glow', nameTr: 'Siber-Neon Işıltısı', description: 'Pulsing neon aesthetics for your avatar.', descriptionTr: 'Avatarınız için nabız gibi atan neon estetiği.', category: 'cosmetic', icon: 'flash', pricePoints: 1200, effectType: 'avatar_effect', maxStack: 1, isConsumable: false, isActive: true, rarity: 'epic' },
            { id: 'diamond-badge', name: 'Prismatic Diamond', nameTr: 'Prizmatik Elmas', description: 'Ultra-rare badge refracting pure light.', descriptionTr: 'Saf ışığı kıran çok nadir elmas rozet.', category: 'cosmetic', icon: 'prism', pricePoints: 1500, effectType: 'profile_badge', maxStack: 1, isConsumable: false, isActive: true, rarity: 'legendary', badgeText: 'RARE', badgeColor: '#B9F2FF' },
            { id: 'animated-avatar', name: 'Kinetic Energy Border', nameTr: 'Kinetik Enerji Çerçevesi', description: 'A border alive with kinetic movement.', descriptionTr: 'Kinetik hareketle canlı, animasyonlu çerçeve.', category: 'cosmetic', icon: 'film', pricePoints: 800, effectType: 'avatar_animation', maxStack: 1, isConsumable: false, isActive: true, rarity: 'epic' },
            { id: 'custom-theme-pack', name: 'Chroma Protocol', nameTr: 'Kroma Protokolü', description: 'Unlock the full spectrum of UI themes.', descriptionTr: 'Arayüz temalarının tüm spektrumunun kilidini aç.', category: 'cosmetic', icon: 'color-fill', pricePoints: 600, effectType: 'app_themes', maxStack: 1, isConsumable: false, isActive: true, rarity: 'rare' },
            { id: 'emoji-pack', name: 'Holo-Emotes', nameTr: 'Holo-İfadeler', description: 'Next-gen holographic chat emotes.', descriptionTr: 'Sohbet için yeni nesil holografik ifadeler.', category: 'cosmetic', icon: 'chatbubble-ellipses', pricePoints: 400, effectType: 'chat_emojis', maxStack: 1, isConsumable: false, isActive: true, rarity: 'uncommon' },
            { id: 'progress-flames', name: 'Plasma Trail', nameTr: 'Plazma İzi', description: 'Leave a burning plasma trail on charts.', descriptionTr: 'Grafiklerde yanan bir plazma izi bırakın.', category: 'cosmetic', icon: 'bonfire', pricePoints: 700, effectType: 'chart_effect', maxStack: 1, isConsumable: false, isActive: true, rarity: 'rare' },

            // ── Equipment ──
            { id: 'resistance-band-set', name: 'Tension Cords Pro', nameTr: 'Pro Gerilim Bantları', description: 'Advanced elastic resistance regimens.', descriptionTr: 'İleri düzey elastik direnç programları.', category: 'equipment', icon: 'git-commit', pricePoints: 350, effectType: 'unlock_exercises', maxStack: 1, isConsumable: false, isActive: true, rarity: 'uncommon' },
            { id: 'yoga-mat-pro', name: 'Zenith Gravity Mat', nameTr: 'Zenith Yerçekimi Matı', description: 'Anti-slip surface for ultimate core balance.', descriptionTr: 'Mükemmel denge için kaymaz teknolojik yüzey.', category: 'equipment', icon: 'accessibility', pricePoints: 400, effectType: 'unlock_routines', maxStack: 1, isConsumable: false, isActive: true, rarity: 'uncommon' },
            { id: 'jump-rope-master', name: 'Aero-Whip Rope', nameTr: 'Aero-Kırbaç İpi', description: 'High-velocity cardio acceleration.', descriptionTr: 'Yüksek hızlı kardiyo ivmelenmesi.', category: 'equipment', icon: 'refresh', pricePoints: 300, effectType: 'unlock_workouts', maxStack: 1, isConsumable: false, isActive: true, rarity: 'common' },
            { id: 'foam-roller-pack', name: 'Myo-Release Cylinder', nameTr: 'Miyo-Gevşeme Silindiri', description: 'Deep tissue kinetic recovery module.', descriptionTr: 'Derin doku kinetik iyileşme modülü.', category: 'equipment', icon: 'build', pricePoints: 250, effectType: 'unlock_recovery', maxStack: 1, isConsumable: false, isActive: true, rarity: 'common' },
            { id: 'kettlebell-mastery', name: 'Iron Core Kinetics', nameTr: 'Demir Çekirdek Kinetiği', description: 'Ballistic strength and power routines.', descriptionTr: 'Balistik güç ve kuvvet rutinleri.', category: 'equipment', icon: 'hammer', pricePoints: 450, effectType: 'unlock_exercises', maxStack: 1, isConsumable: false, isActive: true, rarity: 'rare', badgeText: 'NEW', badgeColor: '#FF6B35' },

            // ── Nutrition ──
            { id: 'protein-shake-pack', name: 'Synth-Protein Formulas', nameTr: 'Sentez-Protein Formülleri', description: 'Next-gen muscle synthesis recipes.', descriptionTr: 'Yeni nesil kas sentezleme tarifleri.', category: 'nutrition', icon: 'beaker', pricePoints: 200, effectType: 'unlock_recipes', maxStack: 1, isConsumable: false, isActive: true, rarity: 'common' },
            { id: 'meal-prep-guide', name: 'Macro-Architect Guide', nameTr: 'Makro-Mimar Rehberi', description: 'Precision engineered meal prep logic.', descriptionTr: 'Hassas mühendislikle tasarlanmış öğün planı.', category: 'nutrition', icon: 'list', pricePoints: 350, effectType: 'meal_prep_unlock', maxStack: 1, isConsumable: false, isActive: true, rarity: 'uncommon' },
            { id: 'calorie-counter-pro', name: 'Omni-Scanner Pro', nameTr: 'Omni-Tarayıcı Pro', description: 'AI-driven molecular food analysis.', descriptionTr: 'Yapay zeka destekli moleküler besin analizi.', category: 'nutrition', icon: 'scan-circle', pricePoints: 600, effectType: 'unlimited_scans', maxStack: 1, isConsumable: false, isActive: true, rarity: 'rare', badgeText: 'POPULAR', badgeColor: '#4ECDC4' },
            { id: 'superfood-guide', name: 'Botanical Codex', nameTr: 'Botanik Kodeks', description: 'Database of high-yield organic fuels.', descriptionTr: 'Yüksek verimli organik yakıtlar veritabanı.', category: 'nutrition', icon: 'library', pricePoints: 275, effectType: 'unlock_guide', maxStack: 1, isConsumable: false, isActive: true, rarity: 'uncommon' },
            { id: 'hydration-tracker-pro', name: 'Hydro-Sync Pro', nameTr: 'Hidro-Senkron Pro', description: 'Dynamic cellular hydration monitor.', descriptionTr: 'Dinamik hücresel sıvı takibi monitörü.', category: 'nutrition', icon: 'water-outline', pricePoints: 180, effectType: 'smart_hydration', maxStack: 1, isConsumable: false, isActive: true, rarity: 'common' },

            // ── Recovery ──
            { id: 'ice-bath-timer', name: 'Cryo-Stasis Protocol', nameTr: 'Kriyo-Staz Protokolü', description: 'Guided extreme cold therapy.', descriptionTr: 'Rehberli ekstrem soğuk terapi modülü.', category: 'recovery', icon: 'thermometer', pricePoints: 200, effectType: 'unlock_therapy', maxStack: 1, isConsumable: false, isActive: true, rarity: 'common' },
            { id: 'sleep-optimizer', name: 'Neural Sleep Matrix', nameTr: 'Nöral Uyku Matrisi', description: 'Deep REM cycle optimization AI.', descriptionTr: 'Derin REM döngüsü optimizasyon yapay zekası.', category: 'recovery', icon: 'bed', pricePoints: 400, effectType: 'sleep_analysis', maxStack: 1, isConsumable: false, isActive: true, rarity: 'rare' },
            { id: 'meditation-sessions', name: 'Mindfulness Sync', nameTr: 'Zihin Senkronizasyonu', description: 'Binaural beats and cognitive reset.', descriptionTr: 'Binaural ritimler ve zihinsel sıfırlama.', category: 'recovery', icon: 'rose', pricePoints: 300, effectType: 'unlock_meditation', maxStack: 1, isConsumable: false, isActive: true, rarity: 'uncommon' },
            { id: 'stretching-pro', name: 'Flex-Dynamics Pro', nameTr: 'Esneklik-Dinamik Pro', description: 'Advanced biomechanical stretching.', descriptionTr: 'Gelişmiş biyomekanik esneme algoritmaları.', category: 'recovery', icon: 'walk', pricePoints: 275, effectType: 'unlock_stretching', maxStack: 1, isConsumable: false, isActive: true, rarity: 'uncommon' },

            // ── Seasonal ──
            { id: 'summer-challenge', name: 'Solar Flare Challenge', nameTr: 'Güneş Patlaması Serisi', description: 'High-intensity summer transformation.', descriptionTr: 'Yüksek yoğunluklu yaz dönüşüm programı.', category: 'seasonal', icon: 'flame', pricePoints: 750, effectType: 'seasonal_plan', maxStack: 1, isConsumable: false, isActive: true, rarity: 'epic', badgeText: 'LIMITED', badgeColor: '#FF4757' },
            { id: 'new-year-starter', name: 'Genesis Protocol', nameTr: 'Başlangıç Protokolü', description: 'Complete physiological reset for a new cycle.', descriptionTr: 'Yeni bir döngü için tam fizyolojik sıfırlama.', category: 'seasonal', icon: 'calendar', pricePoints: 500, effectType: 'seasonal_challenge', maxStack: 1, isConsumable: false, isActive: true, rarity: 'rare', badgeText: 'SEASONAL', badgeColor: '#FFA502' },
            { id: 'ramadan-fitness', name: 'Lunar Fasting Guide', nameTr: 'Ay Orucu Rehberi', description: 'Optimized chronobiology for fasting.', descriptionTr: 'Oruç için optimize edilmiş kronobiyoloji.', category: 'seasonal', icon: 'cloudy-night', pricePoints: 400, effectType: 'seasonal_plan', maxStack: 1, isConsumable: false, isActive: true, rarity: 'rare', badgeText: 'SEASONAL', badgeColor: '#7B68EE' },

            // ── Premium ──
            { id: 'ai-coach-unlimited', name: 'Omni-Coach Prime', nameTr: 'Omni-Koç Prime', description: 'Limitless access to AGI fitness intelligence.', descriptionTr: 'Yapay zeka fitness zekasına sınırsız erişim.', category: 'premium', icon: 'desktop', pricePoints: 1500, effectType: 'premium_ai', effectDurationMinutes: 43200, maxStack: 1, isConsumable: true, isActive: true, rarity: 'legendary', badgeText: 'BEST', badgeColor: '#FFD700' },
            { id: 'body-scan-pro', name: 'Bio-Metric Scanner', nameTr: 'Biyo-Metrik Tarayıcı', description: 'Sub-dermal AI composition analysis.', descriptionTr: 'Yapay zeka destekli vücut kompozisyonu analizi.', category: 'premium', icon: 'finger-print', pricePoints: 1000, effectType: 'premium_scan', maxStack: 1, isConsumable: false, isActive: true, rarity: 'epic' },
            { id: 'personal-plan-gen', name: 'Algorithmic Architect', nameTr: 'Algoritmik Mimar', description: 'Bespoke fitness trajectory generator.', descriptionTr: 'Kişiye özel fitness rotası oluşturucu.', category: 'premium', icon: 'easel', pricePoints: 1200, effectType: 'premium_plan', maxStack: 1, isConsumable: false, isActive: true, rarity: 'epic', badgeText: 'HOT', badgeColor: '#FF4500' },
            { id: 'vip-badge', name: 'Apex Vanguard Status', nameTr: 'Apex Öncü Statüsü', description: 'The absolute pinnacle of membership.', descriptionTr: 'Üyeliğin mutlak zirvesi ve öncelik rozeti.', category: 'premium', icon: 'diamond', pricePoints: 2000, effectType: 'vip_status', maxStack: 1, isConsumable: false, isActive: true, rarity: 'legendary', badgeText: 'VIP', badgeColor: '#FFD700' },
        ];
    }
}
