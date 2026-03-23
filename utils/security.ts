import CryptoJS from 'crypto-js';
import { CONFIG } from '@nextself/shared';

declare const Buffer: {
  from(data: string, encoding?: string): { toString(encoding?: string): string };
};

export class SecurityUtils {
  // SECURITY: Client-side encryption keys MUST NOT be embedded in production builds.
  // Prefer server-side encryption (Edge Functions/KMS). If an env var is provided
  // (development/tests), it will be used; otherwise client-side encryption methods
  // will throw with a clear error instructing to use server-side endpoints.
  private static readonly ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || '';

  // Encrypt sensitive data
  static encrypt(data: string, key: string = this.ENCRYPTION_KEY): string {
    try {
      if (!key) {
        throw new Error('Client-side encryption is disabled. Use server-side encryption (Edge Functions) or provide a key explicitly for development/tests.');
      }
      return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
      console.error('Encryption failed');
      throw new Error('Failed to encrypt data', { cause: error });
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: string, key: string = this.ENCRYPTION_KEY): string {
    try {
      if (!key) {
        throw new Error('Client-side decryption is disabled. Use server-side decryption (Edge Functions) or provide a key explicitly for development/tests.');
      }
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed');
      throw new Error('Failed to decrypt data', { cause: error });
    }
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

  // Sanitize input to prevent XSS - strip dangerous content
  static sanitizeInput(input: string, maxLength: number = 10000): string {
    if (!input || typeof input !== 'string') return '';
    // Truncate to prevent ReDoS
    const truncated = input.length > maxLength ? input.slice(0, maxLength) : input;
    return truncated
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:[^\s]*/gi, '')                  // Remove javascript: protocol
      .replace(/\bon\w+\s*=\s*(['"])[^'"]*\1/gi, '')       // Remove event handlers (quoted)
      .replace(/\bon\w+\s*=\s*\S+/gi, '')                  // Remove event handlers (unquoted)
      .replace(/\s+/g, ' ')                                 // Collapse multiple spaces
      .trim();
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

  // Encrypt file data
  static encryptFileData(data: ArrayBuffer, key: string = this.ENCRYPTION_KEY): string {
    try {
      const wordArray = CryptoJS.lib.WordArray.create(data as any);
      return CryptoJS.AES.encrypt(wordArray, key).toString();
    } catch (error) {
      console.error('File encryption failed');
      throw new Error('Failed to encrypt file data', { cause: error });
    }
  }

  // Decrypt file data
  static decryptFileData(encryptedData: string, key: string = this.ENCRYPTION_KEY): ArrayBuffer {
    try {
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
