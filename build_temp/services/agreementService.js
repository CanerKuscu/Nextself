"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgreementService = void 0;
const react_native_1 = require("react-native");
const supabase_1 = require("./supabase");
const CURRENT_VERSION = '1.0';
const ALL_AGREEMENT_TYPES = ['kvkk', 'consent', 'privacy', 'subscription', 'terms'];
const AGREEMENT_LABELS = {
    kvkk: { tr: 'KVKK Aydınlatma Metni', en: 'KVKK Disclosure' },
    consent: { tr: 'Açık Rıza Metni', en: 'Explicit Consent' },
    privacy: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
    subscription: { tr: 'Abonelik ve İade Politikası', en: 'Subscription & Refund Policy' },
    terms: { tr: 'Kullanım Koşulları', en: 'Terms of Service' },
};
class AgreementService {
    constructor() {
        this.supabase = supabase_1.SupabaseService.getInstance();
    }
    static getInstance() {
        if (!AgreementService.instance) {
            AgreementService.instance = new AgreementService();
        }
        return AgreementService.instance;
    }
    /**
     * Get label for an agreement type
     */
    getLabel(type, isTurkish) {
        return isTurkish ? AGREEMENT_LABELS[type].tr : AGREEMENT_LABELS[type].en;
    }
    /**
     * Accept a single agreement
     */
    acceptAgreement(userId_1, agreementType_1) {
        return __awaiter(this, arguments, void 0, function* (userId, agreementType, version = CURRENT_VERSION) {
            try {
                const client = this.supabase.getClient();
                const { error } = yield client.from('user_agreements').upsert({
                    user_id: userId,
                    agreement_type: agreementType,
                    version,
                    accepted_at: new Date().toISOString(),
                    device_platform: react_native_1.Platform.OS,
                    is_active: true,
                }, { onConflict: 'user_id,agreement_type,version' });
                if (error) {
                    console.error('Agreement accept error:', error);
                    return { success: false, error: error.message };
                }
                return { success: true };
            }
            catch (err) {
                console.error('Agreement accept exception:', err);
                return { success: false, error: err.message };
            }
        });
    }
    /**
     * Accept multiple agreements at once (used during registration)
     */
    acceptMultipleAgreements(userId_1, agreementTypes_1) {
        return __awaiter(this, arguments, void 0, function* (userId, agreementTypes, version = CURRENT_VERSION) {
            try {
                const client = this.supabase.getClient();
                // Process each agreement individually to avoid bulk upsert issues
                for (const type of agreementTypes) {
                    const { error } = yield client.from('user_agreements').upsert({
                        user_id: userId,
                        agreement_type: type,
                        version,
                        accepted_at: new Date().toISOString(),
                        device_platform: react_native_1.Platform.OS,
                        is_active: true,
                    }, { onConflict: 'user_id,agreement_type,version' });
                    if (error) {
                        console.error(`Agreement accept error for ${type}:`, error);
                        return { success: false, error: error.message };
                    }
                }
                return { success: true };
            }
            catch (err) {
                console.error('Bulk agreement accept exception:', err);
                return { success: false, error: err.message };
            }
        });
    }
    /**
     * Accept all required agreements during registration
     */
    acceptAllRegistrationAgreements(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.acceptMultipleAgreements(userId, ALL_AGREEMENT_TYPES);
        });
    }
    /**
     * Get all accepted agreements for a user
     */
    getUserAgreements(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                const { data, error } = yield client
                    .from('user_agreements')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .order('accepted_at', { ascending: false });
                if (error) {
                    console.error('Get agreements error:', error);
                    return [];
                }
                return data || [];
            }
            catch (err) {
                console.error('Get agreements exception:', err);
                return [];
            }
        });
    }
    /**
     * Check if user has accepted a specific agreement
     */
    hasAccepted(userId_1, agreementType_1) {
        return __awaiter(this, arguments, void 0, function* (userId, agreementType, version = CURRENT_VERSION) {
            try {
                const client = this.supabase.getClient();
                const { data, error } = yield client
                    .from('user_agreements')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('agreement_type', agreementType)
                    .eq('version', version)
                    .eq('is_active', true)
                    .maybeSingle();
                if (error)
                    return false;
                return !!data;
            }
            catch (_a) {
                return false;
            }
        });
    }
    /**
     * Check if user has accepted all required agreements
     */
    hasAcceptedAll(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const agreements = yield this.getUserAgreements(userId);
                const acceptedTypes = agreements
                    .filter((a) => a.version === CURRENT_VERSION)
                    .map((a) => a.agreement_type);
                const missing = ALL_AGREEMENT_TYPES.filter((type) => !acceptedTypes.includes(type));
                return {
                    allAccepted: missing.length === 0,
                    missing,
                    accepted: acceptedTypes,
                };
            }
            catch (_a) {
                return {
                    allAccepted: false,
                    missing: ALL_AGREEMENT_TYPES,
                    accepted: [],
                };
            }
        });
    }
    /**
     * Withdraw consent (KVKK rıza geri alma)
     */
    withdrawConsent(userId, agreementType, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                const { error } = yield client
                    .from('user_agreements')
                    .update({
                    is_active: false,
                    withdrawn_at: new Date().toISOString(),
                    withdrawal_reason: reason || null,
                })
                    .eq('user_id', userId)
                    .eq('agreement_type', agreementType)
                    .eq('is_active', true);
                if (error) {
                    console.error('Withdraw consent error:', error);
                    return { success: false, error: error.message };
                }
                return { success: true };
            }
            catch (err) {
                console.error('Withdraw consent exception:', err);
                return { success: false, error: err.message };
            }
        });
    }
    /**
     * Get available agreement versions
     */
    getAgreementVersions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                const { data, error } = yield client
                    .from('agreement_versions')
                    .select('*')
                    .eq('is_current', true)
                    .order('agreement_type');
                if (error) {
                    console.error('Get versions error:', error);
                    return [];
                }
                return data || [];
            }
            catch (_a) {
                return [];
            }
        });
    }
    /**
     * Get agreement acceptance history (for audit/privacy settings)
     */
    getAcceptanceHistory(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                const { data, error } = yield client
                    .from('user_agreements')
                    .select('*')
                    .eq('user_id', userId)
                    .order('accepted_at', { ascending: false });
                if (error)
                    return [];
                return data || [];
            }
            catch (_a) {
                return [];
            }
        });
    }
    // ==================== MESAFELI SATIŞ SÖZLEŞMESİ (MSS) ====================
    /**
     * Generate MSS contract number
     */
    generateContractNumber() {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        return `BSC-${date}-${rand}`;
    }
    /**
     * Generate MSS contract text (6502 Sayılı Kanun uyarınca)
     */
    generateContractText(buyerName, buyerEmail, buyerAddress, planName, price, currency, billingCycle, contractNumber, isTurkish) {
        const date = new Date().toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US');
        const withdrawalDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US');
        if (isTurkish) {
            return `MESAFELİ SATIŞ SÖZLEŞMESİ
Sözleşme No: ${contractNumber}
Tarih: ${date}

SATICI BİLGİLERİ:
Unvan: NextSelf
E-posta: app.nextself@gmail.com
Hizmet Türü: Dijital Fitness (SaaS) ve Uzaktan Eğitim/Danışmanlık

ALICI BİLGİLERİ:
Ad Soyad: ${buyerName}
E-posta: ${buyerEmail}
Adres: ${buyerAddress || 'Belirtilmedi'}

SÖZLEŞME KONUSU:
Hizmet: ${planName}
Fatura Dönemi: ${billingCycle === 'monthly' ? 'Aylık' : 'Yıllık'}
Tutar: ${price} ${currency} (KDV dahil)
Ödeme Yöntemi: App Store / Google Play / Kredi Kartı

CAYMA HAKKI:
6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, ${withdrawalDate} tarihine kadar (14 gün) herhangi bir gerekçe göstermeksizin cayma hakkınızı kullanabilirsiniz.

İSTİSNA: Dijital içeriğin ifasına başlanmış olması halinde (AI programlarının oluşturulması, kişiselleştirilmiş içeriklerin sunulması) veya canlı/uzaktan hizmetin ifa edilmiş olması durumunda, cayma hakkının kaybedileceği konusunda bilgilendirildiğinizi ve onay verdiğinizi kabul etmektesiniz.

ÖN BİLGİLENDİRME:
• Hizmet dijital ortamda veya uzaktan iletişim araçlarıyla sunulmakta olup, ödeme onayı ile anında aktif olmaktadır.
• Hizmetin temel nitelikleri: AI destekli kişiselleştirilmiş fitness, beslenme programları ve/veya uzmanlarca sunulan uzaktan/yüz yüze danışmanlık.
• Tüm fiyatlar KDV dahildir.
• İade, cayma hakkı kullanıldığı takdirde 14 iş günü içinde aynı ödeme yöntemiyle yapılır.

İşbu sözleşmeyi okudum, anladım ve kabul ediyorum.`;
        }
        return `DISTANCE SALES CONTRACT
Contract No: ${contractNumber}
Date: ${date}

SELLER INFORMATION:
Name: NextSelf
Email: app.nextself@gmail.com
Service Type: Digital Fitness (SaaS) and Remote Education/Consultancy

BUYER INFORMATION:
Full Name: ${buyerName}
Email: ${buyerEmail}
Address: ${buyerAddress || 'Not specified'}

CONTRACT SUBJECT:
Service: ${planName}
Billing Cycle: ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
Amount: ${price} ${currency} (tax included)
Payment Method: App Store / Google Play / Credit Card

RIGHT OF WITHDRAWAL:
Under the Consumer Protection Law and Distance Contracts Regulation, you may exercise your right of withdrawal until ${withdrawalDate} (14 days) without providing any reason.

EXCEPTION: If the performance of digital content has begun (generation of AI programs, delivery of personalized content) or if the live/remote service has been performed, and you have been informed that this would result in loss of withdrawal rights and have given consent, the right of withdrawal does not apply.

PRE-INFORMATION:
• The service is provided digitally or via remote communication tools and activates immediately upon payment confirmation.
• Core features: AI-powered personalized fitness, nutrition programs, and/or remote/face-to-face consultancy provided by experts.
• All prices include applicable taxes.
• Refunds are processed within 14 business days via the same payment method upon withdrawal.

I have read, understood, and accept this contract.`;
    }
    /**
     * Create a new MSS contract before payment
     */
    createDistanceSalesContract(userId_1, buyerName_1, buyerEmail_1, buyerAddress_1, planId_1, planName_1, billingCycle_1, price_1) {
        return __awaiter(this, arguments, void 0, function* (userId, buyerName, buyerEmail, buyerAddress, planId, planName, billingCycle, price, currency = 'TRY', isTurkish = true) {
            try {
                const client = this.supabase.getClient();
                const contractNumber = this.generateContractNumber();
                const taxAmount = price * 0.20; // %20 KDV
                const totalAmount = price;
                const withdrawalDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
                const contractText = this.generateContractText(buyerName, buyerEmail, buyerAddress, planName, price, currency, billingCycle, contractNumber, isTurkish);
                const record = {
                    contract_number: contractNumber,
                    user_id: userId,
                    buyer_name: buyerName,
                    buyer_email: buyerEmail,
                    buyer_address: buyerAddress || null,
                    plan_id: planId,
                    plan_name: planName,
                    billing_cycle: billingCycle,
                    price,
                    currency,
                    tax_amount: taxAmount,
                    total_amount: totalAmount,
                    status: 'pending',
                    device_platform: react_native_1.Platform.OS,
                    pre_info_shown_at: new Date().toISOString(),
                    withdrawal_deadline: withdrawalDeadline,
                    contract_text: contractText,
                };
                const { data, error } = yield client
                    .from('distance_sales_contracts')
                    .insert(record)
                    .select()
                    .single();
                if (error)
                    return { success: false, error: error.message };
                return { success: true, contract: data };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
    }
    /**
     * Accept MSS contract (user confirms before payment)
     */
    acceptDistanceSalesContract(contractId_1) {
        return __awaiter(this, arguments, void 0, function* (contractId, digitalContentConsent = true) {
            try {
                const client = this.supabase.getClient();
                const { error } = yield client
                    .from('distance_sales_contracts')
                    .update({
                    status: 'accepted',
                    accepted_at: new Date().toISOString(),
                    pre_info_accepted_at: new Date().toISOString(),
                    digital_content_consent: digitalContentConsent,
                })
                    .eq('id', contractId);
                if (error)
                    return { success: false, error: error.message };
                return { success: true };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
    }
    /**
     * Mark MSS as active (after payment success)
     */
    activateContract(contractId, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                yield client
                    .from('distance_sales_contracts')
                    .update({
                    status: 'active',
                    digital_content_started: true,
                    payment_id: paymentId || null,
                })
                    .eq('id', contractId);
            }
            catch (err) {
                console.error('Activate contract error:', err);
            }
        });
    }
    /**
     * Exercise withdrawal right (cayma hakkı)
     */
    withdrawFromContract(contractId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                // Check if withdrawal is still within deadline
                const { data: contract } = yield client
                    .from('distance_sales_contracts')
                    .select('withdrawal_deadline, digital_content_started, digital_content_consent')
                    .eq('id', contractId)
                    .single();
                if (!contract)
                    return { success: false, error: 'Contract not found' };
                const now = new Date();
                const deadline = new Date(contract.withdrawal_deadline);
                if (now > deadline) {
                    return { success: false, error: 'Withdrawal deadline has passed (14 days)' };
                }
                if (contract.digital_content_started && contract.digital_content_consent) {
                    return { success: false, error: 'Digital content has started with your consent' };
                }
                const { error } = yield client
                    .from('distance_sales_contracts')
                    .update({
                    status: 'withdrawn',
                    withdrawn_at: new Date().toISOString(),
                    withdrawal_reason: reason || null,
                })
                    .eq('id', contractId);
                if (error)
                    return { success: false, error: error.message };
                return { success: true };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
    }
    /**
     * Get user's MSS contracts
     */
    getUserContracts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                const { data, error } = yield client
                    .from('distance_sales_contracts')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                if (error)
                    return [];
                return data || [];
            }
            catch (_a) {
                return [];
            }
        });
    }
    // ==================== JUST-IN-TIME BİYOMETRİK ONAY ====================
    /**
     * Record biometric consent (Just-in-Time micro-consent)
     */
    recordBiometricConsent(userId, consentType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                const { error } = yield client.from('biometric_consents').insert({
                    user_id: userId,
                    consent_type: consentType,
                    granted: true,
                    granted_at: new Date().toISOString(),
                    device_platform: react_native_1.Platform.OS,
                    session_id: `session_${Date.now()}`,
                });
                if (error)
                    return { success: false, error: error.message };
                return { success: true };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
    }
    /**
     * Check if user has given recent biometric consent (within session)
     */
    hasBiometricConsent(userId, consentType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.supabase.getClient();
                const { data, error } = yield client
                    .from('biometric_consents')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('consent_type', consentType)
                    .eq('granted', true)
                    .is('revoked_at', null)
                    .limit(1);
                if (error)
                    return false;
                return ((data === null || data === void 0 ? void 0 : data.length) || 0) > 0;
            }
            catch (_a) {
                return false;
            }
        });
    }
    /**
     * Get biometric consent labels
     */
    getBiometricConsentInfo(type, isTurkish) {
        const info = {
            posture_analysis: {
                title: {
                    tr: 'Biyometrik Veri İşleme Onayı',
                    en: 'Biometric Data Processing Consent'
                },
                message: {
                    tr: 'Postür analizi için kameranız açılacak ve vücut duruşunuz, eklem açılarınız yapay zeka tarafından analiz edilecektir. Bu veriler yalnızca bu analiz için kullanılacak ve kalıcı olarak saklanmayacaktır.\n\nKVKK md. 6 kapsamında özel nitelikli kişisel veri işlenmektedir.',
                    en: 'Your camera will open for posture analysis. Your body posture and joint angles will be analyzed by AI. This data will only be used for this analysis and will not be permanently stored.\n\nSpecial category personal data is being processed under KVKK Art. 6.'
                },
                dataType: { tr: 'Vücut duruşu, eklem açıları', en: 'Body posture, joint angles' }
            },
            food_scanner: {
                title: {
                    tr: 'Görsel Veri İşleme Onayı',
                    en: 'Visual Data Processing Consent'
                },
                message: {
                    tr: 'Yemek fotoğrafınız besin değeri analizi için DeepSeek AI modeline gönderilecektir. Fotoğraf analiz sonrası kalıcı olarak saklanmayacaktır.',
                    en: 'Your food photo will be sent to the DeepSeek AI model for nutritional analysis. The photo will not be permanently stored after analysis.'
                },
                dataType: { tr: 'Yemek fotoğrafı', en: 'Food photograph' }
            },
            body_analysis: {
                title: {
                    tr: 'Biyometrik Veri İşleme Onayı',
                    en: 'Biometric Data Processing Consent'
                },
                message: {
                    tr: 'Vücut fotoğrafınız fiziksel gelişim ve kas analizi için DeepSeek AI modeline gönderilecektir. Fotoğraf analiz sonrası kalıcı olarak saklanmayacaktır.\n\nKVKK md. 6 kapsamında özel nitelikli kişisel veri işlenmektedir.',
                    en: 'Your body photo will be sent to the DeepSeek AI model for physical development and muscle analysis. The photo will not be permanently stored after analysis.\n\nSpecial category personal data is being processed under KVKK Art. 6.'
                },
                dataType: { tr: 'Vücut fotoğrafı', en: 'Body photograph' }
            },
            barcode_scanner: {
                title: {
                    tr: 'Kamera Erişim Onayı',
                    en: 'Camera Access Consent'
                },
                message: {
                    tr: 'Barkod okuma için kameranız açılacaktır. Kamera görüntüsü yalnızca barkod tespiti için kullanılacak ve kaydedilmeyecektir.',
                    en: 'Your camera will open for barcode scanning. Camera feed will only be used for barcode detection and will not be recorded.'
                },
                dataType: { tr: 'Kamera görüntüsü', en: 'Camera feed' }
            }
        };
        const i = info[type];
        return {
            title: isTurkish ? i.title.tr : i.title.en,
            message: isTurkish ? i.message.tr : i.message.en,
            dataType: isTurkish ? i.dataType.tr : i.dataType.en,
        };
    }
}
exports.AgreementService = AgreementService;
