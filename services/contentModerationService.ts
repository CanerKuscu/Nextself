import { SupabaseService } from './supabase';
import * as FileSystem from 'expo-file-system';
import { ValidationUtils } from '../utils/validation';

// ─── Types ───────────────────────────────────────────────────
export interface BanStatus {
    isBanned: boolean;
    banType?: 'temporary' | 'permanent';
    reason?: string;
    expiresAt?: string | null;
    violationCount?: number;
}

export interface BanMessage {
    title: string;
    message: string;
}

export interface ModerationResult {
    isApproved: boolean;
    reason?: string;
    confidence: number;
    flags: string[];
}

export interface ContentReport {
    userId: string;
    contentType: 'profile_photo' | 'message' | 'forum_post' | 'comment';
    contentId: string;
    reason: string;
}

// ─── Constants ───────────────────────────────────────────────
const MAX_VIOLATIONS_BEFORE_BAN = 3;
const TEMP_BAN_DURATION_DAYS = 7;
const MAX_IMAGE_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Service ─────────────────────────────────────────────────
export class ContentModerationService {
    private static instance: ContentModerationService;

    private constructor() { }

    static getInstance(): ContentModerationService {
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
    async checkBanStatus(userId: string): Promise<BanStatus> {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data, error } = await supabase
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
        } catch {
            return { isBanned: false };
        }
    }

    /**
     * Return a user-facing ban message, localized.
     */
    getBanMessage(status: BanStatus, isTurkish: boolean): BanMessage {
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
    async moderateProfileImage(imageUri: string): Promise<ModerationResult> {
        const flags: string[] = [];

        try {
            // 1. File-level checks
            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            if (!fileInfo.exists) {
                return { isApproved: false, reason: 'File not found', confidence: 1, flags: ['missing_file'] };
            }

            const sizeMB = ((fileInfo as any).size || 0) / (1024 * 1024);
            if (sizeMB > MAX_IMAGE_SIZE_MB) {
                return {
                    isApproved: false,
                    reason: `File too large (${sizeMB.toFixed(1)} MB). Maximum allowed is ${MAX_IMAGE_SIZE_MB} MB.`,
                    confidence: 1,
                    flags: ['file_too_large'],
                };
            }

            // 2. Extension / MIME check
            const ext = imageUri.split('.').pop()?.toLowerCase() || '';
            const validExts = ['jpg', 'jpeg', 'png', 'webp'];
            if (!validExts.includes(ext)) {
                flags.push('unusual_extension');
            }

            // 3. Server-side moderation via Supabase Edge Function (if available)
            try {
                const result = await this.callServerModeration(imageUri);
                if (result) {
                    return result;
                }
            } catch {
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
        } catch (err: any) {
            return {
                isApproved: false,
                reason: `Moderation check failed: ${err.message || 'Unknown error'}`,
                confidence: 0,
                flags: ['check_failed'],
            };
        }
    }

    /**
     * Call server-side NSFW detection via Supabase Edge Function.
     * Returns null if the edge function is not deployed.
     */
    private async callServerModeration(imageUri: string): Promise<ModerationResult | null> {
        try {
            const supabase = SupabaseService.getInstance().getClient();

            // Read image as base64
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64' as any,
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
            const { data, error } = await supabase.functions.invoke('moderate-image', {
                body: {
                    image: base64,
                    checkType: 'profile_photo',
                },
            });

            if (error) return null;

            if (data?.isNSFW) {
                return {
                    isApproved: false,
                    reason: data.reason || 'Image contains inappropriate content',
                    confidence: data.confidence || 0.9,
                    flags: data.flags || ['nsfw_detected'],
                };
            }

            return {
                isApproved: true,
                confidence: data?.confidence || 0.85,
                flags: data?.flags || [],
            };
        } catch {
            return null; // Edge function not available
        }
    }

    // ─── Violation Tracking ──────────────────────────────────
    /**
     * Record a content violation for the user and potentially issue a ban.
     */
    async recordViolation(
        userId: string,
        violationType: string,
        details?: string,
    ): Promise<{ banned: boolean; message: string }> {
        try {
            // Sanitize inputs to prevent SQL injection
            const sanitizedViolationType = ValidationUtils.sanitizeSQL(violationType);
            const sanitizedDetails = details ? ValidationUtils.sanitizeSQL(details) : null;

            const supabase = SupabaseService.getInstance().getClient();

            // Increment violation count
            const { data: profile } = await supabase
                .from('profiles')
                .select('content_violation_count')
                .eq('id', userId)
                .single();

            const currentCount = (profile?.content_violation_count || 0) + 1;

            const updateData: any = {
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
            } else if (currentCount >= MAX_VIOLATIONS_BEFORE_BAN) {
                // Temporary ban
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + TEMP_BAN_DURATION_DAYS);
                updateData.is_banned = true;
                updateData.ban_reason = `Temporary ban: ${currentCount} content violations (${sanitizedViolationType})`;
                updateData.ban_expires_at = expiresAt.toISOString();
                banned = true;
                message = `Account suspended for ${TEMP_BAN_DURATION_DAYS} days`;
            }

            await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', userId);

            // Log the violation
            try {
                await supabase.from('content_violations').insert({
                    user_id: userId,
                    violation_type: sanitizedViolationType,
                    details: sanitizedDetails || null,
                    created_at: new Date().toISOString(),
                });
            } catch { /* violation log is best-effort */ }

            return { banned, message };
        } catch {
            return { banned: false, message: 'Failed to record violation' };
        }
    }

    // ─── Content Reporting ───────────────────────────────────
    /**
     * Report inappropriate content.
     */
    async reportContent(report: ContentReport): Promise<boolean> {
        try {
            // Sanitize reason to prevent SQL injection
            const sanitizedReason = ValidationUtils.sanitizeSQL(report.reason);

            const supabase = SupabaseService.getInstance().getClient();
            const { user } = await SupabaseService.getInstance().getCurrentUser();

            const { error } = await supabase.from('content_reports').insert({
                reported_by: user?.id,
                reported_user_id: report.userId,
                content_type: report.contentType,
                content_id: report.contentId,
                reason: sanitizedReason,
                status: 'pending',
                created_at: new Date().toISOString(),
            });

            return !error;
        } catch {
            return false;
        }
    }
}
