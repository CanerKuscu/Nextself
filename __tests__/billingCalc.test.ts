import {
    computeMonthlyBilling,
    defaultDepositForDuration,
    type ClientRelationshipBillingInput,
} from '../supabase/functions/calculate-monthly-billing/billing-logic';

const makeClient = (
    overrides: Partial<ClientRelationshipBillingInput> = {},
): ClientRelationshipBillingInput => ({
    id: 'rel-1',
    professional_id: 'prof-1',
    agreed_price: 10000,
    platform_fee_percent: 10,
    deposit_paid_amount: 750,
    commission_consumed_to_date: 0,
    duration_months: 3,
    ...overrides,
});

describe('defaultDepositForDuration', () => {
    it.each([
        [3, 750],
        [6, 1250],
        [12, 2000],
        [1, 300],
        [2, 600],
        [4, 1200],
    ])('returns %i-month default deposit = %i TL', (months, expected) => {
        expect(defaultDepositForDuration(months)).toBe(expected);
    });

    it('treats null/0 as 1-month → 300 TL', () => {
        expect(defaultDepositForDuration(null)).toBe(300);
        expect(defaultDepositForDuration(0)).toBe(300);
    });
});

describe('computeMonthlyBilling — single month', () => {
    it('applies deposit when commission is fully covered by remaining deposit', () => {
        const r = computeMonthlyBilling(
            makeClient({ agreed_price: 5000, platform_fee_percent: 10, deposit_paid_amount: 750 }),
        );
        expect(r.owedCommission).toBe(500);
        expect(r.depositApplied).toBe(500);
        expect(r.remainingBalance).toBe(0);
        expect(r.nextConsumedToDate).toBe(500);
    });

    it('returns remaining balance when commission exceeds remaining deposit', () => {
        const r = computeMonthlyBilling(
            makeClient({ agreed_price: 20000, platform_fee_percent: 10, deposit_paid_amount: 750 }),
        );
        expect(r.owedCommission).toBe(2000);
        expect(r.depositApplied).toBe(750);
        expect(r.remainingBalance).toBe(1250);
        expect(r.nextConsumedToDate).toBe(750);
    });

    it('applies no deposit when consumed-to-date already equals deposit', () => {
        const r = computeMonthlyBilling(
            makeClient({
                agreed_price: 10000,
                platform_fee_percent: 10,
                deposit_paid_amount: 750,
                commission_consumed_to_date: 750,
            }),
        );
        expect(r.depositApplied).toBe(0);
        expect(r.remainingBalance).toBe(1000);
        expect(r.nextConsumedToDate).toBe(750);
    });

    it('falls back to default fee percent when platform_fee_percent is null', () => {
        const r = computeMonthlyBilling(
            makeClient({ platform_fee_percent: null, agreed_price: 1000 }),
            10,
        );
        expect(r.owedCommission).toBe(100);
    });

    it('falls back to duration-based default deposit when deposit_paid_amount is null', () => {
        const r = computeMonthlyBilling(
            makeClient({ deposit_paid_amount: null, duration_months: 6, agreed_price: 5000 }),
        );
        expect(r.depositApplied).toBe(500);
        expect(r.nextConsumedToDate).toBe(500);
    });
});

describe('computeMonthlyBilling — multi-month deposit consumption (the bug fix)', () => {
    /**
     * Regression test for the double-deduct bug.
     *
     * Before the fix the edge function recomputed `owedCommission - depositPaid`
     * every month, so a 750 TL deposit was credited 3 times against a 3-month
     * contract — effectively giving 2250 TL of relief instead of 750.
     *
     * With cumulative tracking, the deposit is consumed at most once.
     */
    it('consumes the deposit exactly once across 3 months', () => {
        const client = makeClient({
            agreed_price: 10000,
            platform_fee_percent: 10,
            deposit_paid_amount: 750,
            duration_months: 3,
            commission_consumed_to_date: 0,
        });

        // Month 1 — owed 1000, deposit 750 → deposit fully applied, 250 balance
        const m1 = computeMonthlyBilling(client);
        expect(m1.depositApplied).toBe(750);
        expect(m1.remainingBalance).toBe(250);
        expect(m1.nextConsumedToDate).toBe(750);

        // Month 2 — deposit pool is empty, full commission owed
        const m2 = computeMonthlyBilling({ ...client, commission_consumed_to_date: m1.nextConsumedToDate });
        expect(m2.depositApplied).toBe(0);
        expect(m2.remainingBalance).toBe(1000);
        expect(m2.nextConsumedToDate).toBe(750);

        // Month 3 — same as month 2
        const m3 = computeMonthlyBilling({ ...client, commission_consumed_to_date: m2.nextConsumedToDate });
        expect(m3.depositApplied).toBe(0);
        expect(m3.remainingBalance).toBe(1000);

        // Total deposit applied across all 3 months never exceeds the deposit paid
        const totalDepositApplied = m1.depositApplied + m2.depositApplied + m3.depositApplied;
        expect(totalDepositApplied).toBe(750);
    });

    it('applies partial deposit on the boundary month', () => {
        const client = makeClient({
            agreed_price: 5000,
            platform_fee_percent: 10,
            deposit_paid_amount: 750,
            commission_consumed_to_date: 500, // 250 of deposit left
        });

        const r = computeMonthlyBilling(client);
        expect(r.owedCommission).toBe(500);
        expect(r.depositApplied).toBe(250); // only what's left of the deposit
        expect(r.remainingBalance).toBe(250);
        expect(r.nextConsumedToDate).toBe(750);
    });
});
