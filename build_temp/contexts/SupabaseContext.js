"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseProvider = exports.useSupabaseAuth = void 0;
const react_1 = __importStar(require("react"));
const supabase_1 = require("../services/supabase");
const offlineService_1 = require("../utils/offlineService");
const contentModerationService_1 = require("../services/contentModerationService");
const deepLinking_1 = require("../utils/deepLinking");
const react_native_1 = require("react-native");
const webSession_1 = require("../services/webSession");
const importMetaFallback_1 = require("../utils/importMetaFallback");
const AuthContext = (0, react_1.createContext)(undefined);
const useSupabaseAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useSupabaseAuth must be used within a SupabaseProvider');
    }
    return context;
};
exports.useSupabaseAuth = useSupabaseAuth;
const SupabaseProvider = ({ children }) => {
    const [session, setSession] = (0, react_1.useState)(null);
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [isBanned, setIsBanned] = (0, react_1.useState)(false);
    const [banMessage, setBanMessage] = (0, react_1.useState)(null);
    const supabaseService = supabase_1.SupabaseService.getInstance();
    // Edge function URL for proxy calls (web)
    // Resolve edge function URL, preferring explicit config, then importMeta fallback, then env
    const EDGE_FN = (0, webSession_1.defaultEdgeFunctionUrl)() || (importMetaFallback_1.importMetaFallback.env && importMetaFallback_1.importMetaFallback.env.EXPO_PUBLIC_SESSION_EXCHANGE_URL) || (importMetaFallback_1.importMetaFallback.env && importMetaFallback_1.importMetaFallback.env.SESSION_EXCHANGE_URL) || '';
    // Debug: log the resolved Edge Function URL on provider mount so web startup reveals runtime value
    (0, react_1.useEffect)(() => {
        try {
            if (__DEV__) {
                console.debug('[SupabaseProvider] EDGE_FN:', EDGE_FN, 'Platform:', react_native_1.Platform.OS);
            }
        }
        catch (e) {
            if (__DEV__) {
                console.debug('[SupabaseProvider] EDGE_FN log failed', e);
            }
        }
    }, [EDGE_FN]);
    // Check ban status whenever user changes
    (0, react_1.useEffect)(() => {
        if (user === null || user === void 0 ? void 0 : user.id) {
            contentModerationService_1.ContentModerationService.getInstance().checkBanStatus(user.id).then(status => {
                setIsBanned(status.isBanned);
                if (status.isBanned) {
                    const msg = contentModerationService_1.ContentModerationService.getInstance().getBanMessage(status, false);
                    setBanMessage(msg.message);
                }
                else {
                    setBanMessage(null);
                }
            }).catch(() => { });
        }
        else {
            setIsBanned(false);
            setBanMessage(null);
        }
    }, [user === null || user === void 0 ? void 0 : user.id]);
    (0, react_1.useEffect)(() => {
        // Get initial session
        const getInitialSession = () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                const { data: { session: initialSession } } = yield supabaseService.getClient().auth.getSession();
                setSession(initialSession);
                setUser((_a = initialSession === null || initialSession === void 0 ? void 0 : initialSession.user) !== null && _a !== void 0 ? _a : null);
            }
            catch (error) {
                console.error('Error getting initial session:', error);
            }
            finally {
                setLoading(false);
            }
        });
        getInitialSession();
        // Listen for auth changes
        const { data: { subscription } } = supabaseService.getClient().auth.onAuthStateChange((_event, session) => {
            var _a;
            setSession(session);
            setUser((_a = session === null || session === void 0 ? void 0 : session.user) !== null && _a !== void 0 ? _a : null);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signOut = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const offline = offlineService_1.OfflineService.getInstance();
            // Pause offline processing and wait for any in-flight sync to finish
            // to avoid operations being sent under the wrong user context.
            yield offline.pauseAndWait();
            yield supabaseService.signOut();
            // Clear offline queue to prevent cross-user data leakage
            yield offline.clearQueue();
        }
        catch (error) {
            console.error('Error signing out:', error);
        }
        finally {
            // Resume offline processor so the service can continue operating
            try {
                offlineService_1.OfflineService.getInstance().resume();
            }
            catch (_) { }
            // Always clear local state regardless of signOut success
            setSession(null);
            setUser(null);
        }
    }), [supabaseService]);
    // Register handler for refresh failures so the app can run deterministic logout
    (0, react_1.useEffect)(() => {
        const handler = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Use the same signOut flow so queues are paused and cleared
                yield signOut();
            }
            catch (_) { }
        });
        try {
            supabaseService.onRefreshFailure(handler);
        }
        catch (_) { }
        return () => {
            try {
                supabaseService.onRefreshFailure(() => { });
            }
            catch (_) { }
        };
    }, [supabaseService, signOut]);
    // After successful authentication (session becomes non-null), process any
    // deep links that were queued while auth/navigation was initializing.
    (0, react_1.useEffect)(() => {
        if (session) {
            try {
                deepLinking_1.DeepLinkingService.getInstance().processPendingURLs();
            }
            catch (_) { }
        }
    }, [session]);
    // Sign-in wrapper that uses signInAndExchange on web to set HttpOnly cookie and clear client session
    const signIn = (0, react_1.useCallback)((email, password) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const result = yield (0, webSession_1.signInAndExchange)(supabaseService.getClient(), email, password, { edgeFunctionUrl: EDGE_FN });
            // If web, client session is cleared; keep user info from result if available
            const userFromResult = ((_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.user) || (result === null || result === void 0 ? void 0 : result.user) || null;
            if (react_native_1.Platform.OS === 'web') {
                setUser(userFromResult);
                setSession(null);
            }
            else {
                const sessionObj = ((_b = result === null || result === void 0 ? void 0 : result.data) === null || _b === void 0 ? void 0 : _b.session) || null;
                setSession(sessionObj);
                setUser((_c = sessionObj === null || sessionObj === void 0 ? void 0 : sessionObj.user) !== null && _c !== void 0 ? _c : userFromResult);
            }
            return result;
        }
        catch (err) {
            return { error: err };
        }
    }), [supabaseService]);
    // Proxied fetch helper - on web routes through Edge Function, on native uses client directly for simple GETs
    const proxiedFetch = (0, react_1.useCallback)((method, path, options) => __awaiter(void 0, void 0, void 0, function* () {
        if (react_native_1.Platform.OS === 'web') {
            return (0, webSession_1.proxiedRequest)(EDGE_FN, method, path, options);
        }
        try {
            const client = supabaseService.getClient();
            if (method.toUpperCase() === 'GET') {
                const selectQuery = (options === null || options === void 0 ? void 0 : options.query) || '*';
                const { data, error } = yield client.from(path).select(selectQuery);
                return { ok: !error, data, error };
            }
            // For non-GET on native, prefer using Supabase client methods directly
            return { ok: false, error: 'Use Supabase client directly for non-GET requests on native' };
        }
        catch (err) {
            return { ok: false, error: err };
        }
    }), [supabaseService]);
    const value = (0, react_1.useMemo)(() => ({
        session,
        user,
        loading,
        isBanned,
        banMessage,
        signOut,
        signIn,
        proxiedFetch,
    }), [session, user, loading, isBanned, banMessage, signOut]);
    return (<AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);
};
exports.SupabaseProvider = SupabaseProvider;
