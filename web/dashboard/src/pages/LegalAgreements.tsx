import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiFileText, FiCheck, FiChevronDown, FiChevronUp, FiShield, FiLock, FiCreditCard, FiBookOpen, FiAlertCircle, FiExternalLink } from 'react-icons/fi';

type AgreementType = 'kvkk' | 'consent' | 'privacy' | 'subscription' | 'terms';

const AGREEMENT_SECTIONS: Array<{
    key: AgreementType;
    titleTr: string;
    titleEn: string;
    icon: any;
    articles: number;
    color: string;
}> = [
    {
        key: 'kvkk',
        titleTr: 'KVKK Aydınlatma Metni',
        titleEn: 'KVKK Disclosure Text',
        icon: FiShield,
        articles: 7,
        color: '#4F46E5',
    },
    {
        key: 'consent',
        titleTr: 'Açık Rıza Metni',
        titleEn: 'Explicit Consent Form',
        icon: FiCheck,
        articles: 5,
        color: '#059669',
    },
    {
        key: 'privacy',
        titleTr: 'Gizlilik Politikası',
        titleEn: 'Privacy Policy',
        icon: FiLock,
        articles: 7,
        color: '#7C3AED',
    },
    {
        key: 'subscription',
        titleTr: 'Abonelik ve İade Politikası',
        titleEn: 'Subscription & Refund Policy',
        icon: FiCreditCard,
        articles: 7,
        color: '#D97706',
    },
    {
        key: 'terms',
        titleTr: 'Kullanım Koşulları',
        titleEn: 'Terms of Service',
        icon: FiBookOpen,
        articles: 11,
        color: '#DC2626',
    },
];

const AGREEMENT_CONTENT = {
    kvkk: {
        tr: `1. Veri Sorumlusunun Kimliği

NextSelf ("Uygulama"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmektedir.

2. İşlenen Kişisel Veriler

• Kimlik Verileri: Ad, soyad, kullanıcı adı, doğum tarihi, cinsiyet
• İletişim Verileri: E-posta adresi
• Fiziksel Veriler: Boy, kilo, vücut ölçüleri, vücut yağ oranı
• Sağlık Verileri (Özel Nitelikli): Antrenman geçmişi, beslenme alışkanlıkları, kalori takibi, su tüketimi, adım sayısı, uyku düzeni, sağlık hedefleri
• Kullanım Verileri: Uygulama içi etkileşimler, tercihler, cihaz bilgileri

3. İşleme Amaçları

• AI tabanlı kişiselleştirilmiş antrenman ve beslenme programlarının oluşturulması
• Yapay zeka algoritmalarıyla otomatik program ve görev üretilmesi
• Seçtiğiniz profesyonellerle (PT / Diyetisyen) veri paylaşımının sağlanması
• Gamification sistemi kapsamında kullanıcı deneyiminin kişiselleştirilmesi
• Uygulama performansının iyileştirilmesi ve hata tespiti

4. İşlenen Kişisel Verilerin Aktarımı

Yurt Dışı Aktarımları:
• Supabase (AWS/Google Cloud, ABD/AB) — Veri saklama
• DeepSeek AI — Yapay zeka sağlayıcısı (anonimleştirilerek)
• Sentry — Hata izleme

Uluslararası Genişleme: BAE/Dubai planı dahil (DIFC Data Protection Law uyumlu)

5. Veri Toplamanın Yöntemi ve Hukuki Sebebi

Veriler dijital ve otomatik yollarla toplanmaktadır.
• Genel veriler: Sözleşme gereği (md. 5/2-c)
• Sağlık verileri: Açık rıza (md. 6/2)
• Yurt dışı aktarım: Açık rıza (md. 9/1)

6. Veri Saklama Süresi

Hesap aktifken saklanır. Silme talebi halinde 30 gün içinde imha edilir.

7. İlgili Kişinin Hakları (Madde 11)

KVKK md. 11 kapsamında 9 temel hak (öğrenme, düzeltme, silme, itiraz vb.)
Başvuru: app.nextself@gmail.com`,
        en: `1. Identity of the Data Controller

NextSelf acts as data controller under KVKK (Personal Data Protection Law No. 6698).

2. Personal Data Processed

• Identity Data: Name, surname, username, date of birth, gender
• Contact Data: Email address
• Physical Data: Height, weight, body measurements, body fat percentage
• Health Data (Special Category): Workout history, dietary habits, calorie tracking, water consumption, step count, sleep patterns, health goals
• Usage Data: In-app interactions, preferences, device information

3. Processing Purposes

• Creating AI-powered personalized workout and nutrition programs
• Generating automatic programs and missions with AI algorithms
• Sharing data with selected professionals (PT / Dietitian)
• Personalizing user experience within the gamification system
• Improving application performance and error detection

4. Data Transfer

International: Supabase (US/EU), DeepSeek AI (anonymized), Sentry
International expansion: UAE/Dubai planned (DIFC compliant)

5. Method and Legal Basis of Data Collection

Data collected digitally and automatically.
• General data: Contract necessity (Art. 5/2-c)
• Health data: Explicit consent (Art. 6/2)
• International transfer: Explicit consent (Art. 9/1)

6. Data Retention Period

Stored while account is active. Destroyed within 30 days upon deletion request.

7. Data Subject Rights (Article 11)

9 fundamental rights under KVKK Art. 11 (access, rectification, erasure, objection, etc.)
Contact: app.nextself@gmail.com`
    },
    consent: {
        tr: `1. Özel Nitelikli Kişisel Verilerin İşlenmesi

Boy, kilo, beslenme, antrenman, su tüketimi, aktivite ve HealthKit/Health Connect verileri "Özel Nitelikli Kişisel Veri (Sağlık Verisi)" kapsamındadır. AI programları, beslenme planları, profesyonel paylaşımı ve gamification amaçlarıyla açık rıza ile işlenmektedir.

2. Yurt Dışına Veri Aktarımı Rızası

• Supabase (ABD/AB) — Veri saklama
• DeepSeek AI (Çin) — Anonimleştirilerek AI üretimi
• Sentry (ABD) — Hata takibi

Şifreleme, RLS ve anonimleştirme tedbirleri uygulanmaktadır.

3. Yapay Zeka ile Otomatik Karar Alma

AI kararları tıbbi tavsiye değildir. Bireysel sağlık durumuna göre kontrol edilmelidir. Programa başlamadan önce sağlık profesyoneline danışılmalıdır.

4. Biyometrik ve Görsel Veri İşleme Rızası

• Postür Analizi: Kamera ile vücut duruşu, eklem açıları AI analizi
• Yemek Fotoğrafı (Food Scanner): Besin değeri tespiti için AI'a gönderilir
• Fizik Analizi (AI Coach): Kas ve fiziksel gelişim analizi

Fotoğraf/video verileri analiz sonrası kalıcı olarak saklanmaz.

5. Rızanın Geri Alınması

KVKK md. 7 uyarınca rıza her zaman geri alınabilir. Geri alma öncesi işlemler hukuka uygun kalır.
Başvuru: Ayarlar > Gizlilik veya app.nextself@gmail.com`,
        en: `1. Processing of Sensitive Personal Data

Height, weight, nutrition, workout, water consumption, activity and HealthKit/Health Connect data are classified as "Special Category Personal Data (Health Data)". Processed with explicit consent for AI programs, nutrition plans, professional sharing and gamification.

2. Consent for International Data Transfer

• Supabase (US/EU) — Data storage
• DeepSeek AI (China) — Anonymized for AI generation
• Sentry (US) — Error tracking

Encryption, RLS and anonymization measures are applied.

3. AI-Based Automated Decision Making

AI decisions do not constitute medical advice. Must be reviewed per individual health condition. Consult a health professional before starting any program.

4. Biometric & Visual Data Processing Consent

• Posture Analysis: Body posture, joint angles analyzed via camera by AI
• Food Photo (Food Scanner): Sent to AI for nutritional value detection
• Physique Analysis (AI Coach): Muscle and physical development analysis

Photo/video data is not permanently stored after analysis.

5. Withdrawal of Consent

Consent may be withdrawn at any time under KVKK Art. 7. Processing prior to withdrawal remains lawful.
Contact: Settings > Privacy or app.nextself@gmail.com`
    },
    privacy: {
        tr: `1. Veri Güvenliği

Row Level Security (RLS) ve AES-256 şifreleme ile korunur. SSL/TLS şifreleme ile iletişim sağlanır.

2. Toplanan Sağlık Verileri

KVKK md. 6 kapsamında Özel Nitelikli Kişisel Veri olarak sınıflandırılır. Açık Rıza Metni ayrıca alınır.

3. Üçüncü Taraf Entegrasyonları

• Apple HealthKit / Google Health Connect: Sadece izinle
• DeepSeek AI: Anonimleştirilerek
• Sentry: Hata tespiti
Reklam ağlarıyla veri paylaşılmaz. Veriler satılmaz.

4. Yurt Dışına Veri Aktarımı

Supabase ve DeepSeek AI sunucuları yurt dışındadır. SSL/TLS, anonimleştirme ve RLS güvenlik önlemleri uygulanır.

5. Veri Saklama Süresi

Hesap silindiğinde: 30 gün içinde imha, 90 gün içinde yedeklerden silme.

6. Çerez ve İzleme

Üçüncü taraf çerez veya reklam takibi kullanılmaz. Yalnızca Sentry.

7. Çocukların Gizliliği

13 yaş ve üzeri için tasarlanmıştır. 13 yaş altı verileri derhal silinir.`,
        en: `1. Data Security

Protected with Row Level Security (RLS) and AES-256 encryption. Communication via SSL/TLS.

2. Health Data Collected

Classified as Special Category Personal Data under KVKK Art. 6. Separate Explicit Consent obtained.

3. Third-Party Integrations

• Apple HealthKit / Google Health Connect: Only with permission
• DeepSeek AI: Anonymized
• Sentry: Error detection
No data shared with advertising networks. Data never sold.

4. International Data Transfer

Supabase and DeepSeek AI servers are located abroad. SSL/TLS, anonymization and RLS security measures applied.

5. Data Retention

Upon account deletion: destroyed within 30 days, purged from backups within 90 days.

6. Cookies and Tracking

No third-party cookies or advertising tracking. Only Sentry used.

7. Children's Privacy

Designed for 13+. Data from under-13 individuals immediately deleted.`
    },
    subscription: {
        tr: `1. Hizmet Sağlayıcı Bilgileri

NextSelf — Dijital fitness ve sağlık uygulaması (SaaS)
İletişim: app.nextself@gmail.com

2. Abonelik Planları

• Ücretsiz Plan: Temel antrenman takibi, sınırlı AI, günlük görevler
• Premium Plan: Sınırsız AI erişimi, gelişmiş analitik, öncelikli destek

3. Ön Bilgilendirme (6502 Sayılı Kanun)

AI destekli kişiselleştirilmiş programlar. Dijital hizmet, anında aktif. Cayma hakkı: 14 gün.

4. Cayma Hakkı ve İstisnalar

14 gün içinde gerekçesiz cayma hakkı. Dijital içerik ifasına başlanmışsa istisna uygulanır.

5. İade Koşulları

• 14 gün cayma: 14 iş günü içinde iade
• Teknik sorun: 7 gün içinde çözülmezse tam iade
• Platform iadeleri: App Store / Google Play politikasına tabi

6. Abonelik İptali

İstediğiniz zaman iptal edilebilir. Dönem sonunda geçerli olur. Veriler korunur.

7. Fiyat Değişiklikleri

30 gün önceden bildirim. Kabul etmezseniz iptal edebilirsiniz.`,
        en: `1. Service Provider Information

NextSelf — Digital fitness and health application (SaaS)
Contact: app.nextself@gmail.com

2. Subscription Plans

• Free Plan: Basic workout tracking, limited AI, daily missions
• Premium Plan: Unlimited AI access, advanced analytics, priority support

3. Pre-Sale Information

AI-powered personalized programs. Digital service, instant activation. Withdrawal period: 14 days.

4. Right of Withdrawal & Exceptions

14-day withdrawal without reason. Exception applies if digital content delivery has begun.

5. Refund Conditions

• 14-day withdrawal: Refund within 14 business days
• Technical issues: Full refund if unresolved within 7 days
• Platform refunds: Subject to App Store / Google Play policy

6. Subscription Cancellation

Cancel anytime. Takes effect at end of billing period. Data retained.

7. Price Changes

30 days advance notice. Cancel if you don't accept.`
    },
    terms: {
        tr: `1. Tıbbi Feragatname

NextSelf bir sağlık kuruluşu, tıbbi cihaz veya doktor değildir. Tüm AI yanıtları yalnızca bilgilendirme niteliğindedir. Program öncesi doktora danışılmalıdır.

2. Fiziksel Yaralanma ve Sorumluluk Reddi

Programların uygulanması kullanıcının sorumluluğundadır. Yaralanma, sağlık sorunları veya zararlardan NextSelf sorumlu değildir.

3. Yapay Zeka ve Algoritmik Kararlar

AI programları otomatik oluşturulur. Kişisel sağlık geçmişi bilinmez. Doğruluk garanti edilmez.

4. Hesap Güvenliği

Hesap güvenliğinden kullanıcı sorumludur. Şüpheli aktivite: app.nextself@gmail.com

5. Yaş Sınırı

13 yaş ve üzeri. 13-18 arası veli onayı önerilir.

6. Fikri Mülkiyet

Tüm içerik ve algoritmalar korunmaktadır. İzinsiz kullanım yasaktır.

7. Hizmet Değişiklikleri

Önceden bildirimle değişiklik yapılabilir.

8. Uyuşmazlık Çözümü

Türkiye Cumhuriyeti kanunları uygulanır. İstanbul Mahkemeleri yetkilidir.

9. Yapay Zeka Halüsinasyonu

AI hatalı, yanıltıcı içerik üretebilir. Yanlış kalori, hatalı egzersiz önerileri olabilir. %100 doğruluk garanti edilmez.

10. Aracılık ve Komisyon (PT / Diyetisyen)

NextSelf aracı platformdur. Profesyonellerin yetkinliğini garanti etmez. %10 komisyon uygulanır. Kullanıcıya ek maliyet yoktur.

11. Sanal Ekonomi (XP, Gem, Coin)

Sanal birimler nakde çevrilemez, devredilemez. Mülkiyet hakkı yoktur. Hile durumunda hesap kapatılır.`,
        en: `1. Medical Disclaimer

NextSelf is not a healthcare institution, medical device, or doctor. All AI responses are informational only. Consult a doctor before starting any program.

2. Physical Injury & Liability Disclaimer

Application of programs is user's responsibility. NextSelf not liable for injuries, health issues or damages.

3. AI & Algorithmic Decisions

AI programs generated automatically. Not aware of personal medical history. Accuracy not guaranteed.

4. Account Security

User responsible for account security. Suspicious activity: app.nextself@gmail.com

5. Age Restriction

13+ years. Parental consent recommended for 13-18.

6. Intellectual Property

All content and algorithms protected. Unauthorized use prohibited.

7. Service Changes

Changes with prior notice.

8. Dispute Resolution

Turkish Republic laws apply. Istanbul Courts authorized.

9. AI Hallucination

AI may produce inaccurate, misleading content. Incorrect calories, wrong exercise suggestions possible. 100% accuracy not guaranteed.

10. Intermediary & Commission (PT / Dietitian)

NextSelf is an intermediary platform. Does not guarantee professional competence. 10% commission applied. No extra cost to user.

11. Virtual Economy (XP, Gem, Coin)

Virtual units cannot be converted to cash or transferred. No ownership rights. Account closed for cheating.`
    }
};

type ContractStatus = 'pending' | 'accepted' | 'active' | 'completed' | 'cancelled' | 'refunded' | 'withdrawn';

const LegalAgreements = () => {
    const [session, setSession] = useState<any>(null);
    const [userAgreements, setUserAgreements] = useState<any[]>([]);
    const [userContracts, setUserContracts] = useState<any[]>([]);
    const [expandedSection, setExpandedSection] = useState<any>(null);
    const [expandedContract, setExpandedContract] = useState<any>(null);
    const [accepting, setAccepting] = useState<any>(null);
    const [language, setLanguage] = useState('tr');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initData();
    }, []);

    const initData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session?.user) {
                await fetchUserAgreements(session.user.id);
                await fetchUserContracts(session.user.id);
            }
        } catch (err: any) {
            console.error('Init error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserAgreements = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_agreements')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);
            if (!error && data) {
                setUserAgreements(data);
            }
        } catch (err: any) {
            console.error('Fetch agreements error:', err);
        }
    };

    const fetchUserContracts = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('distance_sales_contracts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (!error && data) {
                setUserContracts(data);
            }
        } catch (err: any) {
            console.error('Fetch contracts error:', err);
        }
    };

    const getContractStatusBadge = (status: ContractStatus) => {
        const colors = {
            pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: language === 'tr' ? 'Bekliyor' : 'Pending' },
            accepted: { bg: 'bg-blue-50', text: 'text-blue-700', label: language === 'tr' ? 'Kabul Edildi' : 'Accepted' },
            active: { bg: 'bg-green-50', text: 'text-green-700', label: language === 'tr' ? 'Aktif' : 'Active' },
            completed: { bg: 'bg-gray-50', text: 'text-gray-600', label: language === 'tr' ? 'Tamamlandı' : 'Completed' },
            cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: language === 'tr' ? 'İptal' : 'Cancelled' },
            refunded: { bg: 'bg-purple-50', text: 'text-purple-700', label: language === 'tr' ? 'İade' : 'Refunded' },
            withdrawn: { bg: 'bg-orange-50', text: 'text-orange-700', label: language === 'tr' ? 'Cayma' : 'Withdrawn' },
        };
        return colors[status] || colors.pending;
    };

    const isAccepted = (agreementType: AgreementType) => {
        return userAgreements.some(a => a.agreement_type === agreementType && a.is_active);
    };

    const handleAccept = async (agreementType: AgreementType) => {
        if (!session?.user) { return; }
        setAccepting(agreementType);
        try {
            const { error } = await supabase.from('user_agreements').upsert({
                user_id: session.user.id,
                agreement_type: agreementType,
                version: '1.0',
                accepted_at: new Date().toISOString(),
                device_platform: 'web',
                is_active: true,
            }, { onConflict: 'user_id,agreement_type,version' });

            if (!error) {
                await fetchUserAgreements(session.user.id);
            }
        } catch (err: any) {
            console.error('Accept error:', err);
        } finally {
            setAccepting(null);
        }
    };

    const handleAcceptAll = async () => {
        if (!session?.user) { return; }
        setAccepting('all');
        try {
            const records = AGREEMENT_SECTIONS.map(s => ({
                user_id: session.user.id,
                agreement_type: s.key,
                version: '1.0',
                accepted_at: new Date().toISOString(),
                device_platform: 'web',
                is_active: true,
            }));
            const { error } = await supabase.from('user_agreements').upsert(records, {
                onConflict: 'user_id,agreement_type,version'
            });
            if (!error) {
                await fetchUserAgreements(session.user.id);
            }
        } catch (err: any) {
            console.error('Accept all error:', err);
        } finally {
            setAccepting(null);
        }
    };

    const acceptedCount = AGREEMENT_SECTIONS.filter(s => isAccepted(s.key)).length;
    const allAccepted = acceptedCount === AGREEMENT_SECTIONS.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {language === 'tr' ? 'Yasal Anlaşmalar ve Sözleşmeler' : 'Legal Agreements'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {language === 'tr' ? '5 Anlaşma, 37 Madde — Son Güncelleme: Mart 2026' : '5 Agreements, 37 Articles — Last Updated: March 2026'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setLanguage('tr')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${language === 'tr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                🇹🇷 TR
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                🇬🇧 EN
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {session && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                {language === 'tr' ? 'Kabul Durumu' : 'Acceptance Status'}
                            </span>
                            <span className="text-sm font-semibold text-primary-600">
                                {acceptedCount}/{AGREEMENT_SECTIONS.length}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${(acceptedCount / AGREEMENT_SECTIONS.length) * 100}%` }}
                            ></div>
                        </div>
                        {!allAccepted && (
                            <button
                                onClick={handleAcceptAll}
                                disabled={accepting === 'all'}
                                className="mt-3 w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium text-sm hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {accepting === 'all' ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <FiCheck className="w-4 h-4" />
                                        {language === 'tr' ? 'Tümünü Kabul Et' : 'Accept All'}
                                    </>
                                )}
                            </button>
                        )}
                        {allAccepted && (
                            <div className="mt-3 flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
                                <FiCheck className="w-5 h-5" />
                                {language === 'tr' ? 'Tüm sözleşmeler kabul edildi' : 'All agreements accepted'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Agreement Cards */}
            <div className="space-y-4">
                {AGREEMENT_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const accepted = isAccepted(section.key);
                    const isExpanded = expandedSection === section.key;
                    const content = AGREEMENT_CONTENT[section.key as AgreementType];

                    return (
                        <div
                            key={section.key}
                            className={`bg-white rounded-xl border transition-all duration-200 ${accepted ? 'border-green-200' : 'border-gray-200'} ${isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}`}
                        >
                            {/* Card Header */}
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer select-none"
                                onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${section.color}15` }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: section.color }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-base">
                                            {language === 'tr' ? section.titleTr : section.titleEn}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {section.articles} {language === 'tr' ? 'Madde' : 'Articles'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {accepted && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                            <FiCheck className="w-3 h-3" />
                                            {language === 'tr' ? 'Kabul Edildi' : 'Accepted'}
                                        </span>
                                    )}
                                    {isExpanded ? (
                                        <FiChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <FiChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="border-t border-gray-100">
                                    <div className="p-5">
                                        <div className="bg-gray-50 rounded-lg p-5 max-h-96 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                                                {language === 'tr' ? content.tr : content.en}
                                            </pre>
                                        </div>

                                        {/* Accept Button */}
                                        {session && !accepted && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAccept(section.key);
                                                }}
                                                disabled={accepting === section.key}
                                                className="mt-4 w-full py-3 rounded-lg font-medium text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}CC)` }}
                                            >
                                                {accepting === section.key ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                ) : (
                                                    <>
                                                        <FiCheck className="w-4 h-4" />
                                                        {language === 'tr' ? 'Okudum ve Kabul Ediyorum' : 'I Have Read and Accept'}
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {session && accepted && (
                                            <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg text-green-700 text-sm font-medium">
                                                <FiCheck className="w-4 h-4" />
                                                {language === 'tr' ? 'Bu sözleşmeyi kabul ettiniz' : 'You have accepted this agreement'}
                                            </div>
                                        )}

                                        {!session && (
                                            <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-amber-50 rounded-lg text-amber-700 text-sm">
                                                <FiAlertCircle className="w-4 h-4" />
                                                {language === 'tr' ? 'Kabul etmek için giriş yapmalısınız' : 'Please log in to accept agreements'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* MSS — Mesafeli Satış Sözleşmeleri */}
            {session && userContracts.length > 0 && (
                <div className="mt-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <FiCreditCard className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {language === 'tr' ? 'Mesafeli Satış Sözleşmeleri' : 'Distance Sales Contracts'}
                            </h2>
                            <p className="text-xs text-gray-400">
                                {language === 'tr' ? '6502 Sayılı Kanun — Dinamik Sözleşmeler' : 'Law No. 6502 — Dynamic Contracts'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {userContracts.map((contract) => {
                            const badge = getContractStatusBadge(contract.status);
                            const isOpen = expandedContract === contract.id;
                            return (
                                <div key={contract.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer"
                                        onClick={() => setExpandedContract(isOpen ? null : contract.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FiFileText className="w-5 h-5 text-amber-500" />
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">
                                                    {contract.contract_number}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {contract.plan_name} — {contract.billing_cycle === 'monthly'
                                                        ? (language === 'tr' ? 'Aylık' : 'Monthly')
                                                        : (language === 'tr' ? 'Yıllık' : 'Yearly')}
                                                    {' • '}
                                                    {new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: contract.currency || 'TRY' }).format(contract.total_price)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                                                {badge.label}
                                            </span>
                                            {isOpen ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="border-t border-gray-100 p-4">
                                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                <div>
                                                    <span className="text-gray-400">{language === 'tr' ? 'Alıcı' : 'Buyer'}:</span>
                                                    <p className="font-medium text-gray-700">{contract.buyer_name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">{language === 'tr' ? 'Tarih' : 'Date'}:</span>
                                                    <p className="font-medium text-gray-700">{new Date(contract.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">{language === 'tr' ? 'Fiyat (KDV hariç)' : 'Price (excl. tax)'}:</span>
                                                    <p className="font-medium text-gray-700">{contract.price} {contract.currency}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">{language === 'tr' ? 'KDV (%20)' : 'Tax (20%)'}:</span>
                                                    <p className="font-medium text-gray-700">{contract.tax_amount} {contract.currency}</p>
                                                </div>
                                                {contract.withdrawal_deadline && (
                                                    <div className="col-span-2">
                                                        <span className="text-gray-400">{language === 'tr' ? 'Cayma Hakkı Son Tarihi' : 'Withdrawal Deadline'}:</span>
                                                        <p className="font-medium text-gray-700">{new Date(contract.withdrawal_deadline).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {contract.contract_text && (
                                                <details className="mt-2">
                                                    <summary className="text-sm text-amber-600 cursor-pointer font-medium flex items-center gap-1">
                                                        <FiExternalLink className="w-3.5 h-3.5" />
                                                        {language === 'tr' ? 'Sözleşme Tam Metnini Görüntüle' : 'View Full Contract Text'}
                                                    </summary>
                                                    <div className="mt-3 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                                                        <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans leading-relaxed">
                                                            {contract.contract_text}
                                                        </pre>
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-400 pb-8">
                <p>NextSelf © 2026 — app.nextself@gmail.com</p>
                <p className="mt-1">
                    {language === 'tr'
                        ? 'Tüm hakları saklıdır. İstanbul Mahkemeleri yetkilidir.'
                        : 'All rights reserved. Istanbul Courts authorized.'}
                </p>
            </div>
        </div>
    );
};

export default LegalAgreements;
