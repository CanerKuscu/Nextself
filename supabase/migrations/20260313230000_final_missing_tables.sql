-- ============================================================================
-- SUPABASE SCHEMA COMPLETION - FINAL MIGRATION
-- Generated: March 2026
-- Purpose: Complete missing database elements for BioSync application
-- 
-- EXISTING TABLES ALREADY CREATED (DO NOT MODIFY):
-- - exercises (IMPORTED EXTERNALLY - DO NOT TOUCH)
-- - food_items (IMPORTED EXTERNALLY - DO NOT TOUCH)
-- - users, user_profiles, workout_sessions, nutrition_entries, health_metrics
-- - personal_trainers, dietitians, client_relationships, professional_profiles, ratings
-- - ai_insights, ai_generated_programs, ai_analyses
-- - league_tiers, league_groups, user_leagues, xp_transactions, store_items
-- - user_inventory_items, user_currencies, weekly_missions, daily_missions
-- - user_agreements, agreement_versions, biometric_consents, distance_sales_contracts
-- - mss_pdf_results, friendships, forum_categories, forum_topics, forum_posts
-- - progress_logs, sleep_data, stress_logs, water_configs, water_stats_logs
-- - micronutrients, supplements, supplement_ingredients, user_supplements
-- - supplement_logs, videos, video_progress, video_likes, video_comments
-- - comment_likes, video_playlists, playlist_videos, workout_plans
-- - nutrition_plans, meal_plans, vitamins, vitamin_logs, vitamin_plans
-- - notifications, subscriptions, body_photos, follows, challenges
-- - challenge_participants, social_posts, post_likes, post_comments
-- - wearable_devices, health_data, health_goals, food_scans, user_preferences
-- 
-- TABLES CREATED BY PREVIOUS MIGRATIONS (20260313000000_complete_missing_schema.sql):
-- - health_records, nutrition_logs, chats, chat_participants, messages
-- - minerals, mineral_logs, mineral_plans
-- - assigned_workouts, assigned_nutrition_plans, assigned_supplements
-- - user_privacy_settings
--
-- THIS MIGRATION CREATES:
-- 1. Payment system tables (subscription_plans, user_subscriptions, payment_methods, invoices, payment_history)
-- 2. Missing columns in existing tables
-- 3. Additional indexes for performance
-- 4. Helper functions and triggers
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES FOR PAYMENT SYSTEM
-- ============================================================================

-- Subscription status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
        CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'expired');
    END IF;
END $$;

-- Billing cycle enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_enum') THEN
        CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'yearly', 'lifetime');
    END IF;
END $$;

-- Payment status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('succeeded', 'pending', 'failed', 'refunded', 'disputed');
    END IF;
END $$;

-- Invoice status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status_enum') THEN
        CREATE TYPE invoice_status_enum AS ENUM ('paid', 'open', 'void', 'uncollectible', 'draft');
    END IF;
END $$;

-- ============================================================================
-- 2. PAYMENT SYSTEM TABLES
-- ============================================================================

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC NOT NULL DEFAULT 0,
    price_yearly NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    features TEXT[] DEFAULT '{}',
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    trial_days INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE subscription_plans IS 'Available subscription plans for users';

-- User subscriptions table (enhanced version of subscriptions table)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    status subscription_status_enum DEFAULT 'active',
    billing_cycle billing_cycle_enum DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    payment_method_id UUID,
    iyzico_subscription_ref TEXT,
    iyzico_customer_ref TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_subscriptions IS 'User subscription records with billing details';

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    iyzico_card_token TEXT,
    type TEXT DEFAULT 'card',
    brand TEXT,
    last4 TEXT,
    exp_month INT,
    exp_year INT,
    is_default BOOLEAN DEFAULT FALSE,
    billing_address JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE payment_methods IS 'Stored payment methods for users (tokenized)';

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    iyzico_payment_id TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    status invoice_status_enum DEFAULT 'open',
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    hosted_invoice_url TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE invoices IS 'Invoice records for subscription payments';

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    description TEXT,
    status payment_status_enum DEFAULT 'pending',
    payment_method TEXT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE payment_history IS 'History of all payment attempts and transactions';

-- ============================================================================
-- 3. UPDATE EXISTING TABLES WITH MISSING COLUMNS
-- ============================================================================

-- Add missing columns to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'deleted_at') THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'professional_type') THEN
        ALTER TABLE users ADD COLUMN professional_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE users ADD COLUMN gender TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'user_type') THEN
        ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'user';
    END IF;
END $$;

-- Add missing columns to professional_profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_profiles' AND column_name = 'city') THEN
        ALTER TABLE professional_profiles ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_profiles' AND column_name = 'district') THEN
        ALTER TABLE professional_profiles ADD COLUMN district TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_profiles' AND column_name = 'country') THEN
        ALTER TABLE professional_profiles ADD COLUMN country TEXT DEFAULT 'Turkey';
    END IF;
END $$;

-- ============================================================================
-- 4. RECREATE PROFILES VIEW WITH ALL NEEDED COLUMNS
-- ============================================================================

DROP VIEW IF EXISTS profiles;

CREATE VIEW profiles AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.height,
    u.weight,
    u.is_email_verified,
    u.is_deleted,
    u.created_at,
    u.updated_at,
    up.goals,
    up.activity_level,
    up.dietary_preferences,
    up.dietary_restrictions,
    up.personal_trainer_id,
    up.dietitian_id,
    up.data_sharing_permissions
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_deleted = FALSE;

COMMENT ON VIEW profiles IS 'Public view of user profiles combining users and user_profiles tables';

-- ============================================================================
-- 5. INDEXES FOR PAYMENT TABLES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_order ON subscription_plans(sort_order);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period ON user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_professional_type ON users(professional_type) WHERE professional_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_professional_profiles_city ON professional_profiles(city);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_country ON professional_profiles(country);

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES FOR PAYMENT TABLES
-- ============================================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active subscription plans are viewable by everyone" ON subscription_plans
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions" ON user_subscriptions
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own payment history" ON payment_history
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment history" ON payment_history
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. TRIGGERS FOR UPDATED_AT COLUMNS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_subscription BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = user_uuid
        AND status = 'active'
        AND current_period_end > NOW()
    ) INTO has_subscription;
    
    RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    plan_name TEXT;
BEGIN
    SELECT sp.name INTO plan_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.current_period_end > NOW()
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(plan_name, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_subscriptions
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
    AND current_period_end < NOW()
    AND (trial_end IS NULL OR trial_end < NOW());
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. SEED DATA FOR SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, currency, features, is_popular, is_active, trial_days, sort_order) VALUES
(
    'Free',
    'Basic fitness tracking and limited AI features',
    0,
    0,
    'TRY',
    ARRAY['Basic workout tracking', 'Limited nutrition logging', '3 AI insights per month', 'Community access'],
    FALSE,
    TRUE,
    0,
    1
),
(
    'Premium',
    'Full access to all features including advanced AI and professional coaching',
    199.99,
    1999.99,
    'TRY',
    ARRAY['Unlimited workout tracking', 'Advanced nutrition analysis', 'Unlimited AI insights', 'Priority support', 'Video content access', 'Professional coach matching', 'Advanced health metrics', 'Custom meal plans'],
    TRUE,
    TRUE,
    7,
    2
),
(
    'Professional',
    'For fitness professionals and coaches with client management',
    399.99,
    3999.99,
    'TRY',
    ARRAY['All Premium features', 'Client management (up to 50)', 'Professional dashboard', 'Custom branding', 'Priority listing', 'Analytics and reports', 'API access'],
    FALSE,
    TRUE,
    14,
    3
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'Schema completion migration executed successfully!' AS status;
