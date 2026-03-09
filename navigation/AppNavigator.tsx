import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, ActivityIndicator } from 'react-native';
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
import ProgramCreatorScreen from '../screens/ProgramCreatorScreen';
import MissionsScreen from '../screens/MissionsScreen';
import ProfessionalCoursesScreen from '../screens/ProfessionalCoursesScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import SmartScaleScreen from '../screens/SmartScaleScreen';
import ProgressReportScreen from '../screens/ProgressReportScreen';
import ProfessionalHomeScreen from '../screens/ProfessionalHomeScreen';
import ClientsListScreen from '../screens/ClientsListScreen';

import { SupabaseService } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
          else if (route.name === 'AITools') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Missions') iconName = focused ? 'flag' : 'flag-outline';
          else if (route.name === 'ChatList') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          const translateY = focused ? -10 : 0;
          const iconColor = focused ? COLORS.primary : colors.textTertiary;
          const bgOpacity = focused ? 1 : 0;

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 50 }}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: COLORS.primarySoft,
                  transform: [{ translateY: -12 }]
                }} />
              )}
              <View style={{ transform: [{ translateY }] }}>
                <Ionicons name={iconName} size={24} color={iconColor} />
              </View>
            </View>
          );
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
          height: 65,
          paddingHorizontal: 8,
        },
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('home') }}
      />
      <Tab.Screen
        name="AITools"
        component={AIToolsScreen}
        options={{ title: t('ai_features') }}
      />
      <Tab.Screen
        name="Missions"
        component={MissionsScreen}
        options={{ title: isTurkish ? 'Görevler' : 'Missions' }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: isTurkish ? 'Mesajlar' : 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('profile') }}
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

          const translateY = focused ? -10 : 0;
          const iconColor = focused ? COLORS.primary : colors.textTertiary;

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 50 }}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: COLORS.primarySoft,
                  transform: [{ translateY: -12 }]
                }} />
              )}
              <View style={{ transform: [{ translateY }] }}>
                <Ionicons name={iconName} size={24} color={iconColor} />
              </View>
            </View>
          );
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
          height: 65,
          paddingHorizontal: 8,
        },
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="ProfHome"
        component={ProfessionalHomeScreen}
        options={{ title: isTurkish ? 'Panel' : 'Dashboard' }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsListScreen}
        options={{ title: isTurkish ? 'Danışanlar' : 'Clients' }}
      />
      <Tab.Screen
        name="ProfChat"
        component={ChatListScreen}
        options={{ title: isTurkish ? 'Mesajlar' : 'Messages' }}
      />
      <Tab.Screen
        name="ProfProfile"
        component={ProfileScreen}
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
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalMain" component={ProfessionalTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalHome" component={ProfessionalHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ClientsList" component={ClientsListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AI" component={AICoachScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AIDietitian" component={AIDietitianScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AIChef" component={AIChefScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Supplements" component={SupplementScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Spotify" component={SpotifyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalSearch" component={ProfessionalSearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Rating" component={RatingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FoodScanner" component={FoodScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AIToolsStack" component={AIToolsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Assignments" component={AssignmentsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Community" component={CommunityScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostureAnalysis" component={PostureAnalysisScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MuscleExercises" component={MuscleExercisesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WaterTracking" component={WaterTrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DataPrivacy" component={DataPrivacyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Health" component={HealthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="League" component={LeagueScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Store" component={StoreScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProgramCreator" component={ProgramCreatorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Missions" component={MissionsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalCourses" component={ProfessionalCoursesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SmartScale" component={SmartScaleScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProgressReport" component={ProgressReportScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
