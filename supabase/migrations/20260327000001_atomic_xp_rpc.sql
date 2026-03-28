-- ============================================================================
-- ATOMIC ADD XP AND CURRENCY RPC FUNCTION
-- Purpose: Fix H-7 by making XP and point additions atomic
-- ============================================================================

CREATE OR REPLACE FUNCTION add_xp_atomic(
    p_user_id UUID,
    p_amount INT,
    p_source TEXT,
    p_description TEXT,
    p_multiplier NUMERIC DEFAULT 1.0
) RETURNS INT AS $$
DECLARE
    v_final_amount INT;
    v_group_id UUID;
BEGIN
    -- Calculate final amount
    v_final_amount := ROUND(p_amount * p_multiplier);

    -- Insert transaction
    INSERT INTO xp_transactions (user_id, amount, source, description, multiplier)
    VALUES (p_user_id, v_final_amount, p_source::xp_source_enum, p_description, p_multiplier);
    
    -- Update user league XP
    UPDATE user_leagues
    SET current_xp = current_xp + v_final_amount,
        total_xp = total_xp + v_final_amount,
        weekly_xp = weekly_xp + v_final_amount
    WHERE user_id = p_user_id
    RETURNING group_id INTO v_group_id;
    
    -- If no league record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_leagues (user_id, league_id, current_xp, weekly_xp, total_xp)
        VALUES (p_user_id, 1, v_final_amount, v_final_amount, v_final_amount);
    END IF;

    -- Update group member XP if they belong to a group
    IF v_group_id IS NOT NULL THEN
        UPDATE league_group_members
        SET weekly_xp = weekly_xp + v_final_amount
        WHERE group_id = v_group_id AND user_id = p_user_id;
    END IF;

    -- Add points to user currency (50% of XP)
    PERFORM add_user_currency(p_user_id, ROUND(v_final_amount * 0.5)::INT, 'points');

    RETURN v_final_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
