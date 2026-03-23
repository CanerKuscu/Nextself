"use strict";
/**
 * Device-local date utilities.
 *
 * `new Date().toISOString().split('T')[0]` returns the UTC date, which can
 * differ from the user's local date near midnight. These helpers always
 * return/compare dates in the device's local timezone.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalDateString = getLocalDateString;
exports.getYesterdayDateString = getYesterdayDateString;
exports.toLocalDateOnly = toLocalDateOnly;
/** Returns the local date as `YYYY-MM-DD`. */
function getLocalDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
/** Returns yesterday's local date as `YYYY-MM-DD`. */
function getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
}
/**
 * Extracts the local `YYYY-MM-DD` from a timestamp string.
 * If the input is already a date-only string it is returned as-is.
 * If it contains a `T` (ISO timestamp) it is re-parsed to local date.
 */
function toLocalDateOnly(timestamp) {
    if (!timestamp.includes('T'))
        return timestamp;
    return getLocalDateString(new Date(timestamp));
}
