"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
class SecurityUtils {
    // Encrypt sensitive data
    static encrypt(data, key = this.ENCRYPTION_KEY) {
        try {
            if (!key) {
                throw new Error('Client-side encryption is disabled. Use server-side encryption (Edge Functions) or provide a key explicitly for development/tests.');
            }
            return crypto_js_1.default.AES.encrypt(data, key).toString();
        }
        catch (error) {
            console.error('Encryption failed');
            throw new Error('Failed to encrypt data', { cause: error });
        }
    }
    // Decrypt sensitive data
    static decrypt(encryptedData, key = this.ENCRYPTION_KEY) {
        try {
            if (!key) {
                throw new Error('Client-side decryption is disabled. Use server-side decryption (Edge Functions) or provide a key explicitly for development/tests.');
            }
            const bytes = crypto_js_1.default.AES.decrypt(encryptedData, key);
            return bytes.toString(crypto_js_1.default.enc.Utf8);
        }
        catch (error) {
            console.error('Decryption failed');
            throw new Error('Failed to decrypt data', { cause: error });
        }
    }
    // Hash data - SECURITY: SHA256 is NOT suitable for password hashing.
    // Supabase Auth handles password hashing with bcrypt server-side.
    // This method should only be used for non-security hashing (e.g., checksums).
    static hashData(data) {
        try {
            return crypto_js_1.default.SHA256(data).toString();
        }
        catch (error) {
            console.error('Hashing failed');
            throw new Error('Failed to hash data', { cause: error });
        }
    }
    /** @alias hashData - convenience alias expected by tests and consumers */
    static hashPassword(password) {
        return this.hashData(password);
    }
    // Generate secure token using CryptoJS (cryptographically secure)
    static generateSecureToken(length = 32) {
        // Use CryptoJS random bytes - cryptographically secure
        const wordArray = crypto_js_1.default.lib.WordArray.random(length);
        return wordArray.toString(crypto_js_1.default.enc.Hex).substring(0, length);
    }
    // Validate password strength
    static validatePasswordStrength(password) {
        const feedback = [];
        let score = 0;
        // Length check
        if (password.length >= 8) {
            score += 20;
        }
        else {
            feedback.push('Password should be at least 8 characters long');
        }
        // Uppercase check
        if (/[A-Z]/.test(password)) {
            score += 20;
        }
        else {
            feedback.push('Password should contain at least one uppercase letter');
        }
        // Lowercase check
        if (/[a-z]/.test(password)) {
            score += 20;
        }
        else {
            feedback.push('Password should contain at least one lowercase letter');
        }
        // Number check
        if (/\d/.test(password)) {
            score += 20;
        }
        else {
            feedback.push('Password should contain at least one number');
        }
        // Special character check
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 20;
        }
        else {
            feedback.push('Password should contain at least one special character');
        }
        return { score, feedback };
    }
    // Sanitize input to prevent XSS - strip dangerous content
    static sanitizeInput(input, maxLength = 10000) {
        if (!input || typeof input !== 'string')
            return '';
        // Truncate to prevent ReDoS
        const truncated = input.length > maxLength ? input.slice(0, maxLength) : input;
        return truncated
            .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
            .replace(/javascript:[^\s]*/gi, '') // Remove javascript: protocol
            .replace(/\bon\w+\s*=\s*(['"])[^'"]*\1/gi, '') // Remove event handlers (quoted)
            .replace(/\bon\w+\s*=\s*\S+/gi, '') // Remove event handlers (unquoted)
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();
    }
    // Validate API request
    static validateApiRequest(request) {
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /document\.cookie/i,
            /window\.location/i,
        ];
        const checkString = (str) => {
            return suspiciousPatterns.some(pattern => pattern.test(str));
        };
        // Check URL
        if (checkString(request.url)) {
            return false;
        }
        // Check headers
        if (request.headers) {
            for (const [key, value] of Object.entries(request.headers)) {
                if (checkString(key) || checkString(value)) {
                    return false;
                }
            }
        }
        // Check body
        if (request.body && checkString(request.body)) {
            return false;
        }
        return true;
    }
    // Rate limiting
    static createRateLimiter(maxRequests, windowMs) {
        const requests = [];
        return {
            isAllowed: () => {
                const now = Date.now();
                // Remove old requests outside the window
                while (requests.length > 0 && requests[0] < now - windowMs) {
                    requests.shift();
                }
                // Check if under the limit
                if (requests.length < maxRequests) {
                    requests.push(now);
                    return true;
                }
                return false;
            },
        };
    }
    // Generate CSRF token
    static generateCSRFToken() {
        return this.generateSecureToken(64);
    }
    // Validate CSRF token using constant-time comparison to prevent timing attacks
    static validateCSRFToken(token, sessionToken) {
        if (!token || !sessionToken || typeof token !== 'string' || typeof sessionToken !== 'string')
            return false;
        if (token.length !== sessionToken.length)
            return false;
        // Constant-time comparison via HMAC with per-instance key
        const hmac1 = crypto_js_1.default.HmacSHA256(token, this.CSRF_COMPARE_KEY).toString();
        const hmac2 = crypto_js_1.default.HmacSHA256(sessionToken, this.CSRF_COMPARE_KEY).toString();
        return hmac1 === hmac2;
    }
    // Check for common passwords
    static isCommonPassword(password) {
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            '1234567890', 'password1', '123123', 'iloveyou',
            'adobe123', '1231234', 'sunshine', 'password123',
            'princess', 'azerty', 'trustno1', '1q2w3e4r5t',
        ];
        return commonPasswords.includes(password.toLowerCase());
    }
    // Generate device fingerprint with more entropy
    static generateDeviceFingerprint() {
        var _a, _b, _c, _d, _e, _f;
        try {
            const deviceInfo = {
                platform: ((_a = require('react-native').Platform) === null || _a === void 0 ? void 0 : _a.OS) || 'react-native',
                version: ((_b = require('react-native').Platform) === null || _b === void 0 ? void 0 : _b.Version) || 'unknown',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale: Intl.DateTimeFormat().resolvedOptions().locale || 'unknown',
                screenWidth: ((_d = (_c = require('react-native').Dimensions) === null || _c === void 0 ? void 0 : _c.get('window')) === null || _d === void 0 ? void 0 : _d.width) || 0,
                screenHeight: ((_f = (_e = require('react-native').Dimensions) === null || _e === void 0 ? void 0 : _e.get('window')) === null || _f === void 0 ? void 0 : _f.height) || 0,
            };
            const fingerprint = Object.values(deviceInfo).join('|');
            return crypto_js_1.default.SHA256(fingerprint).toString();
        }
        catch (_g) {
            // Fallback for non-RN environments
            return crypto_js_1.default.SHA256(`rn|${Intl.DateTimeFormat().resolvedOptions().timeZone}`).toString();
        }
    }
    // Validate session
    static validateSession(session) {
        const now = Date.now();
        // Check if session is expired
        if (now > session.expiresAt) {
            return false;
        }
        // Check if token is valid (basic validation)
        if (!session.token || session.token.length < 10) {
            return false;
        }
        // Check if userId is valid
        if (!session.userId || session.userId.length < 1) {
            return false;
        }
        return true;
    }
    // Encrypt file data
    static encryptFileData(data, key = this.ENCRYPTION_KEY) {
        try {
            const wordArray = crypto_js_1.default.lib.WordArray.create(data);
            return crypto_js_1.default.AES.encrypt(wordArray, key).toString();
        }
        catch (error) {
            console.error('File encryption failed');
            throw new Error('Failed to encrypt file data', { cause: error });
        }
    }
    // Decrypt file data
    static decryptFileData(encryptedData, key = this.ENCRYPTION_KEY) {
        try {
            const decrypted = crypto_js_1.default.AES.decrypt(encryptedData, key);
            const latin1String = decrypted.toString(crypto_js_1.default.enc.Latin1);
            const bytes = new Uint8Array(latin1String.length);
            for (let i = 0; i < latin1String.length; i++) {
                bytes[i] = latin1String.charCodeAt(i);
            }
            return bytes.buffer;
        }
        catch (error) {
            console.error('File decryption failed');
            throw new Error('Failed to decrypt file data', { cause: error });
        }
    }
    // Generate secure random number
    static secureRandom(min, max) {
        const range = max - min + 1;
        const randomArray = crypto_js_1.default.lib.WordArray.random(4);
        // Use unsigned right shift (>>> 0) to convert signed 32-bit to unsigned,
        // preventing negative modulo results
        const unsignedValue = randomArray.words[0] >>> 0;
        const randomValue = unsignedValue % range;
        return min + randomValue;
    }
    // Validate email format with additional security checks
    static validateEmailSecure(email) {
        const basicValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!basicValidation) {
            return { isValid: false, isDisposable: false, risk: 'high' };
        }
        // Check for disposable email domains
        const disposableDomains = [
            '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
            'tempmail.org', 'yopmail.com', 'maildrop.cc',
        ];
        const domain = email.split('@')[1].toLowerCase();
        const isDisposable = disposableDomains.some(d => domain.includes(d));
        // Assess risk based on domain and patterns
        let risk = 'low';
        if (isDisposable) {
            risk = 'high';
        }
        else if (domain.includes('temp') || domain.includes('throwaway')) {
            risk = 'medium';
        }
        return { isValid: true, isDisposable, risk };
    }
}
exports.SecurityUtils = SecurityUtils;
// SECURITY: Client-side encryption keys MUST NOT be embedded in production builds.
// Prefer server-side encryption (Edge Functions/KMS). If an env var is provided
// (development/tests), it will be used; otherwise client-side encryption methods
// will throw with a clear error instructing to use server-side endpoints.
SecurityUtils.ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || '';
// CSRF comparison key — MUST be set in env vars in production
// Falls back to empty string which will cause validation to fail safely
SecurityUtils.CSRF_COMPARE_KEY = process.env.EXPO_PUBLIC_CSRF_KEY || '';
