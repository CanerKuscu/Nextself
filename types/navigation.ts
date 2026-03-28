/**
 * Navigation type definitions for the NextSelf app.
 * Provides type-safe route params for all stack and tab navigators.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ─── Main Tab (User) ───
export type MainTabParamList = {
  Home: undefined;
  Nutrition: { planId?: string } | undefined;
  Sports: undefined;
  League: undefined;
  More: undefined;
};

// ─── Professional Tab ───
export type ProfessionalTabParamList = {
  ProfHome: undefined;
  Clients: undefined;
  ProfChat: undefined;
  ProfProfile: undefined;
};

// ─── Root Stack ───
export type RootStackParamList = {
  // Auth
  Auth: undefined;
  Register: undefined;
  EmailVerification: { email?: string } | undefined;
  ForgotPassword: undefined;

  // Main tabs
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ProfessionalMain: NavigatorScreenParams<ProfessionalTabParamList> | undefined;

  // Profile & Settings
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  DataPrivacy: undefined;
  Terms: undefined;

  // AI Tools
  AI: undefined;
  AIDietitian: undefined;
  AIChef: undefined;
  AIToolsStack: undefined;

  // Workout
  ActiveWorkout: {
    workoutId?: string;
    assignmentId?: string;
    workoutName?: string;
    muscleGroups?: string[];
  } | undefined;
  MuscleExercises: { muscle?: string } | undefined;
  ExerciseDetail: { exerciseId?: string } | undefined;
  PostureAnalysis: undefined;

  // Nutrition
  FoodScanner: undefined;
  BarcodeScanner: undefined;

  // Health & Tracking
  Health: undefined;
  WaterTracking: undefined;
  SmartScale: undefined;
  Supplements: undefined;
  ProgressReport: { userId?: string } | undefined;

  // Social & Community
  Community: undefined;
  ChatList: undefined;
  Chat: { chatId?: string; recipientId?: string } | undefined;
  League: undefined;

  // Music
  Spotify: undefined;

  // Professional
  ProfessionalHome: undefined;
  ProfessionalSearch: undefined;
  ProfessionalDetail: { professionalId?: string } | undefined;
  ProfessionalProgramCreator: { clientId?: string } | undefined;
  ProfessionalCourses: undefined;
  CourseDetail: { courseId?: string } | undefined;
  ProfessionalBilling: undefined;
  ClientsList: undefined;
  ClientDetail: { clientId?: string } | undefined;
  QRInvite: undefined;

  // Store & Commerce
  Store: undefined;
  Rating: { professionalId?: string } | undefined;
  Assignments: undefined;
  Missions: { missionId?: string } | undefined;
};

// ─── Screen prop types ───
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type ProfessionalTabScreenProps<T extends keyof ProfessionalTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<ProfessionalTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

// ─── Global declaration for useNavigation ───
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
