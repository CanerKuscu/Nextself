import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const configuredOrigins = (Deno.env.get('EDGE_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

type KinematicFrame = { timestamp?: number; landmarks?: unknown };
type KinematicReport = { frames_data?: KinematicFrame[]; exercise_name?: string };
type UserProfile = { height?: number; weight?: number; goals?: string };
type HealthData = { sleepHours?: number; steps?: number; restingHeartRate?: number; weight?: number };

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
        return new Response(
            JSON.stringify({ error: 'Forbidden origin' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }

    try {
        const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
        if (!DEEPSEEK_API_KEY) {
            throw new Error("Missing DEEPSEEK_API_KEY in Edge Function secrets");
        }

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration missing (SUPABASE_URL or SUPABASE_ANON_KEY)');
        }

        const authHeader = req.headers.get('Authorization') || '';
        const accessToken = authHeader.replace('Bearer ', '').trim();

        if (!accessToken) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: missing access token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: authData, error: authError } = await supabaseClient.auth.getUser(accessToken);

        if (authError || !authData?.user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: invalid or expired token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const payload = await req.json() as { type?: string; data?: Record<string, unknown> };
        const type = payload.type;
        const inputData = payload.data ?? {};

        if (!type || !inputData || typeof inputData !== 'object') {
            throw new Error('Invalid payload: type and data are required');
        }
        
        // Language handling: default to English, but support all languages as requested.
        const language = typeof inputData.language === 'string' ? inputData.language : 'auto';
        const langName = language === 'tr' ? 'Turkish' : (language === 'en' ? 'English' : language);
        const langInstruction = language === 'auto'
            ? 'You MUST detect the user language from the latest user message and reply in that same language. You MUST understand all languages.'
            : `You MUST reply in ${langName}. You MUST understand all languages.`;
        
        // Base Persona & Constraints
        const basePersona = `You are a friendly, "soulmate-like" (can dostu) AI assistant. You are warm, encouraging, and supportive.`;
        const domainRules = `
IMPORTANT RULES:
1. You are STRICTLY limited to your domain: Fitness, Health, Nutrition, and Wellness.
2. If the user asks about off-topic subjects (e.g., History, Mathematics, Politics, General Knowledge, Coding, etc.), you MUST politely refuse and warn the user that you only answer questions in your field.
   - Example Refusal (in user's language): "I'd love to chat, but I can only help you with fitness and health topics! Let's get back to your goals."
3. EXCEPTIONS: You MAY answer standard greetings and social pleasantries (e.g., "Hello", "How are you", "Good morning") politely and warmly, then steer the conversation back to fitness/health.
`;
        const coachRoleRules = `
ROLE BOUNDARY FOR AI PT:
- You ONLY handle training, exercise, recovery, mobility, posture, and workout programming.
- If user asks for recipes, cooking, software, finance, politics, history, or other non-training topics, politely refuse and redirect to workout goals.
- You CAN create workout programs when requested.
`;
        const dietitianRoleRules = `
ROLE BOUNDARY FOR AI DIETITIAN:
- You ONLY handle nutrition, meal planning, macros, calories, and diet programming.
- You MUST refuse coding, finance, politics, history, and detailed workout technique coaching.
- You CAN create weekly/monthly nutrition programs when requested.
`;
        const chefRoleRules = `
ROLE BOUNDARY FOR AI CHEF:
- You ONLY handle healthy food suggestions, recipe creation, meal-prep strategy, and cooking guidance.
- You MUST refuse software, finance, politics, history, and non-food topics.
- You MUST provide structured cooking steps.
- You CAN create recipe programs aligned with user goals.
`;

        let systemPrompt = `${basePersona} ${langInstruction} ${domainRules}`;
        let userPrompt = "";
        let kinematicFrames: KinematicFrame[] = [];
        
        // Strict Prompt Engineering on Server Side
        switch (type) {
            case 'coach':
                systemPrompt = `${basePersona} You are strictly a Fitness AI Coach. ${langInstruction} ${domainRules} ${coachRoleRules}`;
                
                if (inputData.query) {
                    // Chat Mode
                    userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}\n\nIf the user requests a workout program, return a practical day-by-day plan with sets, reps, and progression.`;
                } else {
                    // Vision Analysis Mode
                    userPrompt = `As an expert fitness coach, analyze this physique photo. Goals: ${inputData.userGoals}. Provide: 1) Overall assessment 2) Strengths 3) Areas for improvement 4) Training recommendations. Be encouraging but realistic. Reply in ${language === 'auto' ? 'the user language' : langName}.`;
                }
                break;
            
            case 'dietitian':
                systemPrompt = `${basePersona} You are strictly a Dietitian AI. ${langInstruction} ${domainRules} ${dietitianRoleRules}`;
                
                if (inputData.query) {
                     // Chat Mode
                     userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}\n\nIf the user requests a program, provide a practical weekly nutrition program with meals, portions, and macros.`;
                } else {
                     const userProfile = (inputData.userProfile ?? {}) as UserProfile;
                     // Plan Generation Mode
                     userPrompt = `Create a personalized 7-day meal plan. User: Height ${userProfile.height}cm, Weight ${userProfile.weight}kg, Goals: ${userProfile.goals}. Preferences: ${inputData.dietaryPreferences}. Target: ${inputData.calorieTarget} calories/day. Include macros for each meal. Reply in ${language === 'auto' ? 'the user language' : langName}.`;
                }
                break;
            
            case 'chef':
                systemPrompt = `${basePersona} You are strictly a Chef AI focused on healthy eating. ${langInstruction} ${domainRules} ${chefRoleRules}`;
                
                if (inputData.query) {
                    // Chat Mode
                    userPrompt = `Context: ${JSON.stringify(inputData.context || {})}\n\nUser Question: ${inputData.query}\n\nYou MUST format your answer with these sections:
1) Goal-based food recommendation
2) Recipe with ingredients and step-by-step instructions
3) At least 2 relevant YouTube links (use valid https://www.youtube.com/results?search_query=... URLs if needed)
4) Practical tips to apply the recipe`;
                } else if (inputData.ingredients) {
                    // Recipe Generation Mode (from AIService)
                    userPrompt = `Generate a healthy recipe. Ingredients: ${JSON.stringify(inputData.ingredients)}. Diet: ${inputData.dietPreference || 'None'}. Context: ${inputData.context || ''}. Return ONLY valid JSON with structure: {"title":"...","prepTime":10,"cookTime":15,"calories":450,"macros":{"p":45,"c":20,"f":15},"ingredients":["..."],"instructions":["..."],"difficulty":"easy|medium|hard"}. Content must be in ${language === 'auto' ? 'the user language' : langName}.`;
                } else {
                    // Standard Recipe Suggestion Mode
                    userPrompt = `Provide 5 healthy recipes: ~${inputData.calories} cal/serving, ~${inputData.protein}g protein. Cuisine: ${inputData.cuisineType}. Restrictions: ${inputData.restrictions}. Include ingredients, steps, nutritional info, prep time. Reply in ${language === 'auto' ? 'the user language' : langName}.`;
                }
                break;

            case 'insight':
                systemPrompt = `${basePersona} You are strictly a Health AI. ${langInstruction} ${domainRules}`;
                {
                    const healthData = (inputData.healthData ?? {}) as HealthData;
                    userPrompt = `Analyze health data: Sleep ${healthData.sleepHours}h, Steps ${healthData.steps}, Heart Rate ${healthData.restingHeartRate}bpm, Weight ${healthData.weight}kg. Provide insights and recommendations. Reply in ${langName}.`;
                }
                break;

            case 'food_scan':
                 systemPrompt = `${basePersona} You are strictly a Nutrition AI. ${langInstruction} ${domainRules}`;
                 userPrompt = `Analyze this food: "${inputData.description}". Return JSON: { "name": "...", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "serving_size": "100g" }. Name must be in ${langName}.`;
                 break;

            case 'posture':
                systemPrompt = `${basePersona} You are a Kinematic Movement Analyst specialized in biomechanics. ${langInstruction} ${domainRules}`;
                {
                    const kinematicReport = inputData.kinematicReport as KinematicReport | undefined;
                    kinematicFrames = Array.isArray(kinematicReport?.frames_data)
                    ? (kinematicReport?.frames_data ?? [])
                        .filter((frame) => Boolean(frame?.landmarks))
                        .slice(0, 140)
                    : [];
                    const selectedExercise = inputData.selectedExercise;
                    const exerciseName = inputData.exerciseName;
                    const supportedExercises = inputData.supportedExercises;
                    const cameraHint = inputData.cameraHint;
                    const qualityHint = inputData.qualityHint;
                userPrompt = `ROLE: Senior Biomechanical Engineer and Professional Athletic Coach.
OBJECTIVE: Perform kinetic chain analysis with mathematical precision using only provided time-series coordinates and angles.

Exercise selected by user: ${selectedExercise || exerciseName || kinematicReport?.exercise_name || 'unknown'}
Supported exercises: ${JSON.stringify(supportedExercises || ['squat', 'deadlift', 'lunge', 'pushup'])}
Camera note: ${cameraHint || 'unknown'}
Input quality note: ${qualityHint || 'not provided'}

KinematicReport:
${JSON.stringify({
                    exercise_name: kinematicReport?.exercise_name || exerciseName || 'unknown',
                    frames_data: kinematicFrames,
                })}

Return JSON only with this exact key structure:
{
  "DetectedExercise": "string",
  "FormScore": "number",
  "BiomechanicalMetrics": {
    "SymmetryScore": "number",
    "StabilityIndex": "Stable|Wobbly|Critical",
    "RangeOfMotion": "Full|Partial|Limited"
  },
  "CriticalFlaws": [
    {"flaw": "string", "timestamp": "number", "severity": "High|Medium"}
  ],
  "PhaseFeedback": {
    "Eccentric": string,
    "Apex": string,
    "Concentric": string
  },
  "CorrectionCues": string[],
  "SafetyWarning": {
    "isWarning": boolean,
    "reason": string
  }
}

Analysis requirements:
1) Dynamic Phase Segmentation:
- Identify Apex timestamp precisely from angles and timestamps.
- Compare Eccentric vs Concentric speed and flag uncontrolled rapid descent.
2) Anatomical Alignment Check:
- Compute left vs right angle variance; if variance > 10% flag asymmetry.
- Evaluate ankle and hip landmark lateral wobble from x-axis variance.
- Squat rule: if knee flexion depth is insufficient relative to hip depth, flag ROM issue.
- Squat rule: trunk/back angle should generally remain in 20-45 degree range, otherwise flag.
- Deadlift rule: use spine_curvature_index if available; else infer from hip height and knee extension relationship.
3) Scoring logic:
- 90-100 professional form
- 70-89 good with minor inefficiencies
- 50-69 needs correction and overuse risk
- below 50 high injury risk

Rules:
- Base analysis strictly on provided data.
- Do not include chain-of-thought.
- Keep correction cues short and verbal.
- Never include markdown or extra text outside JSON.`;
                }
                break;

            case 'missions':
                systemPrompt = "You are a gamification engine.";
                if (inputData.mode === 'daily') {
                    const dateValue = typeof inputData.date === 'string' || typeof inputData.date === 'number'
                        ? inputData.date
                        : new Date().toISOString().slice(0, 10);
                    const dayName = new Date(dateValue).toLocaleDateString('en', { weekday: 'long' });
                    userPrompt = `Generate 3 daily missions for today (${dayName}, ${dateValue}).
USER: ${inputData.userInfo || 'Standard user'}.
Rules:
- One workout task, one nutrition task, one health/wellness task
- Each must be completable TODAY
- Make them fun and specific
- Output MUST be ONLY a valid JSON array, no other text.
Format: [{"title":"English title","title_tr":"Turkish title","category":"workout|nutrition|health|mindfulness|hydration|supplements","target_value":1,"xp_reward":30,"point_reward":15}]`;
                } else {
                    // Weekly
                    userPrompt = `Generate 5 unique, PERSONALIZED weekly missions for this user.
USER INFO: Level=${inputData.userLevel}. ${inputData.userContext || 'No extra data.'}
WEEK: ${inputData.weekStart} to ${inputData.weekEnd}
Rules:
- Missions must be VARIED across categories
- Difficulty should match user level (${inputData.userLevel})
- Each mission must be achievable within 7 days
- Output MUST be ONLY a valid JSON array, no other text.
Format: [{"title":"English title","title_tr":"Turkish title","description":"Brief description","description_tr":"Brief description tr","category":"workout|nutrition|health|social|streak|mindfulness|hydration|supplements","target_value":3,"xp_reward":100,"point_reward":50}]`;
                }
                break;
            
            case 'program': {
                 const { programType, goal, experience, days, profile, details, customRules, language: progLang } = inputData as {
                    programType?: string;
                    goal?: string;
                    experience?: string;
                    days?: number;
                    profile?: { height?: number; weight?: number; gender?: string; age?: number };
                    details?: unknown;
                    customRules?: string;
                    language?: string;
                 };
                 systemPrompt = `${basePersona} You are an expert fitness program creator. ${domainRules}`;
                 userPrompt = `Create a detailed ${programType} for a ${experience} level person whose goal is ${goal}. 
They want to train ${days} days per week.
${profile?.height ? `Height: ${profile.height} cm` : ''}
${profile?.weight ? `Weight: ${profile.weight} kg` : ''}
${profile?.gender ? `Gender: ${profile.gender}` : ''}
${profile?.age ? `Age: ${profile.age}` : ''}
${details ? `Program details: ${JSON.stringify(details)}` : ''}
${customRules ? `Special rules: ${customRules}` : ''}

Please respond in ${progLang || langName}. Format the program clearly with days, exercises/meals, sets/reps/portions, and rest periods.
${programType?.toLowerCase().includes('workout') || programType?.toLowerCase().includes('antrenman') ? 'Include warm-up, main workout, and cool-down for each day.' : ''}
${programType?.toLowerCase().includes('nutrition') || programType?.toLowerCase().includes('beslenme') ? 'Include breakfast, lunch, dinner, and 2 snacks with calorie counts and macros.' : ''}
${programType?.toLowerCase().includes('supplement') || programType?.toLowerCase().includes('takviye') ? 'Include timing (morning/pre-workout/post-workout/night), dosage, and benefits for each supplement.' : ''}
${programType?.toLowerCase().includes('water') || programType?.toLowerCase().includes('su') ? 'Include hourly water intake schedule, total daily goal, and tips for staying hydrated during workouts.' : ''}
Keep it practical and actionable.`;
                 break;
            }

            default:
                throw new Error(`Invalid or missing request type: ${type}`);
        }

        if (!userPrompt || userPrompt.trim().length === 0) {
            throw new Error("Prompt generation failed.");
        }

        const frameSummary = kinematicFrames.length > 0
            ? kinematicFrames.slice(0, 20).map((frame, index) => `Frame ${index + 1}: ${Math.round((Number(frame.timestamp) || 0) / 100) / 10}s`).join(', ')
            : '';
        const textOnlyPrompt = kinematicFrames.length > 0
            ? `${userPrompt}\nVideo duration: ${Math.round((Number(inputData.durationMs) || 0) / 100) / 10}s\nFrame timeline: ${frameSummary}`
            : userPrompt;

        const buildMessages = () => {
            return [
                { role: "system", content: systemPrompt },
                { role: "user", content: textOnlyPrompt },
            ];
        };

        const invokeDeepSeek = async () => {
            const response = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: buildMessages(),
                    temperature: 0.7,
                    max_tokens: 1024,
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(`DeepSeek API error: ${data.error.message || JSON.stringify(data.error)}`);
            }
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error(`Unexpected API response format: ${JSON.stringify(data).substring(0, 200)}`);
            }
            return data;
        };

        const data = await invokeDeepSeek();

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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        console.error('Edge function error:', message);
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
