-- ============================================
-- BIOSYNC FINAL SUPABASE SCHEMA
-- Combines soft delete, RBAC policies, AI functionality, and Professional Data.
-- INSTRUCTIONS: Run this entirely in your Supabase SQL Editor.
-- Safe to re-run multiple times (Idempotent).
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 1. PROFILES (Base User Table)
-- Replaces default users table for application logic
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  dob DATE,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'pt', 'dietitian', 'admin')),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone if not deleted." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Prevent physical deletion" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone if not deleted." ON public.profiles FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id AND deleted_at IS NULL);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id AND deleted_at IS NULL);
CREATE POLICY "Prevent physical deletion" ON public.profiles FOR DELETE USING (false);

-- ============================================
-- 2. PROFESSIONAL PROFILES (Marketplace logic)
-- Role constraint fixed. 'pt' aligns with profiles role.
-- ============================================
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  professional_type TEXT NOT NULL CHECK (professional_type IN ('pt', 'dietitian')),
  bio TEXT,
  specialties TEXT[],
  experience_years INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  commission_rate DECIMAL(5,2) DEFAULT 0.10,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  location JSONB DEFAULT '{}', 
  pricing JSONB DEFAULT '{"monthlyPackage": 200, "sessionRate": 50}',
  languages TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional profiles viewable by all" ON public.professional_profiles;
DROP POLICY IF EXISTS "Professionals can insert own details" ON public.professional_profiles;
DROP POLICY IF EXISTS "Professionals can update own details" ON public.professional_profiles;

CREATE POLICY "Professional profiles viewable by all" ON public.professional_profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Professionals can insert own details" ON public.professional_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Professionals can update own details" ON public.professional_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3. CLIENT RELATIONSHIPS
-- ============================================
CREATE TABLE IF NOT EXISTS public.client_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    professional_type TEXT NOT NULL CHECK (professional_type IN ('pt', 'dietitian')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    commission_paid BOOLEAN DEFAULT FALSE,
    commission_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, professional_id)
);

ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own relationships" ON public.client_relationships;
DROP POLICY IF EXISTS "Clients can initiate relationships" ON public.client_relationships;
DROP POLICY IF EXISTS "Professionals update relationships" ON public.client_relationships;

CREATE POLICY "Users view own relationships" ON public.client_relationships FOR SELECT USING (auth.uid() = client_id OR auth.uid() = professional_id);
CREATE POLICY "Clients can initiate relationships" ON public.client_relationships FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Professionals update relationships" ON public.client_relationships FOR UPDATE USING (auth.uid() = professional_id);

-- ============================================
-- 4. LOGS & ACTIVITY TABLES (Workouts, Supplements, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('weightlifting', 'calisthenics', 'cardio')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplement_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    supplement_id UUID,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced RLS (Fix): Professionals can view logs of their active clients!
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Pros see active clients workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users manage own workouts" ON public.workouts;

CREATE POLICY "Users see own workouts" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Pros see active clients workouts" ON public.workouts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.client_relationships cr WHERE cr.client_id = public.workouts.user_id AND cr.professional_id = auth.uid() AND cr.status = 'active')
);
CREATE POLICY "Users manage own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own supplement logs" ON public.supplement_logs;
DROP POLICY IF EXISTS "Pros see active clients supplements" ON public.supplement_logs;
DROP POLICY IF EXISTS "Users manage own supplements" ON public.supplement_logs;

CREATE POLICY "Users view own supplement logs" ON public.supplement_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Pros see active clients supplements" ON public.supplement_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.client_relationships cr WHERE cr.client_id = public.supplement_logs.user_id AND cr.professional_id = auth.uid() AND cr.status = 'active')
);
CREATE POLICY "Users manage own supplements" ON public.supplement_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. AI GENERATED DATA TABLES (Fix for missing persistence)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_meal_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_calories INTEGER,
    generated_plan JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_workout_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    fitness_goal TEXT,
    generated_workout JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workout_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and active Pros view AI meals" ON public.ai_meal_plans;
DROP POLICY IF EXISTS "Users and active Pros view AI workouts" ON public.ai_workout_recommendations;
DROP POLICY IF EXISTS "Users insert AI Plans" ON public.ai_meal_plans;
DROP POLICY IF EXISTS "Users insert AI Workouts" ON public.ai_workout_recommendations;

CREATE POLICY "Users and active Pros view AI meals" ON public.ai_meal_plans FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.client_relationships cr WHERE cr.client_id = public.ai_meal_plans.user_id AND cr.professional_id = auth.uid() AND cr.status = 'active')
);
CREATE POLICY "Users and active Pros view AI workouts" ON public.ai_workout_recommendations FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.client_relationships cr WHERE cr.client_id = public.ai_workout_recommendations.user_id AND cr.professional_id = auth.uid() AND cr.status = 'active')
);
CREATE POLICY "Users insert AI Plans" ON public.ai_meal_plans FOR INSERT WITH CHECK(auth.uid() = user_id);
CREATE POLICY "Users insert AI Workouts" ON public.ai_workout_recommendations FOR INSERT WITH CHECK(auth.uid() = user_id);

-- ============================================
-- 6. FIXED COMMISSION CALCULATION (Dynamic Value)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_commission(relationship_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    calc_commission_amount DECIMAL;
    monthly_package_fee DECIMAL;
    base_commission_rate DECIMAL;
    prof_id UUID;
BEGIN
    SELECT professional_id INTO prof_id FROM public.client_relationships WHERE id = relationship_id;
    
    SELECT (pricing->>'monthlyPackage')::DECIMAL, commission_rate 
    INTO monthly_package_fee, base_commission_rate 
    FROM public.professional_profiles WHERE user_id = prof_id;
    
    IF monthly_package_fee IS NULL THEN monthly_package_fee := 200; END IF;

    calc_commission_amount := monthly_package_fee * COALESCE(base_commission_rate, 0.10);
    
    UPDATE public.client_relationships
    SET commission_amount = calc_commission_amount, commission_paid = true, updated_at = NOW()
    WHERE id = relationship_id;
    
    RETURN calc_commission_amount;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Helper Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_professional_profiles_updated_at ON public.professional_profiles;
CREATE TRIGGER set_professional_profiles_updated_at BEFORE UPDATE ON public.professional_profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_client_relationships_updated_at ON public.client_relationships;
CREATE TRIGGER set_client_relationships_updated_at BEFORE UPDATE ON public.client_relationships FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_workouts_updated_at ON public.workouts;
CREATE TRIGGER set_workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_supplement_logs_updated_at ON public.supplement_logs;
CREATE TRIGGER set_supplement_logs_updated_at BEFORE UPDATE ON public.supplement_logs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
