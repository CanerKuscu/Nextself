# NextSelf — Project Documentation

> **NextSelf** is a comprehensive wellness & performance mobile application built with React Native (Expo SDK 54), Supabase, and AI-powered features.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture Overview](#architecture-overview)
- [Screens & Features](#screens--features)
- [Services Layer](#services-layer)
- [State Management](#state-management)
- [Navigation](#navigation)
- [Theming & Design System](#theming--design-system)
- [Supabase Backend](#supabase-backend)
- [Monorepo (packages/shared)](#monorepo-packagesshared)
- [Web Dashboard](#web-dashboard)
- [Testing](#testing)
- [Building & Deployment](#building--deployment)
- [Security](#security)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 (New Architecture) |
| Language | TypeScript (strict mode) |
| Backend | Supabase (Auth, Postgres, Edge Functions, Storage, RLS) |
| State | Zustand 5 (persist middleware + SecureStore) |
| Data Fetching | TanStack React Query v5 |
| Navigation | React Navigation v7 (Native Stack + Bottom Tabs) |
| AI | DeepSeek API (chat, dietitian, chef) |
| Payments | iyzico (deposits) + RevenueCat (subscriptions) |
| Ads | Google Mobile Ads |
| Health | HealthKit (iOS) + Health Connect (Android) |
| Monitoring | Sentry |
| i18n | i18next (Turkish / English) |
| Animations | Lottie + React Native Reanimated |
| Camera/Vision | Vision Camera + Pose Detection |

---

## Project Structure

```
nextself/
├── App.tsx                     # Root component — provider wrapping
├── index.ts                    # Entry point (registerRootComponent)
│
├── navigation/
│   └── AppNavigator.tsx        # All routes — lazy-loaded screens
│
├── screens/                    # 54 screen components
├── components/                 # Shared UI components (19+)
│   └── HomeScreen/             # Home-specific sub-components (9)
│
├── features/
│   └── auth/
│       ├── screens/            # Auth, Register, EmailVerification, ForgotPassword
│       └── components/         # Auth-specific components
│
├── services/                   # 35 business logic services
├── store/                      # Zustand stores (auth, app)
├── contexts/                   # React Contexts (Theme, Language, Currency)
├── hooks/                      # Custom hooks (6)
├── config/
│   └── theme.ts                # Design system tokens (colors, typography, spacing)
│
├── utils/                      # Utilities (security, deep linking, offline, etc.)
├── locales/
│   └── i18n.ts                 # Full TR/EN translations
├── animations/
│   └── Animations.ts           # Lottie animation helpers
│
├── packages/
│   └── shared/                 # Monorepo shared package (@nextself/shared)
│       └── src/
│           ├── services/supabase.ts   # Supabase client singleton
│           ├── config/config.ts       # Env configuration
│           ├── utils/                 # Validation, storage, secure store
│           └── types/                 # Shared TypeScript types
│
├── supabase/
│   ├── migrations/             # 38 SQL migration files
│   └── functions/              # 7 Edge Functions
│       ├── deepseek-chat/
│       ├── session-exchange/
│       ├── calculate-monthly-billing/
│       ├── generate-mss-pdf/
│       ├── moderate-image/
│       ├── process-client-activation/
│       └── verify-qr-checkin/
│
├── web/
│   └── dashboard/              # Vite + TailwindCSS web dashboard
│
├── __tests__/                  # Unit tests (7 test files)
├── e2e/                        # Detox E2E tests
├── patches/                    # patch-package patches
└── scripts/                    # Build & utility scripts
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm (workspaces support)
- Expo CLI (`npx expo`)
- EAS CLI (for builds): `npm install -g eas-cli`
- Supabase CLI (for local development)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd nextself

# Install dependencies (includes workspaces)
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your actual values

# Start the development server
npx expo start
```

### Running on Devices

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# Web
npx expo start --web
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `DEEPSEEK_API_KEY` | DeepSeek AI API key |
| `SPOTIFY_CLIENT_ID` | Spotify OAuth client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify OAuth client secret |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking |
| `IYZICO_API_KEY` | iyzico payment API key |
| `IYZICO_SECRET_KEY` | iyzico payment secret key |

> ⚠️ **Never commit `.env` files.** They are protected by `.gitignore`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    App.tsx                            │
│  GestureHandler → QueryClient → SafeArea → Providers │
│  (Language → Currency → Theme → ErrorBoundary)        │
├─────────────────────────────────────────────────────┤
│               AppNavigator.tsx                        │
│  Auth Stack ←→ Main Tabs / Professional Tabs          │
│  (54 screens, lazy-loaded with Suspense)             │
├─────────────────────────────────────────────────────┤
│              State Management                         │
│  Zustand (authStoreSecure) + React Query              │
├─────────────────────────────────────────────────────┤
│              Services Layer (35)                      │
│  AI · Health · Nutrition · Workout · League · Chat    │
│  Payment · Notification · Community · Wearable · ...  │
├─────────────────────────────────────────────────────┤
│           @nextself/shared (monorepo)                 │
│  SupabaseService · Config · Validation · Types        │
├─────────────────────────────────────────────────────┤
│                  Supabase                             │
│  Auth · Postgres (RLS) · Edge Functions · Storage     │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Lazy Loading** — 40+ screens use `React.lazy()` to reduce initial bundle load
2. **Central Error Handling** — `screenLayout` prop wraps all screens with `ErrorBoundary + Suspense`
3. **Offline-First** — `OfflineService` + `OfflineSyncService` queue mutations and sync when online
4. **RBAC** — Professional routes (`pt`, `dietitian`, `trainer`) are role-guarded at the navigator level
5. **Secure Auth** — Native: `expo-secure-store` persistence. Web: HttpOnly cookies + CSRF tokens

---

## Screens & Features

### User Screens (Main Tab Bar)
| Tab | Screen | Description |
|-----|--------|-------------|
| 🏠 Home | `HomeScreen` | Dashboard with streak, quick actions, daily program, health insights |
| 🍽️ Nutrition | `NutritionScreen` | Calorie/macro tracking, meal logging |
| 🏋️ Sports | `WorkoutScreen` | Exercise library, active workout, muscle groups |
| 🏆 League | `LeagueScreen` | XP-based ranking system, missions |
| ⋯ More | `MoreMenuScreen` | Settings, profile, AI tools, store |

### Professional Screens (Professional Tab Bar)
| Tab | Screen | Description |
|-----|--------|-------------|
| 📊 Dashboard | `ProfessionalHomeScreen` | Client overview, earnings |
| 👥 Clients | `ClientsListScreen` | Client management |
| 💬 Messages | `ChatListScreen` | Client communication |
| 👤 Profile | `ProfessionalProfileScreen` | Certifications, courses |

### Feature Screens
- **AI Suite**: `AICoachScreen`, `AIDietitianScreen`, `AIChefScreen`, `AIToolsScreen`
- **Health**: `HealthScreen`, `SmartScaleScreen`, `WaterTrackingScreen`, `PostureAnalysisScreen`
- **Nutrition**: `FoodScannerScreen`, `BarcodeScannerScreen`, `SupplementScreen`
- **Social**: `CommunityScreen`, `ChatScreen`, `LeagueScreen`, `MissionsScreen`
- **Professional**: `ProfessionalProgramCreatorScreen`, `ProfessionalCoursesScreen`, `CourseDetailScreen`, `ProfessionalBillingScreen`
- **Commerce**: `StoreScreen`, `PaywallScreen`, `DepositTopUpScreen`
- **Profile**: `ProfileScreen`, `EditProfileScreen`, `SettingsScreen`, `PrivacySettingsScreen`

---

## Services Layer

Key services in `services/`:

| Service | Purpose |
|---------|---------|
| `aiService.ts` | AI coach/dietitian integration |
| `deepseek.ts` | DeepSeek API communication |
| `healthService.ts` | HealthKit/Health Connect data sync |
| `nutritionService.ts` | Food & calorie tracking |
| `leagueService.ts` | XP, ranking, tier management |
| `missionService.ts` | Daily/weekly challenge system |
| `waterTrackingService.ts` | Water intake tracking |
| `communityForumService.ts` | Forum CRUD + moderation |
| `paymentService.ts` | iyzico + RevenueCat |
| `pushNotificationService.ts` | Expo push notifications |
| `wearableService.ts` | Smartwatch integration |
| `spotifyService.ts` | Workout playlist integration |
| `contentModerationService.ts` | User content moderation |
| `offlineSyncService.ts` | Offline queue & sync |
| `storeService.ts` | In-app store (XP coins) |
| `progressReportService.ts` | Weekly/monthly progress reports |

---

## State Management

### Zustand Stores

| Store | File | Purpose |
|-------|------|---------|
| Auth | `store/authStoreSecure.ts` | Session, user, profile, login/logout, RBAC |
| App | `store/appStore.ts` | General app state |

#### Auth Store Features
- **Persisted** to `expo-secure-store` (native) / noop (web)
- **Session validation** with expiry checking
- **Web auth**: Cookie-based session with CSRF protection
- **Rate limiting**: Exponential backoff on failed login attempts
- **Sign-out callbacks**: Registered cleanup functions

### React Query
- **Stale time**: 5 minutes
- **GC time**: 10 minutes
- **Retry**: 2 attempts
- **No refetch on focus** (mobile best practice)

---

## Navigation

Single `AppNavigator.tsx` with:

1. **Auth Stack**: Login → Register → Email Verification → Forgot Password
2. **Main Tabs**: Home, Nutrition, Sports, League, More
3. **Professional Tabs**: Dashboard, Clients, Messages, Profile
4. **Stack Screens**: 50+ additional screens accessible via navigation

### Route Guards
- User routes → accessible to all authenticated users
- Professional routes → guarded with `isProfessional` check
- Unauthenticated → redirected to Auth screen

---

## Theming & Design System

Defined in `config/theme.ts` — Duolingo-inspired clean design:

### Colors
- **Primary**: `#58CC02` (Fresh Green)
- **Secondary**: `#CE82FF` (Vivid Purple)
- **Accent**: `#1CB0F6` (Sky Blue)
- Full **dark mode** support via `DARK_COLORS`

### Typography Scale
`hero` → `h1` → `h2` → `h3` → `body` → `caption` → `small`

### Spacing (8px Grid System)
All spacing is a multiple of 8: `xs(8)` → `sm(16)` → `md(24)` → `lg(32)` → `xl(40)` → `xxl(48)`

### Shared Styles
`COMMON_STYLES` provides pre-built patterns: `screenContainer`, `card`, `glassCard`, `chip`, `badge`, `divider`

---

## Supabase Backend

### Migrations (38 files)
Located in `supabase/migrations/`. Key tables include:
- `profiles` — User profiles with roles
- `workouts`, `exercises` — Exercise library & tracking
- `food_items`, `nutrition_logs` — Nutrition data
- `leagues`, `user_xp` — Gamification
- `missions`, `streaks` — Challenge system
- `professional_*` — B2B professional features
- `forum_posts`, `forum_replies` — Community
- `agreements` — Legal agreement tracking
- `content_moderation_*` — Moderation system

### Edge Functions (7)
| Function | Purpose |
|----------|---------|
| `deepseek-chat` | AI chat proxy |
| `session-exchange` | Web auth cookie exchange |
| `calculate-monthly-billing` | Professional billing |
| `generate-mss-pdf` | PDF report generation |
| `moderate-image` | Image content moderation |
| `process-client-activation` | Client onboarding |
| `verify-qr-checkin` | QR code check-in verification |

### Row Level Security (RLS)
All tables have RLS policies. Key patterns:
- Users can only read/write their own data
- Professionals can access their clients' data
- Service role bypasses for Edge Functions

### Seed Data
- `exercises_rows.csv` — Exercise library (1.5 MB)
- `food_items_rows.csv` — Food database (3.8 MB)

---

## Monorepo (packages/shared)

The `@nextself/shared` package contains code shared between the mobile app and web dashboard:

| Export | Description |
|--------|-------------|
| `SupabaseService` | Singleton Supabase client with refresh handling |
| `CONFIG` | Environment configuration with validation |
| `ValidationUtils` | Email, password, input validation |
| `SecureStoreAdapter` | Zustand-compatible secure storage adapter |
| `PlatformStorage` | Cross-platform storage abstraction |
| Types | Shared TypeScript interfaces |

---

## Web Dashboard

Located in `web/dashboard/`:
- **Framework**: Vite + React
- **Styling**: TailwindCSS
- **Purpose**: Admin/professional dashboard for web access

---

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

**Test files** in `__tests__/`:
- `utils.test.ts` — Utility functions
- `healthService.test.ts` — Health service logic
- `missionService.test.ts` — Mission service logic
- `offlineService.test.ts` — Offline sync
- `securityMiddleware.test.ts` — Security middleware
- `dateUtils.test.ts` — Date utilities
- `webSession.test.ts` — Web session management

**Coverage threshold**: 70% (branches, functions, lines, statements)

### Component Tests
- `components/__tests__/AnimatedButton.test.tsx`

### E2E Tests (Detox)
```bash
npm run e2e:android
```
- `e2e/homeFlow.e2e.js`
- `e2e/workoutFlow.e2e.js`

---

## Building & Deployment

### EAS Build Profiles

```bash
# Development (internal distribution)
npm run build:dev

# Preview (APK for testing)
npm run build:preview

# Production (store release)
npm run build:production
```

### Build Configuration
- `eas.json` — Build profiles (development, preview, production)
- `app.json` — Expo configuration (bundle IDs, permissions, plugins)
- Auto-increment version on production builds

---

## Security

### Authentication
- **Native**: Supabase Auth + `expo-secure-store` token persistence
- **Web**: HttpOnly cookies + CSRF token validation
- **Rate Limiting**: Exponential backoff on failed login (max 5 attempts → 30s lockout)

### Data Protection
- **RLS**: Row Level Security on all Supabase tables
- **Input Sanitization**: `SecurityUtils.sanitizeInput()` on all user inputs
- **Content Moderation**: AI-powered image/text moderation service
- **Secret Scanning**: `npm run scan:secrets` to detect leaked credentials
- **Ban System**: User ban checking on login

### Compliance
- **KVKK** (Turkish GDPR) consent collection at registration
- **Terms of Service** + **Privacy Policy** acceptance tracking
- **Data Privacy Screen** for user data management
- **Biometric Consent Modal** for health data access

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run on web |
| `npm test` | Run unit tests |
| `npm run type-check` | TypeScript compilation check |
| `npm run lint` | ESLint check |
| `npm run lint:strict` | ESLint with zero warnings |
| `npm run scan:secrets` | Scan for leaked secrets |
| `npm run build:production` | EAS production build |
