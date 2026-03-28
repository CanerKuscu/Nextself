import { SupabaseService } from '@nextself/shared';
import { DeepSeekService } from './deepseek';

export interface WeeklyUserMetrics {
  weightKg: number | null;
  bodyFatPercent: number | null;
}

export interface WeeklyUserContext {
  userId: string;
  weekStartIso: string;
  weekEndIso: string;
  workoutAdherencePercent: number;
  nutritionAdherencePercent: number;
  streakDays: number;
  metrics: WeeklyUserMetrics;
}

export interface AdaptivePlanResponse {
  coachMessage: string;
  adjustedCalorieTarget: number | null;
  workoutAdjustments: string;
  flagsForHumanCoach: string[];
}

type UnknownRow = Record<string, unknown>;

export class AIAutopilotService {
  private static instance: AIAutopilotService;

  private constructor() {}

  public static getInstance(): AIAutopilotService {
    if (!AIAutopilotService.instance) {
      AIAutopilotService.instance = new AIAutopilotService();
    }
    return AIAutopilotService.instance;
  }

  public async gatherUserWeeklyContext(userId: string): Promise<WeeklyUserContext> {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const [metrics, workoutAdherencePercent, nutritionAdherencePercent, streakDays] = await Promise.all([
      this.fetchWeeklyMetrics(userId),
      this.fetchWeeklyAdherenceValue(userId, 'workout_adherence_percent', 'workoutAdherence'),
      this.fetchWeeklyAdherenceValue(userId, 'nutrition_adherence_percent', 'nutritionAdherence'),
      this.fetchStreakDays(userId),
    ]);

    return {
      userId,
      weekStartIso: weekStart.toISOString(),
      weekEndIso: weekEnd.toISOString(),
      workoutAdherencePercent,
      nutritionAdherencePercent,
      streakDays,
      metrics,
    };
  }

  public async generateAdaptivePlan(userId: string): Promise<AdaptivePlanResponse> {
    const context = await this.gatherUserWeeklyContext(userId);
    const prompt = this.buildPrompt(context);
    const raw = await DeepSeekService.getInstance().generateContent('coach', {
      query: prompt,
      context: {
        weekStartIso: context.weekStartIso,
        weekEndIso: context.weekEndIso,
        workoutAdherencePercent: context.workoutAdherencePercent,
        nutritionAdherencePercent: context.nutritionAdherencePercent,
        streakDays: context.streakDays,
        metrics: context.metrics,
      },
      language: 'en',
    });

    const parsed = this.parseAdaptivePlanResponse(raw);
    if (parsed) {
      return parsed;
    }
    return this.buildFallbackAdaptivePlan(context);
  }

  private buildPrompt(context: WeeklyUserContext): string {
    return [
      'You are a Master Coach + Clinical Dietitian for a fitness app.',
      'Review the weekly context and produce adaptive weekly plan guidance.',
      'Return ONLY strict JSON. No markdown, no prose outside JSON.',
      'Required schema:',
      '{',
      '  "coachMessage": string,',
      '  "adjustedCalorieTarget": number | null,',
      '  "workoutAdjustments": string,',
      '  "flagsForHumanCoach": string[]',
      '}',
      'Rules:',
      '- coachMessage must be empathetic, specific, and actionable.',
      '- workoutAdjustments must be one concise instruction for this week.',
      '- flagsForHumanCoach should be empty when no escalation is needed.',
      '- if adherence is low for both nutrition and workouts, include a recovery-focused adjustment.',
      '- do not invent medical diagnoses.',
      `WeeklyContext: ${JSON.stringify({
        weekStartIso: context.weekStartIso,
        weekEndIso: context.weekEndIso,
        workoutAdherencePercent: context.workoutAdherencePercent,
        nutritionAdherencePercent: context.nutritionAdherencePercent,
        streakDays: context.streakDays,
        metrics: context.metrics,
      })}`,
    ].join('\n');
  }

  private parseAdaptivePlanResponse(raw: string): AdaptivePlanResponse | null {
    const jsonText = this.extractJson(raw);
    if (!jsonText) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return null;
    }
    if (!this.isAdaptivePlanResponse(parsed)) return null;
    return {
      coachMessage: parsed.coachMessage.trim(),
      adjustedCalorieTarget: parsed.adjustedCalorieTarget,
      workoutAdjustments: parsed.workoutAdjustments.trim(),
      flagsForHumanCoach: parsed.flagsForHumanCoach.map((flag) => flag.trim()).filter((flag) => flag.length > 0),
    };
  }

  private extractJson(raw: string): string | null {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start < 0 || end < 0 || end <= start) return null;
    return trimmed.slice(start, end + 1);
  }

  private isAdaptivePlanResponse(value: unknown): value is AdaptivePlanResponse {
    if (!value || typeof value !== 'object') return false;
    const row = value as Record<string, unknown>;
    const message = row.coachMessage;
    const calories = row.adjustedCalorieTarget;
    const workout = row.workoutAdjustments;
    const flags = row.flagsForHumanCoach;
    const caloriesOk = calories === null || (typeof calories === 'number' && Number.isFinite(calories));
    const flagsOk = Array.isArray(flags) && flags.every((item) => typeof item === 'string');
    return typeof message === 'string' && typeof workout === 'string' && caloriesOk && flagsOk;
  }

  private async fetchWeeklyMetrics(userId: string): Promise<WeeklyUserMetrics> {
    const client = SupabaseService.getInstance().getClient();
    const { data } = await client
      .from('profiles')
      .select('weight,weight_kg,body_fat,body_fat_percent')
      .eq('id', userId)
      .maybeSingle<UnknownRow>();
    const weightKg = this.firstNumber(data, ['weight_kg', 'weight']);
    const bodyFatPercent = this.firstNumber(data, ['body_fat_percent', 'body_fat']);
    return { weightKg, bodyFatPercent };
  }

  private async fetchWeeklyAdherenceValue(
    userId: string,
    primaryColumn: string,
    fallbackColumn: string
  ): Promise<number> {
    const client = SupabaseService.getInstance().getClient();
    const { data } = await client
      .from('weekly_progress')
      .select(`${primaryColumn},${fallbackColumn}`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<UnknownRow>();
    const value = this.firstNumber(data, [primaryColumn, fallbackColumn]);
    if (value !== null) return this.clampPercent(value);
    return 0; // Return 0 instead of mock data
  }

  private async fetchStreakDays(userId: string): Promise<number> {
    const client = SupabaseService.getInstance().getClient();
    const { data } = await client
      .from('user_streaks')
      .select('streak_days,current_streak')
      .eq('user_id', userId)
      .maybeSingle<UnknownRow>();
    const streak = this.firstNumber(data, ['streak_days', 'current_streak']);
    if (streak !== null) return Math.max(0, Math.round(streak));
    return 0; // Return 0 instead of mock data
  }

  private firstNumber(row: UnknownRow | null, keys: string[]): number | null {
    if (!row) return null;
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return null;
  }

  private clampPercent(input: number): number {
    if (!Number.isFinite(input)) return 0;
    return Math.min(100, Math.max(0, Math.round(input)));
  }

  private buildFallbackAdaptivePlan(context: WeeklyUserContext): AdaptivePlanResponse {
    const lowAdherence = context.workoutAdherencePercent < 60 && context.nutritionAdherencePercent < 60;
    const workoutAdjustments = lowAdherence
      ? 'Reduce workout volume by 10% this week and prioritize consistency over intensity.'
      : 'Keep volume stable and add one focused progression set to major lifts this week.';
    const flagsForHumanCoach: string[] = [];
    if (context.streakDays <= 2) flagsForHumanCoach.push('Low consistency streak detected; evaluate motivation barriers.');
    if (context.metrics.bodyFatPercent !== null && context.metrics.bodyFatPercent > 35) flagsForHumanCoach.push('Body fat trend requires professional review for nutrition adherence strategy.');
    return {
      coachMessage:
        'You are making progress by staying engaged this week. We will use a small, sustainable adjustment to improve adherence and protect recovery.',
      adjustedCalorieTarget: lowAdherence ? null : null,
      workoutAdjustments,
      flagsForHumanCoach,
    };
  }
}

export const aiAutopilotService = AIAutopilotService.getInstance();
