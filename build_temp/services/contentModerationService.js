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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModerationService = void 0;
const supabase_1 = require("./supabase");
const FileSystem = __importStar(require("expo-file-system"));
const validation_1 = require("../utils/validation");
// ─── Constants ───────────────────────────────────────────────
const MAX_VIOLATIONS_BEFORE_BAN = 3;
const TEMP_BAN_DURATION_DAYS = 7;
const MAX_IMAGE_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// ─── Service ─────────────────────────────────────────────────
class ContentModerationService {
    constructor() { }
    static getInstance() {
        if (!ContentModerationService.instance) {
            ContentModerationService.instance = new ContentModerationService();
        }
        return ContentModerationService.instance;
    }
    // ─── Ban Status ──────────────────────────────────────────
    /**
     * Check whether a user is currently banned.
     * Looks at `profiles.is_banned` and `profiles.ban_expires_at`.
     */
    checkBanStatus(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const { data, error } = yield supabase
                    .from('profiles')
                    .select('is_banned, ban_reason, ban_expires_at, content_violation_count')
                    .eq('id', userId)
                    .single();
                if (error || !data) {
                    return { isBanned: false };
                }
                // If ban has expired, treat as not banned
                if (data.is_banned && data.ban_expires_at) {
                    const expiresAt = new Date(data.ban_expires_at);
                    if (expiresAt <= new Date()) {
                        // Auto-unban: clear the flag (fire-and-forget)
                        supabase
                            .from('profiles')
                            .update({ is_banned: false, ban_reason: null, ban_expires_at: null })
                            .eq('id', userId)
                            .then(() => { });
                        return { isBanned: false };
                    }
                }
                return {
                    isBanned: !!data.is_banned,
                    banType: data.ban_expires_at ? 'temporary' : 'permanent',
                    reason: data.ban_reason || undefined,
                    expiresAt: data.ban_expires_at || null,
                    violationCount: data.content_violation_count || 0,
                };
            }
            catch (_a) {
                return { isBanned: false };
            }
        });
    }
    /**
     * Return a user-facing ban message, localized.
     */
    getBanMessage(status, isTurkish) {
        if (!status.isBanned) {
            return {
                title: isTurkish ? 'Erişim Açık' : 'Access Granted',
                message: isTurkish ? 'Hesabınız aktif.' : 'Your account is active.',
            };
        }
        if (status.banType === 'temporary' && status.expiresAt) {
            const expiry = new Date(status.expiresAt);
            const formatted = expiry.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
            return {
                title: isTurkish ? 'Hesap Geçici Olarak Askıya Alındı' : 'Account Temporarily Suspended',
                message: isTurkish
                    ? `Hesabınız topluluk kurallarını ihlal ettiğiniz için geçici olarak askıya alındı. Yasak ${formatted} tarihinde sona erecektir. Sebep: ${status.reason || 'Uygunsuz içerik'}`
                    : `Your account has been temporarily suspended for violating community guidelines. The ban will expire on ${formatted}. Reason: ${status.reason || 'Inappropriate content'}`,
            };
        }
        return {
            title: isTurkish ? 'Hesap Kalıcı Olarak Yasaklandı' : 'Account Permanently Banned',
            message: isTurkish
                ? `Hesabınız topluluk kurallarının tekrarlanan ihlali nedeniyle kalıcı olarak yasaklanmıştır. Sebep: ${status.reason || 'Uygunsuz içerik'}`
                : `Your account has been permanently banned for repeated violations of community guidelines. Reason: ${status.reason || 'Inappropriate content'}`,
        };
    }
    // ─── Image Moderation ────────────────────────────────────
    /**
     * Moderate a profile image before upload.
     * Performs client-side checks (file size, type) and
     * a basic server-side NSFW heuristic via Supabase Edge Function.
     */
    moderateProfileImage(imageUri) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const flags = [];
            try {
                // 1. File-level checks
                const fileInfo = yield FileSystem.getInfoAsync(imageUri);
                if (!fileInfo.exists) {
                    return { isApproved: false, reason: 'File not found', confidence: 1, flags: ['missing_file'] };
                }
                const sizeMB = (fileInfo.size || 0) / (1024 * 1024);
                if (sizeMB > MAX_IMAGE_SIZE_MB) {
                    return {
                        isApproved: false,
                        reason: `File too large (${sizeMB.toFixed(1)} MB). Maximum allowed is ${MAX_IMAGE_SIZE_MB} MB.`,
                        confidence: 1,
                        flags: ['file_too_large'],
                    };
                }
                // 2. Extension / MIME check
                const ext = ((_a = imageUri.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                const validExts = ['jpg', 'jpeg', 'png', 'webp'];
                if (!validExts.includes(ext)) {
                    flags.push('unusual_extension');
                }
                // 3. Server-side moderation via Supabase Edge Function (if available)
                try {
                    const result = yield this.callServerModeration(imageUri);
                    if (result) {
                        return result;
                    }
                }
                catch (_b) {
                    // Edge function not available — fall through to client-side approval
                }
                // 4. Client-side: if we can't reach server moderation, allow with low confidence
                //    The image will still be checked server-side via the storage trigger.
                flags.push('server_moderation_unavailable');
                return {
                    isApproved: true,
                    confidence: 0.4,
                    reason: 'Server moderation unavailable. Image will be verified after upload.',
                    flags,
                };
            }
            catch (err) {
                return {
                    isApproved: false,
                    reason: `Moderation check failed: ${err.message || 'Unknown error'}`,
                    confidence: 0,
                    flags: ['check_failed'],
                };
            }
        });
    }
    /**
     * Call server-side NSFW detection via Supabase Edge Function.
     * Returns null if the edge function is not deployed.
     */
    callServerModeration(imageUri) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                // Read image as base64
                const base64 = yield FileSystem.readAsStringAsync(imageUri, {
                    encoding: 'base64',
                });
                // Limit to ~5MB base64 payload to avoid edge function timeout
                const maxBase64Length = 5 * 1024 * 1024 * 1.37; // ~5MB file ≈ 6.85MB base64
                if (base64.length > maxBase64Length) {
                    return {
                        isApproved: false,
                        reason: 'Image file is too large for moderation check',
                        confidence: 1,
                        flags: ['payload_too_large'],
                    };
                }
                // Call edge function with full base64 image
                const { data, error } = yield supabase.functions.invoke('moderate-image', {
                    body: {
                        image: base64,
                        checkType: 'profile_photo',
                    },
                });
                if (error)
                    return null;
                if (data === null || data === void 0 ? void 0 : data.isNSFW) {
                    return {
                        isApproved: false,
                        reason: data.reason || 'Image contains inappropriate content',
                        confidence: data.confidence || 0.9,
                        flags: data.flags || ['nsfw_detected'],
                    };
                }
                return {
                    isApproved: true,
                    confidence: (data === null || data === void 0 ? void 0 : data.confidence) || 0.85,
                    flags: (data === null || data === void 0 ? void 0 : data.flags) || [],
                };
            }
            catch (_a) {
                return null; // Edge function not available
            }
        });
    }
    // ─── Violation Tracking ──────────────────────────────────
    /**
     * Record a content violation for the user and potentially issue a ban.
     */
    recordViolation(userId, violationType, details) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Sanitize inputs to prevent SQL injection
                const sanitizedViolationType = validation_1.ValidationUtils.sanitizeSQL(violationType);
                const sanitizedDetails = details ? validation_1.ValidationUtils.sanitizeSQL(details) : null;
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                // Increment violation count
                const { data: profile } = yield supabase
                    .from('profiles')
                    .select('content_violation_count')
                    .eq('id', userId)
                    .single();
                const currentCount = ((profile === null || profile === void 0 ? void 0 : profile.content_violation_count) || 0) + 1;
                const updateData = {
                    content_violation_count: currentCount,
                };
                let banned = false;
                let message = 'Warning issued';
                // Auto-ban after threshold
                if (currentCount >= MAX_VIOLATIONS_BEFORE_BAN * 2) {
                    // Permanent ban
                    updateData.is_banned = true;
                    updateData.ban_reason = `Permanent ban: ${currentCount} content violations (${sanitizedViolationType})`;
                    updateData.ban_expires_at = null;
                    banned = true;
                    message = 'Account permanently banned due to repeated violations';
                }
                else if (currentCount >= MAX_VIOLATIONS_BEFORE_BAN) {
                    // Temporary ban
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + TEMP_BAN_DURATION_DAYS);
                    updateData.is_banned = true;
                    updateData.ban_reason = `Temporary ban: ${currentCount} content violations (${sanitizedViolationType})`;
                    updateData.ban_expires_at = expiresAt.toISOString();
                    banned = true;
                    message = `Account suspended for ${TEMP_BAN_DURATION_DAYS} days`;
                }
                yield supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', userId);
                // Log the violation
                try {
                    yield supabase.from('content_violations').insert({
                        user_id: userId,
                        violation_type: sanitizedViolationType,
                        details: sanitizedDetails || null,
                        created_at: new Date().toISOString(),
                    });
                }
                catch ( /* violation log is best-effort */_a) { /* violation log is best-effort */ }
                return { banned, message };
            }
            catch (_b) {
                return { banned: false, message: 'Failed to record violation' };
            }
        });
    }
    // ─── Content Reporting ───────────────────────────────────
    /**
     * Report inappropriate content.
     */
    reportContent(report) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Sanitize reason to prevent SQL injection
                const sanitizedReason = validation_1.ValidationUtils.sanitizeSQL(report.reason);
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
                const { error } = yield supabase.from('content_reports').insert({
                    reported_by: user === null || user === void 0 ? void 0 : user.id,
                    reported_user_id: report.userId,
                    content_type: report.contentType,
                    content_id: report.contentId,
                    reason: sanitizedReason,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                });
                return !error;
            }
            catch (_a) {
                return false;
            }
        });
    }
}
exports.ContentModerationService = ContentModerationService;
