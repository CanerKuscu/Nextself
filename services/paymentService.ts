import { SupabaseService } from '@nextself/shared';
import { AgreementService } from './agreementService';
import { CONFIG } from '@nextself/shared';
import { SubscriptionPlan, UserSubscription } from '@nextself/shared';
import { SecurityUtils } from '../utils/security';

const getSupabaseClient = () => SupabaseService.getInstance().getClient();
const supabase = {
    from: (...args: Parameters<ReturnType<typeof getSupabaseClient>['from']>) => getSupabaseClient().from(...args),
    rpc: (...args: Parameters<ReturnType<typeof getSupabaseClient>['rpc']>) => getSupabaseClient().rpc(...args),
    auth: {
        getUser: (...args: Parameters<ReturnType<typeof getSupabaseClient>['auth']['getUser']>) =>
            getSupabaseClient().auth.getUser(...args),
    },
};

export interface PaymentMethod {
    id: string;
    user_id: string;
    iyzico_card_token: string;
    type: 'card' | 'bank_account';
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: string;
    user_id: string;
    subscription_id: string;
    iyzico_payment_id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'open' | 'void' | 'uncollectible';
    due_date?: string;
    paid_at?: string;
    pdf_url?: string;
    hosted_invoice_url?: string;
    created_at: string;
}

export interface PaymentHistory {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    description: string;
    status: 'succeeded' | 'pending' | 'failed';
    payment_method: string;
    invoice_id?: string;
    metadata?: any;
    created_at: string;
}

type PaymentGatewayStatus = 'succeeded' | 'pending' | 'failed';

export class PaymentService {
    private static instance: PaymentService;
    private iyzico: any;

    private constructor() {
        this.initIyzico();
    }

    public static getInstance(): PaymentService {
        if (!PaymentService.instance) {
            PaymentService.instance = new PaymentService();
        }
        return PaymentService.instance;
    }

    private async initIyzico() {
        try {
            console.log('iyzico initialized');
        } catch (error) {
            console.error('Error initializing iyzico:', error);
        }
    }

    private getGatewayUrl(): string {
        const fromEnv = (process.env.EXPO_PUBLIC_IYZICO_CHARGE_URL || '').trim();
        if (fromEnv) {
            return fromEnv;
        }
        return `${CONFIG.API_BASE_URL.replace(/\/+$/, '')}/payments/iyzico/charge`;
    }

    private parseGatewayStatus(payload: any): PaymentGatewayStatus {
        const rawStatus = String(
            payload?.status ??
            payload?.payment_status ??
            payload?.paymentStatus ??
            payload?.result ??
            ''
        ).toLowerCase();
        if (rawStatus === 'success' || rawStatus === 'succeeded' || rawStatus === 'paid' || rawStatus === 'ok') {
            return 'succeeded';
        }
        if (rawStatus === 'pending' || rawStatus === 'processing' || rawStatus === 'requires_action') {
            return 'pending';
        }
        if (rawStatus === 'failed' || rawStatus === 'failure' || rawStatus === 'error' || rawStatus === 'declined') {
            return 'failed';
        }
        if (payload?.success === true) {
            return 'succeeded';
        }
        if (payload?.pending === true) {
            return 'pending';
        }
        return 'failed';
    }

    private async chargeWithGateway(
        userId: string,
        amount: number,
        currency: string,
        description: string,
        paymentMethod: string
    ): Promise<{ status: PaymentGatewayStatus; reference: string; metadata: Record<string, any> }> {
        const gatewayUrl = this.getGatewayUrl();
        if (!gatewayUrl) {
            throw new Error('Payment gateway URL is not configured');
        }

        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                amount,
                currency,
                description,
                paymentMethodId: paymentMethod
            })
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            const message = payload?.error || payload?.message || `Gateway request failed with HTTP ${response.status}`;
            throw new Error(message);
        }

        const status = this.parseGatewayStatus(payload);
        const reference =
            payload?.paymentId ||
            payload?.payment_id ||
            payload?.conversationId ||
            payload?.conversation_id ||
            `iyz_pay_${SecurityUtils.generateSecureToken(16)}`;

        return {
            status,
            reference,
            metadata: {
                gateway: 'iyzico',
                gateway_url: gatewayUrl,
                gateway_response: payload
            }
        };
    }

    /**
     * Get all subscription plans
     */
    public async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
        try {
            const plansTable = CONFIG.SUBSCRIPTION_PLANS_TABLE || 'subscription_plans';
            const { data, error } = await supabase
                .from(plansTable)
                .select('*')
                .eq('is_active', true)
                .order('price_monthly', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting subscription plans:', error);
            return [];
        }
    }

    /**
     * Get subscription plan by ID
     */
    public async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
        try {
            const plansTable = CONFIG.SUBSCRIPTION_PLANS_TABLE || 'subscription_plans';
            const { data, error } = await supabase
                .from(plansTable)
                .select('*')
                .eq('id', planId)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting subscription plan:', error);
            return null;
        }
    }

    /**
     * Get user's current subscription
     */
    public async getUserSubscription(userId: string): Promise<UserSubscription | null> {
        try {
            // Primary table name used by the app
            const primaryTable = CONFIG.SUBSCRIPTIONS_TABLE || 'user_subscriptions';
            const { data, error } = await supabase
                .from(primaryTable)
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .single();

            // If table doesn't exist (PGRST205), try common alternative table names
            if (error && error.code === 'PGRST205') {
                const alternatives = [
                    CONFIG.SUBSCRIPTIONS_TABLE,
                    'subscriptions',
                    'user_subscription',
                    'customer_subscriptions'
                ].filter(Boolean).map(String).filter((v, i, a) => a.indexOf(v) === i && v !== primaryTable);
                for (const tbl of alternatives) {
                    try {
                        const res = await supabase
                            .from(tbl)
                            .select('*')
                            .eq('user_id', userId)
                            .eq('status', 'active')
                            .single();
                        if (!res.error && res.data) return res.data;
                    } catch (e) {
                        // ignore and try next
                    }
                }
                // Table not found among alternatives — log and return null
                console.warn(`Subscription table '${primaryTable}' not found; attempted alternatives and none exist.`);
                return null;
            }

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
            return data;
        } catch (error) {
            console.error('Error getting user subscription:', error);
            return null;
        }
    }

    private activeSubscriptionRequests = new Set<string>();

    /**
     * Create subscription (with MSS — Mesafeli Satış Sözleşmesi compliance per 6502 Kanun)
     *
     * Flow: 1) Generate MSS contract → 2) Accept contract → 3) Create subscription → 4) Activate contract
     */
    public async createSubscription(
        userId: string,
        planId: string,
        billingCycle: 'monthly' | 'yearly',
        paymentMethodId?: string,
        buyerInfo?: { fullName: string; email: string; address: string; phone?: string }
    ): Promise<UserSubscription | null> {
        const idempotencyKey = `${userId}_${planId}_${billingCycle}`;
        if (this.activeSubscriptionRequests.has(idempotencyKey)) {
            throw new Error('Subscription request already in progress');
        }
        this.activeSubscriptionRequests.add(idempotencyKey);

        try {
            // Get plan details
            const plan = await this.getSubscriptionPlan(planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            // Check if user already has an active subscription
            const existingSubscription = await this.getUserSubscription(userId);
            if (existingSubscription) {
                throw new Error('User already has an active subscription');
            }

            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

            // ── MSS Contract Flow (6502 Kanun Mesafeli Satış Sözleşmesi) ──
            const agreementService = AgreementService.getInstance();
            let contractId: string | null = null;

            if (buyerInfo) {
                // 1) Create MSS contract
                const contractResult = await agreementService.createDistanceSalesContract(
                    userId,
                    buyerInfo.fullName,
                    buyerInfo.email,
                    buyerInfo.address,
                    planId,
                    plan.name,
                    billingCycle,
                    price,
                    plan.currency
                );

                if (!contractResult.success || !contractResult.contract) {
                    throw new Error(contractResult.error || 'MSS contract creation failed');
                }

                contractId = contractResult.contract.id;

                // 2) Accept the MSS contract (buyer confirmed the pre-information form)
                await agreementService.acceptDistanceSalesContract(contractId);
            }
            // ── End MSS Contract Flow ──

            // In production, create iyzico subscription via iyzico API
            // For international (Dubai) expansion, Stripe integration will be added
            const currentDate = new Date();
            const periodEnd = new Date(currentDate);

            if (billingCycle === 'monthly') {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
            } else {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }

            // If plan has trial days, adjust dates
            let trialStart: string | undefined = undefined;
            let trialEnd: string | undefined = undefined;

            if (plan.trial_days > 0) {
                trialStart = currentDate.toISOString();
                const trialEndDate = new Date(currentDate);
                trialEndDate.setDate(trialEndDate.getDate() + plan.trial_days);
                trialEnd = trialEndDate.toISOString();
            }

            const subscription: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'> = {
                user_id: userId,
                plan_id: planId,
                status: 'active',
                billing_cycle: billingCycle,
                current_period_start: currentDate.toISOString(),
                current_period_end: periodEnd.toISOString(),
                cancel_at_period_end: false,
                trial_start: trialStart,
                trial_end: trialEnd,
                payment_method_id: paymentMethodId,
                iyzico_subscription_ref: `iyz_sub_${SecurityUtils.generateSecureToken(16)}`,
                iyzico_customer_ref: `iyz_cus_${userId}`
            };

            const { data, error } = await supabase
                .from('user_subscriptions')
                .insert(subscription)
                .select()
                .single();

            if (error) throw error;

            // Create initial invoice
            await this.createInvoice(
                userId,
                data.id,
                price,
                plan.currency,
                'Initial subscription payment'
            );

            // 3) Activate MSS contract after successful payment
            if (contractId) {
                await agreementService.activateContract(contractId);
            }

            return data;
        } catch (error) {
            console.error('Error creating subscription');
            return null;
        } finally {
            this.activeSubscriptionRequests.delete(idempotencyKey);
        }
    }

    /**
     * Cancel subscription
     */
    public async cancelSubscription(
        userId: string,
        cancelAtPeriodEnd: boolean = true
    ): Promise<boolean> {
        try {
            const subscription = await this.getUserSubscription(userId);
            if (!subscription) {
                throw new Error('No active subscription found');
            }

            const updates: Partial<UserSubscription> = {
                cancel_at_period_end: cancelAtPeriodEnd,
                canceled_at: cancelAtPeriodEnd ? undefined : new Date().toISOString(),
                status: cancelAtPeriodEnd ? 'active' : 'canceled',
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_subscriptions')
                .update(updates)
                .eq('id', subscription.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error canceling subscription:', error);
            return false;
        }
    }

    /**
     * Update subscription plan
     */
    public async updateSubscriptionPlan(
        userId: string,
        newPlanId: string,
        prorate: boolean = true
    ): Promise<boolean> {
        try {
            const subscription = await this.getUserSubscription(userId);
            if (!subscription) {
                throw new Error('No active subscription found');
            }

            const newPlan = await this.getSubscriptionPlan(newPlanId);
            if (!newPlan) {
                throw new Error('New plan not found');
            }

            // Calculate prorated amount if needed
            let proratedAmount = 0;
            if (prorate) {
                proratedAmount = await this.calculateProratedAmount(
                    subscription,
                    newPlan,
                    subscription.billing_cycle
                );
            }

            // Update subscription
            const { error } = await supabase
                .from('user_subscriptions')
                .update({
                    plan_id: newPlanId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', subscription.id);

            if (error) throw error;

            // Create invoice for prorated amount if applicable
            if (proratedAmount > 0) {
                await this.createInvoice(
                    userId,
                    subscription.id,
                    proratedAmount,
                    newPlan.currency,
                    'Prorated plan upgrade'
                );
            }

            return true;
        } catch (error) {
            console.error('Error updating subscription plan:', error);
            return false;
        }
    }

    /**
     * Get user's payment methods
     */
    public async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting payment methods:', error);
            return [];
        }
    }

    /**
     * Add payment method
     */
    public async addPaymentMethod(
        userId: string,
        iyzicoCardToken: string,
        type: 'card' | 'bank_account',
        details: any
    ): Promise<PaymentMethod | null> {
        try {
            // Check if this is the first payment method
            const existingMethods = await this.getPaymentMethods(userId);
            const isDefault = existingMethods.length === 0;

            const paymentMethod: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'> = {
                user_id: userId,
                iyzico_card_token: iyzicoCardToken,
                type,
                brand: details.brand,
                last4: details.last4,
                exp_month: details.exp_month,
                exp_year: details.exp_year,
                is_default: isDefault
            };

            const { data, error } = await supabase
                .from('payment_methods')
                .insert(paymentMethod)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding payment method');
            return null;
        }
    }

    /**
     * Set default payment method
     */
    public async setDefaultPaymentMethod(
        userId: string,
        paymentMethodId: string
    ): Promise<boolean> {
        try {
            // First, set all payment methods to not default
            const { error: clearError } = await supabase
                .from('payment_methods')
                .update({ is_default: false })
                .eq('user_id', userId);

            if (clearError) throw clearError;

            // Then set the specified one as default
            const { error } = await supabase
                .from('payment_methods')
                .update({ is_default: true })
                .eq('id', paymentMethodId)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error setting default payment method');
            return false;
        }
    }

    /**
     * Remove payment method (scoped to user for ownership check)
     */
    public async removePaymentMethod(paymentMethodId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .delete()
                .eq('id', paymentMethodId)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error removing payment method');
            return false;
        }
    }

    /**
     * Get user's invoices
     */
    public async getInvoices(
        userId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<Invoice[]> {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting invoices:', error);
            return [];
        }
    }

    /**
     * Get invoice by ID (user-scoped to prevent IDOR)
     */
    public async getInvoice(invoiceId: string): Promise<Invoice | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting invoice:', error);
            return null;
        }
    }

    /**
     * Get payment history
     */
    public async getPaymentHistory(
        userId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<PaymentHistory[]> {
        try {
            const { data, error } = await supabase
                .from('payment_history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting payment history:', error);
            return [];
        }
    }

    /**
     * Process payment
     */
    public async processPayment(
        userId: string,
        amount: number,
        currency: string,
        description: string,
        paymentMethodId?: string
    ): Promise<PaymentHistory | null> {
        try {
            let paymentMethod = paymentMethodId;
            if (!paymentMethod) {
                const methods = await this.getPaymentMethods(userId);
                const defaultMethod = methods.find(m => m.is_default);
                if (!defaultMethod) {
                    throw new Error('No payment method available');
                }
                paymentMethod = defaultMethod.iyzico_card_token;
            }

            let gatewayStatus: PaymentGatewayStatus = 'pending';
            let gatewayReference = `iyz_pay_${SecurityUtils.generateSecureToken(16)}`;
            let metadata: Record<string, any> = {
                processed_at: new Date().toISOString(),
                gateway: 'iyzico'
            };

            if (CONFIG.IS_PRODUCTION || !CONFIG.MOCK_PAYMENTS) {
                const gatewayResult = await this.chargeWithGateway(
                    userId,
                    amount,
                    currency,
                    description,
                    paymentMethod || 'unknown'
                );
                gatewayStatus = gatewayResult.status;
                gatewayReference = gatewayResult.reference;
                metadata = {
                    ...metadata,
                    ...gatewayResult.metadata
                };
            } else {
                metadata = {
                    ...metadata,
                    mock_payment: true
                };
            }

            const payment: Omit<PaymentHistory, 'id' | 'created_at'> = {
                user_id: userId,
                amount,
                currency,
                description,
                status: gatewayStatus,
                payment_method: paymentMethod || 'unknown',
                metadata: {
                    ...metadata,
                    payment_reference: gatewayReference
                }
            };

            const { data, error } = await supabase
                .from('payment_history')
                .insert(payment)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error processing payment');
            return null;
        }
    }

    /**
     * Check if user has premium features
     */
    public async hasPremiumFeatures(userId: string): Promise<boolean> {
        try {
            const subscription = await this.getUserSubscription(userId);
            if (!subscription) return false;

            // Check if subscription is active and not canceled
            if (subscription.status !== 'active') return false;

            // Check if subscription has expired
            const currentDate = new Date();
            const periodEnd = new Date(subscription.current_period_end);

            if (currentDate > periodEnd) {
                // Update subscription status to expired
                await supabase
                    .from('user_subscriptions')
                    .update({ status: 'expired' })
                    .eq('id', subscription.id);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking premium features:', error);
            return false;
        }
    }

    /**
     * Get subscription analytics (admin only)
     */
    public async getSubscriptionAnalytics(
        startDate: string,
        endDate: string,
        userId: string
    ): Promise<any> {
        try {
            // Verify admin role before returning analytics
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', userId)
                .single();

            if (profileError || !profile || profile.user_type !== 'admin') {
                throw new Error('Unauthorized: admin access required');
            }

            // Get total revenue
            const { data: revenueData, error: revenueError } = await supabase
                .from('payment_history')
                .select('amount, currency')
                .eq('status', 'succeeded')
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (revenueError) throw revenueError;

            // Get active subscriptions count
            const { data: activeSubs, error: subsError } = await supabase
                .from('user_subscriptions')
                .select('id')
                .eq('status', 'active');

            if (subsError) throw subsError;

            // Get new subscriptions
            const { data: newSubs, error: newSubsError } = await supabase
                .from('user_subscriptions')
                .select('id')
                .eq('status', 'active')
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (newSubsError) throw newSubsError;

            // Get churned subscriptions
            const { data: churnedSubs, error: churnedError } = await supabase
                .from('user_subscriptions')
                .select('id')
                .eq('status', 'canceled')
                .gte('canceled_at', startDate)
                .lte('canceled_at', endDate);

            if (churnedError) throw churnedError;

            // Calculate total revenue
            const totalRevenue = revenueData?.reduce((sum, item) => sum + item.amount, 0) || 0;

            // Calculate MRR (Monthly Recurring Revenue)
            const activeSubscriptions = await supabase
                .from('user_subscriptions')
                .select('plan_id, billing_cycle')
                .eq('status', 'active');

            let mrr = 0;
            if (activeSubscriptions.data && activeSubscriptions.data.length > 0) {
                const plans = await this.getSubscriptionPlans();
                const planMap = new Map(plans.map(p => [p.id, p]));

                for (const sub of activeSubscriptions.data) {
                    const plan = planMap.get(sub.plan_id);
                    if (plan) {
                        const price = sub.billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
                        mrr += price;
                    }
                }
            }

            // Calculate churn rate
            const activeCount = activeSubs?.length || 0;
            const churnedCount = churnedSubs?.length || 0;
            const churnRate = activeCount > 0 ? (churnedCount / activeCount) * 100 : 0;

            return {
                total_revenue: totalRevenue,
                mrr: Math.round(mrr * 100) / 100,
                active_subscriptions: activeCount,
                new_subscriptions: newSubs?.length || 0,
                churned_subscriptions: churnedCount,
                churn_rate: Math.round(churnRate * 100) / 100,
                period: {
                    start: startDate,
                    end: endDate
                }
            };
        } catch (error) {
            console.error('Error getting subscription analytics:', error);
            return null;
        }
    }

    /**
     * Create invoice
     */
    private async createInvoice(
        userId: string,
        subscriptionId: string,
        amount: number,
        currency: string,
        description: string
    ): Promise<Invoice | null> {
        try {
            const paymentId = `iyz_pay_${SecurityUtils.generateSecureToken(16)}`;
            const invoice: Omit<Invoice, 'id' | 'created_at'> = {
                user_id: userId,
                subscription_id: subscriptionId,
                iyzico_payment_id: paymentId,
                amount,
                currency,
                status: 'paid',
                paid_at: new Date().toISOString(),
                hosted_invoice_url: `https://example.com/invoices/${paymentId}`
            };

            const { data, error } = await supabase
                .from('invoices')
                .insert(invoice)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating invoice:', error);
            return null;
        }
    }

    /**
     * Calculate prorated amount
     */
    private async calculateProratedAmount(
        subscription: UserSubscription,
        newPlan: SubscriptionPlan,
        billingCycle: 'monthly' | 'yearly'
    ): Promise<number> {
        const currentDate = new Date();
        const periodStart = new Date(subscription.current_period_start);
        const periodEnd = new Date(subscription.current_period_end);

        // Calculate days used and total days in period
        const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
        const daysUsed = Math.ceil((currentDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate unused portion
        const unusedDays = totalDays - daysUsed;
        const unusedPercentage = unusedDays / totalDays;

        // Get old plan price
        const oldPlan = await this.getSubscriptionPlan(subscription.plan_id);
        const oldPrice = subscription.billing_cycle === 'monthly'
            ? oldPlan?.price_monthly || 0
            : oldPlan?.price_yearly || 0;

        const newPrice = billingCycle === 'monthly' ? newPlan.price_monthly : newPlan.price_yearly;

        // Calculate prorated amount (credit for unused portion of old plan)
        const credit = oldPrice * unusedPercentage;

        // If upgrading, charge the difference minus credit
        // If downgrading, credit will be applied to future invoices
        return Math.max(0, newPrice - credit);
    }
}
