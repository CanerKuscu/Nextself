-- ============================================================================
-- ADD XP AND CURRENCY RPC FUNCTIONS
-- Generated: March 16, 2026
-- Purpose: Allow secure XP and Currency updates via RPC (bypassing RLS)
-- ============================================================================

-- Function to add XP
CREATE OR REPLACE FUNCTION add_xp(
    user_id_param UUID,
    amount_param INT,
    source_param xp_source_enum,
    description_param TEXT
) RETURNS VOID AS $$
BEGIN
    -- Insert transaction
    INSERT INTO xp_transactions (user_id, amount, source, description)
    VALUES (user_id_param, amount_param, source_param, description_param);
    
    -- Update user league XP
    UPDATE user_leagues
    SET current_xp = current_xp + amount_param,
        total_xp = total_xp + amount_param,
        weekly_xp = weekly_xp + amount_param
    WHERE user_id = user_id_param;
    
    -- If no league record exists, create one (fallback)
    IF NOT FOUND THEN
        INSERT INTO user_leagues (user_id, league_id, current_xp, weekly_xp, total_xp)
        VALUES (user_id_param, 1, amount_param, amount_param, amount_param); -- Assuming 1 is Bronze
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add currency
CREATE OR REPLACE FUNCTION add_user_currency(
    p_user_id UUID,
    p_amount INT,
    p_currency_type TEXT -- 'points' or 'gems'
) RETURNS VOID AS $$
BEGIN
    IF p_currency_type = 'points' THEN
        UPDATE user_currencies
        SET points = points + p_amount,
            total_earned_points = total_earned_points + p_amount
        WHERE user_id = p_user_id;
        
        IF NOT FOUND THEN
            INSERT INTO user_currencies (user_id, points, total_earned_points)
            VALUES (p_user_id, p_amount, p_amount);
        END IF;
    ELSIF p_currency_type = 'gems' THEN
        UPDATE user_currencies
        SET gems = gems + p_amount
        WHERE user_id = p_user_id;
        
        IF NOT FOUND THEN
            INSERT INTO user_currencies (user_id, gems)
            VALUES (p_user_id, p_amount);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'XP and Currency RPC functions created successfully' as status;
