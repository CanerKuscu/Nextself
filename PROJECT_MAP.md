# PROJECT_MAP

## 1) Project Overview

NextSelf is a multi-surface fitness and wellness platform with:
- A React Native + Expo mobile app for end users (workouts, nutrition, AI coaching, health tracking, gamification, social/pro workflows).
- A React + Vite web dashboard for professionals (PT/Dietitian/Admin-like roles) to manage clients, assignments, analytics, messaging, courses, billing, and settings.
- A Supabase backend (Auth, Postgres, RLS, Edge Functions, migrations) that powers both clients.

Core domain areas in current implementation:
- Authentication and session management.
- AI-assisted fitness/nutrition/recipe/program guidance.
- Workout, nutrition, hydration, supplements, health insights.
- Professional-client workflows (assignments, progress, communication).
- Privacy/legal consent and moderation-oriented controls.

---

## 2) Tech Stack

### Languages
- TypeScript (primary, app/web/shared/services).
- SQL (Supabase migrations, schema evolution).
- JavaScript (build artifacts, scripts, legacy/generated files).

### Mobile App (Root workspace)
- Framework: Expo + React Native 0.81.
- Routing/navigation: React Navigation (native stack + bottom tabs).
- State: Zustand (`store/authStore.ts`) + React Context providers.
- Backend SDK: `@supabase/supabase-js`.
- i18n: `i18next` + `react-i18next`.
- Observability: Sentry (`@sentry/react-native`).
- Device/platform features: camera, notifications, calendar, localization, secure storage, health integrations.
- Testing: Jest (`jest-expo`) + Testing Library for React Native.
- Linting/typing: ESLint (flat config) + TypeScript strict mode.

### Web Dashboard (`web/dashboard`)
- Framework/tooling: React 19 + Vite 5.
- Routing: `react-router-dom`.
- Charts: `chart.js` + `react-chartjs-2`.
- Notifications/UI helpers: `react-hot-toast`, `react-icons`, Tailwind CSS.
- Backend SDK: `@supabase/supabase-js`.
- i18n: `i18next` + `react-i18next`.

### Shared Package (`packages/shared`)
- Internal workspace package: `@nextself/shared`.
- Holds cross-platform config, Supabase service abstraction, shared types and utilities.

### Backend/Infra
- Supabase:
  - Postgres + RLS policies (extensive migration history).
  - Edge Functions (Deno) for secure server-side logic (AI proxying, session exchange, QR/session verification, billing/PDF operations).

---

## 3) Project Structure

```text
Project04/
├─ App.tsx                         # Mobile app root composition (providers, Sentry, navigator bootstrap)
├─ index.ts                        # Expo root registration
├─ package.json                    # Root workspace scripts/deps (mobile-focused)
├─ tsconfig.json                   # Root TS config (strict: true)
├─ eslint.config.mjs               # Root ESLint flat config
├─ PROJECT_MAP.md                  # Canonical architecture/context map for agents
│
├─ components/                     # Reusable RN UI building blocks
├─ screens/                        # RN screen-level features (auth, AI, health, profile, pro flows)
├─ navigation/                     # React Navigation stack/tab orchestration
├─ contexts/                       # Global providers (Supabase auth/session, language, currency, theme)
├─ hooks/                          # Reusable RN hooks
├─ services/                       # Domain/application services (AI, missions, store, payments, etc.)
├─ store/                          # Zustand stores
├─ utils/                          # Cross-cutting utilities (security, offline queue, deep linking, logging)
├─ locales/                        # Mobile translation dictionaries
├─ config/                         # UI theme config
├─ animations/                     # Animation definitions
├─ assets/                         # App static assets/icons/splash
├─ __tests__/                      # Jest tests (offline/security/webSession/utils)
│
├─ packages/
│  └─ shared/                      # Shared cross-platform package used by app + dashboard
│     └─ src/
│        ├─ config/                # Runtime env/config contract
│        ├─ services/              # Shared Supabase service abstraction
│        ├─ types/                 # Shared interfaces/types
│        └─ utils/                 # Shared validation/storage helpers
│
├─ supabase/
│  ├─ migrations/                  # DB schema, RLS, security/perf incremental migrations
│  └─ functions/                   # Edge Functions (Deno) for secure server-side endpoints
│
├─ web/
│  └─ dashboard/
│     ├─ src/
│     │  ├─ App.tsx               # Web route graph + session/role gate
│     │  ├─ index.tsx             # Web root render + providers
│     │  ├─ pages/                # Professional dashboard pages
│     │  ├─ components/           # Web shared components (layout, boundaries, modals)
│     │  ├─ lib/supabase.tsx      # Web Supabase client + query helpers
│     │  └─ locales/              # Web locale files
│     └─ package.json             # Web dashboard scripts/deps
│
├─ scripts/                        # Build/sanitize automation scripts
├─ tools/                          # Security/support tooling (e.g., secret scanning)
├─ patches/                        # patch-package fixes (e.g., vision camera patch)
├─ build_temp/                     # Generated/transpiled artifacts (not primary source)
└─ .github/workflows/              # CI checks (e.g., RLS check workflow)
```

---

## 4) Core Logic & Workflow

### A) Mobile Application Runtime Flow
1. Entry bootstraps via `index.ts` → `App.tsx`.
2. `App.tsx` initializes:
   - Notification background task registration.
   - Log filtering in dev.
   - Environment validation in production.
   - Sentry initialization and error boundary wrapping.
3. Provider tree order:
   - `SupabaseProvider` → `LanguageProvider` → `CurrencyProvider` → `ThemeProvider` → `AppNavigator`.
4. `AppNavigator`:
   - Runs splash + session check.
   - Routes unauthenticated users to auth stack.
   - Routes authenticated users to main tabs.
   - Applies role-based guard for professional routes using profile role from Zustand store.

### B) Authentication & Session Model
- Mobile session/auth:
  - Supabase auth lifecycle is managed in `contexts/SupabaseContext.tsx`.
  - Tracks `session`, `user`, loading state, ban state.
  - Subscribes to auth state changes.
  - Sign-out flow pauses offline queue, signs out, clears queue, then resets local auth state.
- Web session hardening:
  - `services/webSession.ts` supports token exchange to a Supabase Edge Function (`session-exchange`) to prefer cookie-based session behavior on web.
  - Includes proxy helper for credentialed server-mediated requests.
- Data access:
  - Shared `SupabaseService` singleton (`packages/shared/src/services/supabase.ts`) centralizes client setup, auth behavior, single-flight refresh handling, and many domain queries.

### C) Domain Service Layer Pattern
- UI screens call service singletons (e.g., AI, mission, store, water, payment services).
- Services call Supabase (tables/RPC/edge functions) and return normalized domain data.
- Security/validation utilities are applied in service layer for input sanitation and safer querying.

### D) Offline & Reliability Flow
- `utils/offlineService.ts`:
  - Encrypts and persists queued operations.
  - Monitors connectivity (`NetInfo`).
  - Replays queue with retry policy.
  - Supports pause/quiescence to avoid cross-user leakage during sign-out.

### E) AI Processing Flow
- Mobile AI entrypoint: `services/aiService.ts`.
- Calls `DeepSeekService` and parses/validates structured responses.
- Sensitive AI and policy-heavy prompts are pushed through Supabase Edge Functions (`supabase/functions/deepseek-chat`), which:
  - Enforce CORS and origin checks.
  - Validate Supabase bearer token.
  - Apply server-side prompt templates/role constraints.
  - Keep provider keys in Edge Function secrets (not client).

### F) Web Dashboard Flow
1. `web/dashboard/src/index.tsx` mounts app with router + error boundary + toast system.
2. `web/dashboard/src/App.tsx`:
   - Reads auth session.
   - Validates professional role from `profiles.user_type`.
   - Blocks non-authorized users.
   - Renders lazy-loaded route pages under a shared `Layout`.
3. Data layer is handled through `web/dashboard/src/lib/supabase.tsx` helper methods around Supabase client queries.

### G) Backend Workflow
- Supabase migrations define schema and incremental hardening (security/RLS/performance updates).
- Edge functions handle privileged server logic, including:
  - `deepseek-chat`
  - `session-exchange`
  - `calculate-monthly-billing`
  - `generate-mss-pdf`
  - `verify-qr-checkin`
  - `process-client-activation`
  - `moderate-image`

---

## 5) Key Rules & Patterns

### Architecture Pattern (Practical)
- Layered feature architecture:
  - Presentation: screens/components.
  - Application/domain: services + hooks + contexts/store.
  - Data/integration: Supabase client, Edge Functions, migration-backed DB.
- Shared kernel pattern via workspace package (`@nextself/shared`) to avoid duplication between platforms.

### State & Context Conventions
- Global app concerns use React Context (auth/session, language, currency, theme).
- Persisted auth/profile state uses Zustand with secure/platform-aware storage adapter.
- Service classes are frequently implemented as singletons (`getInstance()` pattern).

### Security & Platform Rules Observed
- Supabase sessions are not persisted in web local storage by default in shared service.
- Edge functions are used for sensitive token/AI operations.
- Input validation and SQL-injection safeguards exist in shared validation utilities.
- Offline queue is encrypted before persistence.
- Production environment checks enforce required secrets/settings.

### Internationalization & UX Patterns
- Trilingual localization is implemented (`en`, `tr`, `ru`) across mobile and dashboard.
- Theme and style tokens are centralized (theme config).
- Navigator uses role-guarded route access for professional modules.

### Naming/Organization Patterns
- Feature-oriented screen/service naming (`<Feature>Screen.tsx`, `<feature>Service.ts`).
- Utility and context modules grouped by cross-cutting concern.
- Clear separation between source (`components/`, `screens/`, `services/`) and generated/transpiled artifacts (`build_temp/`).

---

## 6) Current Status & Pending Tasks

### Implemented / Present
- End-to-end mobile app shell with extensive screen coverage across user and professional journeys.
- Professional web dashboard with route-level role gating and multiple operational pages.
- Shared cross-platform package for config, Supabase integration, and reusable types/utils.
- Supabase migration history with many security/RLS alignment passes.
- Edge function suite for AI, session exchange, moderation, billing, PDF generation, and verification workflows.
- Baseline test suite exists (`__tests__`) for utilities/security/offline/session behavior.

### Pending / Likely Next Tasks
- Web dashboard TypeScript debt cleanup:
  - Existing tracked TS errors in `web/dashboard/errors.txt` indicate unresolved typing issues across pages and lib helpers.
- Mobile monetization integration gap:
  - `screens/NutritionScreen.tsx` includes TODO for integrating rewarded ad SDK.
- Source-of-truth cleanup:
  - `build_temp/` mirrors source but should remain generated-only; ensure contributors edit canonical TS/TSX sources.
- Quality gates hardening:
  - Continue reducing lint/type warnings in security-sensitive files under strict ESLint rule set.
- Architecture consolidation opportunity:
  - Consider moving duplicated dashboard data contracts into `@nextself/shared` for stronger cross-client consistency.

