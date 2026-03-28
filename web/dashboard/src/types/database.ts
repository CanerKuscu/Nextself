export interface Profile {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  user_type?: 'pt' | 'dietitian' | 'admin' | 'client';
  assigned_professional_id?: string;
  weight?: number;
  height?: number;
  created_at: string;
  updated_at?: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  calories_burned: number;
  status: 'completed' | 'in_progress' | 'missed' | string;
  user?: Profile | Profile[];
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  user?: Profile | Profile[];
}

export interface HealthData {
  id: string;
  user_id: string;
  date: string;
  timestamp: string;
  steps: number;
  heart_rate: number;
  sleep_hours: number;
  calories_burned: number;
  user?: Profile | Profile[];
}

export interface ProfessionalCourse {
  id: string;
  professional_id: string;
  title: string;
  description?: string;
  created_at: string;
}

export interface Session {
  id: string;
  professional_id: string;
  sessions_client_id_fkey: string;
  start_time: string;
  end_time?: string;
  client?: Profile;
}

export interface ProfessionalSettings {
  id: string;
  user_id: string;
  preferences: Record<string, any>;
}

export interface DailyStats {
  date: string;
  workouts: number;
  caloriesBurned: number;
  workoutDuration: number;
  nutritionCalories: number;
  newUsers: number;
}
