import { getLocalDateString, getYesterdayDateString, toLocalDateOnly } from '../utils/dateUtils';

describe('dateUtils', () => {
    beforeEach(() => {
        // Mock system time to a fixed timestamp so that tests are deterministic
        jest.useFakeTimers({ advanceTimers: false });
        // Use a date that is clearly testable
        jest.setSystemTime(new Date('2026-03-28T12:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('getLocalDateString', () => {
        it('returns the correct YYYY-MM-DD format for current fallback date', () => {
            const result = getLocalDateString();
            expect(result).toBe('2026-03-28');
        });

        it('returns the correct YYYY-MM-DD format for a specific parsed date', () => {
            const specificDate = new Date('2024-11-05T08:30:00.000Z');
            const result = getLocalDateString(specificDate);
            // Result length should check correctly
            expect(result).toBe('2024-11-05');
        });
    });

    describe('getYesterdayDateString', () => {
        it('returns exactly one local day before the current date', () => {
            const result = getYesterdayDateString();
            // Since mock date is 2026-03-28, yesterday should be 2026-03-27
            expect(result).toBe('2026-03-27');
        });
    });

    describe('toLocalDateOnly', () => {
        it('returns the exact string passed if it does not contain a timestamp "T"', () => {
            expect(toLocalDateOnly('2026-03-28')).toBe('2026-03-28');
        });

        it('extracts local YYYY-MM-DD date segment if timestamp has a "T" ISO format', () => {
            // Use mid-day UTC so local timezone offset (+3 or -8 etc) doesn't change the day
            expect(toLocalDateOnly('2026-01-01T12:00:00.000Z')).toBe('2026-01-01');
        });
    });
});
