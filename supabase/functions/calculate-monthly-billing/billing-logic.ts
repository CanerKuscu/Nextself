/**
 * Pure billing-math helpers for the calculate-monthly-billing edge function.
 *
 * Extracted to be unit-testable from Node/Jest without Deno-specific globals.
 */

export interface ClientRelationshipBillingInput {
    id: string;
    professional_id: string;
    agreed_price: number;
    platform_fee_percent: number | null;
    deposit_paid_amount: number | null;
    /** Cumulative commission already covered by the deposit in prior months. */
    commission_consumed_to_date: number | null;
    duration_months: number | null;
}

export interface MonthlyBillingResult {
    relationshipId: string;
    professionalId: string;
    owedCommission: number;
    depositApplied: number;
    remainingBalance: number;
    nextConsumedToDate: number;
}

export function defaultDepositForDuration(durationMonths: number | null | undefined): number {
    const dm = durationMonths || 1;
    if (dm === 3) return 750;
    if (dm === 6) return 1250;
    if (dm === 12) return 2000;
    return 300 * dm;
}

/**
 * Compute one month's billing for a single client_relationship.
 *
 * Critical invariant: the deposit is consumed AT MOST ONCE across the entire
 * contract. We track `commission_consumed_to_date` per relationship and only
 * the remaining-unconsumed slice of the deposit can be applied this month.
 */
export function computeMonthlyBilling(
    client: ClientRelationshipBillingInput,
    defaultFeePercent = 10,
): MonthlyBillingResult {
    const feePercent = client.platform_fee_percent ?? defaultFeePercent;
    const commissionRate = feePercent / 100;
    const owedCommission = client.agreed_price * commissionRate;

    const deposit = client.deposit_paid_amount ?? defaultDepositForDuration(client.duration_months);
    const consumed = Number(client.commission_consumed_to_date) || 0;
    const depositRemaining = Math.max(deposit - consumed, 0);

    const depositApplied = Math.min(owedCommission, depositRemaining);
    const remainingBalance = Math.max(owedCommission - depositApplied, 0);

    return {
        relationshipId: client.id,
        professionalId: client.professional_id,
        owedCommission,
        depositApplied,
        remainingBalance,
        nextConsumedToDate: consumed + depositApplied,
    };
}
