// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { computeMonthlyBilling } from "./billing-logic.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bu fonksiyon CRON (pg_cron) ile her ayın 1'inde tetiklenecek şekilde tasarlanmıştır. Veya manuel admin panelinden.
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Güvenlik: Bu fonksiyonu herkesin bağırmaması lazım
        const authHeader = req.headers.get('Authorization');
        if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET_KEY')}`) {
            throw new Error("Unauthorized to run scheduled tasks");
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // We need service role to read/write all users
        );

        const currentMonthYear = new Date().toISOString().slice(0, 7); // Format: '2025-10'

        // Sadece 'active' olan müşterilerin faturalarını hesapla
        const { data: activeClients, error } = await supabaseClient
            .from('client_relationships')
            .select(`
                id,
                professional_id,
                agreed_price,
                platform_fee_percent,
                deposit_paid_amount,
                commission_consumed_to_date,
                duration_months
            `)
            .eq('billing_status', 'active');

        if (error) throw new Error("Failed to fetch clients: " + error.message);

        // Her Profesyonel için toplam borcu (kalan komisyonu) grupla hesapla.
        // İLERİ: Depozito SADECE BİR KEZ kullanılır. commission_consumed_to_date kolonu
        // bugüne kadar depozito ile mahsup edilmiş kümülatif komisyonu tutar; her ay
        // bunu güncelliyoruz, böylece depozito tekrar tekrar düşülmez.
        const defaultFeePercent = Number(Deno.env.get('PLATFORM_COMMISSION_PERCENT')) || 10;
        const professionalBills = {};
        const relationshipUpdates = [];

        for (const client of activeClients) {
            const result = computeMonthlyBilling(client, defaultFeePercent);

            if (!professionalBills[result.professionalId]) {
                professionalBills[result.professionalId] = {
                    total_owed: 0,
                    total_deposit_applied: 0
                };
            }

            professionalBills[result.professionalId].total_owed += result.remainingBalance;
            professionalBills[result.professionalId].total_deposit_applied += result.depositApplied;

            if (result.depositApplied > 0) {
                relationshipUpdates.push({
                    id: result.relationshipId,
                    next_consumed: result.nextConsumedToDate,
                });
            }
        }

        // billing_cycles tablosuna upsert (idempotent — aynı ay iki kez koşturulursa duplicate yaratmaz)
        const billingInserts = [];
        for (const ptId in professionalBills) {
            // Eğer o ay için 0 borcu varsa (yani hep 300 TL altı 10% danışanlara bakmışsa, paid işaretle)
            const owed = professionalBills[ptId].total_owed;
            const status = owed > 0 ? 'pending' : 'paid';

            billingInserts.push({
                professional_id: ptId,
                month_year: currentMonthYear,
                total_commission_owed: owed,
                total_deposit_paid: professionalBills[ptId].total_deposit_applied,
                status: status
            });
        }

        if (billingInserts.length > 0) {
            const { error: insertError } = await supabaseClient
                .from('billing_cycles')
                .upsert(billingInserts, { onConflict: 'professional_id,month_year' });

            if (insertError) throw new Error("Failed to upsert billing: " + insertError.message);
        }

        // Persist consumed-deposit progress on each relationship so next month does not re-apply.
        for (const upd of relationshipUpdates) {
            const { error: updError } = await supabaseClient
                .from('client_relationships')
                .update({ commission_consumed_to_date: upd.next_consumed })
                .eq('id', upd.id);
            if (updError) {
                console.warn(`Failed to update commission_consumed_to_date for relationship ${upd.id}: ${updError.message}`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Monthly billing processed for ${billingInserts.length} professionals.`,
            data: billingInserts
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('CRON Edge function error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
