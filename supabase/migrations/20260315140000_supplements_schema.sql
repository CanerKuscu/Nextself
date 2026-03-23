-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DROP EXISTING TABLES TO PREVENT MIGRATION ERRORS
DROP TABLE IF EXISTS public.user_supplement_logs CASCADE;
DROP TABLE IF EXISTS public.supplements CASCADE;

-- 2. CREATE SUPPLEMENTS TABLE WITH BILINGUAL SUPPORT
CREATE TABLE public.supplements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_tr TEXT NOT NULL,
    description_en TEXT,
    description_tr TEXT,
    category TEXT NOT NULL CHECK (category IN ('vitamin', 'mineral', 'protein', 'amino_acid', 'herbal', 'other', 'sport', 'nootropic', 'joint')),
    form TEXT CHECK (form IN ('tablet', 'capsule', 'powder', 'liquid', 'gummy', 'softgel', 'drops')),
    
    -- Dosage & Usage
    dosage_amount TEXT, -- e.g. "500", "1000"
    dosage_unit TEXT, -- e.g. "mg", "IU", "g"
    serving_size TEXT, -- e.g. "1 tablet", "1 scoop"
    
    -- Arrays for lists (Bilingual)
    benefits_en TEXT[],
    benefits_tr TEXT[],
    side_effects_en TEXT[],
    side_effects_tr TEXT[],
    food_sources_en TEXT[],
    food_sources_tr TEXT[],
    
    -- Instructions
    usage_instructions_en TEXT,
    usage_instructions_tr TEXT,
    
    -- Metadata
    image_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    popularity_score INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Supplements are viewable by everyone" 
ON public.supplements FOR SELECT 
USING (true);

CREATE POLICY "Supplements are insertable by authenticated users only" 
ON public.supplements FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Supplements are updatable by admin only" 
ON public.supplements FOR UPDATE 
USING (auth.jwt() ->> 'email' LIKE '%@biosync.com');

-- 3. CREATE USER LOGS TABLE
CREATE TABLE public.user_supplement_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplement_id UUID REFERENCES public.supplements(id) ON DELETE CASCADE NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quantity NUMERIC DEFAULT 1,
    unit TEXT, -- e.g. "tablet", "scoop"
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_supplement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs" 
ON public.user_supplement_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" 
ON public.user_supplement_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" 
ON public.user_supplement_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs" 
ON public.user_supplement_logs FOR DELETE 
USING (auth.uid() = user_id);

-- 4. MASSIVE BILINGUAL SEED DATA
INSERT INTO public.supplements (name_en, name_tr, description_en, description_tr, category, form, dosage_amount, dosage_unit, benefits_en, benefits_tr, side_effects_en, side_effects_tr, food_sources_en, food_sources_tr, usage_instructions_en, usage_instructions_tr, is_verified)
VALUES
-- ================= VITAMINS =================
(
    'Vitamin A (Retinol)', 'A Vitamini (Retinol)',
    'Essential for vision, immune function, and skin health.',
    'Görme, bağışıklık fonksiyonu ve cilt sağlığı için gereklidir.',
    'vitamin', 'softgel', '5000', 'IU',
    ARRAY['Maintains healthy vision', 'Supports immune system', 'Promotes healthy skin', 'Supports reproduction'],
    ARRAY['Sağlıklı görmeyi korur', 'Bağışıklık sistemini destekler', 'Cilt sağlığını destekler', 'Üremeyi destekler'],
    ARRAY['Headache', 'Nausea', 'Dizziness (at high doses)'],
    ARRAY['Baş ağrısı', 'Mide bulantısı', 'Baş dönmesi (yüksek dozlarda)'],
    ARRAY['Liver', 'Fish oil', 'Carrots', 'Spinach'],
    ARRAY['Karaciğer', 'Balık yağı', 'Havuç', 'Ispanak'],
    'Take 1 softgel daily with a fat-containing meal.',
    'Günde 1 kapsülü yağ içeren bir öğünle alınız.',
    true
),
(
    'Vitamin B1 (Thiamine)', 'B1 Vitamini (Tiamin)',
    'Crucial for converting nutrients into energy.',
    'Besinleri enerjiye dönüştürmek için çok önemlidir.',
    'vitamin', 'tablet', '100', 'mg',
    ARRAY['Energy production', 'Nerve health', 'Brain function'],
    ARRAY['Enerji üretimi', 'Sinir sağlığı', 'Beyin fonksiyonu'],
    ARRAY['Nausea', 'Stomach upset (rare)'],
    ARRAY['Mide bulantısı', 'Mide rahatsızlığı (nadir)'],
    ARRAY['Whole grains', 'Pork', 'Seeds'],
    ARRAY['Tam tahıllar', 'Domuz eti', 'Tohumlar'],
    'Take 1 tablet daily with food.',
    'Günde 1 tableti yemekle alınız.',
    true
),
(
    'Vitamin B2 (Riboflavin)', 'B2 Vitamini (Riboflavin)',
    'Helps break down proteins, fats, and carbohydrates.',
    'Proteinleri, yağları ve karbonhidratları parçalamaya yardımcı olur.',
    'vitamin', 'tablet', '100', 'mg',
    ARRAY['Energy metabolism', 'Eye health', 'Migraine prevention'],
    ARRAY['Enerji metabolizması', 'Göz sağlığı', 'Migren önleme'],
    ARRAY['Bright yellow urine (harmless)'],
    ARRAY['Parlak sarı idrar (zararsız)'],
    ARRAY['Eggs', 'Organ meats', 'Green vegetables'],
    ARRAY['Yumurta', 'Sakatat', 'Yeşil sebzeler'],
    'Take 1 tablet daily with a meal.',
    'Günde 1 tableti yemekle birlikte alınız.',
    true
),
(
    'Vitamin B3 (Niacin)', 'B3 Vitamini (Niasin)',
    'Helps lower cholesterol and boost brain function.',
    'Kolesterolü düşürmeye ve beyin fonksiyonunu artırmaya yardımcı olur.',
    'vitamin', 'tablet', '500', 'mg',
    ARRAY['Lowers cholesterol', 'Skin health', 'Brain function'],
    ARRAY['Kolesterolü düşürür', 'Cilt sağlığı', 'Beyin fonksiyonu'],
    ARRAY['Flushing (redness)', 'Itching'],
    ARRAY['Kızarma', 'Kaşıntı'],
    ARRAY['Chicken', 'Tuna', 'Salmon'],
    ARRAY['Tavuk', 'Ton balığı', 'Somon'],
    'Take with food to avoid flushing.',
    'Kızarmayı önlemek için yemekle alınız.',
    true
),
(
    'Vitamin B5 (Pantothenic Acid)', 'B5 Vitamini (Pantotenik Asit)',
    'Necessary for making blood cells and energy.',
    'Kan hücreleri ve enerji yapımı için gereklidir.',
    'vitamin', 'capsule', '500', 'mg',
    ARRAY['Energy production', 'Hormone synthesis'],
    ARRAY['Enerji üretimi', 'Hormon sentezi'],
    ARRAY['Diarrhea (very high doses)'],
    ARRAY['İshal (çok yüksek dozlarda)'],
    ARRAY['Beef', 'Avocado', 'Mushrooms'],
    ARRAY['Sığır eti', 'Avokado', 'Mantar'],
    'Take 1 capsule daily with food.',
    'Günde 1 kapsülü yemekle alınız.',
    true
),
(
    'Vitamin B6 (Pyridoxine)', 'B6 Vitamini (Piridoksin)',
    'Important for brain development and immune health.',
    'Beyin gelişimi ve bağışıklık sağlığı için önemlidir.',
    'vitamin', 'tablet', '50', 'mg',
    ARRAY['Mood regulation', 'Hemoglobin production'],
    ARRAY['Ruh hali düzenlemesi', 'Hemoglobin üretimi'],
    ARRAY['Nerve damage (excessive long-term use)'],
    ARRAY['Sinir hasarı (aşırı uzun süreli kullanım)'],
    ARRAY['Poultry', 'Fish', 'Potatoes'],
    ARRAY['Kümes hayvanları', 'Balık', 'Patates'],
    'Take 1 tablet daily.',
    'Günde 1 tablet alınız.',
    true
),
(
    'Vitamin B7 (Biotin)', 'B7 Vitamini (Biyotin)',
    'Supports healthy hair, skin, and nails.',
    'Sağlıklı saç, cilt ve tırnakları destekler.',
    'vitamin', 'capsule', '5000', 'mcg',
    ARRAY['Hair growth', 'Nail strength', 'Metabolism'],
    ARRAY['Saç uzaması', 'Tırnak gücü', 'Metabolizma'],
    ARRAY['None known'],
    ARRAY['Bilinen yok'],
    ARRAY['Egg yolks', 'Almonds', 'Sweet potato'],
    ARRAY['Yumurta sarısı', 'Badem', 'Tatlı patates'],
    'Take 1 capsule daily.',
    'Günde 1 kapsül alınız.',
    true
),
(
    'Vitamin B9 (Folic Acid)', 'B9 Vitamini (Folik Asit)',
    'Crucial for cell growth and DNA formation.',
    'Hücre büyümesi ve DNA oluşumu için kritiktir.',
    'vitamin', 'tablet', '400', 'mcg',
    ARRAY['Fetal development', 'Red blood cell formation'],
    ARRAY['Fetal gelişim', 'Kırmızı kan hücresi oluşumu'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Leafy greens', 'Beans', 'Citrus'],
    ARRAY['Yeşil yapraklı sebzeler', 'Fasulye', 'Turunçgiller'],
    'Take 1 tablet daily.',
    'Günde 1 tablet alınız.',
    true
),
(
    'Vitamin B12 (Cobalamin)', 'B12 Vitamini (Kobalamin)',
    'Essential for nerve tissue health and brain function.',
    'Sinir dokusu sağlığı ve beyin fonksiyonu için gereklidir.',
    'vitamin', 'tablet', '1000', 'mcg',
    ARRAY['Nerve health', 'DNA production', 'Energy'],
    ARRAY['Sinir sağlığı', 'DNA üretimi', 'Enerji'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Meat', 'Fish', 'Dairy'],
    ARRAY['Et', 'Balık', 'Süt ürünleri'],
    'Dissolve under tongue or swallow daily.',
    'Dil altında eritin veya yutun.',
    true
),
(
    'Vitamin C (Ascorbic Acid)', 'C Vitamini (Askorbik Asit)',
    'Powerful antioxidant that boosts immune system.',
    'Bağışıklık sistemini güçlendiren güçlü antioksidan.',
    'vitamin', 'tablet', '1000', 'mg',
    ARRAY['Immunity', 'Collagen synthesis', 'Antioxidant'],
    ARRAY['Bağışıklık', 'Kolajen sentezi', 'Antioksidan'],
    ARRAY['Stomach upset', 'Diarrhea (high doses)'],
    ARRAY['Mide rahatsızlığı', 'İshal (yüksek dozlarda)'],
    ARRAY['Oranges', 'Peppers', 'Strawberries'],
    ARRAY['Portakal', 'Biber', 'Çilek'],
    'Take 1 tablet daily.',
    'Günde 1 tablet alınız.',
    true
),
(
    'Vitamin D3 (Cholecalciferol)', 'D3 Vitamini (Kolekalsiferol)',
    'Essential for bone health and immune function.',
    'Kemik sağlığı ve bağışıklık fonksiyonu için gereklidir.',
    'vitamin', 'softgel', '5000', 'IU',
    ARRAY['Bone strength', 'Immune support', 'Mood'],
    ARRAY['Kemik gücü', 'Bağışıklık desteği', 'Ruh hali'],
    ARRAY['Calcium buildup (excessive use)'],
    ARRAY['Kalsiyum birikimi (aşırı kullanım)'],
    ARRAY['Sunlight', 'Fatty fish', 'Egg yolks'],
    ARRAY['Güneş ışığı', 'Yağlı balık', 'Yumurta sarısı'],
    'Take 1 softgel with a fatty meal.',
    'Yağlı bir öğünle 1 kapsül alınız.',
    true
),
(
    'Vitamin E (Tocopherol)', 'E Vitamini (Tokoferol)',
    'Antioxidant that protects cells from damage.',
    'Hücreleri hasardan koruyan antioksidan.',
    'vitamin', 'softgel', '400', 'IU',
    ARRAY['Skin health', 'Antioxidant', 'Eye health'],
    ARRAY['Cilt sağlığı', 'Antioksidan', 'Göz sağlığı'],
    ARRAY['Bleeding risk (very high doses)'],
    ARRAY['Kanama riski (çok yüksek dozlarda)'],
    ARRAY['Almonds', 'Sunflower seeds', 'Spinach'],
    ARRAY['Badem', 'Ay çekirdeği', 'Ispanak'],
    'Take 1 softgel daily.',
    'Günde 1 kapsül alınız.',
    true
),
(
    'Vitamin K1 (Phylloquinone)', 'K1 Vitamini (Filokinon)',
    'Vital for blood clotting.',
    'Kan pıhtılaşması için hayati önem taşır.',
    'vitamin', 'tablet', '100', 'mcg',
    ARRAY['Blood clotting', 'Bone health'],
    ARRAY['Kan pıhtılaşması', 'Kemik sağlığı'],
    ARRAY['Interference with blood thinners'],
    ARRAY['Kan sulandırıcılarla etkileşim'],
    ARRAY['Kale', 'Spinach', 'Broccoli'],
    ARRAY['Kale', 'Ispanak', 'Brokoli'],
    'Take 1 tablet daily.',
    'Günde 1 tablet alınız.',
    true
),
(
    'Vitamin K2 (Menaquinone)', 'K2 Vitamini (Menakinon)',
    'Directs calcium to bones and teeth.',
    'Kalsiyumu kemiklere ve dişlere yönlendirir.',
    'vitamin', 'softgel', '100', 'mcg',
    ARRAY['Bone density', 'Heart health', 'Dental health'],
    ARRAY['Kemik yoğunluğu', 'Kalp sağlığı', 'Diş sağlığı'],
    ARRAY['None known'],
    ARRAY['Bilinen yok'],
    ARRAY['Natto', 'Hard cheese', 'Egg yolk'],
    ARRAY['Natto', 'Sert peynir', 'Yumurta sarısı'],
    'Take 1 softgel daily with fat.',
    'Yağ ile günde 1 kapsül alınız.',
    true
),

-- ================= MINERALS =================
(
    'Magnesium Glycinate', 'Magnezyum Glisinat',
    'Highly absorbable form of magnesium for relaxation.',
    'Rahatlama için yüksek emilimli magnezyum formu.',
    'mineral', 'tablet', '200', 'mg',
    ARRAY['Muscle relaxation', 'Better sleep', 'Nerve function'],
    ARRAY['Kas gevşemesi', 'Daha iyi uyku', 'Sinir fonksiyonu'],
    ARRAY['Diarrhea (high doses)'],
    ARRAY['İshal (yüksek dozlarda)'],
    ARRAY['Pumpkin seeds', 'Spinach', 'Dark chocolate'],
    ARRAY['Kabak çekirdeği', 'Ispanak', 'Bitter çikolata'],
    'Take 2 tablets before bed.',
    'Yatmadan önce 2 tablet alınız.',
    true
),
(
    'Zinc Picolinate', 'Çinko Pikolinat',
    'Essential for immune function and testosterone.',
    'Bağışıklık fonksiyonu ve testosteron için gereklidir.',
    'mineral', 'capsule', '30', 'mg',
    ARRAY['Immune support', 'Wound healing', 'Hormone balance'],
    ARRAY['Bağışıklık desteği', 'Yara iyileşmesi', 'Hormon dengesi'],
    ARRAY['Nausea (on empty stomach)'],
    ARRAY['Mide bulantısı (aç karnına)'],
    ARRAY['Oysters', 'Beef', 'Pumpkin seeds'],
    ARRAY['İstiridye', 'Sığır eti', 'Kabak çekirdeği'],
    'Take 1 capsule with food.',
    'Yemekle 1 kapsül alınız.',
    true
),
(
    'Iron (Bisglycinate)', 'Demir (Bisglisinat)',
    'Gentle iron form for blood health.',
    'Kan sağlığı için nazik demir formu.',
    'mineral', 'capsule', '25', 'mg',
    ARRAY['Prevents anemia', 'Energy levels', 'Oxygen transport'],
    ARRAY['Anemiyi önler', 'Enerji seviyeleri', 'Oksijen taşınımı'],
    ARRAY['Constipation'],
    ARRAY['Kabızlık'],
    ARRAY['Red meat', 'Spinach', 'Lentils'],
    ARRAY['Kırmızı et', 'Ispanak', 'Mercimek'],
    'Take 1 capsule with Vitamin C.',
    'C Vitamini ile 1 kapsül alınız.',
    true
),
(
    'Calcium Citrate', 'Kalsiyum Sitrat',
    'Easily absorbed calcium for bones.',
    'Kemikler için kolay emilen kalsiyum.',
    'mineral', 'tablet', '600', 'mg',
    ARRAY['Bone strength', 'Muscle contraction'],
    ARRAY['Kemik gücü', 'Kas kasılması'],
    ARRAY['Bloating', 'Constipation'],
    ARRAY['Şişkinlik', 'Kabızlık'],
    ARRAY['Dairy', 'Almonds', 'Leafy greens'],
    ARRAY['Süt ürünleri', 'Badem', 'Yeşil yapraklı sebzeler'],
    'Take 1-2 tablets daily.',
    'Günde 1-2 tablet alınız.',
    true
),
(
    'Potassium Citrate', 'Potasyum Sitrat',
    'Electrolyte for heart and muscle function.',
    'Kalp ve kas fonksiyonu için elektrolit.',
    'mineral', 'capsule', '99', 'mg',
    ARRAY['Blood pressure', 'Muscle function', 'Fluid balance'],
    ARRAY['Kan basıncı', 'Kas fonksiyonu', 'Sıvı dengesi'],
    ARRAY['Stomach upset'],
    ARRAY['Mide rahatsızlığı'],
    ARRAY['Bananas', 'Potatoes', 'Avocado'],
    ARRAY['Muz', 'Patates', 'Avokado'],
    'Take 1 capsule with food.',
    'Yemekle 1 kapsül alınız.',
    true
),
(
    'Selenium', 'Selenyum',
    'Antioxidant mineral for thyroid health.',
    'Tiroid sağlığı için antioksidan mineral.',
    'mineral', 'capsule', '200', 'mcg',
    ARRAY['Thyroid health', 'Antioxidant', 'Immunity'],
    ARRAY['Tiroid sağlığı', 'Antioksidan', 'Bağışıklık'],
    ARRAY['Hair loss (toxic doses)'],
    ARRAY['Saç dökülmesi (toksik dozlarda)'],
    ARRAY['Brazil nuts', 'Fish', 'Eggs'],
    ARRAY['Brezilya cevizi', 'Balık', 'Yumurta'],
    'Take 1 capsule daily.',
    'Günde 1 kapsül alınız.',
    true
),
(
    'Copper (Bisglycinate)', 'Bakır (Bisglisinat)',
    'Trace mineral for energy and iron absorption.',
    'Enerji ve demir emilimi için iz mineral.',
    'mineral', 'capsule', '2', 'mg',
    ARRAY['Iron absorption', 'Collagen formation', 'Energy'],
    ARRAY['Demir emilimi', 'Kolajen oluşumu', 'Enerji'],
    ARRAY['Nausea'],
    ARRAY['Mide bulantısı'],
    ARRAY['Liver', 'Oysters', 'Dark chocolate'],
    ARRAY['Karaciğer', 'İstiridye', 'Bitter çikolata'],
    'Take 1 capsule daily (balance with Zinc).',
    'Günde 1 kapsül alınız (Çinko ile dengeleyin).',
    true
),
(
    'Iodine (Kelp)', 'İyot (Kelp)',
    'Essential for thyroid hormones.',
    'Tiroid hormonları için gereklidir.',
    'mineral', 'tablet', '150', 'mcg',
    ARRAY['Thyroid function', 'Metabolism', 'Development'],
    ARRAY['Tiroid fonksiyonu', 'Metabolizma', 'Gelişim'],
    ARRAY['Thyroid issues (excessive use)'],
    ARRAY['Tiroid sorunları (aşırı kullanım)'],
    ARRAY['Seaweed', 'Fish', 'Iodized salt'],
    ARRAY['Deniz yosunu', 'Balık', 'İyotlu tuz'],
    'Take 1 tablet daily.',
    'Günde 1 tablet alınız.',
    true
),
(
    'Manganese', 'Manganez',
    'Trace mineral for bone and metabolism.',
    'Kemik ve metabolizma için iz mineral.',
    'mineral', 'capsule', '2', 'mg',
    ARRAY['Bone formation', 'Antioxidant', 'Metabolism'],
    ARRAY['Kemik oluşumu', 'Antioksidan', 'Metabolizma'],
    ARRAY['Nerve damage (excessive use)'],
    ARRAY['Sinir hasarı (aşırı kullanım)'],
    ARRAY['Whole grains', 'Nuts', 'Leafy greens'],
    ARRAY['Tam tahıllar', 'Kuruyemişler', 'Yeşil yapraklı sebzeler'],
    'Take 1 capsule daily.',
    'Günde 1 kapsül alınız.',
    true
),
(
    'Chromium Picolinate', 'Krom Pikolinat',
    'Helps regulate blood sugar.',
    'Kan şekerini düzenlemeye yardımcı olur.',
    'mineral', 'capsule', '200', 'mcg',
    ARRAY['Blood sugar control', 'Metabolism'],
    ARRAY['Kan şekeri kontrolü', 'Metabolizma'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Broccoli', 'Grape juice', 'Turkey'],
    ARRAY['Brokoli', 'Üzüm suyu', 'Hindi'],
    'Take 1 capsule with a carb-meal.',
    'Karbonhidratlı bir öğünle 1 kapsül alınız.',
    true
),
(
    'Molybdenum', 'Molibden',
    'Helps break down proteins and toxins.',
    'Proteinleri ve toksinleri parçalamaya yardımcı olur.',
    'mineral', 'capsule', '75', 'mcg',
    ARRAY['Detoxification', 'Enzyme function'],
    ARRAY['Detoksifikasyon', 'Enzim fonksiyonu'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Legumes', 'Grains', 'Nuts'],
    ARRAY['Baklagiller', 'Tahıllar', 'Kuruyemişler'],
    'Take 1 capsule daily.',
    'Günde 1 kapsül alınız.',
    true
),
(
    'Boron', 'Bor',
    'Trace mineral for bones and hormones.',
    'Kemikler ve hormonlar için iz mineral.',
    'mineral', 'capsule', '3', 'mg',
    ARRAY['Bone health', 'Testosterone support', 'Brain function'],
    ARRAY['Kemik sağlığı', 'Testosteron desteği', 'Beyin fonksiyonu'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Raisins', 'Almonds', 'Avocado'],
    ARRAY['Kuru üzüm', 'Badem', 'Avokado'],
    'Take 1 capsule daily.',
    'Günde 1 kapsül alınız.',
    true
),

-- ================= SPORTS & BODYBUILDING =================
(
    'Whey Protein Isolate', 'Whey Protein İzole',
    'Fast-absorbing protein for muscle recovery.',
    'Kas iyileşmesi için hızlı emilen protein.',
    'sport', 'powder', '25', 'g',
    ARRAY['Muscle growth', 'Fast recovery', 'Leucine source'],
    ARRAY['Kas büyümesi', 'Hızlı iyileşme', 'Lösin kaynağı'],
    ARRAY['Bloating (if lactose sensitive)'],
    ARRAY['Şişkinlik (laktoz hassasiyeti varsa)'],
    ARRAY['Milk'],
    ARRAY['Süt'],
    'Mix 1 scoop with water after workout.',
    'Antrenmandan sonra 1 ölçeği su ile karıştırın.',
    true
),
(
    'Creatine Monohydrate', 'Kreatin Monohidrat',
    'Most researched supplement for power and strength.',
    'Güç ve kuvvet için en çok araştırılan takviye.',
    'sport', 'powder', '5', 'g',
    ARRAY['Increases strength', 'Muscle volume', 'Brain performance'],
    ARRAY['Gücü artırır', 'Kas hacmi', 'Beyin performansı'],
    ARRAY['Water retention', 'Stomach upset'],
    ARRAY['Su tutma', 'Mide rahatsızlığı'],
    ARRAY['Red meat', 'Herring'],
    ARRAY['Kırmızı et', 'Ringa balığı'],
    'Take 5g daily anytime.',
    'Günde 5g herhangi bir zamanda alınız.',
    true
),
(
    'Beta-Alanine', 'Beta-Alanin',
    'Amino acid that buffers acid in muscles.',
    'Kaslardaki asidi tamponlayan amino asit.',
    'sport', 'powder', '3.2', 'g',
    ARRAY['Endurance', 'Delays fatigue', 'Performance'],
    ARRAY['Dayanıklılık', 'Yorgunluğu geciktirir', 'Performans'],
    ARRAY['Tingling sensation (paresthesia)'],
    ARRAY['Karıncalanma hissi (parestezi)'],
    ARRAY['Meat', 'Poultry'],
    ARRAY['Et', 'Kümes hayvanları'],
    'Take 3-4g before workout.',
    'Antrenmandan önce 3-4g alınız.',
    true
),
(
    'L-Citrulline', 'L-Sitrülin',
    'Boosts nitric oxide and blood flow.',
    'Nitrik oksit ve kan akışını artırır.',
    'sport', 'powder', '6', 'g',
    ARRAY['Better pumps', 'Blood flow', 'Reduced soreness'],
    ARRAY['Daha iyi pump', 'Kan akışı', 'Azalmış ağrı'],
    ARRAY['Stomach discomfort'],
    ARRAY['Mide rahatsızlığı'],
    ARRAY['Watermelon'],
    ARRAY['Karpuz'],
    'Take 6-8g before workout.',
    'Antrenmandan önce 6-8g alınız.',
    true
),
(
    'BCAA (2:1:1)', 'BCAA (2:1:1)',
    'Branched-chain amino acids for muscle preservation.',
    'Kas koruması için dallı zincirli amino asitler.',
    'sport', 'powder', '5', 'g',
    ARRAY['Prevents muscle breakdown', 'Reduces fatigue'],
    ARRAY['Kas yıkımını önler', 'Yorgunluğu azaltır'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Meat', 'Dairy', 'Eggs'],
    ARRAY['Et', 'Süt ürünleri', 'Yumurta'],
    'Drink during workout.',
    'Antrenman sırasında içiniz.',
    true
),
(
    'EAA (Essential Amino Acids)', 'EAA (Esansiyel Amino Asitler)',
    'Complete spectrum of essential amino acids.',
    'Esansiyel amino asitlerin tam spektrumu.',
    'sport', 'powder', '10', 'g',
    ARRAY['Muscle protein synthesis', 'Recovery'],
    ARRAY['Kas protein sentezi', 'İyileşme'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Meat', 'Eggs'],
    ARRAY['Et', 'Yumurta'],
    'Drink during or after workout.',
    'Antrenman sırasında veya sonrasında içiniz.',
    true
),
(
    'L-Glutamine', 'L-Glutamin',
    'Most abundant amino acid for gut and recovery.',
    'Bağırsak ve iyileşme için en bol bulunan amino asit.',
    'sport', 'powder', '5', 'g',
    ARRAY['Gut health', 'Immunity', 'Muscle recovery'],
    ARRAY['Bağırsak sağlığı', 'Bağışıklık', 'Kas iyileşmesi'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Meat', 'Bone broth'],
    ARRAY['Et', 'Kemik suyu'],
    'Take 5g post-workout.',
    'Antrenman sonrası 5g alınız.',
    true
),
(
    'Casein Protein', 'Kazein Proteini',
    'Slow-digesting protein for night time.',
    'Gece kullanımı için yavaş sindirilen protein.',
    'sport', 'powder', '25', 'g',
    ARRAY['Nighttime recovery', 'Sustained amino release'],
    ARRAY['Gece iyileşmesi', 'Sürekli amino salınımı'],
    ARRAY['Bloating'],
    ARRAY['Şişkinlik'],
    ARRAY['Milk', 'Cottage cheese'],
    ARRAY['Süt', 'Süzme peynir'],
    'Take 1 scoop before bed.',
    'Yatmadan önce 1 ölçek alınız.',
    true
),
(
    'ZMA', 'ZMA',
    'Zinc, Magnesium, and B6 blend for sleep.',
    'Uyku için Çinko, Magnezyum ve B6 karışımı.',
    'sport', 'capsule', '3', 'caps',
    ARRAY['Sleep quality', 'Recovery', 'Testosterone support'],
    ARRAY['Uyku kalitesi', 'İyileşme', 'Testosteron desteği'],
    ARRAY['Vivid dreams'],
    ARRAY['Canlı rüyalar'],
    ARRAY['Supplement blend'],
    ARRAY['Takviye karışımı'],
    'Take 3 capsules before bed on empty stomach.',
    'Yatmadan önce aç karnına 3 kapsül alınız.',
    true
),
(
    'HMB', 'HMB',
    'Metabolite of Leucine that prevents muscle breakdown.',
    'Kas yıkımını önleyen Lösin metaboliti.',
    'sport', 'capsule', '3', 'g',
    ARRAY['Prevents muscle loss', 'Strength'],
    ARRAY['Kas kaybını önler', 'Güç'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Grapefruit', 'Alfalfa'],
    ARRAY['Greyfurt', 'Yonca'],
    'Take 1g three times daily.',
    'Günde üç kez 1g alınız.',
    true
),
(
    'L-Carnitine', 'L-Karnitin',
    'Transports fatty acids into mitochondria.',
    'Yağ asitlerini mitokondriye taşır.',
    'sport', 'liquid', '3000', 'mg',
    ARRAY['Fat burning', 'Endurance', 'Brain health'],
    ARRAY['Yağ yakımı', 'Dayanıklılık', 'Beyin sağlığı'],
    ARRAY['Nausea', 'Fishy odor (rare)'],
    ARRAY['Mide bulantısı', 'Balık kokusu (nadir)'],
    ARRAY['Red meat'],
    ARRAY['Kırmızı et'],
    'Take 1 serving before workout.',
    'Antrenmandan önce 1 porsiyon alınız.',
    true
),
(
    'Betaine Anhydrous', 'Susuz Betain',
    'Supports power and liver health.',
    'Güç ve karaciğer sağlığını destekler.',
    'sport', 'powder', '2.5', 'g',
    ARRAY['Power output', 'Muscle endurance', 'Liver health'],
    ARRAY['Güç çıktısı', 'Kas dayanıklılığı', 'Karaciğer sağlığı'],
    ARRAY['Stomach upset'],
    ARRAY['Mide rahatsızlığı'],
    ARRAY['Beets', 'Spinach'],
    ARRAY['Pancar', 'Ispanak'],
    'Take 2.5g pre-workout.',
    'Antrenman öncesi 2.5g alınız.',
    true
),
(
    'Taurine', 'Taurin',
    'Amino acid for hydration and heart health.',
    'Hidrasyon ve kalp sağlığı için amino asit.',
    'sport', 'powder', '2', 'g',
    ARRAY['Hydration', 'Calmness', 'Heart health'],
    ARRAY['Hidrasyon', 'Sakinlik', 'Kalp sağlığı'],
    ARRAY['None common'],
    ARRAY['Yaygın değil'],
    ARRAY['Meat', 'Fish'],
    ARRAY['Et', 'Balık'],
    'Take 1-2g pre-workout.',
    'Antrenman öncesi 1-2g alınız.',
    true
),

-- ================= JOINT, LONGEVITY & COGNITIVE =================
(
    'Glucosamine Sulfate', 'Glukozamin Sülfat',
    'Building block for cartilage.',
    'Kıkırdak için yapı taşı.',
    'joint', 'tablet', '1500', 'mg',
    ARRAY['Joint health', 'Pain relief', 'Mobility'],
    ARRAY['Eklem sağlığı', 'Ağrı kesici', 'Hareketlilik'],
    ARRAY['Bloating', 'Shellfish allergy warning'],
    ARRAY['Şişkinlik', 'Kabuklu deniz ürünü alerjisi uyarısı'],
    ARRAY['Shellfish shells'],
    ARRAY['Kabuklu deniz hayvanı kabukları'],
    'Take 1500mg daily.',
    'Günde 1500mg alınız.',
    true
),
(
    'MSM (Methylsulfonylmethane)', 'MSM (Metilsülfonilmetan)',
    'Organic sulfur for joints and inflammation.',
    'Eklemler ve inflamasyon için organik kükürt.',
    'joint', 'powder', '3', 'g',
    ARRAY['Reduces inflammation', 'Joint pain', 'Recovery'],
    ARRAY['İnflamasyonu azaltır', 'Eklem ağrısı', 'İyileşme'],
    ARRAY['Nausea', 'Headache'],
    ARRAY['Mide bulantısı', 'Baş ağrısı'],
    ARRAY['Green vegetables', 'Milk'],
    ARRAY['Yeşil sebzeler', 'Süt'],
    'Take 3g daily.',
    'Günde 3g alınız.',
    true
),
(
    'Collagen Peptides', 'Kolajen Peptitleri',
    'Structural protein for skin and joints.',
    'Cilt ve eklemler için yapısal protein.',
    'joint', 'powder', '10', 'g',
    ARRAY['Skin elasticity', 'Joint health', 'Hair growth'],
    ARRAY['Cilt elastikiyeti', 'Eklem sağlığı', 'Saç uzaması'],
    ARRAY['Heaviness in stomach'],
    ARRAY['Midede ağırlık'],
    ARRAY['Bone broth', 'Chicken skin'],
    ARRAY['Kemik suyu', 'Tavuk derisi'],
    'Mix 1 scoop into coffee or smoothie.',
    'Kahve veya smoothie içine 1 ölçek karıştırın.',
    true
),
(
    'CoQ10 (Ubiquinone)', 'CoQ10 (Ubikinon)',
    'Cellular energy and heart health.',
    'Hücresel enerji ve kalp sağlığı.',
    'other', 'softgel', '100', 'mg',
    ARRAY['Heart health', 'Energy', 'Antioxidant'],
    ARRAY['Kalp sağlığı', 'Enerji', 'Antioksidan'],
    ARRAY['Insomnia (if taken late)'],
    ARRAY['Uykusuzluk (geç alınırsa)'],
    ARRAY['Heart', 'Liver', 'Beef'],
    ARRAY['Yürek', 'Karaciğer', 'Sığır eti'],
    'Take 1 softgel with a meal.',
    'Yemekle 1 kapsül alınız.',
    true
),
(
    'Lion''s Mane Mushroom', 'Aslan Yelesi Mantarı',
    'Mushroom for brain and nerve growth.',
    'Beyin ve sinir büyümesi için mantar.',
    'nootropic', 'capsule', '1000', 'mg',
    ARRAY['Memory', 'Focus', 'Nerve regeneration'],
    ARRAY['Hafıza', 'Odaklanma', 'Sinir rejenerasyonu'],
    ARRAY['Itching (rare)'],
    ARRAY['Kaşıntı (nadir)'],
    ARRAY['Lion''s Mane Mushroom'],
    ARRAY['Aslan Yelesi Mantarı'],
    'Take 2 capsules daily.',
    'Günde 2 kapsül alınız.',
    true
),
(
    'Rhodiola Rosea', 'Altın Kök (Rhodiola)',
    'Adaptogen for stress and fatigue.',
    'Stres ve yorgunluk için adaptojen.',
    'herbal', 'capsule', '500', 'mg',
    ARRAY['Stress relief', 'Energy', 'Mood'],
    ARRAY['Stres giderme', 'Enerji', 'Ruh hali'],
    ARRAY['Dizziness', 'Dry mouth'],
    ARRAY['Baş dönmesi', 'Ağız kuruluğu'],
    ARRAY['Rhodiola root'],
    ARRAY['Rhodiola kökü'],
    'Take 1 capsule in the morning.',
    'Sabah 1 kapsül alınız.',
    true
),
(
    'Maca Root', 'Maca Kökü',
    'Peruvian root for libido and energy.',
    'Libido ve enerji için Peru kökü.',
    'herbal', 'powder', '5', 'g',
    ARRAY['Libido', 'Energy', 'Hormone balance'],
    ARRAY['Libido', 'Enerji', 'Hormon dengesi'],
    ARRAY['Jitters (rare)'],
    ARRAY['Gerginlik (nadir)'],
    ARRAY['Maca root'],
    ARRAY['Maca kökü'],
    'Mix 1 tsp into smoothie.',
    '1 tatlı kaşığını smoothie''ye karıştırın.',
    true
),
(
    'Melatonin', 'Melatonin',
    'Hormone that regulates sleep.',
    'Uykuyu düzenleyen hormon.',
    'other', 'tablet', '3', 'mg',
    ARRAY['Faster sleep', 'Sleep quality'],
    ARRAY['Daha hızlı uyku', 'Uyku kalitesi'],
    ARRAY['Grogginess next day'],
    ARRAY['Ertesi gün sersemlik'],
    ARRAY['Tart cherries'],
    ARRAY['Vişne'],
    'Take 30 mins before bed.',
    'Yatmadan 30 dakika önce alınız.',
    true
),
(
    'Ashwagandha', 'Ashwagandha',
    'Adaptogen for stress and testosterone.',
    'Stres ve testosteron için adaptojen.',
    'herbal', 'capsule', '600', 'mg',
    ARRAY['Reduces cortisol', 'Anxiety relief', 'Testosterone'],
    ARRAY['Kortizolü düşürür', 'Kaygı giderme', 'Testosteron'],
    ARRAY['Drowsiness'],
    ARRAY['Uyuklama'],
    ARRAY['Ashwagandha root'],
    ARRAY['Ashwagandha kökü'],
    'Take 1 capsule with dinner.',
    'Akşam yemeğiyle 1 kapsül alınız.',
    true
),
(
    'Curcumin (Turmeric)', 'Kurkumin (Zerdeçal)',
    'Active compound in turmeric for inflammation.',
    'İnflamasyon için zerdeçaldaki aktif bileşik.',
    'herbal', 'capsule', '500', 'mg',
    ARRAY['Anti-inflammatory', 'Joint pain', 'Brain health'],
    ARRAY['Anti-inflamatuar', 'Eklem ağrısı', 'Beyin sağlığı'],
    ARRAY['Stomach upset'],
    ARRAY['Mide rahatsızlığı'],
    ARRAY['Turmeric root'],
    ARRAY['Zerdeçal kökü'],
    'Take with black pepper for absorption.',
    'Emilim için karabiberle alınız.',
    true
),
(
    'Omega-3 Fish Oil', 'Omega-3 Balık Yağı',
    'Essential fatty acids EPA and DHA.',
    'Esansiyel yağ asitleri EPA ve DHA.',
    'other', 'softgel', '2000', 'mg',
    ARRAY['Heart health', 'Brain function', 'Inflammation'],
    ARRAY['Kalp sağlığı', 'Beyin fonksiyonu', 'İnflamasyon'],
    ARRAY['Fishy burps'],
    ARRAY['Balık tadında geğirme'],
    ARRAY['Fatty fish (Salmon, Mackerel)'],
    ARRAY['Yağlı balık (Somon, Uskumru)'],
    'Take 2 softgels with food.',
    'Yemekle 2 kapsül alınız.',
    true
),
(
    'NAC (N-Acetyl Cysteine)', 'NAC (N-Asetil Sistein)',
    'Precursor to glutathione.',
    'Glutatyon öncüsü.',
    'other', 'capsule', '600', 'mg',
    ARRAY['Liver detox', 'Lung health', 'Antioxidant'],
    ARRAY['Karaciğer detoksu', 'Akciğer sağlığı', 'Antioksidan'],
    ARRAY['Nausea'],
    ARRAY['Mide bulantısı'],
    ARRAY['Supplement form only'],
    ARRAY['Sadece takviye formunda'],
    'Take 1 capsule daily.',
    'Günde 1 kapsül alınız.',
    true
),
(
    'Alpha GPC', 'Alfa GPC',
    'Choline source for cognitive focus.',
    'Bilişsel odaklanma için kolin kaynağı.',
    'nootropic', 'capsule', '300', 'mg',
    ARRAY['Focus', 'Memory', 'Power output'],
    ARRAY['Odaklanma', 'Hafıza', 'Güç çıktısı'],
    ARRAY['Headache'],
    ARRAY['Baş ağrısı'],
    ARRAY['Organ meats'],
    ARRAY['Sakatat'],
    'Take 1 capsule pre-study or pre-workout.',
    'Ders veya antrenman öncesi 1 kapsül alınız.',
    true
);
