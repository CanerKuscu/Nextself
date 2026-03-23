"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const supabase_1 = require("./supabase");
const agreementService_1 = require("./agreementService");
const config_1 = require("../config/config");
const supabase = supabase_1.SupabaseService.getInstance().getClient();
class PaymentService {
    constructor() {
        this.initIyzico();
    }
    static getInstance() {
        if (!PaymentService.instance) {
            PaymentService.instance = new PaymentService();
        }
        return PaymentService.instance;
    }
    initIyzico() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // In production, initialize iyzico SDK with API key & secret key
                // iyzico is the primary payment provider for Turkey market
                // When expanding to Dubai/international, Stripe can be added as secondary provider
                console.log('iyzico initialized');
            }
            catch (error) {
                console.error('Error initializing iyzico:', error);
            }
        });
    }
    /**
     * Get all subscription plans
     */
    getSubscriptionPlans() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const plansTable = config_1.CONFIG.SUBSCRIPTION_PLANS_TABLE || 'subscription_plans';
                const { data, error } = yield supabase
                    .from(plansTable)
                    .select('*')
                    .eq('is_active', true)
                    .order('price_monthly', { ascending: true });
                if (error)
                    throw error;
                return data || [];
            }
            catch (error) {
                console.error('Error getting subscription plans:', error);
                return [];
            }
        });
    }
    /**
     * Get subscription plan by ID
     */
    getSubscriptionPlan(planId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const plansTable = config_1.CONFIG.SUBSCRIPTION_PLANS_TABLE || 'subscription_plans';
                const { data, error } = yield supabase
                    .from(plansTable)
                    .select('*')
                    .eq('id', planId)
                    .eq('is_active', true)
                    .single();
                if (error)
                    throw error;
                return data;
            }
            catch (error) {
                console.error('Error getting subscription plan:', error);
                return null;
            }
        });
    }
    /**
     * Get user's current subscription
     */
    getUserSubscription(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Primary table name used by the app
                const primaryTable = config_1.CONFIG.SUBSCRIPTIONS_TABLE || 'user_subscriptions';
                const { data, error } = yield supabase
                    .from(primaryTable)
                    .select('*')
                    .eq('user_id', userId)
                    .eq('status', 'active')
                    .single();
                // If table doesn't exist (PGRST205), try common alternative table names
                if (error && error.code === 'PGRST205') {
                    const alternatives = [
                        config_1.CONFIG.SUBSCRIPTIONS_TABLE,
                        'subscriptions',
                        'user_subscription',
                        'customer_subscriptions'
                    ].filter(Boolean).map(String).filter((v, i, a) => a.indexOf(v) === i && v !== primaryTable);
                    for (const tbl of alternatives) {
                        try {
                            const res = yield supabase
                                .from(tbl)
                                .select('*')
                                .eq('user_id', userId)
                                .eq('status', 'active')
                                .single();
                            if (!res.error && res.data)
                                return res.data;
                        }
                        catch (e) {
                            // ignore and try next
                        }
                    }
                    // Table not found among alternatives — log and return null
                    console.warn(`Subscription table '${primaryTable}' not found; attempted alternatives and none exist.`);
                    return null;
                }
                if (error && error.code !== 'PGRST116')
                    throw error; // PGRST116 = no rows returned
                return data;
            }
            catch (error) {
                console.error('Error getting user subscription:', error);
                return null;
            }
        });
    }
    /**
     * Create subscription (with MSS — Mesafeli Satış Sözleşmesi compliance per 6502 Kanun)
     *
     * Flow: 1) Generate MSS contract → 2) Accept contract → 3) Create subscription → 4) Activate contract
     */
    createSubscription(userId, planId, billingCycle, paymentMethodId, buyerInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get plan details
                const plan = yield this.getSubscriptionPlan(planId);
                if (!plan) {
                    throw new Error('Plan not found');
                }
                // Check if user already has an active subscription
                const existingSubscription = yield this.getUserSubscription(userId);
                if (existingSubscription) {
                    throw new Error('User already has an active subscription');
                }
                const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                // ── MSS Contract Flow (6502 Kanun Mesafeli Satış Sözleşmesi) ──
                const agreementService = agreementService_1.AgreementService.getInstance();
                let contractId = null;
                if (buyerInfo) {
                    // 1) Create MSS contract
                    const contractResult = yield agreementService.createDistanceSalesContract(userId, buyerInfo.fullName, buyerInfo.email, buyerInfo.address, planId, plan.name, billingCycle, price, plan.currency);
                    if (!contractResult.success || !contractResult.contract) {
                        throw new Error(contractResult.error || 'MSS contract creation failed');
                    }
                    contractId = contractResult.contract.id;
                    // 2) Accept the MSS contract (buyer confirmed the pre-information form)
                    yield agreementService.acceptDistanceSalesContract(contractId);
                }
                // ── End MSS Contract Flow ──
                // In production, create iyzico subscription via iyzico API
                // For international (Dubai) expansion, Stripe integration will be added
                const currentDate = new Date();
                const periodEnd = new Date(currentDate);
                if (billingCycle === 'monthly') {
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                }
                else {
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                }
                // If plan has trial days, adjust dates
                let trialStart = undefined;
                let trialEnd = undefined;
                if (plan.trial_days > 0) {
                    trialStart = currentDate.toISOString();
                    const trialEndDate = new Date(currentDate);
                    trialEndDate.setDate(trialEndDate.getDate() + plan.trial_days);
                    trialEnd = trialEndDate.toISOString();
                }
                const subscription = {
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
                    iyzico_subscription_ref: `iyz_sub_${Date.now()}`,
                    iyzico_customer_ref: `iyz_cus_${userId}`
                };
                const { data, error } = yield supabase
                    .from('user_subscriptions')
                    .insert(subscription)
                    .select()
                    .single();
                if (error)
                    throw error;
                // Create initial invoice
                yield this.createInvoice(userId, data.id, price, plan.currency, 'Initial subscription payment');
                // 3) Activate MSS contract after successful payment
                if (contractId) {
                    yield agreementService.activateContract(contractId);
                }
                return data;
            }
            catch (error) {
                console.error('Error creating subscription');
                return null;
            }
        });
    }
    /**
     * Cancel subscription
     */
    cancelSubscription(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, cancelAtPeriodEnd = true) {
            try {
                const subscription = yield this.getUserSubscription(userId);
                if (!subscription) {
                    throw new Error('No active subscription found');
                }
                const updates = {
                    cancel_at_period_end: cancelAtPeriodEnd,
                    canceled_at: cancelAtPeriodEnd ? undefined : new Date().toISOString(),
                    status: cancelAtPeriodEnd ? 'active' : 'canceled',
                    updated_at: new Date().toISOString()
                };
                const { error } = yield supabase
                    .from('user_subscriptions')
                    .update(updates)
                    .eq('id', subscription.id);
                if (error)
                    throw error;
                return true;
            }
            catch (error) {
                console.error('Error canceling subscription:', error);
                return false;
            }
        });
    }
    /**
     * Update subscription plan
     */
    updateSubscriptionPlan(userId_1, newPlanId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, newPlanId, prorate = true) {
            try {
                const subscription = yield this.getUserSubscription(userId);
                if (!subscription) {
                    throw new Error('No active subscription found');
                }
                const newPlan = yield this.getSubscriptionPlan(newPlanId);
                if (!newPlan) {
                    throw new Error('New plan not found');
                }
                // Calculate prorated amount if needed
                let proratedAmount = 0;
                if (prorate) {
                    proratedAmount = yield this.calculateProratedAmount(subscription, newPlan, subscription.billing_cycle);
                }
                // Update subscription
                const { error } = yield supabase
                    .from('user_subscriptions')
                    .update({
                    plan_id: newPlanId,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', subscription.id);
                if (error)
                    throw error;
                // Create invoice for prorated amount if applicable
                if (proratedAmount > 0) {
                    yield this.createInvoice(userId, subscription.id, proratedAmount, newPlan.currency, 'Prorated plan upgrade');
                }
                return true;
            }
            catch (error) {
                console.error('Error updating subscription plan:', error);
                return false;
            }
        });
    }
    /**
     * Get user's payment methods
     */
    getPaymentMethods(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield supabase
                    .from('payment_methods')
                    .select('*')
                    .eq('user_id', userId)
                    .order('is_default', { ascending: false })
                    .order('created_at', { ascending: false });
                if (error)
                    throw error;
                return data || [];
            }
            catch (error) {
                console.error('Error getting payment methods:', error);
                return [];
            }
        });
    }
    /**
     * Add payment method
     */
    addPaymentMethod(userId, iyzicoCardToken, type, details) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if this is the first payment method
                const existingMethods = yield this.getPaymentMethods(userId);
                const isDefault = existingMethods.length === 0;
                const paymentMethod = {
                    user_id: userId,
                    iyzico_card_token: iyzicoCardToken,
                    type,
                    brand: details.brand,
                    last4: details.last4,
                    exp_month: details.exp_month,
                    exp_year: details.exp_year,
                    is_default: isDefault
                };
                const { data, error } = yield supabase
                    .from('payment_methods')
                    .insert(paymentMethod)
                    .select()
                    .single();
                if (error)
                    throw error;
                return data;
            }
            catch (error) {
                console.error('Error adding payment method');
                return null;
            }
        });
    }
    /**
     * Set default payment method
     */
    setDefaultPaymentMethod(userId, paymentMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // First, set all payment methods to not default
                const { error: clearError } = yield supabase
                    .from('payment_methods')
                    .update({ is_default: false })
                    .eq('user_id', userId);
                if (clearError)
                    throw clearError;
                // Then set the specified one as default
                const { error } = yield supabase
                    .from('payment_methods')
                    .update({ is_default: true })
                    .eq('id', paymentMethodId)
                    .eq('user_id', userId);
                if (error)
                    throw error;
                return true;
            }
            catch (error) {
                console.error('Error setting default payment method');
                return false;
            }
        });
    }
    /**
     * Remove payment method (scoped to user for ownership check)
     */
    removePaymentMethod(paymentMethodId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = yield supabase
                    .from('payment_methods')
                    .delete()
                    .eq('id', paymentMethodId)
                    .eq('user_id', userId);
                if (error)
                    throw error;
                return true;
            }
            catch (error) {
                console.error('Error removing payment method');
                return false;
            }
        });
    }
    /**
     * Get user's invoices
     */
    getInvoices(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 20, offset = 0) {
            try {
                const { data, error } = yield supabase
                    .from('invoices')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);
                if (error)
                    throw error;
                return data || [];
            }
            catch (error) {
                console.error('Error getting invoices:', error);
                return [];
            }
        });
    }
    /**
     * Get invoice by ID (user-scoped to prevent IDOR)
     */
    getInvoice(invoiceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data: { user } } = yield supabase.auth.getUser();
                if (!user)
                    throw new Error('Not authenticated');
                const { data, error } = yield supabase
                    .from('invoices')
                    .select('*')
                    .eq('id', invoiceId)
                    .eq('user_id', user.id)
                    .single();
                if (error)
                    throw error;
                return data;
            }
            catch (error) {
                console.error('Error getting invoice:', error);
                return null;
            }
        });
    }
    /**
     * Get payment history
     */
    getPaymentHistory(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 20, offset = 0) {
            try {
                const { data, error } = yield supabase
                    .from('payment_history')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);
                if (error)
                    throw error;
                return data || [];
            }
            catch (error) {
                console.error('Error getting payment history:', error);
                return [];
            }
        });
    }
    /**
     * Process payment
     */
    processPayment(userId, amount, currency, description, paymentMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get default payment method if none specified
                let paymentMethod = paymentMethodId;
                if (!paymentMethod) {
                    const methods = yield this.getPaymentMethods(userId);
                    const defaultMethod = methods.find(m => m.is_default);
                    if (!defaultMethod) {
                        throw new Error('No payment method available');
                    }
                    paymentMethod = defaultMethod.iyzico_card_token;
                }
                // In production, process payment via iyzico API
                // For international (Dubai) expansion, Stripe can be added as secondary provider
                const payment = {
                    user_id: userId,
                    amount,
                    currency,
                    description,
                    status: 'succeeded',
                    payment_method: paymentMethod || 'unknown',
                    metadata: {
                        processed_at: new Date().toISOString(),
                        mock_payment: true
                    }
                };
                const { data, error } = yield supabase
                    .from('payment_history')
                    .insert(payment)
                    .select()
                    .single();
                if (error)
                    throw error;
                return data;
            }
            catch (error) {
                console.error('Error processing payment');
                return null;
            }
        });
    }
    /**
     * Check if user has premium features
     */
    hasPremiumFeatures(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield this.getUserSubscription(userId);
                if (!subscription)
                    return false;
                // Check if subscription is active and not canceled
                if (subscription.status !== 'active')
                    return false;
                // Check if subscription has expired
                const currentDate = new Date();
                const periodEnd = new Date(subscription.current_period_end);
                if (currentDate > periodEnd) {
                    // Update subscription status to expired
                    yield supabase
                        .from('user_subscriptions')
                        .update({ status: 'expired' })
                        .eq('id', subscription.id);
                    return false;
                }
                return true;
            }
            catch (error) {
                console.error('Error checking premium features:', error);
                return false;
            }
        });
    }
    /**
     * Get subscription analytics (admin only)
     */
    getSubscriptionAnalytics(startDate, endDate, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify admin role before returning analytics
                const { data: profile, error: profileError } = yield supabase
                    .from('profiles')
                    .select('user_type')
                    .eq('id', userId)
                    .single();
                if (profileError || !profile || profile.user_type !== 'admin') {
                    throw new Error('Unauthorized: admin access required');
                }
                // Get total revenue
                const { data: revenueData, error: revenueError } = yield supabase
                    .from('payment_history')
                    .select('amount, currency')
                    .eq('status', 'succeeded')
                    .gte('created_at', startDate)
                    .lte('created_at', endDate);
                if (revenueError)
                    throw revenueError;
                // Get active subscriptions count
                const { data: activeSubs, error: subsError } = yield supabase
                    .from('user_subscriptions')
                    .select('id')
                    .eq('status', 'active');
                if (subsError)
                    throw subsError;
                // Get new subscriptions
                const { data: newSubs, error: newSubsError } = yield supabase
                    .from('user_subscriptions')
                    .select('id')
                    .eq('status', 'active')
                    .gte('created_at', startDate)
                    .lte('created_at', endDate);
                if (newSubsError)
                    throw newSubsError;
                // Get churned subscriptions
                const { data: churnedSubs, error: churnedError } = yield supabase
                    .from('user_subscriptions')
                    .select('id')
                    .eq('status', 'canceled')
                    .gte('canceled_at', startDate)
                    .lte('canceled_at', endDate);
                if (churnedError)
                    throw churnedError;
                // Calculate total revenue
                const totalRevenue = (revenueData === null || revenueData === void 0 ? void 0 : revenueData.reduce((sum, item) => sum + item.amount, 0)) || 0;
                // Calculate MRR (Monthly Recurring Revenue)
                const activeSubscriptions = yield supabase
                    .from('user_subscriptions')
                    .select('plan_id, billing_cycle')
                    .eq('status', 'active');
                let mrr = 0;
                if (activeSubscriptions.data) {
                    for (const sub of activeSubscriptions.data) {
                        const plan = yield this.getSubscriptionPlan(sub.plan_id);
                        if (plan) {
                            const price = sub.billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
                            mrr += price;
                        }
                    }
                }
                // Calculate churn rate
                const activeCount = (activeSubs === null || activeSubs === void 0 ? void 0 : activeSubs.length) || 0;
                const churnedCount = (churnedSubs === null || churnedSubs === void 0 ? void 0 : churnedSubs.length) || 0;
                const churnRate = activeCount > 0 ? (churnedCount / activeCount) * 100 : 0;
                return {
                    total_revenue: totalRevenue,
                    mrr: Math.round(mrr * 100) / 100,
                    active_subscriptions: activeCount,
                    new_subscriptions: (newSubs === null || newSubs === void 0 ? void 0 : newSubs.length) || 0,
                    churned_subscriptions: churnedCount,
                    churn_rate: Math.round(churnRate * 100) / 100,
                    period: {
                        start: startDate,
                        end: endDate
                    }
                };
            }
            catch (error) {
                console.error('Error getting subscription analytics:', error);
                return null;
            }
        });
    }
    /**
     * Create invoice
     */
    createInvoice(userId, subscriptionId, amount, currency, description) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const invoice = {
                    user_id: userId,
                    subscription_id: subscriptionId,
                    iyzico_payment_id: `iyz_pay_${Date.now()}`,
                    amount,
                    currency,
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    hosted_invoice_url: `https://example.com/invoices/iyz_pay_${Date.now()}`
                };
                const { data, error } = yield supabase
                    .from('invoices')
                    .insert(invoice)
                    .select()
                    .single();
                if (error)
                    throw error;
                return data;
            }
            catch (error) {
                console.error('Error creating invoice:', error);
                return null;
            }
        });
    }
    /**
     * Calculate prorated amount
     */
    calculateProratedAmount(subscription, newPlan, billingCycle) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const oldPlan = yield this.getSubscriptionPlan(subscription.plan_id);
            const oldPrice = subscription.billing_cycle === 'monthly'
                ? (oldPlan === null || oldPlan === void 0 ? void 0 : oldPlan.price_monthly) || 0
                : (oldPlan === null || oldPlan === void 0 ? void 0 : oldPlan.price_yearly) || 0;
            const newPrice = billingCycle === 'monthly' ? newPlan.price_monthly : newPlan.price_yearly;
            // Calculate prorated amount (credit for unused portion of old plan)
            const credit = oldPrice * unusedPercentage;
            // If upgrading, charge the difference minus credit
            // If downgrading, credit will be applied to future invoices
            return Math.max(0, newPrice - credit);
        });
    }
}
exports.PaymentService = PaymentService;
