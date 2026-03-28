import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EdgeInsets } from 'react-native-safe-area-context';

// ─── Eagerly loaded screens (needed at startup / tab navigators) ───
import AuthScreen from '../features/auth/screens/AuthScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import EmailVerificationScreen from '../features/auth/screens/EmailVerificationScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import NutritionScreen from '../screens/NutritionScreen';
import LeagueScreen from '../screens/LeagueScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import SplashScreen from '../screens/SplashScreen';
import ProfessionalHomeScreen from '@screens/ProfessionalHomeScreen';
import ClientsListScreen from '@screens/ClientsListScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfessionalProfileScreen from '../screens/ProfessionalProfileScreen';
import ErrorBoundaryWithHooks from '../components/ErrorBoundary';

// ─── Regular imports to prevent navigation jank (H-5 fix) ───
const ProfileScreen = lazy(() => import('../screens/ProfileScreen'));
const AICoachScreen = lazy(() => import('../screens/AICoachScreen'));
const AIDietitianScreen = lazy(() => import('../screens/AIDietitianScreen'));
const AIChefScreen = lazy(() => import('../screens/AIChefScreen'));
const HealthScreen = lazy(() => import('../screens/HealthScreen'));
const SupplementScreen = lazy(() => import('../screens/SupplementScreen'));
const SpotifyScreen = lazy(() => import('../screens/SpotifyScreen'));
const ProfessionalSearchScreen = lazy(() => import('../screens/ProfessionalSearchScreen'));
const RatingScreen = lazy(() => import('../screens/RatingScreen'));
const TermsScreen = lazy(() => import('../screens/TermsScreen'));
const SettingsScreen = lazy(() => import('../screens/SettingsScreen'));
const EditProfileScreen = lazy(() => import('../screens/EditProfileScreen'));
const ChatScreen = lazy(() => import('../screens/ChatScreen'));
const PrivacySettingsScreen = lazy(() => import('../screens/PrivacySettingsScreen'));
const FoodScannerScreen = lazy(() => import('../screens/FoodScannerScreen'));
const AIToolsScreen = lazy(() => import('../screens/AIToolsScreen'));
const AssignmentsScreen = lazy(() => import('../screens/AssignmentsScreen'));
const CommunityScreen = lazy(() => import('../screens/CommunityScreen'));
const BarcodeScannerScreen = lazy(() => import('../screens/BarcodeScannerScreen'));
const PostureAnalysisScreen = lazy(() => import('../screens/PostureAnalysisScreen'));
const ActiveWorkoutScreen = lazy(() => import('../screens/ActiveWorkoutScreen'));
const MuscleExercisesScreen = lazy(() => import('../screens/MuscleExercisesScreen'));
const WaterTrackingScreen = lazy(() => import('../screens/WaterTrackingScreen'));
const DataPrivacyScreen = lazy(() => import('../screens/DataPrivacyScreen'));
const StoreScreen = lazy(() => import('../screens/StoreScreen'));
const ExerciseDetailScreen = lazy(() => import('../screens/ExerciseDetailScreen'));
const ProfessionalProgramCreatorScreen = lazy(() => import('@screens/ProfessionalProgramCreatorScreen'));
const MissionsScreen = lazy(() => import('../screens/MissionsScreen'));
const ProfessionalCoursesScreen = lazy(() => import('@screens/ProfessionalCoursesScreen'));
const CourseDetailScreen = lazy(() => import('../screens/CourseDetailScreen'));
const SmartScaleScreen = lazy(() => import('../screens/SmartScaleScreen'));
const ProgressReportScreen = lazy(() => import('../screens/ProgressReportScreen'));
const ProfessionalBillingScreen = lazy(() => import('@screens/ProfessionalBillingScreen'));
const ClientDetailScreen = lazy(() => import('../screens/ClientDetailScreen'));
const QRInviteScreen = lazy(() => import('../screens/QRInviteScreen'));
const ProfessionalDetailScreen = lazy(() => import('../screens/ProfessionalDetailScreen'));


import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../store/authStoreSecure';

// Suspense fallback for lazy-loaded screens
const LazyFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

// Native pass-through - handled by central screenLayout now
const withCheck = (Component: any, name: string) => Component;

// ─── Memoized screen wrappers (module-level to prevent re-creation on render) ───
// Eagerly loaded screens
const SafeAuthScreen = withCheck(AuthScreen, 'AuthScreen');
const SafeRegisterScreen = withCheck(RegisterScreen, 'RegisterScreen');
const SafeEmailVerificationScreen = withCheck(EmailVerificationScreen, 'EmailVerificationScreen');
const SafeForgotPasswordScreen = withCheck(ForgotPasswordScreen, 'ForgotPasswordScreen');
const SafeHomeScreen = withCheck(HomeScreen, 'HomeScreen');
const SafeWorkoutScreen = withCheck(WorkoutScreen, 'WorkoutScreen');
const SafeNutritionScreen = withCheck(NutritionScreen, 'NutritionScreen');
const SafeLeagueScreen = withCheck(LeagueScreen, 'LeagueScreen');
const SafeMoreMenuScreen = withCheck(MoreMenuScreen, 'MoreMenuScreen');
const SafeProfessionalHomeScreen = withCheck(ProfessionalHomeScreen, 'ProfessionalHomeScreen');
const SafeClientsListScreen = withCheck(ClientsListScreen, 'ClientsListScreen');
const SafeChatListScreen = withCheck(ChatListScreen, 'ChatListScreen');
const SafeProfessionalProfileScreen = withCheck(ProfessionalProfileScreen, 'ProfessionalProfileScreen');

// Standard screens
const SafeProfileScreen = withCheck(ProfileScreen, 'ProfileScreen');
const SafeAICoachScreen = withCheck(AICoachScreen, 'AICoachScreen');
const SafeAIDietitianScreen = withCheck(AIDietitianScreen, 'AIDietitianScreen');
const SafeAIChefScreen = withCheck(AIChefScreen, 'AIChefScreen');
const SafeHealthScreen = withCheck(HealthScreen, 'HealthScreen');
const SafeSupplementScreen = withCheck(SupplementScreen, 'SupplementScreen');
const SafeSpotifyScreen = withCheck(SpotifyScreen, 'SpotifyScreen');
const SafeProfessionalSearchScreen = withCheck(ProfessionalSearchScreen, 'ProfessionalSearchScreen');
const SafeRatingScreen = withCheck(RatingScreen, 'RatingScreen');
const SafeTermsScreen = withCheck(TermsScreen, 'TermsScreen');
const SafeSettingsScreen = withCheck(SettingsScreen, 'SettingsScreen');
const SafeEditProfileScreen = withCheck(EditProfileScreen, 'EditProfileScreen');
const SafeChatScreen = withCheck(ChatScreen, 'ChatScreen');
const SafePrivacySettingsScreen = withCheck(PrivacySettingsScreen, 'PrivacySettingsScreen');
const SafeFoodScannerScreen = withCheck(FoodScannerScreen, 'FoodScannerScreen');
const SafeAIToolsScreen = withCheck(AIToolsScreen, 'AIToolsScreen');
const SafeAssignmentsScreen = withCheck(AssignmentsScreen, 'AssignmentsScreen');
const SafeCommunityScreen = withCheck(CommunityScreen, 'CommunityScreen');
const SafeBarcodeScannerScreen = withCheck(BarcodeScannerScreen, 'BarcodeScannerScreen');
const SafePostureAnalysisScreen = withCheck(PostureAnalysisScreen, 'PostureAnalysisScreen');
const SafeActiveWorkoutScreen = withCheck(ActiveWorkoutScreen, 'ActiveWorkoutScreen');
const SafeMuscleExercisesScreen = withCheck(MuscleExercisesScreen, 'MuscleExercisesScreen');
const SafeWaterTrackingScreen = withCheck(WaterTrackingScreen, 'WaterTrackingScreen');
const SafeDataPrivacyScreen = withCheck(DataPrivacyScreen, 'DataPrivacyScreen');
const SafeStoreScreen = withCheck(StoreScreen, 'StoreScreen');
const SafeExerciseDetailScreen = withCheck(ExerciseDetailScreen, 'ExerciseDetailScreen');
const SafeProfessionalProgramCreatorScreen = withCheck(ProfessionalProgramCreatorScreen, 'ProfessionalProgramCreatorScreen');
const SafeMissionsScreen = withCheck(MissionsScreen, 'MissionsScreen');
const SafeProfessionalCoursesScreen = withCheck(ProfessionalCoursesScreen, 'ProfessionalCoursesScreen');
const SafeCourseDetailScreen = withCheck(CourseDetailScreen, 'CourseDetailScreen');
const SafeSmartScaleScreen = withCheck(SmartScaleScreen, 'SmartScaleScreen');
const SafeProgressReportScreen = withCheck(ProgressReportScreen, 'ProgressReportScreen');
const SafeProfessionalBillingScreen = withCheck(ProfessionalBillingScreen, 'ProfessionalBillingScreen');
const SafeClientDetailScreen = withCheck(ClientDetailScreen, 'ClientDetailScreen');
const SafeQRInviteScreen = withCheck(QRInviteScreen, 'QRInviteScreen');
const SafeProfessionalDetailScreen = withCheck(ProfessionalDetailScreen, 'ProfessionalDetailScreen');

// ─── Navigation Type Definitions ───
export type MainTabParamList = {
  Home: undefined;
  Nutrition: undefined;
  Sports: undefined;
  League: undefined;
  More: undefined;
};

export type ProfessionalTabParamList = {
  ProfHome: undefined;
  Clients: undefined;
  ProfChat: undefined;
  ProfProfile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Register: undefined;
  EmailVerification: { token?: string; email?: string } | undefined;
  ForgotPassword: undefined;
  Main: undefined;
  ProfessionalMain: undefined;
  ProfessionalHome: undefined;
  ClientsList: undefined;
  ClientDetail: { clientId?: string } | undefined;
  QRInvite: undefined;
  ProfessionalBilling: undefined;
  Profile: undefined;
  AI: undefined;
  AIDietitian: undefined;
  AIChef: undefined;
  Supplements: undefined;
  Spotify: undefined;
  ProfessionalSearch: undefined;
  ProfessionalDetail: { professionalId?: string } | undefined;
  Rating: undefined;
  Terms: undefined;
  ChatList: undefined;
  Chat: { conversationId?: string } | undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  EditProfile: undefined;
  FoodScanner: { foodId?: string } | undefined;
  AIToolsStack: { screen?: string } | undefined;
  Assignments: undefined;
  Community: undefined;
  BarcodeScanner: undefined;
  PostureAnalysis: undefined;
  ActiveWorkout: { workoutId?: string } | undefined;
  MuscleExercises: { muscleGroup?: string } | undefined;
  ExerciseDetail: { exerciseId: string };
  WaterTracking: undefined;
  DataPrivacy: undefined;
  Health: undefined;
  League: undefined;
  Store: undefined;
  ProfessionalProgramCreator: undefined;
  Missions: undefined;
  ProfessionalCourses: undefined;
  CourseDetail: { courseId?: string } | undefined;
  SmartScale: undefined;
  ProgressReport: undefined;
};

import type { ParamListBase, RouteProp } from '@react-navigation/native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList & ProfessionalTabParamList>();

// ─── R5: Shared tab bar style helper (eliminates duplication) ───
const getSharedTabBarOptions = (colors: any, isDark: boolean, insets: EdgeInsets) => ({
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: colors.textTertiary,
  tabBarStyle: {
    position: 'absolute' as const,
    backgroundColor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    bottom: insets.bottom > 0 ? insets.bottom : 12,
    left: 16,
    right: 16,
    borderRadius: 30,
    height: 75,
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  tabBarShowLabel: true,
  headerShown: false,
});

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { t, isTurkish } = useTranslation();
  const { colors, isDark } = useTheme();
  const sharedOptions = getSharedTabBarOptions(colors, isDark, insets);

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<ParamListBase, string> }) => ({
        ...sharedOptions,
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Nutrition') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Sports') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'League') iconName = focused ? 'trophy' : 'trophy-outline';
          else if (route.name === 'More') iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';

          const iconColor = focused ? COLORS.primary : colors.textTertiary;
          return <Ionicons name={iconName} size={28} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={SafeHomeScreen}
        options={{ title: t('home') }}
      />
      <Tab.Screen
        name="Nutrition"
        component={SafeNutritionScreen}
        options={{ title: t('nutrition') }}
      />
      <Tab.Screen
        name="Sports"
        component={SafeWorkoutScreen}
        options={{ title: isTurkish ? 'Spor' : 'Sports' }}
      />
      <Tab.Screen
        name="League"
        component={SafeLeagueScreen}
        options={{ title: t('league') }}
      />
      <Tab.Screen
        name="More"
        component={SafeMoreMenuScreen}
        options={{ title: isTurkish ? 'Daha Fazla' : 'More' }}
      />
    </Tab.Navigator>
  );
};

// Professional (PT / Dietitian) Tab Navigator
const ProfessionalTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { t, isTurkish } = useTranslation();
  const { colors, isDark } = useTheme();
  const sharedOptions = getSharedTabBarOptions(colors, isDark, insets);

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<ParamListBase, string> }) => ({
        ...sharedOptions,
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'ProfHome') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Clients') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'ProfChat') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          else if (route.name === 'ProfProfile') iconName = focused ? 'person' : 'person-outline';

          const iconColor = focused ? COLORS.primary : colors.textTertiary;
          return <Ionicons name={iconName} size={28} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen
        name="ProfHome"
        component={SafeProfessionalHomeScreen}
        options={{ title: isTurkish ? 'Panel' : 'Dashboard', tabBarAccessibilityLabel: isTurkish ? 'Panel' : 'Dashboard' }}
      />
      <Tab.Screen
        name="Clients"
        component={SafeClientsListScreen}
        options={{ title: isTurkish ? 'Danışanlar' : 'Clients', tabBarAccessibilityLabel: isTurkish ? 'Danışanlar' : 'Clients' }}
      />
      <Tab.Screen
        name="ProfChat"
        component={SafeChatListScreen}
        options={{ title: isTurkish ? 'Mesajlar' : 'Messages', tabBarAccessibilityLabel: isTurkish ? 'Mesajlar' : 'Messages' }}
      />
      <Tab.Screen
        name="ProfProfile"
        component={SafeProfessionalProfileScreen}
        options={{ title: isTurkish ? 'Profil' : 'Profile', tabBarAccessibilityLabel: isTurkish ? 'Profil' : 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [checking, setChecking] = useState(true);
  const { colors, isDark } = useTheme();
  const session = useAuthStore(state => state.session);
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);
  const authLoading = useAuthStore(state => state.isLoading);
  const setProfile = useAuthStore(state => state.setProfile);
  const isProfessional = profile?.role === 'pt' || profile?.role === 'dietitian' || profile?.role === 'trainer';

  useEffect(() => {
    let cancelled = false;
    const resolveInitialRoute = async () => {
      if (authLoading) return;
      const currentUser = user ?? session?.user ?? null;
      if (!currentUser?.id) {
        if (!cancelled) {
          setInitialRoute('Auth');
          setChecking(false);
        }
        return;
      }
      try {
        const client = SupabaseService.getInstance().getClient();
        const { data: userProfile } = await client
          .from('profiles')
          .select('id, username, first_name, last_name, user_type, gender')
          .eq('id', currentUser.id)
          .single();
        if (userProfile) {
          setProfile({
            id: userProfile.id,
            username: userProfile.username,
            email: currentUser.email || '',
            role: userProfile.user_type || 'user',
            fullName: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
            gender: userProfile.gender
          });
        }
        const role = userProfile?.user_type;
        if (!cancelled) {
          setInitialRoute(role === 'pt' || role === 'dietitian' || role === 'trainer' ? 'ProfessionalMain' : 'Main');
          setChecking(false);
        }
      } catch (err) {
        if (!cancelled) {
          setInitialRoute('Auth');
          setChecking(false);
        }
      }
    };
    resolveInitialRoute();
    return () => {
      cancelled = true;
    };
  }, [authLoading, session, user, setProfile]);


  if (checking || !splashAnimationFinished) {
    return <SplashScreen onFinish={() => setSplashAnimationFinished(true)} />;
  }

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} translucent={false} />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenLayout={({ children }) => (
          <ErrorBoundaryWithHooks>
            <Suspense fallback={<LazyFallback />}>
              {children}
            </Suspense>
          </ErrorBoundaryWithHooks>
        )}
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen name="Auth" component={SafeAuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={SafeRegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EmailVerification" component={SafeEmailVerificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={SafeForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={isProfessional ? ProfessionalTabNavigator : MainTabNavigator} options={{ headerShown: false }} />
        
        {/* Professional Routes - RBAC Guarded */}
        <Stack.Screen 
          name="ProfessionalMain" 
          component={isProfessional ? ProfessionalTabNavigator : SafeHomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ProfessionalHome" 
          component={isProfessional ? SafeProfessionalHomeScreen : SafeHomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ClientsList" 
          component={isProfessional ? SafeClientsListScreen : SafeHomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="ClientDetail"
          component={isProfessional ? SafeClientDetailScreen : SafeHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="QRInvite"
          component={isProfessional ? SafeQRInviteScreen : SafeHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ProfessionalBilling" 
          component={isProfessional ? SafeProfessionalBillingScreen : SafeHomeScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen name="Profile" component={SafeProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AI" component={SafeAICoachScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AIDietitian" component={SafeAIDietitianScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AIChef" component={SafeAIChefScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Supplements" component={SafeSupplementScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Spotify" component={SafeSpotifyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalSearch" component={SafeProfessionalSearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalDetail" component={SafeProfessionalDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Rating" component={SafeRatingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Terms" component={SafeTermsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChatList" component={SafeChatListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={SafeChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SafeSettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PrivacySettings" component={SafePrivacySettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={SafeEditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FoodScanner" component={SafeFoodScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AIToolsStack" component={SafeAIToolsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Assignments" component={SafeAssignmentsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Community" component={SafeCommunityScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BarcodeScanner" component={SafeBarcodeScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostureAnalysis" component={SafePostureAnalysisScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ActiveWorkout" component={SafeActiveWorkoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MuscleExercises" component={SafeMuscleExercisesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ExerciseDetail" component={SafeExerciseDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WaterTracking" component={SafeWaterTrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DataPrivacy" component={SafeDataPrivacyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Health" component={SafeHealthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="League" component={SafeLeagueScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Store" component={SafeStoreScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalProgramCreator" component={SafeProfessionalProgramCreatorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Missions" component={SafeMissionsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalCourses" component={SafeProfessionalCoursesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CourseDetail" component={SafeCourseDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SmartScale" component={SafeSmartScaleScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProgressReport" component={SafeProgressReportScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
