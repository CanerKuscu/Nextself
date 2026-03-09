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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // We need service role to update the checkin table
        );

        // JWT'den kimin (Pte mi Müşteri mi) istek attığını bulalım
        const authHeader = req.headers.get('Authorization')!;
        const { data: userAuth, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !userAuth.user) {
            throw new Error("Unauthorized");
        }
        const scannedById = userAuth.user.id;

        const payload = await req.json();
        const { qrToken } = payload; // PT'nin ekranında çıkan benzersiz JSON/String token. Veritabanına PT kaydetmiş olmalı.

        if (!qrToken) {
            throw new Error("Missing QR Token");
        }

        // 1. qr_token ile session_checkins tablosunda bu bekleyen (doğrulanmamış) check-in var mı bul?
        const { data: checkinData, error: findError } = await supabaseClient
            .from('session_checkins')
            .select(`
                id, 
                is_verified, 
                client_relationship_id,
                client_relationships (
                    client_id,
                    professional_id,
                    billing_status
                )
            `)
            .eq('qr_token', qrToken)
            .eq('is_verified', false)
            .single();

        if (findError || !checkinData) {
            throw new Error("Invalid or Expired QR Code");
        }

        const relationship = checkinData.client_relationships;

        // 2. Kontrol 1: Bu QR kod, okutan müşterinin ilişkisine mi ait?
        if (relationship.client_id !== scannedById) {
            throw new Error("You are not authorized to check-in for this session. It belongs to a different client.");
        }

        // 3. Kontrol 2: Fatura Ödenmiş mi? Eğitmenin hesabı askıda mı?
        if (relationship.billing_status === 'suspended_payment') {
            throw new Error("Your professional's account is currently suspended due to unpaid billing. Cannot check-in.");
        }

        // 4. Doğrulamayı Başarıyla Kaydet (Update)
        const { error: updateError } = await supabaseClient
            .from('session_checkins')
            .update({
                is_verified: true,
                checkin_time: new Date().toISOString()
            })
            .eq('id', checkinData.id);

        if (updateError) {
            throw new Error("Failed to verify check-in: " + updateError.message);
        }

        return new Response(JSON.stringify({
            success: true,
            message: "Face-to-face session verified successfully!",
            sessionId: checkinData.id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Checkin Edge function error:', error);
        const status = error.message === 'Unauthorized' ? 401 : 400;
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status,
        });
    }
});
