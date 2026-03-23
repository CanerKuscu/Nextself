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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepLinkingService = void 0;
const react_native_1 = require("react-native");
class DeepLinkingService {
    constructor() {
        this.navigationRef = null;
        this.linkHandlers = new Map();
        this.SCHEME = 'nextself';
        this.HOST = 'app.nextself.com';
        this.pendingURLs = [];
        /**
         * Handle incoming deep link
         */
        this.handleIncomingLink = (event) => {
            const url = event.url;
            this.processURL(url);
        };
        this.init();
    }
    static getInstance() {
        if (!DeepLinkingService.instance) {
            DeepLinkingService.instance = new DeepLinkingService();
        }
        return DeepLinkingService.instance;
    }
    init() {
        // Listen for incoming deep links
        this.linkingSubscription = react_native_1.Linking.addEventListener('url', this.handleIncomingLink);
        // Check if app was opened with a deep link
        this.getInitialURL();
    }
    /**
     * Set navigation reference for navigation
     */
    setNavigationRef(ref) {
        this.navigationRef = ref;
        // Process any pending URLs that arrived before navigation was ready
        if (this.pendingURLs.length > 0) {
            // Process in FIFO order
            const pending = [...this.pendingURLs];
            this.pendingURLs = [];
            for (const url of pending) {
                // processURL will route using the now-ready navigationRef
                // process asynchronously to avoid blocking
                setTimeout(() => {
                    this.processURL(url);
                }, 0);
            }
        }
    }
    /**
     * Register a handler for a specific path
     */
    registerHandler(path, handler) {
        this.linkHandlers.set(path, handler);
    }
    /**
     * Generate a deep link URL
     */
    generateDeepLink(path, params = {}) {
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        const url = `${this.SCHEME}://${path}${queryString ? `?${queryString}` : ''}`;
        return url;
    }
    /**
     * Generate a universal link URL
     */
    generateUniversalLink(path, params = {}) {
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        const url = `https://${this.HOST}/${path}${queryString ? `?${queryString}` : ''}`;
        return url;
    }
    /**
     * Get initial URL if app was opened with a deep link
     */
    getInitialURL() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const initialUrl = yield react_native_1.Linking.getInitialURL();
                if (initialUrl) {
                    this.processURL(initialUrl);
                }
            }
            catch (error) {
                // Silently ignore - deep link processing failure is not critical
                return;
            }
        });
    }
    /**
     * Process a URL and route accordingly
     */
    processURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Parse URL
                const parsed = this.parseURL(url);
                if (!parsed)
                    return;
                const { path, params } = parsed;
                // Check if we have a registered handler
                const handler = this.linkHandlers.get(path);
                if (handler) {
                    handler(params);
                    return;
                }
                // Default routing based on path
                this.routeByPath(path, params);
            }
            catch (error) {
                // Silently ignore - URL processing failure is not critical
                return;
            }
        });
    }
    /**
     * Process any pending URLs now (useful after auth state changes)
     */
    processPendingURLs() {
        if (!this.navigationRef || this.pendingURLs.length === 0)
            return;
        const pending = [...this.pendingURLs];
        this.pendingURLs = [];
        for (const url of pending) {
            setTimeout(() => this.processURL(url), 0);
        }
    }
    /**
     * Parse URL into path and parameters
     */
    parseURL(url) {
        try {
            // Handle both custom scheme and universal links
            let path = '';
            let query = '';
            if (url.startsWith(`${this.SCHEME}://`)) {
                // Custom scheme: NextSelf://path?param=value
                const withoutScheme = url.substring(`${this.SCHEME}://`.length);
                const [pathPart, queryPart] = withoutScheme.split('?');
                path = pathPart;
                query = queryPart || '';
            }
            else if (url.includes(this.HOST)) {
                // Universal link: https://app.nextself.com/path?param=value
                // SECURITY: Validate host strictly to prevent malicious redirects
                let urlObj;
                try {
                    urlObj = new URL(url);
                }
                catch (_a) {
                    // Invalid URL format - security validation failed
                    return null;
                }
                // Strict host validation - only allow exact match or www subdomain
                const allowedHosts = [this.HOST, `www.${this.HOST}`];
                if (!allowedHosts.includes(urlObj.host)) {
                    // Rejected deep link from unauthorized host - security measure
                    return null;
                }
                path = urlObj.pathname.substring(1); // Remove leading slash
                query = urlObj.search.substring(1); // Remove leading ?
            }
            else {
                return null;
            }
            // Parse query parameters
            const params = {};
            if (query) {
                const pairs = query.split('&');
                for (const pair of pairs) {
                    const [key, value] = pair.split('=');
                    if (key && value) {
                        params[decodeURIComponent(key)] = decodeURIComponent(value);
                    }
                }
            }
            return { path, params };
        }
        catch (error) {
            // Silently ignore - URL parsing failure is not critical
            return null;
        }
    }
    /**
     * Route based on path
     */
    routeByPath(path, params) {
        var _a, _b;
        if (!this.navigationRef) {
            // Queue URL for processing when navigation ref becomes available
            const url = `${this.SCHEME}://${path}${Object.keys(params).length > 0 ? '?' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&') : ''}`;
            if (this.pendingURLs.length >= 10) {
                this.pendingURLs.shift();
            }
            this.pendingURLs.push(url);
            return;
        }
        const navigation = this.navigationRef;
        // If the app is currently on the Auth flow and the deep link requires an
        // authenticated route, re-queue it for processing after auth completes.
        try {
            const currentRoute = (_b = (_a = this.navigationRef).getCurrentRoute) === null || _b === void 0 ? void 0 : _b.call(_a);
            const currentName = currentRoute === null || currentRoute === void 0 ? void 0 : currentRoute.name;
            const authStackNames = new Set(['Auth']);
            const allowedWhileAuth = new Set(['verify-email', 'reset-password']);
            if (currentName && authStackNames.has(currentName) && !allowedWhileAuth.has(path)) {
                const url = `${this.SCHEME}://${path}${Object.keys(params).length > 0 ? '?' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&') : ''}`;
                if (this.pendingURLs.length >= 10)
                    this.pendingURLs.shift();
                this.pendingURLs.push(url);
                return;
            }
        }
        catch (_) { }
        switch (path) {
            case 'home':
                navigation.navigate('Home');
                break;
            case 'workout':
                navigation.navigate('Sports');
                break;
            case 'nutrition':
                navigation.navigate('Nutrition');
                break;
            case 'health':
                navigation.navigate('Health');
                break;
            case 'supplements':
                navigation.navigate('Supplements');
                break;
            case 'water':
                navigation.navigate('Health');
                break;
            case 'missions':
                navigation.navigate('Missions');
                break;
            case 'store':
                navigation.navigate('Store');
                break;
            case 'smart-scale':
                navigation.navigate('SmartScale');
                break;
            case 'food-scanner':
                navigation.navigate('FoodScanner');
                break;
            case 'profile':
                navigation.navigate('Profile');
                break;
            case 'settings':
                navigation.navigate('Settings');
                break;
            case 'ai-coach':
                navigation.navigate('AIToolsStack', { screen: 'AICoach' });
                break;
            case 'ai-dietitian':
                navigation.navigate('AIToolsStack', { screen: 'AIDietitian' });
                break;
            case 'ai-chef':
                navigation.navigate('AIToolsStack', { screen: 'AIChef' });
                break;
            case 'exercise':
                if (params.id) {
                    navigation.navigate('ExerciseDetail', { exerciseId: params.id });
                }
                break;
            case 'food':
                if (params.id) {
                    navigation.navigate('FoodScanner', { foodId: params.id });
                }
                break;
            case 'supplement':
                if (params.id) {
                    navigation.navigate('Supplements');
                }
                break;
            case 'professional':
                if (params.id) {
                    navigation.navigate('ProfessionalSearch');
                }
                break;
            case 'verify-email':
                if (params.token) {
                    navigation.navigate('EmailVerification', {
                        token: params.token,
                        email: params.email
                    });
                }
                break;
            case 'reset-password':
                if (params.token) {
                    navigation.navigate('Auth', {
                        screen: 'ResetPassword',
                        params: { token: params.token }
                    });
                }
                break;
            default:
                // Fallback to home - no route found for path
                navigation.navigate('Home');
        }
    }
    /**
     * Open a URL in the app or browser
     */
    openURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supported = yield react_native_1.Linking.canOpenURL(url);
                if (supported) {
                    yield react_native_1.Linking.openURL(url);
                    return true;
                }
                return false;
            }
            catch (error) {
                // Silently ignore - URL opening failure is not critical
                return false;
            }
        });
    }
    /**
     * Open app settings
     */
    openAppSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.openURL('app-settings:');
        });
    }
    /**
     * Open notification settings
     */
    openNotificationSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.openURL('app-settings:notifications');
        });
    }
    /**
     * Open location settings
     */
    openLocationSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.openURL('app-settings:location');
        });
    }
    /**
     * Open email app
     */
    openEmail(to_1) {
        return __awaiter(this, arguments, void 0, function* (to, subject = '', body = '') {
            const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            return this.openURL(url);
        });
    }
    /**
     * Open phone app
     */
    openPhone(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `tel:${phoneNumber}`;
            return this.openURL(url);
        });
    }
    /**
     * Open SMS app
     */
    openSMS(phoneNumber_1) {
        return __awaiter(this, arguments, void 0, function* (phoneNumber, body = '') {
            const url = `sms:${phoneNumber}${body ? `?body=${encodeURIComponent(body)}` : ''}`;
            return this.openURL(url);
        });
    }
    /**
     * Open maps app
     */
    openMaps(latitude_1, longitude_1) {
        return __awaiter(this, arguments, void 0, function* (latitude, longitude, label = '') {
            const url = `geo:${latitude},${longitude}${label ? `?q=${encodeURIComponent(label)}` : ''}`;
            return this.openURL(url);
        });
    }
    /**
     * Open web browser
     * SECURITY: Only allows http:// and https:// URLs to prevent malicious schemes
     */
    openBrowser(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Parse URL to validate scheme and host
                let urlObj;
                try {
                    urlObj = new URL(url);
                }
                catch (_a) {
                    // If URL is invalid, try prepending https://
                    if (!url.includes('://')) {
                        url = `https://${url}`;
                        try {
                            urlObj = new URL(url);
                        }
                        catch (_b) {
                            // Invalid URL format - security validation failed
                            return false;
                        }
                    }
                    else {
                        // Invalid URL format - security validation failed
                        return false;
                    }
                }
                // SECURITY: Only allow http and https schemes
                const allowedSchemes = ['http:', 'https:'];
                if (!allowedSchemes.includes(urlObj.protocol)) {
                    // Rejected URL with disallowed scheme - security measure
                    return false;
                }
                // Reject URLs with embedded credentials
                if (urlObj.username || urlObj.password) {
                    // Rejected URL with embedded credentials - security measure
                    return false;
                }
                return this.openURL(url);
            }
            catch (error) {
                // Silently ignore - browser opening failure is not critical
                return false;
            }
        });
    }
    /**
     * Share content
     */
    shareContent(title, message, url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { Share } = require('react-native');
                yield Share.share({
                    title,
                    message: url ? `${message}\n\n${url}` : message,
                    url,
                });
                return true;
            }
            catch (error) {
                if (error.message === 'User did not share') {
                    // User cancelled, not an error
                    return false;
                }
                console.error('Failed to share:', error);
                return false;
            }
        });
    }
    /**
     * Cleanup event listeners
     */
    cleanup() {
        if (this.linkingSubscription) {
            this.linkingSubscription.remove();
        }
    }
}
exports.DeepLinkingService = DeepLinkingService;
