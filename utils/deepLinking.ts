import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

type DeepLinkHandler = (params: Record<string, string>) => void;

export class DeepLinkingService {
    private static instance: DeepLinkingService;
    private navigationRef: NavigationContainerRef<any> | null = null;
    private linkHandlers: Map<string, DeepLinkHandler> = new Map();
    private readonly SCHEME = 'biosync';
    private readonly HOST = 'app.biosync.com';

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
    private pendingInitialURL: string | null = null;

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
        // Process any pending initial URL that arrived before navigation was ready
        if (this.pendingInitialURL) {
            this.processURL(this.pendingInitialURL);
            this.pendingInitialURL = null;
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
            console.error('Failed to get initial URL:', error);
        }
    }

    /**
     * Process a URL and route accordingly
     */
    private async processURL(url: string) {
        try {
            console.log('Processing deep link');

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
            console.error('Failed to process deep link:', error);
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
                // Custom scheme: biosync://path?param=value
                const withoutScheme = url.substring(`${this.SCHEME}://`.length);
                const [pathPart, queryPart] = withoutScheme.split('?');
                path = pathPart;
                query = queryPart || '';
            } else if (url.includes(this.HOST)) {
                // Universal link: https://app.biosync.com/path?param=value
                const urlObj = new URL(url);
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
            console.error('Failed to parse URL:', error);
            return null;
        }
    }

    /**
     * Route based on path
     */
    private routeByPath(path: string, params: Record<string, string>) {
        if (!this.navigationRef) {
            console.warn('Navigation ref not set, queuing deep link for later processing');
            // Queue URL for processing when navigation ref becomes available
            this.pendingInitialURL = `${this.SCHEME}://${path}${Object.keys(params).length > 0 ? '?' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&') : ''}`;
            return;
        }

        const navigation = this.navigationRef;

        switch (path) {
            case 'home':
                navigation.navigate('Home');
                break;

            case 'workout':
                navigation.navigate('Workout');
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
                navigation.navigate('AITools', { screen: 'AICoach' });
                break;

            case 'ai-dietitian':
                navigation.navigate('AITools', { screen: 'AIDietitian' });
                break;

            case 'ai-chef':
                navigation.navigate('AITools', { screen: 'AIChef' });
                break;

            case 'exercise':
                if (params.id) {
                    navigation.navigate('Workout', {
                        screen: 'ExerciseDetail',
                        params: { exerciseId: params.id }
                    });
                }
                break;

            case 'food':
                if (params.id) {
                    navigation.navigate('Nutrition', {
                        screen: 'FoodDetail',
                        params: { foodId: params.id }
                    });
                }
                break;

            case 'supplement':
                if (params.id) {
                    navigation.navigate('Supplements', {
                        screen: 'SupplementDetail',
                        params: { supplementId: params.id }
                    });
                }
                break;

            case 'professional':
                if (params.id) {
                    navigation.navigate('ProfessionalSearch', {
                        screen: 'ProfessionalDetail',
                        params: { professionalId: params.id }
                    });
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
                console.warn(`No route found for path: ${path}`);
                // Fallback to home
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
            console.error('Failed to open URL:', error);
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
     */
    public async openBrowser(url: string): Promise<boolean> {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }
        return this.openURL(url);
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

// Example usage:
/*
// Initialize deep linking service
const deepLinking = DeepLinkingService.getInstance();

// Set navigation ref when app starts
deepLinking.setNavigationRef(navigationRef);

// Register custom handlers
deepLinking.registerHandler('custom-action', (params) => {
  console.log('Custom action triggered');
  // Handle custom action
});

// Generate deep links
const workoutLink = deepLinking.generateDeepLink('workout');
const exerciseLink = deepLinking.generateDeepLink('exercise', { id: '123' });
const universalLink = deepLinking.generateUniversalLink('profile', { userId: '456' });

// Open links
await deepLinking.openURL(workoutLink);
await deepLinking.openEmail('app.biosync@gmail.com', 'Help Request', 'I need help with...');
await deepLinking.shareContent('Check out BioSync', 'Amazing fitness app!', 'https://biosync.com');
*/