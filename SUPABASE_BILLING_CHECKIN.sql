-- ==========================================
-- BÖLÜM 1: MÜŞTERİ İLİŞKİLERİ GÜNCELLEMESİ
-- ==========================================

-- client_relationships tablosuna finansal kolonları ekleyelim (Eğer yoksa)
ALTER TABLE public.client_relationships
ADD COLUMN IF NOT EXISTS agreed_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS deposit_paid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'pending';

-- billing_status için kısıtlama (active, pending, suspended_payment)
DO $$ BEGIN
    ALTER TABLE public.client_relationships
    ADD CONSTRAINT check_billing_status 
    CHECK (billing_status IN ('pending', 'active', 'suspended_payment'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==========================================
-- BÖLÜM 2: YENİ TABLOLAR
-- ==========================================

-- 1. BILLING_CYCLES (Aylık Faturalandırma) Tablosu
CREATE TABLE IF NOT EXISTS public.billing_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Örn: '2025-10'
    total_commission_owed NUMERIC DEFAULT 0,
    total_deposit_paid NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TRANSACTION_LOGS (Ödeme Kayıtları/Makbuzlar) Tablosu
CREATE TABLE IF NOT EXISTS public.transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit_payment', 'monthly_commission_payment')),
    payment_gateway_ref TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SESSION_CHECKINS (QR ile Yüz Yüze Görüşme Doğrulama) Tablosu
CREATE TABLE IF NOT EXISTS public.session_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_relationship_id UUID NOT NULL REFERENCES public.client_relationships(id) ON DELETE CASCADE,
    qr_token TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    checkin_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- BÖLÜM 3: GÜVENLİK (RLS POLICIES)
-- ==========================================

-- billing_cycles güvenliği (Profil sahibi PT sadece kendi faturalarını görebilir)
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Professionals view own billing cycles" ON public.billing_cycles FOR SELECT USING (auth.uid() = professional_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- transaction_logs güvenliği
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Professionals view own transaction logs" ON public.transaction_logs FOR SELECT USING (auth.uid() = professional_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- session_checkins güvenliği
ALTER TABLE public.session_checkins ENABLE ROW LEVEL SECURITY;
-- PT kendi seanslarını görebilir. Müşteri tarafı da view için relation join ile izin alabilir
DO $$ BEGIN
    CREATE POLICY "Users view own checkins via relation" ON public.session_checkins FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.client_relationships cr
            WHERE cr.id = session_checkins.client_relationship_id
            AND (cr.professional_id = auth.uid() OR cr.client_id = auth.uid())
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    -- QR check-in okutulduğunda update işlemi yapılabilir (Müşteriler doğrulayabilir)
    CREATE POLICY "Clients can verify their sessions" ON public.session_checkins FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.client_relationships cr
            WHERE cr.id = session_checkins.client_relationship_id
            AND cr.client_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
