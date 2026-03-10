-- ============================================================================
-- BioSync New Features Schema
-- Smart Scale Enhanced, Store Expansion, Progress Reports Enhancement
-- ============================================================================

-- ─── Health Records Enhancement (Smart Scale / Mi Scale) ───────────────────
-- Add new columns to health_data for Mi Scale BLE data
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(5,2);
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS muscle_mass_percentage DECIMAL(5,2);
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS water_percentage DECIMAL(5,2);
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS bone_mass_kg DECIMAL(5,2);
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS visceral_fat INTEGER;
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS basal_metabolism INTEGER;
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS impedance INTEGER;
ALTER TABLE health_data ADD COLUMN IF NOT EXISTS bmi DECIMAL(5,2);

-- Create index for faster history queries
CREATE INDEX IF NOT EXISTS idx_health_data_user_weight
    ON health_data(user_id, recorded_at DESC)
    WHERE weight IS NOT NULL;

-- ─── Expanded Store Items ──────────────────────────────────────────────────

-- Update store_items category constraint to support new categories
ALTER TABLE store_items DROP CONSTRAINT IF EXISTS store_items_category_check;
ALTER TABLE store_items ADD CONSTRAINT store_items_category_check
    CHECK (category IN ('booster', 'cosmetic', 'utility', 'equipment', 'nutrition', 'recovery', 'seasonal', 'premium'));

-- Add new columns for richer store items
ALTER TABLE store_items ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'));
ALTER TABLE store_items ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE store_items ADD COLUMN IF NOT EXISTS badge_color TEXT;
ALTER TABLE store_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add unique constraint on name for idempotent inserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_items_name_unique ON store_items(name);

-- Insert new store items (id auto-generated as UUID)
INSERT INTO store_items (name, name_tr, description, description_tr, category, icon, price_points, effect_type, effect_duration_minutes, max_stack, is_consumable, is_active, rarity, badge_text, badge_color, sort_order) VALUES

-- Equipment (Virtual fitness gear that unlocks features)
('Resistance Band Set', 'Direnç Bandı Seti', 'Unlock 20 new resistance band exercises', '20 yeni direnç bandı egzersizi aç', 'equipment', 'fitness', 350, 'unlock_exercises', NULL, 1, false, true, 'uncommon', NULL, NULL, 10),
('Yoga Mat Pro', 'Pro Yoga Matı', 'Access premium yoga and stretching routines', 'Premium yoga ve esneme rutinlerine eriş', 'equipment', 'body', 400, 'unlock_routines', NULL, 1, false, true, 'uncommon', NULL, NULL, 11),
('Jump Rope Master', 'İp Atlama Ustası', 'Unlock jump rope HIIT workouts with tracking', 'İp atlama HIIT antrenmanlarını ve takibini aç', 'equipment', 'pulse', 300, 'unlock_workouts', NULL, 1, false, true, 'common', NULL, NULL, 12),
('Foam Roller Recovery Pack', 'Foam Roller İyileşme Paketi', 'Access guided foam rolling recovery sessions', 'Rehberli foam roller iyileşme seanslarına eriş', 'equipment', 'medical', 250, 'unlock_recovery', NULL, 1, false, true, 'common', NULL, NULL, 13),
('Kettlebell Mastery', 'Kettlebell Ustalığı', 'Unlock advanced kettlebell training programs', 'İleri düzey kettlebell programlarını aç', 'equipment', 'barbell', 450, 'unlock_exercises', NULL, 1, false, true, 'rare', 'NEW', '#FF6B35', 14),

-- Nutrition (Meal planning & tracking enhancers)
('Protein Shake Recipe Pack', 'Protein Shake Tarif Paketi', 'Unlock 50 protein shake recipes with macro info', '50 protein shake tarifi ve makro bilgisi aç', 'nutrition', 'nutrition', 200, 'unlock_recipes', NULL, 1, false, true, 'common', NULL, NULL, 20),
('Meal Prep Pro Guide', 'Meal Prep Pro Rehberi', '7-day meal prep plans auto-generated weekly', 'Haftalık otomatik 7 günlük meal prep planları', 'nutrition', 'restaurant', 350, 'meal_prep_unlock', NULL, 1, false, true, 'uncommon', NULL, NULL, 21),
('Calorie Counter Pro', 'Kalori Sayacı Pro', 'Unlimited food scans + detailed micro nutrients', 'Sınırsız besin tarama + detaylı mikro besinler', 'nutrition', 'calculator', 600, 'unlimited_scans', NULL, 1, false, true, 'rare', 'POPULAR', '#4ECDC4', 22),
('Superfood Encyclopedia', 'Süper Gıda Ansiklopedisi', 'Access 200+ superfoods with health benefits', '200+ süper gıda ve sağlık faydalarına eriş', 'nutrition', 'leaf', 275, 'unlock_guide', NULL, 1, false, true, 'uncommon', NULL, NULL, 23),
('Hydration Tracker Pro', 'Hidrasyon Takibi Pro', 'Smart water reminders based on activity level', 'Aktivite seviyesine göre akıllı su hatırlatıcı', 'nutrition', 'water', 180, 'smart_hydration', NULL, 1, false, true, 'common', NULL, NULL, 24),

-- Recovery
('Ice Bath Timer & Guide', 'Buz Banyosu Zamanlayıcı', 'Guided cold therapy sessions with timer', 'Zamanlayıcılı soğuk terapi seansları', 'recovery', 'snow', 200, 'unlock_therapy', NULL, 1, false, true, 'common', NULL, NULL, 30),
('Sleep Optimizer', 'Uyku Optimizörü', 'AI-powered sleep analysis and improvement tips', 'AI destekli uyku analizi ve iyileştirme önerileri', 'recovery', 'moon', 400, 'sleep_analysis', NULL, 1, false, true, 'rare', NULL, NULL, 31),
('Meditation Session Pack', 'Meditasyon Seans Paketi', 'Access 30 guided meditation sessions', '30 rehberli meditasyon seansına eriş', 'recovery', 'flower', 300, 'unlock_meditation', NULL, 1, false, true, 'uncommon', NULL, NULL, 32),
('Self-Massage Recovery Guide', 'Kendi Kendine Masaj Rehberi', 'Video-guided muscle recovery techniques', 'Video rehberli kas iyileşme teknikleri', 'recovery', 'hand-left', 225, 'unlock_guide', NULL, 1, false, true, 'common', NULL, NULL, 33),
('Dynamic Stretching Pro', 'Dinamik Esneme Pro', 'Pre and post workout stretching programs', 'Antrenman öncesi ve sonrası esneme programları', 'recovery', 'body', 275, 'unlock_stretching', NULL, 1, false, true, 'uncommon', NULL, NULL, 34),

-- Seasonal (Limited time items)
('Summer Shred Pack', 'Yaz Formu Paketi', 'Exclusive 8-week summer body transformation plan', 'Özel 8 haftalık yaz vücudu dönüşüm planı', 'seasonal', 'sunny', 750, 'seasonal_plan', NULL, 1, false, true, 'epic', 'LIMITED', '#FF4757', 40),
('New Year Starter Kit', 'Yeni Yıl Başlangıç Kiti', 'Complete fitness reset with 30-day challenge', '30 günlük meydan okuma ile fitness sıfırlama', 'seasonal', 'sparkles', 500, 'seasonal_challenge', NULL, 1, false, true, 'rare', 'SEASONAL', '#FFA502', 41),
('Ramadan Fitness Guide', 'Ramazan Fitness Rehberi', 'Workout and nutrition plans optimized for fasting', 'Oruç için optimize edilmiş antrenman ve beslenme', 'seasonal', 'moon', 400, 'seasonal_plan', NULL, 1, false, true, 'rare', 'SEASONAL', '#7B68EE', 42),
('Holiday Warrior Challenge', 'Tatil Savaşçısı Meydan Okuması', 'Stay fit during holidays with daily challenges', 'Tatilde günlük görevlerle formda kal', 'seasonal', 'gift', 300, 'seasonal_challenge', NULL, 1, false, true, 'uncommon', 'LIMITED', '#FF6B6B', 43),

-- Premium (High-value unlocks)
('AI Coach Unlimited', 'AI Koç Sınırsız', 'Unlimited AI coaching sessions for 30 days', '30 gün sınırsız AI koçluk seansları', 'premium', 'brain', 1500, 'premium_ai', 43200, 1, true, true, 'legendary', 'BEST', '#FFD700', 50),
('Body Scan Pro', 'Vücut Tarama Pro', 'Advanced AI body composition analysis from photos', 'Fotoğraflardan gelişmiş AI vücut analizi', 'premium', 'scan', 1000, 'premium_scan', NULL, 1, false, true, 'epic', NULL, NULL, 51),
('Personal Plan Generator', 'Kişisel Plan Üretici', 'Custom AI-generated workout + diet plan combo', 'Özel AI üretimi antrenman + diyet planı', 'premium', 'create', 1200, 'premium_plan', NULL, 1, false, true, 'epic', 'HOT', '#FF4500', 52),
('VIP Status Badge', 'VIP Statü Rozeti', 'Exclusive VIP badge with priority support', 'Öncelikli destek ile özel VIP rozeti', 'premium', 'star', 2000, 'vip_status', NULL, 1, false, true, 'legendary', 'VIP', '#FFD700', 53),

-- Boosters (Extended)
('Triple XP Weekend', '3x XP Hafta Sonu', 'Earn triple XP for the entire weekend', 'Tüm hafta sonu 3 kat XP kazan', 'booster', 'rocket', 400, 'triple_xp', 4320, 2, true, true, 'rare', 'HOT', '#FF4500', 60),
('Social Boost', 'Sosyal Güçlendirici', 'Double XP from social activities for 24 hours', '24 saat sosyal aktivitelerden çift XP', 'booster', 'people', 200, 'social_boost', 1440, 3, true, true, 'uncommon', NULL, NULL, 61),
('Mission Multiplier', 'Görev Çarpanı', 'Double rewards from daily & weekly missions', 'Günlük ve haftalık görevlerden çift ödül', 'booster', 'compass', 300, 'mission_multiply', 1440, 3, true, true, 'uncommon', NULL, NULL, 62),
('Focus Mode Activator', 'Odak Modu', 'Block distractions + bonus XP for focused sessions', 'Dikkat dağıtıcıları engelle + odak bonusu', 'booster', 'eye', 150, 'focus_boost', 60, 5, true, true, 'common', NULL, NULL, 63),
('Lucky Charm', 'Şans Tılsımı', 'Chance to earn 2-5x XP on any activity', 'Her aktivitede 2-5x XP kazanma şansı', 'booster', 'dice', 250, 'lucky_multiplier', 120, 3, true, true, 'rare', NULL, NULL, 64),

-- Cosmetics (Extended)
('Diamond Badge', 'Elmas Rozet', 'Ultra-rare diamond profile badge', 'Çok nadir elmas profil rozeti', 'cosmetic', 'diamond', 1500, 'profile_badge', NULL, 1, false, true, 'legendary', 'RARE', '#B9F2FF', 70),
('Animated Avatar Border', 'Animasyonlu Avatar Çerçevesi', 'Animated glowing border around your avatar', 'Avatarın etrafında animasyonlu parlayan çerçeve', 'cosmetic', 'aperture', 800, 'avatar_animation', NULL, 1, false, true, 'epic', NULL, NULL, 71),
('Custom Theme Pack', 'Özel Tema Paketi', 'Unlock 5 exclusive app color themes', '5 özel uygulama renk temasını aç', 'cosmetic', 'color-palette', 600, 'app_themes', NULL, 1, false, true, 'rare', NULL, NULL, 72),
('Champion Rank Border', 'Şampiyon Sınır Çerçevesi', 'Exclusive champion-tier profile border', 'Özel şampiyon seviye profil çerçevesi', 'cosmetic', 'trophy', 900, 'rank_border', NULL, 1, false, true, 'epic', NULL, NULL, 73),
('Premium Emoji Pack', 'Premium Emoji Paketi', 'Unlock 50+ fitness-themed emojis for chat', 'Sohbet için 50+ fitness temalı emoji aç', 'cosmetic', 'happy', 400, 'chat_emojis', NULL, 1, false, true, 'uncommon', NULL, NULL, 74),
('Workout Music Skin', 'Antrenman Müzik Teması', 'Exclusive music player skin during workouts', 'Antrenman sırasında özel müzik çalar teması', 'cosmetic', 'musical-notes', 350, 'music_skin', NULL, 1, false, true, 'uncommon', NULL, NULL, 75),
('Progress Flames Effect', 'İlerleme Alev Efekti', 'Fire animation on your progress charts', 'İlerleme grafiklerinde ateş animasyonu', 'cosmetic', 'flame', 700, 'chart_effect', NULL, 1, false, true, 'rare', NULL, NULL, 76)

ON CONFLICT (name) DO NOTHING;

-- ─── Progress Reports Enhancement ─────────────────────────────────────────

-- Ensure progress_reports table has sharing capabilities
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS shared_with JSONB DEFAULT '[]'::jsonb;

-- Create view for quick user progress summary
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT
    hr.user_id,
    hr.weight,
    hr.body_fat_percentage,
    hr.muscle_mass_percentage,
    hr.water_percentage,
    hr.bone_mass_kg,
    hr.visceral_fat,
    hr.basal_metabolism,
    hr.recorded_at,
    hr.source,
    LAG(hr.weight) OVER (PARTITION BY hr.user_id ORDER BY hr.recorded_at) as prev_weight,
    hr.weight - LAG(hr.weight) OVER (PARTITION BY hr.user_id ORDER BY hr.recorded_at) as weight_change
FROM health_data hr
WHERE hr.weight IS NOT NULL
ORDER BY hr.recorded_at DESC;

-- ─── Notification Schedules Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'workout', 'meal', 'supplement', 'mineral', 'vitamin',
        'water', 'sleep', 'scale', 'meditation', 'stretching'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
    is_active BOOLEAN DEFAULT true,
    program_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_schedules_user
    ON notification_schedules(user_id, is_active);

-- ─── Enable RLS on new tables ──────────────────────────────────────────────
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notification schedules" ON notification_schedules;
CREATE POLICY "Users can manage own notification schedules"
    ON notification_schedules FOR ALL USING (auth.uid() = user_id);
