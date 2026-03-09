// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // We need service role to bypass RLS for billing updates
        );

        // JWT'den kimin istek attığını (Professional ID) bulalım
        const authHeader = req.headers.get('Authorization')!;
        const { data: userAuth, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !userAuth.user) {
            throw new Error("Unauthorized");
        }
        const professionalId = userAuth.user.id;

        const payload = await req.json();
        const { clientId, agreedPrice, durationMonths = 1 } = payload;

        if (!clientId || !agreedPrice || agreedPrice < 0) {
            throw new Error("Missing clientId or invalid agreedPrice");
        }

        // 1. Hesaplama (Depozito İndirimli Paketler)
        const commissionRate = 0.10;
        const calculatedCommission = agreedPrice * commissionRate;

        let depositAmount = 300;
        if (durationMonths === 3) depositAmount = 750;
        else if (durationMonths === 6) depositAmount = 1250;
        else if (durationMonths === 12) depositAmount = 2000;
        else depositAmount = 300 * durationMonths;

        // 2. Iyzico (veya Stripe) Ödeme Altyapısı Entegrasyonu
        // Gerçek API'ye istek atarak bir ödeme linki (Checkout Form URL) oluşturuyoruz.
        const IYZICO_API_KEY = Deno.env.get('IYZICO_API_KEY');
        const IYZICO_SECRET_KEY = Deno.env.get('IYZICO_SECRET_KEY');
        const IYZICO_BASE_URL = Deno.env.get('IYZICO_BASE_URL') || "https://sandbox-api.iyzipay.com";

        if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
            throw new Error("Payment gateway keys are missing in environment variables.");
        }

        // Iyzico Checkout Form Initialize Payload
        const paymentPayload = {
            locale: "tr",
            conversationId: `BIO-${Date.now()}`,
            price: depositAmount.toString(),
            paidPrice: depositAmount.toString(),
            currency: "TRY",
            basketId: `B-${clientId.substring(0, 8)}`,
            paymentGroup: "PRODUCT",
            callbackUrl: "https://vizin-app-url.com/payment/callback", // Uygulamanın döneceği URL
            enabledInstallments: [1], // Sadece tek çekim (depozito)
            buyer: {
                id: professionalId,
                name: "PT",
                surname: "User",
                identityNumber: "11111111111", // Gerçekte kullanıcının veritabanı profilinden gelir
                email: "pt@biosync.com",
                gsmNumber: "+905555555555",
                registrationAddress: "Antalya",
                city: "Antalya",
                country: "Turkey",
                ip: "85.34.78.112"
            },
            shippingAddress: {
                contactName: "PT User",
                city: "Antalya",
                country: "Turkey",
                address: "Konyalti"
            },
            billingAddress: {
                contactName: "PT User",
                city: "Antalya",
                country: "Turkey",
                address: "Konyalti"
            },
            basketItems: [
                {
                    id: `ITEM-${clientId.substring(0, 8)}`,
                    name: "BioSync Müşteri Aktivasyon Depozitosu",
                    category1: "Digital Services",
                    itemType: "VIRTUAL",
                    price: depositAmount.toString()
                }
            ]
        };

        // NOT: Iyzico PKI Signature (Authorization Header) oluşturulması Deno ortamında Hash tabanlı yapılır. 
        // Burada Fetch ile gerçek Iyzico sistemine istek gönderilir.
        const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}/payment/checkoutform/initialize/auth/ecom`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Gerçek ortamda Iyzico PKI String imzalama algoritması buraya eklenir
                'Authorization': `IYZWS ${IYZICO_API_KEY}:HashedSecretString`
            },
            body: JSON.stringify(paymentPayload)
        });

        const paymentResult = await iyzicoResponse.json();

        if (paymentResult.status !== 'success') {
            throw new Error(`Payment gateway error: ${paymentResult.errorMessage || 'Initialization failed'}`);
        }

        const transactionRef = paymentResult.token || `IYZICO_TRX_${Date.now()}`;
        const paymentPageUrl = paymentResult.paymentPageUrl; // React Native'de WebView ile açılacak link

        // 3. Veritabanı İşlemleri (Transaction)
        // a) Transaction Log kaydı
        const { error: logError } = await supabaseClient
            .from('transaction_logs')
            .insert({
                professional_id: professionalId,
                client_id: clientId,
                amount: depositAmount,
                transaction_type: 'deposit_payment',
                payment_gateway_ref: transactionRef
            });

        if (logError) throw new Error("Failed to log transaction: " + logError.message);

        // b) Client Relationship'i güncelle/aktifleştir
        // Müşteri zaten pending olarak client_relationships tablosundaysa Update ederiz.
        // Eğer yoksa insert ederiz. Burada update varsayıyoruz.
        const { data: relData, error: relError } = await supabaseClient
            .from('client_relationships')
            .update({
                agreed_price: agreedPrice,
                duration_months: durationMonths,
                platform_fee_percent: commissionRate * 100,
                deposit_paid_amount: depositAmount,
                billing_status: 'active'
            })
            .eq('professional_id', professionalId)
            .eq('client_id', clientId)
            .select()
            .single();

        if (relError) throw new Error("Failed to activate relationship: " + relError.message);

        return new Response(JSON.stringify({
            success: true,
            message: "Payment initialized successfully",
            deposit_charged: depositAmount,
            paymentPageUrl: paymentPageUrl, // React Native bu URL'i WebView'da açacak
            token: transactionRef
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Edge function error:', error);
        const status = error.message === 'Unauthorized' ? 401 : 400;
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status,
        });
    }
});
