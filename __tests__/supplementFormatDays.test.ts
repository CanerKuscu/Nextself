import { formatDays } from '../utils/formatDays';

describe('formatDays', () => {
    describe('all-or-nothing collapsing', () => {
        it('returns "Every Day" for empty array (EN)', () => {
            expect(formatDays([], false)).toBe('Every Day');
        });

        it('returns "Her Gün" for empty array (TR)', () => {
            expect(formatDays([], true)).toBe('Her Gün');
        });

        it('returns "Every Day" for all seven days (EN)', () => {
            expect(formatDays([0, 1, 2, 3, 4, 5, 6], false)).toBe('Every Day');
        });

        it('returns "Her Gün" for all seven days (TR)', () => {
            expect(formatDays([0, 1, 2, 3, 4, 5, 6], true)).toBe('Her Gün');
        });

        it('returns "Every Day" for null/undefined input', () => {
            expect(formatDays(null, false)).toBe('Every Day');
            expect(formatDays(undefined, false)).toBe('Every Day');
        });
    });

    describe('specific-day formatting', () => {
        it('formats a single weekday in English', () => {
            expect(formatDays([1], false)).toBe('Mon');
        });

        it('formats multiple days in Turkish', () => {
            expect(formatDays([1, 3, 5], true)).toBe('Pzt, Çar, Cum');
        });

        it('preserves the input order rather than sorting', () => {
            expect(formatDays([5, 1, 3], false)).toBe('Fri, Mon, Wed');
        });
    });

    describe('out-of-range bounds (regression)', () => {
        // Before the fix, formatDays returned `undefined` strings for stray indices.
        it('drops day index 7 (out of range)', () => {
            expect(formatDays([7], false)).toBe('');
        });

        it('drops day index -1 (negative)', () => {
            expect(formatDays([-1], false)).toBe('');
        });

        it('keeps valid days and drops invalid ones', () => {
            expect(formatDays([0, 7, 3, -1, 6], false)).toBe('Sun, Wed, Sat');
        });

        it('drops non-integer values', () => {
            expect(formatDays([1.5, 2, 3.7], false)).toBe('Tue');
        });
    });
});
