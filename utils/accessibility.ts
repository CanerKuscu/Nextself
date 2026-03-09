import { AccessibilityInfo, Platform } from 'react-native';

export class AccessibilityService {
    private static instance: AccessibilityService;
    private isScreenReaderEnabled: boolean = false;
    private isBoldTextEnabled: boolean = false;
    private isReduceMotionEnabled: boolean = false;
    private isReduceTransparencyEnabled: boolean = false;
    private isInvertColorsEnabled: boolean = false;

    private constructor() {
        this.init();
    }

    public static getInstance(): AccessibilityService {
        if (!AccessibilityService.instance) {
            AccessibilityService.instance = new AccessibilityService();
        }
        return AccessibilityService.instance;
    }

    private async init() {
        await this.checkAccessibilityFeatures();
        this.setupListeners();
    }

    private async checkAccessibilityFeatures() {
        try {
            this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
            this.isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
            this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
            this.isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();
            this.isInvertColorsEnabled = await AccessibilityInfo.isInvertColorsEnabled();
        } catch (error) {
            console.error('Failed to check accessibility features:', error);
        }
    }

    private screenReaderSubscription: any;
    private boldTextSubscription: any;
    private reduceMotionSubscription: any;
    private reduceTransparencySubscription: any;
    private invertColorsSubscription: any;

    private setupListeners() {
        // Screen reader status changes
        this.screenReaderSubscription = AccessibilityInfo.addEventListener(
            'screenReaderChanged',
            this.handleScreenReaderChanged
        );

        // Bold text status changes
        this.boldTextSubscription = AccessibilityInfo.addEventListener(
            'boldTextChanged',
            this.handleBoldTextChanged
        );

        // Reduce motion status changes
        this.reduceMotionSubscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            this.handleReduceMotionChanged
        );

        // Reduce transparency status changes
        this.reduceTransparencySubscription = AccessibilityInfo.addEventListener(
            'reduceTransparencyChanged',
            this.handleReduceTransparencyChanged
        );

        // Invert colors status changes
        this.invertColorsSubscription = AccessibilityInfo.addEventListener(
            'invertColorsChanged',
            this.handleInvertColorsChanged
        );
    }

    private handleScreenReaderChanged = (enabled: boolean) => {
        this.isScreenReaderEnabled = enabled;
        this.emitAccessibilityChange('screenReader', enabled);
    };

    private handleBoldTextChanged = (enabled: boolean) => {
        this.isBoldTextEnabled = enabled;
        this.emitAccessibilityChange('boldText', enabled);
    };

    private handleReduceMotionChanged = (enabled: boolean) => {
        this.isReduceMotionEnabled = enabled;
        this.emitAccessibilityChange('reduceMotion', enabled);
    };

    private handleReduceTransparencyChanged = (enabled: boolean) => {
        this.isReduceTransparencyEnabled = enabled;
        this.emitAccessibilityChange('reduceTransparency', enabled);
    };

    private handleInvertColorsChanged = (enabled: boolean) => {
        this.isInvertColorsEnabled = enabled;
        this.emitAccessibilityChange('invertColors', enabled);
    };

    private emitAccessibilityChange(feature: string, enabled: boolean) {
        // Could be used to update UI or trigger actions
        // Example: EventEmitter.emit('accessibilityChange', { feature, enabled });
    }

    /**
     * Check if screen reader is enabled
     */
    public isScreenReaderOn(): boolean {
        return this.isScreenReaderEnabled;
    }

    /**
     * Check if bold text is enabled
     */
    public isBoldTextOn(): boolean {
        return this.isBoldTextEnabled;
    }

    /**
     * Check if reduce motion is enabled
     */
    public isReduceMotionOn(): boolean {
        return this.isReduceMotionEnabled;
    }

    /**
     * Check if reduce transparency is enabled
     */
    public isReduceTransparencyOn(): boolean {
        return this.isReduceTransparencyEnabled;
    }

    /**
     * Check if invert colors is enabled
     */
    public isInvertColorsOn(): boolean {
        return this.isInvertColorsEnabled;
    }

    /**
     * Get all accessibility settings
     */
    public getAccessibilitySettings() {
        return {
            screenReader: this.isScreenReaderEnabled,
            boldText: this.isBoldTextEnabled,
            reduceMotion: this.isReduceMotionEnabled,
            reduceTransparency: this.isReduceTransparencyEnabled,
            invertColors: this.isInvertColorsEnabled,
        };
    }

    /**
     * Announce message to screen reader
     */
    public announce(message: string, options?: { queue?: boolean }) {
        if (this.isScreenReaderEnabled) {
            AccessibilityInfo.announceForAccessibility(message);
        }
    }

    /**
     * Get accessibility props for a button
     */
    public getButtonProps(label: string, hint?: string) {
        return {
            accessible: true,
            accessibilityLabel: label,
            accessibilityHint: hint,
            accessibilityRole: 'button' as const,
            accessibilityState: { disabled: false },
        };
    }

    /**
     * Get accessibility props for an input field
     */
    public getInputProps(label: string, hint?: string, value?: string) {
        return {
            accessible: true,
            accessibilityLabel: label,
            accessibilityHint: hint,
            accessibilityRole: 'text' as const,
            accessibilityValue: value ? { text: value } : undefined,
        };
    }

    /**
     * Get accessibility props for an image
     */
    public getImageProps(label: string, hint?: string) {
        return {
            accessible: true,
            accessibilityLabel: label,
            accessibilityHint: hint,
            accessibilityRole: 'image' as const,
        };
    }

    /**
     * Get accessibility props for a link
     */
    public getLinkProps(label: string, hint?: string) {
        return {
            accessible: true,
            accessibilityLabel: label,
            accessibilityHint: hint,
            accessibilityRole: 'link' as const,
        };
    }

    /**
     * Get accessibility props for a heading
     */
    public getHeadingProps(level: 1 | 2 | 3 | 4 | 5 | 6 = 1) {
        return {
            accessible: true,
            accessibilityRole: 'header' as const,
            accessibilityLevel: level,
        };
    }

    /**
     * Get accessibility props for a list item
     */
    public getListItemProps(label: string, hint?: string) {
        return {
            accessible: true,
            accessibilityLabel: label,
            accessibilityHint: hint,
            accessibilityRole: Platform.OS === 'ios' ? 'listitem' : ('none' as const),
        };
    }

    /**
     * Get accessibility props for a switch/toggle
     */
    public getSwitchProps(label: string, value: boolean, hint?: string) {
        return {
            accessible: true,
            accessibilityLabel: label,
            accessibilityHint: hint,
            accessibilityRole: 'switch' as const,
            accessibilityState: { checked: value },
            accessibilityValue: { text: value ? 'on' : 'off' },
        };
    }

    /**
     * Get accessibility props for a slider
     */
    public getSliderProps(label: string, value: number, min: number, max: number, hint?: string) {
        return {
            accessible: true,
            accessibilityLabel: label,
            accessibilityHint: hint,
            accessibilityRole: 'adjustable' as const,
            accessibilityValue: { min, max, now: value },
        };
    }

    /**
     * Get minimum touch target size (44x44 points as per Apple/Android guidelines)
     */
    public getMinTouchTargetSize(): { width: number; height: number } {
        return { width: 44, height: 44 };
    }

    /**
     * Get recommended font sizes for different text roles
     */
    public getFontSizes() {
        const baseSize = 16;
        const boldTextMultiplier = this.isBoldTextEnabled ? 1.2 : 1;

        return {
            body: baseSize * boldTextMultiplier,
            caption: baseSize * 0.875 * boldTextMultiplier,
            heading1: baseSize * 2 * boldTextMultiplier,
            heading2: baseSize * 1.75 * boldTextMultiplier,
            heading3: baseSize * 1.5 * boldTextMultiplier,
            heading4: baseSize * 1.25 * boldTextMultiplier,
            heading5: baseSize * 1.125 * boldTextMultiplier,
            heading6: baseSize * boldTextMultiplier,
        };
    }

    /**
     * Get recommended contrast ratios for text
     */
    public getContrastRatios() {
        return {
            normalText: 4.5, // WCAG AA
            largeText: 3.0, // WCAG AA for large text
            enhanced: 7.0, // WCAG AAA
        };
    }

    /**
     * Check if color combination has sufficient contrast
     */
    public hasSufficientContrast(foreground: string, background: string): boolean {
        // Simple contrast calculation (for demonstration)
        // In a real app, use a proper contrast ratio calculator
        const fg = this.getLuminance(foreground);
        const bg = this.getLuminance(background);
        const contrast = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        return contrast >= 4.5;
    }

    private getLuminance(color: string): number {
        // Proper relative luminance calculation per WCAG 2.0
        const hex = color.replace('#', '');
        if (hex.length !== 6 && hex.length !== 3) return 0.5;

        let r: number, g: number, b: number;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16) / 255;
            g = parseInt(hex[1] + hex[1], 16) / 255;
            b = parseInt(hex[2] + hex[2], 16) / 255;
        } else {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
        }

        // Linearize sRGB channels
        const linearize = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
    }

    /**
     * Get animation settings based on reduce motion preference
     */
    public getAnimationSettings() {
        if (this.isReduceMotionOn()) {
            return {
                duration: 0,
                useNativeDriver: true,
                shouldReduceMotion: true,
            };
        }

        return {
            duration: 300,
            useNativeDriver: true,
            shouldReduceMotion: false,
        };
    }

    /**
     * Get visual effect settings based on reduce transparency preference
     */
    public getVisualEffectSettings() {
        if (this.isReduceTransparencyOn()) {
            return {
                blurEffect: 'none' as const,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                shouldReduceTransparency: true,
            };
        }

        return {
            blurEffect: 'regular' as const,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            shouldReduceTransparency: false,
        };
    }

    /**
     * Get color settings based on invert colors preference
     */
    public getColorSettings() {
        if (this.isInvertColorsOn()) {
            return {
                shouldInvertColors: true,
                filter: 'invert(100%)',
            };
        }

        return {
            shouldInvertColors: false,
            filter: 'none',
        };
    }

    /**
     * Generate accessibility report
     */
    public generateAccessibilityReport() {
        const settings = this.getAccessibilitySettings();
        const issues: string[] = [];

        // Check for potential accessibility issues
        if (settings.screenReader) {
            // Screen reader specific checks
            issues.push('Screen reader is enabled - ensure all interactive elements have proper labels');
        }

        if (settings.boldText) {
            issues.push('Bold text is enabled - ensure text scaling works correctly');
        }

        if (settings.reduceMotion) {
            issues.push('Reduce motion is enabled - animations should be minimal or disabled');
        }

        if (settings.reduceTransparency) {
            issues.push('Reduce transparency is enabled - avoid translucent effects');
        }

        if (settings.invertColors) {
            issues.push('Invert colors is enabled - ensure color contrast remains sufficient');
        }

        return {
            settings,
            issues,
            recommendations: [
                'Use semantic HTML elements where possible',
                'Ensure sufficient color contrast (minimum 4.5:1 for normal text)',
                'Provide text alternatives for non-text content',
                'Make all functionality available from a keyboard',
                'Help users avoid and correct mistakes',
            ],
        };
    }

    /**
     * Cleanup event listeners
     */
    public cleanup() {
        if (this.screenReaderSubscription) {
            this.screenReaderSubscription.remove();
        }
        if (this.boldTextSubscription) {
            this.boldTextSubscription.remove();
        }
        if (this.reduceMotionSubscription) {
            this.reduceMotionSubscription.remove();
        }
        if (this.reduceTransparencySubscription) {
            this.reduceTransparencySubscription.remove();
        }
        if (this.invertColorsSubscription) {
            this.invertColorsSubscription.remove();
        }
    }
}

// Example usage:
/*
// Initialize accessibility service
const accessibility = AccessibilityService.getInstance();

// Check accessibility settings
if (accessibility.isScreenReaderOn()) {
  // Announce important messages
  accessibility.announce('Welcome to BioSync');
}

// Get accessibility props for components
const buttonProps = accessibility.getButtonProps('Save changes', 'Tap to save your changes');
const inputProps = accessibility.getInputProps('Email address', 'Enter your email address');

// Adjust animations based on user preference
const animationSettings = accessibility.getAnimationSettings();

// Generate accessibility report
const report = accessibility.generateAccessibilityReport();
console.log('Accessibility report:', report);

// Cleanup when done
accessibility.cleanup();
*/