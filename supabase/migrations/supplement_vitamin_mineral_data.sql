-- BioSync Supplement, Vitamin & Mineral Data
-- Run this SQL in your Supabase SQL Editor after running SUPABASE_TABLES.sql
-- This file contains extended data for supplements, vitamins, and minerals

-- ============================================
-- EXTENDED SUPPLEMENTS DATA
-- ============================================

INSERT INTO supplements (name, brand, category, type, dosage, unit, serving_size, ingredients, benefits, side_effects, warnings, interactions, recommended_intake, price, availability, is_verified) VALUES
-- Protein Supplements
('Whey Protein Isolate', 'Optimum Nutrition', 'protein', 'powder', '25g', 'g', '1 scoop', 
 ARRAY['Whey protein isolate', 'Natural flavors', 'Stevia', 'Lecithin'], 
 ARRAY['Muscle building', 'Recovery', 'Weight management', 'Complete amino acid profile'], 
 ARRAY['Bloating', 'Gas', 'Allergic reactions (dairy)'], 
 ARRAY['Contains dairy/milk', 'Consult doctor if pregnant or nursing', 'Not suitable for lactose intolerant'], 
 ARRAY['May interact with certain antibiotics', 'Levodopa absorption may be reduced'], 
 '{"min": 20, "max": 50, "unit": "g", "frequency": "daily"}', 
 '{"min": 25, "max": 35, "currency": "USD"}', TRUE, TRUE),

('Whey Protein Concentrate', 'Dymatize', 'protein', 'powder', '24g', 'g', '1 scoop', 
 ARRAY['Whey protein concentrate', 'Natural flavors', 'Xanthan gum', 'Sucralose'], 
 ARRAY['Muscle growth', 'Recovery', 'Affordable protein source'], 
 ARRAY['Digestive discomfort', 'Bloating', 'Lactose sensitivity'], 
 ARRAY['Contains lactose', 'Not for vegans'], 
 ARRAY['May affect levodopa absorption'], 
 '{"min": 20, "max": 50, "unit": "g", "frequency": "daily"}', 
 '{"min": 20, "max": 30, "currency": "USD"}', TRUE, TRUE),

('Casein Protein', 'Optimum Nutrition', 'protein', 'powder', '24g', 'g', '1 scoop', 
 ARRAY['Micellar casein', 'Natural flavors', 'Sunflower lecithin'], 
 ARRAY['Slow digestion', 'Overnight recovery', 'Anti-catabolic'], 
 ARRAY['Heavier stomach feeling', 'Slower digestion'], 
 ARRAY['Contains dairy', 'Not suitable before intense activity'], 
 ARRAY['May interact with levodopa'], 
 '{"min": 20, "max": 40, "unit": "g", "frequency": "before bed"}', 
 '{"min": 25, "max": 40, "currency": "USD"}', TRUE, TRUE),

('Plant Protein Blend', 'Vega', 'protein', 'powder', '20g', 'g', '1 scoop', 
 ARRAY['Pea protein', 'Hemp protein', 'Pumpkin seed protein', 'Natural flavors'], 
 ARRAY['Vegan friendly', 'Complete amino acids', 'Easy digestion'], 
 ARRAY['Gritty texture', 'Earthy taste'], 
 ARRAY['May contain tree nuts'], 
 ARRAY['Generally well tolerated'], 
 '{"min": 20, "max": 40, "unit": "g", "frequency": "daily"}', 
 '{"min": 30, "max": 50, "currency": "USD"}', TRUE, TRUE),

('Soy Protein Isolate', 'NOW Foods', 'protein', 'powder', '20g', 'g', '1 scoop', 
 ARRAY['Soy protein isolate', 'Natural flavors', 'Lecithin'], 
 ARRAY['Complete plant protein', 'Heart health', 'Cholesterol support'], 
 ARRAY['Hormonal concerns', 'Allergic reactions'], 
 ARRAY['Avoid with hormone-sensitive conditions', 'GMO concerns unless organic'], 
 ARRAY['May affect thyroid medication'], 
 '{"min": 20, "max": 40, "unit": "g", "frequency": "daily"}', 
 '{"min": 15, "max": 25, "currency": "USD"}', TRUE, TRUE),

-- Pre-Workout Supplements
('Pre-Workout Energy', 'Cellucor C4', 'pre_workout', 'powder', '6g', 'g', '1 scoop', 
 ARRAY['Beta-alanine', 'Caffeine (150mg)', 'Creatine nitrate', 'Arginine AKG', 'Vitamin C'], 
 ARRAY['Energy boost', 'Focus enhancement', 'Performance', 'Muscle pump'], 
 ARRAY['Jitters', 'Anxiety', 'Sleep issues', 'Tingling sensation'], 
 ARRAY['High caffeine content', 'Don''t exceed recommended dose', 'Not for caffeine sensitive'], 
 ARRAY['May interact with MAOIs', 'Avoid with other stimulants'], 
 '{"min": 1, "max": 2, "unit": "scoop", "frequency": "pre-workout"}', 
 '{"min": 25, "max": 45, "currency": "USD"}', TRUE, TRUE),

('Stim-Free Pre-Workout', 'Transparent Labs', 'pre_workout', 'powder', '10g', 'g', '1 scoop', 
 ARRAY['Citrulline malate', 'Beta-alanine', 'Betaine', 'Taurine', 'Tyrosine'], 
 ARRAY['Pump without stimulants', 'Focus', 'Endurance'], 
 ARRAY['Tingling from beta-alanine', 'Stomach discomfort'], 
 ARRAY['Caffeine-free', 'Good for evening workouts'], 
 ARRAY['Generally well tolerated'], 
 '{"min": 1, "max": 1, "unit": "scoop", "frequency": "pre-workout"}', 
 '{"min": 35, "max": 50, "currency": "USD"}', TRUE, TRUE),

-- Post-Workout & Recovery
('BCAA 2:1:1', 'Scivation Xtend', 'post_workout', 'powder', '7g', 'g', '1 scoop', 
 ARRAY['Leucine', 'Isoleucine', 'Valine', 'Electrolyte blend'], 
 ARRAY['Muscle recovery', 'Reduced soreness', 'Hydration'], 
 ARRAY['Bitter taste', 'Insulin response'], 
 ARRAY['May affect blood sugar'], 
 ARRAY['Generally safe'], 
 '{"min": 5, "max": 15, "unit": "g", "frequency": "intra/post-workout"}', 
 '{"min": 20, "max": 35, "currency": "USD"}', TRUE, TRUE),

('EAA Complete', 'Kaged Muscle', 'post_workout', 'powder', '10g', 'g', '1 scoop', 
 ARRAY['All 9 essential amino acids', 'Coconut water powder'], 
 ARRAY['Complete muscle protein synthesis', 'Better than BCAAs alone'], 
 ARRAY['Stomach upset', 'Nausea'], 
 ARRAY['Take with food if sensitive'], 
 ARRAY['Generally safe'], 
 '{"min": 10, "max": 20, "unit": "g", "frequency": "post-workout"}', 
 '{"min": 30, "max": 45, "currency": "USD"}', TRUE, TRUE),

('Creatine Monohydrate', 'MuscleTech', 'other', 'powder', '5g', 'g', '1 scoop', 
 ARRAY['Creatine monohydrate (Creapure)'], 
 ARRAY['Strength', 'Power', 'Muscle mass', 'Cognitive support'], 
 ARRAY['Water retention', 'Weight gain', 'Stomach cramps'], 
 ARRAY['Drink plenty of water', 'Consult doctor if kidney issues', 'Loading phase optional'], 
 ARRAY['May interact with diuretics', 'Caffeine may reduce effects'], 
 '{"min": 3, "max": 5, "unit": "g", "frequency": "daily"}', 
 '{"min": 15, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Creatine HCL', 'Kaged Muscle', 'other', 'powder', '750mg', 'mg', '1 scoop', 
 ARRAY['Creatine hydrochloride'], 
 ARRAY['Better solubility', 'Lower dose needed', 'No loading required'], 
 ARRAY['Stomach upset', 'Acidic taste'], 
 ARRAY['Lower dose than monohydrate'], 
 ARRAY['Generally well tolerated'], 
 '{"min": 750, "max": 1500, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 30, "currency": "USD"}', TRUE, TRUE),

-- Vitamins (as supplements)
('Vitamin D3 2000 IU', 'Nature Made', 'vitamin', 'capsule', '2000', 'IU', '1 softgel', 
 ARRAY['Vitamin D3 (cholecalciferol)', 'Olive oil', 'Gelatin'], 
 ARRAY['Bone health', 'Immune support', 'Mood regulation', 'Testosterone support'], 
 ARRAY['Toxicity at high doses', 'Hypercalcemia'], 
 ARRAY['Take with fat for absorption', 'Monitor levels if taking high doses'], 
 ARRAY['May interact with certain weight loss drugs'], 
 '{"min": 1000, "max": 5000, "unit": "IU", "frequency": "daily"}', 
 '{"min": 10, "max": 20, "currency": "USD"}', TRUE, TRUE),

('Vitamin D3 5000 IU', 'NOW Foods', 'vitamin', 'capsule', '5000', 'IU', '1 softgel', 
 ARRAY['Vitamin D3 (cholecalciferol)', 'Extra virgin olive oil'], 
 ARRAY['High potency D3', 'Immune support', 'Bone health'], 
 ARRAY['Risk of toxicity', 'Nausea', 'Fatigue'], 
 ARRAY['Get blood levels checked regularly', 'Not for long-term without monitoring'], 
 ARRAY['Consult doctor if on medications'], 
 '{"min": 2000, "max": 5000, "unit": "IU", "frequency": "daily"}', 
 '{"min": 12, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Vitamin C 1000mg', 'Solgar', 'vitamin', 'tablet', '1000', 'mg', '1 tablet', 
 ARRAY['Ascorbic acid', 'Rose hips', 'Citrus bioflavonoids'], 
 ARRAY['Immune support', 'Antioxidant', 'Collagen production'], 
 ARRAY['Stomach upset', 'Diarrhea at high doses'], 
 ARRAY['Take with food', 'Time-release options available'], 
 ARRAY['May affect blood sugar tests', 'High doses may interfere with chemotherapy'], 
 '{"min": 500, "max": 2000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 8, "max": 18, "currency": "USD"}', TRUE, TRUE),

('Vitamin B Complex', 'Garden of Life', 'vitamin', 'capsule', '1', 'capsule', '1 capsule', 
 ARRAY['B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic)', 'B6 (Pyridoxine)', 'B7 (Biotin)', 'B9 (Folate)', 'B12 (Methylcobalamin)'], 
 ARRAY['Energy metabolism', 'Nervous system', 'Hair/skin/nails', 'Stress support'], 
 ARRAY['Niacin flush', 'Bright yellow urine', 'Nausea'], 
 ARRAY['Take with food', 'Time of day flexible'], 
 ARRAY['B6 may interact with levodopa', 'Folate may mask B12 deficiency'], 
 '{"min": 1, "max": 2, "unit": "capsule", "frequency": "daily"}', 
 '{"min": 20, "max": 40, "currency": "USD"}', TRUE, TRUE),

('Vitamin B12 Methylcobalamin', 'Jarrow Formulas', 'vitamin', 'capsule', '1000', 'mcg', '1 lozenge', 
 ARRAY['Methylcobalamin (active B12)', 'Xylitol', 'Natural cherry flavor'], 
 ARRAY['Nervous system', 'Energy', 'Red blood cells', 'Vegan friendly'], 
 ARRAY['Rare at normal doses', 'Anxiety at very high doses'], 
 ARRAY['Dissolve under tongue', 'Sublingual for best absorption'], 
 ARRAY['Generally very safe', 'High doses safe (water soluble)'], 
 '{"min": 500, "max": 5000, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 10, "max": 20, "currency": "USD"}', TRUE, TRUE),

('Vitamin E 400 IU', 'NOW Foods', 'vitamin', 'capsule', '400', 'IU', '1 softgel', 
 ARRAY['d-Alpha tocopherol', 'Soybean oil', 'Gelatin'], 
 ARRAY['Antioxidant', 'Skin health', 'Cell protection'], 
 ARRAY['Bleeding risk at high doses', 'Headache'], 
 ARRAY['Natural form preferred', 'Avoid if on blood thinners'], 
 ARRAY['May increase bleeding risk with anticoagulants'], 
 '{"min": 200, "max": 400, "unit": "IU", "frequency": "daily"}', 
 '{"min": 10, "max": 20, "currency": "USD"}', TRUE, TRUE),

('Vitamin K2 MK-7', 'Doctor''s Best', 'vitamin', 'capsule', '100', 'mcg', '1 capsule', 
 ARRAY['Vitamin K2 (MK-7 from natto)', 'Microcrystalline cellulose'], 
 ARRAY['Bone health', 'Heart health', 'Calcium direction'], 
 ARRAY['Rare', 'Interacts with blood thinners'], 
 ARRAY['Take with D3 for synergy', 'Avoid if on warfarin'], 
 ARRAY['Critical interaction with warfarin/blood thinners'], 
 '{"min": 100, "max": 200, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 15, "max": 25, "currency": "USD"}', TRUE, TRUE),

-- Minerals (as supplements)
('Calcium Citrate', 'Thorne Research', 'mineral', 'capsule', '250', 'mg', '2 capsules', 
 ARRAY['Calcium citrate', 'Vegetarian capsule'], 
 ARRAY['Bone health', 'Better absorption than carbonate', 'Gentle on stomach'], 
 ARRAY['Constipation', 'Gas'], 
 ARRAY['Take in divided doses', 'Absorbed with or without food'], 
 ARRAY['May interfere with certain antibiotics', 'Iron absorption blocked'], 
 '{"min": 500, "max": 1000, "unit": "mg", "frequency": "twice daily"}', 
 '{"min": 20, "max": 35, "currency": "USD"}', TRUE, TRUE),

('Calcium Carbonate', 'Caltrate', 'mineral', 'tablet', '600', 'mg', '1 tablet', 
 ARRAY['Calcium carbonate', 'Vitamin D3'], 
 ARRAY['Bone health', 'Affordable', 'High elemental calcium'], 
 ARRAY['Constipation', 'Gas', 'Need stomach acid'], 
 ARRAY['Take with food', 'Best with meals'], 
 ARRAY['Interferes with levothyroxine', 'Iron absorption'], 
 '{"min": 600, "max": 1200, "unit": "mg", "frequency": "daily"}', 
 '{"min": 12, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Magnesium Glycinate', 'Pure Encapsulations', 'mineral', 'capsule', '200', 'mg', '2 capsules', 
 ARRAY['Magnesium (as glycinate)', 'Vegetarian capsule'], 
 ARRAY['Relaxation', 'Sleep', 'Muscle function', 'Gentle on stomach'], 
 ARRAY['Drowsiness', 'Diarrhea (rare with glycinate)'], 
 ARRAY['Best before bed', 'Highly absorbable form'], 
 ARRAY['May interact with antibiotics', 'Blood pressure medications'], 
 '{"min": 200, "max": 400, "unit": "mg", "frequency": "daily"}', 
 '{"min": 25, "max": 40, "currency": "USD"}', TRUE, TRUE),

('Magnesium Citrate', 'Natural Vitality', 'mineral', 'powder', '200', 'mg', '1 tsp', 
 ARRAY['Magnesium citrate', 'Natural flavors'], 
 ARRAY['Relaxation', 'Constipation relief', 'Sleep'], 
 ARRAY['Loose stools', 'Diarrhea'], 
 ARRAY['Start with lower dose', 'Great for constipation'], 
 ARRAY['May affect heart medications'], 
 '{"min": 200, "max": 400, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 30, "currency": "USD"}', TRUE, TRUE),

('Zinc Picolinate', 'Thorne Research', 'mineral', 'capsule', '30', 'mg', '1 capsule', 
 ARRAY['Zinc (as picolinate)', 'Vegetarian capsule'], 
 ARRAY['Immune support', 'Wound healing', 'Testosterone', 'Highly absorbable'], 
 ARRAY['Nausea', 'Copper deficiency with long-term use'], 
 ARRAY['Take with food', 'Cycle if long-term use'], 
 ARRAY['May interact with antibiotics', 'Penicillamine'], 
 '{"min": 15, "max": 50, "unit": "mg", "frequency": "daily"}', 
 '{"min": 10, "max": 18, "currency": "USD"}', TRUE, TRUE),

('Iron Bisglycinate', 'Solgar', 'mineral', 'capsule', '25', 'mg', '1 capsule', 
 ARRAY['Iron (as bisglycinate)', 'Vegetarian capsule'], 
 ARRAY['Gentle on stomach', 'Non-constipating', 'Anemia support'], 
 ARRAY['Nausea', 'Constipation (less than other forms)', 'Dark stools'], 
 ARRAY['Take with vitamin C', 'Avoid with calcium', 'Empty stomach best'], 
 ARRAY['Major interaction with levodopa', 'Thyroid medication', 'Antacids'], 
 '{"min": 18, "max": 25, "unit": "mg", "frequency": "daily"}', 
 '{"min": 12, "max": 22, "currency": "USD"}', TRUE, TRUE),

('Selenium 200mcg', 'NOW Foods', 'mineral', 'capsule', '200', 'mcg', '1 capsule', 
 ARRAY['Selenium (as L-selenomethionine)', 'Vegetarian capsule'], 
 ARRAY['Thyroid support', 'Antioxidant', 'Immune function'], 
 ARRAY['Toxicity at high doses', 'Garlic breath', 'Hair loss'], 
 ARRAY['Do not exceed 400mcg', 'Brazil nuts also contain selenium'], 
 ARRAY['May interact with chemotherapy', 'Statins'], 
 '{"min": 55, "max": 200, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

-- Other Supplements
('Omega-3 Fish Oil', 'Nordic Naturals', 'other', 'capsule', '1000', 'mg', '1 softgel', 
 ARRAY['Fish oil (EPA/DHA)', 'Natural lemon flavor', 'Vitamin E (preservative)'], 
 ARRAY['Heart health', 'Brain function', 'Anti-inflammatory', 'Joint health'], 
 ARRAY['Fishy aftertaste', 'Indigestion', 'Nausea'], 
 ARRAY['May cause bleeding at high doses', 'Refrigerate after opening'], 
 ARRAY['May interact with blood thinners', 'Blood pressure meds'], 
 '{"min": 1000, "max": 3000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 40, "currency": "USD"}', TRUE, TRUE),

('Krill Oil', 'Schiff MegaRed', 'other', 'capsule', '500', 'mg', '1 softgel', 
 ARRAY['Krill oil (EPA/DHA/phospholipids)', 'Astaxanthin'], 
 ARRAY['Better absorption than fish oil', 'Antioxidant', 'Joint health'], 
 ARRAY['Fishy aftertaste', 'Cost'], 
 ARRAY['Shellfish allergy warning', 'Sustainable harvesting'], 
 ARRAY['Blood thinner interaction'], 
 '{"min": 500, "max": 1000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 25, "max": 45, "currency": "USD"}', TRUE, TRUE),

('Glucosamine Chondroitin', 'Move Free', 'other', 'tablet', '1500', 'mg', '2 tablets', 
 ARRAY['Glucosamine sulfate', 'Chondroitin sulfate', 'MSM', 'Hyaluronic acid'], 
 ARRAY['Joint health', 'Cartilage support', 'Mobility'], 
 ARRAY['Stomach upset', 'Allergic reactions (shellfish)'], 
 ARRAY['Shellfish warning', 'Takes 4-6 weeks to work'], 
 ARRAY['May affect blood sugar', 'Warfarin interaction'], 
 '{"min": 1500, "max": 3000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 40, "currency": "USD"}', TRUE, TRUE),

('Turmeric Curcumin', 'Sports Research', 'other', 'capsule', '500', 'mg', '1 capsule', 
 ARRAY['Curcumin C3 complex', 'Black pepper extract (BioPerine)', 'Coconut oil'], 
 ARRAY['Anti-inflammatory', 'Joint health', 'Antioxidant'], 
 ARRAY['Stomach upset', 'Blood thinning'], 
 ARRAY['Take with black pepper for absorption', 'With food'], 
 ARRAY['Blood thinner interaction', 'Gallbladder issues'], 
 '{"min": 500, "max": 1500, "unit": "mg", "frequency": "daily"}', 
 '{"min": 18, "max": 35, "currency": "USD"}', TRUE, TRUE),

('Ashwagandha KSM-66', 'Nootropics Depot', 'other', 'capsule', '300', 'mg', '1 capsule', 
 ARRAY['KSM-66 Ashwagandha extract', 'Vegetarian capsule'], 
 ARRAY['Stress relief', 'Cortisol reduction', 'Testosterone', 'Sleep'], 
 ARRAY['Stomach upset', 'Drowsiness'], 
 ARRAY['Standardized extract', 'Best with food'], 
 ARRAY['Sedative interaction', 'Thyroid medication'], 
 '{"min": 300, "max": 600, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 40, "currency": "USD"}', TRUE, TRUE),

('Rhodiola Rosea', 'Gaia Herbs', 'other', 'capsule', '500', 'mg', '1 capsule', 
 ARRAY['Rhodiola rosea extract', 'Vegetarian capsule'], 
 ARRAY['Energy', 'Fatigue reduction', 'Mental performance', 'Adaptogen'], 
 ARRAY['Insomnia', 'Anxiety', 'Jitters'], 
 ARRAY['Take in morning', 'Cycling recommended'], 
 ARRAY['Stimulant interaction', 'Antidepressants'], 
 '{"min": 200, "max": 600, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 35, "currency": "USD"}', TRUE, TRUE),

('Melatonin 3mg', 'Natrol', 'other', 'tablet', '3', 'mg', '1 tablet', 
 ARRAY['Melatonin', 'Vitamin B6', 'Calcium'], 
 ARRAY['Sleep support', 'Jet lag', 'Circadian rhythm'], 
 ARRAY['Morning grogginess', 'Vivid dreams', 'Headache'], 
 ARRAY['Start with lowest dose', 'Take 30 min before bed'], 
 ARRAY['Sedative interaction', 'Blood thinners', 'Blood pressure meds'], 
 '{"min": 1, "max": 5, "unit": "mg", "frequency": "before bed"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Melatonin 5mg Time Release', 'Natrol', 'other', 'tablet', '5', 'mg', '1 tablet', 
 ARRAY['Melatonin (time release)', 'B6', 'Calcium'], 
 ARRAY['Extended sleep support', 'Stay asleep', 'Jet lag'], 
 ARRAY['Morning grogginess', 'Headaches'], 
 ARRAY['Time-release formula', 'Not for children'], 
 ARRAY['Sedative interactions'], 
 '{"min": 3, "max": 10, "unit": "mg", "frequency": "before bed"}', 
 '{"min": 10, "max": 20, "currency": "USD"}', TRUE, TRUE),

('Probiotic 50 Billion', 'Garden of Life', 'other', 'capsule', '1', 'capsule', '1 capsule', 
 ARRAY['Lactobacillus acidophilus', 'Bifidobacterium lactis', '16 strains total'], 
 ARRAY['Gut health', 'Immune support', 'Digestion'], 
 ARRAY['Gas', 'Bloating initially', 'Digestive changes'], 
 ARRAY['Refrigerated for potency', 'Take with food'], 
 ARRAY['Antibiotic interaction (timing)'], 
 '{"min": 1, "max": 2, "unit": "capsule", "frequency": "daily"}', 
 '{"min": 30, "max": 50, "currency": "USD"}', TRUE, TRUE),

('Digestive Enzymes', 'NOW Foods', 'other', 'capsule', '1', 'capsule', '1 capsule', 
 ARRAY['Protease', 'Amylase', 'Lipase', 'Bromelain', 'Papain'], 
 ARRAY['Digestion support', 'Nutrient absorption', 'Bloating relief'], 
 ARRAY['Nausea', 'Diarrhea', 'Abdominal pain'], 
 ARRAY['Take with meals', 'Different enzymes for different foods'], 
 ARRAY['May interact with blood thinners (bromelain)'], 
 '{"min": 1, "max": 2, "unit": "capsule", "frequency": "with meals"}', 
 '{"min": 15, "max": 30, "currency": "USD"}', TRUE, TRUE),

('Collagen Peptides', 'Vital Proteins', 'other', 'powder', '10g', 'g', '1 scoop', 
 ARRAY['Hydrolyzed collagen peptides', 'Hyaluronic acid', 'Vitamin C'], 
 ARRAY['Skin elasticity', 'Joint health', 'Hair/nails', 'Gut health'], 
 ARRAY['Bad taste', 'Not suitable for vegetarians'], 
 ARRAY['Mix in coffee/smoothies', 'Type I & III collagen'], 
 ARRAY['Generally well tolerated'], 
 '{"min": 10, "max": 20, "unit": "g", "frequency": "daily"}', 
 '{"min": 25, "max": 50, "currency": "USD"}', TRUE, TRUE),

('Hyaluronic Acid', 'NeoCell', 'other', 'capsule', '100', 'mg', '2 capsules', 
 ARRAY['Hyaluronic acid', 'Collagen type II'], 
 ARRAY['Skin hydration', 'Joint lubrication', 'Anti-aging'], 
 ARRAY['Rare', 'Allergic reactions'], 
 ARRAY['Works with collagen', 'Skin moisture'], 
 ARRAY['Generally very safe'], 
 '{"min": 100, "max": 200, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 35, "currency": "USD"}', TRUE, TRUE),

('CoQ10 Ubiquinol', 'Jarrow Formulas', 'other', 'capsule', '100', 'mg', '1 softgel', 
 ARRAY['Ubiquinol (reduced CoQ10)', 'Medium chain triglycerides'], 
 ARRAY['Heart health', 'Energy production', 'Antioxidant', 'Statin support'], 
 ARRAY['Insomnia', 'Nausea'], 
 ARRAY['Active form (better absorbed)', 'Take with fat'], 
 ARRAY['Blood thinner interaction', 'Blood pressure meds'], 
 '{"min": 100, "max": 300, "unit": "mg", "frequency": "daily"}', 
 '{"min": 25, "max": 50, "currency": "USD"}', TRUE, TRUE),

('ALA Alpha Lipoic Acid', 'Doctor''s Best', 'other', 'capsule', '300', 'mg', '1 capsule', 
 ARRAY['Alpha lipoic acid', 'Vegetarian capsule'], 
 ARRAY['Antioxidant', 'Blood sugar support', 'Nerve health'], 
 ARRAY['Stomach upset', 'Thiamine deficiency risk'], 
 ARRAY['Universal antioxidant', 'Water and fat soluble'], 
 ARRAY['Thyroid medication interaction', 'Chemotherapy'], 
 '{"min": 300, "max": 600, "unit": "mg", "frequency": "daily"}', 
 '{"min": 15, "max": 30, "currency": "USD"}', TRUE, TRUE),

('5-HTP', 'NOW Foods', 'other', 'capsule', '100', 'mg', '1 capsule', 
 ARRAY['5-HTP (5-Hydroxytryptophan)', 'Glycine', 'Vegetarian capsule'], 
 ARRAY['Mood support', 'Sleep', 'Serotonin precursor'], 
 ARRAY['Nausea', 'Digestive issues', 'Drowsiness'], 
 ARRAY['Start with low dose', 'Take at night'], 
 ARRAY['SSRI interaction (serotonin syndrome)', 'MAOIs'], 
 '{"min": 50, "max": 200, "unit": "mg", "frequency": "daily"}', 
 '{"min": 12, "max": 25, "currency": "USD"}', TRUE, TRUE),

('L-Theanine', 'Suntheanine', 'other', 'capsule', '200', 'mg', '1 capsule', 
 ARRAY['L-Theanine (Suntheanine)', 'Inositol'], 
 ARRAY['Relaxation', 'Focus', 'Sleep quality', 'Calm alertness'], 
 ARRAY['Headache', 'Dizziness'], 
 ARRAY['Take with caffeine for focus', 'Before bed for sleep'], 
 ARRAY['Generally well tolerated'], 
 '{"min": 100, "max": 400, "unit": "mg", "frequency": "daily"}', 
 '{"min": 15, "max": 30, "currency": "USD"}', TRUE, TRUE),

('Caffeine 200mg', 'ProLab', 'other', 'tablet', '200', 'mg', '1 tablet', 
 ARRAY['Caffeine anhydrous', 'Calcium'], 
 ARRAY['Energy', 'Alertness', 'Performance', 'Fat oxidation'], 
 ARRAY['Jitters', 'Insomnia', 'Anxiety', 'Heart palpitations'], 
 ARRAY['Take early in day', 'Not for sensitive individuals'], 
 ARRAY['Many drug interactions', 'MAOIs', 'Stimulants'], 
 '{"min": 100, "max": 400, "unit": "mg", "frequency": "as needed"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Caffeine + L-Theanine', 'Sports Research', 'other', 'capsule', '1', 'capsule', '1 capsule', 
 ARRAY['Caffeine (100mg)', 'L-Theanine (200mg)'], 
 ARRAY['Smooth energy', 'No jitters', 'Focus', 'Calm alertness'], 
 ARRAY['Mild side effects vs caffeine alone'], 
 ARRAY['Best ratio for productivity'], 
 ARRAY['Stimulant interactions reduced'], 
 '{"min": 1, "max": 2, "unit": "capsule", "frequency": "as needed"}', 
 '{"min": 15, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Multivitamin Men', 'Optimum Nutrition', 'vitamin', 'tablet', '3', 'tablets', '3 tablets', 
 ARRAY['Complete vitamin/mineral blend', 'Amino acids', 'Botanical extracts'], 
 ARRAY['Overall health', 'Performance', 'Immune', 'Energy'], 
 ARRAY['Nausea', 'Bright urine', 'Large pills'], 
 ARRAY['Take with food', 'Split doses if needed'], 
 ARRAY['Iron interaction', 'Calcium-magnesium balance'], 
 '{"min": 3, "max": 3, "unit": "tablets", "frequency": "daily"}', 
 '{"min": 15, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Multivitamin Women', 'Rainbow Light', 'vitamin', 'tablet', '1', 'tablet', '1 tablet', 
 ARRAY['Women''s vitamin blend', 'Iron', 'Folate', 'Probiotics'], 
 ARRAY['Women''s health', 'Energy', 'Immune', 'Bone health'], 
 ARRAY['Nausea', 'Constipation', 'Bright urine'], 
 ARRAY['Food-based formula', 'Take with food'], 
 ARRAY['Iron interactions'], 
 '{"min": 1, "max": 2, "unit": "tablet", "frequency": "daily"}', 
 '{"min": 20, "max": 35, "currency": "USD"}', TRUE, TRUE),

('Prenatal Multivitamin', 'Garden of Life', 'vitamin', 'capsule', '3', 'capsules', '3 capsules', 
 ARRAY['Folate (methylated)', 'Iron', 'DHA', 'Choline', 'Vitamin D'], 
 ARRAY['Pregnancy support', 'Fetal development', 'Maternal health'], 
 ARRAY['Nausea', 'Constipation'], 
 ARRAY['Critical for pregnancy', 'Start before conception'], 
 ARRAY['Consult healthcare provider', 'Vitamin A limits'], 
 '{"min": 3, "max": 3, "unit": "capsules", "frequency": "daily"}', 
 '{"min": 30, "max": 60, "currency": "USD"}', TRUE, TRUE),

('Electrolyte Powder', 'LMNT', 'other', 'powder', '6g', 'g', '1 stick', 
 ARRAY['Sodium (1000mg)', 'Potassium (200mg)', 'Magnesium (60mg)'], 
 ARRAY['Hydration', 'Keto support', 'Performance', 'No sugar'], 
 ARRAY['Very salty taste', 'High sodium'], 
 ARRAY['For heavy sweaters', 'Keto/low-carb diets'], 
 ARRAY['Blood pressure medication interaction'], 
 '{"min": 1, "max": 2, "unit": "stick", "frequency": "daily"}', 
 '{"min": 45, "max": 60, "currency": "USD"}', TRUE, TRUE),

('Electrolyte Capsules', 'SaltStick', 'other', 'capsule', '1', 'capsule', '1 capsule', 
 ARRAY['Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Vitamin D'], 
 ARRAY['Convenient hydration', 'Endurance sports', 'Cramps'], 
 ARRAY['Stomach upset if too many'], 
 ARRAY['Take with water', 'During exercise'], 
 ARRAY['Blood pressure meds'], 
 '{"min": 1, "max": 4, "unit": "capsule", "frequency": "during exercise"}', 
 '{"min": 20, "max": 35, "currency": "USD"}', TRUE, TRUE),

('Fiber Supplement Psyllium', 'Metamucil', 'other', 'powder', '3.4g', 'g', '1 rounded tsp', 
 ARRAY['Psyllium husk', 'Maltodextrin', 'Citric acid'], 
 ARRAY['Digestive health', 'Cholesterol support', 'Regularity'], 
 ARRAY['Gas', 'Bloating', 'Choking hazard'], 
 ARRAY['Drink immediately with full glass water', 'Start slowly'], 
 ARRAY['Medication timing (take 2 hours apart)', 'Blood sugar meds'], 
 '{"min": 1, "max": 3, "unit": "tsp", "frequency": "daily"}', 
 '{"min": 12, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Inulin Fiber', 'Now Foods', 'other', 'powder', '5g', 'g', '1 scoop', 
 ARRAY['Inulin (from chicory root)', 'Prebiotic fiber'], 
 ARRAY['Gut health', 'Prebiotic', 'Blood sugar', 'Satiety'], 
 ARRAY['Gas', 'Bloating', 'Cramping'], 
 ARRAY['Start with small dose', 'Increases gradually'], 
 ARRAY['Generally safe'], 
 '{"min": 5, "max": 15, "unit": "g", "frequency": "daily"}', 
 '{"min": 10, "max": 20, "currency": "USD"}', TRUE, TRUE),

('MCT Oil Powder', 'Perfect Keto', 'other', 'powder', '10g', 'g', '1 scoop', 
 ARRAY['MCT oil powder', 'Acacia fiber', 'Stevia'], 
 ARRAY['Keto energy', 'Mental clarity', 'Quick energy source'], 
 ARRAY['Stomach upset', 'Diarrhea', 'Keto flu initially'], 
 ARRAY['Start with small dose', 'Mix in coffee/smoothies'], 
 ARRAY['Generally safe'], 
 '{"min": 5, "max": 15, "unit": "g", "frequency": "daily"}', 
 '{"min": 30, "max": 50, "currency": "USD"}', TRUE, TRUE),

('Beta-Alanine', 'BulkSupplements', 'other', 'powder', '3g', 'g', '1 scoop', 
 ARRAY['Beta-alanine'], 
 ARRAY['Carnosine boost', 'Muscular endurance', 'Performance'], 
 ARRAY['Paresthesia (tingling)', 'Harmless but uncomfortable'], 
 ARRAY['Take with meals to reduce tingling', 'Time-release available'], 
 ARRAY['Generally safe'], 
 '{"min": 3, "max": 6, "unit": "g", "frequency": "daily"}', 
 '{"min": 15, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Citrulline Malate', 'PrimaForce', 'other', 'powder', '6g', 'g', '1 scoop', 
 ARRAY['Citrulline malate (2:1)'], 
 ARRAY['Nitric oxide boost', 'Pump', 'Endurance', 'Recovery'], 
 ARRAY['Stomach upset'], 
 ARRAY['Take pre-workout', 'Empty stomach'], 
 ARRAY['PDE5 inhibitor interaction'], 
 '{"min": 6, "max": 8, "unit": "g", "frequency": "pre-workout"}', 
 '{"min": 20, "max": 35, "currency": "USD"}', TRUE, TRUE),

('Beet Root Powder', 'HumanN', 'other', 'powder', '5g', 'g', '1 scoop', 
 ARRAY['Beetroot powder', 'Nitrate content'], 
 ARRAY['Nitric oxide', 'Blood flow', 'Endurance', 'Natural'], 
 ARRAY['Beeturia (red urine)', 'Stomach upset', 'Kidney stones risk'], 
 ARRAY['Take 2-3 hours before activity', 'Cyclic'], 
 ARRAY['Blood pressure medication'], 
 '{"min": 5, "max": 10, "unit": "g", "frequency": "daily"}', 
 '{"min": 30, "max": 50, "currency": "USD"}', TRUE, TRUE),

('HMB (Beta-hydroxy beta-methylbutyrate)', 'MTS Nutrition', 'other', 'capsule', '1000', 'mg', '2 capsules', 
 ARRAY['HMB (as calcium HMB)'], 
 ARRAY['Muscle preservation', 'Recovery', 'Anti-catabolic'], 
 ARRAY['Minimal side effects'], 
 ARRAY['Best for fasted training', 'Take with meals'], 
 ARRAY['Generally safe'], 
 '{"min": 1000, "max": 3000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 25, "max": 45, "currency": "USD"}', TRUE, TRUE),

('Phosphatidic Acid', 'MuscleTech', 'other', 'capsule', '750', 'mg', '1 capsule', 
 ARRAY['Phosphatidic acid (Mediator)'], 
 ARRAY['mTOR activation', 'Muscle growth', 'Strength'], 
 ARRAY['Minimal reported'], 
 ARRAY['Newer supplement', 'Take with protein'], 
 ARRAY['Generally safe'], 
 '{"min": 750, "max": 1500, "unit": "mg", "frequency": "daily"}', 
 '{"min": 35, "max": 60, "currency": "USD"}', TRUE, TRUE),

('Taurine', 'NOW Foods', 'other', 'capsule', '1000', 'mg', '1 capsule', 
 ARRAY['Taurine free form'], 
 ARRAY['Heart health', 'Electrolyte balance', 'Performance', 'Anxiety'], 
 ARRAY['Minimal', 'Stomach upset'], 
 ARRAY['Often in energy drinks', 'Take with meals'], 
 ARRAY['Generally very safe'], 
 '{"min": 500, "max": 2000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 10, "max": 20, "currency": "USD"}', TRUE, TRUE),

('Betaine (TMG)', 'BulkSupplements', 'other', 'powder', '2.5g', 'g', '1 scoop', 
 ARRAY['Betaine anhydrous (trimethylglycine)'], 
 ARRAY['Power output', 'Cell volumization', 'Homocysteine reduction'], 
 ARRAY['Fishy body odor', 'Stomach upset'], 
 ARRAY['Take with meals'], 
 ARRAY['Generally safe'], 
 '{"min": 1.5, "max": 3, "unit": "g", "frequency": "daily"}', 
 '{"min": 15, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Green Tea Extract', 'Jarrow Formulas', 'other', 'capsule', '500', 'mg', '1 capsule', 
 ARRAY['Green tea extract', 'EGCG', 'Caffeine'], 
 ARRAY['Antioxidant', 'Metabolism', 'Fat oxidation', 'Brain health'], 
 ARRAY['Caffeine sensitivity', 'Liver concerns at high doses'], 
 ARRAY['Decaf options available', 'Take with food'], 
 ARRAY['Iron absorption blocked', 'Blood thinners'], 
 '{"min": 250, "max": 500, "unit": "mg", "frequency": "daily"}', 
 '{"min": 12, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Garcinia Cambogia', 'NatureWise', 'other', 'capsule', '500', 'mg', '1 capsule', 
 ARRAY['Garcinia cambogia extract', 'HCA (hydroxycitric acid)'], 
 ARRAY['Appetite suppression', 'Fat metabolism'], 
 ARRAY['Digestive issues', 'Headache', 'Liver concerns'], 
 ARRAY['Research is mixed', 'With meals'], 
 ARRAY['Diabetes medication interaction'], 
 '{"min": 500, "max": 1500, "unit": "mg", "frequency": "before meals"}', 
 '{"min": 15, "max": 30, "currency": "USD"}', TRUE, TRUE),

('CLA (Conjugated Linoleic Acid)', 'Sports Research', 'other', 'capsule', '1000', 'mg', '1 softgel', 
 ARRAY['CLA (safflower oil)', 'Gelatin', 'Glycerin'], 
 ARRAY['Body composition', 'Fat metabolism'], 
 ARRAY['Stomach upset', 'Insulin resistance concerns'], 
 ARRAY['Take with meals', 'Long-term use debated'], 
 ARRAY['Diabetes medication interaction'], 
 '{"min": 1000, "max": 3000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 20, "max": 35, "currency": "USD"}', TRUE, TRUE),

('Raspberry Ketones', 'aSquared Nutrition', 'other', 'capsule', '500', 'mg', '2 capsules', 
 ARRAY['Raspberry ketones', 'Green tea', 'Caffeine'], 
 ARRAY['Metabolism', 'Weight loss'], 
 ARRAY['Jitters', 'Rapid heartbeat'], 
 ARRAY['Limited human research', 'Often has stimulants'], 
 ARRAY['Stimulant interactions'], 
 '{"min": 100, "max": 400, "unit": "mg", "frequency": "daily"}', 
 '{"min": 15, "max": 30, "currency": "USD"}', TRUE, TRUE),

('Apple Cider Vinegar', 'Bragg', 'other', 'capsule', '500', 'mg', '2 capsules', 
 ARRAY['Apple cider vinegar powder', 'The Mother culture'], 
 ARRAY['Blood sugar', 'Digestion', 'Satiety'], 
 ARRAY['Tooth enamel erosion (liquid)', 'Throat burn', 'Stomach upset'], 
 ARRAY['Capsules avoid acid issues', 'Take with meals'], 
 ARRAY['Diabetes medication interaction'], 
 '{"min": 500, "max": 1500, "unit": "mg", "frequency": "daily"}', 
 '{"min": 10, "max": 20, "currency": "USD"}', TRUE, TRUE),

('Biotin 10000mcg', 'Natrol', 'vitamin', 'tablet', '10000', 'mcg', '1 tablet', 
 ARRAY['Biotin', 'Calcium'], 
 ARRAY['Hair growth', 'Nail strength', 'Skin health'], 
 ARRAY['Minimal', 'Acne in some'], 
 ARRAY['High dose for hair/nails', 'Water soluble'], 
 ARRAY['Interferes with lab tests'], 
 '{"min": 5000, "max": 10000, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 10, "max": 20, "currency": "USD"}', TRUE, TRUE),

('Niacin 500mg', 'Nature Made', 'vitamin', 'tablet', '500', 'mg', '1 tablet', 
 ARRAY['Niacin (nicotinic acid)', 'Calcium'], 
 ARRAY['Cholesterol support', 'Cardiovascular', 'Energy'], 
 ARRAY['Niacin flush', 'Liver toxicity risk'], 
 ARRAY['Flush vs no-flush forms', 'Take with food'], 
 ARRAY['Major statin interaction', 'Blood pressure meds'], 
 '{"min": 500, "max": 2000, "unit": "mg", "frequency": "daily"}', 
 '{"min": 12, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Folic Acid 800mcg', 'Nature Made', 'vitamin', 'tablet', '800', 'mcg', '1 tablet', 
 ARRAY['Folic acid', 'Calcium'], 
 ARRAY['DNA synthesis', 'Prenatal health', 'Heart health'], 
 ARRAY['Masks B12 deficiency'], 
 ARRAY['Methylfolate preferred form', 'Prenatal essential'], 
 ARRAY['Methotrexate interaction'], 
 '{"min": 400, "max": 1000, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Methylfolate 1000mcg', 'Jarrow Formulas', 'vitamin', 'capsule', '1000', 'mcg', '1 capsule', 
 ARRAY['L-Methylfolate (5-MTHF)', 'Vegetarian capsule'], 
 ARRAY['Active folate form', 'MTHFR gene support', 'Mood'], 
 ARRAY['Rare', 'Agitation in some'], 
 ARRAY['Bioavailable form', 'No conversion needed'], 
 ARRAY['Same drug interactions as folic acid'], 
 '{"min": 400, "max": 1000, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 15, "max": 30, "currency": "USD"}', TRUE, TRUE),

('Chromium Picolinate', 'NOW Foods', 'mineral', 'capsule', '200', 'mcg', '1 capsule', 
 ARRAY['Chromium (as picolinate)'], 
 ARRAY['Blood sugar support', 'Cravings reduction'], 
 ARRAY['Rare', 'Kidney concerns at high doses'], 
 ARRAY['Take with meals', 'Monitor if diabetic'], 
 ARRAY['Diabetes medication interaction'], 
 '{"min": 200, "max": 1000, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Boron 3mg', 'NOW Foods', 'mineral', 'capsule', '3', 'mg', '1 capsule', 
 ARRAY['Boron (as boron glycinate)'], 
 ARRAY['Bone health', 'Testosterone support', 'Cognitive function'], 
 ARRAY['Minimal', 'High doses toxic'], 
 ARRAY['Works with D3 and magnesium', 'Trace mineral'], 
 ARRAY['Generally safe'], 
 '{"min": 3, "max": 10, "unit": "mg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Silica/Bamboo Extract', 'Nature''s Way', 'mineral', 'capsule', '300', 'mg', '1 capsule', 
 ARRAY['Bamboo extract (silica)', 'Calcium'], 
 ARRAY['Hair/skin/nails', 'Collagen support', 'Bone health'], 
 ARRAY['Minimal'], 
 ARRAY['Natural silica source', 'Works with collagen'], 
 ARRAY['Generally safe'], 
 '{"min": 300, "max": 600, "unit": "mg", "frequency": "daily"}', 
 '{"min": 15, "max": 25, "currency": "USD"}', TRUE, TRUE),

('Iodine 150mcg', 'NOW Foods', 'mineral', 'tablet', '150', 'mcg', '1 tablet', 
 ARRAY['Potassium iodide', 'Dicalcium phosphate'], 
 ARRAY['Thyroid support', 'Metabolism', 'Brain development'], 
 ARRAY['Thyroid dysfunction', 'Acne flare'], 
 ARRAY['Essential but small amount needed', 'Seafood alternative'], 
 ARRAY['Thyroid medication interaction'], 
 '{"min": 150, "max": 300, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 6, "max": 12, "currency": "USD"}', TRUE, TRUE),

('Copper 2mg', 'NOW Foods', 'mineral', 'tablet', '2', 'mg', '1 tablet', 
 ARRAY['Copper (as copper glycinate)'], 
 ARRAY['Iron absorption', 'Connective tissue', 'Energy'], 
 ARRAY['Nausea', 'Toxic at high doses'], 
 ARRAY['Balance with zinc', 'Don''t take with zinc together'], 
 ARRAY['Zinc interaction (compete for absorption)'], 
 '{"min": 1, "max": 2, "unit": "mg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Manganese 10mg', 'NOW Foods', 'mineral', 'capsule', '10', 'mg', '1 capsule', 
 ARRAY['Manganese (as amino acid chelate)'], 
 ARRAY['Bone health', 'Antioxidant', 'Metabolism'], 
 ARRAY['Toxic at high doses', 'Neurological issues'], 
 ARRAY['Trace amount needed', 'With food'], 
 ARRAY['Iron interaction'], 
 '{"min": 2, "max": 10, "unit": "mg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Molybdenum 250mcg', 'NOW Foods', 'mineral', 'capsule', '250', 'mcg', '1 capsule', 
 ARRAY['Molybdenum (as amino acid chelate)'], 
 ARRAY['Detoxification', 'Sulfur metabolism', 'Enzyme cofactor'], 
 ARRAY['Rare at normal doses'], 
 ARRAY['Ultra-trace mineral', 'With food'], 
 ARRAY['Generally safe'], 
 '{"min": 75, "max": 250, "unit": "mcg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Potassium 99mg', 'NOW Foods', 'mineral', 'tablet', '99', 'mg', '1 tablet', 
 ARRAY['Potassium (as potassium gluconate)'], 
 ARRAY['Blood pressure', 'Muscle function', 'Heart rhythm'], 
 ARRAY['Hyperkalemia risk', 'Nausea'], 
 ARRAY['Regulated dosage', 'Food sources preferred'], 
 ARRAY['ACE inhibitors', 'Diuretics', 'Potassium sparing drugs'], 
 '{"min": 99, "max": 500, "unit": "mg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE),

('Phosphorus 200mg', 'NOW Foods', 'mineral', 'capsule', '200', 'mg', '1 capsule', 
 ARRAY['Phosphorus (as calcium phosphate)'], 
 ARRAY['Bone health', 'Energy production', 'Cell membranes'], 
 ARRAY['Minimal'], 
 ARRAY['Usually adequate in diet', 'With calcium'], 
 ARRAY['May affect some medications'], 
 '{"min": 200, "max": 500, "unit": "mg", "frequency": "daily"}', 
 '{"min": 8, "max": 15, "currency": "USD"}', TRUE, TRUE);

-- ============================================
-- EXTENDED VITAMINS DATA
-- ============================================

INSERT INTO vitamins (name, chemical_name, type, form, dosage, benefits, food_sources, deficiency_symptoms, excess_symptoms, interactions, absorption, safety_considerations, daily_value, unit, availability, is_verified) VALUES
-- B-Complex Vitamins
('Thiamin (B1)', 'Thiamine pyrophosphate', 'water_soluble', 'tablet', '{"adults": {"recommended": "1.2 mg", "maximum": "100 mg"}, "children": {"recommended": "0.5 mg", "maximum": "50 mg"}}', 
 ARRAY['Energy metabolism', 'Nervous system function', 'Heart health', 'Brain function'], 
 ARRAY['Pork', 'Fortified cereals', 'Legumes', 'Whole grains', 'Nuts'], 
 ARRAY['Beriberi', 'Fatigue', 'Weakness', 'Nerve damage', 'Heart problems'], 
 ARRAY['Rare (water soluble)', 'Very high doses may cause headache'], 
 ARRAY['May be depleted by alcohol', 'Diuretics reduce levels'], 
 '{"with_food": ["Always"], "without_food": [], "timing": ["With breakfast"], "notes": "Alcohol depletes B1"}', 
 ARRAY['Generally very safe', 'Alcoholics need supplementation'], 1.2, 'mg', TRUE, TRUE),

('Riboflavin (B2)', 'Riboflavin-5-phosphate', 'water_soluble', 'tablet', '{"adults": {"recommended": "1.3 mg", "maximum": "200 mg"}, "children": {"recommended": "0.5 mg", "maximum": "100 mg"}}', 
 ARRAY['Energy production', 'Cellular function', 'Antioxidant', 'Eye health'], 
 ARRAY['Dairy products', 'Eggs', 'Lean meats', 'Green vegetables', 'Fortified grains'], 
 ARRAY['Ariboflavinosis', 'Cracked lips', 'Sore throat', 'Sensitivity to light'], 
 ARRAY['Bright yellow urine (harmless)', 'Diarrhea at very high doses'], 
 ARRAY['May interact with some antibiotics', 'Tricyclic antidepressants'], 
 '{"with_food": ["Anytime"], "without_food": [], "timing": ["Flexible"], "notes": "Urine color change is normal"}', 
 ARRAY['Very safe', 'Water soluble excess excreted'], 1.3, 'mg', TRUE, TRUE),

('Niacin (B3)', 'Nicotinamide adenine dinucleotide', 'water_soluble', 'tablet', '{"adults": {"recommended": "16 mg", "maximum": "35 mg"}, "children": {"recommended": "6 mg", "maximum": "20 mg"}}', 
 ARRAY['DNA repair', 'Energy metabolism', 'Skin health', 'Nervous system'], 
 ARRAY['Chicken', 'Turkey', 'Tuna', 'Mushrooms', 'Fortified cereals'], 
 ARRAY['Pellagra', 'Dermatitis', 'Dementia', 'Diarrhea', 'Death (severe)'], 
 ARRAY['Flushing', 'Liver damage (high doses)', 'High blood sugar', 'Gout'], 
 ARRAY['Major statin interaction', 'Blood pressure medications', 'Diabetes meds'], 
 '{"with_food": ["Required for flush form"], "without_food": [], "timing": ["With meals"], "notes": "Flush-free forms available"}', 
 ARRAY['High doses require medical supervision', 'Liver monitoring needed'], 16, 'mg', TRUE, TRUE),

('Pantothenic Acid (B5)', 'Coenzyme A', 'water_soluble', 'capsule', '{"adults": {"recommended": "5 mg", "maximum": "1000 mg"}, "children": {"recommended": "2 mg", "maximum": "500 mg"}}', 
 ARRAY['Hormone synthesis', 'Energy metabolism', 'Cholesterol synthesis', 'Wound healing'], 
 ARRAY['Chicken', 'Beef', 'Potatoes', 'Oats', 'Tomatoes'], 
 ARRAY['Rare', 'Fatigue', 'Irritability', 'Numbness', 'Muscle cramps'], 
 ARRAY['Diarrhea', 'Water retention', 'Stomach upset'], 
 ARRAY['Generally well tolerated'], 
 '{"with_food": ["Anytime"], "without_food": [], "timing": ["Flexible"], "notes": "Found in almost all foods"}', 
 ARRAY['Very safe', 'Deficiency extremely rare'], 5, 'mg', TRUE, TRUE),

('Pyridoxine (B6)', 'Pyridoxal-5-phosphate', 'water_soluble', 'tablet', '{"adults": {"recommended": "1.7 mg", "maximum": "100 mg"}, "children": {"recommended": "0.5 mg", "maximum": "60 mg"}}', 
 ARRAY['Neurotransmitter synthesis', 'Protein metabolism', 'Hemoglobin formation', 'Immune function'], 
 ARRAY['Chickpeas', 'Tuna', 'Salmon', 'Chicken', 'Potatoes'], 
 ARRAY['Microcytic anemia', 'Seborrheic dermatitis', 'Depression', 'Confusion', 'Weakened immunity'], 
 ARRAY['Nerve damage (very high doses)', 'Numbness', 'Gait problems'], 
 ARRAY['Major levodopa interaction', 'May reduce phenytoin effectiveness'], 
 '{"with_food": ["Anytime"], "without_food": [], "timing": ["Flexible"], "notes": "Active form P5P available"}', 
 ARRAY['Upper limit 100mg/day established', 'Toxicity reversible'], 1.7, 'mg', TRUE, TRUE),

('Biotin (B7)', 'Coenzyme R', 'water_soluble', 'capsule', '{"adults": {"recommended": "30 mcg", "maximum": "10000 mcg"}, "children": {"recommended": "8 mcg", "maximum": "5000 mcg"}}', 
 ARRAY['Hair and nail strength', 'Energy metabolism', 'Cell growth', 'Fatty acid synthesis'], 
 ARRAY['Eggs (cooked)', 'Nuts', 'Seeds', 'Salmon', 'Avocado'], 
 ARRAY['Hair loss', 'Rash around eyes/nose/mouth', 'Conjunctivitis', 'Neurological symptoms'], 
 ARRAY['Rare', 'May interfere with lab tests', 'Acne (high doses in some)'], 
 ARRAY['Raw egg whites bind biotin', 'Lab test interference'], 
 '{"with_food": ["Anytime"], "without_food": [], "timing": ["Flexible"], "notes": "Cook eggs to avoid binding"}', 
 ARRAY['Very safe', 'High doses for hair/nails'], 30, 'mcg', TRUE, TRUE),

('Folate (B9)', '5-Methyltetrahydrofolate', 'water_soluble', 'capsule', '{"adults": {"recommended": "400 mcg", "maximum": "1000 mcg"}, "children": {"recommended": "150 mcg", "maximum": "600 mcg"}}', 
 ARRAY['DNA synthesis', 'Cell division', 'Prenatal development', 'Red blood cells'], 
 ARRAY['Lentils', 'Chickpeas', 'Asparagus', 'Spinach', 'Fortified grains'], 
 ARRAY['Neural tube defects', 'Megaloblastic anemia', 'Fatigue', 'Weakness', 'Mouth sores'], 
 ARRAY['May mask B12 deficiency', 'High doses may cause neurological damage'], 
 ARRAY['Methotrexate interaction', 'May reduce effectiveness of some antibiotics'], 
 '{"with_food": ["Anytime"], "without_food": [], "timing": ["With meals"], "notes": "Methylfolate is active form"}', 
 ARRAY['Critical in pregnancy', 'Check B12 status with high doses'], 400, 'mcg', TRUE, TRUE),

('Cobalamin (B12)', 'Methylcobalamin', 'water_soluble', 'capsule', '{"adults": {"recommended": "2.4 mcg", "maximum": "1000 mcg"}, "children": {"recommended": "1 mcg", "maximum": "500 mcg"}}', 
 ARRAY['Red blood cell formation', 'DNA synthesis', 'Nerve function', 'Energy'], 
 ARRAY['Clams', 'Beef', 'Fish', 'Dairy', 'Fortified cereals'], 
 ARRAY['Pernicious anemia', 'Fatigue', 'Weakness', 'Nerve damage', 'Memory problems'], 
 ARRAY['Very rare', 'Acne/rosacea flare (rare)', 'Anxiety'], 
 ARRAY['Metformin reduces absorption', 'PPIs reduce absorption', 'Chloramphenicol interaction'], 
 '{"with_food": ["Not required"], "without_food": ["Better absorbed"], "timing": ["Empty stomach"], "notes": "Sublingual best for deficiency"}', 
 ARRAY['Essential for vegans', 'High doses safe (water soluble)'], 2.4, 'mcg', TRUE, TRUE),

-- Other Water Soluble
('Vitamin C (Ascorbic Acid)', 'L-ascorbic acid', 'water_soluble', 'tablet', '{"adults": {"recommended": "90 mg", "maximum": "2000 mg"}, "children": {"recommended": "25 mg", "maximum": "400 mg"}}', 
 ARRAY['Antioxidant', 'Immune support', 'Collagen synthesis', 'Iron absorption'], 
 ARRAY['Citrus fruits', 'Bell peppers', 'Strawberries', 'Broccoli', 'Kiwi'], 
 ARRAY['Scurvy', 'Poor wound healing', 'Bleeding gums', 'Fatigue', 'Frequent infections'], 
 ARRAY['Diarrhea', 'Nausea', 'Kidney stones (high doses in men)', 'Iron overload'], 
 ARRAY['Increases iron absorption', 'May interfere with blood tests', 'Chemotherapy concerns'], 
 '{"with_food": ["Less stomach upset"], "without_food": [], "timing": ["Anytime"], "notes": "Time-release available"}', 
 ARRAY['Generally very safe', 'Upper limit 2000mg'], 90, 'mg', TRUE, TRUE),

('Choline', 'Phosphatidylcholine', 'water_soluble', 'capsule', '{"adults": {"recommended": "550 mg", "maximum": "3500 mg"}, "children": {"recommended": "200 mg", "maximum": "1000 mg"}}', 
 ARRAY['Brain development', 'Liver function', 'Muscle movement', 'Nervous system'], 
 ARRAY['Eggs', 'Liver', 'Meat', 'Fish', 'Cruciferous vegetables'], 
 ARRAY['Liver damage', 'Muscle damage', 'Fatigue', 'Memory problems'], 
 ARRAY['Fishy body odor', 'Nausea', 'Diarrhea', 'Low blood pressure'], 
 ARRAY['May interact with methotrexate'], 
 '{"with_food": ["Reduces nausea"], "without_food": [], "timing": ["With meals"], "notes": "Often grouped with B vitamins"}', 
 ARRAY['Essential for pregnancy', 'Upper limit 3500mg'], 550, 'mg', TRUE, TRUE),

-- Fat Soluble Vitamins
('Vitamin A (Retinol)', 'Retinyl palmitate', 'fat_soluble', 'capsule', '{"adults": {"recommended": "900 mcg", "maximum": "3000 mcg"}, "children": {"recommended": "300 mcg", "maximum": "900 mcg"}}', 
 ARRAY['Vision', 'Immune function', 'Cell growth', 'Reproduction'], 
 ARRAY['Liver', 'Fish oils', 'Eggs', 'Dairy', 'Fortified foods'], 
 ARRAY['Night blindness', 'Dry eyes', 'Increased infections', 'Skin problems'], 
 ARRAY['Liver damage', 'Birth defects', 'Bone fractures', 'Hair loss', 'Confusion'], 
 ARRAY['Isotretinoin interaction (toxic)', 'Orlistat reduces absorption'], 
 '{"with_food": ["Required (fat soluble)"], "without_food": [], "timing": ["With fatty meal"], "notes": "Beta-carotene safer form"}', 
 ARRAY['Toxic at high doses', 'Pregnancy limit 3000mcg'], 900, 'mcg', TRUE, TRUE),

('Vitamin A (Beta-Carotene)', 'Beta-carotene', 'fat_soluble', 'capsule', '{"adults": {"recommended": "900 mcg RAE", "maximum": "15000 mcg"}, "children": {"recommended": "300 mcg RAE", "maximum": "6000 mcg"}}', 
 ARRAY['Safe Vitamin A precursor', 'Antioxidant', 'Immune support', 'Skin health'], 
 ARRAY['Carrots', 'Sweet potatoes', 'Spinach', 'Cantaloupe', 'Red peppers'], 
 ARRAY['Same as Vitamin A (conversion dependent)'], 
 ARRAY['Yellowing skin (harmless)', 'Smokers at higher lung cancer risk'], 
 ARRAY['Safer than retinol', 'Converted as needed'], 
 '{"with_food": ["With fat for conversion"], "without_food": [], "timing": ["With meals"], "notes": "Safer for pregnancy"}', 
 ARRAY['Safer form', 'Smokers avoid high doses'], 900, 'mcg RAE', TRUE, TRUE),

('Vitamin D3', 'Cholecalciferol', 'fat_soluble', 'capsule', '{"adults": {"recommended": "20 mcg (800 IU)", "maximum": "100 mcg (4000 IU)"}, "children": {"recommended": "15 mcg (600 IU)", "maximum": "50 mcg (2000 IU)"}}', 
 ARRAY['Bone health', 'Immune function', 'Muscle function', 'Mood regulation'], 
 ARRAY['Sunlight exposure', 'Fatty fish', 'Fortified milk', 'Egg yolks', 'Mushrooms'], 
 ARRAY['Rickets', 'Osteomalacia', 'Muscle weakness', 'Bone pain', 'Depression'], 
 ARRAY['Hypercalcemia', 'Kidney stones', 'Nausea', 'Vomiting', 'Confusion'], 
 ARRAY['Thiazide diuretics increase risk', 'Orlistat reduces absorption', 'Steroids reduce levels'], 
 '{"with_food": ["Required (fat soluble)"], "without_food": [], "timing": ["With fatty meal"], "notes": "K2 helps direct calcium"}', 
 ARRAY['Test levels regularly if taking >4000 IU', 'D3 more effective than D2'], 20, 'mcg', TRUE, TRUE),

('Vitamin D2', 'Ergocalciferol', 'fat_soluble', 'tablet', '{"adults": {"recommended": "20 mcg (800 IU)", "maximum": "100 mcg (4000 IU)"}, "children": {"recommended": "15 mcg (600 IU)", "maximum": "50 mcg (2000 IU)"}}', 
 ARRAY['Vegan Vitamin D source', 'Bone health', 'Immune support'], 
 ARRAY['Fortified plant milks', 'UV-exposed mushrooms', 'Supplements'], 
 ARRAY['Same as D3 deficiency'], 
 ARRAY['Same as D3 toxicity'], 
 ARRAY['Less potent than D3'], 
 '{"with_food": ["Required"], "without_food": [], "timing": ["With meals"], "notes": "D3 generally preferred"}', 
 ARRAY['Vegan option', 'D3 raises levels better'], 20, 'mcg', TRUE, TRUE),

('Vitamin E', 'D-alpha tocopherol', 'fat_soluble', 'capsule', '{"adults": {"recommended": "15 mg", "maximum": "1000 mg"}, "children": {"recommended": "6 mg", "maximum": "600 mg"}}', 
 ARRAY['Antioxidant', 'Cell membrane protection', 'Immune function', 'Skin health'], 
 ARRAY['Wheat germ', 'Sunflower seeds', 'Almonds', 'Spinach', 'Avocado'], 
 ARRAY['Neuropathy', 'Muscle weakness', 'Vision problems', 'Immune dysfunction'], 
 ARRAY['Bleeding/hemorrhage', 'Increased stroke risk (high doses)', 'Prostate cancer concern'], 
 ARRAY['Blood thinner interaction', 'Chemotherapy/radiation concerns'], 
 '{"with_food": ["Required (fat soluble)"], "without_food": [], "timing": ["With meals"], "notes": "Natural d-alpha preferred"}', 
 ARRAY['Avoid high doses', 'Mixed tocopherols best'], 15, 'mg', TRUE, TRUE),

('Vitamin K1', 'Phylloquinone', 'fat_soluble', 'tablet', '{"adults": {"recommended": "120 mcg", "maximum": "1000 mcg"}, "children": {"recommended": "30 mcg", "maximum": "500 mcg"}}', 
 ARRAY['Blood clotting', 'Bone health'], 
 ARRAY['Leafy greens', 'Broccoli', 'Brussels sprouts', 'Kale', 'Spinach'], 
 ARRAY['Bleeding', 'Easy bruising', 'Heavy periods'], 
 ARRAY['Jaundice', 'Anemia (rare)'], 
 ARRAY['Warfarin interaction (critical)', 'Blood thinner medications'], 
 '{"with_food": ["With fat"], "without_food": [], "timing": ["Consistent timing with warfarin"], "notes": "Keep intake consistent on warfarin"}', 
 ARRAY['Critical warfarin interaction', 'K2 often preferred'], 120, 'mcg', TRUE, TRUE),

('Vitamin K2 MK-7', 'Menaquinone-7', 'fat_soluble', 'capsule', '{"adults": {"recommended": "100 mcg", "maximum": "500 mcg"}, "children": {"recommended": "45 mcg", "maximum": "200 mcg"}}', 
 ARRAY['Bone health', 'Heart health', 'Directs calcium', 'Better than K1 for bones'], 
 ARRAY['Natto (fermented soy)', 'Cheese', 'Egg yolks', 'Butter', 'Fermented foods'], 
 ARRAY['Same as K1 deficiency'], 
 ARRAY['Same as K1 toxicity (rare)'], 
 ARRAY['Same as K1', 'Critical warfarin interaction'], 
 '{"with_food": ["With fat"], "without_food": [], "timing": ["With D3 for synergy"], "notes": "Longer half-life than K1"}', 
 ARRAY['Works with D3', 'Avoid if on warfarin'], 100, 'mcg', TRUE, TRUE),

('Vitamin K2 MK-4', 'Menaquinone-4', 'fat_soluble', 'capsule', '{"adults": {"recommended": "45 mg", "maximum": "45 mg"}, "children": {"recommended": "15 mg", "maximum": "15 mg"}}', 
 ARRAY['Bone density', 'Japan prescription for osteoporosis'], 
 ARRAY['Animal products', 'Dairy', 'Egg yolks'], 
 ARRAY['Same as other K deficiencies'], 
 ARRAY['Minimal research on toxicity'], 
 ARRAY['Same as other K vitamins'], 
 '{"with_food": ["With fat"], "without_food": [], "timing": ["Multiple times daily"], "notes": "Shorter half-life"}', 
 ARRAY['High dose in studies', 'Usually prescription'], 45, 'mg', TRUE, TRUE);

-- ============================================
-- EXTENDED MINERALS DATA  
-- ============================================

INSERT INTO minerals (name, chemical_formula, common_name, type, form, dosage, benefits, food_sources, deficiency_symptoms, excess_symptoms, interactions, absorption, safety_considerations, daily_value, unit, availability, is_verified) VALUES
-- Macro Minerals
('Potassium', 'K', 'Potassium', 'macro', 'capsule', '{"adults": {"recommended": "3400 mg", "maximum": "400 mg supplemental"}, "children": {"recommended": "2000 mg", "maximum": "200 mg supplemental"}}', 
 ARRAY['Fluid balance', 'Nerve transmission', 'Muscle contraction', 'Blood pressure'], 
 ARRAY['Bananas', 'Sweet potatoes', 'White beans', 'Yogurt', 'Spinach'], 
 ARRAY['Hypokalemia', 'Muscle cramps', 'Weakness', 'Constipation', 'Irregular heartbeat'], 
 ARRAY['Hyperkalemia (dangerous)', 'Heart rhythm problems', 'Nausea'], 
 ARRAY['ACE inhibitors', 'Potassium-sparing diuretics', 'NSAIDs'], 
 '{"with_food": ["Food sources best"], "without_food": [], "timing": ["Spread throughout day"], "notes": "Supplement dose limited by FDA"}', 
 ARRAY['Supplement limited to 99mg', 'Food sources preferred'], 3400, 'mg', TRUE, TRUE),

('Sodium', 'Na', 'Sodium', 'macro', 'tablet', '{"adults": {"recommended": "1500 mg", "maximum": "2300 mg"}, "children": {"recommended": "1000 mg", "maximum": "2000 mg"}}', 
 ARRAY['Fluid balance', 'Nerve function', 'Muscle contraction', 'Blood pressure regulation'], 
 ARRAY['Table salt', 'Processed foods', 'Canned goods', 'Bread', 'Cheese'], 
 ARRAY['Hyponatremia', 'Headache', 'Nausea', 'Muscle cramps', 'Confusion'], 
 ARRAY['Hypertension', 'Fluid retention', 'Heart disease', 'Kidney problems'], 
 ARRAY['Diuretics', 'Lithium'], 
 '{"with_food": ["Always present in food"], "without_food": [], "timing": ["Electrolyte balance"], "notes": "Most get too much, not too little"}', 
 ARRAY['Limit processed foods', 'Athletes may need more'], 1500, 'mg', TRUE, TRUE),

('Chloride', 'Cl', 'Chloride', 'macro', 'tablet', '{"adults": {"recommended": "2300 mg", "maximum": "3600 mg"}, "children": {"recommended": "1500 mg", "maximum": "2300 mg"}}', 
 ARRAY['Fluid balance', 'Stomach acid (HCl)', 'Nerve transmission'], 
 ARRAY['Table salt', 'Seaweed', 'Tomatoes', 'Lettuce', 'Olives'], 
 ARRAY['Rare (usually with sodium loss)', 'Excess sweating', 'Vomiting', 'Diarrhea'], 
 ARRAY['Rare with normal kidney function'], 
 ARRAY['Usually accompanies sodium'], 
 '{"with_food": ["Present in salt"], "without_food": [], "timing": ["With meals"], "notes": "Usually adequate from salt"}', 
 ARRAY['Adequate in typical diet', 'Rarely supplemented alone'], 2300, 'mg', TRUE, TRUE),

('Phosphorus', 'P', 'Phosphate', 'macro', 'capsule', '{"adults": {"recommended": "700 mg", "maximum": "4000 mg"}, "children": {"recommended": "500 mg", "maximum": "3000 mg"}}', 
 ARRAY['Bone and teeth strength', 'Energy production (ATP)', 'Cell membranes', 'DNA'], 
 ARRAY['Dairy products', 'Meat', 'Fish', 'Poultry', 'Nuts', 'Beans'], 
 ARRAY['Weak bones', 'Loss of appetite', 'Muscle weakness', 'Bone pain'], 
 ARRAY['Hyperphosphatemia', 'Calcium imbalance', 'Kidney damage'], 
 ARRAY['May interfere with calcium absorption', 'Some antacids'], 
 '{"with_food": ["Anytime"], "without_food": [], "timing": ["With calcium"], "notes": "Balance with calcium important"}', 
 ARRAY['Usually adequate from food', 'Deficiency rare'], 700, 'mg', TRUE, TRUE),

-- Trace Minerals
('Fluoride', 'F', 'Fluoride', 'trace', 'tablet', '{"adults": {"recommended": "4 mg", "maximum": "10 mg"}, "children": {"recommended": "2 mg", "maximum": "2 mg"}}', 
 ARRAY['Dental health', 'Bone strength (controversial)'], 
 ARRAY['Fluoridated water', 'Tea', 'Fish', 'Grapes'], 
 ARRAY['Dental caries', 'Weak tooth enamel'], 
 ARRAY['Dental fluorosis', 'Skeletal fluorosis', 'Bone weakness'], 
 ARRAY['Controversial supplement'], 
 '{"with_food": ["Not applicable"], "without_food": [], "timing": ["Usually topical"], "notes": "Controversial supplementation"}', 
 ARRAY['Controversial', 'Usually from water/toothpaste'], 4, 'mg', TRUE, TRUE),

('Cobalt', 'Co', 'Cobalt', 'trace', 'capsule', '{"adults": {"recommended": "No RDA (part of B12)", "maximum": "Not established"}, "children": {"recommended": "No RDA", "maximum": "Not established"}}', 
 ARRAY['Component of Vitamin B12', 'Red blood cell formation'], 
 ARRAY['Animal products', 'B12 supplements'], 
 ARRAY['B12 deficiency symptoms'], 
 ARRAY['Heart damage', 'Thyroid problems', 'Nerve damage'], 
 ARRAY['Not supplemented alone', 'Part of B12'], 
 '{"with_food": ["Via B12"], "without_food": [], "timing": ["With meals"], "notes": "Always as part of B12"}', 
 ARRAY['Never supplement alone', 'Always as B12'], 0, 'mcg', TRUE, TRUE),

-- Ultra-Trace Minerals
('Nickel', 'Ni', 'Nickel', 'ultra_trace', 'capsule', '{"adults": {"recommended": "No established RDA", "maximum": "1 mg"}, "children": {"recommended": "No RDA", "maximum": "0.5 mg"}}', 
 ARRAY['May be essential for some enzymes', 'Iron absorption'], 
 ARRAY['Chocolate', 'Nuts', 'Legumes', 'Grains', 'Tea'], 
 ARRAY['Not established in humans'], 
 ARRAY['Toxic at low doses', 'Allergic reactions', 'Cancer concern'], 
 ARRAY['Never supplement'], 
 '{"with_food": ["Dietary only"], "without_food": [], "timing": ["Never supplement"], "notes": "Environmental contaminant concern"}', 
 ARRAY['Never supplement', 'Environmental toxin'], 0, 'mcg', TRUE, TRUE),

('Silicon', 'Si', 'Silica', 'ultra_trace', 'capsule', '{"adults": {"recommended": "20-30 mg", "maximum": "700 mg"}, "children": {"recommended": "Not established", "maximum": "Not established"}}', 
 ARRAY['Bone health', 'Collagen formation', 'Hair/skin/nails'], 
 ARRAY['Whole grains', 'Root vegetables', 'Beans', 'Leafy greens'], 
 ARRAY['Not established'], 
 ARRAY['Kidney stones'], 
 ARRAY['Generally safe as food'], 
 '{"with_food": ["Dietary preferred"], "without_food": [], "timing": ["With meals"], "notes": "Silica supplements available"}', 
 ARRAY['Usually adequate from food', 'Silica supplements popular'], 25, 'mg', TRUE, TRUE),

('Vanadium', 'V', 'Vanadium', 'ultra_trace', 'capsule', '{"adults": {"recommended": "No RDA", "maximum": "1.8 mg"}, "children": {"recommended": "No RDA", "maximum": "Not established"}}', 
 ARRAY['May mimic insulin', 'Bone and teeth health (possible)'], 
 ARRAY['Mushrooms', 'Shellfish', 'Black pepper', 'Dill', 'Parsley'], 
 ARRAY['Not established'], 
 ARRAY['Toxic at higher doses', 'Green tongue'], 
 ARRAY['May lower blood sugar', 'Diabetes medication interaction'], 
 '{"with_food": ["Not recommended"], "without_food": [], "timing": ["Avoid supplementation"], "notes": "Not recommended for supplementation"}', 
 ARRAY['Not recommended to supplement', 'Not established essential'], 0, 'mcg', TRUE, TRUE),

('Tin', 'Sn', 'Tin', 'ultra_trace', 'capsule', '{"adults": {"recommended": "No RDA", "maximum": "Not established"}, "children": {"recommended": "No RDA", "maximum": "Not established"}}', 
 ARRAY['Possible growth factor', 'Not well established'], 
 ARRAY['Canned foods', 'Pineapple', 'Carrots', 'Beets', 'Radishes'], 
 ARRAY['Not established'], 
 ARRAY['Not established'], 
 ARRAY['Not supplemented'], 
 '{"with_food": ["Dietary only"], "without_food": [], "timing": ["Not supplemented"], "notes": "Not supplemented"}', 
 ARRAY['Not supplemented', 'Not established essential'], 0, 'mcg', TRUE, TRUE),

('Lithium', 'Li', 'Lithium', 'ultra_trace', 'capsule', '{"adults": {"recommended": "No RDA", "maximum": "Not established"}, "children": {"recommended": "No RDA", "maximum": "Not established"}}', 
 ARRAY['Mood stabilization (pharmaceutical doses)', 'Possible trace role'], 
 ARRAY['Drinking water (variable)', 'Grains', 'Vegetables', 'Dairy'], 
 ARRAY['Not established'], 
 ARRAY['Toxicity narrow window', 'Thyroid', 'Kidney problems'], 
 ARRAY['Many drug interactions', 'Diuretics', 'ACE inhibitors'], 
 '{"with_food": ["Only as prescription"], "without_food": [], "timing": ["Prescription only"], "notes": "Prescription doses only for bipolar"}', 
 ARRAY['Prescription only for mood', 'Not for general supplementation'], 0, 'mcg', TRUE, TRUE),

('Strontium', 'Sr', 'Strontium', 'ultra_trace', 'capsule', '{"adults": {"recommended": "No RDA", "maximum": "Not established"}, "children": {"recommended": "No RDA", "maximum": "Not established"}}', 
 ARRAY['Bone health (strontium ranelate prescription)', 'May increase bone density'], 
 ARRAY['Dairy', 'Root vegetables', 'Wheat bran', 'Beans'], 
 ARRAY['Not established'], 
 ARRAY['Blood clots', 'Cardiovascular risk (ranelate)'], 
 ARRAY['Calcium competition', 'Separate from calcium supplements'], 
 '{"with_food": ["Separate from calcium"], "without_food": [], "timing": ["Bedtime, away from calcium"], "notes": "Citrate form available OTC"}', 
 ARRAY['Ranelate prescription only in some countries', 'OTC citrate available'], 0, 'mg', TRUE, TRUE),

('Bromine', 'Br', 'Bromide', 'ultra_trace', 'capsule', '{"adults": {"recommended": "No RDA", "maximum": "Not established"}, "children": {"recommended": "No RDA", "maximum": "Not established"}}', 
 ARRAY['No established human function', 'Was thought essential'], 
 ARRAY['Grains', 'Nuts', 'Fish'], 
 ARRAY['Not established'], 
 ARRAY['Toxic', 'Bromism', 'Neurological damage'], 
 ARRAY['Never supplement'], 
 '{"with_food": ["Never supplement"], "without_food": [], "timing": ["Avoid"], "notes": "Not recommended, toxic"}', 
 ARRAY['Never supplement', 'Environmental contaminant'], 0, 'mcg', TRUE, TRUE);

-- ============================================
-- INDEXES FOR BETTER SEARCH PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_supplements_brand ON supplements(brand);
CREATE INDEX IF NOT EXISTS idx_supplements_type ON supplements(type);
CREATE INDEX IF NOT EXISTS idx_supplements_ingredients ON supplements USING GIN (ingredients);
CREATE INDEX IF NOT EXISTS idx_supplements_benefits ON supplements USING GIN (benefits);
CREATE INDEX IF NOT EXISTS idx_vitamins_chemical_name ON vitamins(chemical_name);
CREATE INDEX IF NOT EXISTS idx_minerals_chemical_formula ON minerals(chemical_formula);
CREATE INDEX IF NOT EXISTS idx_minerals_common_name ON minerals(common_name);

-- ============================================
-- UPDATED AT TRIGGERS (if not already in SUPABASE_TABLES.sql)
-- ============================================

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS set_supplements_updated_at ON supplements;
CREATE TRIGGER set_supplements_updated_at
    BEFORE UPDATE ON supplements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_vitamins_updated_at ON vitamins;
CREATE TRIGGER set_vitamins_updated_at
    BEFORE UPDATE ON vitamins
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_minerals_updated_at ON minerals;
CREATE TRIGGER set_minerals_updated_at
    BEFORE UPDATE ON minerals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Popular supplements by category
CREATE OR REPLACE VIEW supplements_by_category AS
SELECT 
    category,
    COUNT(*) as count,
    ARRAY_AGG(name ORDER BY name) as products
FROM supplements
WHERE is_verified = TRUE AND availability = TRUE
GROUP BY category
ORDER BY count DESC;

-- View: Vitamins by type (fat vs water soluble)
CREATE OR REPLACE VIEW vitamins_by_type AS
SELECT 
    type,
    COUNT(*) as count,
    ARRAY_AGG(name ORDER BY name) as vitamins
FROM vitamins
WHERE is_verified = TRUE AND availability = TRUE
GROUP BY type;

-- View: Minerals by type (macro vs trace vs ultra-trace)
CREATE OR REPLACE VIEW minerals_by_type AS
SELECT 
    type,
    COUNT(*) as count,
    ARRAY_AGG(name ORDER BY name) as minerals
FROM minerals
WHERE is_verified = TRUE AND availability = TRUE
GROUP BY type;

-- View: All verified supplements with full text search vector
CREATE OR REPLACE VIEW supplements_search AS
SELECT 
    s.*,
    to_tsvector('english', 
        coalesce(name, '') || ' ' || 
        coalesce(brand, '') || ' ' ||
        coalesce(array_to_string(ingredients, ' '), '') || ' ' ||
        coalesce(array_to_string(benefits, ' '), '')
    ) as search_vector
FROM supplements s
WHERE is_verified = TRUE AND availability = TRUE;

-- Full text search function for supplements
CREATE OR REPLACE FUNCTION search_supplements(query TEXT)
RETURNS TABLE (id UUID, name TEXT, brand TEXT, category TEXT, rank REAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.brand,
        s.category,
        ts_rank(s.search_vector, plainto_tsquery('english', query)) as rank
    FROM supplements_search s
    WHERE s.search_vector @@ plainto_tsquery('english', query)
    ORDER BY rank DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TURKISH LANGUAGE SUPPORT (TÜRKÇE DİL DESTEĞİ)
-- ============================================

-- Add Turkish columns to supplements table
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS name_tr TEXT;
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS benefits_tr TEXT[] DEFAULT '{}';
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS side_effects_tr TEXT[] DEFAULT '{}';
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS warnings_tr TEXT[] DEFAULT '{}';
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS interactions_tr TEXT[] DEFAULT '{}';
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS ingredients_tr TEXT[] DEFAULT '{}';

-- Add Turkish columns to vitamins table
ALTER TABLE vitamins ADD COLUMN IF NOT EXISTS name_tr TEXT;
ALTER TABLE vitamins ADD COLUMN IF NOT EXISTS chemical_name_tr TEXT;
ALTER TABLE vitamins ADD COLUMN IF NOT EXISTS benefits_tr TEXT[] DEFAULT '{}';
ALTER TABLE vitamins ADD COLUMN IF NOT EXISTS food_sources_tr TEXT[] DEFAULT '{}';
ALTER TABLE vitamins ADD COLUMN IF NOT EXISTS deficiency_symptoms_tr TEXT[] DEFAULT '{}';
ALTER TABLE vitamins ADD COLUMN IF NOT EXISTS excess_symptoms_tr TEXT[] DEFAULT '{}';
ALTER TABLE vitamins ADD COLUMN IF NOT EXISTS storage_tr TEXT;
ALTER TABLE vitamins ADD COLUMN IF NOT EXISTS stability_tr TEXT;

-- Add Turkish columns to minerals table
ALTER TABLE minerals ADD COLUMN IF NOT EXISTS name_tr TEXT;
ALTER TABLE minerals ADD COLUMN IF NOT EXISTS common_name_tr TEXT;
ALTER TABLE minerals ADD COLUMN IF NOT EXISTS benefits_tr TEXT[] DEFAULT '{}';
ALTER TABLE minerals ADD COLUMN IF NOT EXISTS food_sources_tr TEXT[] DEFAULT '{}';
ALTER TABLE minerals ADD COLUMN IF NOT EXISTS deficiency_symptoms_tr TEXT[] DEFAULT '{}';
ALTER TABLE minerals ADD COLUMN IF NOT EXISTS excess_symptoms_tr TEXT[] DEFAULT '{}';

-- Update supplements with Turkish translations
UPDATE supplements SET 
    name_tr = 'Whey Protein İzolat',
    benefits_tr = ARRAY['Kas yapımı', 'Toparlanma', 'Kilo yönetimi', 'Tam amino asit profili'],
    side_effects_tr = ARRAY['Şişkinlik', 'Gaz', 'Alerjik reaksiyonlar (süt)'],
    warnings_tr = ARRAY['Süt içerir', 'Hamilelik veya emzirme döneminde doktora danışın', 'Laktoz intoleransı için uygun değil'],
    interactions_tr = ARRAY['Bazı antibiyotiklerle etkileşebilir', 'Levodopa emilimi azalabilir'],
    ingredients_tr = ARRAY['Whey protein izolat', 'Doğal aromalar', 'Stevia', 'Lesitin']
WHERE name = 'Whey Protein Isolate';

UPDATE supplements SET 
    name_tr = 'Kazein Proteini',
    benefits_tr = ARRAY['Yavaş sindirim', 'Gece boyunca toparlanma', 'Katabolizmayı önleme'],
    side_effects_tr = ARRAY['Ağır mide hissi', 'Yavaş sindirim'],
    warnings_tr = ARRAY['Süt içerir', 'Yoğun aktivite öncesi uygun değil'],
    interactions_tr = ARRAY['Levodopa ile etkileşebilir'],
    ingredients_tr = ARRAY['Misel kazein', 'Doğal aromalar', 'Ay çiçeği lesitini']
WHERE name = 'Casein Protein';

UPDATE supplements SET 
    name_tr = 'Bitki Proteini Karışımı',
    benefits_tr = ARRAY['Vegan dostu', 'Tam amino asitler', 'Kolay sindirim'],
    side_effects_tr = ARRAY['Taneli doku', 'Toprak tadı'],
    warnings_tr = ARRAY['Ağaç yemişi içerebilir'],
    interactions_tr = ARRAY['Genellikle iyi tolere edilir'],
    ingredients_tr = ARRAY['Bezelye proteini', 'Kenevir proteini', 'Kabak çekirdeği proteini', 'Doğal aromalar']
WHERE name = 'Plant Protein Blend';

UPDATE supplements SET 
    name_tr = 'Pre-Workout Enerji',
    benefits_tr = ARRAY['Enerji artışı', 'Odaklanma', 'Performans', 'Kas pompa'],
    side_effects_tr = ARRAY['Titreme', 'Anksiyete', 'Uyku sorunları', 'Karıncalanma hissi'],
    warnings_tr = ARRAY['Yüksek kafein içeriği', 'Önerilen dozu aşmayın', 'Kafeine duyarlılar için değil'],
    interactions_tr = ARRAY['MAOİlerle etkileşebilir', 'Diğer uyarıcılarla birlikte kullanmayın'],
    ingredients_tr = ARRAY['Beta-alanin', 'Kafein (150mg)', 'Kreatin nitrat', 'Arginin AKG', 'C vitamini']
WHERE name = 'Pre-Workout Energy';

UPDATE supplements SET 
    name_tr = 'Kreatin Monohidrat',
    benefits_tr = ARRAY['Güç', 'Kuvvet', 'Kas kütlesi', 'Bilişsel destek'],
    side_effects_tr = ARRAY['Su tutma', 'Kilo artışı', 'Mide krampları'],
    warnings_tr = ARRAY['Bol su için', 'Böbrek sorunu varsa doktora danışın', 'Yükleme fazı isteğe bağlı'],
    interactions_tr = ARRAY['Diüretiklerle etkileşebilir', 'Kafein etkileri azaltabilir'],
    ingredients_tr = ARRAY['Kreatin monohidrat (Creapure)']
WHERE name = 'Creatine Monohydrate';

UPDATE supplements SET 
    name_tr = 'BCAA 2:1:1',
    benefits_tr = ARRAY['Kas toparlanması', 'Ağrı azaltma', 'Hidrasyon'],
    side_effects_tr = ARRAY['Acı tat', 'İnsülin yanıtı'],
    warnings_tr = ARRAY['Kan şekeri etkileyebilir'],
    interactions_tr = ARRAY['Genellikle güvenli'],
    ingredients_tr = ARRAY['Lösin', 'İzolösin', 'Valin', 'Elektrolit karışımı']
WHERE name = 'BCAA 2:1:1';

UPDATE supplements SET 
    name_tr = 'Omega-3 Balık Yağı',
    benefits_tr = ARRAY['Kalp sağlığı', 'Beyin fonksiyonu', 'Anti-enflamatuar'],
    side_effects_tr = ARRAY['Balık tadı', 'Hazımsızlık'],
    warnings_tr = ARRAY['Kanama yapabilir', 'Kan inceltici kullanıyorsanız doktora danışın'],
    interactions_tr = ARRAY['Kan incelticilerle etkileşebilir'],
    ingredients_tr = ARRAY['Balık yağı', 'EPA', 'DHA']
WHERE name = 'Omega-3 Fish Oil';

UPDATE supplements SET 
    name_tr = 'Multivitamin',
    benefits_tr = ARRAY['Genel sağlık', 'Besin eksiklikleri', 'Enerji'],
    side_effects_tr = ARRAY['Mide bulantısı', 'Baş ağrısı', 'Mide rahatsızlığı'],
    warnings_tr = ARRAY['Yemekle birlikte alın', 'Önerilen dozu aşmayın'],
    interactions_tr = ARRAY['Bazı ilaçlarla etkileşebilir'],
    ingredients_tr = ARRAY['A vitamini', 'B vitaminleri', 'C vitamini', 'D vitamini', 'E vitamini', 'Mineraller']
WHERE name = 'Multivitamin';

-- Update vitamins with Turkish translations
UPDATE vitamins SET 
    name_tr = 'A Vitamini',
    chemical_name_tr = 'Retinol',
    benefits_tr = ARRAY['Görme sağlığı', 'Bağışıklık fonksiyonu', 'Hücre büyümesi'],
    food_sources_tr = ARRAY['Havuç', 'Tatlı patates', 'Ispanak', 'Ciğer'],
    deficiency_symptoms_tr = ARRAY['Gece körlüğü', 'Kuru cilt', 'Enfeksiyonlar'],
    excess_symptoms_tr = ARRAY['Baş ağrısı', 'Bulantı', 'Cilt döküntüsü'],
    storage_tr = 'Karanlık, serin yerde saklayın',
    stability_tr = 'Işığa ve ısıya karşı hassas'
WHERE name = 'Vitamin A';

UPDATE vitamins SET 
    name_tr = 'C Vitamini',
    chemical_name_tr = 'Askorbik Asit',
    benefits_tr = ARRAY['Bağışıklık desteği', 'Antioksidan', 'Kollajen üretimi'],
    food_sources_tr = ARRAY['Turunçgiller', 'Dolmalık biber', 'Brokoli', 'Çilek'],
    deficiency_symptoms_tr = ARRAY['Skorbüt', 'Yara iyileşmesi sorunları', 'Yorgunluk'],
    excess_symptoms_tr = ARRAY['İshal', 'Mide rahatsızlığı', 'Böbrek taşı riski'],
    storage_tr = 'Serin, kuru yerde saklayın',
    stability_tr = 'Hava ve ışıkla bozunur'
WHERE name = 'Vitamin C';

UPDATE vitamins SET 
    name_tr = 'D Vitamini',
    chemical_name_tr = 'Kolekalsiferol',
    benefits_tr = ARRAY['Kemik sağlığı', 'Bağışıklık fonksiyonu', 'Kalsiyum emilimi'],
    food_sources_tr = ARRAY['Güneş ışığı', 'Yağlı balık', 'Yumurta sarısı', 'Fortifiyeli süt'],
    deficiency_symptoms_tr = ARRAY['Raşitizm', 'Osteoporoz', 'Kas zayıflığı'],
    excess_symptoms_tr = ARRAY['Kalsiyum birikimi', 'Böbrek sorunları', 'Mide bulantısı'],
    storage_tr = 'Serin, kuru yerde saklayın',
    stability_tr = 'Oldukça stabil'
WHERE name = 'Vitamin D';

UPDATE vitamins SET 
    name_tr = 'E Vitamini',
    chemical_name_tr = 'Tokoferol',
    benefits_tr = ARRAY['Antioksidan', 'Cilt sağlığı', 'Kalp sağlığı'],
    food_sources_tr = ARRAY['Kuruyemişler', 'Tohumlar', 'Bitkisel yağlar', 'Ispanak'],
    deficiency_symptoms_tr = ARRAY['Nörolojik sorunlar', 'Kas zayıflığı', 'Görme sorunları'],
    excess_symptoms_tr = ARRAY['Kanama riski', 'Mide bulantısı', 'Baş ağrısı'],
    storage_tr = 'Karanlık, serin yerde saklayın',
    stability_tr = 'Işığa karşı hassas'
WHERE name = 'Vitamin E';

UPDATE vitamins SET 
    name_tr = 'K Vitamini',
    chemical_name_tr = 'Filokinon',
    benefits_tr = ARRAY['Kan pıhtılaşması', 'Kemik sağlığı', 'Kalp sağlığı'],
    food_sources_tr = ARRAY['Yapraklı yeşillikler', 'Brokoli', 'Brüksel lahanası', 'Fermente gıdalar'],
    deficiency_symptoms_tr = ARRAY['Aşırı kanama', 'Morluk', 'Kemik kırıkları'],
    excess_symptoms_tr = ARRAY['Kan pıhtılaşma sorunları', 'Sarılık (bebeklerde)'],
    storage_tr = 'Karanlık, serin yerde saklayın',
    stability_tr = 'Işığa karşı hassas'
WHERE name = 'Vitamin K';

-- Update minerals with Turkish translations
UPDATE minerals SET 
    name_tr = 'Kalsiyum',
    common_name_tr = 'Kalsiyum',
    benefits_tr = ARRAY['Kemik sağlığı', 'Kas fonksiyonu', 'Sinir iletimi'],
    food_sources_tr = ARRAY['Süt ürünleri', 'Yapraklı yeşillikler', 'Fortifiyeli gıdalar', 'Sardalya'],
    deficiency_symptoms_tr = ARRAY['Osteoporoz', 'Kas krampları', 'Zayıf kemikler'],
    excess_symptoms_tr = ARRAY['Böbrek taşları', 'Kabızlık', 'Kalsiyum birikimi']
WHERE name = 'Calcium';

UPDATE minerals SET 
    name_tr = 'Demir',
    common_name_tr = 'Demir',
    benefits_tr = ARRAY['Oksijen taşıma', 'Enerji üretimi', 'Bağışıklık fonksiyonu'],
    food_sources_tr = ARRAY['Kırmızı et', 'Ispanak', 'Baklagiller', 'Fortifiyeli tahıllar'],
    deficiency_symptoms_tr = ARRAY['Anemi', 'Yorgunluk', 'Halsizlik', 'Soluk cilt'],
    excess_symptoms_tr = ARRAY['Mide bulantısı', 'Kabızlık', 'Karaciğer hasarı', 'Kalp sorunları']
WHERE name = 'Iron';

UPDATE minerals SET 
    name_tr = 'Magnezyum',
    common_name_tr = 'Magnezyum',
    benefits_tr = ARRAY['Kas fonksiyonu', 'Sinir fonksiyonu', 'Kalp ritmi'],
    food_sources_tr = ARRAY['Kuruyemişler', 'Tohumlar', 'Tam tahıllar', 'Bitter çikolata'],
    deficiency_symptoms_tr = ARRAY['Kas krampları', 'Düzensiz kalp atışı', 'Yorgunluk', 'Anksiyete'],
    excess_symptoms_tr = ARRAY['İshal', 'Mide bulantısı', 'Kas zayıflığı', 'Düşük tansiyon']
WHERE name = 'Magnesium';

UPDATE minerals SET 
    name_tr = 'Çinko',
    common_name_tr = 'Çinko',
    benefits_tr = ARRAY['Bağışıklık fonksiyonu', 'Yara iyileşmesi', 'DNA sentezi'],
    food_sources_tr = ARRAY['İstiridye', 'Sığır eti', 'Kabak çekirdeği', 'Mercimek'],
    deficiency_symptoms_tr = ARRAY['Baskılanmış bağışıklık', 'Saç dökülmesi', 'İştah kaybı', 'Gecikmiş yara iyileşmesi'],
    excess_symptoms_tr = ARRAY['Mide bulantısı', 'Baş ağrısı', 'Baş dönmesi', 'Bakır eksikliği']
WHERE name = 'Zinc';

UPDATE minerals SET 
    name_tr = 'Selenyum',
    common_name_tr = 'Selenyum',
    benefits_tr = ARRAY['Tiroid fonksiyonu', 'Antioksidan', 'Bağışıklık fonksiyonu'],
    food_sources_tr = ARRAY['Brezilya cevizi', 'Deniz ürünleri', 'Yumurta', 'Kahverengi pirinç'],
    deficiency_symptoms_tr = ARRAY['Tiroid sorunları', 'Zayıflamış bağışıklık', 'Saç dökülmesi', 'Yorgunluk'],
    excess_symptoms_tr = ARRAY['Saç dökülmesi', 'Tırnak kırılması', 'Mide bulantısı', 'Sinirlilik']
WHERE name = 'Selenium';

-- View for Turkish supplements data
CREATE OR REPLACE VIEW supplements_tr AS
SELECT 
    id,
    COALESCE(name_tr, name) as name,
    brand,
    category,
    type,
    dosage,
    unit,
    serving_size,
    COALESCE(ingredients_tr, ingredients) as ingredients,
    COALESCE(benefits_tr, benefits) as benefits,
    COALESCE(side_effects_tr, side_effects) as side_effects,
    COALESCE(warnings_tr, warnings) as warnings,
    COALESCE(interactions_tr, interactions) as interactions,
    recommended_intake,
    price,
    availability,
    is_verified
FROM supplements
WHERE is_verified = TRUE AND availability = TRUE;

-- View for Turkish vitamins data
CREATE OR REPLACE VIEW vitamins_tr AS
SELECT 
    id,
    COALESCE(name_tr, name) as name,
    COALESCE(chemical_name_tr, chemical_name) as chemical_name,
    type,
    form,
    dosage,
    COALESCE(benefits_tr, benefits) as benefits,
    COALESCE(food_sources_tr, food_sources) as food_sources,
    COALESCE(deficiency_symptoms_tr, deficiency_symptoms) as deficiency_symptoms,
    COALESCE(excess_symptoms_tr, excess_symptoms) as excess_symptoms,
    interactions,
    absorption,
    COALESCE(storage_tr, storage) as storage,
    COALESCE(stability_tr, stability) as stability,
    daily_value,
    unit,
    availability,
    is_verified
FROM vitamins
WHERE is_verified = TRUE AND availability = TRUE;

-- View for Turkish minerals data
CREATE OR REPLACE VIEW minerals_tr AS
SELECT 
    id,
    COALESCE(name_tr, name) as name,
    chemical_formula,
    COALESCE(common_name_tr, common_name) as common_name,
    type,
    form,
    dosage,
    COALESCE(benefits_tr, benefits) as benefits,
    COALESCE(food_sources_tr, food_sources) as food_sources,
    COALESCE(deficiency_symptoms_tr, deficiency_symptoms) as deficiency_symptoms,
    COALESCE(excess_symptoms_tr, excess_symptoms) as excess_symptoms,
    interactions,
    absorption,
    daily_value,
    unit,
    availability,
    is_verified
FROM minerals
WHERE is_verified = TRUE AND availability = TRUE;

-- Function to get data based on language preference
CREATE OR REPLACE FUNCTION get_supplements_by_lang(lang_code TEXT DEFAULT 'en')
RETURNS TABLE (
    id UUID,
    name TEXT,
    brand TEXT,
    category TEXT,
    benefits TEXT[]
) AS $$
BEGIN
    IF lang_code = 'tr' THEN
        RETURN QUERY SELECT s.id, COALESCE(s.name_tr, s.name), s.brand, s.category, COALESCE(s.benefits_tr, s.benefits)
        FROM supplements s WHERE s.is_verified = TRUE AND s.availability = TRUE;
    ELSE
        RETURN QUERY SELECT s.id, s.name, s.brand, s.category, s.benefits
        FROM supplements s WHERE s.is_verified = TRUE AND s.availability = TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_vitamins_by_lang(lang_code TEXT DEFAULT 'en')
RETURNS TABLE (
    id UUID,
    name TEXT,
    chemical_name TEXT,
    type TEXT,
    benefits TEXT[]
) AS $$
BEGIN
    IF lang_code = 'tr' THEN
        RETURN QUERY SELECT v.id, COALESCE(v.name_tr, v.name), COALESCE(v.chemical_name_tr, v.chemical_name), v.type, COALESCE(v.benefits_tr, v.benefits)
        FROM vitamins v WHERE v.is_verified = TRUE AND v.availability = TRUE;
    ELSE
        RETURN QUERY SELECT v.id, v.name, v.chemical_name, v.type, v.benefits
        FROM vitamins v WHERE v.is_verified = TRUE AND v.availability = TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_minerals_by_lang(lang_code TEXT DEFAULT 'en')
RETURNS TABLE (
    id UUID,
    name TEXT,
    common_name TEXT,
    type TEXT,
    benefits TEXT[]
) AS $$
BEGIN
    IF lang_code = 'tr' THEN
        RETURN QUERY SELECT m.id, COALESCE(m.name_tr, m.name), COALESCE(m.common_name_tr, m.common_name), m.type, COALESCE(m.benefits_tr, m.benefits)
        FROM minerals m WHERE m.is_verified = TRUE AND m.availability = TRUE;
    ELSE
        RETURN QUERY SELECT m.id, m.name, m.common_name, m.type, m.benefits
        FROM minerals m WHERE m.is_verified = TRUE AND m.availability = TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;
