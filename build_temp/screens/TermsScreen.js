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
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const useTranslation_1 = require("../hooks/useTranslation");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const theme_1 = require("../config/theme");
const agreementService_1 = require("../services/agreementService");
const supabase_1 = require("../services/supabase");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const TermsScreen = ({ navigation, route }) => {
    var _a, _b, _c;
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const section = ((_a = route.params) === null || _a === void 0 ? void 0 : _a.section) || 'terms';
    const fromAuth = ((_b = route.params) === null || _b === void 0 ? void 0 : _b.fromAuth) || false;
    const userId = (_c = route.params) === null || _c === void 0 ? void 0 : _c.userId;
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const [accepted, setAccepted] = (0, react_1.useState)(null);
    const [accepting, setAccepting] = (0, react_1.useState)(false);
    const [allAccepted, setAllAccepted] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        checkAcceptance();
    }, []);
    const checkAcceptance = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
            const currentUserId = userId || (user === null || user === void 0 ? void 0 : user.id);
            if (currentUserId) {
                const agreementService = agreementService_1.AgreementService.getInstance();
                if (fromAuth) {
                    // Check all agreements when coming from auth
                    const { allAccepted: all } = yield agreementService.hasAcceptedAll(currentUserId);
                    setAllAccepted(all);
                    setAccepted(all);
                }
                else {
                    const isAccepted = yield agreementService.hasAccepted(currentUserId, section);
                    setAccepted(isAccepted);
                }
            }
        }
        catch (_a) {
            setAccepted(false);
            setAllAccepted(false);
        }
    });
    const handleAccept = () => __awaiter(void 0, void 0, void 0, function* () {
        setAccepting(true);
        try {
            const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
            const currentUserId = userId || (user === null || user === void 0 ? void 0 : user.id);
            if (currentUserId) {
                const agreementService = agreementService_1.AgreementService.getInstance();
                if (fromAuth) {
                    // Accept all agreements when coming from auth
                    const result = yield agreementService.acceptAllRegistrationAgreements(currentUserId);
                    if (result.success) {
                        setAllAccepted(true);
                        setAccepted(true);
                        // Navigate to main app after accepting all
                        setTimeout(() => {
                            navigation.replace('Main');
                        }, 500);
                    }
                }
                else {
                    const result = yield agreementService.acceptAgreement(currentUserId, section);
                    if (result.success) {
                        setAccepted(true);
                    }
                }
            }
        }
        catch (err) {
            console.error('Accept agreement error:', err);
        }
        finally {
            setAccepting(false);
        }
    });
    const getContent = () => {
        switch (section) {
            // ═══════════════════════════════════════════════════════════════════
            // 1) KVKK AYDINLATMA METNİ — 7 Madde
            // ═══════════════════════════════════════════════════════════════════
            case 'kvkk':
                return {
                    title: 'KVKK Aydınlatma Metni',
                    content: isTurkish
                        ? `1. Veri Sorumlusunun Kimliği

NextSelf ("Uygulama"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmektedir. İşbu aydınlatma metni, KVKK'nın 10. maddesi uyarınca hazırlanmıştır.

İletişim: app.nextself@gmail.com

2. İşlenen Kişisel Veriler

Uygulama kapsamında aşağıdaki kişisel verileriniz işlenmektedir:

• Kimlik Verileri: Ad, soyad, kullanıcı adı, doğum tarihi, cinsiyet
• İletişim Verileri: E-posta adresi
• Fiziksel Veriler: Boy, kilo, vücut ölçüleri, vücut yağ oranı
• Sağlık Verileri (Özel Nitelikli): Antrenman geçmişi, beslenme alışkanlıkları, kalori takibi, su tüketimi, adım sayısı, uyku düzeni, sağlık hedefleri
• Kullanım Verileri: Uygulama içi etkileşimler, tercihler, cihaz bilgileri
• Biyometrik Veriler: Postür analizi kapsamında kamera ile elde edilen eklem açıları ve vücut duruş koordinatları (cihaz üzerinde işlenir, yalnızca anonim koordinatlar AI'a gönderilir)

ÖNEMLİ: Boy, kilo, beslenme alışkanlıkları, antrenman geçmişi, sağlık hedefleri ve biyometrik veriler gibi veriler KVKK kapsamında "Özel Nitelikli Kişisel Veri (Sağlık Verisi)" kategorisindedir. Bu verilerin işlenmesi için ayrıca Açık Rıza Metni'ni onaylamanız gerekmektedir.

3. İşleme Amaçları

Kişisel verileriniz aşağıdaki amaçlarla KVKK'nın 5. ve 6. maddelerine uygun olarak işlenmektedir:

• AI tabanlı kişiselleştirilmiş antrenman ve beslenme programlarının oluşturulması
• Yapay zeka algoritmalarıyla otomatik program ve görev üretilmesi (AI Coach, AI Dietitian, AI Chef, AI Program Creator)
• Postür analizi ve vücut formu değerlendirmesi
• Yemek fotoğraflarından besin değeri analizi (Food Scanner)
• Seçtiğiniz profesyonellerle (Personal Trainer / Diyetisyen) veri paylaşımının sağlanması
• Gamification sistemi (lig, XP, görevler, coin) kapsamında kullanıcı deneyiminin kişiselleştirilmesi
• Topluluk özellikleri (forum, sıralama, başarılar)
• Uygulama performansının iyileştirilmesi ve hata tespiti
• Yasal yükümlülüklerin yerine getirilmesi

4. İşlenen Kişisel Verilerin Aktarımı

Kişisel verileriniz aşağıdaki alıcı gruplarına aktarılmaktadır:

Yurt Dışı Aktarımları:
• Supabase (AWS/Google Cloud altyapısı, ABD/AB bölgeleri) — Veri saklama ve yönetim (Row Level Security ile korunur)
• DeepSeek AI (Çin, Hangzhou) — Yapay zeka model sağlayıcısı (veriler anonimleştirilerek gönderilir; kullanıcı kimlik bilgisi, fotoğraf, IP adresi iletilmez)
• Sentry (ABD) — Hata izleme ve performans takibi
• iyzico (Türkiye) — Ödeme işleme (kredi kartı bilgileri yalnızca iyzico tarafından işlenir, NextSelf sunucularında saklanmaz; 3D Secure destekli)

Supabase sunucuları Türkiye dışında konumlandırıldığından, kişisel verilerinizin yurt dışına aktarımı KVKK'nın 9. maddesi uyarınca açık rızanıza dayanmaktadır.

Uluslararası Genişleme Planı:
NextSelf'in ileride Birleşik Arap Emirlikleri (Dubai) ve diğer uluslararası bölgelere genişlemesi planlanmaktadır. Bu durumda:
• Verileriniz BAE'deki sunuculara aktarılabilir (DIFC Data Protection Law No. 5/2020 uyumlu)
• BAE Federal Veri Koruma Kanunu (Federal Decree-Law No. 45/2021 — PDPL) kapsamındaki yükümlülükler de ayrıca yerine getirilecektir
• Yeni aktarım bölgeleri hakkında güncellenmiş aydınlatma metni ve ek açık rıza alınacaktır
• Mevcut KVKK hakları ve güvenlik standartları tüm bölgelerde geçerliliğini koruyacaktır

Verileriniz, açık rızanız olmaksızın hiçbir üçüncü taraf reklam şirketine satılmaz, kiralanmaz veya paylaşılmaz.

5. Veri Toplamanın Yöntemi ve Hukuki Sebebi

Verileriniz uygulama üzerinden tamamen dijital ve otomatik yollarla toplanmaktadır.

Hukuki Sebepler:
• Genel kişisel veriler: "Bir sözleşmenin kurulması veya ifası için gerekli olması" (KVKK md. 5/2-c)
• Sağlık verileri: "İlgili kişinin açık rızası" (KVKK md. 6/2)
• Yurt dışı aktarım: "İlgili kişinin açık rızası" (KVKK md. 9/1)
• Biyometrik veriler: "İlgili kişinin açık rızası" (KVKK md. 6/2) — İşleme öncesinde ayrıca anlık onam (Just-in-Time Consent) modalı ile ek rıza alınır

6. Veri Saklama Süresi

Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde:
• Kişisel verileriniz 30 gün içinde sistemden kalıcı olarak imha edilir
• Yedek sistemlerden 90 gün içinde silinir
• Anonim istatistiki veriler korunabilir (kişisel veri niteliği taşımaz)
• Biyometrik veriler (postür koordinatları vb.) analiz tamamlandıktan sonra cihazdan otomatik silinir, sunucuda saklanmaz
• Yasal yükümlülükler kapsamında saklanması gereken veriler ilgili mevzuatta belirtilen süre boyunca muhafaza edilir

7. İlgili Kişinin Hakları (KVKK Madde 11)

KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:

a) Kişisel verilerinizin işlenip işlenmediğini öğrenme
b) İşlenmiş ise buna ilişkin bilgi talep etme
c) İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme
d) Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
e) Eksik veya yanlış işlenmiş ise düzeltilmesini isteme
f) KVKK md. 7 kapsamındaki şartlar çerçevesinde silinmesini veya yok edilmesini isteme
g) (d) ve (e) bentleri uyarınca yapılan işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme
h) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme
ı) Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme

Başvuru Kanalları:
• E-posta: app.nextself@gmail.com
• Uygulama İçi: Ayarlar > Gizlilik > Veri Talebi
• Yanıt süresi: 30 gün (KVKK md. 13)`
                        : `1. Identity of the Data Controller

NextSelf ("Application") acts as the data controller under the Personal Data Protection Law No. 6698 ("KVKK"). This disclosure text has been prepared pursuant to Article 10 of KVKK.

Contact: app.nextself@gmail.com

2. Personal Data Processed

The following personal data is processed within the scope of the Application:

• Identity Data: Name, surname, username, date of birth, gender
• Contact Data: Email address
• Physical Data: Height, weight, body measurements, body fat percentage
• Health Data (Special Category): Workout history, dietary habits, calorie tracking, water consumption, step count, sleep patterns, health goals
• Usage Data: In-app interactions, preferences, device information
• Biometric Data: Joint angles and body posture coordinates obtained via camera for posture analysis (processed on device, only anonymous coordinates sent to AI)

IMPORTANT: Data such as height, weight, dietary habits, workout history, health goals, and biometric data are classified as "Special Category Personal Data (Health Data)" under KVKK. A separate Explicit Consent Form must be approved for processing these data.

3. Processing Purposes

Your personal data is processed in accordance with Articles 5 and 6 of KVKK for the following purposes:

• Creating AI-powered personalized workout and nutrition programs
• Generating automatic programs and missions with AI algorithms (AI Coach, AI Dietitian, AI Chef, AI Program Creator)
• Posture analysis and body form evaluation
• Nutritional value analysis from food photographs (Food Scanner)
• Sharing data with professionals you select (Personal Trainer / Dietitian)
• Personalizing user experience within the gamification system (leagues, XP, missions, coins)
• Community features (forum, rankings, achievements)
• Improving application performance and error detection
• Fulfilling legal obligations

4. Transfer of Processed Personal Data

Your personal data is transferred to the following recipient groups:

International Transfers:
• Supabase (AWS/Google Cloud infrastructure, US/EU regions) — Data storage and management (protected with Row Level Security)
• DeepSeek AI (China, Hangzhou) — AI model provider (data sent after anonymization; user identity, photographs, IP addresses are NOT transmitted)
• Sentry (US) — Error tracking and performance monitoring
• iyzico (Turkey) — Payment processing (credit card information processed only by iyzico, not stored on NextSelf servers; 3D Secure enabled)

Since Supabase servers are located outside Turkey, the international transfer of your personal data is based on your explicit consent pursuant to Article 9 of KVKK.

International Expansion Plan:
NextSelf plans to expand to the United Arab Emirates (Dubai) and other international regions in the future. In this case:
• Your data may be transferred to servers in the UAE (DIFC Data Protection Law No. 5/2020 compliant)
• Obligations under the UAE Federal Data Protection Law (Federal Decree-Law No. 45/2021 — PDPL) will also be fulfilled
• Updated disclosure text and additional explicit consent will be obtained for new transfer regions
• Existing KVKK rights and security standards will remain valid across all regions

Your data will not be sold, rented, or shared with any third-party advertising company without your explicit consent.

5. Method and Legal Basis of Data Collection

Your data is collected entirely through digital and automatic means via the application.

Legal Bases:
• General personal data: "Necessary for the establishment or performance of a contract" (KVKK Art. 5/2-c)
• Health data: "Explicit consent of the data subject" (KVKK Art. 6/2)
• International transfer: "Explicit consent of the data subject" (KVKK Art. 9/1)
• Biometric data: "Explicit consent of the data subject" (KVKK Art. 6/2) — Additional Just-in-Time Consent modal is presented before processing

6. Data Retention Period

Your personal data is stored as long as your account is active. When you delete your account:
• Your personal data will be permanently destroyed from the system within 30 days
• Deleted from backup systems within 90 days
• Anonymous statistical data may be retained (does not constitute personal data)
• Biometric data (posture coordinates, etc.) is automatically deleted from the device after analysis; not stored on servers
• Data required to be stored under legal obligations will be retained for the period specified in the relevant legislation

7. Data Subject Rights (KVKK Article 11)

Under Article 11 of KVKK, you have the following rights:

a) Learning whether your personal data is being processed
b) Requesting information about processing if processed
c) Learning the purpose of processing and whether data is used in accordance with its purpose
d) Knowing the third parties to whom data is transferred domestically or internationally
e) Requesting correction if data is processed incompletely or incorrectly
f) Requesting deletion or destruction under the conditions set forth in KVKK Art. 7
g) Requesting notification of corrections/deletions to third parties to whom data was transferred
h) Objecting to outcomes arising from analysis of processed data exclusively through automated systems
i) Requesting compensation for damages caused by unlawful processing of personal data

Contact Channels:
• Email: app.nextself@gmail.com
• In-App: Settings > Privacy > Data Request
• Response time: 30 days (KVKK Art. 13)`,
                };
            // ═══════════════════════════════════════════════════════════════════
            // 2) AÇIK RIZA METNİ — 5 Madde
            // ═══════════════════════════════════════════════════════════════════
            case 'consent':
                return {
                    title: isTurkish ? 'Açık Rıza Metni' : 'Explicit Consent Form',
                    content: isTurkish
                        ? `1. Özel Nitelikli Kişisel Verilerin İşlenmesi

6698 sayılı KVKK'nın 6. maddesi uyarınca, aşağıdaki özel nitelikli kişisel verilerimin işlenmesine açık rızam ile onay veriyorum:

İşlenen Özel Nitelikli Veriler:
• Boy, kilo, vücut ölçüleri, vücut yağ oranı
• Beslenme alışkanlıkları, kalori takibi, makro değerleri
• Antrenman geçmişi, egzersiz performansı
• Su tüketimi, adım sayısı, aktivite verileri
• Uyku düzeni ve sağlık hedefleri
• Apple HealthKit / Google Health Connect entegrasyon verileri (yalnızca kullanıcı izni ile)
• Biyometrik veriler: Postür analizi kapsamında kamera ile elde edilen eklem açıları ve vücut duruş koordinatları

İşleme Amaçları:
• AI Coach ile kişiselleştirilmiş fitness programları
• AI Dietitian ile beslenme planları
• AI Chef ile makro hedeflerine uygun tarifler
• AI Program Creator ile otomatik antrenman programları
• Postür/form analizi ile hareket düzeltme önerileri
• Food Scanner ile fotoğraftan besin değeri tespiti
• Seçilen profesyonellerle (PT / Diyetisyen) paylaşım
• Gamification sistemi (lig, XP, görev, günlük streak)

2. Yurt Dışına Veri Aktarımı Rızası

KVKK'nın 9. maddesi uyarınca, kişisel verilerimin aşağıdaki yurt dışı hizmet sağlayıcılarına aktarılmasına açık rızam ile onay veriyorum:

• Supabase (ABD/AB bölgeleri) — Veritabanı ve kullanıcı kimlik doğrulama (Row Level Security ile korunur)
• DeepSeek AI (Çin, Hangzhou) — Yapay zeka modeli sağlayıcısı (veriler anonimleştirilerek gönderilir)
• Sentry (ABD) — Hata izleme ve performans takibi (kullanıcı kimliği gönderilmez)
• iyzico (Türkiye) — Ödeme işleme altyapısı (kredi kartı bilgileri yalnızca iyzico tarafından işlenir; 3D Secure ve PCI DSS uyumlu)

Güvenlik Tedbirleri:
• Tüm veri aktarımları SSL/TLS 1.3 şifreleme ile korunur
• DeepSeek'e gönderilen veriler anonimleştirilerek kişisel veri niteliği ortadan kaldırılır (kullanıcı adı, e-posta, IP adresi, fotoğraf gönderilmez)
• Supabase'de Row Level Security (RLS) politikaları ile kullanıcılar yalnızca kendi verilerine erişebilir
• Meta-veri sıyırma uygulanarak HTTP header'larında tanımlayıcı bilgi iletilmez

3. Yapay Zeka ile Otomatik Karar Alma Rızası

NextSelf uygulamasında yapay zeka (DeepSeek AI) ile otomatik olarak oluşturulan:
• Antrenman programları ve egzersiz önerileri
• Beslenme planları ve kalori hedefleri
• Günlük/haftalık görevler ve zorluk seviyeleri
• Postür analizi sonuçları ve düzeltme önerileri
• Yemek fotoğraflarından besin değeri tahminleri

gibi kararların üretilmesine açık rızam ile onay veriyorum.

ÖNEMLİ UYARILAR:
• AI tarafından üretilen tüm içerikler yalnızca bilgilendirme ve öneri niteliğindedir
• Hiçbir AI yanıtı tıbbi tavsiye, teşhis veya tedavi yerine geçmez
• Bireysel sağlık durumunuza göre sonuçları kontrol ediniz
• Herhangi bir programa başlamadan önce sağlık profesyoneline danışınız
• AI halüsinasyonu nedeniyle hatalı bilgi üretilebilir; %100 doğruluk garanti edilmez

4. Biyometrik ve Görsel Veri İşleme Rızası

Aşağıdaki biyometrik ve görsel veri işleme faaliyetlerine açık rızam ile onay veriyorum:

a) Postür Analizi (PostureAnalysisScreen):
   • Kamera ile vücut duruşunun görüntülenmesi
   • Eklem açıları ve vücut koordinatlarının cihaz üzerinde hesaplanması
   • Yalnızca anonim koordinat verilerinin (ör: lumbar: 32°, knee: 88°, shoulder: 15°) DeepSeek AI'a gönderilmesi
   • Ham fotoğraf/video verisi DeepSeek'e gönderilmez, sunucuda saklanmaz
   • İşleme öncesinde ayrıca anlık onam (Just-in-Time Consent) modalı gösterilir

b) Yemek Fotoğrafı Tarama (FoodScannerScreen):
   • Kamera veya galeriden alınan yemek fotoğrafının AI ile analizi
   • Besin değeri, kalori, makro ve mikro besin tespiti
   • Fotoğraf yalnızca analiz süresince işlenir, kalıcı saklanmaz
   • İşleme öncesinde ayrıca anlık onam modalı gösterilir

c) Vücut/Fizik Analizi (AICoachScreen):
   • Fotoğraf ile kas grupları ve fiziksel gelişim analizi
   • Güçlü ve geliştirilmesi gereken bölgelerin tespiti
   • Kişiselleştirilmiş antrenman önerilerinin oluşturulması
   • Fotoğraf yalnızca analiz süresince işlenir, kalıcı saklanmaz
   • İşleme öncesinde ayrıca anlık onam modalı gösterilir

d) Barkod Tarama (BarcodeScannerScreen):
   • Kamera ile ürün barkodunun okunması
   • OpenFoodFacts vb. veritabanlarından ürün bilgisi çekilmesi
   • İşleme öncesinde ayrıca anlık onam modalı gösterilir

NOT: Tüm biyometrik veri işleme faaliyetleri için KVKK md. 6 kapsamında burada verilen genel onaya ek olarak, her özelliğin ilk kullanımında ayrıca anlık onam (Just-in-Time Consent) modalı gösterilir. Bu onam 24 saat geçerlidir ve süre sonunda yeniden istenir.

5. Rızanın Geri Alınması

KVKK'nın 7. maddesi uyarınca, işbu metinle verdiğim açık rızamı her zaman, herhangi bir gerekçe göstermeksizin geri alma hakkına sahibim.

Rızanın geri alınması durumunda:
• Geri alma öncesinde gerçekleştirilen işlemler hukuka uygunluğunu korur
• Verileriniz 30 gün içinde sistemden silinir
• Bazı uygulama özellikleri (AI tabanlı özellikler, biyometrik analizler) kullanılamaz hale gelebilir
• Geri alma talebi derhal işleme alınır

Rıza Geri Alma Kanalları:
• Uygulama İçi: Ayarlar > Gizlilik > Veri İşleme İzni
• E-posta: app.nextself@gmail.com
• Yanıt süresi: En geç 30 gün`
                        : `1. Processing of Sensitive Personal Data

Pursuant to Article 6 of KVKK (Law No. 6698), I hereby give my explicit consent for the processing of the following special category personal data:

Special Category Data Processed:
• Height, weight, body measurements, body fat percentage
• Dietary habits, calorie tracking, macro values
• Workout history, exercise performance
• Water consumption, step count, activity data
• Sleep patterns and health goals
• Apple HealthKit / Google Health Connect integration data (only with user permission)
• Biometric data: Joint angles and body posture coordinates obtained via camera for posture analysis

Processing Purposes:
• Personalized fitness programs with AI Coach
• Nutrition plans with AI Dietitian
• Macro-targeted recipes with AI Chef
• Automated workout programs with AI Program Creator
• Movement correction suggestions with posture/form analysis
• Nutritional value detection from food photos with Food Scanner
• Sharing with selected professionals (PT / Dietitian)
• Gamification system (leagues, XP, missions, daily streaks)

2. Consent for International Data Transfer

Pursuant to Article 9 of KVKK, I hereby give my explicit consent for the transfer of my personal data to the following international service providers:

• Supabase (US/EU regions) — Database and user authentication (protected with Row Level Security)
• DeepSeek AI (China, Hangzhou) — AI model provider (data sent after anonymization)
• Sentry (US) — Error tracking and performance monitoring (user identity not transmitted)
• iyzico (Turkey) — Payment processing infrastructure (credit card information processed only by iyzico; 3D Secure and PCI DSS compliant)

Security Measures:
• All data transfers protected with SSL/TLS 1.3 encryption
• Data sent to DeepSeek is anonymized, removing personal data characteristics (username, email, IP address, photos are NOT sent)
• Row Level Security (RLS) policies on Supabase ensure users can only access their own data
• Meta-data stripping applied — no identifying information transmitted in HTTP headers

3. Consent for AI-Based Automated Decision Making

I hereby give my explicit consent for the production of the following automatically generated decisions by AI (DeepSeek AI) in the NextSelf application:
• Workout programs and exercise recommendations
• Nutrition plans and calorie targets
• Daily/weekly missions and difficulty levels
• Posture analysis results and correction suggestions
• Nutritional value estimates from food photographs

IMPORTANT WARNINGS:
• All AI-generated content is informational and advisory only
• No AI response replaces medical advice, diagnosis, or treatment
• Review results according to your individual health condition
• Consult a health professional before starting any program
• AI hallucination may produce inaccurate information; 100% accuracy is not guaranteed

4. Biometric & Visual Data Processing Consent

I hereby give my explicit consent for the following biometric and visual data processing activities:

a) Posture Analysis (PostureAnalysisScreen):
   • Viewing body posture via camera
   • Calculating joint angles and body coordinates on device
   • Sending only anonymous coordinate data (e.g., lumbar: 32°, knee: 88°, shoulder: 15°) to DeepSeek AI
   • Raw photo/video data is NOT sent to DeepSeek, NOT stored on servers
   • A Just-in-Time Consent modal is shown before processing

b) Food Photo Scanning (FoodScannerScreen):
   • Analyzing food photos from camera or gallery with AI
   • Detecting nutritional values, calories, macro and micro nutrients
   • Photos processed only during analysis, not permanently stored
   • A Just-in-Time Consent modal is shown before processing

c) Body/Physique Analysis (AICoachScreen):
   • Analyzing muscle groups and physical development via photo
   • Identifying strengths and areas for improvement
   • Creating personalized training recommendations
   • Photos processed only during analysis, not permanently stored
   • A Just-in-Time Consent modal is shown before processing

d) Barcode Scanning (BarcodeScannerScreen):
   • Reading product barcodes via camera
   • Retrieving product information from databases such as OpenFoodFacts
   • A Just-in-Time Consent modal is shown before processing

NOTE: In addition to the general consent given here under KVKK Art. 6 for all biometric data processing activities, a separate Just-in-Time Consent modal is shown at the first use of each feature. This consent is valid for 24 hours and is re-requested after expiration.

5. Withdrawal of Consent

Pursuant to Article 7 of KVKK, I have the right to withdraw the explicit consent given herein at any time, without providing any reason.

In case of consent withdrawal:
• Processing performed prior to withdrawal retains its lawfulness
• Your data will be deleted from the system within 30 days
• Some application features (AI-based features, biometric analyses) may become unavailable
• Withdrawal request is processed immediately

Consent Withdrawal Channels:
• In-App: Settings > Privacy > Data Processing Permission
• Email: app.nextself@gmail.com
• Response time: Maximum 30 days`,
                };
            // ═══════════════════════════════════════════════════════════════════
            // 3) GİZLİLİK POLİTİKASI — 7 Madde
            // ═══════════════════════════════════════════════════════════════════
            case 'privacy':
                return {
                    title: isTurkish ? 'Gizlilik Politikası' : 'Privacy Policy',
                    content: isTurkish
                        ? `1. Veri Güvenliği Tedbirleri

NextSelf, kişisel verilerinizi en üst düzey güvenlik standartlarına uygun olarak korumaktadır:

Teknik Tedbirler:
• Supabase Row Level Security (RLS): Her kullanıcı yalnızca kendi verilerine erişebilir
• AES-256 Şifreleme: Hassas veriler depolama sırasında şifrelenir
• SSL/TLS 1.3: Tüm veri iletişimi şifrelenmiş kanallar üzerinden gerçekleşir
• API Key Güvenliği: Anahtarlar environment variable'larda saklanır, kod içinde bulunmaz
• Rate Limiting: API isteklerine hız sınırlaması uygulanır
• Input Validation: Tüm kullanıcı girdileri doğrulanır ve temizlenir

İdari Tedbirler:
• Minimum yetki prensibi uygulanır
• Düzenli güvenlik denetimleri yapılır
• Veri ihlali prosedürleri tanımlanmıştır
• Personel gizlilik eğitimleri verilmektedir

2. Toplanan Sağlık Verileri

Uygulama kapsamında toplanan sağlık verileri KVKK md. 6 kapsamında "Özel Nitelikli Kişisel Veri" olarak sınıflandırılmaktadır:

• Fiziksel ölçümler (boy, kilo, vücut yağ oranı, kas kitlesi)
• Beslenme verileri (kalori, protein, karbonhidrat, yağ takibi)
• Aktivite verileri (adım sayısı, aktif dakika, kalori yakımı)
• Su tüketim verileri
• Uyku düzeni (süre, kalite)
• Antrenman geçmişi ve performans metrikleri
• Sağlık hedefleri ve ilerleme kayıtları
• Biyometrik veriler (eklem açıları, vücut duruş koordinatları — yalnızca analiz sırasında)

Bu verilerin işlenmesi için ayrıca "Açık Rıza Metni" onayınız alınmaktadır.

3. Üçüncü Taraf Entegrasyonlar

NextSelf aşağıdaki üçüncü taraf hizmetleri ile entegre çalışmaktadır:

a) Apple HealthKit / Google Health Connect:
• Yalnızca kullanıcının açıkça izin verdiği veri kategorileri
• Kullanıcı izni her zaman cihaz ayarlarından iptal edilebilir
• HealthKit verileri DeepSeek AI'a gönderilmez

b) DeepSeek AI (Yapay Zeka):
• Yalnızca anonimleştirilerek veri gönderilir
• Kullanıcı kimlik bilgisi (ad, e-posta, user_id) iletilmez
• Fotoğraf/video ham verisi gönderilmez; yalnızca metin veya sayısal koordinatlar
• Meta-veri sıyırma uygulanır (IP, User-Agent, Referer gönderilmez)
• Her istek bağımsızdır; oturum/konuşma takibi yapılmaz

c) Sentry (Hata İzleme):
• Yalnızca hata logları ve performans metrikleri
• Kişisel sağlık verileri Sentry'ye gönderilmez

d) iyzico (Ödeme):
• Kredi kartı bilgileri yalnızca iyzico tarafından işlenir
• NextSelf sunucularında kart bilgisi saklanmaz
• PCI DSS ve 3D Secure uyumlu altyapı
• Türkiye merkezli lisanslı ödeme kuruluşu (BDDK)

Verileriniz hiçbir reklam ağıyla paylaşılmaz. Verileriniz üçüncü taraflara satılmaz.

4. Yurt Dışına Veri Aktarımı

Verilerinizin aktarıldığı yurt dışı lokasyonlar:

• Supabase: AWS (us-east-1) veya Google Cloud (europe-west-1) — AES-256, RLS, yedekleme
• DeepSeek: Çin (Hangzhou) — Yalnızca anonim veri, TLS 1.3
• Sentry: ABD — Yalnızca hata logları
• iyzico: Türkiye — PCI DSS ve 3D Secure uyumlu ödeme işleme (BDDK lisanslı)

BAE/Dubai Genişleme:
• Ek olarak DIFC (Dubai International Financial Centre) ve ADGM sunucuları kullanılabilir
• BAE PDPL (Federal Law No. 45/2021) uyumluluğu sağlanır
• Anonimleştirilmiş veri, BAE PDPL kapsamında "kişisel veri" sayılmaz (Madde 2/1 istisnası)

Tüm yurt dışı aktarımlar KVKK md. 9 uyarınca açık rızanıza dayanmaktadır.

5. Veri Saklama ve İmha Politikası

Veri Saklama Süreleri:
• Hesap verileri: Hesap aktifken saklanır
• İşlem logları: 12 ay
• Hata logları (Sentry): 90 gün
• Ödeme kayıtları: Yasal süre (10 yıl — VUK md. 253)
• Biyometrik veriler: Analiz sonrası derhal silinir (geçici işleme)

Hesap Silme Durumunda:
• Kişisel veriler 30 gün içinde kalıcı olarak imha edilir
• Yedek sistemlerden 90 gün içinde silinir
• Anonim istatistiki veriler korunabilir
• Yasal zorunluluk verileri ilgili süre boyunca saklanır
• İmha sertifikası talep üzerine sunulur

6. Çerez ve İzleme Teknolojileri

NextSelf Mobil Uygulama:
• Üçüncü taraf çerez kullanılmaz
• Reklam izleme (advertising tracking) yapılmaz
• Yalnızca Sentry hata izleme sistemi aktiftir
• IDFA / Advertising ID toplanmaz

NextSelf Web Dashboard:
• Yalnızca oturum yönetimi için temel çerezler kullanılır
• Analitik veya reklam çerezi yoktur

7. Çocukların Gizliliği (COPPA / KVKK)

NextSelf, 13 yaş ve üzeri kullanıcılar için tasarlanmıştır.

• 13 yaş altı bireylerin kişisel verileri bilerek toplanmaz
• 13 yaş altı olduğu tespit edilen kullanıcıların verileri derhal ve otomatik olarak silinir
• 13-18 yaş arası kullanıcılar için veli/vasi gözetiminde kullanım önerilir
• Yaş doğrulama mekanizması kayıt ekranında uygulanır`
                        : `1. Data Security Measures

NextSelf protects your personal data in accordance with the highest security standards:

Technical Measures:
• Supabase Row Level Security (RLS): Each user can only access their own data
• AES-256 Encryption: Sensitive data encrypted during storage
• SSL/TLS 1.3: All data communication via encrypted channels
• API Key Security: Keys stored in environment variables, not in code
• Rate Limiting: API requests subject to rate limits
• Input Validation: All user inputs validated and sanitized

Administrative Measures:
• Principle of least privilege applied
• Regular security audits conducted
• Data breach procedures defined
• Personnel confidentiality training provided

2. Health Data Collected

Health data collected within the Application is classified as "Special Category Personal Data" under KVKK Article 6:

• Physical measurements (height, weight, body fat percentage, muscle mass)
• Nutrition data (calorie, protein, carbohydrate, fat tracking)
• Activity data (step count, active minutes, calorie burn)
• Water consumption data
• Sleep patterns (duration, quality)
• Workout history and performance metrics
• Health goals and progress records
• Biometric data (joint angles, body posture coordinates — only during analysis)

Separate "Explicit Consent Form" is obtained for processing this data.

3. Third-Party Integrations

NextSelf works with the following third-party services:

a) Apple HealthKit / Google Health Connect:
• Only data categories explicitly permitted by the user
• User permission can always be revoked from device settings
• HealthKit data is NOT sent to DeepSeek AI

b) DeepSeek AI (Artificial Intelligence):
• Data sent only after anonymization
• User identity information (name, email, user_id) NOT transmitted
• Raw photo/video data NOT sent; only text or numerical coordinates
• Meta-data stripping applied (IP, User-Agent, Referer NOT sent)
• Each request is independent; no session/conversation tracking

c) Sentry (Error Tracking):
• Only error logs and performance metrics
• Personal health data NOT sent to Sentry

d) iyzico (Payments):
• Credit card information processed only by iyzico
• Card information NOT stored on NextSelf servers
• PCI DSS and 3D Secure compliant infrastructure
• Licensed Turkish payment institution (BDDK regulated)

Your data is never shared with any advertising network. Your data is never sold to third parties.

4. International Data Transfer

International locations where your data is transferred:

• Supabase: AWS (us-east-1) or Google Cloud (europe-west-1) — AES-256, RLS, backups
• DeepSeek: China (Hangzhou) — Anonymous data only, TLS 1.3
• Sentry: US — Error logs only
• iyzico: Turkey — PCI DSS and 3D Secure compliant payment processing (BDDK licensed)

UAE/Dubai Expansion:
• Additionally, DIFC (Dubai International Financial Centre) and ADGM servers may be used
• UAE PDPL (Federal Law No. 45/2021) compliance ensured
• Anonymized data is not considered "personal data" under UAE PDPL (Article 2/1 exception)

All international transfers are based on your explicit consent pursuant to KVKK Art. 9.

5. Data Retention and Destruction Policy

Data Retention Periods:
• Account data: Stored while account is active
• Transaction logs: 12 months
• Error logs (Sentry): 90 days
• Payment records: Legal period (10 years — Turkish Tax Law Art. 253)
• Biometric data: Deleted immediately after analysis (temporary processing)

Upon Account Deletion:
• Personal data permanently destroyed within 30 days
• Removed from backup systems within 90 days
• Anonymous statistical data may be retained
• Legal obligation data retained for required period
• Destruction certificate provided upon request

6. Cookies and Tracking Technologies

NextSelf Mobile App:
• No third-party cookies used
• No advertising tracking
• Only Sentry error tracking system active
• IDFA / Advertising ID not collected

NextSelf Web Dashboard:
• Only essential cookies for session management
• No analytics or advertising cookies

7. Children's Privacy (COPPA / KVKK)

NextSelf is designed for users aged 13 and above.

• Personal data from individuals under 13 is not knowingly collected
• Data from users identified as under 13 is immediately and automatically deleted
• Parental/guardian supervision recommended for users aged 13-18
• Age verification mechanism implemented on registration screen`,
                };
            // ═══════════════════════════════════════════════════════════════════
            // 4) ABONELİK VE İADE POLİTİKASI — 7 Madde
            // ═══════════════════════════════════════════════════════════════════
            case 'subscription':
                return {
                    title: isTurkish ? 'Abonelik ve İade Politikası' : 'Subscription & Refund Policy',
                    content: isTurkish
                        ? `1. Hizmet Sağlayıcı Bilgileri

Hizmet Adı: NextSelf
Hizmet Türü: Dijital fitness ve sağlık uygulaması (SaaS — Software as a Service)
İletişim: app.nextself@gmail.com
Uygulanacak Hukuk: 6502 Sayılı Tüketicinin Korunması Hakkında Kanun, Mesafeli Sözleşmeler Yönetmeliği

2. Abonelik Planları

Ücretsiz Plan (Free):
• Temel antrenman takibi ve kayıt
• Sınırlı AI Coach erişimi (günlük 3 soru)
• Günlük görev ve XP sistemi
• Topluluk forum erişimi
• Temel besin takibi

Premium Plan (Aylık / Yıllık):
• Sınırsız AI Coach, AI Dietitian, AI Chef erişimi
• AI Program Creator — Otomatik program oluşturma
• Postür Analizi — Hareket formu değerlendirmesi
• Food Scanner — Fotoğraftan besin değeri analizi
• Gelişmiş analitik ve grafikler
• Öncelikli müşteri desteği
• Reklamsız deneyim
• Tüm gamification özellikleri (ligler, görevler, rozetler)

3. Ön Bilgilendirme (6502 Sayılı Kanun — Mesafeli Satış)

İşbu abonelik, 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında bir mesafeli satış sözleşmesidir.

Hizmet Özellikleri:
• AI destekli kişiselleştirilmiş fitness ve beslenme programları
• Dijital içerik sunumu (anlık erişim)
• Otomatik yenilenen abonelik modeli

Ödeme Yöntemi:
• Kredi kartı / Banka kartı (iyzico altyapısı ile güvenli ödeme — 3D Secure destekli)
• Ödemeler PCI DSS uyumlu altyapıda işlenir
• Kart bilgileri NextSelf sunucularında saklanmaz (yalnızca iyzico tarafından işlenir)

Dijital İçerik Onayı:
• Her abonelik işleminde ayrı Mesafeli Satış Sözleşmesi (MSS) düzenlenir
• Alıcı bilgileri, fiyat, KDV ve cayma hakkı koşulları MSS'de yer alır

4. Cayma Hakkı ve İstisnalar (14 Gün Kuralı)

6502 Sayılı Kanun'un 48. maddesi ve Mesafeli Sözleşmeler Yönetmeliği uyarınca:

Cayma Hakkı:
• Sözleşme tarihinden itibaren 14 (on dört) gün içinde gerekçe göstermeksizin sözleşmeden cayabilirsiniz
• Cayma bildirimi app.nextself@gmail.com adresine yazılı olarak yapılmalıdır
• Cayma hakkı kullanıldığında ödeme 14 iş günü içinde iade edilir
• İade, ödemenin yapıldığı yöntemle gerçekleştirilir

İstisna — Dijital İçerik (Yönetmelik md. 15/ğ):
• Dijital içerik teslimine başlanmışsa (abonelik etkinleştirilmiş ve AI özellikleri kullanılmışsa), cayma hakkı kullanılamaz
• Kullanıcı, aboneliği etkinleştirerek dijital içerik teslimine onay verdiğini ve cayma hakkından feragat ettiğini kabul eder
• Bu feragat, MSS sözleşmesinde ayrıca belirtilir ve onaylanır

5. İade Koşulları

a) 14 Gün İçinde Cayma (Dijital içerik kullanılmamışsa):
• Ödeme, cayma bildiriminden itibaren 14 iş günü içinde iade edilir
• İade, ödemenin yapıldığı ödeme yöntemiyle gerçekleştirilir
• Kısmi kullanım durumunda orantılı iade yapılabilir

b) Teknik Sorunlar:
• Uygulamanın teknik nedenlerle 7 gün boyunca kesintisiz olarak kullanılamaması durumunda tam iade hakkı doğar
• Teknik sorunlar app.nextself@gmail.com adresine bildirilmelidir
• Bildirilen sorunlar 48 saat içinde değerlendirilir

c) Platform İadeleri:
• Apple App Store veya Google Play Store üzerinden yapılan ödemeler ilgili platformun iade politikasına tabidir
• Platform iadeleri için ilgili mağaza destek kanalları kullanılmalıdır

d) İade Edilemeyecek Durumlar:
• 14 günlük cayma süresini aşan talepler
• Dijital içeriğin kullanılmaya başlandığı durumlar (cayma feragati verilmişse)
• Fikir değişikliği veya yanlışlıkla satın alma (14 gün sonrası)

6. Abonelik İptali

• Aboneliğinizi istediğiniz zaman iptal edebilirsiniz
• İptal, mevcut fatura döneminin sonunda geçerli olur
• İptal edilen dönemin kalan süresinde premium özellikler kullanılmaya devam edilebilir
• İptal sonrası verileriniz hesabınızda korunur (silinmez)
• Yeniden abone olduğunuzda verilerinize erişim devam eder

İptal Kanalları:
• Uygulama İçi: Ayarlar > Abonelik > İptal Et
• E-posta: app.nextself@gmail.com
• Apple App Store / Google Play Store abonelik yönetimi

7. Fiyat Değişiklikleri

• Abonelik fiyatlarındaki değişiklikler en az 30 (otuz) gün önceden bildirilir
• Bildirim, uygulama içi bildirim ve e-posta ile yapılır
• Yeni fiyatlar, mevcut fatura döneminin sona ermesinin ardından uygulanır
• Fiyat değişikliğini kabul etmemeniz durumunda aboneliğinizi ücretsiz olarak iptal edebilirsiniz
• Mevcut dönemin ücretinde herhangi bir değişiklik yapılmaz`
                        : `1. Service Provider Information

Service Name: NextSelf
Service Type: Digital fitness and health application (SaaS — Software as a Service)
Contact: app.nextself@gmail.com
Applicable Law: Consumer Protection Law No. 6502, Distance Contracts Regulation

2. Subscription Plans

Free Plan:
• Basic workout tracking and logging
• Limited AI Coach access (3 daily queries)
• Daily missions and XP system
• Community forum access
• Basic nutrition tracking

Premium Plan (Monthly / Yearly):
• Unlimited AI Coach, AI Dietitian, AI Chef access
• AI Program Creator — Automated program generation
• Posture Analysis — Movement form evaluation
• Food Scanner — Photo-based nutritional analysis
• Advanced analytics and charts
• Priority customer support
• Ad-free experience
• All gamification features (leagues, missions, badges)

3. Pre-Sale Information (Law No. 6502 — Distance Sales)

This subscription is a distance sales contract within the scope of Consumer Protection Law No. 6502 and the Distance Contracts Regulation.

Service Features:
• AI-powered personalized fitness and nutrition programs
• Digital content delivery (instant access)
• Auto-renewing subscription model

Payment Method:
• Credit card / Debit card (secure payment via iyzico infrastructure — 3D Secure enabled)
• Payments processed on PCI DSS compliant infrastructure
• Card information NOT stored on NextSelf servers (processed only by iyzico)

Digital Content Consent:
• A separate Distance Sales Contract (MSS) is issued for each subscription transaction
• Buyer information, price, VAT, and withdrawal conditions are included in the MSS

4. Right of Withdrawal & Exceptions (14-Day Rule)

Pursuant to Article 48 of Law No. 6502 and the Distance Contracts Regulation:

Right of Withdrawal:
• You may withdraw from the contract within 14 (fourteen) days from the contract date without giving any reason
• Withdrawal notification must be sent in writing to app.nextself@gmail.com
• When the right of withdrawal is exercised, payment will be refunded within 14 business days
• Refund will be made via the original payment method

Exception — Digital Content (Regulation Art. 15/ğ):
• If digital content delivery has begun (subscription activated and AI features used), the right of withdrawal cannot be exercised
• The user acknowledges that by activating the subscription, they consent to digital content delivery and waive their right of withdrawal
• This waiver is separately stated and confirmed in the MSS contract

5. Refund Conditions

a) 14-Day Withdrawal (If digital content not used):
• Payment refunded within 14 business days of withdrawal notification
• Refund via original payment method
• Proportional refund may apply for partial usage

b) Technical Issues:
• Full refund if the application is continuously unavailable for 7 days due to technical reasons
• Technical issues must be reported to app.nextself@gmail.com
• Reported issues evaluated within 48 hours

c) Platform Refunds:
• Payments made through Apple App Store or Google Play Store are subject to the respective platform's refund policy
• Platform refund channels should be used for platform refunds

d) Non-Refundable Cases:
• Requests exceeding the 14-day withdrawal period
• Cases where digital content usage has begun (if withdrawal waiver given)
• Change of mind or accidental purchase (after 14 days)

6. Subscription Cancellation

• You may cancel your subscription at any time
• Cancellation takes effect at the end of the current billing period
• Premium features remain available for the rest of the cancelled period
• Your data is retained in your account after cancellation (not deleted)
• Data access continues when you resubscribe

Cancellation Channels:
• In-App: Settings > Subscription > Cancel
• Email: app.nextself@gmail.com
• Apple App Store / Google Play Store subscription management

7. Price Changes

• Subscription price changes will be announced at least 30 (thirty) days in advance
• Notification via in-app notification and email
• New prices apply after the current billing period ends
• You may cancel your subscription free of charge if you do not accept the price change
• No changes to the current period's fee`,
                };
            // ═══════════════════════════════════════════════════════════════════
            // 5) MESAFELİ SATIŞ SÖZLEŞMESİ (MSS) — 9 Madde
            // ═══════════════════════════════════════════════════════════════════
            case 'mss':
                return {
                    title: isTurkish ? 'Mesafeli Satış Sözleşmesi' : 'Distance Sales Contract',
                    content: isTurkish
                        ? `NextSelf Mesafeli Satış Sözleşmesi Ön Bilgilendirme Formu
6502 Sayılı Tüketicinin Korunması Hakkında Kanun

1. Satıcı Bilgileri

Hizmet Adı: NextSelf
E-posta: app.nextself@gmail.com
Ülke: Türkiye
Uygulanacak Hukuk: Türkiye Cumhuriyeti Kanunları

2. Sözleşmenin Konusu

İşbu sözleşme, NextSelf mobil uygulaması üzerinden dijital içerik ve abonelik hizmetlerinin satışına ilişkin 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine uygun olarak düzenlenmiştir. Her abonelik işleminde alıcı bilgilerini, plan detaylarını, fiyat ve KDV bilgisini içeren dinamik bir sözleşme otomatik olarak oluşturulur.

3. Ürün/Hizmet Bilgileri

NextSelf Premium abonelik hizmeti aşağıdaki dijital içerikleri kapsar:

• AI Coach — Yapay zeka destekli kişisel antrenman asistanı (sınırsız)
• AI Dietitian — Kişiselleştirilmiş beslenme planları ve diyet yönetimi
• AI Chef — Makro hedeflerine uygun tarif önerileri
• AI Program Creator — Otomatik antrenman programı oluşturma
• Postür Analizi — Kamera ile hareket formu analizi ve düzeltme önerileri
• Besin Tarama (Food Scanner) — Fotoğraftan besin değeri, kalori ve makro analizi
• Barkod Tarama — Ürün barkodundan besin bilgisi çekme
• Gamification — Ligler, görevler, günlük streak, XP ve coin sistemi
• Gelişmiş Analitik — Detaylı grafikler ve ilerleme raporları
• Sınırsız AI kullanımı ve öncelikli destek
• Reklamsız deneyim

4. Fiyat ve Ödeme

Abonelik bedeli, seçilen plana ve ödeme dönemine göre belirlenir. Tüm fiyatlar KDV (%20) dahildir.

Ödeme Yöntemi:
• Kredi kartı / Banka kartı (iyzico altyapısı — PCI DSS ve 3D Secure uyumlu)
• Kart bilgileri yalnızca iyzico tarafından işlenir, NextSelf sunucularında saklanmaz

Otomatik Yenileme:
• Abonelikler dönem sonunda otomatik olarak yenilenir
• Yenileme öncesinde bildirim gönderilir
• İstediğiniz zaman otomatik yenilemeyi iptal edebilirsiniz

Sözleşme Numarası: Her işlemde benzersiz sözleşme numarası (MSS-YYYYMMDD-XXXXX formatında) otomatik atanır.

5. Cayma Hakkı (14 Gün)

6502 sayılı Kanun'un 48. maddesi uyarınca, mesafeli sözleşmelerde tüketici sözleşmenin kurulduğu tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.

Cayma hakkını kullanmak için:
• app.nextself@gmail.com adresine yazılı bildirim gönderilmelidir
• Uygulama içi: Ayarlar > Abonelik > Cayma Hakkı
• Ödeme, bildirim tarihinden itibaren 14 iş günü içinde iade edilir
• İade, ödemenin yapıldığı yöntemle (aynı kredi kartı/banka kartı) gerçekleştirilir

ÖNEMLİ — Dijital İçerik İstisnası (Yönetmelik md. 15/ğ):
Mesafeli Sözleşmeler Yönetmeliği'nin 15/ğ maddesi uyarınca, elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayri maddi mallarda cayma hakkı kullanılamaz.

Kullanıcı, aboneliği etkinleştirerek ve dijital içerik teslimine (AI servisleri, analiz özellikleri vb.) açıkça onay vererek cayma hakkından feragat ettiğini kabul ve beyan eder. Bu feragat, ödeme sırasında ayrıca onaylanır.

6. Teslimat Şekli

Dijital hizmet, abonelik işlemi tamamlandıktan hemen sonra anında kullanıma açılır. Fiziksel teslimat söz konusu değildir. Hizmet erişimi 7/24 (bakım süreleri hariç) sağlanır.

7. Garanti ve Sorumluluk

• Dijital içerik hizmetleri, açıklanan özelliklere ve plana uygun olarak sunulur
• Teknik aksaklıklar için destek sağlanır (app.nextself@gmail.com)
• 7 gün boyunca kesintisiz kullanılamama durumunda tam iade hakkı doğar
• AI tarafından üretilen tüm içerikler bilgilendirme amaçlıdır; tıbbi tavsiye niteliği taşımaz
• Hizmet kalitesi SLA (Service Level Agreement) ile belirlenir

8. Uyuşmazlık Çözümü

İşbu sözleşmeden doğan uyuşmazlıklarda:
• İstanbul (Anadolu) Tüketici Hakem Heyetleri yetkilidir (yıllık üst limit dahilinde)
• Üst limit üzerindeki uyuşmazlıklarda İstanbul Tüketici Mahkemeleri yetkilidir
• Tüketici Hakem Heyeti başvurusu ücretsizdir
• Online uyuşmazlık çözümü (ODR) platformu: https://ec.europa.eu/odr (AB kullanıcıları için)

9. Yürürlük

İşbu ön bilgilendirme formu, alıcının elektronik ortamda onayı ile birlikte yürürlüğe girer ve abonelik sözleşme süresi boyunca geçerlidir. Sözleşme metni, kullanıcının hesap sayfasından ve web panelinden (Yasal Sözleşmeler sayfası) her zaman erişilebilir ve indirilebilir durumdadır.`
                        : `NextSelf Distance Sales Contract Pre-Information Form
Consumer Protection Law No. 6502

1. Seller Information

Service Name: NextSelf
Email: app.nextself@gmail.com
Country: Turkey
Applicable Law: Laws of the Republic of Turkey

2. Subject of the Contract

This contract is prepared in accordance with Law No. 6502 and the Distance Contracts Regulation regarding the sale of digital content and subscription services through the NextSelf mobile application. A dynamic contract containing buyer information, plan details, price, and VAT information is automatically generated for each subscription transaction.

3. Product/Service Information

NextSelf Premium subscription service includes the following digital content:

• AI Coach — AI-powered personal training assistant (unlimited)
• AI Dietitian — Personalized nutrition plans and diet management
• AI Chef — Macro-targeted recipe suggestions
• AI Program Creator — Automated workout program generation
• Posture Analysis — Camera-based movement form analysis and correction suggestions
• Food Scanning (Food Scanner) — Photo-based nutritional value, calorie, and macro analysis
• Barcode Scanning — Retrieving nutritional information from product barcodes
• Gamification — Leagues, missions, daily streaks, XP, and coin system
• Advanced Analytics — Detailed charts and progress reports
• Unlimited AI usage and priority support
• Ad-free experience

4. Price and Payment

Subscription fee is determined based on the selected plan and billing period. All prices include VAT (20%).

Payment Method:
• Credit card / Debit card (iyzico infrastructure — PCI DSS and 3D Secure compliant)
• Card information processed only by iyzico, NOT stored on NextSelf servers

Automatic Renewal:
• Subscriptions automatically renew at the end of each period
• Notification sent before renewal
• You may cancel automatic renewal at any time

Contract Number: A unique contract number (in MSS-YYYYMMDD-XXXXX format) is automatically assigned for each transaction.

5. Right of Withdrawal (14 Days)

Pursuant to Article 48 of Law No. 6502, in distance contracts, the consumer has the right to withdraw from the contract within 14 (fourteen) days from the date the contract is established, without giving any reason and without any penalty.

To exercise the right of withdrawal:
• Written notification must be sent to app.nextself@gmail.com
• In-App: Settings > Subscription > Right of Withdrawal
• Payment will be refunded within 14 business days of the notification date
• Refund will be made via the original payment method (same credit/debit card)

IMPORTANT — Digital Content Exception (Regulation Art. 15/ğ):
Pursuant to Article 15/ğ of the Distance Contracts Regulation, the right of withdrawal cannot be exercised for services immediately performed electronically or for intangible goods immediately delivered to the consumer.

The user acknowledges and declares that by activating the subscription and explicitly consenting to digital content delivery (AI services, analysis features, etc.), they waive their right of withdrawal. This waiver is separately confirmed during payment.

6. Delivery Method

Digital service is instantly accessible upon completion of the subscription process. No physical delivery involved. Service access provided 24/7 (excluding maintenance periods).

7. Warranty and Liability

• Digital content services provided in accordance with described features and plan
• Support provided for technical issues (app.nextself@gmail.com)
• Full refund right if service is continuously unavailable for 7 days
• All AI-generated content is informational only; does not constitute medical advice
• Service quality defined by SLA (Service Level Agreement)

8. Dispute Resolution

For disputes arising from this contract:
• Istanbul (Anatolian Side) Consumer Arbitration Committees have jurisdiction (within annual upper limit)
• Istanbul Consumer Courts have jurisdiction for disputes above the upper limit
• Consumer Arbitration Committee application is free of charge
• Online Dispute Resolution (ODR) platform: https://ec.europa.eu/odr (for EU users)

9. Effectiveness

This pre-information form enters into force upon the buyer's electronic approval and remains valid throughout the subscription contract period. The contract text is always accessible and downloadable from the user's account page and web panel (Legal Agreements page).`,
                };
            // ═══════════════════════════════════════════════════════════════════
            // 6) KULLANIM KOŞULLARI (DEFAULT) — 11 Madde
            // ═══════════════════════════════════════════════════════════════════
            default:
                return {
                    title: isTurkish ? 'Kullanım Koşulları' : 'Terms of Service',
                    content: isTurkish
                        ? `NextSelf Kullanım Koşulları
Son Güncelleme: Mart 2026

1. Tıbbi Feragatname (Medical Disclaimer)

ÖNEMLİ: NextSelf bir sağlık kuruluşu, tıbbi cihaz veya doktor değildir. Uygulama tarafından sunulan tüm AI yanıtları (AI Coach, AI Dietitian, AI Chef, AI Program Creator), antrenman programları, beslenme planları, postür analizi sonuçları ve sağlık önerileri yalnızca bilgilendirme ve öneri niteliğindedir; hiçbir koşulda tıbbi tavsiye, teşhis veya tedavi yerine geçmez.

Kullanıcı, herhangi bir egzersiz veya diyet programına başlamadan önce mutlaka bir doktora veya sağlık profesyoneline danışmalıdır. Özellikle:
• Kronik hastalığı olan bireyler (kalp, diyabet, tansiyon, astım vb.)
• Hamile veya emziren bireyler
• Ameliyat sonrası iyileşme sürecinde olanlar
• Kas-iskelet sistemi problemi olanlar (bel fıtığı, dizkapağı, omuz sıkışması vb.)
• 18 yaş altı bireyler (veli gözetiminde kullanılmalıdır)

profesyonel tıbbi danışmanlık almadan uygulamadaki programları uygulamamalıdır.

2. Fiziksel Yaralanma ve Sorumluluk Reddi

Uygulamada sunulan antrenman programları, egzersiz önerileri, postür düzeltme tavsiyeleri ve beslenme planlarının uygulanması tamamen kullanıcının kendi sorumluluğundadır.

NextSelf ve geliştiricisi, uygulamanın kullanımı sonucunda doğrudan veya dolaylı olarak meydana gelebilecek:
• Fiziksel yaralanma, sakatlık veya kas/eklem hasarı
• Yanlış egzersiz formundan kaynaklanan sakatlıklar
• Yanlış beslenme uygulamalarından kaynaklanan sağlık sorunları
• Alerji, intolerans veya metabolik sorunlar
• AI tarafından önerilen yanlış kalori/makro hedeflerinden kaynaklanan sorunlar
• Maddi veya manevi her türlü zarar

konularında hiçbir sorumluluk kabul etmez. Kullanıcı, uygulamayı tamamen kendi risk ve sorumluluğunda kullandığını kabul ve beyan eder.

3. Yapay Zeka ve Algoritmik Kararlar

NextSelf, kullanıcılara antrenman programları, beslenme planları, günlük/haftalık görevler, postür analizi ve besin taraması sonuçları oluşturmak için yapay zeka (DeepSeek AI) kullanmaktadır.

AI Sistemi Hakkında:
• AI yanıtları otomatik olarak üretilir ve önceden incelenmez
• AI, kullanıcının kişisel sağlık geçmişini, alerjilerini veya tıbbi durumunu tam olarak bilmez
• AI "halüsinasyonu" — yapay zekanın gerçeğe aykırı, yanıltıcı veya hatalı içerik üretme olasılığı her zaman mevcuttur
• Üretilen programların doğruluğu, uygunluğu veya güvenliği %100 garanti edilemez
• Postür analizi sonuçları yaklaşık değerlerdir; profesyonel fizyoterapi değerlendirmesi yerine geçmez
• Besin taraması (Food Scanner) sonuçları tahminidir; gıda alerjileri için güvenilir kaynak değildir

Kullanıcının Sorumluluğu:
• AI tavsiyelerini uygulamadan önce kendi durumunuza uygunluğunu değerlendirin
• Şüphe durumunda bir sağlık profesyoneline danışın
• AI tarafından üretilen içerikleri tek başına referans olarak kullanmayın

4. Hesap Güvenliği

• Kullanıcı, hesabının güvenliğinden şahsen sorumludur
• Güçlü şifre kullanımı ve şifrenin üçüncü kişilerle paylaşılmaması tavsiye edilir
• Her oturum JWT token ile korunur (otomatik süre sonu)
• Şüpheli hesap aktivitesi durumunda derhal app.nextself@gmail.com adresine bildiriniz
• NextSelf, hesap güvenliğinin kullanıcı tarafından ihmal edilmesinden kaynaklanan zararlardan sorumlu değildir

5. Yaş Sınırı

• NextSelf, 13 yaş ve üzeri kullanıcılar için tasarlanmıştır
• 13-18 yaş arası kullanıcılar için veli/vasi onayı ve gözetimi önerilir
• 13 yaş altı kullanıcıların verileri tespit halinde derhal silinir
• Yaş doğrulama, kayıt ekranında doğum tarihi ile yapılır

6. Fikri Mülkiyet Hakları

• NextSelf uygulaması, logosu, tasarımı, içerikleri ve tüm AI algoritmaları telif hakkı ve fikri mülkiyet yasalarıyla korunmaktadır
• Kullanıcılar, uygulama içeriğini kopyalayamaz, dağıtamaz, ters mühendislik yapamaz veya ticari amaçla kullanamaz
• Kullanıcı tarafından üretilen içerikler (forum gönderileri, yorumlar) kullanıcının mülkiyetindedir
• NextSelf, kullanıcı içeriklerini platform içi görüntüleme amacıyla lisans hakkına sahiptir

7. Hizmet Değişiklikleri ve Kesintiler

• NextSelf, uygulama özelliklerini önceden bildirimde bulunarak değiştirebilir veya güncelleyebilir
• Planlı bakım süreleri önceden bildirilir
• Zorunlu güncellemeler için uygulama yeniden başlatılması gerekebilir
• Ücretsiz plan özellikleri değiştirilebilir
• Premium plan özellikleri abonelik süresi boyunca korunur (büyük değişikliklerde bildirim yapılır)

8. Uyuşmazlık Çözümü ve Yetkili Mahkeme

• İşbu kullanım koşullarından doğan tüm uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır
• Uyuşmazlıklarda İstanbul (Anadolu) Mahkemeleri ve İcra Daireleri yetkilidir
• Tüketici uyuşmazlıklarında Tüketici Hakem Heyeti'ne başvuru ücretsizdir
• Hukuki süreç başlatılmadan önce dostane çözüm yolu (mediation) aranır

9. Yapay Zeka Halüsinasyonu ve Hatalı Bilgi Uyarısı

DeepSeek AI modeli, nadiren de olsa aşağıdaki hatalı içerikleri üretebilir:
• Bilimsel olarak desteklenmeyen egzersiz tavsiyeleri
• Yanlış kalori veya besin değeri hesaplamaları
• Bireyin sağlık durumuna uygun olmayan program önerileri
• Mevcut olmayan egzersiz veya gıda isimleri (halüsinasyon)
• Postür analizinde hatalı açı yorumlamaları
• Food Scanner'da yanlış yiyecek tanımlama

NextSelf, AI halüsinasyonundan kaynaklanan hatalı bilgilerden doğan doğrudan veya dolaylı zararlardan sorumlu tutulamaz. Kullanıcı, AI içeriklerini eleştirel bir bakış açısıyla değerlendirmeyi kabul eder.

10. Aracılık ve Komisyon Politikası (PT / Diyetisyen)

NextSelf, kullanıcıları bağımsız Personal Trainer'lar ve Diyetisyenlerle buluşturan bir aracı platformdur. Hizmetler, kullanıcı ve profesyonel arasındaki anlaşmaya bağlı olarak yüz yüze veya uzaktan (online) gerçekleştirilebilir.

Platform Sorumluluğu:
• NextSelf, profesyonellerin lisans, yetkinlik ve eğitim belgelerini doğrulamaya çalışır; ancak garanti etmez
• Profesyonel-müşteri ilişkisindeki hizmet kalitesinden NextSelf sorumlu değildir
• Profesyonellerle yapılan anlaşmalar kullanıcı ile profesyonel arasındadır

Komisyon:
• NextSelf, profesyonel hizmet bedeli üzerinden %10 platform komisyonu alır
• Komisyon oranı değişikliğinde 30 gün önceden bildirim yapılır
• Komisyon yalnızca profesyonel tarafından ödenir, kullanıcıya ek maliyet yansıtılmaz

11. Sanal Ekonomi Sistemi (XP, Gem, Coin)

NextSelf uygulama içi sanal ekonomi sistemi kullanmaktadır:

• XP (Deneyim Puanı): Aktivite ve görev tamamlamalarından kazanılır; lig sıralamasını belirler
• Gem: Premium puan birimi; özel ödüller ve rozetler için kullanılır
• Coin: Günlük görev ödülleri; sanal mağaza alışverişi için kullanılır

Sanal Birim Kuralları:
• Sanal birimler gerçek paraya çevrilemez, nakde dönüştürülemez
• Sanal birimler başka kullanıcılara devredilemez, hediye edilemez
• Sanal birimler üzerinde mülkiyet hakkı yoktur
• NextSelf, sanal birim değerlerini ve kazanım oranlarını değiştirme hakkını saklı tutar
• Hile, exploit veya suistimal tespit edilen hesaplar uyarı yapılmaksızın kapatılabilir
• Hesap kapatıldığında tüm sanal birimler geçersiz olur`
                        : `NextSelf Terms of Service
Last Updated: March 2026

1. Medical Disclaimer

IMPORTANT: NextSelf is not a healthcare institution, medical device, or doctor. All AI responses provided by the application (AI Coach, AI Dietitian, AI Chef, AI Program Creator), workout programs, nutrition plans, posture analysis results, and health recommendations are for informational and advisory purposes only; they do not replace medical advice, diagnosis, or treatment under any circumstances.

Users must consult a doctor or health professional before starting any exercise or diet program. Especially:
• Individuals with chronic conditions (heart disease, diabetes, hypertension, asthma, etc.)
• Pregnant or breastfeeding individuals
• Those in post-surgical recovery
• Those with musculoskeletal problems (herniated disc, knee, shoulder impingement, etc.)
• Individuals under 18 (should be used under parental supervision)

should not apply the programs in the application without professional medical consultation.

2. Physical Injury & Liability Disclaimer

The application of workout programs, exercise recommendations, posture correction advice, and nutrition plans provided in the application is entirely the user's own responsibility.

NextSelf and its developer accept no liability for any direct or indirect consequences resulting from the use of the application, including but not limited to:
• Physical injury, disability, or muscle/joint damage
• Injuries resulting from incorrect exercise form
• Health issues arising from incorrect nutritional practices
• Allergies, intolerances, or metabolic problems
• Issues arising from incorrect calorie/macro targets recommended by AI
• Any material or moral damages

The user acknowledges and declares that they use the application entirely at their own risk and responsibility.

3. Artificial Intelligence & Algorithmic Decisions

NextSelf uses artificial intelligence (DeepSeek AI) to generate workout programs, nutrition plans, daily/weekly missions, posture analysis, and food scanning results for users.

About the AI System:
• AI responses are generated automatically and are not pre-reviewed
• AI does not fully know the user's personal health history, allergies, or medical conditions
• AI "hallucination" — the possibility that AI may produce counterfactual, misleading, or erroneous content always exists
• The accuracy, suitability, or safety of generated programs cannot be 100% guaranteed
• Posture analysis results are approximate values; they do not replace professional physiotherapy evaluation
• Food Scanner results are estimates; they are not reliable sources for food allergies

User's Responsibility:
• Evaluate AI recommendations for suitability to your own condition before applying
• Consult a health professional in case of doubt
• Do not use AI-generated content as a sole reference

4. Account Security

• The user is personally responsible for the security of their account
• Strong password usage and not sharing passwords with third parties is recommended
• Each session is protected with JWT token (automatic expiration)
• Immediately notify app.nextself@gmail.com in case of suspicious account activity
• NextSelf is not responsible for damages resulting from the user's negligence of account security

5. Age Restriction

• NextSelf is designed for users aged 13 and above
• Parental/guardian consent and supervision is recommended for users aged 13-18
• Data of users under 13 will be immediately deleted upon detection
• Age verification is performed via date of birth on the registration screen

6. Intellectual Property Rights

• NextSelf application, logo, design, content, and all AI algorithms are protected by copyright and intellectual property laws
• Users may not copy, distribute, reverse engineer, or use application content for commercial purposes
• User-generated content (forum posts, comments) belongs to the user
• NextSelf holds a license right to display user content within the platform

7. Service Changes & Interruptions

• NextSelf may modify or update application features with prior notice
• Planned maintenance periods will be announced in advance
• Application restart may be required for mandatory updates
• Free plan features may be changed
• Premium plan features are maintained throughout the subscription period (notification provided for major changes)

8. Dispute Resolution & Jurisdiction

• Laws of the Republic of Turkey shall apply to all disputes arising from these terms of service
• Istanbul (Anatolian Side) Courts and Enforcement Offices shall have jurisdiction
• Consumer Arbitration Committee application is free for consumer disputes
• Amicable resolution (mediation) shall be sought before initiating legal proceedings

9. AI Hallucination & Incorrect Information Warning

The DeepSeek AI model may, albeit rarely, produce the following erroneous content:
• Scientifically unsupported exercise recommendations
• Incorrect calorie or nutritional value calculations
• Program recommendations unsuitable for an individual's health condition
• Non-existent exercise or food names (hallucination)
• Incorrect angle interpretations in posture analysis
• Incorrect food identification in Food Scanner

NextSelf cannot be held liable for any direct or indirect damages arising from incorrect information caused by AI hallucination. The user agrees to evaluate AI content with a critical perspective.

10. Intermediary & Commission Policy (PT / Dietitian)

NextSelf is an intermediary platform connecting users with independent Personal Trainers and Dietitians. Services may be provided face-to-face or remotely (online) as agreed between the user and the professional.

Platform Responsibility:
• NextSelf attempts to verify professionals' licenses, qualifications, and training certificates; however, it does not guarantee them
• NextSelf is not responsible for the quality of service in the professional-client relationship
• Agreements with professionals are between the user and the professional

Commission:
• NextSelf charges a 10% platform commission on professional service fees
• 30 days advance notice for commission rate changes
• Commission is paid only by the professional, no additional cost to the user

11. Virtual Economy System (XP, Gem, Coin)

NextSelf uses an in-app virtual economy system:

• XP (Experience Points): Earned from activities and mission completions; determines league rankings
• Gem: Premium currency unit; used for special rewards and badges
• Coin: Daily mission rewards; used for virtual shop purchases

Virtual Unit Rules:
• Virtual units cannot be converted to real money or cashed out
• Virtual units cannot be transferred to or gifted to other users
• No ownership rights over virtual units
• NextSelf reserves the right to change virtual unit values and earning rates
• Accounts detected with cheating, exploits, or abuse may be closed without warning
• All virtual units become invalid when an account is closed`,
                };
        }
    };
    const { title, content } = getContent();
    // Special view for accepting all agreements during auth flow
    if (fromAuth) {
        return (<react_native_1.View style={styles.container}>
                <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} style={[styles.header, { paddingTop: insets.top + 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <react_native_1.View style={{ width: 40 }}/>
                    <react_native_1.Text style={styles.headerTitle} numberOfLines={1}>
                        {isTurkish ? 'Kullanım Koşulları' : 'Terms & Conditions'}
                    </react_native_1.Text>
                    <react_native_1.View style={{ width: 40 }}/>
                </expo_linear_gradient_1.LinearGradient>

                <react_native_1.Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <react_native_1.Text style={[styles.contentText, { fontWeight: '700', marginBottom: 16 }]}>
                            {isTurkish
                ? 'Uygulamayı kullanmaya başlamadan önce lütfen aşağıdaki sözleşmeleri okuyun ve kabul edin:'
                : 'Please read and accept the following agreements before using the app:'}
                        </react_native_1.Text>

                        {/* KVKK */}
                        <react_native_1.TouchableOpacity style={[styles.card, { marginBottom: 12 }]} onPress={() => navigation.navigate('Terms', { section: 'kvkk' })}>
                            <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <vector_icons_1.Ionicons name="shield-checkmark" size={24} color={colors.primary} style={{ marginRight: 12 }}/>
                                    <react_native_1.Text style={styles.contentText}>
                                        {isTurkish ? 'KVKK Aydınlatma Metni' : 'KVKK Disclosure'}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                <vector_icons_1.Ionicons name="chevron-forward" size={20} color={colors.textTertiary}/>
                            </react_native_1.View>
                        </react_native_1.TouchableOpacity>

                        {/* Consent */}
                        <react_native_1.TouchableOpacity style={[styles.card, { marginBottom: 12 }]} onPress={() => navigation.navigate('Terms', { section: 'consent' })}>
                            <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <vector_icons_1.Ionicons name="document-text" size={24} color={colors.secondary} style={{ marginRight: 12 }}/>
                                    <react_native_1.Text style={styles.contentText}>
                                        {isTurkish ? 'Açık Rıza Metni' : 'Explicit Consent'}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                <vector_icons_1.Ionicons name="chevron-forward" size={20} color={colors.textTertiary}/>
                            </react_native_1.View>
                        </react_native_1.TouchableOpacity>

                        {/* Privacy */}
                        <react_native_1.TouchableOpacity style={[styles.card, { marginBottom: 12 }]} onPress={() => navigation.navigate('Terms', { section: 'privacy' })}>
                            <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <vector_icons_1.Ionicons name="lock-closed" size={24} color={colors.accent} style={{ marginRight: 12 }}/>
                                    <react_native_1.Text style={styles.contentText}>
                                        {isTurkish ? 'Gizlilik Politikası' : 'Privacy Policy'}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                <vector_icons_1.Ionicons name="chevron-forward" size={20} color={colors.textTertiary}/>
                            </react_native_1.View>
                        </react_native_1.TouchableOpacity>

                        {/* Terms */}
                        <react_native_1.TouchableOpacity style={[styles.card, { marginBottom: 12 }]} onPress={() => navigation.navigate('Terms', { section: 'terms' })}>
                            <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <vector_icons_1.Ionicons name="receipt" size={24} color={colors.warning} style={{ marginRight: 12 }}/>
                                    <react_native_1.Text style={styles.contentText}>
                                        {isTurkish ? 'Kullanım Koşulları' : 'Terms of Service'}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                <vector_icons_1.Ionicons name="chevron-forward" size={20} color={colors.textTertiary}/>
                            </react_native_1.View>
                        </react_native_1.TouchableOpacity>

                        {/* Subscription */}
                        <react_native_1.TouchableOpacity style={[styles.card, { marginBottom: 24 }]} onPress={() => navigation.navigate('Terms', { section: 'subscription' })}>
                            <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <vector_icons_1.Ionicons name="card" size={24} color={colors.orange} style={{ marginRight: 12 }}/>
                                    <react_native_1.Text style={styles.contentText}>
                                        {isTurkish ? 'Abonelik ve İade Politikası' : 'Subscription & Refund Policy'}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                <vector_icons_1.Ionicons name="chevron-forward" size={20} color={colors.textTertiary}/>
                            </react_native_1.View>
                        </react_native_1.TouchableOpacity>

                        <react_native_1.View style={{ height: 120 }}/>
                    </react_native_1.ScrollView>
                </react_native_1.Animated.View>

                {/* Accept All Button */}
                <react_native_1.View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                    <react_native_1.TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={accepting} activeOpacity={0.8}>
                        <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} style={styles.acceptGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {accepting ? (<react_native_1.ActivityIndicator color="#fff" size="small"/>) : (<>
                                    <vector_icons_1.Ionicons name="checkmark-circle" size={20} color="#fff"/>
                                    <react_native_1.Text style={styles.acceptText}>
                                        {isTurkish ? 'Tümünü Okudum ve Kabul Ediyorum' : 'I Have Read and Accept All'}
                                    </react_native_1.Text>
                                </>)}
                        </expo_linear_gradient_1.LinearGradient>
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>
            </react_native_1.View>);
    }
    return (<react_native_1.View style={styles.container}>
            <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} style={[styles.header, { paddingTop: insets.top + 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Settings')} style={styles.backBtn} activeOpacity={0.7}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color="#fff"/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle} numberOfLines={1}>{title}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </expo_linear_gradient_1.LinearGradient>

            {/* Accepted Banner */}
            {accepted === true && (<react_native_1.View style={styles.acceptedBanner}>
                    <vector_icons_1.Ionicons name="checkmark-circle" size={18} color={colors.success}/>
                    <react_native_1.Text style={styles.acceptedText}>
                        {isTurkish ? 'Bu sözleşmeyi kabul ettiniz' : 'You have accepted this agreement'}
                    </react_native_1.Text>
                </react_native_1.View>)}

            <react_native_1.Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <GlassCard_1.default style={styles.card}>
                        <react_native_1.Text style={styles.contentText}>{content}</react_native_1.Text>
                    </GlassCard_1.default>

                    <react_native_1.View style={{ height: 120 }}/>
                </react_native_1.ScrollView>
            </react_native_1.Animated.View>

            {/* Accept Button */}
            {accepted === false && (<react_native_1.View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                    <react_native_1.TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={accepting} activeOpacity={0.8}>
                        <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} style={styles.acceptGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {accepting ? (<react_native_1.ActivityIndicator color="#fff" size="small"/>) : (<>
                                    <vector_icons_1.Ionicons name="checkmark-circle" size={20} color="#fff"/>
                                    <react_native_1.Text style={styles.acceptText}>
                                        {isTurkish ? 'Okudum ve Kabul Ediyorum' : 'I Have Read and Accept'}
                                    </react_native_1.Text>
                                </>)}
                        </expo_linear_gradient_1.LinearGradient>
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>)}
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme_1.SPACING.lg,
        paddingBottom: theme_1.SPACING.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: '#fff', flex: 1, textAlign: 'center' }),
    acceptedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: theme_1.SPACING.sm,
        backgroundColor: colors.successSoft,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    acceptedText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.success }),
    scrollContent: {
        padding: theme_1.SPACING.lg,
    },
    card: {
        padding: theme_1.SPACING.lg,
    },
    contentText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text, lineHeight: 24 }),
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: theme_1.SPACING.lg,
        paddingTop: theme_1.SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    acceptButton: {
        borderRadius: theme_1.BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    acceptGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    acceptText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { color: '#fff' }),
});
exports.default = TermsScreen;
