-- Create purchase history table if it doesn't exist
CREATE TABLE IF NOT EXISTS purchase_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES store_items(id) ON DELETE CASCADE NOT NULL,
    quantity INT DEFAULT 1,
    price_paid INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchase history" ON purchase_history;
CREATE POLICY "Users can view own purchase history" ON purchase_history
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own purchase history" ON purchase_history;
CREATE POLICY "Users can insert own purchase history" ON purchase_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Store purchase RPC with atomic transaction
CREATE OR REPLACE FUNCTION purchase_store_item(p_user_id UUID, p_item_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_currency RECORD;
    v_inventory_qty INT;
BEGIN
    -- 1. Get item
    SELECT * INTO v_item FROM store_items WHERE id = p_item_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Item not found');
    END IF;

    -- 2. Lock and get currency
    SELECT * INTO v_currency FROM user_currencies WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Currency record not found');
    END IF;

    -- 3. Check balance
    IF v_currency.points < v_item.price_points THEN
        RETURN json_build_object('success', false, 'message', 'insufficient_points');
    END IF;

    -- 4. Check inventory max stack
    SELECT quantity INTO v_inventory_qty FROM user_inventory_items WHERE user_id = p_user_id AND item_id = p_item_id FOR UPDATE;
    IF v_inventory_qty IS NOT NULL AND v_inventory_qty >= v_item.max_stack THEN
        RETURN json_build_object('success', false, 'message', 'max_stack_reached');
    END IF;

    -- 5. Deduct currency
    UPDATE user_currencies
    SET points = points - v_item.price_points,
        total_spent_points = total_spent_points + v_item.price_points
    WHERE user_id = p_user_id;

    -- 6. Update or insert inventory
    IF v_inventory_qty IS NOT NULL THEN
        UPDATE user_inventory_items
        SET quantity = quantity + 1
        WHERE user_id = p_user_id AND item_id = p_item_id;
    ELSE
        INSERT INTO user_inventory_items (user_id, item_id, quantity, is_active)
        VALUES (p_user_id, p_item_id, 1, false);
    END IF;

    -- 7. Log purchase
    INSERT INTO purchase_history (user_id, item_id, quantity, price_paid)
    VALUES (p_user_id, p_item_id, 1, v_item.price_points);

    RETURN json_build_object('success', true, 'message', 'purchase_successful');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;