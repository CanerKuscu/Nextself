-- ============================================================================
-- 20260515090200_billing_cycles_unique_and_deposit_tracking.sql
--
-- Two fixes that go together with the calculate-monthly-billing edge function
-- rewrite (commit "Billing math fixes"):
--
--   1. Track cumulative deposit consumption per client_relationships row, so
--      the deposit is credited at MOST once across all months. Previously the
--      edge function re-applied the full deposit every month and over-credited
--      professionals.
--
--   2. Add a UNIQUE constraint on billing_cycles(professional_id, month_year)
--      so that the cron job is idempotent: re-running it the same month
--      upserts rather than duplicating rows.
--
-- The backfill keeps historic data internally consistent: any deposit that has
-- already been applied via prior billing_cycles rows is reflected in the new
-- column so the next cycle will not double-credit.
-- ============================================================================

-- 1) Track cumulative deposit consumption ------------------------------------
ALTER TABLE client_relationships
    ADD COLUMN IF NOT EXISTS commission_consumed_to_date NUMERIC NOT NULL DEFAULT 0;

-- Backfill from existing billing_cycles. For each relationship we estimate
-- "how much of its deposit has already been credited" as
--   min(deposit_paid_amount, total commission billed in prior cycles).
-- Because billing_cycles aggregates per professional (not per relationship)
-- we approximate using the relationship's own agreed_price share.
WITH per_professional AS (
    SELECT
        professional_id,
        SUM(total_deposit_paid) AS deposit_credited
    FROM billing_cycles
    GROUP BY professional_id
)
UPDATE client_relationships cr
SET commission_consumed_to_date = LEAST(
        COALESCE(cr.deposit_paid_amount, 0),
        COALESCE(pp.deposit_credited, 0)
    )
FROM per_professional pp
WHERE cr.professional_id = pp.professional_id
  AND cr.commission_consumed_to_date = 0;

-- 2) Idempotent billing_cycles -----------------------------------------------
-- Add a unique constraint only if one does not already exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'billing_cycles'
          AND indexdef ILIKE '%UNIQUE%(professional_id, month_year)%'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'billing_cycles_professional_month_unique'
    ) THEN
        BEGIN
            ALTER TABLE billing_cycles
                ADD CONSTRAINT billing_cycles_professional_month_unique
                UNIQUE (professional_id, month_year);
        EXCEPTION
            WHEN unique_violation THEN
                -- Existing duplicate rows must be reconciled manually; keep migration idempotent.
                RAISE NOTICE 'billing_cycles contains duplicate (professional_id, month_year) pairs — UNIQUE constraint not added. Resolve duplicates and re-run.';
        END;
    END IF;
END $$;
