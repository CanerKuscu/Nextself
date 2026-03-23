-- ==========================================
-- ADDITIVE SCHEMA MIGRATION: 
-- (Assuming 20260312185500_initial_schema.sql is ALREADY DEPLOYED)
-- ==========================================

-- NEW ENUM TYPES
CREATE TYPE professional_type_enum AS ENUM ('trainer', 'dietitian');
CREATE TYPE supplement_category_enum AS ENUM ('vitamin', 'mineral', 'protein_powder', 'amino_acid', 'pre_workout', 'fat_burner', 'mass_gainer', 'omega3', 'herb_extract', 'multivitamin', 'other');
CREATE TYPE supplement_form_enum AS ENUM ('pill', 'capsule', 'powder', 'liquid', 'gummy', 'bar', 'softgel', 'tablet');
CREATE TYPE micronutrient_category_enum AS ENUM ('vitamin', 'mineral', 'trace_element', 'amino_acid', 'fatty_acid', 'phytonutrient', 'other');

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_workout_goal_enum') THEN
        CREATE TYPE ai_workout_goal_enum AS ENUM ('weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness', 'strength', 'rehabilitation');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_workout_level_enum') THEN
        CREATE TYPE ai_workout_level_enum AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type_enum') THEN
        CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_analysis_type_enum') THEN
        CREATE TYPE ai_analysis_type_enum AS ENUM ('body_composition', 'workout_performance', 'nutrition', 'sleep', 'stress', 'overall_health');
    END IF;
END $$;
-- NOTE: The following enums might already exist if ran before, using DO blocks to prevent crash if they do.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_enum') THEN
        CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'yearly', 'lifetime');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
    END IF;
END $$;


-- ==========================================
-- 1. PROFESSIONALS & RATINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  professional_type professional_type_enum NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  profile_image TEXT,
  bio TEXT,
  specialties TEXT[],
  experience INT DEFAULT 0,
  certifications TEXT[],
  location JSONB DEFAULT '{}'::JSONB,
  availability JSONB DEFAULT '{}'::JSONB,
  pricing JSONB DEFAULT '{}'::JSONB,
  languages TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  average_rating NUMERIC DEFAULT 0.0,
  total_ratings INT DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE NOT NULL,
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  date DATE DEFAULT CURRENT_DATE,
  verified BOOLEAN DEFAULT FALSE,
  location JSONB DEFAULT '{}'::JSONB,
  helpful_count INT DEFAULT 0,
  response JSONB
);

-- ==========================================
-- 2. AGREEMENTS & CONTRACTS
-- ==========================================
CREATE TABLE IF NOT EXISTS agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_type agreement_type_enum NOT NULL,
  version TEXT NOT NULL,
  title_tr TEXT,
  title_en TEXT,
  total_articles INT DEFAULT 0,
  is_current BOOLEAN DEFAULT FALSE,
  effective_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(agreement_type, version)
);

CREATE TABLE IF NOT EXISTS biometric_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT NOT NULL,
  granted BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  device_platform TEXT,
  session_id TEXT,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS distance_sales_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_address TEXT,
  plan_id TEXT,
  plan_name TEXT NOT NULL,
  billing_cycle billing_cycle_enum NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'TRY',
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status payment_status_enum DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  withdrawal_deadline TIMESTAMPTZ,
  digital_content_started BOOLEAN DEFAULT FALSE,
  digital_content_consent BOOLEAN DEFAULT FALSE,
  contract_text TEXT NOT NULL,
  payment_id TEXT,
  pre_info_shown_at TIMESTAMPTZ,
  pre_info_accepted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  device_platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mss_pdf_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES distance_sales_contracts(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UPDATE EXISTING USER AGREEMENTS
ALTER TABLE user_agreements ADD COLUMN IF NOT EXISTS device_platform TEXT;
ALTER TABLE user_agreements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE user_agreements ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;
ALTER TABLE user_agreements ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_agreements_user_id_agreement_type_version_key') THEN
        ALTER TABLE user_agreements ADD UNIQUE (user_id, agreement_type, version);
    END IF;
END $$;


-- ==========================================
-- 3. AI PLANS & MEALS
-- ==========================================
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  goal ai_workout_goal_enum NOT NULL,
  level ai_workout_level_enum NOT NULL,
  duration_weeks INT NOT NULL DEFAULT 4,
  workouts_per_week INT NOT NULL DEFAULT 3,
  exercises JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  goal TEXT NOT NULL,
  daily_calories INT NOT NULL,
  protein_grams INT NOT NULL,
  carbs_grams INT NOT NULL,
  fat_grams INT NOT NULL,
  meals_per_day INT NOT NULL DEFAULT 3,
  dietary_restrictions TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id UUID REFERENCES nutrition_plans(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_type meal_type_enum NOT NULL,
  foods JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_calories INT DEFAULT 0,
  total_protein INT DEFAULT 0,
  total_carbs INT DEFAULT 0,
  total_fat INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  analysis_type ai_analysis_type_enum NOT NULL,
  data JSONB DEFAULT '{}'::JSONB,
  insights TEXT[],
  recommendations TEXT[],
  confidence_score NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. SOCIAL, FORUMS & PROGRESS LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight NUMERIC,
  body_fat_percentage NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sleep_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  duration_minutes INT,
  quality_score INT CHECK (quality_score >= 1 AND quality_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  level INT CHECK (level >= 1 AND level <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS water_configs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  daily_goal_ml INT NOT NULL DEFAULT 2000,
  container_size_ml INT NOT NULL DEFAULT 250,
  reminder_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS water_stats_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount_ml INT NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_tr TEXT NOT NULL,
  description_en TEXT,
  description_tr TEXT,
  order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  views INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES forum_posts(id) ON DELETE SET NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. THE COMPREHENSIVE SUPPLEMENTS DB 
-- ==========================================

CREATE TABLE IF NOT EXISTS micronutrients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL UNIQUE, 
  name_tr TEXT NOT NULL UNIQUE, 
  category micronutrient_category_enum NOT NULL,
  measurement_unit TEXT NOT NULL, 
  daily_value_target NUMERIC,
  description_en TEXT,
  description_tr TEXT
);

CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_tr TEXT NOT NULL,
  brand TEXT,
  description_en TEXT,
  description_tr TEXT,
  supplement_category supplement_category_enum NOT NULL,
  form supplement_form_enum NOT NULL,
  serving_size_info TEXT, 
  servings_per_container INT, 
  calories_per_serving NUMERIC DEFAULT 0,
  protein_per_serving NUMERIC DEFAULT 0,
  carbs_per_serving NUMERIC DEFAULT 0,
  fat_per_serving NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplement_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE NOT NULL,
  micronutrient_id UUID REFERENCES micronutrients(id) ON DELETE CASCADE NOT NULL,
  amount_per_serving NUMERIC NOT NULL,
  UNIQUE(supplement_id, micronutrient_id)
);

CREATE TABLE IF NOT EXISTS user_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE NOT NULL,
  quantity_remaining NUMERIC, 
  reminder_times TEXT[], 
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, supplement_id)
);

CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE NOT NULL,
  servings_taken NUMERIC NOT NULL DEFAULT 1, 
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id ON professional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_professional_id ON ratings(professional_id);
CREATE INDEX IF NOT EXISTS idx_distance_sales_user_id ON distance_sales_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_id ON nutrition_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_supplements_brand_category ON supplements(supplement_category, brand);
CREATE INDEX IF NOT EXISTS idx_supplement_ingredients_bridge ON supplement_ingredients(supplement_id, micronutrient_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_user_id ON user_supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_id_date ON supplement_logs(user_id, logged_at);
-- ==========================================
-- SEEDING MICRONUTRIENTS (VITAMINS & MINERALS)
-- ==========================================
DO $$
DECLARE
  vit_a UUID; vit_b1 UUID; vit_b2 UUID; vit_b3 UUID; vit_b5 UUID; 
  vit_b6 UUID; vit_b7 UUID; vit_b9 UUID; vit_b12 UUID; vit_c UUID; 
  vit_d3 UUID; vit_e UUID; vit_k1 UUID; vit_k2 UUID;
  min_ca UUID; min_mg UUID; min_zn UUID; min_fe UUID; min_i UUID;
  min_se UUID; min_cu UUID; min_mn UUID; min_cr UUID; min_na UUID; min_k UUID;
  amino_bcaa UUID; amino_leucine UUID; amino_citrulline UUID; amino_beta UUID;
  sup_creatine UUID; sup_whey UUID; sup_multi UUID; sup_zma UUID;
BEGIN
  -- 1. INSERT VITAMINS
  INSERT INTO micronutrients (name_en, name_tr, category, measurement_unit, daily_value_target, description_en, description_tr) VALUES
  ('Vitamin A', 'A Vitamini', 'vitamin', 'mcg', 900, 'Essential for vision, immune system, and reproduction.', 'G�rme, ba����kl�k sistemi ve �reme i�in gereklidir.'),
  ('Vitamin B1 (Thiamin)', 'B1 Vitamini (Tiamin)', 'vitamin', 'mg', 1.2, 'Helps turn food into energy. Keeps nervous system healthy.', 'Yiyecekleri enerjiye d�n��t�r�r. Sinir sistemini korur.'),
  ('Vitamin B2 (Riboflavin)', 'B2 Vitamini (Riboflavin)', 'vitamin', 'mg', 1.3, 'Important for body growth and red blood cell production.', 'V�cut geli�imi ve k�rm�z� kan h�cresi �retimi i�in �nemlidir.'),
  ('Vitamin B3 (Niacin)', 'B3 Vitamini (Niasin)', 'vitamin', 'mg', 16, 'Helps keep nervous system, digestive system and skin healthy.', 'Sinir sistemi, sindirim ve cilt sa�l���n� korur.'),
  ('Vitamin B5 (Pantothenic Acid)', 'B5 Vitamini (Pantotenik Asit)', 'vitamin', 'mg', 5, 'Essential for breaking down fats and carbohydrates for energy.', 'Ya� ve karbonhidratlar�n metabolizmas� i�in gereklidir.'),
  ('Vitamin B6 (Pyridoxine)', 'B6 Vitamini (Piridoksin)', 'vitamin', 'mg', 1.3, 'Helps the body make neurotransmitters and red blood cells.', 'Sinir ileticileri ve k�rm�z� kan h�cresi yap�m�na yard�mc�d�r.'),
  ('Vitamin B7 (Biotin)', 'B7 Vitamini (Biotin)', 'vitamin', 'mcg', 30, 'Essential for metabolism and healthy skin, hair, and nails.', 'Metabolizma, sa�, cilt ve t�rnak sa�l��� i�in gereklidir.'),
  ('Vitamin B9 (Folate/Folic Acid)', 'B9 Vitamini (Folik Asit)', 'vitamin', 'mcg', 400, 'Crucial for proper brain function and mental/emotional health.', 'Beyin fonksiyonlar� ve zihinsel sa�l�k i�in �ok kritiktir.'),
  ('Vitamin B12 (Cobalamin)', 'B12 Vitamini (Kobalamin)', 'vitamin', 'mcg', 2.4, 'Essential for nerve tissue health, brain function, and red blood cells.', 'Sinir dokusu, beyin ve kan h�creleri i�in gereklidir.'),
  ('Vitamin C (Ascorbic Acid)', 'C Vitamini (Askorbik Asit)', 'vitamin', 'mg', 90, 'Antioxidant, supports immune system and collagen production.', 'Antioksidand�r, ba����kl�k ve kolajen �retimini destekler.'),
  ('Vitamin D3 (Cholecalciferol)', 'D3 Vitamini (Kolekalsiferol)', 'vitamin', 'IU', 800, 'Vital for bone health and calcium absorption. Synthesized from sunlight.', 'Kemik sa�l��� ve kalsiyum emilimi i�in hayati. G�ne�ten sentezlenir.'),
  ('Vitamin E (Tocopherol)', 'E Vitamini (Tokoferol)', 'vitamin', 'mg', 15, 'Powerful antioxidant that protects cells from damage.', 'H�creleri hasardan koruyan g��l� bir antioksidand�r.'),
  ('Vitamin K1', 'K1 Vitamini', 'vitamin', 'mcg', 120, 'Crucial for blood clotting.', 'Kan�n p�ht�la�mas� i�in �ok �nemlidir.'),
  ('Vitamin K2', 'K2 Vitamini', 'vitamin', 'mcg', 100, 'Directs calcium to bones and away from arteries.', 'Kalsiyumu damarlar yerine kemiklere y�nlendirir.')
  ON CONFLICT DO NOTHING;

  -- FETCH VITAMIN IDs
  SELECT id INTO vit_c FROM micronutrients WHERE name_en = 'Vitamin C (Ascorbic Acid)';
  SELECT id INTO vit_d3 FROM micronutrients WHERE name_en = 'Vitamin D3 (Cholecalciferol)';
  SELECT id INTO vit_b12 FROM micronutrients WHERE name_en = 'Vitamin B12 (Cobalamin)';
  SELECT id INTO vit_b6 FROM micronutrients WHERE name_en = 'Vitamin B6 (Pyridoxine)';
  SELECT id INTO vit_e FROM micronutrients WHERE name_en = 'Vitamin E (Tocopherol)';

  -- 2. INSERT MINERALS
  INSERT INTO micronutrients (name_en, name_tr, category, measurement_unit, daily_value_target, description_en, description_tr) VALUES
  ('Calcium', 'Kalsiyum', 'mineral', 'mg', 1000, 'Builds and maintains strong bones.', 'Kemikleri g��lendirir ve korur.'),
  ('Magnesium', 'Magnezyum', 'mineral', 'mg', 400, 'Crucial for muscle function, nerve function, and energy production.', 'Kas, sinir fonksiyonlar� ve enerji �retimi i�in kritik.'),
  ('Zinc', '�inko', 'mineral', 'mg', 11, 'Supports immune system and metabolism function.', 'Ba����kl�k ve metabolizma fonksiyonlar�n� destekler.'),
  ('Iron', 'Demir', 'mineral', 'mg', 18, 'Essential for blood production and oxygen transport.', 'Kan �retimi ve oksijen ta��n�m� i�in gereklidir.'),
  ('Iodine', '�yot', 'mineral', 'mcg', 150, 'Needed for cells to change food into energy. Thyroid health.', 'Tiroid sa�l��� ve enerji d�n���m� i�in gereklidir.'),
  ('Selenium', 'Selenyum', 'mineral', 'mcg', 55, 'Plays a critical role in reproduction, thyroid gland function.', '�reme ve tiroid fonksiyonlar�nda kritik rol oynar.'),
  ('Copper', 'Bak�r', 'mineral', 'mg', 0.9, 'Works with iron to help the body form red blood cells.', 'K�rm�z� kan h�creleri olu�umunda demirle birlikte �al���r.'),
  ('Manganese', 'Manganez', 'mineral', 'mg', 2.3, 'Helps body form connective tissue, bones, and blood clotting factors.', 'Konektif doku, kemik ve p�ht�la�ma fakt�rleri i�in yard�mc�d�r.'),
  ('Chromium', 'Krom', 'mineral', 'mcg', 35, 'Enhances the action of insulin.', '�ns�linin etkisini art�r�r.'),
  ('Sodium', 'Sodyum', 'mineral', 'mg', 2300, 'Conducts nerve impulses, contracts and relaxes muscles.', 'Sinir iletimi ve kas fonksiyonlar� i�in elektrolit.'),
  ('Potassium', 'Potasyum', 'mineral', 'mg', 3400, 'Helps maintain normal levels of fluid inside our cells.', 'H�cre i�i s�v� dengesini sa�lar.')
  ON CONFLICT DO NOTHING;

  -- FETCH MINERAL IDs
  SELECT id INTO min_mg FROM micronutrients WHERE name_en = 'Magnesium';
  SELECT id INTO min_zn FROM micronutrients WHERE name_en = 'Zinc';
  SELECT id INTO min_ca FROM micronutrients WHERE name_en = 'Calcium';
  SELECT id INTO min_fe FROM micronutrients WHERE name_en = 'Iron';

  -- 3. INSERT AMINO ACIDS / EXTRACTS
  INSERT INTO micronutrients (name_en, name_tr, category, measurement_unit, description_en, description_tr) VALUES
  ('Creatine Monohydrate', 'Kreatin Monohidrat', 'amino_acid', 'g', 'Enhances physical performance in successive bursts of short-term, high intensity exercise.', 'K�sa s�reli ve y�ksek yo�unluklu egzersizlerde performans� art�r�r.'),
  ('L-Leucine', 'L-L�sin', 'amino_acid', 'g', 'Primary BCAA for muscle protein synthesis.', 'Kas protein sentezi i�in anahtar BCAA.'),
  ('Citrulline Malate', 'Sitr�lin Malat', 'amino_acid', 'g', 'Nitric oxide booster, enhances blood flow and pump.', 'Nitrik oksit art�r�c�, kan ak���n� h�zland�r�r ve pump sa�lar.'),
  ('Beta-Alanine', 'Beta-Alanin', 'amino_acid', 'g', 'Buffers lactic acid, reducing muscle fatigue.', 'Laktik asit birikimini �teleyerek kas yorgunlu�unu azalt�r.'),
  ('L-Carnitine', 'L-Karnitin', 'amino_acid', 'g', 'Transports fatty acids into mitochondria to be burned for energy.', 'Ya� asitlerini mitokondriye ta��yarak enerji olarak yak�lmas�n� sa�lar.')
  ON CONFLICT DO NOTHING;

  -- 4. INSERT REAL SUPPLEMENT CONTAINERS (CATALOG)
  INSERT INTO supplements (name_en, name_tr, brand, supplement_category, form, serving_size_info, servings_per_container, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving)
  VALUES
  ('Gold Standard 100% Whey', 'Gold Standard %100 Whey Protein', 'Optimum Nutrition', 'protein_powder', 'powder', '1 Scoop (31g)', 73, 120, 24, 3, 1.5),
  ('Essential AmiN.O. Energy', 'Essential AmiN.O. Energy', 'Optimum Nutrition', 'pre_workout', 'powder', '2 Scoops (9g)', 30, 10, 0, 2, 0),
  ('Platinum 100% Creatine', 'Platinum %100 Kreatin', 'MuscleTech', 'other', 'powder', '1 Scoop (5g)', 80, 0, 0, 0, 0),
  ('ZMA Sleep Recovery', 'ZMA Uyku Kompleksi', 'Optimum Nutrition', 'multivitamin', 'capsule', '3 Capsules', 30, 0, 0, 0, 0),
  ('Daily Multivitamin', 'G�nl�k Multivitamin', 'Nature''s Bounty', 'multivitamin', 'pill', '1 Tablet', 100, 0, 0, 0, 0);

  -- 5. LINK SUPPLEMENTS WITH THEIR INGREDIENTS
  SELECT id INTO sup_creatine FROM supplements WHERE name_en = 'Platinum 100% Creatine' LIMIT 1;
  SELECT id INTO amino_bcaa FROM micronutrients WHERE name_en = 'Creatine Monohydrate' LIMIT 1;

  IF sup_creatine IS NOT NULL AND amino_bcaa IS NOT NULL THEN
    INSERT INTO supplement_ingredients (supplement_id, micronutrient_id, amount_per_serving)
    VALUES (sup_creatine, amino_bcaa, 5.0) ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO sup_zma FROM supplements WHERE name_en = 'ZMA Sleep Recovery' LIMIT 1;
  
  IF sup_zma IS NOT NULL THEN
    INSERT INTO supplement_ingredients (supplement_id, micronutrient_id, amount_per_serving)
    VALUES 
      (sup_zma, min_mg, 450),
      (sup_zma, min_zn, 30),
      (sup_zma, vit_b6, 10.5)
    ON CONFLICT DO NOTHING;
  END IF;
    
  SELECT id INTO sup_multi FROM supplements WHERE name_en = 'Daily Multivitamin' LIMIT 1;
  
  IF sup_multi IS NOT NULL THEN
    INSERT INTO supplement_ingredients (supplement_id, micronutrient_id, amount_per_serving)
    VALUES 
      (sup_multi, vit_c, 500),
      (sup_multi, vit_d3, 1000),
      (sup_multi, vit_b12, 10),
      (sup_multi, min_ca, 200),
      (sup_multi, min_fe, 5)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
