import { supabase } from './client';
import { AuthService } from './auth';
import { UserService } from './users';
import { WorkoutService } from './workouts';
import { NutritionService } from './nutrition';
import { AnalyticsService } from './analytics';
import { MiscService } from './misc';

export { supabase } from './client';

// Keep the unified exports for backward compatibility during incremental refactor
export const auth = AuthService;

export const db = {
    ...UserService,
    ...WorkoutService,
    ...NutritionService,
    ...AnalyticsService,
    ...MiscService,
};
