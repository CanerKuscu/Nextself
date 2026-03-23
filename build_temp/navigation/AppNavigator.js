"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const vector_icons_1 = require("@expo/vector-icons");
const expo_status_bar_1 = require("expo-status-bar");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
// Screens
const AuthScreen_1 = __importDefault(require("../screens/AuthScreen"));
const RegisterScreen_1 = __importDefault(require("../screens/RegisterScreen"));
const EmailVerificationScreen_1 = __importDefault(require("../screens/EmailVerificationScreen"));
const ForgotPasswordScreen_1 = __importDefault(require("../screens/ForgotPasswordScreen"));
const HomeScreen_1 = __importDefault(require("../screens/HomeScreen"));
const WorkoutScreen_1 = __importDefault(require("../screens/WorkoutScreen"));
const NutritionScreen_1 = __importDefault(require("../screens/NutritionScreen"));
const ProfileScreen_1 = __importDefault(require("../screens/ProfileScreen"));
const AICoachScreen_1 = __importDefault(require("../screens/AICoachScreen"));
const AIDietitianScreen_1 = __importDefault(require("../screens/AIDietitianScreen"));
const AIChefScreen_1 = __importDefault(require("../screens/AIChefScreen"));
const HealthScreen_1 = __importDefault(require("../screens/HealthScreen"));
const SupplementScreen_1 = __importDefault(require("../screens/SupplementScreen"));
const SpotifyScreen_1 = __importDefault(require("../screens/SpotifyScreen"));
const ProfessionalSearchScreen_1 = __importDefault(require("../screens/ProfessionalSearchScreen"));
const RatingScreen_1 = __importDefault(require("../screens/RatingScreen"));
const TermsScreen_1 = __importDefault(require("../screens/TermsScreen"));
const SplashScreen_1 = __importDefault(require("../screens/SplashScreen"));
const SettingsScreen_1 = __importDefault(require("../screens/SettingsScreen"));
const EditProfileScreen_1 = __importDefault(require("../screens/EditProfileScreen"));
const ChatListScreen_1 = __importDefault(require("../screens/ChatListScreen"));
const ChatScreen_1 = __importDefault(require("../screens/ChatScreen"));
const PrivacySettingsScreen_1 = __importDefault(require("../screens/PrivacySettingsScreen"));
const FoodScannerScreen_1 = __importDefault(require("../screens/FoodScannerScreen"));
const AIToolsScreen_1 = __importDefault(require("../screens/AIToolsScreen"));
const AssignmentsScreen_1 = __importDefault(require("../screens/AssignmentsScreen"));
const CommunityScreen_1 = __importDefault(require("../screens/CommunityScreen"));
const BarcodeScannerScreen_1 = __importDefault(require("../screens/BarcodeScannerScreen"));
const PostureAnalysisScreen_1 = __importDefault(require("../screens/PostureAnalysisScreen"));
const ActiveWorkoutScreen_1 = __importDefault(require("../screens/ActiveWorkoutScreen"));
const MuscleExercisesScreen_1 = __importDefault(require("../screens/MuscleExercisesScreen"));
const WaterTrackingScreen_1 = __importDefault(require("../screens/WaterTrackingScreen"));
const DataPrivacyScreen_1 = __importDefault(require("../screens/DataPrivacyScreen"));
const LeagueScreen_1 = __importDefault(require("../screens/LeagueScreen"));
const StoreScreen_1 = __importDefault(require("../screens/StoreScreen"));
const ExerciseDetailScreen_1 = __importDefault(require("../screens/ExerciseDetailScreen"));
const ProfessionalProgramCreatorScreen_1 = __importDefault(require("../screens/ProfessionalProgramCreatorScreen"));
const MissionsScreen_1 = __importDefault(require("../screens/MissionsScreen"));
const ProfessionalCoursesScreen_1 = __importDefault(require("../screens/ProfessionalCoursesScreen"));
const CourseDetailScreen_1 = __importDefault(require("../screens/CourseDetailScreen"));
const SmartScaleScreen_1 = __importDefault(require("../screens/SmartScaleScreen"));
const ProgressReportScreen_1 = __importDefault(require("../screens/ProgressReportScreen"));
const ProfessionalHomeScreen_1 = __importDefault(require("../screens/ProfessionalHomeScreen"));
const ClientsListScreen_1 = __importDefault(require("../screens/ClientsListScreen"));
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const Stack = (0, native_stack_1.createNativeStackNavigator)();
const Tab = (0, bottom_tabs_1.createBottomTabNavigator)();
const screens = {
    AuthScreen: AuthScreen_1.default, RegisterScreen: RegisterScreen_1.default, EmailVerificationScreen: EmailVerificationScreen_1.default, ForgotPasswordScreen: ForgotPasswordScreen_1.default,
    HomeScreen: HomeScreen_1.default, WorkoutScreen: WorkoutScreen_1.default, NutritionScreen: NutritionScreen_1.default, ProfileScreen: ProfileScreen_1.default, AICoachScreen: AICoachScreen_1.default,
    AIDietitianScreen: AIDietitianScreen_1.default, AIChefScreen: AIChefScreen_1.default, HealthScreen: HealthScreen_1.default, SupplementScreen: SupplementScreen_1.default, SpotifyScreen: SpotifyScreen_1.default,
    ProfessionalSearchScreen: ProfessionalSearchScreen_1.default, RatingScreen: RatingScreen_1.default, TermsScreen: TermsScreen_1.default, SplashScreen: SplashScreen_1.default, SettingsScreen: SettingsScreen_1.default,
    EditProfileScreen: EditProfileScreen_1.default, ChatListScreen: ChatListScreen_1.default, ChatScreen: ChatScreen_1.default, PrivacySettingsScreen: PrivacySettingsScreen_1.default, FoodScannerScreen: FoodScannerScreen_1.default,
    AIToolsScreen: AIToolsScreen_1.default, AssignmentsScreen: AssignmentsScreen_1.default, CommunityScreen: CommunityScreen_1.default, BarcodeScannerScreen: BarcodeScannerScreen_1.default, PostureAnalysisScreen: PostureAnalysisScreen_1.default,
    ActiveWorkoutScreen: ActiveWorkoutScreen_1.default, MuscleExercisesScreen: MuscleExercisesScreen_1.default, WaterTrackingScreen: WaterTrackingScreen_1.default, DataPrivacyScreen: DataPrivacyScreen_1.default,
    LeagueScreen: LeagueScreen_1.default, StoreScreen: StoreScreen_1.default, ExerciseDetailScreen: ExerciseDetailScreen_1.default, ProfessionalProgramCreatorScreen: ProfessionalProgramCreatorScreen_1.default,
    MissionsScreen: MissionsScreen_1.default, ProfessionalCoursesScreen: ProfessionalCoursesScreen_1.default, CourseDetailScreen: CourseDetailScreen_1.default, SmartScaleScreen: SmartScaleScreen_1.default,
    ProgressReportScreen: ProgressReportScreen_1.default, ProfessionalHomeScreen: ProfessionalHomeScreen_1.default, ClientsListScreen: ClientsListScreen_1.default
};
Object.entries(screens).forEach(([name, comp]) => {
    if (!comp)
        console.error('UNDEFINED COMPONENT:', name);
});
const MainTabNavigator = () => {
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    return (<Tab.Navigator screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName = 'ellipse-outline';
                if (route.name === 'Home')
                    iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'AITools')
                    iconName = focused ? 'sparkles' : 'sparkles-outline';
                else if (route.name === 'Missions')
                    iconName = focused ? 'flag' : 'flag-outline';
                else if (route.name === 'ChatList')
                    iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                else if (route.name === 'Profile')
                    iconName = focused ? 'person' : 'person-outline';
                const translateY = focused ? -10 : 0;
                const iconColor = focused ? theme_1.COLORS.primary : colors.textTertiary;
                const bgOpacity = focused ? 1 : 0;
                return (<react_native_1.View style={{ alignItems: 'center', justifyContent: 'center', width: 50 }}>
              {focused && (<react_native_1.View style={{
                            position: 'absolute',
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: theme_1.COLORS.primarySoft,
                            transform: [{ translateY: -12 }]
                        }}/>)}
              <react_native_1.View style={{ transform: [{ translateY }] }}>
                <vector_icons_1.Ionicons name={iconName} size={24} color={iconColor}/>
              </react_native_1.View>
            </react_native_1.View>);
            },
            tabBarActiveTintColor: theme_1.COLORS.primary,
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarStyle: {
                position: 'absolute',
                backgroundColor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderTopWidth: 0,
                elevation: 10,
                shadowColor: theme_1.COLORS.primary,
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
        })}>
      <Tab.Screen name="Home" component={HomeScreen_1.default} options={{ title: t('home') }}/>
      <Tab.Screen name="AITools" component={AIToolsScreen_1.default} options={{ title: t('ai_features') }}/>
      <Tab.Screen name="Missions" component={MissionsScreen_1.default} options={{ title: isTurkish ? 'Görevler' : 'Missions' }}/>
      <Tab.Screen name="ChatList" component={ChatListScreen_1.default} options={{ title: isTurkish ? 'Mesajlar' : 'Messages' }}/>
      <Tab.Screen name="Profile" component={ProfileScreen_1.default} options={{ title: t('profile') }}/>
    </Tab.Navigator>);
};
// Professional (PT / Dietitian) Tab Navigator
const ProfessionalTabNavigator = () => {
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    return (<Tab.Navigator screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName = 'ellipse-outline';
                if (route.name === 'ProfHome')
                    iconName = focused ? 'grid' : 'grid-outline';
                else if (route.name === 'Clients')
                    iconName = focused ? 'people' : 'people-outline';
                else if (route.name === 'ProfChat')
                    iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                else if (route.name === 'ProfProfile')
                    iconName = focused ? 'person' : 'person-outline';
                const translateY = focused ? -10 : 0;
                const iconColor = focused ? theme_1.COLORS.primary : colors.textTertiary;
                return (<react_native_1.View style={{ alignItems: 'center', justifyContent: 'center', width: 50 }}>
              {focused && (<react_native_1.View style={{
                            position: 'absolute',
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: theme_1.COLORS.primarySoft,
                            transform: [{ translateY: -12 }]
                        }}/>)}
              <react_native_1.View style={{ transform: [{ translateY }] }}>
                <vector_icons_1.Ionicons name={iconName} size={24} color={iconColor}/>
              </react_native_1.View>
            </react_native_1.View>);
            },
            tabBarActiveTintColor: theme_1.COLORS.primary,
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarStyle: {
                position: 'absolute',
                backgroundColor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderTopWidth: 0,
                elevation: 10,
                shadowColor: theme_1.COLORS.primary,
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
        })}>
      <Tab.Screen name="ProfHome" component={ProfessionalHomeScreen_1.default} options={{ title: isTurkish ? 'Panel' : 'Dashboard' }}/>
      <Tab.Screen name="Clients" component={ClientsListScreen_1.default} options={{ title: isTurkish ? 'Danışanlar' : 'Clients' }}/>
      <Tab.Screen name="ProfChat" component={ChatListScreen_1.default} options={{ title: isTurkish ? 'Mesajlar' : 'Messages' }}/>
      <Tab.Screen name="ProfProfile" component={ProfileScreen_1.default} options={{ title: isTurkish ? 'Profil' : 'Profile' }}/>
    </Tab.Navigator>);
};
const AppNavigator = () => {
    const [splashAnimationFinished, setSplashAnimationFinished] = (0, react_1.useState)(false);
    const [initialRoute, setInitialRoute] = (0, react_1.useState)(null);
    const [checking, setChecking] = (0, react_1.useState)(true);
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    (0, react_1.useEffect)(() => {
        checkSession();
    }, []);
    const checkSession = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const client = supabase.getClient();
            const { data: { session } } = yield client.auth.getSession();
            if (session === null || session === void 0 ? void 0 : session.user) {
                setInitialRoute('Main');
            }
            else {
                setInitialRoute('Auth');
            }
        }
        catch (err) {
            console.error('Session check error:', err);
            setInitialRoute('Auth');
        }
        finally {
            setChecking(false);
        }
    }), []);
    if (checking || !splashAnimationFinished) {
        return <SplashScreen_1.default onFinish={() => setSplashAnimationFinished(true)}/>;
    }
    if (!initialRoute)
        return null;
    return (<native_1.NavigationContainer>
      <expo_status_bar_1.StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} translucent={false}/>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{
            headerStyle: {
                backgroundColor: colors.surface,
            },
            headerShadowVisible: false,
            headerTintColor: colors.text,
            headerTitleStyle: {
                fontSize: 18,
            },
        }}>
        <Stack.Screen name="Auth" component={AuthScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Register" component={RegisterScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }}/>
        <Stack.Screen name="ProfessionalMain" component={ProfessionalTabNavigator} options={{ headerShown: false }}/>
        <Stack.Screen name="ProfessionalHome" component={ProfessionalHomeScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ClientsList" component={ClientsListScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="AI" component={AICoachScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="AIDietitian" component={AIDietitianScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="AIChef" component={AIChefScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Supplements" component={SupplementScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Spotify" component={SpotifyScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ProfessionalSearch" component={ProfessionalSearchScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Rating" component={RatingScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Terms" component={TermsScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ChatList" component={ChatListScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Chat" component={ChatScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Settings" component={SettingsScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="EditProfile" component={EditProfileScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="FoodScanner" component={FoodScannerScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="AIToolsStack" component={AIToolsScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Assignments" component={AssignmentsScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Community" component={CommunityScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="PostureAnalysis" component={PostureAnalysisScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="MuscleExercises" component={MuscleExercisesScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="WaterTracking" component={WaterTrackingScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="DataPrivacy" component={DataPrivacyScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Health" component={HealthScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="League" component={LeagueScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Store" component={StoreScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ProfessionalProgramCreator" component={ProfessionalProgramCreatorScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="Missions" component={MissionsScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ProfessionalCourses" component={ProfessionalCoursesScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="SmartScale" component={SmartScaleScreen_1.default} options={{ headerShown: false }}/>
        <Stack.Screen name="ProgressReport" component={ProgressReportScreen_1.default} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </native_1.NavigationContainer>);
};
exports.default = AppNavigator;
