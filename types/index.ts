export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  isEmailVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  goals: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryPreferences: string;
  dietaryRestrictions: string;
  personalTrainerId?: string;
  dietitianId?: string;
  dataSharingPermissions: DataSharingPermissions;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataSharingPermissions {
  shareWorkoutData: boolean;
  shareNutritionData: boolean;
  shareHealthMetrics: boolean;
  shareProgressPhotos: boolean;
  shareBodyMeasurements: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: 'weight_training' | 'cardio' | 'calisthenics';
  muscleGroup: string;
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  isTimed: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  sodium: number;
  isVerified: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  exercises: WorkoutExercise[];
  startTime: string;
  endTime?: string;
  duration?: number;
  caloriesBurned?: number;
  notes?: string;
  createdAt: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: ExerciseSet[];
  restTime?: number;
}

export interface ExerciseSet {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completedAt: string;
}

export interface NutritionEntry {
  id: string;
  userId: string;
  foodItems: NutritionFoodItem[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  loggedAt: string;
  createdAt: string;
}

export interface NutritionFoodItem {
  foodItemId: string;
  quantity: number;
  unit: string;
}

export interface HealthMetrics {
  userId: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
  restingHeartRate: number;
  avgHeartRate: number;
  weight: number;
  stressLevel: number;
  source: 'apple_health' | 'google_health';
  createdAt: string;
}

export interface PersonalTrainer {
  id: string;
  userId: string;
  certification: string;
  specialties: string[];
  experience: number;
  commissionRate: number;
  isVerified: boolean;
  createdAt: string;
}

export interface Dietitian {
  id: string;
  userId: string;
  license: string;
  specialties: string[];
  experience: number;
  commissionRate: number;
  isVerified: boolean;
  createdAt: string;
}

export interface ClientRelationship {
  id: string;
  clientId: string;
  trainerId?: string;
  dietitianId?: string;
  status: 'pending' | 'active' | 'ended';
  startDate: string;
  endDate?: string;
  commissionPaid: boolean;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  userId: string;
  type: 'physique_analysis' | 'meal_plan' | 'recipe' | 'health_insight';
  content: string;
  metadata: unknown; // Replaced 'any' with 'unknown' for type safety
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'insight' | 'achievement' | 'system';
  isRead: boolean;
  scheduledFor?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  type: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  features: string[];
  createdAt: string;
}

// League / Ranking System
export interface LeagueTier {
  id: number;
  name: string;
  nameTr: string;
  icon: string;
  color: string;
  minXp: number;
}

export interface UserLeague {
  userId: string;
  leagueId: number;
  currentXp: number;
  weeklyXp: number;
  rank?: number;
  groupId?: string;
}

export interface LeagueGroup {
  id: string;
  leagueId: number;
  weekStart: string;
  weekEnd: string;
  members: LeagueGroupMember[];
}

export interface LeagueGroupMember {
  userId: string;
  username: string;
  weeklyXp: number;
  rank: number;
  avatarUrl?: string;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  source: 'workout' | 'nutrition' | 'mission' | 'streak' | 'bonus' | 'store';
  description?: string;
  createdAt: string;
}

// In-App Store
export interface StoreItem {
  id: string;
  name: string;
  nameTr: string;
  description: string;
  descriptionTr: string;
  icon: string;
  category: 'booster' | 'utility' | 'cosmetic';
  pricePoints: number;
  priceGems?: number;
  effectType?: string;
  effectValue?: number;
  effectDurationMinutes?: number;
  maxStack: number;
  isActive: boolean;
}

export interface UserInventoryItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  isActive: boolean;
  activatedAt?: string;
  expiresAt?: string;
}

export interface UserCurrency {
  points: number;
  gems: number;
  totalEarnedPoints: number;
  totalSpentPoints: number;
}

// AI Missions
export interface WeeklyMission {
  id: string;
  userId: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  category: 'workout' | 'nutrition' | 'wellness' | 'social';
  targetValue: number;
  currentProgress: number;
  xpReward: number;
  pointsReward: number;
  status: 'active' | 'completed' | 'expired';
  weekStart: string;
  weekEnd: string;
}

export interface DailyMission {
  id: string;
  userId: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  category: 'workout' | 'nutrition' | 'wellness';
  targetValue: number;
  currentProgress: number;
  xpReward: number;
  status: 'active' | 'completed' | 'expired';
  date: string;
}

// Photo Analysis
export interface BodyPhoto {
  id: string;
  userId: string;
  photoUrl: string;
  analysisResult?: string;
  createdAt: string;
}

export interface AIGeneratedProgram {
  id: string;
  userId: string;
  type: 'workout' | 'nutrition';
  title: string;
  content: string;
  basedOnPhoto?: string;
  createdAt: string;
}

// User Agreement
export interface UserAgreement {
  id: string;
  userId: string;
  agreementType: 'terms' | 'kvkk' | 'privacy';
  version: string;
  acceptedAt: string;
  ipAddress?: string;
}

// Generic utility types to replace 'any'
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type GenericObject = Record<string, JSONValue>;

// Type for AI insight metadata based on type
export type AIInsightMetadata =
  | PhysiqueAnalysisMetadata
  | MealPlanMetadata
  | RecipeMetadata
  | HealthInsightMetadata;

export interface PhysiqueAnalysisMetadata {
  muscleGroups: string[];
  bodyFatPercentage?: number;
  muscleMass?: number;
  postureIssues?: string[];
}

export interface MealPlanMetadata {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealsPerDay: number;
  days: number;
}

export interface RecipeMetadata {
  ingredients: string[];
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface HealthInsightMetadata {
  metric: string;
  trend: 'improving' | 'declining' | 'stable';
  recommendation: string;
}

// Nutritional profile for AI calculations
export interface NutritionalProfile {
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

// Supabase response types
export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Pagination type
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
};

// HTTP middleware types for web dashboard
export interface Request {
  secure?: boolean;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
  ip?: string;
  connection?: { remoteAddress?: string };
}

export interface Response {
  setHeader(name: string, value: string): void;
  redirect(status: number, url: string): void;
  status(code: number): { json: (body: unknown) => void };
}

export type NextFunction = () => void;
