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
/**
 * Returns an SVG-drawn food illustration based on food category and name keywords.
 * Replaces static placeholder images with dynamic, category-aware visuals.
 */
const FoodCategoryIcon = ({ category, foodName = '', size = 48 }) => {
    const name = foodName.toLowerCase();
    const cat = category.toLowerCase();
    // Detect sub-category from food name for more specific icons
    const getSubCategory = () => {
        // Meats
        if (name.includes('chicken') || name.includes('tavuk'))
            return 'poultry';
        if (name.includes('beef') || name.includes('steak') || name.includes('dana') || name.includes('s\u0131\u011f\u0131r') || name.includes('kıyma') || name.includes('mince'))
            return 'red_meat';
        if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') || name.includes('cod') || name.includes('bal\u0131k'))
            return 'fish';
        if (name.includes('egg') || name.includes('yumurta'))
            return 'egg';
        if (name.includes('lamb') || name.includes('kuzu'))
            return 'red_meat';
        if (name.includes('pork') || name.includes('bacon') || name.includes('ham') || name.includes('sausage') || name.includes('sosis'))
            return 'processed_meat';
        if (name.includes('shrimp') || name.includes('prawn') || name.includes('karides'))
            return 'seafood';
        if (name.includes('turkey') || name.includes('hindi'))
            return 'poultry';
        // Dairy
        if (name.includes('milk') || name.includes('süt'))
            return 'milk';
        if (name.includes('cheese') || name.includes('peynir'))
            return 'cheese';
        if (name.includes('yogurt') || name.includes('yoğurt'))
            return 'yogurt';
        if (name.includes('butter') || name.includes('tereya\u011f'))
            return 'butter';
        // Grains
        if (name.includes('bread') || name.includes('ekmek'))
            return 'bread';
        if (name.includes('rice') || name.includes('pilav') || name.includes('pirinç'))
            return 'rice';
        if (name.includes('pasta') || name.includes('noodle') || name.includes('makarna'))
            return 'pasta';
        if (name.includes('oat') || name.includes('cereal') || name.includes('yulaf'))
            return 'cereal';
        // Fruits
        if (name.includes('apple') || name.includes('elma'))
            return 'apple';
        if (name.includes('banana') || name.includes('muz'))
            return 'banana';
        if (name.includes('orange') || name.includes('portakal'))
            return 'citrus';
        if (name.includes('berry') || name.includes('strawberry') || name.includes('çilek'))
            return 'berry';
        if (name.includes('grape') || name.includes('üzüm'))
            return 'grape';
        // Vegetables
        if (name.includes('broccoli') || name.includes('brokoli'))
            return 'broccoli';
        if (name.includes('carrot') || name.includes('havuç'))
            return 'carrot';
        if (name.includes('tomato') || name.includes('domates'))
            return 'tomato';
        if (name.includes('potato') || name.includes('patates'))
            return 'potato';
        if (name.includes('spinach') || name.includes('ıspanak'))
            return 'leafy';
        if (name.includes('lettuce') || name.includes('marul') || name.includes('salad') || name.includes('salata'))
            return 'leafy';
        // Beverages
        if (name.includes('coffee') || name.includes('kahve'))
            return 'coffee';
        if (name.includes('tea') || name.includes('çay'))
            return 'tea';
        if (name.includes('juice') || name.includes('meyve suyu'))
            return 'juice';
        if (name.includes('water') || name.includes('su'))
            return 'water';
        if (name.includes('smoothie'))
            return 'smoothie';
        // Snacks
        if (name.includes('nut') || name.includes('almond') || name.includes('fıstık') || name.includes('badem') || name.includes('ceviz'))
            return 'nut';
        if (name.includes('chocolate') || name.includes('çikolata'))
            return 'chocolate';
        if (name.includes('cookie') || name.includes('biscuit') || name.includes('kurabiye') || name.includes('bisküvi'))
            return 'cookie';
        if (name.includes('chip') || name.includes('cips'))
            return 'chips';
        if (name.includes('cake') || name.includes('pasta') || name.includes('kek'))
            return 'cake';
        // Fall back to category
        return cat;
    };
    const subCat = getSubCategory();
    const renderIcon = () => {
        switch (subCat) {
            case 'poultry': // Drumstick
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Defs><react_native_svg_1.LinearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><react_native_svg_1.Stop offset="0" stopColor="#FBBF24"/><react_native_svg_1.Stop offset="1" stopColor="#F59E0B"/></react_native_svg_1.LinearGradient></react_native_svg_1.Defs>
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF5EB"/>
                        <react_native_svg_1.Ellipse cx="22" cy="19" rx="10" ry="8" fill="url(#fg1)"/>
                        <react_native_svg_1.Rect x="28" y="24" width="5" height="12" rx="2.5" fill="#D4A56A" transform="rotate(25 30 30)"/>
                        <react_native_svg_1.Ellipse cx="22" cy="19" rx="7" ry="5" fill="#FBBF24" opacity="0.5"/>
                    </react_native_svg_1.default>);
            case 'red_meat': // Steak
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Defs><react_native_svg_1.LinearGradient id="fg2" x1="0" y1="0" x2="0" y2="1"><react_native_svg_1.Stop offset="0" stopColor="#DC2626"/><react_native_svg_1.Stop offset="1" stopColor="#991B1B"/></react_native_svg_1.LinearGradient></react_native_svg_1.Defs>
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF0F0"/>
                        <react_native_svg_1.Ellipse cx="24" cy="24" rx="14" ry="10" fill="url(#fg2)"/>
                        <react_native_svg_1.Path d="M14 22 Q18 18 24 20 Q30 22 34 20" stroke="#FCA5A5" strokeWidth="1.5" fill="none"/>
                        <react_native_svg_1.Ellipse cx="20" cy="22" rx="2" ry="1" fill="#FCA5A5" opacity="0.6"/>
                        <react_native_svg_1.Ellipse cx="28" cy="23" rx="1.5" ry="1" fill="#FCA5A5" opacity="0.4"/>
                    </react_native_svg_1.default>);
            case 'fish': // Fish
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Defs><react_native_svg_1.LinearGradient id="fg3" x1="0" y1="0" x2="1" y2="0"><react_native_svg_1.Stop offset="0" stopColor="#60A5FA"/><react_native_svg_1.Stop offset="1" stopColor="#3B82F6"/></react_native_svg_1.LinearGradient></react_native_svg_1.Defs>
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#EFF6FF"/>
                        <react_native_svg_1.Path d="M10 24 Q16 16 28 20 Q36 22 38 24 Q36 26 28 28 Q16 32 10 24Z" fill="url(#fg3)"/>
                        <react_native_svg_1.Path d="M6 20 L10 24 L6 28Z" fill="#93C5FD"/>
                        <react_native_svg_1.Circle cx="32" cy="23" r="2" fill="#FFFFFF"/>
                        <react_native_svg_1.Circle cx="33" cy="23" r="1" fill="#1E3A5F"/>
                    </react_native_svg_1.default>);
            case 'egg': // Egg
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFFBEB"/>
                        <react_native_svg_1.Ellipse cx="24" cy="26" rx="12" ry="14" fill="#FEFCE8" stroke="#FDE68A" strokeWidth="1"/>
                        <react_native_svg_1.Circle cx="24" cy="24" r="7" fill="#FCD34D"/>
                        <react_native_svg_1.Circle cx="22" cy="22" r="2" fill="#FEFCE8" opacity="0.7"/>
                    </react_native_svg_1.default>);
            case 'seafood':
            case 'processed_meat': // Generic protein
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Defs><react_native_svg_1.LinearGradient id="fg4" x1="0" y1="0" x2="0" y2="1"><react_native_svg_1.Stop offset="0" stopColor="#FB923C"/><react_native_svg_1.Stop offset="1" stopColor="#EA580C"/></react_native_svg_1.LinearGradient></react_native_svg_1.Defs>
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
                        <react_native_svg_1.Rect x="12" y="18" width="24" height="12" rx="6" fill="url(#fg4)"/>
                        <react_native_svg_1.Path d="M14 22 Q24 26 34 22" stroke="#FDBA74" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'milk': // Milk bottle
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#F0F9FF"/>
                        <react_native_svg_1.Rect x="17" y="14" width="14" height="22" rx="3" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1.5"/>
                        <react_native_svg_1.Rect x="19" y="10" width="10" height="6" rx="2" fill="#E0F2FE"/>
                        <react_native_svg_1.Rect x="19" y="24" width="10" height="10" rx="1" fill="#BAE6FD" opacity="0.3"/>
                    </react_native_svg_1.default>);
            case 'cheese': // Cheese wedge
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFFBEB"/>
                        <react_native_svg_1.Path d="M10 32 L38 32 L38 22 Z" fill="#FCD34D"/>
                        <react_native_svg_1.Path d="M10 32 L38 32 L38 34 L10 34Z" fill="#FBBF24"/>
                        <react_native_svg_1.Circle cx="22" cy="29" r="2" fill="#FDE68A"/>
                        <react_native_svg_1.Circle cx="30" cy="27" r="1.5" fill="#FDE68A"/>
                        <react_native_svg_1.Circle cx="26" cy="31" r="1" fill="#FDE68A"/>
                    </react_native_svg_1.default>);
            case 'yogurt':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FDF2F8"/>
                        <react_native_svg_1.Rect x="14" y="16" width="20" height="20" rx="4" fill="#FFFFFF" stroke="#F9A8D4" strokeWidth="1.5"/>
                        <react_native_svg_1.Rect x="12" y="14" width="24" height="4" rx="2" fill="#F472B6"/>
                        <react_native_svg_1.Path d="M18 26 Q24 22 30 26" stroke="#F9A8D4" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'bread': // Bread loaf
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Defs><react_native_svg_1.LinearGradient id="fg5" x1="0" y1="0" x2="0" y2="1"><react_native_svg_1.Stop offset="0" stopColor="#FBBF24"/><react_native_svg_1.Stop offset="1" stopColor="#D97706"/></react_native_svg_1.LinearGradient></react_native_svg_1.Defs>
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
                        <react_native_svg_1.Path d="M10 28 Q10 18 24 16 Q38 18 38 28 L38 32 Q38 34 36 34 L12 34 Q10 34 10 32Z" fill="url(#fg5)"/>
                        <react_native_svg_1.Path d="M14 26 L18 20 M22 25 L24 18 M30 26 L32 21" stroke="#FDE68A" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'rice':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEFCE8"/>
                        <react_native_svg_1.Path d="M12 30 Q12 22 24 20 Q36 22 36 30 Z" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1"/>
                        <react_native_svg_1.Ellipse cx="20" cy="26" rx="2" ry="1" fill="#F5F5F4"/>
                        <react_native_svg_1.Ellipse cx="26" cy="25" rx="2" ry="1" fill="#F5F5F4"/>
                        <react_native_svg_1.Ellipse cx="23" cy="28" rx="2" ry="1" fill="#F5F5F4"/>
                        <react_native_svg_1.Path d="M10 30 Q24 34 38 30" stroke="#D1D5DB" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'pasta':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFFBEB"/>
                        <react_native_svg_1.Path d="M14 20 Q18 30 22 20 Q26 30 30 20 Q34 30 38 20" stroke="#FBBF24" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        <react_native_svg_1.Path d="M12 26 Q16 36 20 26 Q24 36 28 26 Q32 36 36 26" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                        <react_native_svg_1.Circle cx="20" cy="18" r="3" fill="#EF4444" opacity="0.7"/>
                    </react_native_svg_1.default>);
            case 'cereal':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEF3C7"/>
                        <react_native_svg_1.Rect x="14" y="12" width="20" height="26" rx="3" fill="#D97706"/>
                        <react_native_svg_1.Rect x="16" y="14" width="16" height="8" rx="2" fill="#FDE68A"/>
                        <react_native_svg_1.Rect x="16" y="24" width="16" height="12" rx="2" fill="#FBBF24"/>
                    </react_native_svg_1.default>);
            case 'apple':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEF2F2"/>
                        <react_native_svg_1.Path d="M24 14 Q32 14 34 24 Q36 34 24 38 Q12 34 14 24 Q16 14 24 14Z" fill="#EF4444"/>
                        <react_native_svg_1.Path d="M24 14 Q28 14 30 18" fill="none" stroke="#FCA5A5" strokeWidth="1"/>
                        <react_native_svg_1.Path d="M24 10 L24 14 Q26 12 28 10" stroke="#16A34A" strokeWidth="1.5" fill="none"/>
                    </react_native_svg_1.default>);
            case 'banana':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEFCE8"/>
                        <react_native_svg_1.Path d="M16 34 Q14 20 24 12 Q34 18 32 34 Q28 30 20 30Z" fill="#FCD34D"/>
                        <react_native_svg_1.Path d="M16 34 Q14 20 24 12" stroke="#FBBF24" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'citrus':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
                        <react_native_svg_1.Circle cx="24" cy="24" r="13" fill="#FB923C"/>
                        <react_native_svg_1.Circle cx="24" cy="24" r="10" fill="#FED7AA"/>
                        <react_native_svg_1.Path d="M24 14 L24 34 M14 24 L34 24 M17 17 L31 31 M31 17 L17 31" stroke="#FDBA74" strokeWidth="1"/>
                    </react_native_svg_1.default>);
            case 'berry':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FDF2F8"/>
                        <react_native_svg_1.Circle cx="20" cy="28" r="6" fill="#DC2626"/>
                        <react_native_svg_1.Circle cx="28" cy="26" r="5" fill="#EF4444"/>
                        <react_native_svg_1.Circle cx="24" cy="22" r="5" fill="#F87171"/>
                        <react_native_svg_1.Circle cx="19" cy="27" r="1" fill="#FCA5A5" opacity="0.5"/>
                        <react_native_svg_1.Path d="M22 16 L24 20 L26 16" stroke="#16A34A" strokeWidth="1.5" fill="none"/>
                    </react_native_svg_1.default>);
            case 'broccoli':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#F0FDF4"/>
                        <react_native_svg_1.Circle cx="20" cy="18" r="6" fill="#22C55E"/>
                        <react_native_svg_1.Circle cx="28" cy="18" r="5" fill="#16A34A"/>
                        <react_native_svg_1.Circle cx="24" cy="14" r="5" fill="#4ADE80"/>
                        <react_native_svg_1.Rect x="22" y="22" width="4" height="14" rx="2" fill="#15803D"/>
                    </react_native_svg_1.default>);
            case 'carrot':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
                        <react_native_svg_1.Path d="M24 12 L30 38 L18 38Z" fill="#FB923C"/>
                        <react_native_svg_1.Path d="M20 12 Q24 8 28 12" stroke="#16A34A" strokeWidth="2" fill="none"/>
                        <react_native_svg_1.Path d="M22 12 Q24 6 26 12" stroke="#22C55E" strokeWidth="1.5" fill="none"/>
                        <react_native_svg_1.Path d="M20 22 L28 22 M21 28 L27 28" stroke="#FDBA74" strokeWidth="0.8"/>
                    </react_native_svg_1.default>);
            case 'tomato':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEF2F2"/>
                        <react_native_svg_1.Circle cx="24" cy="26" r="12" fill="#EF4444"/>
                        <react_native_svg_1.Path d="M18 16 Q24 14 30 16" stroke="#16A34A" strokeWidth="2" fill="none"/>
                        <react_native_svg_1.Ellipse cx="24" cy="26" rx="4" ry="8" fill="none" stroke="#FCA5A5" strokeWidth="0.5" opacity="0.5"/>
                    </react_native_svg_1.default>);
            case 'potato':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEF3C7"/>
                        <react_native_svg_1.Ellipse cx="24" cy="26" rx="14" ry="10" fill="#D4A56A"/>
                        <react_native_svg_1.Ellipse cx="24" cy="26" rx="12" ry="8" fill="#E8C98A"/>
                        <react_native_svg_1.Circle cx="20" cy="24" r="1" fill="#D4A56A"/>
                        <react_native_svg_1.Circle cx="28" cy="26" r="1" fill="#D4A56A"/>
                        <react_native_svg_1.Circle cx="24" cy="29" r="0.8" fill="#D4A56A"/>
                    </react_native_svg_1.default>);
            case 'leafy':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#F0FDF4"/>
                        <react_native_svg_1.Path d="M24 10 Q36 16 34 30 Q30 38 24 38 Q18 38 14 30 Q12 16 24 10Z" fill="#4ADE80"/>
                        <react_native_svg_1.Path d="M24 14 L24 34" stroke="#16A34A" strokeWidth="1.5"/>
                        <react_native_svg_1.Path d="M24 20 L18 18 M24 24 L30 22 M24 28 L19 27" stroke="#16A34A" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'coffee':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FDF4E7"/>
                        <react_native_svg_1.Rect x="14" y="18" width="18" height="18" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1.5"/>
                        <react_native_svg_1.Path d="M32 22 Q38 22 38 28 Q38 34 32 34" stroke="#D1D5DB" strokeWidth="1.5" fill="none"/>
                        <react_native_svg_1.Rect x="16" y="22" width="14" height="10" rx="1" fill="#92400E" opacity="0.8"/>
                        <react_native_svg_1.Path d="M20 14 Q21 10 22 14 M24 12 Q25 8 26 12 M28 14 Q29 10 30 14" stroke="#D1D5DB" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'tea':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#F0FDF4"/>
                        <react_native_svg_1.Rect x="14" y="18" width="18" height="18" rx="3" fill="#FFFFFF" stroke="#BBF7D0" strokeWidth="1.5"/>
                        <react_native_svg_1.Path d="M32 22 Q38 22 38 28 Q38 34 32 34" stroke="#BBF7D0" strokeWidth="1.5" fill="none"/>
                        <react_native_svg_1.Rect x="16" y="22" width="14" height="10" rx="1" fill="#86EFAC" opacity="0.5"/>
                        <react_native_svg_1.Path d="M20 14 Q21 10 22 14 M24 12 Q25 8 26 12" stroke="#BBF7D0" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'juice':
            case 'smoothie':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
                        <react_native_svg_1.Path d="M16 14 L18 38 L30 38 L32 14Z" fill="#FB923C" opacity="0.3"/>
                        <react_native_svg_1.Rect x="14" y="12" width="20" height="4" rx="2" fill="#FB923C"/>
                        <react_native_svg_1.Path d="M18 24 L30 24" stroke="#FDBA74" strokeWidth="0.5"/>
                        <react_native_svg_1.Circle cx="22" cy="20" r="2" fill="#FB923C" opacity="0.4"/>
                    </react_native_svg_1.default>);
            case 'water':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#EFF6FF"/>
                        <react_native_svg_1.Rect x="16" y="12" width="16" height="26" rx="3" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1"/>
                        <react_native_svg_1.Rect x="18" y="22" width="12" height="14" rx="2" fill="#60A5FA" opacity="0.5"/>
                    </react_native_svg_1.default>);
            case 'nut':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEF3C7"/>
                        <react_native_svg_1.Ellipse cx="20" cy="26" rx="6" ry="8" fill="#D97706" transform="rotate(-15 20 26)"/>
                        <react_native_svg_1.Ellipse cx="28" cy="24" rx="5" ry="7" fill="#B45309" transform="rotate(10 28 24)"/>
                        <react_native_svg_1.Ellipse cx="20" cy="26" rx="4" ry="6" fill="#FBBF24" opacity="0.4" transform="rotate(-15 20 26)"/>
                    </react_native_svg_1.default>);
            case 'chocolate':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FDF4E7"/>
                        <react_native_svg_1.Rect x="12" y="16" width="24" height="16" rx="2" fill="#78350F"/>
                        <react_native_svg_1.Path d="M12 22 L36 22 M12 28 L36 28 M20 16 L20 32 M28 16 L28 32" stroke="#92400E" strokeWidth="1"/>
                        <react_native_svg_1.Rect x="14" y="18" width="6" height="4" rx="1" fill="#A16207" opacity="0.3"/>
                    </react_native_svg_1.default>);
            case 'cookie':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEF3C7"/>
                        <react_native_svg_1.Circle cx="24" cy="24" r="14" fill="#D97706"/>
                        <react_native_svg_1.Circle cx="24" cy="24" r="12" fill="#FBBF24"/>
                        <react_native_svg_1.Circle cx="20" cy="20" r="2" fill="#78350F"/>
                        <react_native_svg_1.Circle cx="28" cy="22" r="1.5" fill="#78350F"/>
                        <react_native_svg_1.Circle cx="22" cy="28" r="1.5" fill="#78350F"/>
                        <react_native_svg_1.Circle cx="27" cy="27" r="1" fill="#78350F"/>
                    </react_native_svg_1.default>);
            case 'chips':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFFBEB"/>
                        <react_native_svg_1.Path d="M16 14 Q14 24 16 34 L32 34 Q34 24 32 14Z" fill="#FCD34D"/>
                        <react_native_svg_1.Path d="M18 16 Q20 22 18 28" stroke="#FBBF24" strokeWidth="1" fill="none"/>
                        <react_native_svg_1.Path d="M26 16 Q28 22 26 28" stroke="#FBBF24" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'cake':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FDF2F8"/>
                        <react_native_svg_1.Rect x="12" y="24" width="24" height="14" rx="3" fill="#FBCFE8"/>
                        <react_native_svg_1.Rect x="12" y="22" width="24" height="4" rx="2" fill="#F472B6"/>
                        <react_native_svg_1.Rect x="14" y="18" width="20" height="6" rx="3" fill="#FECDD3"/>
                        <react_native_svg_1.Rect x="22" y="10" width="4" height="8" rx="2" fill="#FCD34D"/>
                        <react_native_svg_1.Circle cx="24" cy="10" r="2" fill="#FB923C"/>
                    </react_native_svg_1.default>);
            // Category-level fallbacks
            case 'protein':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Defs><react_native_svg_1.LinearGradient id="fg6" x1="0" y1="0" x2="0" y2="1"><react_native_svg_1.Stop offset="0" stopColor="#FB923C"/><react_native_svg_1.Stop offset="1" stopColor="#EA580C"/></react_native_svg_1.LinearGradient></react_native_svg_1.Defs>
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
                        <react_native_svg_1.Ellipse cx="24" cy="24" rx="14" ry="10" fill="url(#fg6)"/>
                        <react_native_svg_1.Path d="M14 22 Q24 26 34 22" stroke="#FDBA74" strokeWidth="1" fill="none"/>
                        <react_native_svg_1.Ellipse cx="20" cy="22" rx="2" ry="1" fill="#FDBA74" opacity="0.5"/>
                    </react_native_svg_1.default>);
            case 'snacks':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFFBEB"/>
                        <react_native_svg_1.Rect x="14" y="14" width="20" height="20" rx="6" fill="#FCD34D"/>
                        <react_native_svg_1.Circle cx="20" cy="22" r="2" fill="#92400E"/>
                        <react_native_svg_1.Circle cx="26" cy="20" r="1.5" fill="#92400E"/>
                        <react_native_svg_1.Circle cx="24" cy="28" r="2" fill="#92400E"/>
                    </react_native_svg_1.default>);
            case 'beverages':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#EFF6FF"/>
                        <react_native_svg_1.Rect x="16" y="12" width="16" height="26" rx="3" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1"/>
                        <react_native_svg_1.Rect x="18" y="20" width="12" height="16" rx="2" fill="#60A5FA" opacity="0.4"/>
                        <react_native_svg_1.Path d="M20 14 Q21 10 22 14 M24 12 Q25 8 26 12" stroke="#93C5FD" strokeWidth="1" fill="none"/>
                    </react_native_svg_1.default>);
            case 'grains':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFFBEB"/>
                        <react_native_svg_1.Path d="M14 24 Q14 16 24 14 Q34 16 34 24 L32 36 L16 36Z" fill="#FBBF24"/>
                        <react_native_svg_1.Path d="M18 22 L30 22 M19 28 L29 28" stroke="#FDE68A" strokeWidth="1"/>
                    </react_native_svg_1.default>);
            case 'dairy':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#F0F9FF"/>
                        <react_native_svg_1.Rect x="16" y="14" width="16" height="22" rx="3" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1.5"/>
                        <react_native_svg_1.Rect x="18" y="10" width="12" height="6" rx="2" fill="#E0F2FE"/>
                        <react_native_svg_1.Rect x="18" y="24" width="12" height="10" rx="1" fill="#BAE6FD" opacity="0.3"/>
                    </react_native_svg_1.default>);
            case 'vegetables':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#F0FDF4"/>
                        <react_native_svg_1.Path d="M24 10 Q36 16 34 30 Q30 38 24 38 Q18 38 14 30 Q12 16 24 10Z" fill="#4ADE80"/>
                        <react_native_svg_1.Path d="M24 14 L24 34" stroke="#16A34A" strokeWidth="1.5"/>
                    </react_native_svg_1.default>);
            case 'fruits':
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FEF2F2"/>
                        <react_native_svg_1.Circle cx="24" cy="26" r="12" fill="#EF4444"/>
                        <react_native_svg_1.Path d="M24 10 L24 14 Q26 12 28 10" stroke="#16A34A" strokeWidth="1.5" fill="none"/>
                        <react_native_svg_1.Circle cx="21" cy="23" r="3" fill="#FCA5A5" opacity="0.4"/>
                    </react_native_svg_1.default>);
            default: // Generic food plate
                return (<react_native_svg_1.default width={size} height={size} viewBox="0 0 48 48">
                        <react_native_svg_1.Circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
                        <react_native_svg_1.Ellipse cx="24" cy="28" rx="16" ry="10" fill="#F5F5F4" stroke="#E5E7EB" strokeWidth="1"/>
                        <react_native_svg_1.Ellipse cx="24" cy="26" rx="12" ry="6" fill="#FED7AA"/>
                        <react_native_svg_1.Circle cx="20" cy="25" r="3" fill="#FB923C" opacity="0.6"/>
                        <react_native_svg_1.Circle cx="28" cy="25" r="2" fill="#4ADE80" opacity="0.6"/>
                    </react_native_svg_1.default>);
        }
    };
    return (<react_native_1.View style={[styles.container, { width: size, height: size }]}>
            {renderIcon()}
        </react_native_1.View>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        borderRadius: 14,
        overflow: 'hidden',
    },
});
// Memoize component to prevent re-renders when props don't change
exports.default = react_1.default.memo(FoodCategoryIcon);
