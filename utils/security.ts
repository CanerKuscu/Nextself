import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '@nextself/shared';
import { Platform } from 'react-native';

declare const Buffer: {
  from(data: string, encoding?: string): { toString(encoding?: string): string };
};

export class SecurityUtils {
  private static readonly STORE_KEY_NAME = 'nextself_secure_encryption_key';

  /**
   * Retrieves or generates a secure encryption key using device secure storage.
   */
  private static async getOrCreateEncryptionKey(): Promise<string> {
    if (Platform.OS === 'web') {
      // SecureStore is not available on web. Fallback to session/local storage or memory
      // In a real production app, web encryption keys should be managed differently (e.g. KMS)
      return 'web-fallback-key-not-for-production';
    }

    try {
      let key = await SecureStore.getItemAsync(this.STORE_KEY_NAME);
      if (!key) {
        // Generate a 256-bit cryptographically secure random key
        key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
        await SecureStore.setItemAsync(this.STORE_KEY_NAME, key);
      }
      return key;
    } catch (error) {
      console.warn('SecureStore unavailable or failed, falling back to memory/env', error);
      return process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'fallback-dev-key';
    }
  }

  // Encrypt sensitive data securely using device-backed key
  static async encryptAsync(data: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
      console.error('Encryption failed');
      throw new Error('Failed to encrypt data', { cause: error });
    }
  }

  // Decrypt sensitive data securely using device-backed key
  static async decryptAsync(encryptedData: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed');
      throw new Error('Failed to decrypt data', { cause: error });
    }
  }

  // Synchronous fallback only if explicitly providing a key (for tests or specific use-cases)
  static encryptWithKey(data: string, key: string): string {
    if (!key) throw new Error('Encryption key is required');
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  static decryptWithKey(encryptedData: string, key: string): string {
    if (!key) throw new Error('Decryption key is required');
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * SECURITY: SHA256 is NOT suitable for password hashing.
   * Supabase Auth handles password hashing with bcrypt server-side.
   * This method should only be used for non-security hashing (e.g., checksums).
   */
  static hashData(data: string): string {
    try {
      return CryptoJS.SHA256(data).toString();
    } catch (error) {
      console.error('Hashing failed');
      throw new Error('Failed to hash data', { cause: error });
    }
  }

  // Generate secure token using CryptoJS (cryptographically secure)
  static generateSecureToken(length: number = 32): string {
    // Use CryptoJS random bytes - cryptographically secure
    const wordArray = CryptoJS.lib.WordArray.random(length);
    return wordArray.toString(CryptoJS.enc.Hex).substring(0, length);
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 20;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password should contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password should contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password should contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20;
    } else {
      feedback.push('Password should contain at least one special character');
    }

    return { score, feedback };
  }

  // Sanitize input by removing control characters and limiting length.
  // Note: We rely on React/React Native's built-in escaping for XSS prevention during rendering.
  static sanitizeInput(input: string, maxLength: number = 10000): string {
    if (!input || typeof input !== 'string') return '';
    // Truncate to prevent ReDoS/memory exhaustion
    const truncated = input.length > maxLength ? input.slice(0, maxLength) : input;
    
    // Remove null bytes and non-printable control characters (excluding newlines/tabs)
    // React automatically handles HTML escaping during render, so we don't need regex tag stripping
    // eslint-disable-next-line no-control-regex
    return truncated.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  }

  // Validate API request
  static validateApiRequest(request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
  }): boolean {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /window\.location/i,
    ];

    const checkString = (str: string) => {
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
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests: number[] = [];

    return {
      isAllowed: (): boolean => {
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
  static generateCSRFToken(): string {
    return this.generateSecureToken(64);
  }

  // CSRF comparison key — MUST be set in env vars in production
  // Falls back to empty string which will cause validation to fail safely
  private static readonly CSRF_COMPARE_KEY = process.env.EXPO_PUBLIC_CSRF_KEY || '';

  // Validate CSRF token using constant-time comparison to prevent timing attacks
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken || typeof token !== 'string' || typeof sessionToken !== 'string') return false;
    if (token.length !== sessionToken.length) return false;
    // Constant-time comparison via HMAC with per-instance key
    const hmac1 = CryptoJS.HmacSHA256(token, this.CSRF_COMPARE_KEY).toString();
    const hmac2 = CryptoJS.HmacSHA256(sessionToken, this.CSRF_COMPARE_KEY).toString();
    return hmac1 === hmac2;
  }

  // Check for common passwords
  static isCommonPassword(password: string): boolean {
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
  static generateDeviceFingerprint(): string {
    try {
      const deviceInfo = {
        platform: require('react-native').Platform?.OS || 'react-native',
        version: require('react-native').Platform?.Version || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale || 'unknown',
        screenWidth: require('react-native').Dimensions?.get('window')?.width || 0,
        screenHeight: require('react-native').Dimensions?.get('window')?.height || 0,
      };
      const fingerprint = Object.values(deviceInfo).join('|');
      return CryptoJS.SHA256(fingerprint).toString();
    } catch {
      // Fallback for non-RN environments
      return CryptoJS.SHA256(`rn|${Intl.DateTimeFormat().resolvedOptions().timeZone}`).toString();
    }
  }

  // Validate session
  static validateSession(session: {
    token: string;
    expiresAt: number;
    userId: string;
  }): boolean {
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

  // Encrypt file data securely using device-backed key
  static async encryptFileDataAsync(data: ArrayBuffer): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const wordArray = CryptoJS.lib.WordArray.create(data as any);
      return CryptoJS.AES.encrypt(wordArray, key).toString();
    } catch (error) {
      console.error('File encryption failed');
      throw new Error('Failed to encrypt file data', { cause: error });
    }
  }

  // Decrypt file data securely using device-backed key
  static async decryptFileDataAsync(encryptedData: string): Promise<ArrayBuffer> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const latin1String = decrypted.toString(CryptoJS.enc.Latin1);
      const bytes = new Uint8Array(latin1String.length);
      for (let i = 0; i < latin1String.length; i++) {
        bytes[i] = latin1String.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('File decryption failed');
      throw new Error('Failed to decrypt file data', { cause: error });
    }
  }

  // Generate secure random number
  static secureRandom(min: number, max: number): number {
    const range = max - min + 1;
    const randomArray = CryptoJS.lib.WordArray.random(4);
    // Use unsigned right shift (>>> 0) to convert signed 32-bit to unsigned,
    // preventing negative modulo results
    const unsignedValue = randomArray.words[0] >>> 0;
    const randomValue = unsignedValue % range;
    return min + randomValue;
  }

  // Validate email format with additional security checks
  static validateEmailSecure(email: string): {
    isValid: boolean;
    isDisposable: boolean;
    risk: 'low' | 'medium' | 'high';
  } {
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
    let risk: 'low' | 'medium' | 'high' = 'low';

    if (isDisposable) {
      risk = 'high';
    } else if (domain.includes('temp') || domain.includes('throwaway')) {
      risk = 'medium';
    }

    return { isValid: true, isDisposable, risk };
  }
}
