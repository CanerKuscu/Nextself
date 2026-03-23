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
const DoubleXPIllustration = ({ size = 56 }) => (<react_native_svg_1.default width={size} height={size} viewBox="0 0 120 120">
        <react_native_svg_1.Defs>
            <react_native_svg_1.LinearGradient id="gx" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FFB347"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FFCC33"/>
            </react_native_svg_1.LinearGradient>
        </react_native_svg_1.Defs>
        <react_native_svg_1.Circle cx="60" cy="60" r="58" fill="#FFF8E1"/>

        {/* Stylized XP badge */}
        <react_native_svg_1.Rect x="30" y="30" rx="14" ry="14" width="60" height="60" fill="url(#gx)"/>
        <react_native_svg_1.Path d="M45 80 L55 50 L65 80 L75 50" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <react_native_svg_1.Path d="M42 48 L78 48" stroke="#fff" strokeWidth="6" strokeLinecap="round"/>
        {/* Glow */}
        <react_native_svg_1.Path d="M20 60 a40 40 0 0 0 80 0 a40 40 0 0 0 -80 0" fill="none" stroke="#FFD93D" strokeWidth="3" opacity="0.35"/>
    </react_native_svg_1.default>);
exports.default = DoubleXPIllustration;
