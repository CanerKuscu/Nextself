"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importMetaFallback = void 0;
exports.setImportMetaFallbackEnv = setImportMetaFallbackEnv;
// A small runtime fallback for environments where `import.meta` isn't available
// Avoid referencing `import.meta` directly to prevent syntax errors when files
// are evaluated as non-modules. Prefer a global fallback, then `process.env`.
exports.importMetaFallback = (() => {
    try {
        const globalAny = globalThis;
        const env = globalAny.__import_meta_fallback_env || (typeof process !== 'undefined' ? process.env : {});
        return { env };
    }
    catch (e) {
        return { env: {} };
    }
})();
// Also expose a helper to set the fallback during runtime (useful in dev/debug)
function setImportMetaFallbackEnv(env) {
    globalThis.__import_meta_fallback_env = env;
}
