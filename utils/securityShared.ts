export const sanitizeSecurityInput = (input: string, maxLength: number = 10000): string => {
    if (!input || typeof input !== 'string') return '';
    const truncated = input.length > maxLength ? input.slice(0, maxLength) : input;
    let sanitized = '';
    for (let i = 0; i < truncated.length; i++) {
        const code = truncated.charCodeAt(i);
        const isAllowedControl = code === 9 || code === 10 || code === 13;
        const isBlockedControl = (code >= 0 && code <= 31 && !isAllowedControl) || code === 127;
        if (!isBlockedControl) {
            sanitized += truncated[i];
        }
    }
    return sanitized.trim();
};

const constantTimeCompare = (a: string, b: string): boolean => {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
};

export const generateSecurityCSRFToken = (): string => {
    const cryptoObj = (globalThis as any).crypto;
    if (cryptoObj?.getRandomValues) {
        const bytes = new Uint8Array(32);
        cryptoObj.getRandomValues(bytes);
        return Array.from(bytes, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
    }

    const ExpoCrypto = require('expo-crypto');
    return ExpoCrypto.getRandomBytes(32)
        .reduce((hex: string, byte: number) => hex + byte.toString(16).padStart(2, '0'), '');
};

export const validateSecurityCSRFToken = (
    token: string,
    sessionToken: string,
    compareKey: string,
    isProduction: boolean
): boolean => {
    if (!token || !sessionToken || typeof token !== 'string' || typeof sessionToken !== 'string') return false;
    if (token.length !== sessionToken.length) return false;
    if (isProduction && !compareKey) return false;

    if (compareKey) {
        try {
            const QuickCrypto = require('react-native-quick-crypto');
            const hmac1 = QuickCrypto.createHmac('sha256', compareKey).update(token).digest('hex');
            const hmac2 = QuickCrypto.createHmac('sha256', compareKey).update(sessionToken).digest('hex');
            return constantTimeCompare(hmac1, hmac2);
        } catch (error) {
            void error;
        }
    }

    return constantTimeCompare(token, sessionToken);
};
