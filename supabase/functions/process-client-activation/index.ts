import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const configuredOrigins = (Deno.env.get('EDGE_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

const resolveCorsHeaders = (origin: string | null): Record<string, string> => {
    const fallbackOrigin = configuredOrigins[0] ?? 'https://app.nextself.com';
    const isAllowed = origin ? configuredOrigins.includes(origin) : false;
    const allowOrigin = origin && isAllowed ? origin : fallbackOrigin;
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
};

const parseAccessToken = (req: Request): string => {
    const authHeader = req.headers.get('Authorization') || '';
    const accessToken = authHeader.replace('Bearer ', '').trim();
    if (!accessToken) {
        throw new Error('Unauthorized');
    }
    return accessToken;
};

const calculateDepositAmount = (durationMonths: number): number => {
    if (durationMonths === 3) return 750;
    if (durationMonths === 6) return 1250;
    if (durationMonths === 12) return 2000;
    return 300 * durationMonths;
};

serve(async (req: Request) => {
    const origin = req.headers.get('origin');
    const corsHeaders = resolveCorsHeaders(origin);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 204, headers: corsHeaders });
    }

    if (origin && configuredOrigins.length > 0 && !configuredOrigins.includes(origin)) {
        return new Response(JSON.stringify({ error: 'Forbidden origin' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
        });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase credentials are not configured.');
        }

        const accessToken = parseAccessToken(req);
        const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: userAuth, error: authError } = await authClient.auth.getUser(accessToken);
        if (authError || !userAuth.user) {
            throw new Error('Unauthorized');
        }
        const professionalId = userAuth.user.id;
        const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const payload = await req.json() as {
            clientId?: string;
            agreedPrice?: number;
            durationMonths?: number;
            identityNumber?: string;
        };
        const clientId = payload.clientId;
        const agreedPrice = payload.agreedPrice;
        const durationMonths = payload.durationMonths ?? 1;
        const identityNumber = payload.identityNumber;

        if (!clientId || typeof clientId !== 'string') {
            throw new Error('Missing clientId');
        }
        if (typeof agreedPrice !== 'number' || Number.isNaN(agreedPrice) || agreedPrice <= 0) {
            throw new Error('Invalid agreedPrice');
        }
        const MAX_AGREED_PRICE_TRY = 1_000_000;
        if (agreedPrice > MAX_AGREED_PRICE_TRY) {
            throw new Error(`agreedPrice exceeds maximum of ${MAX_AGREED_PRICE_TRY} TL`);
        }
        if (!Number.isInteger(durationMonths) || durationMonths <= 0 || durationMonths > 24) {
            throw new Error('Invalid durationMonths');
        }
        const defaultIdentityNumber = Deno.env.get('IYZICO_DEFAULT_IDENTITY_NUMBER') ?? '';
        const effectiveIdentityNumber = identityNumber || defaultIdentityNumber;
        if (!effectiveIdentityNumber || !/^\d{11}$/.test(effectiveIdentityNumber)) {
            throw new Error('identityNumber is required and must be 11 digits');
        }

        // Platform commission percent is configured centrally via env so that
        // process-client-activation, calculate-monthly-billing, and verify_proposal_payment
        // all derive from one source of truth instead of three hard-coded copies.
        const platformFeePercent = Number(Deno.env.get('PLATFORM_COMMISSION_PERCENT')) || 10;
        const commissionRate = platformFeePercent / 100;
        const depositAmount = calculateDepositAmount(durationMonths);

        const { data: professional, error: profError } = await serviceClient
            .from('users')
            .select(`
                email,
                first_name,
                last_name,
                phone,
                professional_profiles (
                    id,
                    city,
                    district,
                    country
                )
            `)
            .eq('id', professionalId)
            .single();

        if (profError || !professional) {
            throw new Error(`Professional profile not found: ${profError?.message ?? 'Unknown error'}`);
        }

        const profProfile = Array.isArray(professional.professional_profiles)
            ? professional.professional_profiles[0]
            : professional.professional_profiles;

        if (!profProfile?.id) {
            throw new Error('Professional profile id not found');
        }

        const { data: existingRelationship, error: relOwnershipError } = await serviceClient
            .from('client_relationships')
            .select('id, billing_status')
            .eq('professional_id', profProfile.id)
            .eq('client_id', clientId)
            .single();

        if (relOwnershipError || !existingRelationship?.id) {
            throw new Error('Client relationship not found for authenticated professional');
        }

        const buyerName = professional.first_name || "Professional";
        const buyerSurname = professional.last_name || "User";
        const buyerEmail = professional.email;
        const buyerPhone = professional.phone || "+905550000000";
        const buyerCity = profProfile.city || "Istanbul";
        const buyerCountry = profProfile.country || "Turkey";
        const buyerAddress = `${profProfile.district || ''} ${buyerCity} ${buyerCountry}`.trim() || "Turkey";
        const buyerId = effectiveIdentityNumber;

        const IYZICO_API_KEY = Deno.env.get('IYZICO_API_KEY');
        const IYZICO_AUTH_HEADER = Deno.env.get('IYZICO_AUTH_HEADER');
        const IYZICO_BASE_URL = Deno.env.get('IYZICO_BASE_URL') || "https://sandbox-api.iyzipay.com";
        const PAYMENT_CALLBACK_URL = Deno.env.get('PAYMENT_CALLBACK_URL');
        const IS_MOCK_PAYMENT = Deno.env.get('IS_MOCK_PAYMENT') === 'true';
        const IYZICO_MOCK_PAYMENT_URL = Deno.env.get('IYZICO_MOCK_PAYMENT_URL');

        if (!IYZICO_API_KEY || !IYZICO_AUTH_HEADER) {
            throw new Error('Payment gateway credentials are missing.');
        }
        if (!PAYMENT_CALLBACK_URL) {
            throw new Error('PAYMENT_CALLBACK_URL is required.');
        }

        const paymentPayload = {
            locale: "tr",
            conversationId: `BIO-${Date.now()}`,
            price: depositAmount.toString(),
            paidPrice: depositAmount.toString(),
            currency: "TRY",
            basketId: `B-${clientId.substring(0, 8)}`,
            paymentGroup: "PRODUCT",
            callbackUrl: PAYMENT_CALLBACK_URL,
            enabledInstallments: [1],
            buyer: {
                id: professionalId,
                name: buyerName,
                surname: buyerSurname,
                identityNumber: buyerId,
                email: buyerEmail,
                gsmNumber: buyerPhone,
                registrationAddress: buyerAddress,
                city: buyerCity,
                country: buyerCountry,
                ip: req.headers.get('x-forwarded-for') || "0.0.0.0"
            },
            shippingAddress: {
                contactName: `${buyerName} ${buyerSurname}`,
                city: buyerCity,
                country: buyerCountry,
                address: buyerAddress
            },
            billingAddress: {
                contactName: `${buyerName} ${buyerSurname}`,
                city: buyerCity,
                country: buyerCountry,
                address: buyerAddress
            },
            basketItems: [
                {
                    id: `ITEM-${clientId.substring(0, 8)}`,
                    name: "NextSelf Müşteri Aktivasyon Depozitosu",
                    category1: "Digital Services",
                    itemType: "VIRTUAL",
                    price: depositAmount.toString()
                }
            ]
        };

        const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}/payment/checkoutform/initialize/auth/ecom`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': IYZICO_API_KEY,
                'Authorization': IYZICO_AUTH_HEADER
            },
            body: JSON.stringify(paymentPayload)
        });

        const paymentResult = await iyzicoResponse.json() as {
            status?: string;
            errorMessage?: string;
            token?: string;
            paymentPageUrl?: string;
        };

        if (paymentResult.status !== 'success' && !IS_MOCK_PAYMENT) {
            throw new Error(`Payment gateway error: ${paymentResult.errorMessage || 'Initialization failed'}`);
        }

        const transactionRef = paymentResult.token || (IS_MOCK_PAYMENT ? `IYZICO_TRX_${Date.now()}` : '');
        const paymentPageUrl = paymentResult.paymentPageUrl || (IS_MOCK_PAYMENT ? IYZICO_MOCK_PAYMENT_URL : '');

        if (!transactionRef) {
            throw new Error('Payment transaction reference is missing');
        }
        if (!paymentPageUrl) {
            throw new Error('Payment page URL is missing');
        }

        const { error: logError } = await serviceClient
            .from('transaction_logs')
            .insert({
                professional_id: profProfile.id,
                client_id: clientId,
                amount: depositAmount,
                transaction_type: 'deposit_payment',
                payment_gateway_ref: transactionRef
            });

        if (logError) throw new Error(`Failed to log transaction: ${logError.message}`);

        const { error: relError } = await serviceClient
            .from('client_relationships')
            .update({
                agreed_price: agreedPrice,
                duration_months: durationMonths,
                platform_fee_percent: platformFeePercent,
                deposit_paid_amount: depositAmount,
                billing_status: 'active'
            })
            .eq('id', existingRelationship.id);

        if (relError) throw new Error(`Failed to activate relationship: ${relError.message}`);

        return new Response(JSON.stringify({
            success: true,
            message: "Payment initialized successfully",
            deposit_charged: depositAmount,
            commission_rate: commissionRate,
            paymentPageUrl: paymentPageUrl,
            token: transactionRef
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        console.error('Edge function error:', message);
        const status = message === 'Unauthorized' ? 401 : 400;
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status,
        });
    }
});
