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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_native_svg_1 = __importStar(require("react-native-svg"));
const MysteryBoxIllustration = ({ size = 56 }) => (<react_native_svg_1.default width={size} height={size} viewBox="0 0 120 120">
        <react_native_svg_1.Defs>
            <react_native_svg_1.LinearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#7F7FD5"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#86A8E7"/>
            </react_native_svg_1.LinearGradient>
            <react_native_svg_1.LinearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FFD89B"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#19547B" stopOpacity="0.9"/>
            </react_native_svg_1.LinearGradient>
        </react_native_svg_1.Defs>
        <react_native_svg_1.Circle cx="60" cy="60" r="58" fill="url(#g1)" opacity="0.95"/>
        <react_native_svg_1.Rect x="22" y="44" rx="8" ry="8" width="76" height="44" fill="#2C2C54" opacity="0.12"/>

        {/* Gift base */}
        <react_native_svg_1.Path d="M30 54 h60 v28 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 z" fill="#ffffff" opacity="0.95"/>
        {/* Lid shadow */}
        <react_native_svg_1.Path d="M30 54 q30 -18 60 0" fill="#F0F0F6" opacity="0.9"/>

        {/* Ribbon */}
        <react_native_svg_1.Rect x="56" y="44" width="8" height="44" rx="2" fill="#FF6B6B"/>
        <react_native_svg_1.Path d="M60 44 c6 -6 18 -6 24 0 l-12 12 z" fill="#FF8787"/>

        {/* Question mark */}
        <react_native_svg_1.Path d="M60 62 c-6 0 -10 4 -10 10 c0 6 4 10 10 10 c6 0 10 -4 10 -10" fill="#2C2C54" opacity="0.95"/>
        <react_native_svg_1.Circle cx="60" cy="86" r="3" fill="#2C2C54"/>
    </react_native_svg_1.default>);
exports.default = MysteryBoxIllustration;
