-- =========================================================================================
-- BIOSYNC - YENİ MODÜLLER İÇİN SQL ŞEMA EKLENTİLERİ
-- (Mesajlaşma, Veri Gizliliği, Eğitim/Beslenme Atamaları)
-- =========================================================================================

-- 1. MESAJLAŞMA (CHAT) SİSTEMİ EKLENTİLERİ

-- Sohbet Odaları Tablosu
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  type text NOT NULL CHECK (type IN ('direct', 'group')),
  last_message_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Sohbete Katılımcılar Tablosu
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(chat_id, user_id)
);

-- Mesajlar Tablosu (Resim/Video desteği için media_url)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text,
  media_url text, -- Resim/Ses/Video vb için
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_read boolean DEFAULT false
);

-- Mesaj Okunma Durumu (Grup sohbetleri ve detaylı takip için opsiyonel)
CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  read_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id)
);


-- =========================================================================================
-- 2. VERİ GİZLİLİĞİ VE PAYLAŞIM TERCİHLERİ

CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Genel Paylaşım İzinleri (Default Kapalı)
  share_steps_with_pt boolean DEFAULT false,
  share_workouts_with_pt boolean DEFAULT true, -- Antrenmanları doğal olarak görür
  share_weight_with_pt boolean DEFAULT true,
  
  share_calories_with_dietitian boolean DEFAULT true,
  share_macros_with_dietitian boolean DEFAULT true,
  share_water_with_dietitian boolean DEFAULT true,
  share_weight_with_dietitian boolean DEFAULT true,

  -- Gelecekte eklenebilecek spesifik profesyoneller için JSONB
  -- Örn: {"pt_id_1": {"steps": true}, "dietitian_id_2": {"calories": false}}
  specific_professional_permissions jsonb DEFAULT '{}'::jsonb,
  
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =========================================================================================
-- 3. PROFESYONEL ATAMALARI (NUTRITION & WORKOUT ASSIGNMENTS)

-- PT'nin Kullanıcıya Antrenman Ataması
CREATE TABLE IF NOT EXISTS public.assigned_workouts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  pt_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL, -- Atayan PT
  client_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL, -- Atanan Müşteri
  title text NOT NULL,
  description text,
  scheduled_date date NOT NULL, -- Hangi gün için atandı
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb, -- Egzersiz listesi (id, set, tekrar, ağırlık vb)
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  client_feedback text, -- Antrenman sonrası kullanıcı yorumu/zorluk derecesi
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Diyetisyenin Kullanıcıya Beslenme/Öğün Ataması
CREATE TABLE IF NOT EXISTS public.assigned_nutrition_plans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  dietitian_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  
  -- Günlük hedef makrolar
  target_calories integer,
  target_protein integer,
  target_carbs integer,
  target_fats integer,
  target_water_ml integer,
  
  -- Öğün detayları (Örn: {"breakfast": ["Yulaf", "Yumurta"], "lunch": [...]})
  meals_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================================
-- RLS (Row Level Security) KURALLARI (Basit Örneklemeler - Sonra Detaylandırılabilir)

-- Chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.chats;
CREATE POLICY "Users can view chats they participate in" ON public.chats
  FOR SELECT USING (
    id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT USING (
    chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
  );
  
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON public.messages;
CREATE POLICY "Users can insert messages to their chats" ON public.messages
  FOR INSERT WITH CHECK (
    chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
    AND sender_id = auth.uid()
  );

-- Privacy Settings
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and edit their own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can view and edit their own privacy settings" ON public.user_privacy_settings
  FOR ALL USING (user_id = auth.uid());

-- Assignments
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PTs can manage their assigned workouts" ON public.assigned_workouts;
CREATE POLICY "PTs can manage their assigned workouts" ON public.assigned_workouts
  FOR ALL USING (pt_id = auth.uid());
  
DROP POLICY IF EXISTS "Clients can view their assigned workouts" ON public.assigned_workouts;
CREATE POLICY "Clients can view their assigned workouts" ON public.assigned_workouts
  FOR SELECT USING (client_id = auth.uid());
  
DROP POLICY IF EXISTS "Clients can update their assigned workouts (e.g to mark complete)" ON public.assigned_workouts;
CREATE POLICY "Clients can update their assigned workouts (e.g to mark complete)" ON public.assigned_workouts
  FOR UPDATE USING (client_id = auth.uid());

ALTER TABLE public.assigned_nutrition_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dietitians can manage their assigned plans" ON public.assigned_nutrition_plans;
CREATE POLICY "Dietitians can manage their assigned plans" ON public.assigned_nutrition_plans
  FOR ALL USING (dietitian_id = auth.uid());
  
DROP POLICY IF EXISTS "Clients can view their assigned plans" ON public.assigned_nutrition_plans;
CREATE POLICY "Clients can view their assigned plans" ON public.assigned_nutrition_plans
  FOR SELECT USING (client_id = auth.uid());

ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS last_streak_date date;