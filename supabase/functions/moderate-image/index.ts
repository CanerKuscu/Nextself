// Follow this setup guide to integrate the Edge Function:
// https://supabase.com/docs/guides/functions
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
        const payload = await req.json();

        const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
        const sightengineUser = Deno.env.get("SIGHTENGINE_API_USER") as string;
        const sightengineSecret = Deno.env.get("SIGHTENGINE_API_SECRET") as string;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase credentials in Edge Function environment.");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // ─── Flow A: Direct client-side invocation (base64 image check) ───
        if (payload.image && payload.checkType) {
            const authHeader = req.headers.get('Authorization') || '';
            const accessToken = authHeader.replace('Bearer ', '').trim();

            if (!accessToken) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized: missing access token' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
                );
            }

            const { data: userAuth, error: authError } = await supabase.auth.getUser(accessToken);
            if (authError || !userAuth?.user) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized: invalid or expired token' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
                );
            }
            if (!sightengineUser || !sightengineSecret) {
                // Without Sightengine credentials, return cautious approval
                return new Response(JSON.stringify({
                    isNSFW: false,
                    confidence: 0.5,
                    reason: 'Moderation API not configured',
                    flags: ['no_api_configured'],
                }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
            }

            // Use Sightengine raw base64 endpoint
            const formData = new FormData();
            formData.append('models', 'nudity-2.0,gore,offensive');
            formData.append('api_user', sightengineUser);
            formData.append('api_secret', sightengineSecret);
            // Sightengine accepts base64 via the 'media' parameter as data URI
            formData.append('media', `data:image/jpeg;base64,${payload.image}`);

            const modRes = await fetch('https://api.sightengine.com/1.0/check.json', {
                method: 'POST',
                body: formData,
            });
            const modData = await modRes.json();

            if (modData.status !== 'success') {
                return new Response(JSON.stringify({
                    isNSFW: false,
                    confidence: 0.3,
                    reason: 'Moderation API returned error',
                    flags: ['api_error'],
                }), { headers: { "Content-Type": "application/json" }, status: 200 });
            }

            const isNSFW =
                (modData.nudity && modData.nudity.none < 0.5) ||
                (modData.gore && modData.gore.prob > 0.5) ||
                (modData.offensive && modData.offensive.prob > 0.5);

            const flags: string[] = [];
            if (modData.nudity && modData.nudity.none < 0.5) flags.push('nudity_detected');
            if (modData.gore && modData.gore.prob > 0.5) flags.push('gore_detected');
            if (modData.offensive && modData.offensive.prob > 0.5) flags.push('offensive_detected');

            return new Response(JSON.stringify({
                isNSFW,
                confidence: isNSFW
                    ? Math.max(1 - (modData.nudity?.none || 0), modData.gore?.prob || 0, modData.offensive?.prob || 0)
                    : modData.nudity?.none || 0.9,
                reason: isNSFW ? 'Image contains inappropriate content (+18)' : undefined,
                flags,
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
        }

        // ─── Flow B: DB webhook trigger (storage.objects insert) ───
        const WebhookSecret = Deno.env.get('WEBHOOK_SECRET');
        const authHeader = req.headers.get('Authorization') || '';
        
        // 1. Lightweight Webhook Secret Validation
        if (WebhookSecret && authHeader !== `Bearer ${WebhookSecret}`) {
            console.warn("[SECURITY] Webhook blocked: Missing or invalid Authorization secret.");
            return new Response("Unauthorized webhook", { status: 401, headers: corsHeaders });
        }

        const payloadRecord = payload.record;
        
        // 2. Strict ID validation
        if (!payloadRecord || !payloadRecord.id || typeof payloadRecord.id !== 'string') {
            console.warn("[SECURITY] Webhook blocked: Malformed payload missing valid record ID.");
            return new Response("Invalid webhook payload", { status: 400, headers: corsHeaders });
        }

        // 3. Fetch-Back: Retrieve verified state from the database
        const { data: dbRecord, error: fetchError } = await supabase
            .schema('storage')
            .from('objects')
            .select('name, owner, bucket_id')
            .eq('id', payloadRecord.id)
            .single();

        if (fetchError || !dbRecord) {
            console.info(`[WEBHOOK] Record not found for ID ${payloadRecord.id}. Likely deleted or invalid.`);
            return new Response("Record not found", { status: 200, headers: corsHeaders });
        }

        if (dbRecord.bucket_id !== "avatars") {
            return new Response("Not an avatar upload", { status: 200, headers: corsHeaders });
        }

        const { name: filePath, owner } = dbRecord;

        if (!sightengineUser || !sightengineSecret) {
            return new Response("Missing moderation API credentials, allowed by default", { status: 200, headers: corsHeaders });
        }

        // Get public URL of the uploaded image
        const { data: { publicUrl } } = supabase
            .storage
            .from("avatars")
            .getPublicUrl(filePath);

        // Call Sightengine moderation API
        const moderationApiUrl = `https://api.sightengine.com/1.0/check.json?models=nudity-2.0,gore,offensive&api_user=${sightengineUser}&api_secret=${sightengineSecret}&url=${encodeURIComponent(publicUrl)}`;

        const modRes = await fetch(moderationApiUrl);
        const modData = await modRes.json();

        if (modData.status !== "success") {
            console.error("Moderation API failed:", modData);
            return new Response("Moderation check failed", { status: 200 });
        }

        // Determine if image is NSFW
        const isNSFW =
            (modData.nudity && modData.nudity.none < 0.5) ||
            (modData.gore && modData.gore.prob > 0.5) ||
            (modData.offensive && modData.offensive.prob > 0.5);

        if (isNSFW) {
            console.log(`NSFW detected for user ${owner}. Deleting image ${filePath}`);

            // Delete the NSFW image from storage
            await supabase.storage.from("avatars").remove([filePath]);

            // Reset avatar_url in profile
            if (owner) {
                await supabase
                    .from('profiles')
                    .update({ avatar_url: null })
                    .eq('id', owner);
            }

            // Increment violation count and potentially ban user
            if (owner) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('content_violation_count')
                    .eq('id', owner)
                    .single();

                const newCount = (profile?.content_violation_count || 0) + 1;

                const updateData: Record<string, any> = {
                    content_violation_count: newCount,
                };

                if (newCount >= 6) {
                    // Permanent ban after 6 violations
                    updateData.is_banned = true;
                    updateData.ban_reason = 'Permanent ban: Repeated NSFW/+18 content uploads';
                    updateData.ban_expires_at = null;
                } else if (newCount >= 3) {
                    // Temporary 7-day ban after 3 violations
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 7);
                    updateData.is_banned = true;
                    updateData.ban_reason = `Temporary ban: ${newCount} NSFW/+18 content violations`;
                    updateData.ban_expires_at = expiresAt.toISOString();
                }

                await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', owner);

                // Log the violation
                await supabase.from('content_violations').insert({
                    user_id: owner,
                    violation_type: 'nsfw_profile_photo',
                    details: `NSFW image detected and removed: ${filePath}`,
                }).catch(() => { });
            }
        }

        return new Response(JSON.stringify({ moderated: true, isNSFW }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: unknown) {
        const err = error as Error;
        console.error("Error in moderation webhook:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
