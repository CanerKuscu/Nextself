import { CONFIG } from '@nextself/shared';
import { Request, Response, NextFunction } from '@nextself/shared';
import { generateSecurityCSRFToken, sanitizeSecurityInput, validateSecurityCSRFToken } from './securityShared';

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
        return sanitizeSecurityInput(input, maxLength);
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
        return generateSecurityCSRFToken();
    }

    /**
     * Validate CSRF token (constant-time comparison)
     */
    static validateCSRFToken(token: string, sessionToken: string): boolean {
        return validateSecurityCSRFToken(
            token,
            sessionToken,
            process.env.EXPO_PUBLIC_CSRF_KEY || '',
            CONFIG.IS_PRODUCTION
        );
    }

    /**
     * Log security events
     */
    static logSecurityEvent(event: string, details: unknown) {
        const timestamp = new Date().toISOString();
        let safeDetails: unknown;
        try {
            const lowered = JSON.stringify(details, (_key, value) => {
                if (typeof value !== 'string') return value;
                const v = value.trim();
                if (!v) return v;
                if (v.length > 256) return `${v.slice(0, 256)}...`;
                return v;
            });
            safeDetails = lowered ? JSON.parse(lowered) : details;
        } catch {
            safeDetails = '[unserializable]';
        }
        console.log('[SECURITY]', `${timestamp} - ${event}`, safeDetails);

        // In production, this should be sent to a security monitoring service
        if (CONFIG.IS_PRODUCTION) {
            // Send to security monitoring service
            // Example: Sentry.captureMessage(`Security Event: ${event}`, { level: 'warning', extra: details });
        }
    }
}
