import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '@nextself/shared';
import { Platform } from 'react-native';
import { generateSecurityCSRFToken, sanitizeSecurityInput, validateSecurityCSRFToken } from './securityShared';

// Lazy-load QuickCrypto to avoid requiring native JSI modules on web where they break
let QuickCrypto: any = null;
const getQuickCrypto = () => {
  if (QuickCrypto) return QuickCrypto;
  try {
    if (Platform.OS !== 'web') {
       
      QuickCrypto = require('react-native-quick-crypto');
    }
  } catch (e) {
    QuickCrypto = null;
  }
  return QuickCrypto;
};

import { Buffer } from 'buffer';

// Helper for Web Crypto API
const getWebCryptoKey = async (keyStr: string) => {
  const enc = new TextEncoder();
  // Ensure key is 32 bytes for AES-256
  const keyBytes = enc.encode(keyStr.padEnd(32, '0').slice(0, 32));
  return await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

export class SecurityUtils {
  private static readonly STORE_KEY_NAME = 'nextself_secure_encryption_key';
  private static readonly WEB_KEY_SESSION_STORAGE_NAME = 'nextself_web_enc_key';
  private static webMemoryKey: string | null = null;

  public static isVolatile = false;

  /**
   * Retrieves or generates a secure encryption key using device secure storage.
   */
  private static async getOrCreateEncryptionKey(): Promise<string> {
    if (Platform.OS === 'web') {
      if (!this.webMemoryKey) {
        // Try to recover from sessionStorage first (survives page refreshes within same tab)
        try {
          const storedKey = (globalThis as any).sessionStorage?.getItem(this.WEB_KEY_SESSION_STORAGE_NAME);
          if (storedKey && storedKey.length === 64) {
            this.webMemoryKey = storedKey;
          }
        } catch { /* sessionStorage unavailable */ }

        // Generate new key if none was recovered
        if (!this.webMemoryKey) {
          const bytes = new Uint8Array(32);
          window.crypto.getRandomValues(bytes);
          this.webMemoryKey = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

          // Persist to sessionStorage so it survives page refreshes
          try {
            (globalThis as any).sessionStorage?.setItem(this.WEB_KEY_SESSION_STORAGE_NAME, this.webMemoryKey);
          } catch { /* sessionStorage unavailable */ }
        }
      }
      return this.webMemoryKey;
    }

    try {
      let key: string | null = await SecureStore.getItemAsync(this.STORE_KEY_NAME);
      if (!key) {
        // Generate a 256-bit cryptographically secure random key
        const qc = getQuickCrypto();
        if (!qc) {
          throw new Error('Cryptographic module unavailable. Cannot generate secure encryption key. Ensure react-native-quick-crypto is installed on native platforms.');
        }
        const generatedKey = qc.randomBytes(32).toString('hex');
        key = generatedKey;
        await SecureStore.setItemAsync(this.STORE_KEY_NAME, generatedKey);
      }
      if (!key) {
        throw new Error('Failed to initialize encryption key');
      }
      this.isVolatile = false;
      return key;
    } catch {
      if (CONFIG.IS_DEV && CONFIG.ENCRYPTION_KEY) {
        return CONFIG.ENCRYPTION_KEY;
      }

      this.isVolatile = true;
      // If SecureStore fails (e.g., no screen lock on Android), we must not generate a random key every time,
      // otherwise all offline data gets permanently orphaned. Throwing an error forces the app to handle it or we use a session memory key.
      if (!this.webMemoryKey) {
        console.warn('SecureStore unavailable! Falling back to volatile memory key. Offline data will not persist across restarts unless plaintext fallback is used.');
        const qc = getQuickCrypto();
        if (!qc) {
          throw new Error('Cannot create even a volatile key without crypto module. This device cannot securely store offline data.');
        }
        this.webMemoryKey = qc.randomBytes(32).toString('hex');
      }
      if (!this.webMemoryKey) {
        throw new Error('Failed to initialize fallback encryption key');
      }
      return this.webMemoryKey;
    }
  }

  // Encrypt sensitive data securely using device-backed key
  static async encryptAsync(data: string): Promise<string> {
    try {
      const keyStr = await this.getOrCreateEncryptionKey();

      if (this.isVolatile && Platform.OS !== 'web') {
         // Return plaintext with a prefix if key is volatile so data isn't lost on restart
         const fingerprint = this.generateDeviceFingerprint();
         const qc = getQuickCrypto();
         let hmac = '';
         if (qc) {
             hmac = qc.createHmac('sha256', fingerprint).update(data).digest('hex');
         } else {
             hmac = this.hashData(data + fingerprint);
         }
         return 'plaintext:' + hmac + ':' + data;
      }

      if (Platform.OS === 'web') {
        const webKey = await getWebCryptoKey(keyStr);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          webKey,
          enc.encode(data)
        );
        const encryptedArray = Array.from(new Uint8Array(encrypted));
        const ivArray = Array.from(iv);
        return 'webcrypto:' + btoa(JSON.stringify({ iv: ivArray, data: encryptedArray }));
      }

      // AES-256-GCM using QuickCrypto for native performance
      const qc = getQuickCrypto();
      if (!qc) throw new Error('QuickCrypto unavailable on this platform');
      const key = qc.createHash('sha256').update(keyStr).digest();
      const iv = qc.randomBytes(12);

      const cipher = qc.createCipheriv('aes-256-gcm', key, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      // Return IV + AuthTag + Encrypted Data
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed');
      throw new Error('Failed to encrypt data', { cause: error });
    }
  }

  // Decrypt sensitive data securely using device-backed key
  static async decryptAsync(encryptedData: string): Promise<string> {
    try {
      if (encryptedData.startsWith('plaintext:')) {
        const payload = encryptedData.slice('plaintext:'.length);
        const firstColon = payload.indexOf(':');
        
        if (firstColon !== -1) {
            const hmac = payload.substring(0, firstColon);
            const data = payload.substring(firstColon + 1);
            
            const fingerprint = this.generateDeviceFingerprint();
            const qc = getQuickCrypto();
            let expectedHmac = '';
            if (qc) {
                expectedHmac = qc.createHmac('sha256', fingerprint).update(data).digest('hex');
            } else {
                expectedHmac = this.hashData(data + fingerprint);
            }
            
            if (hmac === expectedHmac) {
                return data;
            } else {
                console.warn('Integrity check failed for plaintext data');
                // Return empty or throw error, returning empty protects from tampering
                return '';
            }
        }
        
        // Legacy fallback
        return payload;
      }

      const keyStr = await this.getOrCreateEncryptionKey();

      if (Platform.OS === 'web') {
        if (encryptedData.startsWith('webcrypto:')) {
          const webKey = await getWebCryptoKey(keyStr);
          const parsed = JSON.parse(atob(encryptedData.replace('webcrypto:', '')));
          const iv = new Uint8Array(parsed.iv);
          const data = new Uint8Array(parsed.data);
          const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            webKey,
            data
          );
          const dec = new TextDecoder();
          return dec.decode(decrypted);
        }
        // Fallback or old data not supported since crypto-js is removed
        return '';
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        // Fallback for older data natively not supported anymore without crypto-js
        return '';
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const qc = getQuickCrypto();
      if (!qc) throw new Error('QuickCrypto unavailable on this platform');
      const key = qc.createHash('sha256').update(keyStr).digest();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = qc.createDecipheriv('aes-256-gcm', key, iv as any);
      decipher.setAuthTag(authTag as any);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.warn('Decryption failed (data might be corrupted or key changed). Returning empty.');
      return '';
    }
  }

  // Synchronous fallback only if explicitly providing a key (for tests or specific use-cases)
  // Note: On web, this method is not supported since Web Crypto API is async-only.
  // Use encryptAsync() instead for cross-platform compatibility.
  static encryptWithKey(data: string, keyStr: string): string {
    if (!keyStr) throw new Error('Encryption key is required');
    if (Platform.OS === 'web') {
      throw new Error('encryptWithKey is not supported on web. Use encryptAsync() instead.');
    }

    const qc = getQuickCrypto();
    if (!qc) throw new Error('QuickCrypto unavailable on this platform');
    const key = qc.createHash('sha256').update(keyStr).digest();
    const iv = qc.randomBytes(12);

    const cipher = qc.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static decryptWithKey(encryptedData: string, keyStr: string): string {
    if (!keyStr) throw new Error('Decryption key is required');
    if (Platform.OS === 'web') {
      throw new Error('decryptWithKey is not supported on web. Use decryptAsync() instead.');
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      // Legacy data cannot be decrypted without CryptoJS — return empty string
      return '';
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const qc = getQuickCrypto();
    if (!qc) throw new Error('QuickCrypto unavailable on this platform');
    const key = qc.createHash('sha256').update(keyStr).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = qc.createDecipheriv('aes-256-gcm', key, iv as any);
    decipher.setAuthTag(authTag as any);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * SECURITY: SHA256 is NOT suitable for password hashing.
   * Supabase Auth handles password hashing with bcrypt server-side.
   * This method should only be used for non-security hashing (e.g., checksums).
   */
  static hashData(data: string): string {
    try {
      if (Platform.OS === 'web') {
        throw new Error('Synchronous hashData is not supported on web. Use hashDataAsync instead.');
      }
      const qc = getQuickCrypto();
      if (!qc) throw new Error('QuickCrypto unavailable on this platform');
      return qc.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      console.error('Hashing failed');
      throw new Error('Failed to hash data', { cause: error });
    }
  }

  // Async SHA-256 hash that works on both web and native
  static async hashDataAsync(data: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        const enc = new TextEncoder();
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(data));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
      const qc = getQuickCrypto();
      if (!qc) throw new Error('QuickCrypto unavailable on this platform');
      return qc.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      console.error('Async hashing failed');
      throw new Error('Failed to hash data', { cause: error });
    }
  }

  // Generate secure token using platform crypto (cryptographically secure)
  static generateSecureToken(length: number = 32): string {
    if (Platform.OS === 'web') {
      const bytes = new Uint8Array(length);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte: number) => byte.toString(16).padStart(2, '0')).join('').substring(0, length);
    }
    const qc = getQuickCrypto();
    if (!qc) throw new Error('QuickCrypto unavailable on this platform');
    return qc.randomBytes(length).toString('hex').substring(0, length);
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
    return sanitizeSecurityInput(input, maxLength);
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
    return generateSecurityCSRFToken();
  }

  // CSRF comparison key — MUST be set in env vars in production
  // Falls back to empty string which will cause validation to fail safely
  private static readonly CSRF_COMPARE_KEY = process.env.EXPO_PUBLIC_CSRF_KEY || '';

  // Validate CSRF token using constant-time comparison to prevent timing attacks
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return validateSecurityCSRFToken(
      token,
      sessionToken,
      this.CSRF_COMPARE_KEY,
      CONFIG.IS_PRODUCTION
    );
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
    const deviceInfo = {
      platform: require('react-native').Platform?.OS || 'react-native',
      version: require('react-native').Platform?.Version || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale || 'unknown',
      screenWidth: require('react-native').Dimensions?.get('window')?.width || 0,
      screenHeight: require('react-native').Dimensions?.get('window')?.height || 0,
    };
    const fingerprint = Object.values(deviceInfo).join('|');

    if (Platform.OS === 'web') {
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16).padStart(8, '0');
    }

    const qc = getQuickCrypto();
    if (!qc) {
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16).padStart(8, '0');
    }

    return qc.createHash('sha256').update(fingerprint).digest('hex');
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
      const keyStr = await this.getOrCreateEncryptionKey();

      if (Platform.OS === 'web') {
        const webKey = await getWebCryptoKey(keyStr);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          webKey,
          data
        );
        const encryptedArray = Array.from(new Uint8Array(encrypted));
        const ivArray = Array.from(iv);
        return 'webcrypto:' + btoa(JSON.stringify({ iv: ivArray, data: encryptedArray }));
      }

      const qc = getQuickCrypto();
      if (!qc) throw new Error('QuickCrypto unavailable on this platform');
      const key = qc.createHash('sha256').update(keyStr).digest();
      const iv = qc.randomBytes(12);
      const cipher = qc.createCipheriv('aes-256-gcm', key, iv);
      const inputBuffer = Buffer.from(data);
      const encryptedBuf = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
      const encrypted = encryptedBuf.toString('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      console.error('File encryption failed');
      throw new Error('Failed to encrypt file data', { cause: error });
    }
  }

  // Decrypt file data securely using device-backed key
  static async decryptFileDataAsync(encryptedData: string): Promise<ArrayBuffer> {
    try {
      const keyStr = await this.getOrCreateEncryptionKey();

      if (Platform.OS === 'web') {
        if (encryptedData.startsWith('webcrypto:')) {
          const webKey = await getWebCryptoKey(keyStr);
          const parsed = JSON.parse(atob(encryptedData.replace('webcrypto:', '')));
          const iv = new Uint8Array(parsed.iv);
          const data = new Uint8Array(parsed.data);
          const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            webKey,
            data
          );
          return decrypted;
        }
        // Legacy data not supported on web
        return new ArrayBuffer(0);
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        return new ArrayBuffer(0);
      }
      const [ivHex, authTagHex, encryptedHex] = parts;
      const qc = getQuickCrypto();
      if (!qc) throw new Error('QuickCrypto unavailable on this platform');
      const key = qc.createHash('sha256').update(keyStr).digest();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = qc.createDecipheriv('aes-256-gcm', key, iv as any);
      decipher.setAuthTag(authTag as any);
      const decryptedBuffer = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final(),
      ]);
      return decryptedBuffer.buffer.slice(
        decryptedBuffer.byteOffset,
        decryptedBuffer.byteOffset + decryptedBuffer.byteLength
      );
    } catch (error) {
      console.warn('File decryption failed. Returning empty Buffer.');
      return new ArrayBuffer(0);
    }
  }

  // Generate secure random number
  static secureRandom(min: number, max: number): number {
    const range = max - min + 1;
    let unsignedValue: number;
    if (Platform.OS === 'web') {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      unsignedValue = arr[0];
    } else {
      const qc = getQuickCrypto();
      if (!qc) throw new Error('QuickCrypto unavailable on this platform');
      const randomBytes = qc.randomBytes(4);
      // Read 4 bytes as unsigned 32-bit big-endian integer
      unsignedValue = ((randomBytes[0] << 24) | (randomBytes[1] << 16) | (randomBytes[2] << 8) | randomBytes[3]) >>> 0;
    }
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
