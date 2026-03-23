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
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const vector_icons_1 = require("@expo/vector-icons");
const MysteryBoxIllustration_1 = __importDefault(require("./illustrations/MysteryBoxIllustration"));
const DoubleXPIllustration_1 = __importDefault(require("./illustrations/DoubleXPIllustration"));
const PremiumFrameIllustration_1 = __importDefault(require("./illustrations/PremiumFrameIllustration"));
const react_native_2 = require("react-native");
// Avoid static import of `lottie-react-native` on web to prevent Metro from
// trying to resolve `@lottiefiles/dotlottie-react`. Use eval'd require guarded
// by a runtime platform check so bundler static analysis won't include it.
let LottieView = null;
if (typeof react_native_2.Platform !== 'undefined' && react_native_2.Platform.OS !== 'web') {
    try {
        // Using eval prevents Metro from statically resolving the require during bundling for web
        // while still allowing native apps to load Lottie at runtime when installed.
        // @ts-ignore
        LottieView = eval("require('lottie-react-native').default");
    }
    catch (err) {
        LottieView = null;
    }
}
// Duolingo-style fitness-themed illustrations for store items
const StoreIllustration = ({ itemId, size = 56, variant = 'normal', iconName }) => {
    const tryGetLottie = () => {
        // Dynamic require with template paths breaks Metro bundler during transform.
        // We intentionally avoid dynamic requires here. If you want Lottie support,
        // add a static mapping from itemId -> require('../assets/lottie/<name>.json').
        return null;
    };
    const lottieAnim = tryGetLottie();
    if (lottieAnim) {
        return (<react_native_1.View style={styles.container}>
        {/* Render Lottie animation when available for fancy variants */}
        <LottieView source={lottieAnim} autoPlay loop style={{ width: size, height: size }}/>
      </react_native_1.View>);
    }
    const renderIllustration = () => {
        switch (itemId) {
            // ── Utility Items ──
            case 'streak-freeze':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="freezeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#00F2FE"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#4FACFE"/>
              </react_native_svg_1.LinearGradient>
              <react_native_svg_1.LinearGradient id="freezeInner" x1="0%" y1="100%" x2="100%" y2="0%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Rect x="15" y="15" width="70" height="70" rx="20" fill="url(#freezeGrad)" transform="rotate(45 50 50)"/>
            <react_native_svg_1.Rect x="20" y="20" width="60" height="60" rx="15" fill="url(#freezeInner)" transform="rotate(45 50 50)"/>
            <react_native_svg_1.Path d="M50 25 L50 75 M25 50 L75 50" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
            <react_native_svg_1.Path d="M32 32 L68 68 M32 68 L68 32" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="10" fill="#fff"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="4" fill="#4FACFE"/>
          </react_native_svg_1.default>);
            case 'extra-life':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FF0844"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FFB199"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#heartGrad)" opacity="0.2"/>
            <react_native_svg_1.Path d="M50 80 Q20 55 20 35 Q20 20 35 20 Q45 20 50 30 Q55 20 65 20 Q80 20 80 35 Q80 55 50 80" fill="url(#heartGrad)"/>
            <react_native_svg_1.Path d="M50 80 Q20 55 20 35 Q20 20 35 20 Q45 20 50 30 Q55 20 65 20 Q80 20 80 35 Q80 55 50 80" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5"/>
            <react_native_svg_1.Path d="M40 30 Q45 25 50 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <react_native_svg_1.Path d="M50 45 L50 60 M42 52.5 L58 52.5" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
          </react_native_svg_1.default>);
            case 'mystery-box':
                return <MysteryBoxIllustration_1.default size={size}/>;
            // ── Booster Items ──
            case 'double-xp':
                return <DoubleXPIllustration_1.default size={size}/>;
            case 'xp-shield':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#00C6FF"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#0072FF"/>
              </react_native_svg_1.LinearGradient>
              <react_native_svg_1.LinearGradient id="shieldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#shieldGrad)" opacity="0.15"/>
            <react_native_svg_1.Path d="M50 15 L80 25 L80 50 Q80 75 50 90 Q20 75 20 50 L20 25 Z" fill="url(#shieldGrad)"/>
            <react_native_svg_1.Path d="M50 15 L80 25 L80 50 Q80 75 50 90 Q20 75 20 50 L20 25 Z" fill="url(#shieldGlow)"/>
            <react_native_svg_1.Path d="M50 25 L70 33 L70 50 Q70 68 50 78 Q30 68 30 50 L30 33 Z" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="12" fill="#fff"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="6" fill="#0072FF"/>
          </react_native_svg_1.default>);
            case 'workout-boost':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="workoutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#F9D423"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FF4E50"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#workoutGrad)" opacity="0.15"/>
            <react_native_svg_1.Rect x="20" y="35" width="15" height="30" rx="4" fill="url(#workoutGrad)"/>
            <react_native_svg_1.Rect x="65" y="35" width="15" height="30" rx="4" fill="url(#workoutGrad)"/>
            <react_native_svg_1.Rect x="35" y="46" width="30" height="8" rx="2" fill="url(#workoutGrad)"/>
            <react_native_svg_1.Path d="M50 15 L60 30 L40 30 Z" fill="#FF4E50"/>
            <react_native_svg_1.Path d="M50 15 L50 30" stroke="#fff" strokeWidth="2"/>
          </react_native_svg_1.default>);
            case 'nutrition-boost':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="nutritionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#11998E"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#38EF7D"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#nutritionGrad)" opacity="0.15"/>
            <react_native_svg_1.Path d="M50 85 Q20 85 20 50 Q20 20 50 25 Q80 20 80 50 Q80 85 50 85" fill="url(#nutritionGrad)"/>
            <react_native_svg_1.Path d="M50 25 Q60 10 70 15" stroke="#11998E" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <react_native_svg_1.Circle cx="65" cy="40" r="6" fill="#fff" opacity="0.5"/>
            <react_native_svg_1.Path d="M40 50 L50 40 L60 55 L70 45" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </react_native_svg_1.default>);
            case 'triple-xp-weekend':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="tripleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#B3FFAB"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#12FFF7"/>
              </react_native_svg_1.LinearGradient>
              <react_native_svg_1.LinearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FA709A"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FEE140"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#tripleGrad)" opacity="0.2"/>
            <react_native_svg_1.Path d="M50 15 Q65 30 65 60 L50 75 L35 60 Q35 30 50 15 Z" fill="url(#rocketGrad)"/>
            <react_native_svg_1.Path d="M35 60 L20 75 L35 70 Z" fill="#FA709A"/>
            <react_native_svg_1.Path d="M65 60 L80 75 L65 70 Z" fill="#FA709A"/>
            <react_native_svg_1.Circle cx="50" cy="45" r="8" fill="#fff"/>
            <react_native_svg_1.Path d="M40 80 Q50 100 60 80 Z" fill="#12FFF7"/>
            <react_native_svg_1.Text x="50" y="50" fontSize="12" fontWeight="bold" fill="#FA709A" textAnchor="middle" alignmentBaseline="middle">3X</react_native_svg_1.Text>
          </react_native_svg_1.default>);
            // ── Cosmetic Items ──
            case 'premium-frame':
                return <PremiumFrameIllustration_1.default size={size}/>;
            case 'gold-badge':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#F6D365"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FDA085"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#goldGrad)" opacity="0.2"/>
            <react_native_svg_1.Polygon points="50,15 60,35 80,40 65,55 70,75 50,65 30,75 35,55 20,40 40,35" fill="url(#goldGrad)"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="15" fill="#fff" opacity="0.3"/>
            <react_native_svg_1.Path d="M40 50 L47 57 L60 40" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </react_native_svg_1.default>);
            case 'diamond-badge':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#E0C3FC"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#8EC5FC"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#diamondGrad)" opacity="0.2"/>
            <react_native_svg_1.Polygon points="50,15 80,40 50,85 20,40" fill="url(#diamondGrad)"/>
            <react_native_svg_1.Polygon points="50,15 80,40 50,45 20,40" fill="#fff" opacity="0.4"/>
            <react_native_svg_1.Polygon points="50,45 80,40 50,85" fill="#fff" opacity="0.1"/>
            <react_native_svg_1.Path d="M35 30 L65 30" stroke="#fff" strokeWidth="2" opacity="0.5"/>
          </react_native_svg_1.default>);
            // ── Equipment Items ──
            case 'resistance-band-set':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="bandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#43E97B"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#38F9D7"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#bandGrad)" opacity="0.2"/>
            <react_native_svg_1.Path d="M25 25 C40 80, 60 20, 75 75" stroke="url(#bandGrad)" strokeWidth="12" strokeLinecap="round" fill="none"/>
            <react_native_svg_1.Path d="M25 25 C40 80, 60 20, 75 75" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"/>
            <react_native_svg_1.Circle cx="25" cy="25" r="8" fill="#38F9D7"/>
            <react_native_svg_1.Circle cx="75" cy="75" r="8" fill="#43E97B"/>
          </react_native_svg_1.default>);
            case 'yoga-mat-pro':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="yogaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FA709A"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FEE140"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#yogaGrad)" opacity="0.2"/>
            <react_native_svg_1.Rect x="20" y="30" width="60" height="40" rx="8" fill="url(#yogaGrad)" transform="rotate(-15 50 50)"/>
            <react_native_svg_1.Path d="M30 40 L70 30" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="10" fill="#fff" opacity="0.9"/>
          </react_native_svg_1.default>);
            // ── Nutrition Items ──
            case 'protein-shake-pack':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="shakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#5EE7DF"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#B490CA"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#shakeGrad)" opacity="0.2"/>
            <react_native_svg_1.Path d="M35 25 L65 25 L60 80 Q60 85 50 85 Q40 85 40 80 Z" fill="url(#shakeGrad)"/>
            <react_native_svg_1.Rect x="30" y="15" width="40" height="10" rx="4" fill="#B490CA"/>
            <react_native_svg_1.Path d="M38 50 Q50 40 62 50" stroke="#fff" strokeWidth="3" fill="none" opacity="0.5"/>
            <react_native_svg_1.Circle cx="50" cy="65" r="6" fill="#fff"/>
          </react_native_svg_1.default>);
            case 'calorie-counter-pro':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="calcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#667EEA"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#764BA2"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#calcGrad)" opacity="0.2"/>
            <react_native_svg_1.Rect x="25" y="20" width="50" height="60" rx="10" fill="url(#calcGrad)"/>
            <react_native_svg_1.Rect x="35" y="30" width="30" height="15" rx="4" fill="#fff" opacity="0.9"/>
            <react_native_svg_1.Circle cx="35" cy="55" r="4" fill="#fff"/>
            <react_native_svg_1.Circle cx="50" cy="55" r="4" fill="#fff"/>
            <react_native_svg_1.Circle cx="65" cy="55" r="4" fill="#fff"/>
            <react_native_svg_1.Circle cx="35" cy="68" r="4" fill="#fff"/>
            <react_native_svg_1.Circle cx="50" cy="68" r="4" fill="#fff"/>
            <react_native_svg_1.Circle cx="65" cy="68" r="4" fill="#fff" opacity="0.5"/>
          </react_native_svg_1.default>);
            // ── Recovery Items ──
            case 'ice-bath-timer':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="iceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#89F7FE"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#66A6FF"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#iceGrad)" opacity="0.2"/>
            <react_native_svg_1.Path d="M20 40 L25 70 Q30 80 50 80 Q70 80 75 70 L80 40 Z" fill="url(#iceGrad)"/>
            <react_native_svg_1.Path d="M25 45 Q50 55 75 45" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6"/>
            <react_native_svg_1.Rect x="35" y="55" width="12" height="12" rx="3" fill="#fff" transform="rotate(15 40 60)"/>
            <react_native_svg_1.Rect x="55" y="50" width="10" height="10" rx="2" fill="#fff" transform="rotate(-15 60 55)"/>
            <react_native_svg_1.Circle cx="50" cy="25" r="10" fill="#66A6FF"/>
            <react_native_svg_1.Path d="M50 25 L50 18" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </react_native_svg_1.default>);
            case 'meditation-sessions':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="meditationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#F093FB"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#F5576C"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#meditationGrad)" opacity="0.2"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="25" fill="none" stroke="url(#meditationGrad)" strokeWidth="4"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="15" fill="none" stroke="url(#meditationGrad)" strokeWidth="2" opacity="0.6"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="6" fill="#F5576C"/>
            <react_native_svg_1.Path d="M25 50 Q50 20 75 50" stroke="#F093FB" strokeWidth="2" fill="none" opacity="0.8"/>
            <react_native_svg_1.Path d="M25 50 Q50 80 75 50" stroke="#F5576C" strokeWidth="2" fill="none" opacity="0.8"/>
          </react_native_svg_1.default>);
            // ── Premium Items ──
            case 'ai-coach-unlimited':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#FFD194"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#7028E4"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#aiGrad)" opacity="0.2"/>
            <react_native_svg_1.Path d="M50 20 L75 40 L75 70 L50 85 L25 70 L25 40 Z" fill="url(#aiGrad)"/>
            <react_native_svg_1.Circle cx="40" cy="45" r="5" fill="#fff"/>
            <react_native_svg_1.Circle cx="60" cy="45" r="5" fill="#fff"/>
            <react_native_svg_1.Path d="M45 60 Q50 65 55 60" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <react_native_svg_1.Path d="M50 20 L50 10 M40 15 L45 20 M60 15 L55 20" stroke="#7028E4" strokeWidth="2" strokeLinecap="round"/>
          </react_native_svg_1.default>);
            case 'vip-badge':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="vipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#F6D365"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#FDA085"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#vipGrad)" opacity="0.2"/>
            <react_native_svg_1.Path d="M20 60 L25 35 L40 45 L50 20 L60 45 L75 35 L80 60 Z" fill="url(#vipGrad)"/>
            <react_native_svg_1.Circle cx="25" cy="35" r="6" fill="#fff" opacity="0.8"/>
            <react_native_svg_1.Circle cx="50" cy="20" r="8" fill="#fff" opacity="0.9"/>
            <react_native_svg_1.Circle cx="75" cy="35" r="6" fill="#fff" opacity="0.8"/>
            <react_native_svg_1.Path d="M30 70 L70 70" stroke="url(#vipGrad)" strokeWidth="6" strokeLinecap="round"/>
          </react_native_svg_1.default>);
            // ── Default ──
            default:
                // Use iconName if provided, otherwise render a default fallback
                if (iconName) {
                    return (<react_native_1.View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
                  <react_native_svg_1.Defs>
                    <react_native_svg_1.LinearGradient id="defGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <react_native_svg_1.Stop offset="0%" stopColor="#A1C4FD"/>
                      <react_native_svg_1.Stop offset="100%" stopColor="#C2E9FB"/>
                    </react_native_svg_1.LinearGradient>
                  </react_native_svg_1.Defs>
                  <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#defGrad)" opacity="0.3"/>
                </react_native_svg_1.default>
                <vector_icons_1.Ionicons name={iconName} size={size * 0.5} color="#4A90E2"/>
              </react_native_1.View>);
                }
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 100 100">
            <react_native_svg_1.Defs>
              <react_native_svg_1.LinearGradient id="defGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <react_native_svg_1.Stop offset="0%" stopColor="#A1C4FD"/>
                <react_native_svg_1.Stop offset="100%" stopColor="#C2E9FB"/>
              </react_native_svg_1.LinearGradient>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Circle cx="50" cy="50" r="45" fill="url(#defGrad)" opacity="0.3"/>
            <react_native_svg_1.Rect x="30" y="30" width="40" height="40" rx="10" fill="url(#defGrad)"/>
            <react_native_svg_1.Circle cx="50" cy="50" r="10" fill="#fff" opacity="0.8"/>
          </react_native_svg_1.default>);
        }
    };
    return (<react_native_1.View style={styles.container}>
      {variant === 'fancy' && (<react_native_svg_1.default width={size + 12} height={size + 12} viewBox="0 0 100 100" style={styles.halo}>
          <react_native_svg_1.Defs>
            <react_native_svg_1.LinearGradient id="haloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <react_native_svg_1.Stop offset="0%" stopColor="#ffffff" stopOpacity="0.25"/>
              <react_native_svg_1.Stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
            </react_native_svg_1.LinearGradient>
            <react_native_svg_1.LinearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <react_native_svg_1.Stop offset="0%" stopColor="#ffffff" stopOpacity="0.6"/>
              <react_native_svg_1.Stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
            </react_native_svg_1.LinearGradient>
          </react_native_svg_1.Defs>
          <react_native_svg_1.Circle cx="50" cy="50" r="48" fill="url(#haloGrad)"/>
          <react_native_svg_1.Ellipse cx="34" cy="28" rx="22" ry="10" fill="url(#glossGrad)" opacity={0.6}/>
        </react_native_svg_1.default>)}
      {renderIllustration()}
    </react_native_1.View>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    halo: {
        position: 'absolute',
        left: -6,
        top: -6,
        zIndex: -1,
    },
});
exports.default = StoreIllustration;
