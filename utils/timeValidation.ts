/**
 * Validation helpers for HH:MM clock-time strings.
 *
 * Previously screens called `parseInt(h)` / `parseInt(m)` directly on values from
 * the database with no range check, so a malformed row could schedule a 99:99
 * notification (which Date.setHours then silently shifts into the next day) and
 * collide notification keys (`${h}${m}` → "123" matches both 1:23 and 12:3).
 */

export interface ParsedTime {
    /** 0-23 */
    hour: number;
    /** 0-59 */
    minute: number;
}

/**
 * Parse a strict "HH:MM" (or "H:M") string into validated {hour, minute}.
 * Returns null for any out-of-range, non-numeric, or malformed input.
 */
export function parseHHMM(value: unknown): ParsedTime | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed.includes(':')) return null;

    const parts = trimmed.split(':');
    if (parts.length < 2) return null;

    const hRaw = parts[0];
    const mRaw = parts[1];
    if (!/^\d{1,2}$/.test(hRaw) || !/^\d{1,2}$/.test(mRaw)) return null;

    const hour = Number(hRaw);
    const minute = Number(mRaw);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 23) return null;
    if (minute < 0 || minute > 59) return null;
    return { hour, minute };
}

/** Format a validated parsed time as a zero-padded "HHMM" key — collision-free. */
export function formatHHMMKey(time: ParsedTime): string {
    const hh = time.hour.toString().padStart(2, '0');
    const mm = time.minute.toString().padStart(2, '0');
    return `${hh}${mm}`;
}

/** Clamp a number to an inclusive [min, max] window. */
export function clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
