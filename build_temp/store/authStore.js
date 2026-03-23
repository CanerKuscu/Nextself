"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const supabase_1 = require("../services/supabase");
// Custom Storage adapter for Zustand using PlatformStorage (web-safe)
const zustandSecureStorage = {
    getItem: (name) => __awaiter(void 0, void 0, void 0, function* () {
        return yield platformStorage_1.default.getItem(name);
    }),
    setItem: (name, value) => __awaiter(void 0, void 0, void 0, function* () {
        yield platformStorage_1.default.setItem(name, value);
    }),
    removeItem: (name) => __awaiter(void 0, void 0, void 0, function* () {
        yield platformStorage_1.default.removeItem(name);
    }),
};
exports.useAuthStore = (0, zustand_1.create)()((0, middleware_1.persist)((set, get) => ({
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: false,
    setSession: (session) => {
        const isValid = !!session && (!session.expires_at || session.expires_at * 1000 > Date.now());
        set({ session: isValid ? session : null, isAuthenticated: isValid });
    },
    setProfile: (profile) => {
        set({ profile });
    },
    setLoading: (isLoading) => {
        set({ isLoading });
    },
    logout: () => __awaiter(void 0, void 0, void 0, function* () {
        // Always clear local state first to prevent stale sessions
        set({ session: null, profile: null, isAuthenticated: false });
        try {
            const supa = supabase_1.SupabaseService.getInstance();
            yield supa.getClient().auth.signOut();
        }
        catch (e) {
            console.warn('Supabase signOut failed:', e);
        }
    }),
}), {
    name: 'NextSelf-auth-storage', // The key by which it will be saved in SecureStore
    storage: (0, middleware_1.createJSONStorage)(() => zustandSecureStorage),
    // Partialize dictates what is stored. `isLoading` should be omitted as we only want session data.
    partialize: (state) => ({
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
    }),
}));
