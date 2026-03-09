-- BioSync Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create users table if not exists (matches Supabase Auth structure)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    raw_user_meta_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (already exists, but adding new columns)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_type TEXT CHECK (professional_type IN ('trainer', 'dietitian'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS location JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.10;

-- Professional Profiles Table
CREATE TABLE IF NOT EXISTS professional_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    professional_type TEXT NOT NULL CHECK (professional_type IN ('trainer', 'dietitian')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    profile_image TEXT,
    bio TEXT,
    specialties TEXT[] DEFAULT '{}',
    experience INTEGER DEFAULT 0, -- years
    certifications TEXT[] DEFAULT '{}',
    location JSONB DEFAULT '{}',
    availability JSONB DEFAULT '{}',
    pricing JSONB DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 0.10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
    professional_type TEXT NOT NULL CHECK (professional_type IN ('trainer', 'dietitian')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    location JSONB DEFAULT '{}',
    helpful_count INTEGER DEFAULT 0,
    response JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Relationships Table
CREATE TABLE IF NOT EXISTS client_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
    professional_type TEXT NOT NULL CHECK (professional_type IN ('trainer', 'dietitian')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    commission_paid BOOLEAN DEFAULT FALSE,
    commission_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplements Table
CREATE TABLE IF NOT EXISTS supplements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL CHECK (category IN ('vitamin', 'mineral', 'protein', 'pre_workout', 'post_workout', 'other')),
    type TEXT NOT NULL CHECK (type IN ('tablet', 'capsule', 'powder', 'liquid', 'gummy')),
    dosage TEXT NOT NULL,
    unit TEXT NOT NULL,
    serving_size TEXT NOT NULL,
    ingredients TEXT[] DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    side_effects TEXT[] DEFAULT '{}',
    warnings TEXT[] DEFAULT '{}',
    interactions TEXT[] DEFAULT '{}',
    contraindications TEXT[] DEFAULT '{}',
    recommended_intake JSONB DEFAULT '{}',
    price JSONB DEFAULT '{}',
    availability BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplement Logs Table
CREATE TABLE IF NOT EXISTS supplement_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplement Plans Table
CREATE TABLE IF NOT EXISTS supplement_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    supplements JSONB DEFAULT '{}',
    duration INTEGER DEFAULT 30, -- days
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vitamins Table
CREATE TABLE IF NOT EXISTS vitamins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    chemical_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fat_soluble', 'water_soluble')),
    form TEXT NOT NULL CHECK (form IN ('tablet', 'capsule', 'powder', 'liquid', 'injectable', 'gummy')),
    dosage JSONB DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    food_sources TEXT[] DEFAULT '{}',
    deficiency_symptoms TEXT[] DEFAULT '{}',
    excess_symptoms TEXT[] DEFAULT '{}',
    interactions TEXT[] DEFAULT '{}',
    absorption JSONB DEFAULT '{}',
    storage TEXT,
    stability TEXT,
    safety_considerations TEXT[] DEFAULT '{}',
    daily_value DECIMAL(10,2),
    unit TEXT NOT NULL,
    price JSONB DEFAULT '{}',
    availability BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vitamin Logs Table
CREATE TABLE IF NOT EXISTS vitamin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vitamin_id UUID REFERENCES vitamins(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vitamin Plans Table
CREATE TABLE IF NOT EXISTS vitamin_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    vitamins JSONB DEFAULT '{}',
    duration INTEGER DEFAULT 30, -- days
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Minerals Table
CREATE TABLE IF NOT EXISTS minerals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    chemical_formula TEXT NOT NULL,
    common_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('macro', 'trace', 'ultra_trace')),
    form TEXT NOT NULL CHECK (form IN ('tablet', 'capsule', 'powder', 'liquid', 'injectable')),
    dosage JSONB DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    food_sources TEXT[] DEFAULT '{}',
    deficiency_symptoms TEXT[] DEFAULT '{}',
    excess_symptoms TEXT[] DEFAULT '{}',
    interactions TEXT[] DEFAULT '{}',
    absorption JSONB DEFAULT '{}',
    safety_considerations TEXT[] DEFAULT '{}',
    daily_value DECIMAL(10,2),
    unit TEXT NOT NULL,
    price JSONB DEFAULT '{}',
    availability BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mineral Logs Table
CREATE TABLE IF NOT EXISTS mineral_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mineral_id UUID REFERENCES minerals(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mineral Plans Table
CREATE TABLE IF NOT EXISTS mineral_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    minerals JSONB DEFAULT '{}',
    duration INTEGER DEFAULT 30, -- days
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id ON professional_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_location ON professional_profiles USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_type ON professional_profiles(professional_type);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_active ON professional_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_rating ON professional_profiles(average_rating);

CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_professional_id ON ratings(professional_id);
CREATE INDEX IF NOT EXISTS idx_ratings_type ON ratings(professional_type);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_date ON ratings(date);

CREATE INDEX IF NOT EXISTS idx_client_relationships_client_id ON client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_professional_id ON client_relationships(professional_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_status ON client_relationships(status);

CREATE INDEX IF NOT EXISTS idx_supplements_name ON supplements USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_supplements_category ON supplements(category);
CREATE INDEX IF NOT EXISTS idx_supplements_verified ON supplements(is_verified);

CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_id ON supplement_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_logs_supplement_id ON supplement_logs(supplement_id);
CREATE INDEX IF NOT EXISTS idx_supplement_logs_taken_at ON supplement_logs(taken_at);

CREATE INDEX IF NOT EXISTS idx_vitamins_name ON vitamins USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_vitamins_type ON vitamins(type);
CREATE INDEX IF NOT EXISTS idx_vitamins_verified ON vitamins(is_verified);

CREATE INDEX IF NOT EXISTS idx_vitamin_logs_user_id ON vitamin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vitamin_logs_vitamin_id ON vitamin_logs(vitamin_id);
CREATE INDEX IF NOT EXISTS idx_vitamin_logs_taken_at ON vitamin_logs(taken_at);

CREATE INDEX IF NOT EXISTS idx_minerals_name ON minerals USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_minerals_type ON minerals(type);
CREATE INDEX IF NOT EXISTS idx_minerals_verified ON minerals(is_verified);

CREATE INDEX IF NOT EXISTS idx_mineral_logs_user_id ON mineral_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mineral_logs_mineral_id ON mineral_logs(mineral_id);
CREATE INDEX IF NOT EXISTS idx_mineral_logs_taken_at ON mineral_logs(taken_at);

-- RLS (Row Level Security) Policies
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitamin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitamin_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mineral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mineral_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Professional Profiles
CREATE POLICY "Users can view all professional profiles" ON professional_profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Professionals can update their own profile" ON professional_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Professionals can insert their own profile" ON professional_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ratings
CREATE POLICY "Users can view all ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON ratings FOR DELETE USING (auth.uid() = user_id);

-- Client Relationships
CREATE POLICY "Users can view their own relationships" ON client_relationships FOR SELECT USING (auth.uid() = client_id OR auth.uid() = professional_id);
CREATE POLICY "Users can insert their own relationships" ON client_relationships FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Professionals can update their relationships" ON client_relationships FOR UPDATE USING (auth.uid() = professional_id);
CREATE POLICY "Users can delete their own relationships" ON client_relationships FOR DELETE USING (auth.uid() = client_id);

-- Supplement Logs
CREATE POLICY "Users can view their own supplement logs" ON supplement_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own supplement logs" ON supplement_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own supplement logs" ON supplement_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own supplement logs" ON supplement_logs FOR DELETE USING (auth.uid() = user_id);

-- Supplement Plans
CREATE POLICY "Users can view their own supplement plans" ON supplement_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own supplement plans" ON supplement_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own supplement plans" ON supplement_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own supplement plans" ON supplement_plans FOR DELETE USING (auth.uid() = user_id);

-- Vitamin Logs
CREATE POLICY "Users can view their own vitamin logs" ON vitamin_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vitamin logs" ON vitamin_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vitamin logs" ON vitamin_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vitamin logs" ON vitamin_logs FOR DELETE USING (auth.uid() = user_id);

-- Vitamin Plans
CREATE POLICY "Users can view their own vitamin plans" ON vitamin_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vitamin plans" ON vitamin_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vitamin plans" ON vitamin_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vitamin plans" ON vitamin_plans FOR DELETE USING (auth.uid() = user_id);

-- Mineral Logs
CREATE POLICY "Users can view their own mineral logs" ON mineral_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mineral logs" ON mineral_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mineral logs" ON mineral_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mineral logs" ON mineral_logs FOR DELETE USING (auth.uid() = user_id);

-- Mineral Plans
CREATE POLICY "Users can view their own mineral plans" ON mineral_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mineral plans" ON mineral_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mineral plans" ON mineral_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mineral plans" ON mineral_plans FOR DELETE USING (auth.uid() = user_id);

-- Supplements (Read-only for users - admin manages)
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view verified supplements" ON supplements FOR SELECT USING (is_verified = TRUE);
CREATE POLICY "Only admins can insert supplements" ON supplements FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));
CREATE POLICY "Only admins can update supplements" ON supplements FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));
CREATE POLICY "Only admins can delete supplements" ON supplements FOR DELETE USING (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));

-- Vitamins (Read-only for users - admin manages)
ALTER TABLE vitamins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view verified vitamins" ON vitamins FOR SELECT USING (is_verified = TRUE);
CREATE POLICY "Only admins can insert vitamins" ON vitamins FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));
CREATE POLICY "Only admins can update vitamins" ON vitamins FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));
CREATE POLICY "Only admins can delete vitamins" ON vitamins FOR DELETE USING (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));

-- Minerals (Read-only for users - admin manages)
ALTER TABLE minerals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view verified minerals" ON minerals FOR SELECT USING (is_verified = TRUE);
CREATE POLICY "Only admins can insert minerals" ON minerals FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));
CREATE POLICY "Only admins can update minerals" ON minerals FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));
CREATE POLICY "Only admins can delete minerals" ON minerals FOR DELETE USING (auth.uid() IN (SELECT user_id FROM professional_profiles WHERE is_verified = TRUE));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_professional_profiles_updated_at
    BEFORE UPDATE ON professional_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_client_relationships_updated_at
    BEFORE UPDATE ON client_relationships
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_supplement_logs_updated_at
    BEFORE UPDATE ON supplement_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_supplement_plans_updated_at
    BEFORE UPDATE ON supplement_plans
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_vitamin_logs_updated_at
    BEFORE UPDATE ON vitamin_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_vitamin_plans_updated_at
    BEFORE UPDATE ON vitamin_plans
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_mineral_logs_updated_at
    BEFORE UPDATE ON mineral_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_mineral_plans_updated_at
    BEFORE UPDATE ON mineral_plans
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Triggers for supplements, vitamins, minerals (reference tables)
CREATE TRIGGER set_supplements_updated_at
    BEFORE UPDATE ON supplements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_vitamins_updated_at
    BEFORE UPDATE ON vitamins
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_minerals_updated_at
    BEFORE UPDATE ON minerals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- Note: Uncomment and replace with actual user UUIDs before inserting
-- ============================================

/*
-- Insert sample vitamins
INSERT INTO vitamins (name, chemical_name, type, form, dosage, benefits, food_sources, deficiency_symptoms, daily_value, unit) VALUES
('Vitamin A', 'Retinol', 'fat_soluble', 'tablet', '{"adults": {"recommended": "900 IU", "maximum": "3000 IU"}, "children": {"recommended": "400 IU", "maximum": "900 IU"}}', 
 ARRAY['Vision health', 'Immune function', 'Cell growth'], 
 ARRAY['Carrots', 'Sweet potatoes', 'Spinach', 'Liver'], 
 ARRAY['Night blindness', 'Dry skin', 'Infections'], 900, 'IU'),
('Vitamin C', 'Ascorbic Acid', 'water_soluble', 'tablet', '{"adults": {"recommended": "90 mg", "maximum": "2000 mg"}, "children": {"recommended": "25 mg", "maximum": "400 mg"}}', 
 ARRAY['Immune support', 'Antioxidant', 'Collagen production'], 
 ARRAY['Citrus fruits', 'Bell peppers', 'Broccoli', 'Strawberries'], 
 ARRAY['Scurvy', 'Poor wound healing', 'Fatigue'], 90, 'mg'),
('Vitamin D', 'Cholecalciferol', 'fat_soluble', 'tablet', '{"adults": {"recommended": "800 IU", "maximum": "4000 IU"}, "children": {"recommended": "600 IU", "maximum": "1000 IU"}}', 
 ARRAY['Bone health', 'Immune function', 'Calcium absorption'], 
 ARRAY['Sunlight', 'Fatty fish', 'Egg yolks', 'Fortified milk'], 
 ARRAY['Rickets', 'Osteoporosis', 'Muscle weakness'], 800, 'IU'),
('Vitamin E', 'Tocopherol', 'fat_soluble', 'capsule', '{"adults": {"recommended": "15 IU", "maximum": "1000 IU"}, "children": {"recommended": "6 IU", "maximum": "300 IU"}}', 
 ARRAY['Antioxidant', 'Skin health', 'Heart health'], 
 ARRAY['Nuts', 'Seeds', 'Vegetable oils', 'Spinach'], 
 ARRAY['Neurological problems', 'Muscle weakness', 'Vision problems'], 15, 'IU'),
('Vitamin K', 'Phylloquinone', 'fat_soluble', 'tablet', '{"adults": {"recommended": "90 mcg", "maximum": "75 mcg"}, "children": {"recommended": "30 mcg", "maximum": "75 mcg"}}', 
 ARRAY['Blood clotting', 'Bone health', 'Heart health'], 
 ARRAY['Leafy greens', 'Broccoli', 'Brussels sprouts', 'Fermented foods'], 
 ARRAY['Excessive bleeding', 'Bruising', 'Bone fractures'], 90, 'mcg');

-- Insert sample minerals
INSERT INTO minerals (name, chemical_formula, common_name, type, form, dosage, benefits, food_sources, deficiency_symptoms, daily_value, unit) VALUES
('Calcium', 'Ca', 'Calcium', 'macro', 'tablet', '{"adults": {"recommended": "1000 mg", "maximum": "2500 mg"}, "children": {"recommended": "200 mg", "maximum": "2500 mg"}}', 
 ARRAY['Bone health', 'Muscle function', 'Nerve transmission'], 
 ARRAY['Dairy products', 'Leafy greens', 'Fortified foods', 'Sardines'], 
 ARRAY['Osteoporosis', 'Muscle cramps', 'Weak bones'], 1000, 'mg'),
('Iron', 'Fe', 'Iron', 'trace', 'tablet', '{"adults": {"recommended": "8 mg", "maximum": "45 mg"}, "children": {"recommended": "10 mg", "maximum": "40 mg"}}', 
 ARRAY['Oxygen transport', 'Energy production', 'Immune function'], 
 ARRAY['Red meat', 'Spinach', 'Beans', 'Fortified cereals'], 
 ARRAY['Anemia', 'Fatigue', 'Weakness', 'Pale skin'], 8, 'mg'),
('Magnesium', 'Mg', 'Magnesium', 'macro', 'tablet', '{"adults": {"recommended": "400 mg", "maximum": "1000 mg"}, "children": {"recommended": "240 mg", "maximum": "400 mg"}}', 
 ARRAY['Muscle function', 'Nerve function', 'Heart rhythm'], 
 ARRAY['Nuts', 'Seeds', 'Whole grains', 'Dark chocolate'], 
 ARRAY['Muscle cramps', 'Irregular heartbeat', 'Fatigue', 'Anxiety'], 400, 'mg'),
('Zinc', 'Zn', 'Zinc', 'trace', 'tablet', '{"adults": {"recommended": "11 mg", "maximum": "40 mg"}, "children": {"recommended": "15 mg", "maximum": "40 mg"}}', 
 ARRAY['Immune function', 'Wound healing', 'DNA synthesis'], 
 ARRAY['Oysters', 'Beef', 'Pumpkin seeds', 'Lentils'], 
 ARRAY['Impaired immunity', 'Hair loss', 'Loss of appetite', 'Delayed wound healing'], 11, 'mg'),
('Selenium', 'Se', 'Selenium', 'trace', 'tablet', '{"adults": {"recommended": "55 mcg", "maximum": "200 mcg"}, "children": {"recommended": "30 mcg", "maximum": "100 mcg"}}', 
 ARRAY['Thyroid function', 'Antioxidant', 'Immune function'], 
 ARRAY['Brazil nuts', 'Seafood', 'Eggs', 'Brown rice'], 
 ARRAY['Thyroid problems', 'Weakened immune system', 'Hair loss', 'Fatigue'], 55, 'mcg');

-- Insert sample supplements
INSERT INTO supplements (name, brand, category, type, dosage, unit, serving_size, ingredients, benefits, side_effects, warnings, interactions, recommended_intake, price) VALUES
('Whey Protein Isolate', 'Optimum Nutrition', 'protein', 'powder', '25g', 'g', '1 scoop', 
 ARRAY['Whey protein isolate', 'Natural flavors', 'Stevia'], 
 ARRAY['Muscle building', 'Recovery', 'Weight management'], 
 ARRAY['Bloating', 'Gas', 'Allergic reactions'], 
 ARRAY['Contains dairy', 'Consult doctor if pregnant'], 
 ARRAY['May interfere with certain medications'], 
 '{"min": 20, "max": 50, "unit": "g", "frequency": "daily"}', 
 '{"min": 25, "max": 35, "currency": "USD"}'),
('Creatine Monohydrate', 'MuscleTech', 'other', 'powder', '5g', 'g', '1 scoop', 
 ARRAY['Creatine monohydrate'], 
 ARRAY['Strength', 'Power', 'Muscle mass'], 
 ARRAY['Water retention', 'Stomach cramps'], 
 ARRAY['Drink plenty of water', 'Consult doctor if kidney issues'], 
 ARRAY['May interact with diuretics'], 
 '{"min": 3, "max": 5, "unit": "g", "frequency": "daily"}', 
 '{"min": 15, "max": 25, "currency": "USD"}'),
('Omega-3 Fish Oil', 'Nordic Naturals', 'other', 'capsule', '1000mg', 'mg', '1 capsule', 
 ARRAY['Fish oil', 'EPA', 'DHA'], 
 ARRAY['Heart health', 'Brain function', 'Anti-inflammatory'], 
 ARRAY['Fishy aftertaste', 'Indigestion'], 
 ARRAY['May cause bleeding', 'Consult doctor if on blood thinners'], 
 ARRAY['May interact with blood thinners'], 
 '{"min": 500, "max": 2000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 40, "currency": "USD"}'),
('Multivitamin', 'Centrum', 'vitamin', 'tablet', '1 tablet', 'tablet', '1 tablet', 
 ARRAY['Vitamin A', 'B vitamins', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Minerals'], 
 ARRAY['Overall health', 'Nutrient gaps', 'Energy'], 
 ARRAY['Nausea', 'Headache', 'Stomach upset'], 
 ARRAY['Take with food', 'Do not exceed recommended dose'], 
 ARRAY['May interact with certain medications'], 
 '{"min": 1, "max": 1, "unit": "tablet", "frequency": "daily"}', 
 '{"min": 10, "max": 20, "currency": "USD"}'),
('Pre-Workout', 'C4', 'pre_workout', 'powder', '1 scoop', 'scoop', '1 scoop', 
 ARRAY['Beta-alanine', 'Caffeine', 'Creatine', 'Arginine'], 
 ARRAY['Energy', 'Focus', 'Performance', 'Pump'], 
 ARRAY['Jitters', 'Anxiety', 'Sleep issues'], 
 ARRAY['High caffeine content', 'Do not exceed recommended dose'], 
 ARRAY['May interact with stimulants'], 
 '{"min": 1, "max": 2, "unit": "scoop", "frequency": "pre-workout"}', 
 '{"min": 25, "max": 45, "currency": "USD"}');

-- Sample professional profile (for testing)
INSERT INTO professional_profiles (
    user_id, professional_type, first_name, last_name, email, bio, 
    specialties, experience, certifications, location, availability, 
    pricing, languages, is_verified, average_rating, total_ratings
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'trainer',
    'John',
    'Doe',
    'john.doe@example.com',
    'Certified personal trainer with 10+ years of experience in strength training and nutrition.',
    ARRAY['Strength Training', 'Weight Loss', 'Muscle Building', 'Nutrition'],
    10,
    ARRAY['NASM-CPT', 'CSCS', 'Precision Nutrition Level 1'],
    '{"city": "Antalya", "district": "Konyaaltı", "country": "Turkey", "latitude": 36.8792, "longitude": 30.6654}',
    '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}',
    '{"consultationFee": 50, "monthlyPackage": 200, "sessionRate": 40}',
    ARRAY['English', 'Turkish'],
    true,
    4.8,
    25
);

-- Sample rating (for testing)
INSERT INTO ratings (
    user_id, professional_id, professional_type, rating, review, 
    verified, location
) VALUES (
    '00000000-0000-0000-0000-000000000002', -- Replace with actual user ID
    '00000000-0000-0000-0000-000000000001',
    'trainer',
    5,
    'Excellent trainer! Very knowledgeable and motivating. Helped me achieve my fitness goals.',
    true,
    '{"city": "Antalya", "district": "Konyaaltı", "country": "Turkey"}'
);

-- Sample client relationship (for testing)
INSERT INTO client_relationships (
    client_id, professional_id, professional_type, status, 
    commission_amount, notes
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'trainer',
    'active',
    20.00,
    'Client is making great progress with strength training program.'
);
*/

-- Functions for location-based search
CREATE OR REPLACE FUNCTION search_professionals_by_location(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km INTEGER,
    professional_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    professional_id UUID,
    distance_km DECIMAL,
    professional_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.user_id as professional_id,
        (6371 * acos(
            cos(radians(user_lat)) * 
            cos(radians((pp.location->>'latitude')::DECIMAL)) * 
            cos(radians((pp.location->>'longitude')::DECIMAL) - radians(user_lng)) + 
            sin(radians(user_lat)) * 
            sin(radians((pp.location->>'latitude')::DECIMAL))
        )) as distance_km,
        row_to_json(pp.*) as professional_data
    FROM professional_profiles pp
    WHERE 
        pp.is_active = true
        AND pp.location->>'latitude' IS NOT NULL
        AND pp.location->>'longitude' IS NOT NULL
        AND (professional_type IS NULL OR pp.professional_type = professional_type)
        AND (6371 * acos(
            cos(radians(user_lat)) * 
            cos(radians((pp.location->>'latitude')::DECIMAL)) * 
            cos(radians((pp.location->>'longitude')::DECIMAL) - radians(user_lng)) + 
            sin(radians(user_lat)) * 
            sin(radians((pp.location->>'latitude')::DECIMAL))
        )) <= radius_km
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to update professional rating
CREATE OR REPLACE FUNCTION update_professional_rating(
    professional_id UUID
)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL;
    total_ratings INTEGER;
BEGIN
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, total_ratings
    FROM ratings
    WHERE professional_id = update_professional_rating.professional_id;
    
    UPDATE professional_profiles
    SET 
        average_rating = avg_rating,
        total_ratings = total_ratings,
        updated_at = NOW()
    WHERE user_id = professional_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update professional rating when rating is added/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_professional_rating(NEW.professional_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professional_rating_on_insert
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_professional_rating();

CREATE TRIGGER update_professional_rating_on_update
    AFTER UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_professional_rating();

CREATE TRIGGER update_professional_rating_on_delete
    AFTER DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_professional_rating();

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    relationship_id UUID,
    commission_rate DECIMAL DEFAULT 0.10
)
RETURNS DECIMAL AS $$
DECLARE
    commission_amount DECIMAL;
    monthly_fee DECIMAL := 200; -- Default monthly fee
BEGIN
    SELECT monthly_fee * commission_rate
    INTO commission_amount;
    
    UPDATE client_relationships
    SET 
        commission_amount = commission_amount,
        commission_paid = true,
        updated_at = NOW()
    WHERE id = relationship_id;
    
    RETURN commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Views for common queries
CREATE OR REPLACE VIEW professional_profiles_with_ratings AS
SELECT 
    pp.*,
    COALESCE(AVG(r.rating), 0) as calculated_rating,
    COUNT(r.id) as rating_count
FROM professional_profiles pp
LEFT JOIN ratings r ON pp.user_id = r.professional_id
WHERE pp.is_active = true
GROUP BY pp.id;

CREATE OR REPLACE VIEW top_rated_professionals AS
SELECT 
    pp.*,
    AVG(r.rating) as avg_rating,
    COUNT(r.id) as rating_count
FROM professional_profiles pp
LEFT JOIN ratings r ON pp.user_id = r.professional_id
WHERE pp.is_active = true
GROUP BY pp.id
HAVING COUNT(r.id) >= 5
ORDER BY avg_rating DESC, rating_count DESC
LIMIT 50;

-- ============================================
-- FRIENDSHIP SYSTEM
-- ============================================

-- Friend Requests Table (Arkadaşlık İstekleri)
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Friendships Table (Arkadaşlık İlişkileri)
CREATE TABLE IF NOT EXISTS friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'muted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Friend Activities Table (Arkadaş Aktiviteleri)
CREATE TABLE IF NOT EXISTS friend_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('workout_completed', 'goal_achieved', 'supplement_taken', 'weight_update', 'meal_logged')),
    activity_data JSONB DEFAULT '{}',
    visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('private', 'friends', 'public')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend Workout Shares Table (Antrenman Paylaşımları)
CREATE TABLE IF NOT EXISTS friend_workout_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    workout_data JSONB NOT NULL,
    shared_with UUID[] DEFAULT '{}',
    caption TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend Comments Table (Yorumlar)
CREATE TABLE IF NOT EXISTS friend_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_share_id UUID REFERENCES friend_workout_shares(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend Likes Table (Beğeniler)
CREATE TABLE IF NOT EXISTS friend_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_share_id UUID REFERENCES friend_workout_shares(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workout_share_id, user_id)
);

-- Indexes for Friendship Tables
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

CREATE INDEX IF NOT EXISTS idx_friend_activities_user_id ON friend_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_activities_type ON friend_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_friend_activities_created ON friend_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_friend_workout_shares_user ON friend_workout_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_workout_shares_created ON friend_workout_shares(created_at);

CREATE INDEX IF NOT EXISTS idx_friend_comments_workout ON friend_comments(workout_share_id);
CREATE INDEX IF NOT EXISTS idx_friend_likes_workout ON friend_likes(workout_share_id);

-- RLS for Friendship Tables
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_workout_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_likes ENABLE ROW LEVEL SECURITY;

-- Friend Requests RLS Policies
CREATE POLICY "Users can view their own friend requests" ON friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can update friend request status" ON friend_requests FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete their own requests" ON friend_requests FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friendships RLS Policies
CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own friendships" ON friendships FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own friendships" ON friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend Activities RLS Policies
CREATE POLICY "Users can view friends activities" ON friend_activities FOR SELECT USING (
    auth.uid() = user_id OR 
    visibility = 'public' OR 
    (visibility = 'friends' AND EXISTS (
        SELECT 1 FROM friendships f 
        WHERE (f.user_id = auth.uid() AND f.friend_id = friend_activities.user_id) OR 
              (f.friend_id = auth.uid() AND f.user_id = friend_activities.user_id)
    ))
);
CREATE POLICY "Users can create their own activities" ON friend_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON friend_activities FOR DELETE USING (auth.uid() = user_id);

-- Friend Workout Shares RLS Policies
CREATE POLICY "Users can view shared workouts" ON friend_workout_shares FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = ANY(shared_with) OR
    EXISTS (
        SELECT 1 FROM friendships f 
        WHERE (f.user_id = auth.uid() AND f.friend_id = friend_workout_shares.user_id) OR 
              (f.friend_id = auth.uid() AND f.user_id = friend_workout_shares.user_id)
    )
);
CREATE POLICY "Users can share their workouts" ON friend_workout_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own shares" ON friend_workout_shares FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shares" ON friend_workout_shares FOR DELETE USING (auth.uid() = user_id);

-- Friend Comments RLS Policies
CREATE POLICY "Users can view comments on shared workouts" ON friend_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM friend_workout_shares ws
        WHERE ws.id = friend_comments.workout_share_id AND (
            ws.user_id = auth.uid() OR 
            auth.uid() = ANY(ws.shared_with) OR
            EXISTS (
                SELECT 1 FROM friendships f 
                WHERE (f.user_id = auth.uid() AND f.friend_id = ws.user_id) OR 
                      (f.friend_id = auth.uid() AND f.user_id = ws.user_id)
            )
        )
    )
);
CREATE POLICY "Friends can add comments" ON friend_comments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM friend_workout_shares ws
        WHERE ws.id = friend_comments.workout_share_id AND (
            ws.user_id = auth.uid() OR 
            auth.uid() = ANY(ws.shared_with) OR
            EXISTS (
                SELECT 1 FROM friendships f 
                WHERE (f.user_id = auth.uid() AND f.friend_id = ws.user_id) OR 
                      (f.friend_id = auth.uid() AND f.user_id = ws.user_id)
            )
        )
    )
);
CREATE POLICY "Users can delete their own comments" ON friend_comments FOR DELETE USING (auth.uid() = user_id);

-- Friend Likes RLS Policies
CREATE POLICY "Users can view likes" ON friend_likes FOR SELECT USING (true);
CREATE POLICY "Friends can like workouts" ON friend_likes FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM friend_workout_shares ws
        WHERE ws.id = friend_likes.workout_share_id AND (
            ws.user_id = auth.uid() OR 
            auth.uid() = ANY(ws.shared_with) OR
            EXISTS (
                SELECT 1 FROM friendships f 
                WHERE (f.user_id = auth.uid() AND f.friend_id = ws.user_id) OR 
                      (f.friend_id = auth.uid() AND f.user_id = ws.user_id)
            )
        )
    )
);
CREATE POLICY "Users can unlike" ON friend_likes FOR DELETE USING (auth.uid() = user_id);

-- Triggers for Friendship Tables
CREATE TRIGGER set_friend_requests_updated_at
    BEFORE UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_friend_workout_shares_updated_at
    BEFORE UPDATE ON friend_workout_shares
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_friend_comments_updated_at
    BEFORE UPDATE ON friend_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Functions for Friendship System

-- Function to accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_sender_id UUID;
    v_receiver_id UUID;
BEGIN
    SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
    FROM friend_requests WHERE id = request_id;
    
    -- Update request status
    UPDATE friend_requests SET status = 'accepted', updated_at = NOW() WHERE id = request_id;
    
    -- Create bidirectional friendship
    INSERT INTO friendships (user_id, friend_id, status) VALUES (v_sender_id, v_receiver_id, 'active');
    INSERT INTO friendships (user_id, friend_id, status) VALUES (v_receiver_id, v_sender_id, 'active');
END;
$$ LANGUAGE plpgsql;

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE (friend_id UUID, friendship_status TEXT, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT f.friend_id, f.status, f.created_at
    FROM friendships f
    WHERE f.user_id = user_uuid AND f.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to get friend feed activities
CREATE OR REPLACE FUNCTION get_friend_feed(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    activity_id UUID,
    friend_user_id UUID,
    activity_type TEXT,
    activity_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fa.id as activity_id,
        fa.user_id as friend_user_id,
        fa.activity_type,
        fa.activity_data,
        fa.created_at
    FROM friend_activities fa
    WHERE fa.visibility IN ('friends', 'public')
    AND EXISTS (
        SELECT 1 FROM friendships f 
        WHERE (f.user_id = user_uuid AND f.friend_id = fa.user_id AND f.status = 'active') OR
              (f.friend_id = user_uuid AND f.user_id = fa.user_id AND f.status = 'active')
    )
    ORDER BY fa.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update like count on workout share
CREATE OR REPLACE FUNCTION update_workout_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE friend_workout_shares SET likes_count = likes_count + 1 WHERE id = NEW.workout_share_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE friend_workout_shares SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.workout_share_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count_trigger
    AFTER INSERT OR DELETE ON friend_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_likes_count();

-- Function to update comments count on workout share
CREATE OR REPLACE FUNCTION update_workout_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE friend_workout_shares SET comments_count = comments_count + 1 WHERE id = NEW.workout_share_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE friend_workout_shares SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.workout_share_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_count_trigger
    AFTER INSERT OR DELETE ON friend_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_comments_count();

-- Views for Friendship System
CREATE OR REPLACE VIEW user_friends_view AS
SELECT 
    f.user_id,
    f.friend_id,
    u.email as friend_email,
    u.raw_user_meta_data->>'full_name' as friend_name,
    f.status,
    f.created_at
FROM friendships f
JOIN auth.users u ON f.friend_id = u.id
WHERE f.status = 'active';

CREATE OR REPLACE VIEW pending_friend_requests_view AS
SELECT 
    fr.id as request_id,
    fr.sender_id,
    fr.receiver_id,
    sender.email as sender_email,
    sender.raw_user_meta_data->>'full_name' as sender_name,
    fr.message,
    fr.created_at
FROM friend_requests fr
JOIN auth.users sender ON fr.sender_id = sender.id
WHERE fr.status = 'pending';

-- ============================================
-- NOTE: exercises ve food_items tabloları zaten mevcut
-- Bu tablolar uygulamada kullanılan hazır veri tablolarıdır
-- ============================================

-- ============================================
-- OPTIMIZATIONS & IMPROVEMENTS
-- ============================================

-- 1. POSTGIS EXTENSION (for large-scale location queries)
-- Enable PostGIS for better location-based search performance
-- Note: Requires PostGIS extension to be installed on Supabase
/*
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column for faster queries
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS location_geo GEOGRAPHY(POINT, 4326);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_professional_profiles_geo ON professional_profiles USING GIST(location_geo);

-- Function to update geography point from JSON
CREATE OR REPLACE FUNCTION update_geo_point()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location_geo := ST_SetSRID(ST_MakePoint(
        (NEW.location->>'longitude')::float8,
        (NEW.location->>'latitude')::float8
    ), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update geography point
CREATE TRIGGER set_geo_point
    BEFORE INSERT OR UPDATE ON professional_profiles
    FOR EACH ROW
    WHEN (NEW.location->>'longitude' IS NOT NULL AND NEW.location->>'latitude' IS NOT NULL)
    EXECUTE FUNCTION update_geo_point();

-- Optimized location search using PostGIS
CREATE OR REPLACE FUNCTION search_professionals_by_location_postgis(
    user_lng DECIMAL,
    user_lat DECIMAL,
    radius_km INTEGER,
    professional_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    professional_id UUID,
    distance_km DECIMAL,
    professional_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.user_id as professional_id,
        ST_Distance(pp.location_geo, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000.0 as distance_km,
        row_to_json(pp.*) as professional_data
    FROM professional_profiles pp
    WHERE 
        pp.is_active = true
        AND pp.location_geo IS NOT NULL
        AND (professional_type IS NULL OR pp.professional_type = professional_type)
        AND ST_DWithin(
            pp.location_geo,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            radius_km * 1000
        )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
*/

-- 2. NORMALIZED AVAILABILITY & PRICING TABLES (for complex filtering)
-- For complex queries like "Monday morning available trainers in Istanbul"
-- Consider these normalized tables instead of JSONB:

-- Professional Availability Table (normalized)
CREATE TABLE IF NOT EXISTS professional_availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    time_slot TEXT NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'night')),
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professional_id, day_of_week, time_slot)
);

-- Professional Pricing Table (normalized)
CREATE TABLE IF NOT EXISTS professional_pricing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    duration_minutes INTEGER,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professional_id, service_type)
);

-- Indexes for normalized tables
CREATE INDEX IF NOT EXISTS idx_professional_availability_pro ON professional_availability(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_availability_day ON professional_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_professional_availability_time ON professional_availability(time_slot);
CREATE INDEX IF NOT EXISTS idx_professional_pricing_pro ON professional_pricing(professional_id);

-- View for complex availability queries
CREATE OR REPLACE VIEW available_professionals_by_time AS
SELECT 
    pa.professional_id,
    pp.first_name || ' ' || pp.last_name as full_name,
    pa.day_of_week,
    pa.time_slot,
    pa.start_time,
    pa.end_time,
    pp.location->>'city' as city,
    pp.location->>'district' as district,
    pp.professional_type
FROM professional_availability pa
JOIN professional_profiles pp ON pa.professional_id = pp.id
WHERE pa.is_available = TRUE AND pp.is_active = TRUE;

-- 3. BIDIRECTIONAL FRIEND REQUEST PREVENTION
-- Prevent A→B request when B→A already exists

-- Function to check for existing reverse request
CREATE OR REPLACE FUNCTION check_existing_friend_request()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Check if there's already a request in the opposite direction
    SELECT COUNT(*) INTO existing_count
    FROM friend_requests
    WHERE sender_id = NEW.receiver_id 
    AND receiver_id = NEW.sender_id
    AND status IN ('pending', 'accepted');
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'A friend request already exists between these users';
    END IF;
    
    -- Also check if they're already friends
    SELECT COUNT(*) INTO existing_count
    FROM friendships
    WHERE (user_id = NEW.sender_id AND friend_id = NEW.receiver_id)
    OR (user_id = NEW.receiver_id AND friend_id = NEW.sender_id);
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Users are already friends';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce bidirectional check
CREATE TRIGGER prevent_duplicate_friend_request
    BEFORE INSERT ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION check_existing_friend_request();

-- Alternative: Function-based approach for checking request validity
CREATE OR REPLACE FUNCTION can_send_friend_request(sender UUID, receiver UUID)
RETURNS BOOLEAN AS $$
DECLARE
    existing_request INTEGER;
    existing_friendship INTEGER;
BEGIN
    -- Check for existing request in any direction
    SELECT COUNT(*) INTO existing_request
    FROM friend_requests
    WHERE (
        (sender_id = sender AND receiver_id = receiver) OR
        (sender_id = receiver AND receiver_id = sender)
    )
    AND status IN ('pending', 'accepted');
    
    IF existing_request > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for existing friendship
    SELECT COUNT(*) INTO existing_friendship
    FROM friendships
    WHERE (user_id = sender AND friend_id = receiver)
    OR (user_id = receiver AND friend_id = sender);
    
    IF existing_friendship > 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STREAK SYSTEM (Seri Sistemi) - Snapchat & Duolingo mantığı
-- ============================================

-- COMBINED DAILY STREAK - Tek seri, tüm servisler için
CREATE TABLE IF NOT EXISTS user_daily_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_days_active INTEGER DEFAULT 0,
    streak_start_date DATE,
    grace_used BOOLEAN DEFAULT FALSE,
    grace_remaining INTEGER DEFAULT 1,
    freeze_remaining INTEGER DEFAULT 3,
    -- Hangi servisler aktif edildi (örn: workout, nutrition, supplement)
    active_services TEXT[] DEFAULT '{}',
    -- Günlük puan (her servisten puan toplanır)
    daily_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Daily Streak Activity Log - Her gün yapılan aktiviteler
CREATE TABLE IF NOT EXISTS daily_streak_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Hangi servisler kullanıldı
    services_used TEXT[] DEFAULT '{}',
    -- Her servis için puan
    workout_points INTEGER DEFAULT 0,
    nutrition_points INTEGER DEFAULT 0,
    supplement_points INTEGER DEFAULT 0,
    vitamin_points INTEGER DEFAULT 0,
    water_points INTEGER DEFAULT 0,
    sleep_points INTEGER DEFAULT 0,
    meditation_points INTEGER DEFAULT 0,
    friend_interaction_points INTEGER DEFAULT 0,
    -- Toplam günlük puan
    total_points INTEGER DEFAULT 0,
    -- Seri devam etti mi
    streak_maintained BOOLEAN DEFAULT TRUE,
    -- Arkadaşla mı yapıldı
    friend_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

-- Daily Streak Milestones - Tek seri için rozetler
CREATE TABLE IF NOT EXISTS daily_streak_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    milestone_days INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    badge_icon TEXT,
    reward_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Daily Streak Milestones
CREATE TABLE IF NOT EXISTS user_daily_streak_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    milestone_days INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, milestone_days)
);

-- Indexes for Daily Streak Tables
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user ON user_daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_current ON user_daily_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streak_activities_user ON daily_streak_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streak_activities_date ON daily_streak_activities(activity_date);

-- RLS for Daily Streak Tables
ALTER TABLE user_daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streak_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_streak_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their daily streak" ON user_daily_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their daily streak" ON user_daily_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert daily streak" ON user_daily_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view daily activities" ON daily_streak_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can log daily activities" ON daily_streak_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their daily milestones" ON user_daily_streak_milestones FOR SELECT USING (auth.uid() = user_id);

-- Trigger for daily streak updated_at
CREATE TRIGGER set_daily_streaks_updated_at
    BEFORE UPDATE ON user_daily_streaks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Main Function: Update combined daily streak
-- Herhangi bir servis aktivitesi tüm seriyi günceller
CREATE OR REPLACE FUNCTION update_daily_streak(
    user_uuid UUID,
    service_type TEXT, -- 'workout', 'nutrition', 'supplement', vb.
    points_earned INTEGER DEFAULT 1,
    friend_uuid UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    last_activity DATE;
    current_streak_count INTEGER;
    new_streak INTEGER;
    days_diff INTEGER;
    result JSONB;
    services_today TEXT[];
    total_points_today INTEGER;
    streak_broken BOOLEAN := FALSE;
BEGIN
    -- Get current daily streak info
    SELECT ds.current_streak, ds.last_activity_date, ds.active_services, ds.daily_points
    INTO current_streak_count, last_activity, services_today, total_points_today
    FROM user_daily_streaks ds
    WHERE ds.user_id = user_uuid;
    
    -- If no daily streak record exists, create one
    IF current_streak_count IS NULL THEN
        INSERT INTO user_daily_streaks (
            user_id, current_streak, longest_streak, last_activity_date, 
            total_days_active, streak_start_date, active_services, daily_points
        )
        VALUES (user_uuid, 1, 1, CURRENT_DATE, 1, CURRENT_DATE, ARRAY[service_type], points_earned);
        
        new_streak := 1;
        services_today := ARRAY[service_type];
        total_points_today := points_earned;
    ELSE
        -- Check if already active today
        IF last_activity = CURRENT_DATE THEN
            -- Already active today - just add service and points
            UPDATE user_daily_streaks 
            SET active_services = array_append(active_services, service_type),
                daily_points = daily_points + points_earned,
                updated_at = NOW()
            WHERE user_id = user_uuid;
            
            new_streak := current_streak_count;
            services_today := array_append(services_today, service_type);
            total_points_today := total_points_today + points_earned;
        ELSE
            -- Calculate days since last activity
            days_diff := CURRENT_DATE - last_activity;
            
            IF days_diff = 1 THEN
                -- Perfect! Streak continues - new day, new services
                new_streak := current_streak_count + 1;
                UPDATE user_daily_streaks 
                SET current_streak = new_streak,
                    longest_streak = GREATEST(longest_streak, new_streak),
                    last_activity_date = CURRENT_DATE,
                    total_days_active = total_days_active + 1,
                    active_services = ARRAY[service_type],
                    daily_points = points_earned,
                    updated_at = NOW()
                WHERE user_id = user_uuid;
                
                services_today := ARRAY[service_type];
                total_points_today := points_earned;
                
            ELSIF days_diff = 2 THEN
                -- One day missed - check if grace can be used
                UPDATE user_daily_streaks 
                SET current_streak = CASE 
                        WHEN grace_remaining > 0 THEN current_streak_count + 1
                        ELSE 1
                    END,
                    longest_streak = CASE 
                        WHEN grace_remaining > 0 THEN GREATEST(longest_streak, current_streak_count + 1)
                        ELSE longest_streak
                    END,
                    last_activity_date = CURRENT_DATE,
                    total_days_active = total_days_active + 1,
                    grace_used = CASE WHEN grace_remaining > 0 THEN TRUE ELSE grace_used END,
                    grace_remaining = GREATEST(grace_remaining - 1, 0),
                    streak_start_date = CASE WHEN grace_remaining = 0 THEN CURRENT_DATE ELSE streak_start_date END,
                    active_services = ARRAY[service_type],
                    daily_points = points_earned,
                    updated_at = NOW()
                WHERE user_id = user_uuid
                RETURNING current_streak INTO new_streak;
                
                services_today := ARRAY[service_type];
                total_points_today := points_earned;
                
                IF (SELECT grace_remaining FROM user_daily_streaks WHERE user_id = user_uuid) = 0 AND days_diff > 1 THEN
                    streak_broken := TRUE;
                END IF;
            ELSE
                -- Streak broken (more than 1 day missed and no grace)
                new_streak := 1;
                streak_broken := TRUE;
                UPDATE user_daily_streaks 
                SET current_streak = 1,
                    last_activity_date = CURRENT_DATE,
                    total_days_active = total_days_active + 1,
                    grace_remaining = 1, -- Reset grace
                    streak_start_date = CURRENT_DATE,
                    active_services = ARRAY[service_type],
                    daily_points = points_earned,
                    updated_at = NOW()
                WHERE user_id = user_uuid;
                
                services_today := ARRAY[service_type];
                total_points_today := points_earned;
            END IF;
        END IF;
    END IF;
    
    -- Log daily activity
    INSERT INTO daily_streak_activities (
        user_id, activity_date, services_used, 
        workout_points, nutrition_points, supplement_points,
        vitamin_points, water_points, sleep_points, meditation_points,
        friend_interaction_points, total_points, streak_maintained, friend_id
    )
    VALUES (
        user_uuid, CURRENT_DATE, services_today,
        CASE WHEN service_type = 'workout' THEN points_earned ELSE 0 END,
        CASE WHEN service_type = 'nutrition' THEN points_earned ELSE 0 END,
        CASE WHEN service_type = 'supplement' THEN points_earned ELSE 0 END,
        CASE WHEN service_type = 'vitamin' THEN points_earned ELSE 0 END,
        CASE WHEN service_type = 'water' THEN points_earned ELSE 0 END,
        CASE WHEN service_type = 'sleep' THEN points_earned ELSE 0 END,
        CASE WHEN service_type = 'meditation' THEN points_earned ELSE 0 END,
        CASE WHEN friend_uuid IS NOT NULL THEN points_earned ELSE 0 END,
        total_points_today,
        NOT streak_broken,
        friend_uuid
    )
    ON CONFLICT (user_id, activity_date) 
    DO UPDATE SET
        services_used = array_append(daily_streak_activities.services_used, service_type),
        workout_points = daily_streak_activities.workout_points + CASE WHEN service_type = 'workout' THEN points_earned ELSE 0 END,
        nutrition_points = daily_streak_activities.nutrition_points + CASE WHEN service_type = 'nutrition' THEN points_earned ELSE 0 END,
        supplement_points = daily_streak_activities.supplement_points + CASE WHEN service_type = 'supplement' THEN points_earned ELSE 0 END,
        vitamin_points = daily_streak_activities.vitamin_points + CASE WHEN service_type = 'vitamin' THEN points_earned ELSE 0 END,
        water_points = daily_streak_activities.water_points + CASE WHEN service_type = 'water' THEN points_earned ELSE 0 END,
        sleep_points = daily_streak_activities.sleep_points + CASE WHEN service_type = 'sleep' THEN points_earned ELSE 0 END,
        meditation_points = daily_streak_activities.meditation_points + CASE WHEN service_type = 'meditation' THEN points_earned ELSE 0 END,
        friend_interaction_points = daily_streak_activities.friend_interaction_points + CASE WHEN friend_uuid IS NOT NULL THEN points_earned ELSE 0 END,
        total_points = daily_streak_activities.total_points + points_earned,
        friend_id = COALESCE(daily_streak_activities.friend_id, friend_uuid);
    
    -- Update friendship streak if friend is provided
    IF friend_uuid IS NOT NULL THEN
        PERFORM update_friendship_streak(user_uuid, friend_uuid);
    END IF;
    
    -- Check for milestones
    PERFORM check_daily_streak_milestone(user_uuid, new_streak);
    
    -- Send notification data (for push notification)
    result := jsonb_build_object(
        'streak_type', 'daily_combined',
        'current_streak', new_streak,
        'services_today', services_today,
        'total_points', total_points_today,
        'streak_broken', streak_broken,
        'grace_used', days_diff = 2 AND NOT streak_broken,
        'notification_text', CASE 
            WHEN streak_broken THEN '🔥 Serin sıfırlandı! Yeniden başla!'
            WHEN new_streak = 1 AND days_diff > 1 THEN '🌟 Yeni seri başlattın!'
            WHEN new_streak % 7 = 0 THEN '🎉 ' || new_streak || ' günlük seri! Harikasın!'
            ELSE '🔥 ' || new_streak || ' günlük seri devam ediyor!'
        END,
        'next_milestone', (
            SELECT MIN(milestone_days) 
            FROM daily_streak_milestones 
            WHERE milestone_days > new_streak
        ),
        'date', CURRENT_DATE
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check daily streak status (for notification scheduling)
CREATE OR REPLACE FUNCTION get_daily_streak_status(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    ds RECORD;
    days_diff INTEGER;
    result JSONB;
BEGIN
    SELECT * INTO ds
    FROM user_daily_streaks
    WHERE user_id = user_uuid;
    
    IF ds IS NULL THEN
        RETURN jsonb_build_object(
            'has_streak', FALSE,
            'current_streak', 0,
            'status', 'no_streak'
        );
    END IF;
    
    days_diff := CURRENT_DATE - ds.last_activity_date;
    
    result := jsonb_build_object(
        'has_streak', TRUE,
        'current_streak', ds.current_streak,
        'days_diff', days_diff,
        'status', CASE
            WHEN days_diff = 0 THEN 'active_today'
            WHEN days_diff = 1 THEN 'continue_today'
            WHEN days_diff = 2 AND ds.grace_remaining > 0 THEN 'use_grace_today'
            ELSE 'streak_at_risk'
        END,
        'grace_remaining', ds.grace_remaining,
        'freeze_remaining', ds.freeze_remaining,
        'needs_notification', days_diff >= 1,
        'notification_urgency', CASE
            WHEN days_diff = 1 THEN 'reminder' -- Hatırlatma
            WHEN days_diff = 2 AND ds.grace_remaining > 0 THEN 'warning' -- Uyarı
            ELSE 'critical' -- Kritik
        END,
        'active_services', ds.active_services,
        'services_needed', ARRAY(
            SELECT s 
            FROM unnest(ARRAY['workout', 'nutrition', 'supplement', 'water']) s
            WHERE s != ALL(ds.active_services)
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award daily streak milestone
CREATE OR REPLACE FUNCTION check_daily_streak_milestone(user_uuid UUID, current_streak_count INTEGER)
RETURNS VOID AS $$
DECLARE
    milestone_record RECORD;
BEGIN
    FOR milestone_record IN 
        SELECT * FROM daily_streak_milestones 
        WHERE milestone_days <= current_streak_count
    LOOP
        INSERT INTO user_daily_streak_milestones (user_id, milestone_days)
        VALUES (user_uuid, milestone_record.milestone_days)
        ON CONFLICT (user_id, milestone_days) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to freeze daily streak
CREATE OR REPLACE FUNCTION freeze_daily_streak(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    freeze_count INTEGER;
BEGIN
    SELECT freeze_remaining INTO freeze_count
    FROM user_daily_streaks
    WHERE user_id = user_uuid;
    
    IF freeze_count > 0 THEN
        UPDATE user_daily_streaks
        SET freeze_remaining = freeze_remaining - 1,
            last_activity_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = user_uuid;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Sample daily streak milestones (Türkçe)
INSERT INTO daily_streak_milestones (milestone_days, title, description, badge_icon, reward_points) VALUES
(3, 'Başlangıç', '3 günlük süper seri!', '🔥', 10),
(7, 'Haftalık Kahraman', 'Bir hafta hiç bırakmadın!', '🏆', 25),
(14, 'İki Haftalık Savaşçı', 'İki haftalık efsane!', '💪', 50),
(21, '21 Günlük Alışkanlık', 'Alışkanlık oluştu!', '🎯', 75),
(30, 'Aylık Usta', 'Bir ay boyunca devam!', '🥇', 100),
(60, 'Çifte Aylık', 'İki ay! Muhteşem!', '🏋️', 200),
(90, 'Üç Aylık Şampiyon', '90 gün! Efsanesin!', '💎', 300),
(100, 'Yüzlük', '100 gün! Legend!', '👑', 500),
(180, 'Yarı Yıllık', '6 ay! İnanılmaz!', '🌟', 750),
(365, 'Yıllık Titan', 'Bir yıl! Sen bir makinesin!', '🏆', 1000)
ON CONFLICT DO NOTHING;

-- View: Daily streak leaderboard
CREATE OR REPLACE VIEW daily_streak_leaderboard AS
SELECT 
    ds.user_id,
    u.raw_user_meta_data->>'full_name' as user_name,
    ds.current_streak,
    ds.longest_streak,
    ds.total_days_active,
    ds.active_services,
    ds.daily_points,
    RANK() OVER (ORDER BY ds.current_streak DESC) as rank
FROM user_daily_streaks ds
JOIN auth.users u ON ds.user_id = u.id
WHERE ds.current_streak > 0
ORDER BY ds.current_streak DESC;

-- View: Daily streak status for notifications
CREATE OR REPLACE VIEW daily_streak_notifications AS
SELECT 
    ds.user_id,
    ds.current_streak,
    CURRENT_DATE - ds.last_activity_date as days_since_activity,
    ds.grace_remaining,
    CASE 
        WHEN CURRENT_DATE - ds.last_activity_date = 1 THEN 'reminder'
        WHEN CURRENT_DATE - ds.last_activity_date = 2 AND ds.grace_remaining > 0 THEN 'warning'
        WHEN CURRENT_DATE - ds.last_activity_date >= 2 THEN 'critical'
        ELSE 'none'
    END as notification_type,
    CASE 
        WHEN CURRENT_DATE - ds.last_activity_date = 1 THEN 
            '🔥 ' || ds.current_streak || ' günlük serini devam ettir! Bugün aktivite yapmalısın!'
        WHEN CURRENT_DATE - ds.last_activity_date = 2 AND ds.grace_remaining > 0 THEN 
            '⚠️ Dikkat! Serin kırılmak üzere! Son ' || ds.grace_remaining || ' affedici hakkın kaldı!'
        WHEN CURRENT_DATE - ds.last_activity_date >= 2 THEN 
            '💔 Serin kırıldı! Ama yeniden başlayabilirsin!'
        ELSE NULL
    END as notification_message
FROM user_daily_streaks ds
WHERE CURRENT_DATE - ds.last_activity_date >= 1;

-- User Streaks Table - Her servis için ayrı streak (opsiyonel, detaylı takip için)
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    streak_type TEXT NOT NULL CHECK (streak_type IN ('workout', 'supplement', 'vitamin', 'mineral', 'nutrition', 'water', 'sleep', 'meditation', 'friendship')),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_activities INTEGER DEFAULT 0,
    streak_start_date DATE,
    grace_used BOOLEAN DEFAULT FALSE, -- 1 gün affedici kullanıldı mı
    grace_remaining INTEGER DEFAULT 1, -- Kalan affedici gün sayısı
    freeze_remaining INTEGER DEFAULT 3, -- Kalan dondurma hakkı (streak dondurma)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- Friendship Streaks Table - Arkadaşlık serileri
CREATE TABLE IF NOT EXISTS friendship_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_interaction_date DATE,
    total_interactions INTEGER DEFAULT 0,
    streak_start_date DATE,
    grace_used BOOLEAN DEFAULT FALSE,
    grace_remaining INTEGER DEFAULT 1,
    freeze_remaining INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Streak Activity Log - Her aktivite kaydı
CREATE TABLE IF NOT EXISTS streak_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('workout', 'supplement', 'vitamin', 'mineral', 'nutrition', 'water', 'sleep', 'meditation', 'friend_interaction')),
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_data JSONB DEFAULT '{}',
    points_earned INTEGER DEFAULT 1,
    streak_maintained BOOLEAN DEFAULT TRUE,
    friend_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Arkadaşla birlikte yapılan aktivite
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streak Milestones - Ödül seviyeleri
CREATE TABLE IF NOT EXISTS streak_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    streak_type TEXT NOT NULL,
    milestone_days INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    badge_icon TEXT,
    reward_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Streak Milestones - Kazanılan rozetler
CREATE TABLE IF NOT EXISTS user_streak_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    streak_type TEXT NOT NULL,
    milestone_days INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type, milestone_days)
);

-- Indexes for Streak Tables
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON user_streaks(current_streak DESC);

CREATE INDEX IF NOT EXISTS idx_friendship_streaks_user ON friendship_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_friendship_streaks_friend ON friendship_streaks(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendship_streaks_current ON friendship_streaks(current_streak DESC);

CREATE INDEX IF NOT EXISTS idx_streak_activities_user ON streak_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_activities_date ON streak_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_streak_activities_type ON streak_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_streak_activities_friend ON streak_activities(friend_id);

-- RLS for Streak Tables
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendship_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streak_milestones ENABLE ROW LEVEL SECURITY;

-- Streak RLS Policies
CREATE POLICY "Users can view their own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their friendship streaks" ON friendship_streaks FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can update their friendship streaks" ON friendship_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert friendship streaks" ON friendship_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their streak activities" ON streak_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can log their activities" ON streak_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their activities" ON streak_activities FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their milestones" ON user_streak_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can earn milestones" ON user_streak_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for Streak Tables
CREATE TRIGGER set_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_friendship_streaks_updated_at
    BEFORE UPDATE ON friendship_streaks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Function to check and update streak status
CREATE OR REPLACE FUNCTION check_streak_status(user_uuid UUID, streak_type_text TEXT)
RETURNS TABLE (
    current_streak INTEGER,
    is_active BOOLEAN,
    days_since_last_activity INTEGER,
    can_use_grace BOOLEAN,
    grace_remaining_count INTEGER
) AS $$
DECLARE
    last_date DATE;
    streak_count INTEGER;
    grace_remaining_int INTEGER;
BEGIN
    SELECT us.current_streak, us.last_activity_date, us.grace_remaining
    INTO streak_count, last_date, grace_remaining_int
    FROM user_streaks us
    WHERE us.user_id = user_uuid AND us.streak_type = streak_type_text;
    
    IF last_date IS NULL THEN
        RETURN QUERY SELECT 0, FALSE, NULL::INTEGER, FALSE, 0;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT
        streak_count,
        (CURRENT_DATE - last_date) <= 1,
        (CURRENT_DATE - last_date)::INTEGER,
        grace_remaining_int > 0 AND (CURRENT_DATE - last_date) = 2,
        grace_remaining_int;
END;
$$ LANGUAGE plpgsql;

-- Main Function: Update streak on activity (both personal and friendship)
CREATE OR REPLACE FUNCTION update_streak_on_activity(
    user_uuid UUID,
    activity_type_text TEXT,
    friend_uuid UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    last_activity DATE;
    current_streak_count INTEGER;
    new_streak INTEGER;
    days_diff INTEGER;
    result JSONB;
    friendship_updated BOOLEAN := FALSE;
BEGIN
    -- Get current streak info
    SELECT us.current_streak, us.last_activity_date
    INTO current_streak_count, last_activity
    FROM user_streaks us
    WHERE us.user_id = user_uuid AND us.streak_type = activity_type_text;
    
    -- If no streak record exists, create one
    IF current_streak_count IS NULL THEN
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, total_activities, streak_start_date)
        VALUES (user_uuid, activity_type_text, 1, 1, CURRENT_DATE, 1, CURRENT_DATE);
        new_streak := 1;
    ELSE
        -- Calculate days since last activity
        days_diff := CURRENT_DATE - last_activity;
        
        IF days_diff = 0 THEN
            -- Already active today, don't increment but count activity
            UPDATE user_streaks 
            SET total_activities = total_activities + 1,
                updated_at = NOW()
            WHERE user_id = user_uuid AND streak_type = activity_type_text;
            new_streak := current_streak_count;
        ELSIF days_diff = 1 THEN
            -- Perfect! Streak continues
            new_streak := current_streak_count + 1;
            UPDATE user_streaks 
            SET current_streak = new_streak,
                longest_streak = GREATEST(longest_streak, new_streak),
                last_activity_date = CURRENT_DATE,
                total_activities = total_activities + 1,
                updated_at = NOW()
            WHERE user_id = user_uuid AND streak_type = activity_type_text;
        ELSIF days_diff = 2 THEN
            -- One day missed - check if grace can be used
            UPDATE user_streaks 
            SET current_streak = CASE 
                    WHEN grace_remaining > 0 THEN current_streak_count + 1
                    ELSE 1
                END,
                longest_streak = CASE 
                    WHEN grace_remaining > 0 THEN GREATEST(longest_streak, current_streak_count + 1)
                    ELSE longest_streak
                END,
                last_activity_date = CURRENT_DATE,
                total_activities = total_activities + 1,
                grace_used = CASE WHEN grace_remaining > 0 THEN TRUE ELSE grace_used END,
                grace_remaining = GREATEST(grace_remaining - 1, 0),
                streak_start_date = CASE WHEN grace_remaining = 0 THEN CURRENT_DATE ELSE streak_start_date END,
                updated_at = NOW()
            WHERE user_id = user_uuid AND streak_type = activity_type_text
            RETURNING current_streak INTO new_streak;
        ELSE
            -- Streak broken (more than 1 day missed and no grace)
            new_streak := 1;
            UPDATE user_streaks 
            SET current_streak = 1,
                last_activity_date = CURRENT_DATE,
                total_activities = total_activities + 1,
                grace_remaining = 1, -- Reset grace
                streak_start_date = CURRENT_DATE,
                updated_at = NOW()
            WHERE user_id = user_uuid AND streak_type = activity_type_text;
        END IF;
    END IF;
    
    -- Log the activity
    INSERT INTO streak_activities (user_id, activity_type, activity_date, streak_maintained, friend_id)
    VALUES (user_uuid, activity_type_text, CURRENT_DATE, TRUE, friend_uuid);
    
    -- Update friendship streak if friend is provided
    IF friend_uuid IS NOT NULL THEN
        PERFORM update_friendship_streak(user_uuid, friend_uuid);
        friendship_updated := TRUE;
    END IF;
    
    -- Check for milestones
    PERFORM check_streak_milestone(user_uuid, activity_type_text, new_streak);
    
    result := jsonb_build_object(
        'personal_streak', new_streak,
        'activity_type', activity_type_text,
        'friendship_updated', friendship_updated,
        'date', CURRENT_DATE
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update friendship streak
CREATE OR REPLACE FUNCTION update_friendship_streak(user1_uuid UUID, user2_uuid UUID)
RETURNS VOID AS $$
DECLARE
    fs_record RECORD;
    days_diff INTEGER;
BEGIN
    -- Try to get existing streak (in either direction)
    SELECT * INTO fs_record
    FROM friendship_streaks
    WHERE (user_id = user1_uuid AND friend_id = user2_uuid)
       OR (user_id = user2_uuid AND friend_id = user1_uuid)
    LIMIT 1;
    
    IF fs_record IS NULL THEN
        -- Create new friendship streak (bidirectional)
        INSERT INTO friendship_streaks (user_id, friend_id, current_streak, longest_streak, last_interaction_date, total_interactions, streak_start_date)
        VALUES 
            (user1_uuid, user2_uuid, 1, 1, CURRENT_DATE, 1, CURRENT_DATE),
            (user2_uuid, user1_uuid, 1, 1, CURRENT_DATE, 1, CURRENT_DATE);
    ELSE
        -- Update existing streak
        days_diff := CURRENT_DATE - fs_record.last_interaction_date;
        
        IF days_diff = 0 THEN
            -- Already interacted today
            UPDATE friendship_streaks 
            SET total_interactions = total_interactions + 1
            WHERE (user_id = user1_uuid AND friend_id = user2_uuid)
               OR (user_id = user2_uuid AND friend_id = user1_uuid);
        ELSIF days_diff = 1 THEN
            -- Streak continues for both
            UPDATE friendship_streaks 
            SET current_streak = current_streak + 1,
                longest_streak = GREATEST(longest_streak, current_streak + 1),
                last_interaction_date = CURRENT_DATE,
                total_interactions = total_interactions + 1
            WHERE (user_id = user1_uuid AND friend_id = user2_uuid)
               OR (user_id = user2_uuid AND friend_id = user1_uuid);
        ELSIF days_diff = 2 THEN
            -- One day missed - check grace
            UPDATE friendship_streaks 
            SET current_streak = CASE WHEN grace_remaining > 0 THEN current_streak + 1 ELSE 1 END,
                longest_streak = CASE WHEN grace_remaining > 0 THEN GREATEST(longest_streak, current_streak + 1) ELSE longest_streak END,
                last_interaction_date = CURRENT_DATE,
                total_interactions = total_interactions + 1,
                grace_used = CASE WHEN grace_remaining > 0 THEN TRUE ELSE grace_used END,
                grace_remaining = GREATEST(grace_remaining - 1, 0),
                streak_start_date = CASE WHEN grace_remaining = 0 THEN CURRENT_DATE ELSE streak_start_date END
            WHERE (user_id = user1_uuid AND friend_id = user2_uuid)
               OR (user_id = user2_uuid AND friend_id = user1_uuid);
        ELSE
            -- Streak broken
            UPDATE friendship_streaks 
            SET current_streak = 1,
                last_interaction_date = CURRENT_DATE,
                total_interactions = total_interactions + 1,
                grace_remaining = 1,
                streak_start_date = CURRENT_DATE
            WHERE (user_id = user1_uuid AND friend_id = user2_uuid)
               OR (user_id = user2_uuid AND friend_id = user1_uuid);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award milestone
CREATE OR REPLACE FUNCTION check_streak_milestone(user_uuid UUID, streak_type_text TEXT, current_streak_count INTEGER)
RETURNS VOID AS $$
DECLARE
    milestone_record RECORD;
BEGIN
    -- Find applicable milestones
    FOR milestone_record IN 
        SELECT * FROM streak_milestones 
        WHERE streak_type = streak_type_text 
        AND milestone_days <= current_streak_count
    LOOP
        -- Insert milestone if not already achieved
        INSERT INTO user_streak_milestones (user_id, streak_type, milestone_days)
        VALUES (user_uuid, streak_type_text, milestone_record.milestone_days)
        ON CONFLICT (user_id, streak_type, milestone_days) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to freeze streak (streak dondurma)
CREATE OR REPLACE FUNCTION freeze_streak(user_uuid UUID, streak_type_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    freeze_count INTEGER;
BEGIN
    SELECT freeze_remaining INTO freeze_count
    FROM user_streaks
    WHERE user_id = user_uuid AND streak_type = streak_type_text;
    
    IF freeze_count > 0 THEN
        UPDATE user_streaks
        SET freeze_remaining = freeze_remaining - 1,
            last_activity_date = CURRENT_DATE, -- Reset to today to prevent streak break
            updated_at = NOW()
        WHERE user_id = user_uuid AND streak_type = streak_type_text;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's all streaks summary
CREATE OR REPLACE FUNCTION get_user_streaks_summary(user_uuid UUID)
RETURNS TABLE (
    streak_type TEXT,
    current_streak INTEGER,
    longest_streak INTEGER,
    total_activities BIGINT,
    last_activity DATE,
    is_active_today BOOLEAN,
    next_milestone INTEGER,
    grace_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.streak_type,
        us.current_streak,
        us.longest_streak,
        us.total_activities,
        us.last_activity_date,
        (us.last_activity_date = CURRENT_DATE) as is_active_today,
        COALESCE(
            (SELECT MIN(sm.milestone_days) 
             FROM streak_milestones sm 
             WHERE sm.streak_type = us.streak_type 
             AND sm.milestone_days > us.current_streak),
            us.current_streak + 7
        ) as next_milestone,
        us.grace_remaining
    FROM user_streaks us
    WHERE us.user_id = user_uuid
    ORDER BY us.current_streak DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get friendship streaks leaderboard
CREATE OR REPLACE FUNCTION get_friendship_streaks_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    user1_id UUID,
    user1_name TEXT,
    user2_id UUID,
    user2_name TEXT,
    streak_count INTEGER,
    total_interactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fs.user_id,
        u1.raw_user_meta_data->>'full_name',
        fs.friend_id,
        u2.raw_user_meta_data->>'full_name',
        fs.current_streak,
        fs.total_interactions
    FROM friendship_streaks fs
    JOIN auth.users u1 ON fs.user_id = u1.id
    JOIN auth.users u2 ON fs.friend_id = u2.id
    WHERE fs.current_streak > 0
    ORDER BY fs.current_streak DESC, fs.total_interactions DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Sample streak milestones data
INSERT INTO streak_milestones (streak_type, milestone_days, title, description, badge_icon, reward_points) VALUES
-- Workout streaks
('workout', 3, 'Başlangıç', '3 günlük antrenman serisi!', '🔥', 10),
('workout', 7, 'Haftalık Kahraman', 'Bir hafta boyunca hiç bırakmadın!', '🏆', 25),
('workout', 14, 'İki Haftalık Savaşçı', 'İki haftalık süper seri!', '💪', 50),
('workout', 30, 'Aylık Usta', 'Bir ay boyunca devam!', '🥇', 100),
('workout', 60, 'Çifte Aylık', 'İki ay! Harikasın!', '🏋️', 200),
('workout', 100, 'Yüzlük', '100 gün! Efsane!', '👑', 500),
('workout', 365, 'Yıllık Şampiyon', 'Bir yıl! Sen bir makinesin!', '🎯', 1000),

-- Supplement streaks
('supplement', 7, 'Vitamin Ustası', 'Bir hafta düzenli takviye!', '💊', 25),
('supplement', 30, 'Sağlık Takipçisi', 'Bir ay boyunca takviyelerini unutmadın!', '🌟', 100),
('supplement', 90, 'Üç Aylık Rutin', '90 gün süper disiplin!', '💎', 300),

-- Nutrition streaks
('nutrition', 7, 'Sağlıklı Başlangıç', 'Bir hafta sağlıklı beslenme!', '🥗', 25),
('nutrition', 21, '21 Günlük Alışkanlık', '21 gün! Alışkanlık oluştu!', '🍎', 75),
('nutrition', 60, 'İki Aylık Sağlık', 'İki ay sağlıklı yaşam!', '🥑', 200),

-- Water streaks
('water', 7, 'Hidrasyon Ustası', 'Bir hafta yeterli su!', '💧', 25),
('water', 30, 'Su Canavarı', 'Bir ay boyunca hidrate!', '🌊', 100),

-- Sleep streaks
('sleep', 7, 'Düzenli Uyku', 'Bir hafta düzenli uyku!', '😴', 25),
('sleep', 30, 'Uyku Ustası', 'Bir ay kaliteli uyku!', '🌙', 100),

-- Meditation streaks
('meditation', 7, 'Zihin Dinginliği', 'Bir hafta meditasyon!', '🧘', 25),
('meditation', 30, 'Zen Ustası', 'Bir ay iç huzur!', '☮️', 100),

-- Friendship streaks
('friendship', 7, 'Arkadaşlık Başlangıcı', 'Bir hafta beraber aktivite!', '👥', 25),
('friendship', 30, 'Spor Arkadaşları', 'Bir ay beraber antrenman!', '🤝', 100),
('friendship', 100, 'Spor Kuzenleri', '100 gün! Efsane ikili!', '👬', 300)
ON CONFLICT DO NOTHING;

-- View: Daily streak status for all users
CREATE OR REPLACE VIEW daily_streak_status AS
SELECT 
    us.user_id,
    us.streak_type,
    us.current_streak,
    us.last_activity_date,
    CURRENT_DATE - us.last_activity_date as days_since_activity,
    CASE 
        WHEN CURRENT_DATE - us.last_activity_date = 0 THEN 'active_today'
        WHEN CURRENT_DATE - us.last_activity_date = 1 THEN 'continue_streak'
        WHEN CURRENT_DATE - us.last_activity_date = 2 AND us.grace_remaining > 0 THEN 'use_grace'
        ELSE 'streak_at_risk'
    END as streak_status
FROM user_streaks us
WHERE us.current_streak > 0;

-- ============================================
-- PERFORMANCE NOTES
-- ============================================

/*
IMPORTANT NOTES FOR PRODUCTION:

1. PostGIS Extension:
   - For databases with 1000+ professionals, enable PostGIS extension
   - Use geography type with GiST index for lightning-fast spatial queries
   - Current acos/cos method works fine for small datasets (< 1000 rows)

2. JSONB vs Normalized Tables:
   - JSONB (availability, pricing): Good for flexibility, simple queries
   - Normalized Tables: Better for complex filtering ("Monday morning in Istanbul")
   - Consider migrating to normalized tables when:
     * Need to filter by specific day/time combinations
     * Query performance degrades with complex JSONB filters
     * Need to do analytics/aggregations on availability patterns

3. Friend Request Constraints:
   - UNIQUE(sender_id, receiver_id) prevents duplicate same-direction requests
   - Trigger prevents bidirectional duplicates (A→B when B→A exists)
   - Both checks are lightweight and ensure data integrity

4. Streak System Features:
   - Grace days: 1 gün kaçırınca seriyi koruma hakkı
   - Freeze: Streak dondurma hakkı (3 hakkı var)
   - Milestones: 3, 7, 14, 30, 60, 100, 365 gün rozetleri
   - Friendship streaks: Arkadaşla aktivite yapınca ikisi de artar
   - Auto-calculation: Her aktivitede otomatik hesaplama

5. Indexing Strategy:
   - B-tree indexes: For equality and range queries (user_id, status)
   - GiST indexes: For spatial/location queries (PostGIS)
   - GIN indexes: For JSONB and full-text search
   - Date indexes: For streak calculations (activity_date, last_activity_date)
*/
