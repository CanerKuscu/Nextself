import { parseHHMM, formatHHMMKey, clamp } from '../utils/timeValidation';

describe('parseHHMM', () => {
    it('parses canonical HH:MM', () => {
        expect(parseHHMM('07:30')).toEqual({ hour: 7, minute: 30 });
    });

    it('parses single-digit H:M', () => {
        expect(parseHHMM('7:5')).toEqual({ hour: 7, minute: 5 });
    });

    it('parses midnight 00:00', () => {
        expect(parseHHMM('00:00')).toEqual({ hour: 0, minute: 0 });
    });

    it('parses the late end of the day 23:59', () => {
        expect(parseHHMM('23:59')).toEqual({ hour: 23, minute: 59 });
    });

    it('rejects 24:00 as out of range', () => {
        expect(parseHHMM('24:00')).toBeNull();
    });

    it('rejects 25:00 (was previously accepted via parseInt)', () => {
        expect(parseHHMM('25:00')).toBeNull();
    });

    it('rejects 12:99 (was previously accepted via parseInt)', () => {
        expect(parseHHMM('12:99')).toBeNull();
    });

    it('rejects 99:99', () => {
        expect(parseHHMM('99:99')).toBeNull();
    });

    it('rejects negative hours', () => {
        expect(parseHHMM('-1:00')).toBeNull();
    });

    it('rejects empty string', () => {
        expect(parseHHMM('')).toBeNull();
    });

    it('rejects non-string input', () => {
        expect(parseHHMM(null)).toBeNull();
        expect(parseHHMM(undefined)).toBeNull();
        expect(parseHHMM(700)).toBeNull();
    });

    it('rejects malformed string without colon', () => {
        expect(parseHHMM('0730')).toBeNull();
    });

    it('rejects letters', () => {
        expect(parseHHMM('aa:bb')).toBeNull();
    });

    it('trims surrounding whitespace', () => {
        expect(parseHHMM('  09:15 ')).toEqual({ hour: 9, minute: 15 });
    });
});

describe('formatHHMMKey', () => {
    it('zero-pads both fields so 1:23 and 12:3 do not collide', () => {
        const k1 = formatHHMMKey({ hour: 1, minute: 23 });
        const k2 = formatHHMMKey({ hour: 12, minute: 3 });
        expect(k1).toBe('0123');
        expect(k2).toBe('1203');
        expect(k1).not.toBe(k2);
    });

    it('zero-pads single digit values', () => {
        expect(formatHHMMKey({ hour: 0, minute: 0 })).toBe('0000');
    });
});

describe('clamp', () => {
    it('clamps below min', () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps above max', () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('passes through values inside the range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it('returns min for NaN', () => {
        expect(clamp(Number.NaN, 0, 10)).toBe(0);
    });
});
