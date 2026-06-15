import {
    isCallerAuthorized,
    normalizeNestedRelationship,
    pickProfessionalProfileId,
} from '../supabase/functions/verify-qr-checkin/checkin-logic';

describe('verify-qr-checkin authorization helpers', () => {
    describe('normalizeNestedRelationship', () => {
        it('returns the single object as-is when Supabase returns a record', () => {
            const rel = { professional_id: 'prof-1', client_id: 'c-1' };
            expect(normalizeNestedRelationship(rel)).toEqual(rel);
        });

        it('returns first element when Supabase returns a 1-element array', () => {
            const rel = [{ professional_id: 'prof-1', client_id: 'c-1' }];
            expect(normalizeNestedRelationship(rel)).toEqual(rel[0]);
        });

        it('returns null for an empty array', () => {
            expect(normalizeNestedRelationship([])).toBeNull();
        });

        it('returns null for null or undefined', () => {
            expect(normalizeNestedRelationship(null)).toBeNull();
            expect(normalizeNestedRelationship(undefined)).toBeNull();
        });
    });

    describe('pickProfessionalProfileId', () => {
        it('prefers professional_id when present', () => {
            const id = pickProfessionalProfileId({
                professional_id: 'p-1',
                trainer_id: 't-1',
                dietitian_id: 'd-1',
            });
            expect(id).toBe('p-1');
        });

        it('falls back to trainer_id when professional_id missing', () => {
            const id = pickProfessionalProfileId({
                professional_id: null,
                trainer_id: 't-1',
            });
            expect(id).toBe('t-1');
        });

        it('falls back to dietitian_id last', () => {
            const id = pickProfessionalProfileId({
                professional_id: null,
                trainer_id: null,
                dietitian_id: 'd-1',
            });
            expect(id).toBe('d-1');
        });

        it('returns null when none are set', () => {
            const id = pickProfessionalProfileId({});
            expect(id).toBeNull();
        });
    });

    describe('isCallerAuthorized', () => {
        it('authorizes when caller auth.users.id matches the profile owner', () => {
            expect(isCallerAuthorized('auth-user-42', 'auth-user-42')).toBe(true);
        });

        it('rejects when ids do not match (the original ID-space bug)', () => {
            // Before the fix, the function compared auth.users.id to professional_profiles.id (a different
            // ID-space) — so legitimate trainers were rejected. This test guards the fix: the helper takes
            // the *user_id* of the professional_profile, not its row PK.
            expect(isCallerAuthorized('auth-user-42', 'professional-profile-row-pk')).toBe(false);
        });

        it('rejects when caller id is empty', () => {
            expect(isCallerAuthorized('', 'auth-user-42')).toBe(false);
        });

        it('rejects when professional user id is missing', () => {
            expect(isCallerAuthorized('auth-user-42', null)).toBe(false);
            expect(isCallerAuthorized('auth-user-42', undefined)).toBe(false);
        });
    });
});
