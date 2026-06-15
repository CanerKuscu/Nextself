const DAY_NAMES_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Format a 0-indexed day-of-week array (Sunday=0 ... Saturday=6) into a localized
 * comma-separated list. Drops out-of-range or non-integer entries instead of
 * rendering `undefined` for stray values like `[7]` or `[-1]`.
 */
export function formatDays(days: ReadonlyArray<number> | null | undefined, isTurkish: boolean): string {
    if (!days || days.length === 0 || days.length === 7) {
        return isTurkish ? 'Her Gün' : 'Every Day';
    }
    const names = isTurkish ? DAY_NAMES_TR : DAY_NAMES_EN;
    return days
        .filter((d) => Number.isInteger(d) && d >= 0 && d < names.length)
        .map((d) => names[d])
        .join(', ');
}
