-- ENUM TYPES
-- Status, type, category gibi string union parametreleri için enum'lar.
CREATE TYPE activity_level_enum AS ENUM ('sedentary', 'light', 'moderate', 'active', 'very_active');
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE health_metric_source_enum AS ENUM ('apple_health', 'google_health');
CREATE TYPE relationship_status_enum AS ENUM ('pending', 'active', 'ended');
CREATE TYPE ai_insight_type_enum AS ENUM ('physique_analysis', 'meal_plan', 'recipe', 'health_insight');
CREATE TYPE notification_type_enum AS ENUM ('reminder', 'insight', 'achievement', 'system');
CREATE TYPE subscription_type_enum AS ENUM ('free', 'premium');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'expired');
CREATE TYPE xp_source_enum AS ENUM ('workout', 'nutrition', 'mission', 'streak', 'bonus', 'store');
CREATE TYPE store_category_enum AS ENUM ('booster', 'utility', 'cosmetic');
CREATE TYPE mission_category_enum AS ENUM ('workout', 'nutrition', 'wellness', 'social');
CREATE TYPE mission_status_enum AS ENUM ('active', 'completed', 'expired');
CREATE TYPE ai_program_type_enum AS ENUM ('workout', 'nutrition');
CREATE TYPE agreement_type_enum AS ENUM ('terms', 'kvkk', 'privacy');

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  height NUMERIC,
  weight NUMERIC,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER PROFILES TABLE
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  goals TEXT,
  activity_level activity_level_enum DEFAULT 'sedentary',
  dietary_preferences TEXT,
  dietary_restrictions TEXT,
  personal_trainer_id UUID, -- REFERENCES personal_trainers(id) -- if we create it later
  dietitian_id UUID,        -- REFERENCES dietitians(id) -- if we create it later
  data_sharing_permissions JSONB DEFAULT '{}'::JSONB,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WORKOUT SESSIONS TABLE
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of WorkoutExercise objects
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INT, -- seconds
  calories_burned NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NUTRITION ENTRIES TABLE
CREATE TABLE nutrition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  food_items JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of NutritionFoodItem objects
  meal_type meal_type_enum NOT NULL,
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HEALTH METRICS TABLE
CREATE TABLE health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sleep_hours NUMERIC DEFAULT 0,
  sleep_quality NUMERIC DEFAULT 0,
  steps INT DEFAULT 0,
  active_minutes INT DEFAULT 0,
  calories_burned NUMERIC DEFAULT 0,
  resting_heart_rate INT DEFAULT 0,
  avg_heart_rate INT DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  stress_level NUMERIC DEFAULT 0,
  source health_metric_source_enum,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- PERSONAL TRAINERS TABLE
CREATE TABLE personal_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  certification TEXT,
  specialties TEXT[],
  experience INT DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DIETITIANS TABLE
CREATE TABLE dietitians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  license TEXT,
  specialties TEXT[],
  experience INT DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENT RELATIONSHIPS TABLE
CREATE TABLE client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES personal_trainers(id) ON DELETE SET NULL,
  dietitian_id UUID REFERENCES dietitians(id) ON DELETE SET NULL,
  status relationship_status_enum DEFAULT 'pending',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  commission_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI INSIGHTS TABLE
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type ai_insight_type_enum NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type_enum NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS TABLE
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type subscription_type_enum DEFAULT 'free',
  status subscription_status_enum DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAGUE TIERS TABLE
CREATE TABLE league_tiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_tr TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  min_xp INT NOT NULL DEFAULT 0
);

-- LEAGUE GROUPS TABLE
CREATE TABLE league_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id INT REFERENCES league_tiers(id) ON DELETE CASCADE NOT NULL,
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  members JSONB NOT NULL DEFAULT '[]'::JSONB -- Array of LeagueGroupMember
);

-- USER LEAGUES TABLE
CREATE TABLE user_leagues (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  league_id INT REFERENCES league_tiers(id) NOT NULL,
  current_xp INT DEFAULT 0,
  weekly_xp INT DEFAULT 0,
  rank INT,
  group_id UUID REFERENCES league_groups(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id)
);

-- XP TRANSACTIONS TABLE
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  source xp_source_enum NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STORE ITEMS TABLE
CREATE TABLE store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_tr TEXT NOT NULL,
  description TEXT NOT NULL,
  description_tr TEXT NOT NULL,
  icon TEXT NOT NULL,
  category store_category_enum NOT NULL,
  price_points INT DEFAULT 0,
  price_gems INT DEFAULT 0,
  effect_type TEXT,
  effect_value NUMERIC,
  effect_duration_minutes INT,
  max_stack INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

-- USER INVENTORY ITEMS TABLE
CREATE TABLE user_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE NOT NULL,
  quantity INT DEFAULT 1,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- USER CURRENCIES TABLE
CREATE TABLE user_currencies (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  points INT DEFAULT 0,
  gems INT DEFAULT 0,
  total_earned_points INT DEFAULT 0,
  total_spent_points INT DEFAULT 0
);

-- WEEKLY MISSIONS TABLE
CREATE TABLE weekly_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_tr TEXT NOT NULL,
  description TEXT NOT NULL,
  description_tr TEXT NOT NULL,
  category mission_category_enum NOT NULL,
  target_value NUMERIC NOT NULL,
  current_progress NUMERIC DEFAULT 0,
  xp_reward INT DEFAULT 0,
  points_reward INT DEFAULT 0,
  status mission_status_enum DEFAULT 'active',
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL
);

-- DAILY MISSIONS TABLE
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_tr TEXT NOT NULL,
  description TEXT NOT NULL,
  description_tr TEXT NOT NULL,
  category mission_category_enum NOT NULL, -- same as weekly minus social usually
  target_value NUMERIC NOT NULL,
  current_progress NUMERIC DEFAULT 0,
  xp_reward INT DEFAULT 0,
  status mission_status_enum DEFAULT 'active',
  date DATE NOT NULL
);

-- BODY PHOTOS TABLE
CREATE TABLE body_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  analysis_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI GENERATED PROGRAMS TABLE
CREATE TABLE ai_generated_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type ai_program_type_enum NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- or JSONB if you store structured data
  based_on_photo UUID REFERENCES body_photos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER AGREEMENTS TABLE
CREATE TABLE user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  agreement_type agreement_type_enum NOT NULL,
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- INDEXES (Sık sorgulananlar için performans ayarları)
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_nutrition_entries_user_id ON nutrition_entries(user_id);
CREATE INDEX idx_health_metrics_user_id_date ON health_metrics(user_id, date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_user_inventory_user_id ON user_inventory_items(user_id);
