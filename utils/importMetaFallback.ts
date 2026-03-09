// A small runtime fallback for environments where `import.meta` isn't available
// Avoid referencing `import.meta` directly to prevent syntax errors when files
// are evaluated as non-modules. Prefer a global fallback, then `process.env`.
export const importMetaFallback: { env: any } = (() => {
    try {
        const globalAny: any = globalThis as any;
        const env = globalAny.__import_meta_fallback_env || (typeof process !== 'undefined' ? process.env : {});
        return { env };
    } catch (e) {
        return { env: {} };
    }
})();

// Also expose a helper to set the fallback during runtime (useful in dev/debug)
export function setImportMetaFallbackEnv(env: any) {
    (globalThis as any).__import_meta_fallback_env = env;
}
