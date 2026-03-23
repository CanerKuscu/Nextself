-- Payment System Tables
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    billing_cycle billing_cycle_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
    status subscription_status_enum NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat System Tables
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type chat_type_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type message_type_enum NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- professional_profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_profiles' AND column_name = 'professional_id') THEN
        ALTER TABLE professional_profiles ADD COLUMN professional_id UUID GENERATED ALWAYS AS (id) STORED;
    END IF;
END $$;

-- client_relationships
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_relationships' AND column_name = 'professional_id') THEN
        ALTER TABLE client_relationships ADD COLUMN professional_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_relationships' AND column_name = 'commission_amount') THEN
        ALTER TABLE client_relationships ADD COLUMN commission_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- user_profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'goals') THEN
        ALTER TABLE user_profiles ADD COLUMN goals TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'activity_level') THEN
        ALTER TABLE user_profiles ADD COLUMN activity_level activity_level_enum DEFAULT 'sedentary';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'dietary_preferences') THEN
        ALTER TABLE user_profiles ADD COLUMN dietary_preferences TEXT;
    END IF;
END $$;

-- Add foreign key relationships if missing
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE client_relationships ADD CONSTRAINT fk_client_relationships_professional_id FOREIGN KEY (professional_id) REFERENCES professional_profiles(id) ON DELETE SET NULL;