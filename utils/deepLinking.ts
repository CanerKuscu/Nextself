import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

type DeepLinkHandler = (params: Record<string, string>) => void;

export class DeepLinkingService {
    private static instance: DeepLinkingService;
    private navigationRef: NavigationContainerRef<any> | null = null;
    private linkHandlers: Map<string, DeepLinkHandler> = new Map();
    private readonly SCHEME = 'nextself';
    private readonly HOST = 'app.nextself.com';

    private constructor() {
        this.init();
    }

    public static getInstance(): DeepLinkingService {
        if (!DeepLinkingService.instance) {
            DeepLinkingService.instance = new DeepLinkingService();
        }
        return DeepLinkingService.instance;
    }

    private linkingSubscription: any;
    private pendingURLs: string[] = [];

    private init() {
        // Listen for incoming deep links
        this.linkingSubscription = Linking.addEventListener('url', this.handleIncomingLink);

        // Check if app was opened with a deep link
        this.getInitialURL();
    }

    /**
     * Set navigation reference for navigation
     */
    public setNavigationRef(ref: NavigationContainerRef<any>) {
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
    public registerHandler(path: string, handler: DeepLinkHandler) {
        this.linkHandlers.set(path, handler);
    }

    /**
     * Generate a deep link URL
     */
    public generateDeepLink(path: string, params: Record<string, string> = {}): string {
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        const url = `${this.SCHEME}://${path}${queryString ? `?${queryString}` : ''}`;
        return url;
    }

    /**
     * Generate a universal link URL
     */
    public generateUniversalLink(path: string, params: Record<string, string> = {}): string {
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        const url = `https://${this.HOST}/${path}${queryString ? `?${queryString}` : ''}`;
        return url;
    }

    /**
     * Handle incoming deep link
     */
    private handleIncomingLink = (event: { url: string }) => {
        const url = event.url;
        this.processURL(url);
    };

    /**
     * Get initial URL if app was opened with a deep link
     */
    private async getInitialURL() {
        try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                this.processURL(initialUrl);
            }
        } catch (error) {
            // Silently ignore - deep link processing failure is not critical
            return;
        }
    }

    /**
     * Process a URL and route accordingly
     */
    private async processURL(url: string) {
        try {
            // Parse URL
            const parsed = this.parseURL(url);
            if (!parsed) return;

            const { path, params } = parsed;

            // Check if we have a registered handler
            const handler = this.linkHandlers.get(path);
            if (handler) {
                handler(params);
                return;
            }

            // Default routing based on path
            this.routeByPath(path, params);
        } catch (error) {
            // Silently ignore - URL processing failure is not critical
            return;
        }
    }

    /**
     * Process any pending URLs now (useful after auth state changes)
     */
    public processPendingURLs() {
        if (!this.navigationRef || this.pendingURLs.length === 0) return;
        const pending = [...this.pendingURLs];
        this.pendingURLs = [];
        for (const url of pending) {
            setTimeout(() => this.processURL(url), 0);
        }
    }

    /**
     * Parse URL into path and parameters
     */
    private parseURL(url: string): { path: string; params: Record<string, string> } | null {
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
            } else if (url.includes(this.HOST)) {
                // Universal link: https://app.nextself.com/path?param=value
                // SECURITY: Validate host strictly to prevent malicious redirects
                let urlObj: URL;
                try {
                    urlObj = new URL(url);
                } catch {
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
            } else {
                return null;
            }

            // Parse query parameters
            const params: Record<string, string> = {};
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
        } catch (error) {
            // Silently ignore - URL parsing failure is not critical
            return null;
        }
    }

    /**
     * Sanitize deep link parameters to prevent injection attacks.
     * Only allows whitelisted param keys with safe string values.
     */
    private sanitizeDeepLinkParams(params: Record<string, string>): Record<string, string> {
        const ALLOWED_PARAM_KEYS = new Set(['id', 'token', 'email', 'screen', 'tab']);
        const MAX_PARAM_LENGTH = 256;
        const sanitized: Record<string, string> = {};

        for (const [key, value] of Object.entries(params)) {
            // Only allow whitelisted param keys
            if (!ALLOWED_PARAM_KEYS.has(key)) continue;
            if (typeof value !== 'string') continue;
            // Limit length and strip dangerous characters
            const truncated = value.slice(0, MAX_PARAM_LENGTH);
            // Only allow alphanumeric, hyphens, underscores, dots, @, +
            const safe = truncated.replace(/[^a-zA-Z0-9\-_.@+]/g, '');
            if (safe.length > 0) {
                sanitized[key] = safe;
            }
        }

        return sanitized;
    }

    private isValidUUID(id: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    /**
     * Route based on path
     */
    private routeByPath(path: string, params: Record<string, string>) {
        // Sanitize deep link params to prevent injection
        const sanitizedParams = this.sanitizeDeepLinkParams(params);

        if (!this.navigationRef) {
            // Queue URL for processing when navigation ref becomes available
            const url = `${this.SCHEME}://${path}${Object.keys(sanitizedParams).length > 0 ? '?' + Object.entries(sanitizedParams).map(([k, v]) => `${k}=${v}`).join('&') : ''}`;
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
            const currentRoute = (this.navigationRef as any).getCurrentRoute?.();
            const currentName = currentRoute?.name;
            const authStackNames = new Set(['Auth']);
            const allowedWhileAuth = new Set(['verify-email', 'reset-password']);
            if (currentName && authStackNames.has(currentName) && !allowedWhileAuth.has(path)) {
                const url = `${this.SCHEME}://${path}${Object.keys(sanitizedParams).length > 0 ? '?' + Object.entries(sanitizedParams).map(([k, v]) => `${k}=${v}`).join('&') : ''}`;
            if (this.pendingURLs.length >= 10) this.pendingURLs.shift();
            this.pendingURLs.push(url);
                return;
            }
        } catch (queueError) {
            console.warn('[deepLinking] Failed to queue deferred deep link:', queueError);
        }

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
                if (sanitizedParams.id && this.isValidUUID(sanitizedParams.id)) {
                    navigation.navigate('ExerciseDetail', { exerciseId: sanitizedParams.id });
                }
                break;

            case 'food':
                if (sanitizedParams.id && this.isValidUUID(sanitizedParams.id)) {
                    navigation.navigate('FoodScanner', { foodId: sanitizedParams.id });
                }
                break;

            case 'supplement':
                if (sanitizedParams.id && this.isValidUUID(sanitizedParams.id)) {
                    navigation.navigate('Supplements');
                }
                break;

            case 'professional':
                if (sanitizedParams.id && this.isValidUUID(sanitizedParams.id)) {
                    navigation.navigate('ProfessionalSearch');
                }
                break;

            case 'verify-email':
                if (sanitizedParams.token) {
                    navigation.navigate('EmailVerification', {
                        token: sanitizedParams.token,
                        email: sanitizedParams.email
                    });
                }
                break;

            case 'reset-password':
                if (sanitizedParams.token) {
                    navigation.navigate('Auth', {
                        screen: 'ResetPassword',
                        params: { token: sanitizedParams.token }
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
    public async openURL(url: string): Promise<boolean> {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                return true;
            }
            return false;
        } catch (error) {
            // Silently ignore - URL opening failure is not critical
            return false;
        }
    }

    /**
     * Open app settings
     */
    public async openAppSettings(): Promise<boolean> {
        return this.openURL('app-settings:');
    }

    /**
     * Open notification settings
     */
    public async openNotificationSettings(): Promise<boolean> {
        return this.openURL('app-settings:notifications');
    }

    /**
     * Open location settings
     */
    public async openLocationSettings(): Promise<boolean> {
        return this.openURL('app-settings:location');
    }

    /**
     * Open email app
     */
    public async openEmail(to: string, subject: string = '', body: string = ''): Promise<boolean> {
        const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        return this.openURL(url);
    }

    /**
     * Open phone app
     */
    public async openPhone(phoneNumber: string): Promise<boolean> {
        const url = `tel:${phoneNumber}`;
        return this.openURL(url);
    }

    /**
     * Open SMS app
     */
    public async openSMS(phoneNumber: string, body: string = ''): Promise<boolean> {
        const url = `sms:${phoneNumber}${body ? `?body=${encodeURIComponent(body)}` : ''}`;
        return this.openURL(url);
    }

    /**
     * Open maps app
     */
    public async openMaps(latitude: number, longitude: number, label: string = ''): Promise<boolean> {
        const url = `geo:${latitude},${longitude}${label ? `?q=${encodeURIComponent(label)}` : ''}`;
        return this.openURL(url);
    }

    /**
     * Open web browser
     * SECURITY: Only allows http:// and https:// URLs to prevent malicious schemes
     */
    public async openBrowser(url: string): Promise<boolean> {
        try {
            // Parse URL to validate scheme and host
            let urlObj: URL;
            try {
                urlObj = new URL(url);
            } catch {
                // If URL is invalid, try prepending https://
                if (!url.includes('://')) {
                    url = `https://${url}`;
                    try {
                        urlObj = new URL(url);
                    } catch {
                        // Invalid URL format - security validation failed
                        return false;
                    }
                } else {
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
        } catch (error) {
            // Silently ignore - browser opening failure is not critical
            return false;
        }
    }

    /**
     * Share content
     */
    public async shareContent(title: string, message: string, url?: string): Promise<boolean> {
        try {
            const { Share } = require('react-native');
            await Share.share({
                title,
                message: url ? `${message}\n\n${url}` : message,
                url,
            });
            return true;
        } catch (error: any) {
            if (error.message === 'User did not share') {
                // User cancelled, not an error
                return false;
            }
            console.error('Failed to share:', error);
            return false;
        }
    }

    /**
     * Cleanup event listeners
     */
    public cleanup() {
        if (this.linkingSubscription) {
            this.linkingSubscription.remove();
        }
    }
}