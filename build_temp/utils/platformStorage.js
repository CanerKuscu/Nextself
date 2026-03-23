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
/**
 * Platform-aware storage utility.
 * Uses @react-native-async-storage/async-storage on native (iOS/Android) and localStorage on web.
 */
const react_native_1 = require("react-native");
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const PlatformStorage = {
    getItem: (key) => __awaiter(void 0, void 0, void 0, function* () {
        if (react_native_1.Platform.OS === 'web') {
            try {
                return localStorage.getItem(key);
            }
            catch (_a) {
                return null;
            }
        }
        return async_storage_1.default.getItem(key);
    }),
    setItem: (key, value) => __awaiter(void 0, void 0, void 0, function* () {
        if (react_native_1.Platform.OS === 'web') {
            try {
                localStorage.setItem(key, value);
            }
            catch (_a) {
                // quota exceeded or private browsing
            }
            return;
        }
        return async_storage_1.default.setItem(key, value);
    }),
    removeItem: (key) => __awaiter(void 0, void 0, void 0, function* () {
        if (react_native_1.Platform.OS === 'web') {
            try {
                localStorage.removeItem(key);
            }
            catch (_a) {
                // ignore
            }
            return;
        }
        return async_storage_1.default.removeItem(key);
    }),
};
exports.default = PlatformStorage;
