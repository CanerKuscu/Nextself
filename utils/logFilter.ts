// Lightweight selective log filter for development.
// Suppresses known noisy dev messages (debug/info) and deduplicates warnings/errors.
const IGNORED_PATTERNS: RegExp[] = [
    /EXPO_PUBLIC_SUPABASE_URL/,
    /EXPO_PUBLIC_SUPABASE_ANON_KEY/,
    /EXPO_PUBLIC_ENCRYPTION_KEY/,
    /EXPO_PUBLIC_DEEPSEEK_API_KEY/,
    /EXPO_PUBLIC_SENTRY_DSN/,
    /\[SupabaseProvider\] EDGE_FN/,
    /EDGE_FN log failed/,
    /Failed to load language/,
    /Failed to load currency/,
    /Failed to load theme preference/,
];

let inited = false;
export function initLogFilter() {
    if (inited) return;
    inited = true;

    const origDebug = console.debug.bind(console);
    const origInfo = console.info.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);

    const seenWarns = new Set<string>();
    const seenErrors = new Set<string>();

    function matchesIgnored(args: any[]) {
        try {
            const text = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
            return IGNORED_PATTERNS.some(p => p.test(text));
        } catch (e) {
            return false;
        }
    }

    console.debug = (...args: any[]) => {
        if (matchesIgnored(args)) return;
        origDebug(...args);
    };

    console.info = (...args: any[]) => {
        if (matchesIgnored(args)) return;
        origInfo(...args);
    };

    console.warn = (...args: any[]) => {
        try {
            const key = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
            if (matchesIgnored(args)) return;
            if (seenWarns.has(key)) return;
            seenWarns.add(key);
        } catch (e) { }
        origWarn(...args);
    };

    console.error = (...args: any[]) => {
        try {
            const key = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
            if (matchesIgnored(args)) return;
            if (seenErrors.has(key)) return;
            seenErrors.add(key);
        } catch (e) { }
        origError(...args);
    };
}

export default initLogFilter;
