-- ============================================================================
-- CUSTOM FOOD ITEMS & MEALS SCHEMA
-- Adds a focused, detailed database for raw foods and home-cooked meals 
-- mapping to lipid profiles (cholesterol, saturated fat)
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_tr TEXT NOT NULL,
    category TEXT,
    category_tr TEXT,
    serving_size TEXT,
    calories NUMERIC DEFAULT 0,
    protein_g NUMERIC DEFAULT 0,
    carbs_g NUMERIC DEFAULT 0,
    fat_g NUMERIC DEFAULT 0,
    saturated_fat_g NUMERIC DEFAULT 0,
    cholesterol_mg NUMERIC DEFAULT 0,
    fiber_g NUMERIC DEFAULT 0,
    sugar_g NUMERIC DEFAULT 0,
    sodium_mg NUMERIC DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE custom_food_items IS 'Database for raw foods and home-cooked meals including detailed lipid profiles';

-- Insert into nutrition_logs a reference to this table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nutrition_logs' AND column_name = 'custom_food_id') THEN
        ALTER TABLE nutrition_logs ADD COLUMN custom_food_id UUID REFERENCES custom_food_items(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Make existing food_item_id or custom_food_id exclusive if needed (Optional, keeping flexible for now)
-- ALTER TABLE nutrition_logs ADD CONSTRAINT nutrition_logs_food_source_check CHECK (
--     (food_item_id IS NOT NULL AND custom_food_id IS NULL) OR 
--     (food_item_id IS NULL AND custom_food_id IS NOT NULL)
-- );

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_custom_food ON nutrition_logs(custom_food_id);
CREATE INDEX IF NOT EXISTS idx_custom_food_items_creator ON custom_food_items(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_food_items_verified ON custom_food_items(is_verified);

-- RLS Policies
ALTER TABLE custom_food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Verified custom foods are viewable by everyone" ON custom_food_items;
CREATE POLICY "Verified custom foods are viewable by everyone" ON custom_food_items
    FOR SELECT USING (is_verified = TRUE);

DROP POLICY IF EXISTS "Users can view own custom foods" ON custom_food_items;
CREATE POLICY "Users can view own custom foods" ON custom_food_items
    FOR SELECT TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert own custom foods" ON custom_food_items;
CREATE POLICY "Users can insert own custom foods" ON custom_food_items
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own custom foods" ON custom_food_items;
CREATE POLICY "Users can update own custom foods" ON custom_food_items
    FOR UPDATE TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own custom foods" ON custom_food_items;
CREATE POLICY "Users can delete own custom foods" ON custom_food_items
    FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_custom_food_items_updated_at ON custom_food_items;
CREATE TRIGGER update_custom_food_items_updated_at BEFORE UPDATE ON custom_food_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data for basic verified foods (Bilingual)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM custom_food_items WHERE name = 'Olive Oil') THEN
        INSERT INTO custom_food_items (name, name_tr, category, category_tr, serving_size, calories, protein_g, carbs_g, fat_g, saturated_fat_g, cholesterol_mg, fiber_g, sugar_g, sodium_mg, is_verified) VALUES
        ('Olive Oil', 'Zeytinyağı', 'Raw/Basic Food', 'Temel/Çiğ Gıda', '1 tbsp (15g)', 119, 0, 0, 13.5, 1.9, 0, 0, 0, 0, TRUE),
        ('Butter', 'Tereyağı', 'Raw/Basic Food', 'Temel/Çiğ Gıda', '1 tbsp (14g)', 102, 0.1, 0.1, 11.5, 7.3, 31, 0, 0.1, 91, TRUE),
        ('Boiled Egg', 'Yumurta (Haşlanmış)', 'Raw/Basic Food', 'Temel/Çiğ Gıda', '1 large (50g)', 78, 6.3, 0.6, 5.3, 1.6, 186, 0, 0.6, 62, TRUE),
        ('Chicken Breast (Cooked)', 'Tavuk Göğsü (Pişmiş)', 'Raw/Basic Food', 'Temel/Çiğ Gıda', '100g', 165, 31.0, 0, 3.6, 1.0, 85, 0, 0, 74, TRUE),
        ('Ground Beef (20% Fat)', 'Dana Kıyma (%20 Yağlı)', 'Raw/Basic Food', 'Temel/Çiğ Gıda', '100g', 254, 17.2, 0, 20.0, 7.6, 71, 0, 0, 81, TRUE),
        ('Whole Milk', 'Tam Yağlı Süt', 'Raw/Basic Food', 'Temel/Çiğ Gıda', '1 cup (200ml)', 122, 6.4, 9.4, 6.4, 4.0, 24, 0, 9.4, 86, TRUE),
        ('Lentil Soup', 'Mercimek Çorbası', 'Home-Cooked Meal', 'Ev Yemeği', '1 portion (250g)', 150, 7.5, 20.0, 5.0, 1.0, 5, 6.0, 2.0, 800, TRUE),
        ('Baked Beans with Meat', 'Etli Kuru Fasulye', 'Home-Cooked Meal', 'Ev Yemeği', '1 portion (200g)', 280, 15.0, 30.0, 10.0, 4.5, 25, 8.0, 3.0, 650, TRUE),
        ('Buttered Rice Pilaf', 'Tereyağlı Pirinç Pilavı', 'Home-Cooked Meal', 'Ev Yemeği', '1 portion (150g)', 220, 3.5, 40.0, 5.0, 3.0, 10, 1.0, 0.5, 450, TRUE),
        ('Stuffed Eggplant (Karniyarik)', 'Karnıyarık', 'Home-Cooked Meal', 'Ev Yemeği', '1 portion (200g)', 270, 12.0, 15.0, 18.0, 6.0, 30, 4.0, 5.0, 500, TRUE),
        ('Tzatziki (Cacik)', 'Cacık', 'Home-Cooked Meal', 'Ev Yemeği', '1 bowl (150g)', 80, 4.5, 6.0, 4.0, 2.5, 15, 0.5, 4.0, 250, TRUE),
        ('Green Beans with Olive Oil', 'Zeytinyağlı Taze Fasulye', 'Home-Cooked Meal', 'Ev Yemeği', '1 portion (200g)', 120, 3.0, 12.0, 7.0, 1.0, 0, 5.0, 4.0, 400, TRUE),
        ('Baked Salmon', 'Fırın Somon', 'Home-Cooked Meal', 'Ev Yemeği', '1 portion (150g)', 310, 30.0, 0, 20.0, 4.0, 80, 0, 0, 90, TRUE),
        ('Grilled Meatballs', 'Izgara Köfte', 'Home-Cooked Meal', 'Ev Yemeği', '1 portion (4 pieces, 120g)', 300, 20.0, 5.0, 22.0, 9.0, 85, 1.0, 1.0, 550, TRUE);
    END IF;
END $$;
