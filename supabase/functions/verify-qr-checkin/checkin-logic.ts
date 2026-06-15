/**
 * Pure authorization helpers for the verify-qr-checkin edge function.
 *
 * These are extracted so they can be unit-tested from a Node/Jest environment
 * without pulling Deno-specific globals.
 */

export interface CheckinRelationship {
    client_id?: string | null;
    professional_id?: string | null;
    trainer_id?: string | null;
    dietitian_id?: string | null;
    billing_status?: string | null;
}

/**
 * Normalize a Supabase nested-select relationship payload. Depending on the
 * inferred relationship, Supabase JS may return the related row as either a
 * single object or a 1-element array.
 */
export function normalizeNestedRelationship(
    value: CheckinRelationship | CheckinRelationship[] | null | undefined,
): CheckinRelationship | null {
    if (!value) return null;
    if (Array.isArray(value)) {
        return value.length > 0 ? value[0] : null;
    }
    return value;
}

/**
 * The relationship row stores professional_profiles.id (a row PK).
 * Return whichever of (professional_id, trainer_id, dietitian_id) is set,
 * or null if none.
 */
export function pickProfessionalProfileId(
    relationship: CheckinRelationship,
): string | null {
    return (
        relationship.professional_id ||
        relationship.trainer_id ||
        relationship.dietitian_id ||
        null
    );
}

/**
 * The caller's auth.users.id must match the professional_profiles.user_id
 * that owns the professional profile referenced by the relationship. This is
 * the core authorization check for QR check-in verification.
 */
export function isCallerAuthorized(
    callerAuthUserId: string,
    professionalProfileUserId: string | null | undefined,
): boolean {
    if (!callerAuthUserId || !professionalProfileUserId) return false;
    return callerAuthUserId === professionalProfileUserId;
}
