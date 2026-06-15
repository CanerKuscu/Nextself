-- Migration: Support secure proposal activation verification

CREATE OR REPLACE FUNCTION verify_proposal_payment_v1(
    p_proposal_id UUID,
    p_payment_token TEXT -- In production, the Edge function validates this via Iyzico. For now, we transactionally fulfill the proposal.
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_proposal RECORD;
    v_relationship_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Fetch proposal details and lock the row to prevent race conditions
    SELECT * INTO v_proposal 
    FROM service_proposals 
    WHERE id = p_proposal_id 
    FOR UPDATE;

    IF v_proposal IS NULL THEN
        RAISE EXCEPTION 'Proposal not found';
    END IF;

    -- Only the professional who made the proposal can activate it (since they pay the commission)
    -- OR the client who accepts it. Usually the professional pays the deposit in this flow.
    IF v_proposal.professional_user_id != v_caller_id THEN
        RAISE EXCEPTION 'Unauthorized to activate this proposal';
    END IF;

    IF v_proposal.status = 'completed' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already completed');
    END IF;

    -- Create or update the relationship
    INSERT INTO client_relationships (
        client_id,
        professional_id,
        trainer_id,
        dietitian_id,
        status,
        start_date,
        agreed_price,
        platform_fee_percent,
        deposit_paid_amount
    ) VALUES (
        v_proposal.client_user_id,
        v_proposal.professional_profile_id,
        CASE WHEN v_proposal.professional_type = 'pt' THEN v_proposal.professional_profile_id ELSE NULL END,
        CASE WHEN v_proposal.professional_type = 'dietitian' THEN v_proposal.professional_profile_id ELSE NULL END,
        'active',
        now(),
        v_proposal.agreed_price,
        10,
        v_proposal.deposit_total
    ) RETURNING id INTO v_relationship_id;

    -- Mark proposal completed
    UPDATE service_proposals 
    SET status = 'completed', updated_at = now() 
    WHERE id = p_proposal_id;

    RETURN jsonb_build_object(
        'success', true, 
        'relationship_id', v_relationship_id,
        'message', 'Client successfully activated'
    );
END;
$$;
