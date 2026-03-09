-- BioSync Updated Core Supabase Schema
-- Includes Soft Delete (deleted_at), RBAC (roles), and PGRST205 fix.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 0. PREPARE EXISTING TABLES
-- This ensures that if the tables already exist, the new columns are
-- added before we apply the RLS (Row Level Security) policies on them.
-- ============================================

ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS height DECIMAL(5,2);
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE IF EXISTS public.professional_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE IF EXISTS public.professional_profiles ADD COLUMN IF NOT EXISTS location JSONB DEFAULT '{}';

ALTER TABLE IF EXISTS public.workouts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ============================================
-- 1. PROFILES (Base User Table)
-- Fix PGRST205 by clearly separating general profiles from professional profiles.
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  dob DATE,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'pt', 'dietitian')),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RBAC & Soft Delete Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone if not deleted."
ON public.profiles FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id AND deleted_at IS NULL);

-- Soft Delete: Prevent physical deletion via DELETE, force UPDATE deleted_at instead.
CREATE POLICY "Prevent physical deletion"
ON public.profiles FOR DELETE
USING (false);

-- ============================================
-- 2. PROFESSIONAL PROFILES (Marketplace logic)
-- Fits seamlessly within the broader Schema.
-- ============================================

CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  professional_type TEXT NOT NULL CHECK (professional_type IN ('pt', 'dietitian')),
  bio TEXT,
  specialties TEXT[],
  experience_years INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  commission_rate DECIMAL(5,2) DEFAULT 0.10,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  location JSONB DEFAULT '{}', -- Store country, city, district for location-search
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professional profiles viewable by all if not deleted"
ON public.professional_profiles FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Professionals can insert own details"
ON public.professional_profiles FOR INSERT
WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Professionals can update own details"
ON public.professional_profiles FOR UPDATE
USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Prevent physical deletion"
ON public.professional_profiles FOR DELETE
USING (false);

-- ============================================
-- 3. WORKOUTS (Example of how additional tables look with Soft Delete)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('weightlifting', 'calisthenics', 'cardio')),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own non-deleted workouts"
ON public.workouts FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can manage their own workouts"
ON public.workouts FOR ALL
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Prevent physical deletion"
ON public.workouts FOR DELETE
USING (false);

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
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_professional_profiles_updated_at ON public.professional_profiles;
CREATE TRIGGER set_professional_profiles_updated_at
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_workouts_updated_at ON public.workouts;
CREATE TRIGGER set_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
