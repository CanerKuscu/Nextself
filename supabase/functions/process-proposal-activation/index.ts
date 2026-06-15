// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno import
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

// No longer needed, as we fetch from database

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
            proposalId?: string;
            clientId?: string;
            identityNumber?: string;
        };
        const proposalId = payload.proposalId;
        const clientId = payload.clientId;
        const identityNumber = payload.identityNumber;

        if (!proposalId || typeof proposalId !== 'string') {
            throw new Error('Missing proposalId');
        }

        const defaultIdentityNumber = Deno.env.get('IYZICO_DEFAULT_IDENTITY_NUMBER') ?? '';
        const effectiveIdentityNumber = identityNumber || defaultIdentityNumber;
        if (!effectiveIdentityNumber || !/^\d{11}$/.test(effectiveIdentityNumber)) {
            throw new Error('identityNumber is required and must be 11 digits');
        }

        const { data: proposal, error: propError } = await serviceClient
            .from('service_proposals')
            .select('*')
            .eq('id', proposalId)
            .eq('professional_user_id', professionalId)
            .eq('status', 'accepted')
            .single();

        if (propError || !proposal) {
            throw new Error('Proposal not found or not accepted');
        }

        const effectiveClientId = clientId || proposal.client_user_id;

        const commissionRate = 0.10;
        const depositAmount = proposal.deposit_total;

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
            basketId: `B-${effectiveClientId.substring(0, 8)}`,
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
                    id: `ITEM-${effectiveClientId.substring(0, 8)}`,
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
                client_id: effectiveClientId,
                amount: depositAmount,
                transaction_type: 'deposit_payment',
                payment_gateway_ref: transactionRef
            });

        if (logError) throw new Error(`Failed to log transaction: ${logError.message}`);

        // Removed client_relationships update here, we will handle it locally or via webhook

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
