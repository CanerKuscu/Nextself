// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
                duration_months
            `)
            .eq('billing_status', 'active');

        if (error) throw new Error("Failed to fetch clients: " + error.message);

        // Her Profesyonel için toplam borcu (kalan komisyonu) grupla hesapla
        const professionalBills = {};

        for (const client of activeClients) {
            const commissionRate = (client.platform_fee_percent || 10) / 100;
            const owedCommissionForClient = client.agreed_price * commissionRate;

            let defaultDeposit = 300;
            const dm = client.duration_months || 1;
            if (dm === 3) defaultDeposit = 750;
            else if (dm === 6) defaultDeposit = 1250;
            else if (dm === 12) defaultDeposit = 2000;
            else defaultDeposit = 300 * dm;

            const depositPaid = client.deposit_paid_amount || defaultDeposit;

            // Eğer komisyon deopzitodan büyükse (Örn: 500 - 300 = 200 TL borç var)
            let remainingBalance = 0;
            if (owedCommissionForClient > depositPaid) {
                remainingBalance = owedCommissionForClient - depositPaid;
            }

            if (!professionalBills[client.professional_id]) {
                professionalBills[client.professional_id] = {
                    total_owed: 0,
                    total_deposit: 0
                };
            }

            professionalBills[client.professional_id].total_owed += remainingBalance;
            professionalBills[client.professional_id].total_deposit += depositPaid;
        }

        // billing_cycles tablosuna toplu insert
        const billingInserts = [];
        for (const ptId in professionalBills) {
            // Eğer o ay için 0 borcu varsa (yani hep 300 TL altı 10% danışanlara bakmışsa, paid işaretle)
            const owed = professionalBills[ptId].total_owed;
            const status = owed > 0 ? 'pending' : 'paid';

            billingInserts.push({
                professional_id: ptId,
                month_year: currentMonthYear,
                total_commission_owed: owed,
                total_deposit_paid: professionalBills[ptId].total_deposit,
                status: status
            });
        }

        if (billingInserts.length > 0) {
            const { error: insertError } = await supabaseClient
                .from('billing_cycles')
                .insert(billingInserts);

            if (insertError) throw new Error("Failed to bulk insert billing: " + insertError.message);
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
