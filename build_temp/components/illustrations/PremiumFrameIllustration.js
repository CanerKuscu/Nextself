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
const PremiumFrameIllustration = ({ size = 56 }) => (<react_native_svg_1.default width={size} height={size} viewBox="0 0 120 120">
        <react_native_svg_1.Defs>
            <react_native_svg_1.LinearGradient id="pf1" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FF9A9E"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FAD0C4"/>
            </react_native_svg_1.LinearGradient>
            <react_native_svg_1.LinearGradient id="pf2" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FFD700"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FFAA00"/>
            </react_native_svg_1.LinearGradient>
        </react_native_svg_1.Defs>
        <react_native_svg_1.Rect x="6" y="6" width="108" height="108" rx="18" fill="#FFF6F8"/>
        <react_native_svg_1.Rect x="16" y="16" width="88" height="88" rx="14" stroke="url(#pf1)" strokeWidth="6" fill="none"/>

        {/* Star emblem */}
        <react_native_svg_1.Polygon points="60,32 66,48 84,48 70,58 76,74 60,64 44,74 50,58 36,48 54,48" fill="url(#pf2)"/>

        <react_native_svg_1.Circle cx="60" cy="80" r="10" fill="#FFF"/>
        <react_native_svg_1.Ellipse cx="60" cy="92" rx="18" ry="8" fill="#FFD1A9" opacity="0.9"/>
    </react_native_svg_1.default>);
exports.default = PremiumFrameIllustration;
