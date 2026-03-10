-- ============================================
-- COURSES TABLE DEFINITION
-- For BioSync Professional Training Services
-- ============================================

CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    title_tr VARCHAR(200),
    description TEXT,
    description_tr TEXT,
    type VARCHAR(50) CHECK (type IN ('fitness', 'nutrition')),
    duration_weeks INTEGER DEFAULT 4,
    sessions_count INTEGER DEFAULT 4,
    enrolled_count INTEGER DEFAULT 0,
    max_students INTEGER DEFAULT 10,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    location_type VARCHAR(50) DEFAULT 'online',
    city VARCHAR(100),
    schedule TEXT,
    level VARCHAR(50),
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES FOR COURSES TABLE
-- ============================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Everyone can view active courses
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
CREATE POLICY "Anyone can view active courses" ON courses
    FOR SELECT USING (is_active = TRUE);

-- Professionals can manage their own courses
DROP POLICY IF EXISTS "Professionals can insert own courses" ON courses;
CREATE POLICY "Professionals can insert own courses" ON courses
    FOR INSERT WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Professionals can update own courses" ON courses;
CREATE POLICY "Professionals can update own courses" ON courses
    FOR UPDATE USING (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Professionals can delete own courses" ON courses;
CREATE POLICY "Professionals can delete own courses" ON courses
    FOR DELETE USING (auth.uid() = professional_id);

-- ============================================
-- SAMPLE COURSES (Optional - for testing)
-- ============================================

-- Note: Insert sample data only after professional_profiles exist
/*
INSERT INTO courses (
    professional_id, title, title_tr, description, description_tr,
    type, duration_weeks, sessions_count, price, city, level, features
) VALUES (
    'professional-uuid-here',
    'Fat Burning HIIT Program',
    'Yağ Yakma HIIT Programı',
    'High-intensity interval training for maximum fat loss',
    'Maksimum yağ kaybı için yüksek yoğunluklu interval antrenmanı',
    'fitness',
    8, 24, 2999.00, 'Istanbul', 'Intermediate',
    '["Custom meal plan", "Weekly assessments", "WhatsApp support"]'
);
*/

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_courses_professional_id ON courses(professional_id);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(type);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_price ON courses(price);
