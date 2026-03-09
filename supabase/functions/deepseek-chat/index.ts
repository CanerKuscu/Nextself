// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
        if (!DEEPSEEK_API_KEY) {
            throw new Error("Missing DEEPSEEK_API_KEY in Edge Function secrets");
        }

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase configuration missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
        }

        const authHeader = req.headers.get('Authorization') || '';
        const accessToken = authHeader.replace('Bearer ', '').trim();

        if (!accessToken) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: missing access token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: authData, error: authError } = await supabaseClient.auth.getUser(accessToken);

        if (authError || !authData?.user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: invalid or expired token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const payload = await req.json();
        let finalPrompt = payload.prompt || '';

        // Security Enhancement: Construct the prompt on the server-side to prevent prompt injection and hiding proprietary prompts
        if (payload.type === 'program' && payload.programData) {
            const { programType, goal, experience, days, profile, language } = payload.programData;
            finalPrompt = `Create a detailed ${programType} for a ${experience} level person whose goal is ${goal}. 
They want to train ${days} days per week.
${profile?.height ? `Height: ${profile.height} cm` : ''}
${profile?.weight ? `Weight: ${profile.weight} kg` : ''}
${profile?.gender ? `Gender: ${profile.gender}` : ''}
${profile?.age ? `Age: ${profile.age}` : ''}

Please respond in ${language}. Format the program clearly with days, exercises/meals, sets/reps/portions, and rest periods.
${programType?.toLowerCase().includes('workout') || programType?.toLowerCase().includes('antrenman') ? 'Include warm-up, main workout, and cool-down for each day.' : ''}
${programType?.toLowerCase().includes('nutrition') || programType?.toLowerCase().includes('beslenme') ? 'Include breakfast, lunch, dinner, and 2 snacks with calorie counts and macros.' : ''}
${programType?.toLowerCase().includes('supplement') || programType?.toLowerCase().includes('takviye') ? 'Include timing (morning/pre-workout/post-workout/night), dosage, and benefits for each supplement.' : ''}
${programType?.toLowerCase().includes('water') || programType?.toLowerCase().includes('su') ? 'Include hourly water intake schedule, total daily goal, and tips for staying hydrated during workouts.' : ''}
Keep it practical and actionable.`;
        }

        // Prevent empty prompts
        if (!finalPrompt || finalPrompt.trim().length === 0) {
            throw new Error("Missing prompt logic for this request type.");
        }

        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: finalPrompt }],
                temperature: 0.7,
                max_tokens: 1024,
            })
        });

        const data = await response.json();

        // Check if the API returned an error
        if (data.error) {
            throw new Error(`DeepSeek API error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        // Safely access the response
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(`Unexpected API response format: ${JSON.stringify(data).substring(0, 200)}`);
        }

        const reply = data.choices[0].message.content;

        return new Response(JSON.stringify({ response: reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error('Edge function error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
