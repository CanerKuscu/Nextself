# 🏋️ NextSelf

**Wellness & Performance** — A comprehensive health, fitness, and nutrition mobile app powered by DeepSeek AI.

NextSelf, kullanıcıların sağlık, fitness ve beslenme hedeflerine ulaşmalarını sağlayan, gelişmiş yapay zeka özellikleriyle donatılmış, "hepsi bir arada" bir mobil uygulamadır. Hem iOS hem de Android cihazlarda çalışabilen bu proje, modern yazılım mimarisi prensipleri ve güncel teknolojiler kullanılarak inşa edilmiştir.

---

## ✨ Features / Özellikler

- 🤖 **AI Uzmanlar (Coach, Dietitian & Chef)** — DeepSeek tarafından desteklenen kişiselleştirilmiş fitness, beslenme tavsiyeleri ve yemek tarifleri.
- 📸 **Gelişmiş Biyomekanik Postür Analizi** — Cihazın kamerası ile form analizi, asimetri ölçümü ve düzeltme uyarıları.
- 🍽️ **Akıllı Besin Tarayıcı (Food Scanner)** — Yiyecekleri tarayarak kalori ve makro (protein, karbonhidrat, yağ) değerlerini otomatik çıkarma.
- 🏥 **Sağlık Entegrasyonları** — Apple HealthKit (iOS) ve Google Health Connect (Android) üzerinden uyku, adım, kalori ve nabız takibi.
- 🏆 **Dinamik Görev ve Oyunlaştırma** — Kullanıcıya özel yapay zeka destekli günlük/haftalık görevler ve XP bazlı lig sistemi.
- 👨‍⚕️ **Profesyoneller Portalı** — Gerçek diyetisyen ve antrenörler için müşteri yönetimi, program hazırlama ve iyzico entegrasyonlu ödeme sistemi.
- 💬 **Sohbet Sistemi** — Profesyoneller ve müşteriler arası gerçek zamanlı mesajlaşma (Supabase Edge Functions destekli).
- 🌙 **Tema ve Çoklu Dil** — Türkçe & İngilizce desteği, tam uyumlu Karanlık Mod (Dark Mode).

---

## 🏗️ Mimari ve Teknolojiler

- **Mobil Çatı:** React Native (v0.81), Expo (v54), TypeScript
- **Backend & Veritabanı:** Supabase, PostgreSQL, Edge Functions (Güvenli AI çağrıları için)
- **Durum Yönetimi (State):** Zustand (Global durum) ve React Query (Sunucu önbelleği)
- **Kullanıcı Arayüzü (UI):** TailwindCSS, Lottie Animasyonları, React Native Reanimated (60fps)
- **Gelir ve Performans:** RevenueCat (Abonelikler), Sentry (Hata takibi), Jest & Detox (Testler)

---

## 🚀 Quick Start (Hızlı Başlangıç)

```bash
# Bağımlılıkları yükleyin
npm install

# Çevre değişkenlerini ayarlayın
cp .env.example .env    # Gerekli API anahtarlarını .env dosyasına girin

# Uygulamayı başlatın
npx expo start
```

## 📖 Documentation
Daha detaylı mimari, API referansları ve dağıtım yönergeleri için [docs/README.md](docs/README.md) dosyasına göz atın.

## 🧪 Testing
```bash
npm test                 # Birim testleri (Jest)
npm run type-check       # TypeScript denetimi
npm run lint             # ESLint kod kontrolü
npm run e2e:android      # Detox ile E2E Testleri
```

## 🏗️ Build
```bash
npm run build:dev        # Geliştirme derlemesi
npm run build:preview    # Önizleme (Preview APK)
npm run build:production # Mağaza (Store) sürümü
```

## 📄 License
Private — All rights reserved.
