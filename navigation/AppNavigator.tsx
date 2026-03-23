import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import AuthScreen from '../screens/AuthScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AICoachScreen from '../screens/AICoachScreen';
import AIDietitianScreen from '../screens/AIDietitianScreen';
import AIChefScreen from '../screens/AIChefScreen';
import HealthScreen from '../screens/HealthScreen';
import SupplementScreen from '../screens/SupplementScreen';
import SpotifyScreen from '../screens/SpotifyScreen';
import ProfessionalSearchScreen from '../screens/ProfessionalSearchScreen';
import RatingScreen from '../screens/RatingScreen';
import TermsScreen from '../screens/TermsScreen';
import SplashScreen from '../screens/SplashScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import FoodScannerScreen from '../screens/FoodScannerScreen';
import AIToolsScreen from '../screens/AIToolsScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import PostureAnalysisScreen from '../screens/PostureAnalysisScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import MuscleExercisesScreen from '../screens/MuscleExercisesScreen';
import WaterTrackingScreen from '../screens/WaterTrackingScreen';
import DataPrivacyScreen from '../screens/DataPrivacyScreen';
import LeagueScreen from '../screens/LeagueScreen';
import StoreScreen from '../screens/StoreScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import ProfessionalProgramCreatorScreen from '../screens/ProfessionalProgramCreatorScreen';
import MissionsScreen from '../screens/MissionsScreen';
import ProfessionalCoursesScreen from '../screens/ProfessionalCoursesScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import SmartScaleScreen from '../screens/SmartScaleScreen';
import ProgressReportScreen from '../screens/ProgressReportScreen';
import ProfessionalHomeScreen from '../screens/ProfessionalHomeScreen';
import ClientsListScreen from '../screens/ClientsListScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';

// ──── DIAGNOSTIC: log any undefined screen imports ────
const _screenImports: Record<string, any> = {
  AuthScreen, RegisterScreen, EmailVerificationScreen, ForgotPasswordScreen,
  HomeScreen, WorkoutScreen, NutritionScreen, ProfileScreen,
  AICoachScreen, AIDietitianScreen, AIChefScreen, HealthScreen,
  SupplementScreen, SpotifyScreen, ProfessionalSearchScreen, RatingScreen,
  TermsScreen, SplashScreen, SettingsScreen, EditProfileScreen,
  ChatListScreen, ChatScreen, PrivacySettingsScreen, FoodScannerScreen,
  AIToolsScreen, AssignmentsScreen, CommunityScreen, BarcodeScannerScreen,
  PostureAnalysisScreen, ActiveWorkoutScreen, MuscleExercisesScreen,
  WaterTrackingScreen, DataPrivacyScreen, LeagueScreen, StoreScreen,
  ExerciseDetailScreen, ProfessionalProgramCreatorScreen, MissionsScreen,
  ProfessionalCoursesScreen, CourseDetailScreen, SmartScaleScreen,
  ProgressReportScreen, ProfessionalHomeScreen, ClientsListScreen,
  MoreMenuScreen,
};
Object.entries(_screenImports).forEach(([name, comp]) => {
  if (!comp) console.warn(`🚨 [AppNavigator] UNDEFINED IMPORT: ${name}`);
});
// ──── END DIAGNOSTIC ────

import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Utility to catch undefined components and prevent crashes
const withCheck = (Component: any, name: string) => {
  if (!Component) {
    console.error(`[AppNavigator] ERROR: Screen component '${name}' is undefined!`);
    return function FallbackScreen() {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            Error: {name} is undefined!
          </Text>
        </View>
      );
    };
  }
  return Component;
};

import type { ParamListBase, RouteProp } from '@react-navigation/native';

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { t, isTurkish } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<ParamListBase, string> }) => ({
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
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
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
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarShowLabel: true,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={withCheck(HomeScreen, 'HomeScreen')}
        options={{ title: t('home') }}
      />
      <Tab.Screen
        name="Nutrition"
        component={withCheck(NutritionScreen, 'NutritionScreen')}
        options={{ title: t('nutrition') }}
      />
      <Tab.Screen
        name="Sports"
        component={withCheck(WorkoutScreen, 'WorkoutScreen')}
        options={{ title: isTurkish ? 'Spor' : 'Sports' }}
      />
      <Tab.Screen
        name="League"
        component={withCheck(LeagueScreen, 'LeagueScreen')}
        options={{ title: t('league') }}
      />
      <Tab.Screen
        name="More"
        component={withCheck(MoreMenuScreen, 'MoreMenuScreen')}
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

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<ParamListBase, string> }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'ProfHome') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Clients') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'ProfChat') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          else if (route.name === 'ProfProfile') iconName = focused ? 'person' : 'person-outline';

          const iconColor = focused ? COLORS.primary : colors.textTertiary;

          return <Ionicons name={iconName} size={28} color={iconColor} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
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
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarShowLabel: true,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="ProfHome"
        component={withCheck(ProfessionalHomeScreen, 'ProfessionalHomeScreen')}
        options={{ title: isTurkish ? 'Panel' : 'Dashboard' }}
      />
      <Tab.Screen
        name="Clients"
        component={withCheck(ClientsListScreen, 'ClientsListScreen')}
        options={{ title: isTurkish ? 'Danışanlar' : 'Clients' }}
      />
      <Tab.Screen
        name="ProfChat"
        component={withCheck(ChatListScreen, 'ChatListScreen')}
        options={{ title: isTurkish ? 'Mesajlar' : 'Messages' }}
      />
      <Tab.Screen
        name="ProfProfile"
        component={withCheck(ProfileScreen, 'ProfileScreen')}
        options={{ title: isTurkish ? 'Profil' : 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const { colors, isDark } = useTheme();
  
  // Guard role
  const { profile } = useAuthStore();
  const isProfessional = profile?.role === 'pt' || profile?.role === 'dietitian';

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const supabase = SupabaseService.getInstance();
      const client = supabase.getClient();
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        setInitialRoute('Main');
      } else {
        setInitialRoute('Auth');
      }
    } catch (err) {
      console.error('Session check error:', err);
      setInitialRoute('Auth');
    } finally {
      setChecking(false);
    }
  }, []);

  if (checking || !splashAnimationFinished) {
    return <SplashScreen onFinish={() => setSplashAnimationFinished(true)} />;
  }

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} translucent={false} />
      <Stack.Navigator
        initialRouteName={initialRoute}
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
        <Stack.Screen name="Auth" component={withCheck(AuthScreen, 'AuthScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={withCheck(RegisterScreen, 'RegisterScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="EmailVerification" component={withCheck(EmailVerificationScreen, 'EmailVerificationScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={withCheck(ForgotPasswordScreen, 'ForgotPasswordScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={withCheck(MainTabNavigator, 'MainTabNavigator')} options={{ headerShown: false }} />
        
        {/* Professional Routes - RBAC Guarded */}
        <Stack.Screen 
          name="ProfessionalMain" 
          component={isProfessional ? withCheck(ProfessionalTabNavigator, 'ProfessionalTabNavigator') : withCheck(HomeScreen, 'UnauthorizedFallback')} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ProfessionalHome" 
          component={isProfessional ? withCheck(ProfessionalHomeScreen, 'ProfessionalHomeScreen') : withCheck(HomeScreen, 'UnauthorizedFallback')} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ClientsList" 
          component={isProfessional ? withCheck(ClientsListScreen, 'ClientsListScreen') : withCheck(HomeScreen, 'UnauthorizedFallback')} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen name="Profile" component={withCheck(ProfileScreen, 'ProfileScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="AI" component={withCheck(AICoachScreen, 'AICoachScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="AIDietitian" component={withCheck(AIDietitianScreen, 'AIDietitianScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="AIChef" component={withCheck(AIChefScreen, 'AIChefScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Supplements" component={withCheck(SupplementScreen, 'SupplementScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Spotify" component={withCheck(SpotifyScreen, 'SpotifyScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalSearch" component={withCheck(ProfessionalSearchScreen, 'ProfessionalSearchScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Rating" component={withCheck(RatingScreen, 'RatingScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Terms" component={withCheck(TermsScreen, 'TermsScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="ChatList" component={withCheck(ChatListScreen, 'ChatListScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={withCheck(ChatScreen, 'ChatScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={withCheck(SettingsScreen, 'SettingsScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="PrivacySettings" component={withCheck(PrivacySettingsScreen, 'PrivacySettingsScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={withCheck(EditProfileScreen, 'EditProfileScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="FoodScanner" component={withCheck(FoodScannerScreen, 'FoodScannerScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="AIToolsStack" component={withCheck(AIToolsScreen, 'AIToolsScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Assignments" component={withCheck(AssignmentsScreen, 'AssignmentsScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Community" component={withCheck(CommunityScreen, 'CommunityScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="BarcodeScanner" component={withCheck(BarcodeScannerScreen, 'BarcodeScannerScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="PostureAnalysis" component={withCheck(PostureAnalysisScreen, 'PostureAnalysisScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="ActiveWorkout" component={withCheck(ActiveWorkoutScreen, 'ActiveWorkoutScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="MuscleExercises" component={withCheck(MuscleExercisesScreen, 'MuscleExercisesScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="ExerciseDetail" component={withCheck(ExerciseDetailScreen, 'ExerciseDetailScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="WaterTracking" component={withCheck(WaterTrackingScreen, 'WaterTrackingScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="DataPrivacy" component={withCheck(DataPrivacyScreen, 'DataPrivacyScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Health" component={withCheck(HealthScreen, 'HealthScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="League" component={withCheck(LeagueScreen, 'LeagueScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Store" component={withCheck(StoreScreen, 'StoreScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalProgramCreator" component={withCheck(ProfessionalProgramCreatorScreen, 'ProfessionalProgramCreatorScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="Missions" component={withCheck(MissionsScreen, 'MissionsScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalCourses" component={withCheck(ProfessionalCoursesScreen, 'ProfessionalCoursesScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="CourseDetail" component={withCheck(CourseDetailScreen, 'CourseDetailScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="SmartScale" component={withCheck(SmartScaleScreen, 'SmartScaleScreen')} options={{ headerShown: false }} />
        <Stack.Screen name="ProgressReport" component={withCheck(ProgressReportScreen, 'ProgressReportScreen')} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
