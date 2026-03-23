import { CONFIG } from '@nextself/shared';
import { Request, Response, NextFunction } from '@nextself/shared';

/**
 * Security middleware for enforcing HTTPS and adding security headers
 * This should be used in web dashboard and API routes
 */
export class SecurityMiddleware {
    /**
     * Enforce HTTPS in production
     */
    static enforceHTTPS(req: Request, res: Response, next: NextFunction) {
        if (CONFIG.IS_PRODUCTION && CONFIG.REQUIRE_HTTPS) {
            // Check if request is already secure
            const xForwardedProto = req.headers?.['x-forwarded-proto'];
            const xForwardedSsl = req.headers?.['x-forwarded-ssl'];
            const isProtoSecure = typeof xForwardedProto === 'string'
                ? xForwardedProto.split(',')[0].trim() === 'https'
                : false;
            const isSslSecure = typeof xForwardedSsl === 'string'
                ? xForwardedSsl === 'on'
                : false;
            const isSecure = req.secure || isProtoSecure || isSslSecure;

            if (!isSecure) {
                const host = req.headers?.host ? String(req.headers.host) : 'localhost';
                const secureUrl = `https://${host}${req.url ?? ''}`;
                return res.redirect(301, secureUrl);
            }
        }
        next();
    }

    /**
     * Add security headers to responses
     */
    static addSecurityHeaders(req: Request, res: Response, next: NextFunction) {
        // Environment-based CSP configuration
        let cspPolicy: string;
        if (CONFIG.IS_DEV) {
            // Development: more permissive for local development
            cspPolicy =
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://localhost:*; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https: http://localhost:*; " +
                "font-src 'self' data:; " +
                "connect-src 'self' http://localhost:* https://localhost:* https://*.supabase.co https://*.googleapis.com;";
        } else {
            // Production: strict policy
            cspPolicy =
                "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "connect-src 'self' https://*.supabase.co https://*.googleapis.com https://api.nextself.com;";
        }

        // Content Security Policy
        res.setHeader('Content-Security-Policy', cspPolicy);

        // Other security headers
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        // HSTS header (only in production)
        if (CONFIG.IS_PRODUCTION) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        next();
    }

    /**
     * Rate limiting middleware
     */
    static createRateLimiter(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
        const requests = new Map<string, { count: number; resetTime: number }>();

        // Periodic cleanup to prevent memory leaks
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [ip, record] of requests.entries()) {
                if (now > record.resetTime) {
                    requests.delete(ip);
                }
            }
        }, windowMs);

        // Prevent the interval from keeping the process alive
        if (cleanupInterval.unref) cleanupInterval.unref();

        return (req: Request, res: Response, next: NextFunction) => {
            const ip = req.ip || req.connection?.remoteAddress || 'unknown';
            const now = Date.now();

            if (!requests.has(ip)) {
                requests.set(ip, { count: 1, resetTime: now + windowMs });
            } else {
                const record = requests.get(ip)!;

                if (now > record.resetTime) {
                    // Reset window
                    record.count = 1;
                    record.resetTime = now + windowMs;
                } else if (record.count >= maxRequests) {
                    // Rate limit exceeded
                    return res.status(429).json({
                        error: 'Too many requests',
                        message: 'Please try again later',
                        retryAfter: Math.ceil((record.resetTime - now) / 1000)
                    });
                } else {
                    record.count++;
                }
            }

            // Add rate limit headers (use numeric values so tests can assert numbers)
            const record = requests.get(ip)!;
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
            res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

            next();
        };
    }

    /**
     * Input validation and sanitization
     * Removes control characters to prevent basic injection vectors.
     * React's built-in escaping handles XSS at the presentation layer.
     */
    static sanitizeInput(input: string, maxLength: number = 10000): string {
        if (!input || typeof input !== 'string') return '';
        
        // Truncate to prevent memory exhaustion / ReDoS
        const truncated = input.length > maxLength ? input.slice(0, maxLength) : input;
        
        // Remove null bytes and non-printable control characters (excluding newlines/tabs)
        // eslint-disable-next-line no-control-regex
        return truncated.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    }

    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    static isStrongPassword(password: string): { valid: boolean; message: string } {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }

        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one uppercase letter' };
        }

        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one lowercase letter' };
        }

        if (!/\d/.test(password)) {
            return { valid: false, message: 'Password must contain at least one number' };
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one special character' };
        }

        return { valid: true, message: 'Password is strong' };
    }

    /**
     * Generate CSRF token (platform-safe)
     */
    static generateCSRFToken(): string {
        try {
            const CryptoJS = require('crypto-js');
            return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
        } catch {
            // Fallback using expo-crypto for secure random bytes
            try {
                const ExpoCrypto = require('expo-crypto');
                return ExpoCrypto.getRandomBytes(32)
                    .reduce((hex: string, byte: number) => hex + byte.toString(16).padStart(2, '0'), '');
            } catch {
                // Last fallback: Date + high-resolution timer based token
                const timestamp = Date.now().toString(36);
                const random = Array.from({ length: 48 }, () =>
                    Math.floor(Math.random() * 16).toString(16)
                ).join('');
                return timestamp + random;
            }
        }
    }

    /**
     * Validate CSRF token (constant-time comparison)
     */
    static validateCSRFToken(token: string, sessionToken: string): boolean {
        if (!token || !sessionToken || token.length !== sessionToken.length) return false;
        try {
            const CryptoJS = require('crypto-js');
            const salt = process.env.EXPO_PUBLIC_CSRF_KEY || 'csrf-salt-dev-only';
            const hmac1 = CryptoJS.HmacSHA256(token, salt).toString();
            const hmac2 = CryptoJS.HmacSHA256(sessionToken, salt).toString();
            return hmac1 === hmac2;
        } catch {
            // Constant-time comparison fallback to prevent timing attacks
            if (token.length !== sessionToken.length) return false;
            let result = 0;
            for (let i = 0; i < token.length; i++) {
                result |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i);
            }
            return result === 0;
        }
    }

    /**
     * Log security events
     */
    static logSecurityEvent(event: string, details: unknown) {
        const timestamp = new Date().toISOString();
        console.log('[SECURITY]', `${timestamp} - ${event}`, details);

        // In production, this should be sent to a security monitoring service
        if (CONFIG.IS_PRODUCTION) {
            // Send to security monitoring service
            // Example: Sentry.captureMessage(`Security Event: ${event}`, { level: 'warning', extra: details });
        }
    }
}
