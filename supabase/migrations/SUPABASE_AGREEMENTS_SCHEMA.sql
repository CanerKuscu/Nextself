-- ================================================================
-- BioSync - User Agreements & Legal Compliance Schema
-- Kullanıcı Sözleşme Onay Kayıtları + MSS + Mikro Onay
-- ================================================================

-- Drop existing tables if exist
DROP TABLE IF EXISTS biometric_consents CASCADE;
DROP TABLE IF EXISTS distance_sales_contracts CASCADE;
DROP TABLE IF EXISTS user_agreements CASCADE;
DROP TABLE IF EXISTS agreement_versions CASCADE;

-- ================================================================
-- user_agreements: Stores which agreements each user accepted
-- ================================================================
CREATE TABLE user_agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Agreement identification
    agreement_type TEXT NOT NULL CHECK (agreement_type IN (
        'kvkk',           -- KVKK Aydınlatma Metni
        'consent',        -- Açık Rıza Metni
        'privacy',        -- Gizlilik Politikası
        'subscription',   -- Abonelik ve İade Politikası
        'terms'           -- Kullanım Koşulları
    )),
    version TEXT NOT NULL DEFAULT '1.0',
    
    -- Acceptance details
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    device_platform TEXT CHECK (device_platform IN ('ios', 'android', 'web')),
    
    -- Withdrawal (rıza geri alma)
    is_active BOOLEAN NOT NULL DEFAULT true,
    withdrawn_at TIMESTAMPTZ,
    withdrawal_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one active acceptance per user per agreement type per version
    CONSTRAINT unique_user_agreement UNIQUE (user_id, agreement_type, version)
);

-- ================================================================
-- Indexes
-- ================================================================
CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);
CREATE INDEX idx_user_agreements_type ON user_agreements(agreement_type);
CREATE INDEX idx_user_agreements_active ON user_agreements(is_active);
CREATE INDEX idx_user_agreements_accepted_at ON user_agreements(accepted_at);

-- ================================================================
-- Row Level Security
-- ================================================================
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;

-- Users can view their own agreements
CREATE POLICY "Users can view own agreements"
    ON user_agreements FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own agreements
CREATE POLICY "Users can insert own agreements"
    ON user_agreements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own agreements (for withdrawal)
CREATE POLICY "Users can update own agreements"
    ON user_agreements FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- agreement_versions: Track agreement version history
-- ================================================================
CREATE TABLE agreement_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agreement_type TEXT NOT NULL CHECK (agreement_type IN (
        'kvkk', 'consent', 'privacy', 'subscription', 'terms'
    )),
    version TEXT NOT NULL,
    title_tr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    summary_tr TEXT,
    summary_en TEXT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_current BOOLEAN NOT NULL DEFAULT true,
    total_articles INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_agreement_version UNIQUE (agreement_type, version)
);

ALTER TABLE agreement_versions ENABLE ROW LEVEL SECURITY;

-- Everyone can read agreement versions (public info)
CREATE POLICY "Anyone can view agreement versions"
    ON agreement_versions FOR SELECT
    USING (true);

-- ================================================================
-- Seed initial agreement versions
-- ================================================================
INSERT INTO agreement_versions (agreement_type, version, title_tr, title_en, total_articles, is_current) VALUES
('kvkk',         '1.0', 'KVKK Aydınlatma Metni',        'KVKK Disclosure Text',          7, true),
('consent',      '1.0', 'Açık Rıza Metni',               'Explicit Consent Form',         5, true),
('privacy',      '1.0', 'Gizlilik Politikası',           'Privacy Policy',                7, true),
('subscription', '1.0', 'Abonelik ve İade Politikası',   'Subscription & Refund Policy',  7, true),
('terms',        '1.0', 'Kullanım Koşulları',            'Terms of Service',             11, true);

-- ================================================================
-- Updated_at trigger
-- ================================================================
CREATE OR REPLACE FUNCTION update_user_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_agreements_updated_at
    BEFORE UPDATE ON user_agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_user_agreements_updated_at();

-- ================================================================
-- Helper function: Check if user accepted all required agreements
-- ================================================================
CREATE OR REPLACE FUNCTION check_user_agreements_complete(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    accepted_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT agreement_type) INTO accepted_count
    FROM user_agreements
    WHERE user_id = p_user_id
      AND is_active = true
      AND version = (
          SELECT version FROM agreement_versions 
          WHERE agreement_versions.agreement_type = user_agreements.agreement_type
            AND is_current = true
          LIMIT 1
      );
    
    RETURN accepted_count >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- distance_sales_contracts: Mesafeli Satış Sözleşmesi (6502 Sayılı Kanun)
-- Her ödeme öncesi otomatik oluşturulan dinamik sözleşme
-- ================================================================
CREATE TABLE distance_sales_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Buyer Information (Alıcı Bilgileri)
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_address TEXT,
    buyer_phone TEXT,
    buyer_city TEXT,
    buyer_country TEXT DEFAULT 'Türkiye',
    
    -- Subscription/Product Details (Ürün/Hizmet Bilgileri)
    plan_id TEXT,
    plan_name TEXT NOT NULL,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY',
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Contract Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Oluşturuldu, onay bekleniyor
        'accepted',     -- Kullanıcı kabul etti
        'active',       -- Ödeme alındı, aktif
        'completed',    -- Dönem tamamlandı
        'cancelled',    -- İptal edildi
        'refunded',     -- İade edildi
        'withdrawn'     -- Cayma hakkı kullanıldı
    )),
    
    -- Acceptance Details
    accepted_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT,
    device_platform TEXT CHECK (device_platform IN ('ios', 'android', 'web')),
    
    -- Pre-Information Form (Ön Bilgilendirme Formu)
    pre_info_shown_at TIMESTAMPTZ,
    pre_info_accepted_at TIMESTAMPTZ,
    
    -- Withdrawal (Cayma Hakkı - 14 gün)
    withdrawal_deadline TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    withdrawal_reason TEXT,
    digital_content_started BOOLEAN DEFAULT false,
    digital_content_consent BOOLEAN DEFAULT false,
    
    -- Payment Reference
    payment_id TEXT,
    invoice_id TEXT,
    
    -- Metadata
    contract_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for MSS
CREATE INDEX idx_dsc_user_id ON distance_sales_contracts(user_id);
CREATE INDEX idx_dsc_status ON distance_sales_contracts(status);
CREATE INDEX idx_dsc_contract_number ON distance_sales_contracts(contract_number);
CREATE INDEX idx_dsc_created_at ON distance_sales_contracts(created_at);

-- RLS for MSS
ALTER TABLE distance_sales_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts"
    ON distance_sales_contracts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts"
    ON distance_sales_contracts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts"
    ON distance_sales_contracts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger for MSS
CREATE TRIGGER trigger_update_dsc_updated_at
    BEFORE UPDATE ON distance_sales_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_agreements_updated_at();

-- ================================================================
-- biometric_consents: Just-in-Time Mikro Onay Kayıtları
-- Kamera/biyometrik veri işleme öncesi alınan anlık onaylar
-- ================================================================
CREATE TABLE biometric_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Consent Type
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'posture_analysis',    -- Postür Analizi (kamera + vücut analizi)
        'food_scanner',        -- Yemek Fotoğrafı Analizi
        'body_analysis',       -- AI Coach Fizik Analizi
        'barcode_scanner'      -- Barkod Tarama
    )),
    
    -- Consent Details
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Session Info
    session_id TEXT,
    device_platform TEXT CHECK (device_platform IN ('ios', 'android', 'web')),
    
    -- Revocation
    revoked_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for biometric consents
CREATE INDEX idx_bio_consent_user_id ON biometric_consents(user_id);
CREATE INDEX idx_bio_consent_type ON biometric_consents(consent_type);
CREATE INDEX idx_bio_consent_granted_at ON biometric_consents(granted_at);

-- RLS for biometric consents
ALTER TABLE biometric_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own biometric consents"
    ON biometric_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometric consents"
    ON biometric_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- Helper: Generate MSS Contract Number
-- ================================================================
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'BSC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
