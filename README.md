# 🏋️ NextSelf

**Wellness & Performance** — A comprehensive health, fitness, and nutrition mobile app powered by DeepSeek AI.

NextSelf is an "all-in-one" mobile application equipped with advanced artificial intelligence features, enabling users to achieve their health, fitness, and nutrition goals. Designed to run seamlessly on both iOS and Android devices, this project is built using modern software architecture principles and cutting-edge technologies.

---

## ✨ Features

- 🤖 **AI Experts (Coach, Dietitian & Chef)** — Personalized fitness advice, nutrition plans, and healthy recipes powered by DeepSeek AI.
- 📸 **Advanced Biomechanical Posture Analysis** — Uses the device's camera for real-time form analysis, asymmetry measurement, and correction cues.
- 🍽️ **Smart Food Scanner** — Automatically extracts calorie and macro (protein, carbs, fat) values by scanning food images or descriptions.
- 🏥 **Health Integrations** — Sleep, step, calorie, and heart rate tracking via Apple HealthKit (iOS) and Google Health Connect (Android).
- 🏆 **Dynamic Missions & Gamification** — AI-generated daily/weekly personalized missions and an XP-based league system.
- 👨‍⚕️ **Professionals Portal** — Client management, program creation, and integrated payment system (iyzico) for real dietitians and personal trainers.
- 💬 **Chat System** — Real-time messaging between professionals and clients (powered by Supabase Edge Functions).
- 🌙 **Theming & Localization** — Full English & Turkish support, along with a perfectly adapted Dark Mode.

---

## 🏗️ Architecture & Technologies

- **Mobile Framework:** React Native (v0.81), Expo (v54), TypeScript
- **Backend & Database:** Supabase, PostgreSQL, Edge Functions (For secure AI API calls)
- **State Management:** Zustand (Global state) and React Query (Server state caching)
- **User Interface (UI):** TailwindCSS, Lottie Animations, React Native Reanimated (60fps)
- **Monetization & Performance:** RevenueCat (Subscriptions), Sentry (Error tracking), Jest & Detox (Testing)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env    # Fill in the required API keys in the .env file

# Start the application
npx expo start
```

## 📖 Documentation
For more detailed architecture overviews, API references, and deployment guidelines, please check out the [docs/README.md](docs/README.md) file.

## 🧪 Testing
```bash
npm test                 # Unit tests (Jest)
npm run type-check       # TypeScript compilation check
npm run lint             # ESLint code check
npm run e2e:android      # Detox E2E Tests
```

## 🏗️ Build
```bash
npm run build:dev        # Development build
npm run build:preview    # Preview APK
npm run build:production # Store release build (Production)
```

## 📄 License
Private — All rights reserved.
